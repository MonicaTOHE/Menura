import { getDb, type Database } from "./client";
import { DEFAULT_HOUSEHOLD_MEMBER_ID } from "../constants/appConstants";
import { CustomRecipeInput, HouseholdMember, ManualGroceryItem, MealPlanEntry, MealType, Recipe } from "../types/models";

type RecipeRow = {
  id: string;
  title: string;
  description: string;
  category: Recipe["category"];
  prepMinutes: number;
  costLevel: Recipe["costLevel"];
  servingsBase: number;
  dietTagsJson: string;
  ingredientsJson: string;
  stepsJson: string;
  isCustom?: number;
};

const safeParseJson = <T>(raw: string | null | undefined, fallback: T): T => {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed == null ? fallback : (parsed as T);
  } catch {
    return fallback;
  }
};

const mapRecipeRow = (row: RecipeRow): Recipe => ({
  id: row.id,
  title: row.title,
  description: row.description,
  category: row.category,
  prepMinutes: row.prepMinutes,
  costLevel: row.costLevel,
  servingsBase: row.servingsBase,
  dietTags: safeParseJson(row.dietTagsJson, [] as Recipe["dietTags"]),
  ingredients: safeParseJson(row.ingredientsJson, [] as Recipe["ingredients"]),
  steps: safeParseJson(row.stepsJson, [] as Recipe["steps"]),
  isCustom: row.isCustom === 1,
});

const queryAll = async <T>(db: Database, sql: string, params?: unknown[]): Promise<T[]> => {
  const result = await db.execute(sql, (params as unknown as never) ?? []);
  return (result.rows ?? []) as T[];
};

const queryFirst = async <T>(db: Database, sql: string, params?: unknown[]): Promise<T | null> => {
  const rows = await queryAll<T>(db, sql, params);
  return rows.length > 0 ? rows[0] : null;
};

const exec = async (db: Database, sql: string, params?: unknown[]): Promise<void> => {
  await db.execute(sql, (params as unknown as never) ?? []);
};

const runInTransaction = async (db: Database, work: () => Promise<void>): Promise<void> => {
  await db.execute("BEGIN TRANSACTION");
  try {
    await work();
    await db.execute("COMMIT");
  } catch (err) {
    await db.execute("ROLLBACK");
    throw err;
  }
};

export const insertRecipes = async (recipes: Recipe[]): Promise<void> => {
  const db = await getDb();
  await runInTransaction(db, async () => {
    for (const recipe of recipes) {
      await exec(
        db,
        `INSERT OR REPLACE INTO recipes
        (id, title, description, category, prepMinutes, costLevel, servingsBase, dietTagsJson, ingredientsJson, stepsJson, isCustom)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          recipe.id,
          recipe.title,
          recipe.description,
          recipe.category,
          recipe.prepMinutes,
          recipe.costLevel,
          recipe.servingsBase,
          JSON.stringify(recipe.dietTags),
          JSON.stringify(recipe.ingredients),
          JSON.stringify(recipe.steps),
          recipe.isCustom ? 1 : 0,
        ],
      );
    }
  });
};

export const replaceSeedRecipes = async (recipes: Recipe[]): Promise<void> => {
  const db = await getDb();
  await runInTransaction(db, async () => {
    await exec(db, "DELETE FROM favorites WHERE recipeId IN (SELECT id FROM recipes WHERE isCustom = 0)");
    await exec(db, "DELETE FROM meal_plan_entries WHERE recipeId IN (SELECT id FROM recipes WHERE isCustom = 0)");
    await exec(db, "DELETE FROM recipes WHERE isCustom = 0");
  });
  await insertRecipes(recipes.map((recipe) => ({ ...recipe, isCustom: false })));
};

export const createCustomRecipe = async (input: CustomRecipeInput): Promise<string> => {
  const db = await getDb();
  const id = `custom_${Date.now()}`;
  const ingredients = (input.ingredients ?? []).filter((item) => item.name.trim().length > 0);
  const steps = (input.steps ?? []).map((step) => step.trim()).filter((step) => step.length > 0);
  const dietTags = (input.dietTags ?? []).map((tag) => tag.trim()).filter((tag) => tag.length > 0);
  await exec(
    db,
    `INSERT INTO recipes
    (id, title, description, category, prepMinutes, costLevel, servingsBase, dietTagsJson, ingredientsJson, stepsJson, isCustom)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [
      id,
      input.title.trim(),
      input.description?.trim() || "Receta propia",
      input.category ?? "ALMUERZO",
      input.prepMinutes ?? 15,
      input.costLevel ?? "LOW",
      input.servingsBase ?? 1,
      JSON.stringify(dietTags),
      JSON.stringify(ingredients),
      JSON.stringify(steps),
    ],
  );
  return id;
};

export const updateCustomRecipe = async (input: CustomRecipeInput & { id: string }): Promise<void> => {
  const db = await getDb();
  const ingredients = (input.ingredients ?? []).filter((item) => item.name.trim().length > 0);
  const steps = (input.steps ?? []).map((step) => step.trim()).filter((step) => step.length > 0);
  const dietTags = (input.dietTags ?? []).map((tag) => tag.trim()).filter((tag) => tag.length > 0);
  await exec(
    db,
    `UPDATE recipes
     SET title = ?, description = ?, category = ?, prepMinutes = ?, costLevel = ?, servingsBase = ?, dietTagsJson = ?, ingredientsJson = ?, stepsJson = ?
     WHERE id = ? AND isCustom = 1`,
    [
      input.title.trim(),
      input.description?.trim() || "Receta propia",
      input.category ?? "ALMUERZO",
      input.prepMinutes ?? 15,
      input.costLevel ?? "LOW",
      input.servingsBase ?? 1,
      JSON.stringify(dietTags),
      JSON.stringify(ingredients),
      JSON.stringify(steps),
      input.id,
    ],
  );
};

export const deleteCustomRecipe = async (id: string): Promise<void> => {
  const db = await getDb();
  await runInTransaction(db, async () => {
    await exec(db, "DELETE FROM recipes WHERE id = ? AND isCustom = 1", [id]);
    await exec(db, "DELETE FROM favorites WHERE recipeId = ?", [id]);
    await exec(db, "DELETE FROM meal_plan_entries WHERE recipeId = ?", [id]);
  });
};

export const getAllRecipes = async (): Promise<Recipe[]> => {
  const db = await getDb();
  const rows = await queryAll<RecipeRow>(db, "SELECT * FROM recipes ORDER BY title ASC");
  return rows.map(mapRecipeRow);
};

export const getRecipeById = async (id: string): Promise<Recipe | null> => {
  const db = await getDb();
  const row = await queryFirst<RecipeRow>(db, "SELECT * FROM recipes WHERE id = ? LIMIT 1", [id]);
  return row ? mapRecipeRow(row) : null;
};

export const getFavoriteIds = async (): Promise<string[]> => {
  const db = await getDb();
  const rows = await queryAll<{ recipeId: string }>(db, "SELECT recipeId FROM favorites");
  return rows.map((r) => r.recipeId);
};

export const toggleFavorite = async (recipeId: string): Promise<void> => {
  const db = await getDb();
  const existing = await queryFirst<{ recipeId: string }>(
    db,
    "SELECT recipeId FROM favorites WHERE recipeId = ?",
    [recipeId],
  );
  if (existing) {
    await exec(db, "DELETE FROM favorites WHERE recipeId = ?", [recipeId]);
  } else {
    await exec(db, "INSERT INTO favorites (recipeId, createdAt) VALUES (?, ?)", [recipeId, new Date().toISOString()]);
  }
};

export const upsertMealPlanEntry = async ({
  date,
  mealType,
  recipeId,
  customText,
  notes,
  forMember,
}: {
  date: string;
  mealType: MealType;
  recipeId: string | null;
  customText: string | null;
  notes?: string | null;
  forMember?: string | null;
}): Promise<void> => {
  const db = await getDb();
  const member = forMember && forMember.length > 0 ? forMember : DEFAULT_HOUSEHOLD_MEMBER_ID;
  await exec(
    db,
    `INSERT INTO meal_plan_entries (date, mealType, forMember, recipeId, customText, notes)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(date, mealType, forMember)
     DO UPDATE SET recipeId = excluded.recipeId, customText = excluded.customText, notes = excluded.notes`,
    [date, mealType, member, recipeId, customText, notes ?? null],
  );
};

export const deleteMealPlanEntry = async (
  date: string,
  mealType: MealType,
  forMember?: string | null,
): Promise<void> => {
  const db = await getDb();
  const member = forMember && forMember.length > 0 ? forMember : DEFAULT_HOUSEHOLD_MEMBER_ID;
  await exec(
    db,
    "DELETE FROM meal_plan_entries WHERE date = ? AND mealType = ? AND forMember = ?",
    [date, mealType, member],
  );
};

type MealPlanEntryRow = {
  id: number;
  date: string;
  mealType: MealType;
  forMember: string | null;
  recipeId: string | null;
  customText: string | null;
  notes: string | null;
};

const mapMealPlanEntry = (row: MealPlanEntryRow): MealPlanEntry => ({
  id: row.id,
  date: row.date,
  mealType: row.mealType,
  recipeId: row.recipeId,
  customText: row.customText,
  notes: row.notes,
  forMember: row.forMember && row.forMember.length > 0 ? row.forMember : DEFAULT_HOUSEHOLD_MEMBER_ID,
});

export const getMealPlanEntriesInRange = async (startDate: string, endDate: string): Promise<MealPlanEntry[]> => {
  const db = await getDb();
  const rows = await queryAll<MealPlanEntryRow>(
    db,
    "SELECT id, date, mealType, forMember, recipeId, customText, notes FROM meal_plan_entries WHERE date BETWEEN ? AND ? ORDER BY date ASC",
    [startDate, endDate],
  );
  return rows.map(mapMealPlanEntry);
};

// ----- Household members --------------------------------------------------

export const getHouseholdMembers = async (): Promise<HouseholdMember[]> => {
  const db = await getDb();
  return queryAll<HouseholdMember>(
    db,
    "SELECT id, name, color, emoji, createdAt FROM household_members ORDER BY createdAt ASC",
  );
};

export const upsertHouseholdMember = async (member: HouseholdMember): Promise<void> => {
  const db = await getDb();
  await exec(
    db,
    `INSERT INTO household_members (id, name, color, emoji, createdAt)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET name = excluded.name, color = excluded.color, emoji = excluded.emoji`,
    [member.id, member.name, member.color, member.emoji ?? null, member.createdAt],
  );
};

export const deleteHouseholdMember = async (id: string): Promise<void> => {
  const db = await getDb();
  await runInTransaction(db, async () => {
    await exec(db, "DELETE FROM meal_plan_entries WHERE forMember = ?", [id]);
    await exec(db, "DELETE FROM household_members WHERE id = ?", [id]);
  });
};

export const setGroceryCheck = async (weekStartDate: string, itemKey: string, checked: boolean): Promise<void> => {
  const db = await getDb();
  await exec(
    db,
    `INSERT INTO grocery_checks (weekStartDate, itemKey, checked)
     VALUES (?, ?, ?)
     ON CONFLICT(weekStartDate, itemKey)
     DO UPDATE SET checked = excluded.checked`,
    [weekStartDate, itemKey, checked ? 1 : 0],
  );
};

export const getGroceryChecks = async (weekStartDate: string): Promise<Record<string, boolean>> => {
  const db = await getDb();
  const rows = await queryAll<{ itemKey: string; checked: number }>(
    db,
    "SELECT itemKey, checked FROM grocery_checks WHERE weekStartDate = ?",
    [weekStartDate],
  );
  return rows.reduce<Record<string, boolean>>((acc, row) => {
    acc[row.itemKey] = row.checked === 1;
    return acc;
  }, {});
};

export const getManualGroceryItemsForWeek = async (weekStartDate: string): Promise<ManualGroceryItem[]> => {
  const db = await getDb();
  return queryAll<ManualGroceryItem>(
    db,
    "SELECT id, weekStartDate, name, qty, unit, category FROM grocery_manual_items WHERE weekStartDate = ? ORDER BY id DESC",
    [weekStartDate],
  );
};

export const addManualGroceryItem = async (item: Omit<ManualGroceryItem, "id">): Promise<void> => {
  const db = await getDb();
  const now = new Date().toISOString();
  await exec(
    db,
    `INSERT INTO grocery_manual_items (weekStartDate, name, qty, unit, category, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [item.weekStartDate, item.name, item.qty, item.unit, item.category, now, now],
  );
};

export const updateManualGroceryItem = async (item: ManualGroceryItem): Promise<void> => {
  const db = await getDb();
  await exec(
    db,
    `UPDATE grocery_manual_items
     SET name = ?, qty = ?, unit = ?, category = ?, updatedAt = ?
     WHERE id = ?`,
    [item.name, item.qty, item.unit, item.category, new Date().toISOString(), item.id],
  );
};

export const deleteManualGroceryItem = async (id: number): Promise<void> => {
  const db = await getDb();
  await exec(db, "DELETE FROM grocery_manual_items WHERE id = ?", [id]);
};

export const hideGeneratedGroceryItem = async (weekStartDate: string, itemKey: string): Promise<void> => {
  const db = await getDb();
  await exec(
    db,
    `INSERT INTO grocery_hidden_generated (weekStartDate, itemKey)
     VALUES (?, ?)
     ON CONFLICT(weekStartDate, itemKey) DO NOTHING`,
    [weekStartDate, itemKey],
  );
};

export const unhideGeneratedGroceryItem = async (weekStartDate: string, itemKey: string): Promise<void> => {
  const db = await getDb();
  await exec(db, "DELETE FROM grocery_hidden_generated WHERE weekStartDate = ? AND itemKey = ?", [weekStartDate, itemKey]);
};

export const getHiddenGeneratedKeysForWeek = async (weekStartDate: string): Promise<Set<string>> => {
  const db = await getDb();
  const rows = await queryAll<{ itemKey: string }>(
    db,
    "SELECT itemKey FROM grocery_hidden_generated WHERE weekStartDate = ?",
    [weekStartDate],
  );
  return new Set(rows.map((row) => row.itemKey));
};
