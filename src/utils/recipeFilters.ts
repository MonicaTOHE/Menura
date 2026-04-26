import { Recipe, RecipeFilters } from "../types/models";

const matchesTime = (prepMinutes: number, time?: RecipeFilters["time"]): boolean => {
  if (!time) return true;
  if (time === "LE_15") return prepMinutes <= 15;
  if (time === "LE_30") return prepMinutes <= 30;
  if (time === "LE_60") return prepMinutes <= 60;
  return prepMinutes > 60;
};

export const filterRecipes = ({
  recipes,
  query,
  filters,
  favoriteIds,
}: {
  recipes: Recipe[];
  query: string;
  filters: RecipeFilters;
  favoriteIds: Set<string>;
}): Recipe[] => {
  const normalizedQuery = query.trim().toLowerCase();

  return recipes.filter((recipe) => {
    if (normalizedQuery && !`${recipe.title} ${recipe.description}`.toLowerCase().includes(normalizedQuery)) {
      return false;
    }
    if (filters.category && recipe.category !== filters.category) return false;
    if (!matchesTime(recipe.prepMinutes, filters.time)) return false;
    if (filters.costLevel && recipe.costLevel !== filters.costLevel) return false;
    if (filters.onlyFavorites && !favoriteIds.has(recipe.id)) return false;
    if (filters.dietTags.length > 0 && !filters.dietTags.every((tag) => recipe.dietTags.includes(tag))) return false;
    return true;
  });
};
