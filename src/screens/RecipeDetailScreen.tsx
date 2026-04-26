import { useMemo, useState } from "react";
import Ionicons from "@react-native-vector-icons/ionicons";
import {
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { MEAL_TYPES } from "../constants/appConstants";
import { getRecipeImage } from "../constants/recipeImages";
import { RootStackParamList } from "../navigation/types";
import { useAppStore } from "../store/useAppStore";
import { MealType } from "../types/models";
import { toISODate } from "../utils/date";
import { formatDietTagsInline, formatRecipeCategoryLabel } from "../utils/labels";
import { localizeRecipeForLanguage } from "../utils/recipeLanguage";

type Props = NativeStackScreenProps<RootStackParamList, "RecipeDetail">;

export const RecipeDetailScreen = ({ route }: Props) => {
  const { t, i18n } = useTranslation();
  const { recipeId } = route.params;
  const recipes = useAppStore((s) => s.recipes);
  const favoriteIds = useAppStore((s) => s.favoriteIds);
  const toggleFavoriteRecipe = useAppStore((s) => s.toggleFavoriteRecipe);
  const assignRecipeToSlot = useAppStore((s) => s.assignRecipeToSlot);

  const [planVisible, setPlanVisible] = useState(false);
  const [date, setDate] = useState(toISODate(new Date()));
  const [mealType, setMealType] = useState<MealType>("LUNCH");

  const rawRecipe = useMemo(() => recipes.find((r) => r.id === recipeId), [recipes, recipeId]);
  if (!rawRecipe) {
    return (
      <SafeAreaView style={styles.center}>
        <Text>{t("recipeDetail.notFound")}</Text>
      </SafeAreaView>
    );
  }
  const recipe = localizeRecipeForLanguage(rawRecipe, i18n.language);

  const recipeImage = getRecipeImage(recipe.id);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.row}>
            <Text style={styles.title}>{recipe.title}</Text>
            <Pressable
              style={styles.favoriteButton}
              onPress={() => toggleFavoriteRecipe(recipe.id)}
              accessibilityRole="button"
              accessibilityLabel={
                favoriteIds.has(recipe.id)
                  ? t("recipeDetail.unfavorite", { defaultValue: "Remove from favorites" })
                  : t("recipeDetail.favorite", { defaultValue: "Add to favorites" })
              }
              accessibilityState={{ selected: favoriteIds.has(recipe.id) }}
            >
              <Text style={styles.favorite}>{favoriteIds.has(recipe.id) ? "★" : "☆"}</Text>
            </Pressable>
          </View>
          <Text style={styles.description}>{recipe.description}</Text>
          {recipeImage ? (
            <Image source={recipeImage} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={styles.heroImageFallback}>
              <View style={styles.heroImageFallbackChip}>
                <Ionicons name={recipe.isCustom ? "camera-outline" : "restaurant-outline"} size={16} color="#1E40AF" />
                <Text style={styles.heroImageFallbackChipText}>
                  {recipe.isCustom ? t("recipeDetail.photoPendingChip") : t("recipeDetail.imageUnavailableChip")}
                </Text>
              </View>
              <Text style={styles.heroImageFallbackTitle}>{recipe.title}</Text>
              <Text style={styles.heroImageFallbackText}>
                {recipe.isCustom ? t("recipeDetail.customPhotoFallback") : t("recipeDetail.photoFallback")}
              </Text>
            </View>
          )}

          <View style={styles.chipsRow}>
            <View style={styles.chip}>
              <Ionicons name="restaurant-outline" size={13} color="#334155" />
              <Text style={styles.chipText}>{formatRecipeCategoryLabel(recipe.category)}</Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>{t("recipeDetail.servings")}</Text>
              <Text style={styles.summaryValue}>{recipe.servingsBase}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={[styles.summaryItem, styles.summaryItemWide]}>
              <Text style={styles.summaryLabel}>{t("recipeDetail.tags")}</Text>
              <Text style={styles.summaryValueSmall}>{formatDietTagsInline(recipe.dietTags)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>{t("recipeDetail.ingredients")}</Text>
          </View>
          {recipe.ingredients.length === 0 ? <Text style={styles.emptySection}>{t("recipeDetail.emptyIngredients")}</Text> : null}
          {recipe.ingredients.map((ingredient, idx) => (
            <View key={`${ingredient.name}-${idx}`} style={styles.itemRow}>
              <View style={styles.itemDot} />
              <View style={styles.itemMainTap}>
                <Text style={styles.itemText}>
                  <Text style={styles.itemStrong}>{ingredient.name}</Text>: {ingredient.qty} {ingredient.unit}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t("recipeDetail.steps")}</Text>
          {recipe.steps.length === 0 ? <Text style={styles.emptySection}>{t("recipeDetail.emptySteps")}</Text> : null}
          {recipe.steps.map((step, idx) => (
            <View key={`${step}-${idx}`} style={styles.stepRow}>
              <View style={styles.stepIndex}>
                <Text style={styles.stepIndexText}>{idx + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        <Pressable style={styles.planButton} onPress={() => setPlanVisible(true)}>
          <Ionicons name="calendar-outline" size={16} color="#fff" />
          <Text style={styles.planButtonText}>{t("recipeDetail.addToCalendar")}</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={planVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalHeaderCopy}>
                <Text style={styles.modalTitle}>{t("recipeDetail.addToCalendar")}</Text>
                <Text style={styles.modalSubtitle}>{t("recipeDetail.calendarModalSubtitle")}</Text>
              </View>
              <Pressable style={styles.modalXButton} onPress={() => setPlanVisible(false)}>
                <Ionicons name="close" size={16} color="#0F172A" />
              </Pressable>
            </View>

            <View style={styles.modalBlock}>
              <Text style={styles.modalLabel}>{t("recipeDetail.date")}</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="calendar-outline" size={16} color="#64748B" />
                <TextInput value={date} onChangeText={setDate} style={styles.input} placeholder="yyyy-MM-dd" />
              </View>
            </View>

            <View style={styles.modalBlock}>
              <Text style={styles.modalLabel}>{t("recipeDetail.food")}</Text>
              <View style={styles.mealRow}>
                {MEAL_TYPES.map((meal) => (
                  <Pressable
                    key={meal.key}
                    style={[styles.mealPill, mealType === meal.key && styles.mealPillSelected]}
                    onPress={() => setMealType(meal.key)}
                  >
                    <Text style={mealType === meal.key ? styles.mealPillTextSelected : styles.mealPillText}>{t(`meal.${meal.key}`)}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.modalActionsRow}>
              <Pressable style={styles.modalCancelBtn} onPress={() => setPlanVisible(false)}>
                <Text style={styles.modalCancelText}>{t("common.cancel")}</Text>
              </Pressable>
              <Pressable
                style={styles.modalAction}
                onPress={async () => {
                  await assignRecipeToSlot(date, mealType, recipe.id);
                  setPlanVisible(false);
                }}
              >
                <Ionicons name="checkmark" size={16} color="#fff" />
                <Text style={styles.modalActionText}>{t("recipeDetail.save")}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F7FB" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 22 },
  hero: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E6EDF5",
    padding: 14,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 32, fontWeight: "800", flex: 1, marginRight: 8, color: "#0F172A" },
  favoriteButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFF6E8",
    alignItems: "center",
    justifyContent: "center",
  },
  favorite: { fontSize: 20, color: "#E7A400" },
  description: { marginTop: 8, color: "#475467", fontSize: 15, lineHeight: 21 },
  heroImage: {
    marginTop: 12,
    width: "100%",
    height: 220,
    borderRadius: 14,
  },
  heroImageFallback: {
    marginTop: 12,
    width: "100%",
    height: 220,
    borderRadius: 14,
    padding: 16,
    justifyContent: "space-between",
    backgroundColor: "#EEF4FF",
    borderWidth: 1,
    borderColor: "#D9E6FB",
  },
  heroImageFallbackChip: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#C8D8F3",
  },
  heroImageFallbackChipText: {
    color: "#1E40AF",
    fontSize: 12,
    fontWeight: "700",
  },
  heroImageFallbackTitle: {
    color: "#0F172A",
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
    maxWidth: "85%",
  },
  heroImageFallbackText: {
    color: "#475467",
    fontSize: 13,
    lineHeight: 18,
    maxWidth: "92%",
  },
  chipsRow: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F1F5F9",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipText: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "600",
  },
  summaryRow: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5EAF2",
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FCFDFE",
  },
  summaryItem: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 82,
  },
  summaryItemWide: {
    flex: 1,
    alignItems: "flex-start",
  },
  summaryLabel: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "600",
  },
  summaryValue: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 2,
  },
  summaryValueSmall: {
    color: "#0F766E",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: "#E2E8F0",
    marginHorizontal: 10,
  },
  sectionCard: {
    marginTop: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E6EDF5",
    padding: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  sectionHeaderRow: {
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  itemMainTap: { flex: 1 },
  itemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#14B8A6",
  },
  itemText: {
    color: "#334155",
    fontSize: 14,
  },
  emptySection: {
    color: "#94A3B8",
    fontSize: 14,
    fontStyle: "italic",
    marginTop: 2,
  },
  itemStrong: {
    color: "#0F172A",
    fontWeight: "700",
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 10,
  },
  stepIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#EAF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  stepIndexText: {
    color: "#1E40AF",
    fontSize: 12,
    fontWeight: "700",
  },
  stepText: {
    flex: 1,
    color: "#334155",
    fontSize: 14,
    lineHeight: 20,
  },
  planButton: {
    marginTop: 16,
    backgroundColor: "#1E2A38",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    shadowColor: "#0F172A",
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  planButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 18,
    borderWidth: 1,
    borderColor: "#E8EEF6",
  },
  modalHandle: {
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#CBD5E1",
    alignSelf: "center",
    marginBottom: 10,
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  modalHeaderCopy: { flex: 1 },
  modalTitle: { fontSize: 29, fontWeight: "800", color: "#0F172A" },
  modalSubtitle: { marginTop: 3, color: "#64748B", fontSize: 13, fontWeight: "500" },
  modalXButton: {
    marginTop: 4,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#D5DEEA",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  modalBlock: {
    marginTop: 12,
    backgroundColor: "#F8FAFD",
    borderWidth: 1,
    borderColor: "#E5ECF5",
    borderRadius: 14,
    padding: 10,
  },
  modalLabel: { fontWeight: "700", color: "#334155", fontSize: 13, marginBottom: 8 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D3DEEA",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    paddingLeft: 10,
    gap: 6,
  },
  input: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 10,
    color: "#0F172A",
    fontWeight: "600",
  },
  mealRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  mealPill: {
    borderWidth: 1,
    borderColor: "#D3DEEA",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
  },
  mealPillSelected: {
    backgroundColor: "#1E2A38",
    borderColor: "#1E2A38",
  },
  mealPillText: { color: "#334155", fontWeight: "700", fontSize: 13 },
  mealPillTextSelected: { color: "#fff", fontWeight: "700" },
  modalActionsRow: {
    marginTop: 14,
    flexDirection: "row",
    gap: 8,
  },
  modalCancelBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D3DEEA",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    backgroundColor: "#FFFFFF",
  },
  modalCancelText: {
    color: "#475467",
    fontWeight: "700",
    fontSize: 14,
  },
  modalAction: {
    flex: 1.4,
    backgroundColor: "#1E2A38",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    paddingVertical: 11,
  },
  modalActionText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
