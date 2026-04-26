import { MealType, RecipeFilters } from "../types/models";

export const DB_NAME = "meal_planner.db";

export const MEAL_TYPES: { key: MealType; label: string }[] = [
  { key: "BREAKFAST", label: "Desayuno" },
  { key: "SCHOOL_SNACK", label: "Colacion" },
  { key: "LUNCH", label: "Almuerzo" },
  { key: "SNACK", label: "Snack" },
  { key: "DINNER", label: "Cena" },
];

export const DEFAULT_HOUSEHOLD_MEMBER_ID = "default";

export const HOUSEHOLD_MEMBER_PRESETS = [
  { name: "Yo", color: "#2563EB", emoji: "🙂" },
  { name: "Mi pareja", color: "#DB2777", emoji: "💞" },
  { name: "Mi peque", color: "#F59E0B", emoji: "🧒" },
  { name: "Mi bebe", color: "#10B981", emoji: "👶" },
  { name: "Familia", color: "#7C3AED", emoji: "👨‍👩‍👧" },
];

export const DEFAULT_RECIPE_FILTERS: RecipeFilters = {
  category: undefined,
  time: undefined,
  costLevel: undefined,
  dietTags: [],
  onlyFavorites: false,
};

export const FREE_GROCERY_LIMIT = 10;

export const IAP_PRODUCT_IDS = {
  subscriptionMonthly: "premium_monthly",
  lifetime: "premium_lifetime",
};

export const APP_BRAND = "Menura";

// Google Play requires a public HTTPS Privacy Policy URL.
// Host the markdown files in docs/legal/ on your domain (GitHub Pages, Vercel, Netlify) and
// replace the placeholders below with the final URLs before submitting to Play Console.
// While null, the app falls back to the embedded LegalDocumentScreen, which works in-app
// but is NOT sufficient for the Play Console listing field.
export const LEGAL_URLS = {
  privacyPolicy: null as string | null,
  terms: null as string | null,
  manageSubscriptions: "https://play.google.com/store/account/subscriptions",
};
