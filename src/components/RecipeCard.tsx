import Ionicons from "@react-native-vector-icons/ionicons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { getRecipeThumbImage } from "../constants/recipeImages";
import { getThemeById } from "../constants/themes";
import { useAppStore } from "../store/useAppStore";
import { Recipe } from "../types/models";
import { formatDietTagsInline, formatRecipeCategoryLabel } from "../utils/labels";

type Props = {
  recipe: Recipe;
  isFavorite: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
};

export const RecipeCard = ({ recipe, isFavorite, onPress, onToggleFavorite }: Props) => {
  const appThemeId = useAppStore((s) => s.appThemeId);
  const theme = getThemeById(appThemeId);
  const recipeImage = getRecipeThumbImage(recipe.id);
  const hasTags = recipe.dietTags.length > 0;
  const toneByCategory: Record<Recipe["category"], { border: string; soft: string; chipBg: string; chipText: string }> = {
    DESAYUNO: { border: "#F59E0B", soft: "#FFF8EB", chipBg: "#FFF1D6", chipText: "#8A5500" },
    ALMUERZO: { border: "#14B8A6", soft: "#EEFFFB", chipBg: "#DDFBF3", chipText: "#0F766E" },
    CENA: { border: "#6366F1", soft: "#F1F2FF", chipBg: "#E7E9FF", chipText: "#3730A3" },
    SNACK: { border: "#EC4899", soft: "#FFF1F8", chipBg: "#FDE3F1", chipText: "#9D174D" },
    POSTRE: { border: "#FB7185", soft: "#FFF2F4", chipBg: "#FFE1E7", chipText: "#9F1239" },
  };
  const tone = toneByCategory[recipe.category];

  return (
    <Pressable
      style={[
        styles.card,
        {
          backgroundColor: tone.soft,
          borderColor: theme.ui.border,
          shadowColor: theme.ui.primary,
        },
      ]}
      onPress={onPress}
    >
      <View style={[styles.accentBar, { backgroundColor: tone.border }]} />
      {recipeImage ? (
        <Image source={recipeImage} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.imageFallback, { backgroundColor: tone.chipBg }]}>
          <View style={[styles.imageFallbackBadge, { backgroundColor: tone.soft, borderColor: tone.border }]}>
            <Ionicons name={recipe.isCustom ? "camera-outline" : "restaurant-outline"} size={16} color={tone.chipText} />
            <Text style={[styles.imageFallbackBadgeText, { color: tone.chipText }]}>
              {recipe.isCustom ? "Foto pendiente" : "Imagen no disponible"}
            </Text>
          </View>
          <Text style={[styles.imageFallbackTitle, { color: tone.chipText }]}>
            {recipe.isCustom ? "Tu receta se guardo bien" : recipe.title}
          </Text>
        </View>
      )}
      <View style={styles.row}>
        <Text style={styles.title}>{recipe.title}</Text>
        <Pressable onPress={onToggleFavorite} style={[styles.favoriteButton, { backgroundColor: theme.ui.softTint }]}>
          <Text style={styles.favorite}>{isFavorite ? "★" : "☆"}</Text>
        </Pressable>
      </View>
      <Text style={styles.description}>{recipe.description}</Text>
      <View style={styles.metaRow}>
        <Text style={[styles.metaPill, { backgroundColor: tone.chipBg, color: tone.chipText }]}>{formatRecipeCategoryLabel(recipe.category)}</Text>
      </View>
      <Text style={[styles.tags, !hasTags && styles.tagsMuted]}>{formatDietTagsInline(recipe.dietTags)}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E8EEF5",
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    overflow: "hidden",
  },
  accentBar: {
    position: "absolute",
    left: 8,
    top: 14,
    bottom: 14,
    width: 4,
    borderRadius: 999,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 21,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
    marginRight: 8,
  },
  image: {
    width: "100%",
    height: 170,
    borderRadius: 14,
    marginBottom: 12,
  },
  imageFallback: {
    width: "100%",
    height: 170,
    borderRadius: 14,
    marginBottom: 12,
    padding: 14,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.06)",
  },
  imageFallbackBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  imageFallbackBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  imageFallbackTitle: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "800",
    maxWidth: "82%",
  },
  favoriteButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF7E8",
  },
  favorite: {
    fontSize: 17,
    color: "#E6A500",
  },
  description: {
    marginTop: 8,
    color: "#4B5563",
    fontSize: 14,
    lineHeight: 20,
  },
  metaRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  metaPill: {
    fontSize: 12,
    color: "#334155",
    backgroundColor: "#EFF3F8",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: "hidden",
  },
  tags: {
    marginTop: 9,
    color: "#0F766E",
    fontSize: 12,
    fontWeight: "500",
  },
  tagsMuted: {
    color: "#94A3B8",
  },
});
