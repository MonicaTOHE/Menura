import { GroceryCategory, GroceryItem, Ingredient, Recipe } from "../types/models";
import { normalizeIngredientKey, normalizeText, normalizeUnit, parseMaybeNumber } from "./normalize";

const CATEGORY_KEYWORDS: Record<GroceryCategory, string[]> = {
  "Verduras/Frutas": [
    "tomate",
    "cebolla",
    "lechuga",
    "zanahoria",
    "pimiento",
    "manzana",
    "platano",
    "banana",
    "zapallo",
    "palta",
    "limon",
  ],
  Carnes: ["pollo", "carne", "vacuno", "cerdo", "pavo", "atun", "salmon", "pescado", "jamon"],
  Lacteos: ["leche", "queso", "yogurt", "mantequilla", "crema"],
  Abarrotes: ["arroz", "fideo", "pasta", "poroto", "lenteja", "harina", "aceite", "avena", "quinoa", "pan"],
  Especias: ["sal", "pimienta", "comino", "oregano", "aji", "paprika", "canela", "curcuma"],
  Otros: [],
};

export const inferCategory = (ingredientName: string): GroceryCategory => {
  const normalized = normalizeText(ingredientName);
  const category = (Object.keys(CATEGORY_KEYWORDS) as GroceryCategory[]).find((cat) =>
    CATEGORY_KEYWORDS[cat].some((token) => normalized.includes(token)),
  );
  return category ?? "Otros";
};

const formatQty = (qty: number | null, fallback: string): string => {
  if (qty === null) return fallback;
  return Number.isInteger(qty) ? `${qty}` : qty.toFixed(2).replace(/\.?0+$/, "");
};

type GroceryAccumulator = {
  key: string;
  normalizedName: string;
  displayName: string;
  unit: string;
  category: GroceryCategory;
  qtyNumeric: number | null;
  qtyTexts: string[];
};

export const consolidateIngredients = (recipes: Recipe[]): GroceryItem[] => {
  const accum = new Map<string, GroceryAccumulator>();

  recipes.forEach((recipe) => {
    recipe.ingredients.forEach((ingredient: Ingredient) => {
      const normalizedUnit = normalizeUnit(ingredient.unit);
      const key = normalizeIngredientKey(ingredient.name, normalizedUnit);
      const qty = parseMaybeNumber(ingredient.qty);
      const existing = accum.get(key);

      if (!existing) {
        accum.set(key, {
          key,
          normalizedName: normalizeText(ingredient.name),
          displayName: ingredient.name.trim(),
          unit: normalizedUnit,
          category: ingredient.group ?? inferCategory(ingredient.name),
          qtyNumeric: qty,
          qtyTexts: qty === null ? [String(ingredient.qty)] : [],
        });
        return;
      }

      if (existing.qtyNumeric !== null && qty !== null) {
        existing.qtyNumeric += qty;
      } else if (qty !== null) {
        existing.qtyTexts.push(formatQty(qty, String(ingredient.qty)));
        existing.qtyNumeric = null;
      } else {
        existing.qtyTexts.push(String(ingredient.qty));
        existing.qtyNumeric = null;
      }
    });
  });

  return Array.from(accum.values())
    .map((item) => {
      const qtyText =
        item.qtyNumeric !== null ? `${formatQty(item.qtyNumeric, "")} ${item.unit}`.trim() : item.qtyTexts.join(" + ");
      return {
        itemKey: item.key,
        normalizedName: item.normalizedName,
        displayName: item.displayName,
        qtyText,
        unit: item.unit,
        category: item.category,
        numericQty: item.qtyNumeric,
      };
    })
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
};
