import { open, type DB } from "@op-engineering/op-sqlite";
import { DB_NAME } from "../constants/appConstants";

export type Database = DB;

let dbInstance: Database | null = null;

export const getDb = async (): Promise<Database> => {
  if (!dbInstance) {
    dbInstance = open({ name: DB_NAME });
  }
  return dbInstance;
};

export const closeDb = async (): Promise<void> => {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
};
