import { getDb } from "./client";

const SCHEMA_SQL = `
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS recipes (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  prepMinutes INTEGER NOT NULL,
  costLevel TEXT NOT NULL,
  servingsBase INTEGER NOT NULL,
  dietTagsJson TEXT NOT NULL,
  ingredientsJson TEXT NOT NULL,
  stepsJson TEXT NOT NULL,
  isCustom INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS favorites (
  recipeId TEXT PRIMARY KEY NOT NULL,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS meal_plan_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  mealType TEXT NOT NULL,
  forMember TEXT NOT NULL DEFAULT 'default',
  recipeId TEXT NULL,
  customText TEXT NULL,
  notes TEXT NULL,
  CHECK ((recipeId IS NOT NULL AND customText IS NULL) OR (recipeId IS NULL AND customText IS NOT NULL)),
  UNIQUE(date, mealType, forMember)
);

CREATE TABLE IF NOT EXISTS grocery_checks (
  weekStartDate TEXT NOT NULL,
  itemKey TEXT NOT NULL,
  checked INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (weekStartDate, itemKey)
);

CREATE TABLE IF NOT EXISTS grocery_manual_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  weekStartDate TEXT NOT NULL,
  name TEXT NOT NULL,
  qty TEXT NOT NULL,
  unit TEXT NOT NULL,
  category TEXT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS grocery_hidden_generated (
  weekStartDate TEXT NOT NULL,
  itemKey TEXT NOT NULL,
  PRIMARY KEY (weekStartDate, itemKey)
);

CREATE TABLE IF NOT EXISTS household_members (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  emoji TEXT NULL,
  createdAt TEXT NOT NULL
);
`;

const splitStatements = (sql: string): string[] =>
  sql
    .split(";")
    .map((stmt) => stmt.trim())
    .filter((stmt) => stmt.length > 0);

export const runMigrations = async (): Promise<void> => {
  const db = await getDb();

  for (const stmt of splitStatements(SCHEMA_SQL)) {
    await db.execute(stmt);
  }

  // Migration: ensure recipes.isCustom exists
  const recipeColumns = await db.execute("PRAGMA table_info(recipes)");
  const recipeColNames = (recipeColumns.rows ?? []).map((row: any) => String(row.name));
  if (!recipeColNames.includes("isCustom")) {
    await db.execute("ALTER TABLE recipes ADD COLUMN isCustom INTEGER NOT NULL DEFAULT 0");
  }

  // Migration: ensure meal_plan_entries.forMember exists; if it does not, recreate the
  // table with the new UNIQUE(date, mealType, forMember) constraint so multiple members
  // can have different meals in the same slot.
  const mealEntryColumns = await db.execute("PRAGMA table_info(meal_plan_entries)");
  const mealEntryColNames = (mealEntryColumns.rows ?? []).map((row: any) => String(row.name));
  if (!mealEntryColNames.includes("forMember")) {
    await db.execute("BEGIN TRANSACTION");
    try {
      await db.execute(`
        CREATE TABLE meal_plan_entries_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT NOT NULL,
          mealType TEXT NOT NULL,
          forMember TEXT NOT NULL DEFAULT 'default',
          recipeId TEXT NULL,
          customText TEXT NULL,
          notes TEXT NULL,
          CHECK ((recipeId IS NOT NULL AND customText IS NULL) OR (recipeId IS NULL AND customText IS NOT NULL)),
          UNIQUE(date, mealType, forMember)
        )
      `);
      await db.execute(
        "INSERT INTO meal_plan_entries_new (id, date, mealType, forMember, recipeId, customText, notes) SELECT id, date, mealType, 'default', recipeId, customText, notes FROM meal_plan_entries",
      );
      await db.execute("DROP TABLE meal_plan_entries");
      await db.execute("ALTER TABLE meal_plan_entries_new RENAME TO meal_plan_entries");
      await db.execute("COMMIT");
    } catch (err) {
      await db.execute("ROLLBACK");
      throw err;
    }
  }
};
