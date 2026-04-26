import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { RecipeCategory, RecipeFilters } from "../types/models";

const CATEGORIES: RecipeCategory[] = ["DESAYUNO", "ALMUERZO", "CENA", "SNACK", "POSTRE"];

const FilterPill = ({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) => (
  <Pressable onPress={onPress} style={[styles.pill, selected && styles.pillSelected]}>
    <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{label}</Text>
  </Pressable>
);

type Props = {
  visible: boolean;
  filters: RecipeFilters;
  onClose: () => void;
  onChange: (filters: RecipeFilters) => void;
};

export const FilterModal = ({ visible, filters, onClose, onChange }: Props) => {
  const { t } = useTranslation();
  const categoryLabels: Record<RecipeCategory, string> = {
    DESAYUNO: `🍵 ${t("recipeCategory.DESAYUNO")}`,
    ALMUERZO: `🍽 ${t("recipeCategory.ALMUERZO")}`,
    CENA: `🌙 ${t("recipeCategory.CENA")}`,
    SNACK: "🍎 Snack",
    POSTRE: `🍰 ${t("recipeCategory.POSTRE")}`,
  };
  const dietTagOptions = [
    { value: "vegan", label: `🌱 ${t("diet.vegan")}` },
    { value: "keto", label: `🥩 ${t("diet.keto")}` },
    { value: "sin_gluten", label: `🌾 ${t("diet.sin_gluten")}` },
    { value: "sin_lactosa", label: `🥛 ${t("diet.sin_lactosa")}` },
    { value: "vegetariano", label: `🥗 ${t("diet.vegetariano")}` },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.handle} />
          <Text style={styles.title}>{t("common.filters")}</Text>
          <Text style={styles.subtitle}>{t("filtersModal.subtitle")}</Text>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.sectionCard}>
              <Text style={styles.section}>{t("filtersModal.category")}</Text>
              <View style={styles.rowWrap}>
                {CATEGORIES.map((category) => (
                  <FilterPill
                    key={category}
                    label={categoryLabels[category]}
                    selected={filters.category === category}
                    onPress={() => onChange({ ...filters, category: filters.category === category ? undefined : category })}
                  />
                ))}
              </View>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.section}>{t("filtersModal.dietType")}</Text>
              <View style={styles.rowWrap}>
                {dietTagOptions.map((tag) => (
                  <FilterPill
                    key={tag.value}
                    label={tag.label}
                    selected={filters.dietTags.includes(tag.value)}
                    onPress={() =>
                      onChange({
                        ...filters,
                        dietTags: filters.dietTags.includes(tag.value)
                          ? filters.dietTags.filter((d) => d !== tag.value)
                          : [...filters.dietTags, tag.value],
                      })
                    }
                  />
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable style={styles.clearButton} onPress={() => onChange({ category: undefined, time: undefined, costLevel: undefined, dietTags: [], onlyFavorites: false })}>
              <Text style={styles.clear}>{t("common.clear")}</Text>
            </Pressable>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>{t("common.close")}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.32)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#F8FAFC",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#D0D5DD",
    alignSelf: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
  },
  subtitle: {
    marginTop: 2,
    marginBottom: 6,
    color: "#64748B",
    fontSize: 13,
  },
  scrollContent: { paddingBottom: 12, gap: 10 },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E4E7EC",
    padding: 10,
  },
  section: { fontSize: 14, fontWeight: "700", marginBottom: 8, color: "#0F172A" },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "#F8FAFC",
  },
  pillSelected: {
    backgroundColor: "#1E2A38",
    borderColor: "#1E2A38",
  },
  pillText: { color: "#334155", fontWeight: "600" },
  pillTextSelected: { color: "#fff", fontWeight: "700" },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    gap: 10,
  },
  clearButton: {
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  clear: { color: "#B42318", fontWeight: "700" },
  closeButton: { backgroundColor: "#111827", borderRadius: 10, paddingHorizontal: 16, paddingVertical: 9 },
  closeText: { color: "#fff", fontWeight: "700" },
});
