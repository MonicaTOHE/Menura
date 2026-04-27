import { create } from "zustand";
import { DEFAULT_HOUSEHOLD_MEMBER_ID, FREE_GROCERY_LIMIT } from "../constants/appConstants";
import {
  addManualGroceryItem,
  createCustomRecipe,
  deleteCustomRecipe,
  deleteHouseholdMember,
  deleteMealPlanEntry,
  deleteManualGroceryItem,
  getAllRecipes,
  getFavoriteIds,
  getGroceryChecks,
  getHiddenGeneratedKeysForWeek,
  getHouseholdMembers,
  getManualGroceryItemsForWeek,
  getMealPlanEntriesInRange,
  getRecipeById,
  hideGeneratedGroceryItem,
  setGroceryCheck,
  toggleFavorite,
  unhideGeneratedGroceryItem,
  updateCustomRecipe,
  updateManualGroceryItem,
  upsertHouseholdMember,
  upsertMealPlanEntry,
} from "../db/repositories";
import { bootstrapAppData } from "../services/bootstrap";
import {
  getIapCatalog,
  IapCatalog,
  purchasePremiumLifetime,
  purchasePremiumMonthly,
  restoreIapPurchases,
} from "../services/iapService";
import { getAppThemeId, setAppThemeId } from "../services/localStorage";
import { getInitialPremiumState, refreshPremiumState } from "../services/premiumManager";
import {
  CustomRecipeInput,
  GroceryDisplayItem,
  GroceryItem,
  HouseholdMember,
  ManualGroceryItem,
  MealPlanEntry,
  MealType,
  PremiumState,
  Recipe,
} from "../types/models";
import { addDays, getTodayWeekStart, getWeekDays, startOfWeekMonday, toISODate } from "../utils/date";
import { consolidateIngredients, inferCategory } from "../utils/grocery";
import { normalizeUnit } from "../utils/normalize";

type AppStore = {
  initialized: boolean;
  loading: boolean;
  error: string | null;
  deviceId: string | null;
  recipes: Recipe[];
  favoriteIds: Set<string>;
  weekStartDate: string;
  weekEntries: MealPlanEntry[];
  groceryChecks: Record<string, boolean>;
  manualGroceryItems: ManualGroceryItem[];
  hiddenGeneratedKeys: Set<string>;
  premium: PremiumState;
  iapCatalog: IapCatalog | null;
  appThemeId: string;
  householdMembers: HouseholdMember[];
  initialize: () => Promise<void>;
  reloadRecipes: () => Promise<void>;
  reloadWeekData: () => Promise<void>;
  reloadHouseholdMembers: () => Promise<void>;
  setWeekStartDate: (weekStartDate: string) => Promise<void>;
  moveWeek: (deltaWeeks: number) => Promise<void>;
  toggleFavoriteRecipe: (recipeId: string) => Promise<void>;
  assignRecipeToSlot: (date: string, mealType: MealType, recipeId: string, forMember?: string | null) => Promise<void>;
  assignTextToSlot: (date: string, mealType: MealType, customText: string, forMember?: string | null) => Promise<void>;
  clearSlot: (date: string, mealType: MealType, forMember?: string | null) => Promise<void>;
  saveHouseholdMember: (member: HouseholdMember) => Promise<void>;
  removeHouseholdMember: (id: string) => Promise<void>;
  setGroceryItemChecked: (weekStartDate: string, itemKey: string, checked: boolean) => Promise<void>;
  addManualItem: (item: Omit<ManualGroceryItem, "id">) => Promise<void>;
  updateManualItem: (item: ManualGroceryItem) => Promise<void>;
  deleteManualItem: (id: number) => Promise<void>;
  hideGeneratedItem: (weekStartDate: string, itemKey: string) => Promise<void>;
  unhideGeneratedItem: (weekStartDate: string, itemKey: string) => Promise<void>;
  getGroceryDisplayListForRange: (startDate: string, endDate: string, includeGenerated: boolean) => Promise<GroceryDisplayItem[]>;
  getConsolidatedGroceryForRange: (startDate: string, endDate: string) => Promise<GroceryItem[]>;
  getPlannedDatesInRange: (startDate: string, endDate: string) => Promise<Set<string>>;
  getShoppingPlannedDatesInRange: (startDate: string, endDate: string) => Promise<Set<string>>;
  getConsolidatedGroceryForCurrentWeek: () => Promise<GroceryItem[]>;
  refreshPremium: () => Promise<void>;
  restorePurchases: () => Promise<void>;
  buyMonthly: () => Promise<void>;
  buyLifetime: () => Promise<void>;
  setAppTheme: (themeId: string) => Promise<void>;
  createQuickRecipe: (input: CustomRecipeInput) => Promise<string>;
  updateQuickRecipe: (input: CustomRecipeInput & { id: string }) => Promise<void>;
  deleteQuickRecipe: (id: string) => Promise<void>;
  canSeeFullGroceryList: (itemCount: number) => boolean;
};

const rangeEndFromWeekStart = (weekStartDate: string) => toISODate(addDays(new Date(`${weekStartDate}T00:00:00`), 6));

export const useAppStore = create<AppStore>((set, get) => ({
  initialized: false,
  loading: false,
  error: null,
  deviceId: null,
  recipes: [],
  favoriteIds: new Set<string>(),
  weekStartDate: getTodayWeekStart(),
  weekEntries: [],
  groceryChecks: {},
  manualGroceryItems: [],
  hiddenGeneratedKeys: new Set<string>(),
  premium: {
    isPremium: false,
    hasLifetime: false,
    hasSubscription: false,
    updatedAt: new Date(0).toISOString(),
  },
  iapCatalog: null,
  appThemeId: "oceano",
  householdMembers: [],

  initialize: async () => {
    set({ loading: true, error: null });
    try {
      // IAP and premium state are now resolved lazily (when the user opens the
      // paywall) so that an Android device without a valid Play Store debug
      // context cannot crash the app at startup.
      const [{ deviceId }, premium, appThemeId] = await Promise.all([
        bootstrapAppData(),
        getInitialPremiumState().catch(() => ({
          isPremium: false,
          hasLifetime: false,
          hasSubscription: false,
          updatedAt: new Date(0).toISOString(),
        })),
        getAppThemeId(),
      ]);
      set({ deviceId, premium, iapCatalog: null, appThemeId });
      await Promise.all([
        get().reloadRecipes(),
        get().reloadWeekData(),
        get().reloadHouseholdMembers(),
      ]);
      set({ initialized: true });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "No se pudo iniciar la app." });
    } finally {
      set({ loading: false });
    }
  },

  reloadRecipes: async () => {
    const [recipes, favoriteIds] = await Promise.all([getAllRecipes(), getFavoriteIds()]);
    set({ recipes, favoriteIds: new Set(favoriteIds) });
  },

  reloadWeekData: async () => {
    const weekStartDate = get().weekStartDate;
    const endDate = rangeEndFromWeekStart(weekStartDate);
    const [weekEntries, groceryChecks, manualGroceryItems, hiddenGeneratedKeys] = await Promise.all([
      getMealPlanEntriesInRange(weekStartDate, endDate),
      getGroceryChecks(weekStartDate),
      getManualGroceryItemsForWeek(weekStartDate),
      getHiddenGeneratedKeysForWeek(weekStartDate),
    ]);
    set({ weekEntries, groceryChecks, manualGroceryItems, hiddenGeneratedKeys });
  },

  setWeekStartDate: async (weekStartDate: string) => {
    set({ weekStartDate });
    await get().reloadWeekData();
  },

  moveWeek: async (deltaWeeks: number) => {
    const current = new Date(`${get().weekStartDate}T00:00:00`);
    current.setDate(current.getDate() + deltaWeeks * 7);
    await get().setWeekStartDate(toISODate(current));
  },

  toggleFavoriteRecipe: async (recipeId: string) => {
    await toggleFavorite(recipeId);
    await get().reloadRecipes();
  },

  reloadHouseholdMembers: async () => {
    const householdMembers = await getHouseholdMembers();
    set({ householdMembers });
  },

  saveHouseholdMember: async (member: HouseholdMember) => {
    await upsertHouseholdMember(member);
    await get().reloadHouseholdMembers();
  },

  removeHouseholdMember: async (id: string) => {
    if (id === DEFAULT_HOUSEHOLD_MEMBER_ID) return;
    await deleteHouseholdMember(id);
    await Promise.all([get().reloadHouseholdMembers(), get().reloadWeekData()]);
  },

  assignRecipeToSlot: async (date: string, mealType: MealType, recipeId: string, forMember?: string | null) => {
    await upsertMealPlanEntry({ date, mealType, recipeId, customText: null, forMember });
    await get().reloadWeekData();
  },

  assignTextToSlot: async (date: string, mealType: MealType, customText: string, forMember?: string | null) => {
    await upsertMealPlanEntry({ date, mealType, recipeId: null, customText, forMember });
    await get().reloadWeekData();
  },

  clearSlot: async (date: string, mealType: MealType, forMember?: string | null) => {
    await deleteMealPlanEntry(date, mealType, forMember);
    await get().reloadWeekData();
  },

  setGroceryItemChecked: async (weekStartDate: string, itemKey: string, checked: boolean) => {
    await setGroceryCheck(weekStartDate, itemKey, checked);
    const current = { ...get().groceryChecks, [itemKey]: checked };
    set({ groceryChecks: current });
  },

  addManualItem: async (item) => {
    await addManualGroceryItem(item);
    await get().reloadWeekData();
  },

  updateManualItem: async (item) => {
    await updateManualGroceryItem(item);
    await get().reloadWeekData();
  },

  deleteManualItem: async (id) => {
    await deleteManualGroceryItem(id);
    await get().reloadWeekData();
  },

  hideGeneratedItem: async (weekStartDate: string, itemKey: string) => {
    await hideGeneratedGroceryItem(weekStartDate, itemKey);
    await get().reloadWeekData();
  },

  unhideGeneratedItem: async (weekStartDate: string, itemKey: string) => {
    await unhideGeneratedGroceryItem(weekStartDate, itemKey);
    await get().reloadWeekData();
  },

  getGroceryDisplayListForRange: async (startDate, endDate, includeGenerated) => {
    const weekStartDate = get().weekStartDate;
    const manualItems = get().manualGroceryItems.map<GroceryDisplayItem>((item) => ({
      itemKey: `manual:${item.id}`,
      displayName: item.name,
      qtyText: `${item.qty} ${item.unit}`.trim(),
      unit: normalizeUnit(item.unit),
      category: item.category?.trim() || inferCategory(item.name),
      source: "manual",
      manualId: item.id,
    }));

    if (!includeGenerated) {
      return manualItems;
    }

    const generated = await get().getConsolidatedGroceryForRange(startDate, endDate);
    const hidden = get().hiddenGeneratedKeys;
    let generatedItems: GroceryDisplayItem[] = generated
      .filter((item) => !hidden.has(item.itemKey))
      .map((item) => ({
        itemKey: `gen:${item.itemKey}`,
        displayName: item.displayName,
        qtyText: item.qtyText,
        unit: item.unit,
        category: item.category,
        source: "generated",
      }));

    if (!get().premium.isPremium && generatedItems.length > FREE_GROCERY_LIMIT) {
      generatedItems = generatedItems.slice(0, FREE_GROCERY_LIMIT);
    }

    const byCategory = new Map<string, GroceryDisplayItem[]>();
    [...generatedItems, ...manualItems].forEach((item) => {
      const key = item.category;
      const list = byCategory.get(key) ?? [];
      list.push(item);
      byCategory.set(key, list);
    });

    return Array.from(byCategory.values()).flat();
  },

  getConsolidatedGroceryForRange: async (startDate: string, endDate: string) => {
    const entries = await getMealPlanEntriesInRange(startDate, endDate);
    const recipeIds = entries.map((entry) => entry.recipeId).filter((id): id is string => Boolean(id));
    const recipes = (
      await Promise.all(
        recipeIds.map(async (recipeId) => {
          return getRecipeById(recipeId);
        }),
      )
    ).filter((recipe): recipe is Recipe => recipe !== null);
    return consolidateIngredients(recipes);
  },

  getPlannedDatesInRange: async (startDate: string, endDate: string) => {
    const entries = await getMealPlanEntriesInRange(startDate, endDate);
    return new Set(entries.map((entry) => entry.date));
  },

  getShoppingPlannedDatesInRange: async (startDate: string, endDate: string) => {
    const planned = new Set<string>();
    const firstWeekStart = startOfWeekMonday(new Date(`${startDate}T00:00:00`));
    const lastWeekStart = startOfWeekMonday(new Date(`${endDate}T00:00:00`));
    const cursor = new Date(firstWeekStart);

    while (cursor <= lastWeekStart) {
      const weekStart = toISODate(cursor);
      const weekEnd = toISODate(addDays(new Date(`${weekStart}T00:00:00`), 6));
      const [manualItems, generatedItems] = await Promise.all([
        getManualGroceryItemsForWeek(weekStart),
        get().getConsolidatedGroceryForRange(weekStart, weekEnd),
      ]);

      if (manualItems.length > 0 || generatedItems.length > 0) {
        for (let i = 0; i < 7; i += 1) {
          planned.add(toISODate(addDays(new Date(`${weekStart}T00:00:00`), i)));
        }
      }

      cursor.setDate(cursor.getDate() + 7);
    }

    return planned;
  },

  getConsolidatedGroceryForCurrentWeek: async () => {
    const start = get().weekStartDate;
    const end = rangeEndFromWeekStart(start);
    return get().getConsolidatedGroceryForRange(start, end);
  },

  refreshPremium: async () => {
    const premium = await refreshPremiumState();
    set({ premium });
  },

  restorePurchases: async () => {
    await restoreIapPurchases();
    await get().refreshPremium();
  },

  buyMonthly: async () => {
    await purchasePremiumMonthly();
    await get().refreshPremium();
  },

  buyLifetime: async () => {
    await purchasePremiumLifetime();
    await get().refreshPremium();
  },

  setAppTheme: async (themeId: string) => {
    set({ appThemeId: themeId });
    await setAppThemeId(themeId);
  },

  createQuickRecipe: async (input) => {
    const id = await createCustomRecipe(input);
    await get().reloadRecipes();
    return id;
  },

  updateQuickRecipe: async (input) => {
    await updateCustomRecipe(input);
    await Promise.all([get().reloadRecipes(), get().reloadWeekData()]);
  },

  deleteQuickRecipe: async (id) => {
    await deleteCustomRecipe(id);
    await Promise.all([get().reloadRecipes(), get().reloadWeekData()]);
  },

  canSeeFullGroceryList: (itemCount: number) => {
    if (get().premium.isPremium) return true;
    return itemCount <= FREE_GROCERY_LIMIT;
  },
}));

export const useWeekDays = () => {
  const weekStartDate = useAppStore((state) => state.weekStartDate);
  return getWeekDays(weekStartDate);
};
