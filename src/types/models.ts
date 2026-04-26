export type RecipeCategory = "DESAYUNO" | "ALMUERZO" | "CENA" | "SNACK" | "POSTRE";

export type CostLevel = "LOW" | "MID" | "HIGH";

export type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK" | "SCHOOL_SNACK";

export type GroceryCategory =
  | "Verduras/Frutas"
  | "Carnes"
  | "Lacteos"
  | "Abarrotes"
  | "Especias"
  | "Otros";

export type Ingredient = {
  name: string;
  qty: number | string;
  unit: string;
  group?: GroceryCategory;
};

export type Recipe = {
  id: string;
  title: string;
  description: string;
  category: RecipeCategory;
  prepMinutes: number;
  costLevel: CostLevel;
  servingsBase: number;
  dietTags: string[];
  ingredients: Ingredient[];
  steps: string[];
  isCustom?: boolean;
};

export type CustomRecipeInput = {
  title: string;
  description?: string;
  category?: RecipeCategory;
  prepMinutes?: number;
  costLevel?: CostLevel;
  servingsBase?: number;
  dietTags?: string[];
  ingredients?: Ingredient[];
  steps?: string[];
};

export type MealPlanEntry = {
  id: number;
  date: string;
  mealType: MealType;
  recipeId: string | null;
  customText: string | null;
  notes: string | null;
  forMember: string | null;
};

export type HouseholdMember = {
  id: string;
  name: string;
  color: string;
  emoji?: string | null;
  createdAt: string;
};

export type RecipeFilters = {
  category?: RecipeCategory;
  time?: "LE_15" | "LE_30" | "LE_60" | "GT_60";
  costLevel?: CostLevel;
  dietTags: string[];
  onlyFavorites: boolean;
};

export type GroceryItem = {
  itemKey: string;
  normalizedName: string;
  displayName: string;
  qtyText: string;
  unit: string;
  category: GroceryCategory;
  numericQty: number | null;
};

export type ManualGroceryItem = {
  id: number;
  weekStartDate: string;
  name: string;
  qty: string;
  unit: string;
  category: string | null;
};

export type GroceryDisplayItem = {
  itemKey: string;
  displayName: string;
  qtyText: string;
  unit: string;
  category: string;
  source: "generated" | "manual";
  manualId?: number;
};

export type PremiumState = {
  isPremium: boolean;
  hasLifetime: boolean;
  hasSubscription: boolean;
  updatedAt: string;
};
