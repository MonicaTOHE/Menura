import { Recipe } from "../types/models";
import enTranslations from "../../assets/recipes_translations_en.json";

type RecipeTranslation = {
  title: string;
  description: string;
  ingredients: string[];
  steps: string[];
};

const EN_TRANSLATION_MAP = enTranslations as Record<string, RecipeTranslation>;

const EN_FIXES: Array<[RegExp, string]> = [
  [/\bcon\b/gi, "with"],
  [/\by\b/gi, "and"],
  [/\bde\b/gi, "of"],
  [/\bal\b/gi, "with"],
  [/\ba la\b/gi, "with"],
  [/\bmanzana\b/gi, "apple"],
  [/\bplatano\b/gi, "banana"],
  [/\bfrutos rojos\b/gi, "berries"],
  [/\bfrutilla\b/gi, "strawberry"],
  [/\barroz\b/gi, "rice"],
  [/\batun\b/gi, "tuna"],
  [/\bverduras\b/gi, "vegetables"],
  [/\bhuevo\b/gi, "egg"],
  [/\bhuevos\b/gi, "eggs"],
  [/\bqueso\b/gi, "cheese"],
  [/\bjamon\b/gi, "ham"],
  [/\bpapa\b/gi, "potato"],
  [/\bpapas\b/gi, "potatoes"],
  [/\bzanahoria\b/gi, "carrot"],
  [/\bcebolla\b/gi, "onion"],
  [/\bpollo\b/gi, "chicken"],
  [/\bcarne\b/gi, "meat"],
  [/\bsalmon\b/gi, "salmon"],
  [/\bsopa\b/gi, "soup"],
  [/\bensalada\b/gi, "salad"],
  [/\bbarras\b/gi, "bars"],
  [/\brevuelto\b/gi, "scramble"],
  [/\btortilla\b/gi, "tortilla"],
  [/\bcasero\b/gi, "homemade"],
  [/\brapido\b/gi, "quick"],
  [/\bfacil\b/gi, "easy"],
  [/\bclasico\b/gi, "classic"],
  [/\bcremoso\b/gi, "creamy"],
  [/\bhorno\b/gi, "oven"],
  [/\bhorneado\b/gi, "baked"],
  [/\bsin gluten\b/gi, "gluten-free"],
  [/\bsin lactosa\b/gi, "lactose-free"],
  [/\bvegetariano\b/gi, "vegetarian"],
  [/\bvegana\b/gi, "vegan"],
  [/\bvegano\b/gi, "vegan"],
];

const cleanupEnglishText = (text: string): string => {
  let next = text;
  EN_FIXES.forEach(([pattern, replacement]) => {
    next = next.replace(pattern, replacement);
  });
  return next
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
};

export const toEnglishText = (text: string): string => cleanupEnglishText(text);

export const localizeRecipeForLanguage = (recipe: Recipe, lang: string): Recipe => {
  if (!lang.startsWith("en")) return recipe;
  if (recipe.isCustom) return recipe;

  const translation = EN_TRANSLATION_MAP[recipe.id];
  if (!translation) return recipe;

  return {
    ...recipe,
    title: toEnglishText(translation.title || recipe.title),
    description: toEnglishText(translation.description || recipe.description),
    ingredients: recipe.ingredients.map((ingredient, index) => ({
      ...ingredient,
      name: toEnglishText(translation.ingredients[index] || ingredient.name),
    })),
    steps: recipe.steps.map((step, index) => toEnglishText(translation.steps[index] || step)),
  };
};
