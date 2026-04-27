import SQLite, { type SQLiteDatabase } from "react-native-sqlite-storage";
import { DB_NAME } from "../constants/appConstants";

SQLite.enablePromise(true);

export type Database = SQLiteDatabase;

let dbPromise: Promise<Database> | null = null;

export const getDb = async (): Promise<Database> => {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabase({ name: DB_NAME, location: "default" });
  }
  return dbPromise;
};

export const closeDb = async (): Promise<void> => {
  if (dbPromise) {
    const db = await dbPromise;
    await db.close();
    dbPromise = null;
  }
};
