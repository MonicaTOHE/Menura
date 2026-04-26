import { useMemo, useState } from "react";
import Ionicons from "@react-native-vector-icons/ionicons";
import { Alert, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { RecipeCard } from "../components/RecipeCard";
import { DEFAULT_RECIPE_FILTERS } from "../constants/appConstants";
import { getThemeById } from "../constants/themes";
import { RootStackParamList } from "../navigation/types";
import { useAppStore } from "../store/useAppStore";
import { Recipe, RecipeFilters } from "../types/models";
import { filterRecipes } from "../utils/recipeFilters";
import { localizeRecipeForLanguage } from "../utils/recipeLanguage";
import { FilterModal } from "../components/FilterModal";
import { CreateRecipeModal } from "../components/CreateRecipeModal";

export const RecipeListScreen = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const recipes = useAppStore((s) => s.recipes);
  const appThemeId = useAppStore((s) => s.appThemeId);
  const favoriteIds = useAppStore((s) => s.favoriteIds);
  const toggleFavoriteRecipe = useAppStore((s) => s.toggleFavoriteRecipe);
  const createQuickRecipe = useAppStore((s) => s.createQuickRecipe);
  const updateQuickRecipe = useAppStore((s) => s.updateQuickRecipe);
  const deleteQuickRecipe = useAppStore((s) => s.deleteQuickRecipe);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<RecipeFilters>(DEFAULT_RECIPE_FILTERS);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const theme = getThemeById(appThemeId);

  const localizedRecipes = useMemo(() => recipes.map((recipe) => localizeRecipeForLanguage(recipe, i18n.language)), [recipes, i18n.language]);
  const filteredRecipes = useMemo(
    () => filterRecipes({ recipes: localizedRecipes, query, filters, favoriteIds }),
    [localizedRecipes, query, filters, favoriteIds],
  );
  const ownRecipes = filteredRecipes.filter((recipe) => recipe.isCustom);
  const seededRecipes = filteredRecipes.filter((recipe) => !recipe.isCustom);

  const confirmDeleteCustomRecipe = (recipe: Recipe) => {
    Alert.alert(t("recipeList.deleteTitle"), t("recipeList.deleteMessage", { title: recipe.title }), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => void deleteQuickRecipe(recipe.id),
      },
    ]);
  };

  const renderSection = (title: string, sectionRecipes: Recipe[]) => {
    if (sectionRecipes.length === 0) return null;
    return (
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <ScrollView style={styles.sectionScroll} contentContainerStyle={styles.sectionScrollContent} nestedScrollEnabled>
          {sectionRecipes.map((recipe) => (
            <View key={recipe.id}>
              <RecipeCard
                recipe={recipe}
                isFavorite={favoriteIds.has(recipe.id)}
                onToggleFavorite={() => toggleFavoriteRecipe(recipe.id)}
                onPress={() => navigation.navigate("RecipeDetail", { recipeId: recipe.id })}
              />
              {recipe.isCustom ? (
                <View style={styles.customActionsRow}>
                  <Pressable style={styles.customActionButton} onPress={() => setEditingRecipe(recipe)}>
                    <Ionicons name="create-outline" size={14} color="#1E2A38" />
                    <Text style={styles.customActionText}>{t("common.edit")}</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.customActionButton, styles.customActionDanger]}
                    onPress={() => confirmDeleteCustomRecipe(recipe)}
                  >
                    <Ionicons name="trash-outline" size={14} color="#B42318" />
                    <Text style={styles.customActionDangerText}>{t("common.delete")}</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.ui.screenBg }]}>
      <View style={styles.topHeader}>
        <View style={styles.titleBlock}>
          <View style={styles.titleRow}>
            <View style={[styles.titleAccent, { backgroundColor: theme.ui.primary }]} />
            <Text style={[styles.title, { color: theme.ui.text }]}>{t("recipeList.title")}</Text>
          </View>
          <Text style={[styles.subtitle, { color: theme.ui.muted }]}>{t("recipeList.subtitle")}</Text>
        </View>
        <Pressable style={[styles.filterButton, { backgroundColor: theme.ui.primary }]} onPress={() => setFiltersVisible(true)}>
          <Ionicons name="options-outline" size={15} color="#FFFFFF" />
          <Text style={styles.filterButtonText}>{t("common.filters")}</Text>
        </Pressable>
      </View>
      <Pressable style={[styles.createButton, { backgroundColor: theme.ui.secondary }]} onPress={() => setCreateVisible(true)}>
        <Ionicons name="add" size={16} color="#fff" />
        <Text style={styles.createButtonText}>{t("recipeList.create")}</Text>
      </Pressable>

      <View style={[styles.controlsCard, { backgroundColor: theme.ui.cardAlt, borderColor: theme.ui.border }]}>
        <View style={[styles.searchBox, { borderColor: theme.ui.border, backgroundColor: theme.ui.card }]}>
          <Ionicons name="search" size={16} color="#94A3B8" />
          <TextInput
            placeholder={t("recipeList.searchPlaceholder")}
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
          />
        </View>

        <View style={[styles.favoriteRow, { backgroundColor: theme.ui.cardAlt, borderColor: theme.ui.border }]}>
          <View style={styles.favoriteLabelGroup}>
            <Ionicons name="star-outline" size={14} color="#64748B" />
            <Text style={styles.favoriteLabel}>{t("recipeList.onlyFavorites")}</Text>
          </View>
          <Switch
            value={filters.onlyFavorites}
            onValueChange={(v) => setFilters({ ...filters, onlyFavorites: v })}
            thumbColor={filters.onlyFavorites ? "#FFFFFF" : "#FFFFFF"}
            trackColor={{ false: "#CBD5E1", true: theme.ui.primary }}
          />
        </View>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {renderSection(t("recipeList.ownRecipes"), ownRecipes)}
        {renderSection(t("recipeList.recipes"), seededRecipes)}
        {filteredRecipes.length === 0 ? <Text style={[styles.empty, { color: theme.ui.muted }]}>{t("recipeList.noResults")}</Text> : null}
      </ScrollView>
      <FilterModal visible={filtersVisible} onClose={() => setFiltersVisible(false)} filters={filters} onChange={setFilters} />
      <CreateRecipeModal
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        onCreate={async (input) => {
          const id = await createQuickRecipe(input);
          setCreateVisible(false);
          navigation.navigate("RecipeDetail", { recipeId: id });
        }}
      />
      <CreateRecipeModal
        visible={Boolean(editingRecipe)}
        mode="edit"
        initialValues={
          editingRecipe
            ? {
                title: editingRecipe.title,
                description: editingRecipe.description,
                category: editingRecipe.category,
                prepMinutes: editingRecipe.prepMinutes,
                servingsBase: editingRecipe.servingsBase,
                costLevel: editingRecipe.costLevel,
                dietTags: editingRecipe.dietTags,
                ingredients: editingRecipe.ingredients,
                steps: editingRecipe.steps,
              }
            : undefined
        }
        onClose={() => setEditingRecipe(null)}
        onCreate={async (input) => {
          if (!editingRecipe) return;
          await updateQuickRecipe({ id: editingRecipe.id, ...input });
          setEditingRecipe(null);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF4FB", paddingHorizontal: 22, paddingTop: 18 },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginHorizontal: 2,
    paddingRight: 6,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
    paddingRight: 6,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  titleAccent: {
    width: 6,
    height: 28,
    borderRadius: 999,
    backgroundColor: "#3B82F6",
  },
  title: { fontSize: 31, fontWeight: "800", color: "#0F172A" },
  subtitle: { marginTop: 6, color: "#4F6B8A", fontSize: 13, marginLeft: 16, paddingRight: 8 },
  filterButton: {
    borderWidth: 0,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 9,
    marginTop: 4,
    backgroundColor: "#1E2A38",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    shadowColor: "#0F172A",
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  filterButtonText: { fontWeight: "700", color: "#FFFFFF" },
  createButton: {
    marginTop: 10,
    marginHorizontal: 2,
    backgroundColor: "#0F766E",
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
  },
  createButtonText: { color: "#fff", fontWeight: "700" },
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
  favoriteRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F5FAFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D6E3F2",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  favoriteLabelGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  favoriteLabel: {
    color: "#334155",
    fontWeight: "600",
    fontSize: 13,
  },
  list: { marginTop: 18, flex: 1 },
  listContent: { paddingHorizontal: 2, paddingBottom: 24, gap: 12 },
  sectionBlock: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DCE6F2",
    padding: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#1E2A38", marginBottom: 8, marginTop: 2 },
  sectionScroll: {
    maxHeight: 360,
  },
  sectionScrollContent: {
    paddingBottom: 2,
    gap: 6,
  },
  customActionsRow: {
    marginTop: -2,
    marginBottom: 4,
    paddingHorizontal: 8,
    flexDirection: "row",
    gap: 8,
  },
  customActionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#D6E3F2",
  },
  customActionText: {
    color: "#1E2A38",
    fontWeight: "700",
    fontSize: 12,
  },
  customActionDanger: {
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
  },
  customActionDangerText: {
    color: "#B42318",
    fontWeight: "700",
    fontSize: 12,
  },
  empty: { textAlign: "center", marginTop: 20, color: "#64748B" },
});
