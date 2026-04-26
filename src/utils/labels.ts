import i18n from "../i18n";

export const formatDietTagLabel = (raw: string): string => {
  const value = raw.trim().toLowerCase();
  const mapped: Record<string, string> = {
    sin_lactosa: i18n.t("diet.sin_lactosa"),
    sin_gluten: i18n.t("diet.sin_gluten"),
    vegan: i18n.t("diet.vegan"),
    vegetariano: i18n.t("diet.vegetariano"),
    keto: i18n.t("diet.keto"),
  };
  if (mapped[value]) return mapped[value];
  return value
    .replace(/_/g, " ")
    .split(" ")
    .filter((token) => token.length > 0)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
};

export const formatDietTagsInline = (tags: string[]): string => {
  if (tags.length === 0) return i18n.t("diet.none");
  return tags.map(formatDietTagLabel).join(" • ");
};

export const formatRecipeCategoryLabel = (category: string): string => {
  const key = `recipeCategory.${category}`;
  const label = i18n.t(key);
  return label === key ? category : label;
};
