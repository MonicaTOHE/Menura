export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: undefined;
  RecipeDetail: { recipeId: string };
  Paywall: undefined;
  LegalDocument: { kind: "privacy" | "terms" };
  HouseholdMembers: undefined;
};

export type MainTabParamList = {
  Week: undefined;
  Recipes: undefined;
  Favorites: undefined;
  Grocery: undefined;
  Settings: undefined;
};
