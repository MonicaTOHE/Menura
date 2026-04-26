import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";
import { DEFAULT_RECIPE_FILTERS } from "../constants/appConstants";
import { Recipe, RecipeFilters } from "../types/models";
import { filterRecipes } from "../utils/recipeFilters";
import { formatRecipeCategoryLabel } from "../utils/labels";
import { FilterModal } from "./FilterModal";

type Props = {
  visible: boolean;
  recipes: Recipe[];
  favoriteIds: Set<string>;
  onClose: () => void;
  onPickRecipe: (recipeId: string) => void;
  onCreateRecipe: () => void;
};

export const RecipeSelectorModal = ({ visible, recipes, favoriteIds, onClose, onPickRecipe, onCreateRecipe }: Props) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<RecipeFilters>(DEFAULT_RECIPE_FILTERS);
  const [filterVisible, setFilterVisible] = useState(false);

  const filtered = useMemo(
    () =>
      filterRecipes({
        recipes,
        query,
        filters,
        favoriteIds,
      }),
    [recipes, query, filters, favoriteIds],
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>{t("recipeSelector.title")}</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t("recipeSelector.searchPlaceholder")}
            style={styles.search}
          />
          <View style={styles.row}>
            <View style={styles.toggleRow}>
              <Text>{t("recipeList.onlyFavorites")}</Text>
              <Switch value={filters.onlyFavorites} onValueChange={(value) => setFilters({ ...filters, onlyFavorites: value })} />
            </View>
            <Pressable style={styles.filterBtn} onPress={() => setFilterVisible(true)}>
              <Text style={styles.filterText}>{t("common.filters")}</Text>
            </Pressable>
          </View>
          <Pressable style={styles.createButton} onPress={onCreateRecipe}>
            <Text style={styles.createText}>+ {t("recipeList.create")}</Text>
          </Pressable>

          <ScrollView style={styles.list}>
            {filtered.map((recipe) => (
              <Pressable key={recipe.id} style={styles.item} onPress={() => onPickRecipe(recipe.id)}>
                <Text style={styles.itemTitle}>{recipe.title}</Text>
                <Text style={styles.itemMeta}>
                  {formatRecipeCategoryLabel(recipe.category)}
                </Text>
              </Pressable>
            ))}
            {filtered.length === 0 ? <Text style={styles.empty}>{t("recipeList.noResults")}</Text> : null}
          </ScrollView>

          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>{t("common.close")}</Text>
          </Pressable>
        </View>
      </View>
      <FilterModal visible={filterVisible} filters={filters} onChange={setFilters} onClose={() => setFilterVisible(false)} />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    padding: 12,
    maxHeight: "90%",
  },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  search: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  filterBtn: { borderWidth: 1, borderColor: "#aaa", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  filterText: { fontWeight: "600" },
  list: { marginTop: 10 },
  createButton: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  createText: { color: "#1E2A38", fontWeight: "700" },
  item: {
    borderBottomWidth: 1,
    borderBottomColor: "#ececec",
    paddingVertical: 10,
  },
  itemTitle: { fontSize: 15, fontWeight: "700" },
  itemMeta: { color: "#666", marginTop: 2 },
  empty: { textAlign: "center", color: "#666", marginTop: 18 },
  closeBtn: {
    marginTop: 12,
    backgroundColor: "#1f2937",
    borderRadius: 8,
    alignItems: "center",
    paddingVertical: 10,
  },
  closeText: { color: "#fff", fontWeight: "700" },
});
