import { useEffect, useMemo, useState } from "react";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useTranslation } from "react-i18next";
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { CustomRecipeInput, Ingredient, RecipeCategory } from "../types/models";

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreate: (input: CustomRecipeInput) => Promise<void>;
  mode?: "create" | "edit";
  initialValues?: CustomRecipeInput;
};

const CATEGORIES: RecipeCategory[] = ["DESAYUNO", "ALMUERZO", "CENA", "SNACK", "POSTRE"];
type IngredientDraft = { name: string; qty: string; unit: string };
const FONT_DISPLAY = Platform.select({ web: "Inter, Segoe UI, sans-serif", default: "System" });
const FONT_BODY = Platform.select({ web: "Inter, Segoe UI, sans-serif", default: "System" });
const CATEGORY_ACTIVE_BG: Record<RecipeCategory, string> = {
  DESAYUNO: "#DCEEFF",
  ALMUERZO: "#3D6EA5",
  CENA: "#E7E6FF",
  SNACK: "#FFE9F5",
  POSTRE: "#FFE8EE",
};
const CATEGORY_ACTIVE_TEXT: Record<RecipeCategory, string> = {
  DESAYUNO: "#0F4C81",
  ALMUERZO: "#FFFFFF",
  CENA: "#4338CA",
  SNACK: "#BE185D",
  POSTRE: "#BE123C",
};

export const CreateRecipeModal = ({ visible, onClose, onCreate, mode = "create", initialValues }: Props) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<RecipeCategory>("ALMUERZO");
  const [servingsBase, setServingsBase] = useState("1");
  const [dietTagsText, setDietTagsText] = useState("");
  const [ingredients, setIngredients] = useState<IngredientDraft[]>([{ name: "", qty: "", unit: "unidad" }]);
  const [steps, setSteps] = useState<string[]>([""]);
  const [saving, setSaving] = useState(false);

  const canSave = useMemo(() => title.trim().length > 0, [title]);

  const onlyDigits = (value: string, maxDigits = 3) => value.replace(/[^\d]/g, "").slice(0, maxDigits);
  const clampValue = (value: string, min: number, max: number, fallback: number) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return String(fallback);
    return String(Math.min(max, Math.max(min, parsed)));
  };

  useEffect(() => {
    if (!visible) return;
    setTitle(initialValues?.title ?? "");
    setDescription(initialValues?.description ?? "");
    setCategory(initialValues?.category ?? "ALMUERZO");
    setServingsBase(String(initialValues?.servingsBase ?? 1));
    setDietTagsText((initialValues?.dietTags ?? []).join(", "));
    setIngredients(
      initialValues?.ingredients && initialValues.ingredients.length > 0
        ? initialValues.ingredients.map((item) => ({ name: item.name, qty: String(item.qty), unit: item.unit || "unidad" }))
        : [{ name: "", qty: "", unit: "unidad" }],
    );
    setSteps(initialValues?.steps && initialValues.steps.length > 0 ? initialValues.steps : [""]);
  }, [
    visible,
    initialValues?.title,
    initialValues?.description,
    initialValues?.category,
    initialValues?.prepMinutes,
    initialValues?.servingsBase,
    initialValues?.costLevel,
    initialValues?.dietTags,
    initialValues?.ingredients,
    initialValues?.steps,
  ]);

  const parseQty = (value: string): number | string => {
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) && value.trim() !== "" ? parsed : value.trim();
  };

  const submit = async () => {
    if (!canSave) return;
    setSaving(true);
    const parsedIngredients: Ingredient[] = ingredients
      .map((item) => ({
        name: item.name.trim(),
        qty: parseQty(item.qty),
        unit: item.unit.trim() || "unidad",
      }))
      .filter((item) => item.name.length > 0);
    const parsedSteps = steps.map((step) => step.trim()).filter((step) => step.length > 0);
    const parsedTags = dietTagsText
      .split(",")
      .map((tag) =>
        tag
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "_"),
      )
      .filter((tag) => tag.length > 0);

    await onCreate({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      prepMinutes: initialValues?.prepMinutes ?? 15,
      servingsBase: Math.max(1, Number(clampValue(servingsBase, 1, 99, 1)) || 1),
      costLevel: initialValues?.costLevel ?? "LOW",
      dietTags: parsedTags,
      ingredients: parsedIngredients,
      steps: parsedSteps,
    });
    setSaving(false);
    setTitle("");
    setDescription("");
    setCategory("ALMUERZO");
    setServingsBase("1");
    setDietTagsText("");
    setIngredients([{ name: "", qty: "", unit: "unidad" }]);
    setSteps([""]);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.cardGlowA} />
          <View style={styles.cardGlowB} />
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Text style={styles.title}>{mode === "edit" ? t("createRecipe.editTitle") : t("recipeList.create")}</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={16} color="#334155" />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
            <View style={[styles.sectionCard, styles.sectionCardBase]}>
              <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder={t("createRecipe.namePlaceholder")} />
              <TextInput
                style={[styles.input, styles.inputMulti]}
                value={description}
                onChangeText={setDescription}
                placeholder={t("createRecipe.descriptionPlaceholder")}
                multiline
              />
              <View style={styles.pills}>
                {CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat}
                    style={[
                      styles.pill,
                      category === cat && { backgroundColor: CATEGORY_ACTIVE_BG[cat], borderColor: CATEGORY_ACTIVE_BG[cat] },
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[styles.pillText, category === cat && { color: CATEGORY_ACTIVE_TEXT[cat] }]}>{t(`recipeCategory.${cat}`)}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.portionsRow}>
                <Text style={styles.portionsLabel}>{t("recipeDetail.servings")}</Text>
                <TextInput
                  style={styles.portionsInput}
                  value={servingsBase}
                  onChangeText={(value) => setServingsBase(onlyDigits(value, 2))}
                  onBlur={() => setServingsBase(clampValue(servingsBase, 1, 99, 1))}
                  keyboardType="numeric"
                  maxLength={2}
                  placeholder="1"
                />
                <Text style={styles.portionsHint}>{t("createRecipe.people")}</Text>
              </View>
              <TextInput
                style={styles.input}
                value={dietTagsText}
                onChangeText={setDietTagsText}
                placeholder={t("createRecipe.dietTagsPlaceholder")}
              />
            </View>

            <View style={[styles.sectionCard, styles.sectionCardIngredients]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>{t("recipeDetail.ingredients")}</Text>
                <Pressable
                  style={styles.addInline}
                  onPress={() => setIngredients((prev) => [...prev, { name: "", qty: "", unit: "unidad" }])}
                >
                  <Ionicons name="add" size={14} color="#1E2A38" />
                  <Text style={styles.addInlineText}>{t("common.add")}</Text>
                </Pressable>
              </View>
              {ingredients.map((ingredient, idx) => (
                <View key={`ing-${idx}`} style={styles.blockRow}>
                  <TextInput
                    style={[styles.input, styles.blockInput]}
                    value={ingredient.name}
                    onChangeText={(name) =>
                      setIngredients((prev) => prev.map((item, i) => (i === idx ? { ...item, name } : item)))
                    }
                    placeholder={t("createRecipe.ingredientPlaceholder")}
                  />
                  <TextInput
                    style={[styles.input, styles.qtyInput]}
                    value={ingredient.qty}
                    onChangeText={(qty) =>
                      setIngredients((prev) => prev.map((item, i) => (i === idx ? { ...item, qty } : item)))
                    }
                    keyboardType="numeric"
                    placeholder={t("createRecipe.qtyShort")}
                  />
                  <TextInput
                    style={[styles.input, styles.unitInput]}
                    value={ingredient.unit}
                    onChangeText={(unit) =>
                      setIngredients((prev) => prev.map((item, i) => (i === idx ? { ...item, unit } : item)))
                    }
                    placeholder={t("createRecipe.unitPlaceholder")}
                  />
                  {ingredients.length > 1 ? (
                    <Pressable
                      style={styles.removeButton}
                      onPress={() => setIngredients((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      <Ionicons name="trash-outline" size={14} color="#B42318" />
                    </Pressable>
                  ) : null}
                </View>
              ))}
            </View>

            <View style={[styles.sectionCard, styles.sectionCardSteps]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>{t("createRecipe.preparation")}</Text>
                <Pressable style={styles.addInline} onPress={() => setSteps((prev) => [...prev, ""])}>
                  <Ionicons name="add" size={14} color="#1E2A38" />
                  <Text style={styles.addInlineText}>{t("createRecipe.step")}</Text>
                </Pressable>
              </View>
              {steps.map((step, idx) => (
                <View key={`step-${idx}`} style={styles.stepRow}>
                  <View style={styles.stepIndex}>
                    <Text style={styles.stepIndexText}>{idx + 1}</Text>
                  </View>
                  <TextInput
                    style={[styles.input, styles.stepInput]}
                    value={step}
                    onChangeText={(value) => setSteps((prev) => prev.map((item, i) => (i === idx ? value : item)))}
                    placeholder={t("createRecipe.stepPlaceholder")}
                  />
                  {steps.length > 1 ? (
                    <Pressable style={styles.removeButton} onPress={() => setSteps((prev) => prev.filter((_, i) => i !== idx))}>
                      <Ionicons name="trash-outline" size={14} color="#B42318" />
                    </Pressable>
                  ) : null}
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <Pressable style={styles.cancel} onPress={onClose}>
              <Text style={styles.cancelText}>{t("common.cancel")}</Text>
            </Pressable>
            <Pressable style={[styles.save, !canSave && styles.saveDisabled]} onPress={() => void submit()} disabled={!canSave || saving}>
              <Text style={styles.saveText}>{saving ? t("createRecipe.saving") : t("createRecipe.saveRecipe")}</Text>
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
    justifyContent: "flex-end",
    backgroundColor: "rgba(15,23,42,0.28)",
  },
  card: {
    backgroundColor: "#F3F7FF",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
    maxHeight: "92%",
    overflow: "hidden",
  },
  cardGlowA: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    right: -40,
    top: -40,
    backgroundColor: "#DDEBFF",
    opacity: 0.55,
  },
  cardGlowB: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    left: -40,
    bottom: 120,
    backgroundColor: "#D2F3E0",
    opacity: 0.36,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 99,
    backgroundColor: "#B9C8DA",
    alignSelf: "center",
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: 26, fontWeight: "800", color: "#0F172A", fontFamily: FONT_DISPLAY },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  subtitle: { color: "#4E6A88", fontSize: 13, marginTop: 2, fontFamily: FONT_BODY, lineHeight: 19 },
  form: { gap: 10, paddingTop: 10, paddingBottom: 8 },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DFE8F3",
    padding: 10,
    gap: 8,
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  sectionCardBase: {
    backgroundColor: "#F7FBFF",
    borderColor: "#CCE1F8",
  },
  sectionCardIngredients: {
    backgroundColor: "#F2FDF6",
    borderColor: "#C0E8D1",
  },
  sectionCardSteps: {
    backgroundColor: "#FFF8F0",
    borderColor: "#F6DAC0",
  },
  sectionLabel: { color: "#0F172A", fontSize: 16, fontWeight: "700", fontFamily: FONT_DISPLAY, letterSpacing: 0.2 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  addInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#D0D8E3",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#EEF5FF",
  },
  addInlineText: { color: "#12314E", fontSize: 12, fontWeight: "700", fontFamily: FONT_BODY },
  input: {
    borderWidth: 1,
    borderColor: "#C8DAEE",
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: "#FFFFFF",
    fontSize: 15,
    color: "#0F172A",
    fontFamily: FONT_BODY,
  },
  portionsRow: {
    borderWidth: 1,
    borderColor: "#C8DAEE",
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  portionsLabel: {
    fontFamily: FONT_BODY,
    fontSize: 12,
    fontWeight: "700",
    color: "#475467",
  },
  portionsInput: {
    width: 56,
    borderWidth: 1,
    borderColor: "#D5E0EE",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    fontFamily: FONT_DISPLAY,
    backgroundColor: "#F8FBFF",
    textAlign: "center",
  },
  portionsHint: {
    color: "#667085",
    fontSize: 12,
    fontWeight: "600",
    fontFamily: FONT_BODY,
  },
  inputMulti: { minHeight: 72, textAlignVertical: "top" },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    borderWidth: 1,
    borderColor: "#BCD0E8",
    borderRadius: 999,
    backgroundColor: "#EDF4FF",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  pillText: { color: "#475467", fontWeight: "600", fontFamily: FONT_BODY },
  blockRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  blockInput: { flex: 1 },
  qtyInput: { width: 72 },
  unitInput: { width: 86 },
  removeButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#FDECEC",
    borderWidth: 1,
    borderColor: "#F7C7C7",
    alignItems: "center",
    justifyContent: "center",
  },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  stepIndex: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DCEAFF",
  },
  stepIndexText: { color: "#1E40AF", fontSize: 12, fontWeight: "700", fontFamily: FONT_BODY },
  stepInput: { flex: 1 },
  actions: { flexDirection: "row", justifyContent: "space-between", gap: 10, marginTop: 6 },
  cancel: {
    borderWidth: 1,
    borderColor: "#D4DFEC",
    borderRadius: 16,
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
  },
  cancelText: { color: "#4A5B73", fontWeight: "600", fontFamily: FONT_BODY },
  save: {
    backgroundColor: "#2D5FA0",
    borderRadius: 16,
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    shadowColor: "#0B3F61",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  saveDisabled: { opacity: 0.6 },
  saveText: { color: "#fff", fontWeight: "700", fontFamily: FONT_BODY },
});
