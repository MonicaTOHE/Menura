import { useMemo, useState } from "react";
import Ionicons from "@react-native-vector-icons/ionicons";
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { RecipeCard } from "../components/RecipeCard";
import { getThemeById } from "../constants/themes";
import { RootStackParamList } from "../navigation/types";
import { useAppStore } from "../store/useAppStore";
import { localizeRecipeForLanguage } from "../utils/recipeLanguage";

export const FavoritesScreen = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const recipes = useAppStore((s) => s.recipes);
  const appThemeId = useAppStore((s) => s.appThemeId);
  const favoriteIds = useAppStore((s) => s.favoriteIds);
  const toggleFavoriteRecipe = useAppStore((s) => s.toggleFavoriteRecipe);
  const [query, setQuery] = useState("");
  const theme = getThemeById(appThemeId);

  const localizedRecipes = useMemo(() => recipes.map((recipe) => localizeRecipeForLanguage(recipe, i18n.language)), [recipes, i18n.language]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return localizedRecipes.filter((r) => {
      if (!favoriteIds.has(r.id)) return false;
      if (!q) return true;
      return r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
    });
  }, [localizedRecipes, favoriteIds, query]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.ui.screenBg }]}>
      <View style={styles.topHeader}>
        <View style={styles.titleRow}>
          <View style={[styles.titleAccent, { backgroundColor: theme.ui.primary }]} />
          <Text style={[styles.title, { color: theme.ui.text }]}>{t("favorites.title")}</Text>
        </View>
        <Text style={[styles.subtitle, { color: theme.ui.muted }]}>{t("favorites.subtitle")}</Text>
      </View>

      <View style={[styles.controlsCard, { backgroundColor: theme.ui.cardAlt, borderColor: theme.ui.border }]}>
        <View style={[styles.searchBox, { borderColor: theme.ui.border, backgroundColor: theme.ui.card }]}>
          <Ionicons name="search" size={16} color="#94A3B8" />
          <TextInput
            placeholder={t("favorites.searchPlaceholder")}
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
          />
        </View>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {filtered.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            isFavorite
            onToggleFavorite={() => toggleFavoriteRecipe(recipe.id)}
            onPress={() => navigation.navigate("RecipeDetail", { recipeId: recipe.id })}
          />
        ))}
        {filtered.length === 0 ? <Text style={[styles.empty, { color: theme.ui.muted }]}>{t("favorites.empty")}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF4FB", paddingHorizontal: 22, paddingTop: 18 },
  topHeader: { marginHorizontal: 2 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  titleAccent: {
    width: 6,
    height: 28,
    borderRadius: 999,
    backgroundColor: "#EAB308",
  },
  title: { fontSize: 31, fontWeight: "800", color: "#0F172A" },
  subtitle: { marginTop: 6, color: "#4F6B8A", fontSize: 13, marginLeft: 16 },
  controlsCard: {
    marginTop: 12,
    backgroundColor: "#F8FBFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#D9E7F7",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: 2,
  },
  searchBox: {
    borderWidth: 1,
    borderColor: "#D6E3F2",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: "#0F172A",
    fontSize: 14,
  },
  list: { marginTop: 18, flex: 1 },
  listContent: { paddingHorizontal: 2, paddingBottom: 24 },
  empty: { textAlign: "center", marginTop: 20, color: "#64748B" },
});
