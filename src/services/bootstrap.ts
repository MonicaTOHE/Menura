import recipesSeed from "../../assets/recipes_seed.json";
import { runMigrations } from "../db/migrations";
import { replaceSeedRecipes } from "../db/repositories";
import { Recipe } from "../types/models";
import { getOrCreateDeviceId, getSeedImported, setSeedImported } from "./localStorage";

export const bootstrapAppData = async (): Promise<{ deviceId: string }> => {
  await runMigrations();
  const deviceId = await getOrCreateDeviceId();

  const imported = await getSeedImported();
  await replaceSeedRecipes(recipesSeed as Recipe[]);
  if (!imported) await setSeedImported();

  return { deviceId };
};
