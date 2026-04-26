import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useTranslation } from "react-i18next";
import { DayPlanCard } from "../components/week/DayPlanCard";
import { WeekHeader } from "../components/week/WeekHeader";
import { RecipeSelectorModal } from "../components/RecipeSelectorModal";
import { SlotActionModal } from "../components/SlotActionModal";
import { CreateRecipeModal } from "../components/CreateRecipeModal";
import { PrintPlanModal } from "../components/PrintPlanModal";
import { DEFAULT_HOUSEHOLD_MEMBER_ID, MEAL_TYPES } from "../constants/appConstants";
import { getThemeById } from "../constants/themes";
import { RootStackParamList } from "../navigation/types";
import { buildPlanHtml } from "../services/exportPlanPdf";
import { useAppStore, useWeekDays } from "../store/useAppStore";
import { MealType } from "../types/models";
import { addDays, fromISODate, getWeekRangeNumericParts, startOfWeekMonday, toISODate } from "../utils/date";
import { localizeRecipeForLanguage } from "../utils/recipeLanguage";

const MEAL_ICONS: Record<MealType, string> = {
  BREAKFAST: "🍵",
  SCHOOL_SNACK: "🎒",
  LUNCH: "🍽",
  DINNER: "🌙",
  SNACK: "🍎",
};

type SelectedSlot = {
  date: string;
  mealType: MealType;
  recipeId: string | null;
  forMember: string;
};

export const WeekScreen = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const weekStartDate = useAppStore((s) => s.weekStartDate);
  const appThemeId = useAppStore((s) => s.appThemeId);
  const weekEntries = useAppStore((s) => s.weekEntries);
  const recipes = useAppStore((s) => s.recipes);
  const favoriteIds = useAppStore((s) => s.favoriteIds);
  const householdMembers = useAppStore((s) => s.householdMembers);
  const moveWeek = useAppStore((s) => s.moveWeek);
  const setWeekStartDate = useAppStore((s) => s.setWeekStartDate);
  const assignRecipeToSlot = useAppStore((s) => s.assignRecipeToSlot);
  const assignTextToSlot = useAppStore((s) => s.assignTextToSlot);
  const clearSlot = useAppStore((s) => s.clearSlot);
  const createQuickRecipe = useAppStore((s) => s.createQuickRecipe);
  const getPlannedDatesInRange = useAppStore((s) => s.getPlannedDatesInRange);
  const days = useWeekDays();
  const { startLabel, endLabel } = getWeekRangeNumericParts(weekStartDate);
  const [exporting, setExporting] = useState(false);

  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [slotModalVisible, setSlotModalVisible] = useState(false);
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [createRecipeVisible, setCreateRecipeVisible] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date(`${weekStartDate}T00:00:00`));
  const [plannedDates, setPlannedDates] = useState<Set<string>>(new Set());
  const [printHtml, setPrintHtml] = useState<string | null>(null);
  const theme = getThemeById(appThemeId);

  const localizedRecipes = useMemo(() => recipes.map((recipe) => localizeRecipeForLanguage(recipe, i18n.language)), [recipes, i18n.language]);
  const recipeMap = useMemo(() => new Map(localizedRecipes.map((recipe) => [recipe.id, recipe])), [localizedRecipes]);
  const memberMap = useMemo(() => new Map(householdMembers.map((m) => [m.id, m])), [householdMembers]);
  const entriesBySlot = useMemo(() => {
    const map = new Map<string, (typeof weekEntries)[number][]>();
    weekEntries.forEach((entry) => {
      const key = `${entry.date}|${entry.mealType}`;
      const list = map.get(key) ?? [];
      list.push(entry);
      map.set(key, list);
    });
    return map;
  }, [weekEntries]);

  const calendarDays = useMemo(() => {
    const monthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const startGrid = new Date(monthStart);
    startGrid.setDate(monthStart.getDate() - ((monthStart.getDay() + 6) % 7));
    return Array.from({ length: 42 }).map((_, idx) => {
      const d = new Date(startGrid);
      d.setDate(startGrid.getDate() + idx);
      return d;
    });
  }, [calendarMonth]);

  const pickDate = async (date: Date) => {
    const monday = startOfWeekMonday(date);
    await setWeekStartDate(toISODate(monday));
    setCalendarVisible(false);
  };

  useEffect(() => {
    if (!calendarVisible) return;
    const first = toISODate(calendarDays[0]);
    const last = toISODate(calendarDays[calendarDays.length - 1]);
    void (async () => {
      const planned = await getPlannedDatesInRange(first, last);
      setPlannedDates(planned);
    })();
  }, [calendarVisible, calendarMonth, weekStartDate, getPlannedDatesInRange, calendarDays]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.ui.screenBg }]}>
      <WeekHeader
        startLabel={startLabel}
        endLabel={endLabel}
        kicker={t("nav.week").toUpperCase()}
        fromLabel={t("week.from")}
        toLabel={t("week.to")}
        onPrevWeek={() => moveWeek(-1)}
        onNextWeek={() => moveWeek(1)}
      />
      <View style={styles.calendarRow}>
        <Pressable
          style={[styles.calendarButton, { borderColor: theme.ui.border, backgroundColor: theme.ui.card }]}
          onPress={() => setCalendarVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={t("week.calendarWeekly")}
        >
          <Ionicons name="calendar-outline" size={16} color={theme.ui.primary} />
          <Text style={[styles.calendarText, { color: theme.ui.primary }]}>{t("week.calendarWeekly")}</Text>
        </Pressable>
        <Pressable
          style={[styles.calendarButton, { borderColor: theme.ui.border, backgroundColor: theme.ui.card, opacity: exporting ? 0.5 : 1 }]}
          disabled={exporting}
          onPress={() => {
            try {
              setExporting(true);
              const locale = i18n.language.startsWith("en") ? "en-US" : "es-CL";
              const dayLabels: Record<number, string> = {};
              days.forEach((iso, idx) => {
                const d = fromISODate(iso);
                const wk = d.toLocaleDateString(locale, { weekday: "long" });
                dayLabels[idx] = wk.charAt(0).toUpperCase() + wk.slice(1);
              });
              const html = buildPlanHtml({
                weekStartDate,
                weekDays: days,
                entries: weekEntries,
                recipes: localizedRecipes,
                members: householdMembers,
                labels: {
                  title: t("week.exportPdfTitle", { defaultValue: "Plan semanal" }),
                  weekRange: `${startLabel} → ${endLabel}`,
                  days: dayLabels,
                  meals: {
                    BREAKFAST: t("meal.BREAKFAST"),
                    SCHOOL_SNACK: t("meal.SCHOOL_SNACK"),
                    LUNCH: t("meal.LUNCH"),
                    DINNER: t("meal.DINNER"),
                    SNACK: t("meal.SNACK"),
                  },
                  empty: t("week.empty"),
                  member: t("slotAction.forMemberTitle", { defaultValue: "Para" }),
                  generatedBy: t("week.exportPdfFooter", { defaultValue: "Generado con" }),
                  notesLabel: t("week.notesLabel", { defaultValue: "Notas" }),
                },
              });
              setPrintHtml(html);
            } finally {
              setExporting(false);
            }
          }}
          accessibilityRole="button"
          accessibilityLabel={t("week.exportPdf", { defaultValue: "Exportar PDF" })}
        >
          <Ionicons name="document-text-outline" size={16} color={theme.ui.primary} />
          <Text style={[styles.calendarText, { color: theme.ui.primary }]}>
            {exporting ? t("week.exportPdfBusy", { defaultValue: "Generando..." }) : t("week.exportPdf", { defaultValue: "Exportar PDF" })}
          </Text>
        </Pressable>
      </View>
      <PrintPlanModal visible={printHtml !== null} html={printHtml} onClose={() => setPrintHtml(null)} />

      <ScrollView contentContainerStyle={styles.content}>
        {days.map((date) => {
          const parsed = fromISODate(date);
          const locale = i18n.language.startsWith("en") ? "en-US" : "es-CL";
          const weekday = parsed
            .toLocaleDateString(locale, { weekday: "short" })
            .replace(".", "")
            .trim();
          const dayLabel = `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${parsed.getDate()}`;

          const rows = MEAL_TYPES.map((meal) => {
            const slotEntries = entriesBySlot.get(`${date}|${meal.key}`) ?? [];
            const primary = slotEntries[0];
            const recipe = primary?.recipeId ? recipeMap.get(primary.recipeId) : null;
            const baseText = recipe?.title ?? primary?.customText ?? t("week.empty");
            const member = primary?.forMember ? memberMap.get(primary.forMember) : null;
            const memberSuffix = member ? ` · ${member.emoji ?? ""} ${member.name}`.trim() : "";
            const extraSuffix = slotEntries.length > 1 ? ` (+${slotEntries.length - 1})` : "";
            return {
              mealType: meal.key,
              mealLabel: t(`meal.${meal.key}`),
              mealIcon: MEAL_ICONS[meal.key],
              valueText: `${baseText}${memberSuffix}${extraSuffix}`,
              hasContent: slotEntries.length > 0,
              isFavorite: recipe ? favoriteIds.has(recipe.id) : false,
              recipeId: primary?.recipeId ?? null,
              forMember: primary?.forMember ?? DEFAULT_HOUSEHOLD_MEMBER_ID,
            };
          });

          return (
            <DayPlanCard
              key={date}
              dayLabel={dayLabel}
              emptyLabel={t("week.empty")}
              addLabel={t("week.add")}
              editLabel={t("week.edit")}
              rows={rows}
              onPressRow={(mealType) => {
                const selectedRow = rows.find((row) => row.mealType === mealType);
                setSelectedSlot({
                  date,
                  mealType,
                  recipeId: selectedRow?.recipeId ?? null,
                  forMember: selectedRow?.forMember ?? DEFAULT_HOUSEHOLD_MEMBER_ID,
                });
                setSlotModalVisible(true);
              }}
            />
          );
        })}
      </ScrollView>

      <SlotActionModal
        visible={slotModalVisible}
        hasRecipe={Boolean(selectedSlot?.recipeId)}
        members={householdMembers}
        selectedMemberId={selectedSlot?.forMember ?? DEFAULT_HOUSEHOLD_MEMBER_ID}
        onSelectMember={(id) => setSelectedSlot((prev) => (prev ? { ...prev, forMember: id } : prev))}
        onClose={() => setSlotModalVisible(false)}
        onChooseRecipe={() => {
          setSlotModalVisible(false);
          setSelectorVisible(true);
        }}
        onSaveText={async (text) => {
          if (!selectedSlot) return;
          await assignTextToSlot(selectedSlot.date, selectedSlot.mealType, text, selectedSlot.forMember);
          setSlotModalVisible(false);
        }}
        onDelete={async () => {
          if (!selectedSlot) return;
          await clearSlot(selectedSlot.date, selectedSlot.mealType, selectedSlot.forMember);
          setSlotModalVisible(false);
        }}
        onViewRecipe={() => {
          if (!selectedSlot?.recipeId) return;
          setSlotModalVisible(false);
          navigation.navigate("RecipeDetail", { recipeId: selectedSlot.recipeId });
        }}
        onManageMembers={() => {
          setSlotModalVisible(false);
          navigation.navigate("HouseholdMembers");
        }}
      />
      <RecipeSelectorModal
        visible={selectorVisible}
        recipes={localizedRecipes}
        favoriteIds={favoriteIds}
        onClose={() => setSelectorVisible(false)}
        onCreateRecipe={() => {
          setSelectorVisible(false);
          setCreateRecipeVisible(true);
        }}
        onPickRecipe={async (recipeId) => {
          if (!selectedSlot) return;
          await assignRecipeToSlot(selectedSlot.date, selectedSlot.mealType, recipeId, selectedSlot.forMember);
          setSelectorVisible(false);
        }}
      />
      <CreateRecipeModal
        visible={createRecipeVisible}
        onClose={() => setCreateRecipeVisible(false)}
        onCreate={async (input) => {
          const id = await createQuickRecipe(input);
          setCreateRecipeVisible(false);
          if (selectedSlot) {
            await assignRecipeToSlot(selectedSlot.date, selectedSlot.mealType, id, selectedSlot.forMember);
          }
        }}
      />
      <Modal visible={calendarVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
              <Pressable
                style={styles.iconButton}
                onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
              >
                <Ionicons name="chevron-back" size={16} color="#1E2A38" />
              </Pressable>
              <Text style={styles.calendarTitle}>
                {t("week.calendarTitle")}
              </Text>
              <Pressable
                style={styles.iconButton}
                onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
              >
                <Ionicons name="chevron-forward" size={16} color="#1E2A38" />
              </Pressable>
            </View>
            <Text style={styles.calendarMonthLabel}>
              {calendarMonth.toLocaleDateString(i18n.language.startsWith("en") ? "en-US" : "es-CL", { month: "long", year: "numeric" })}
            </Text>
            <View style={styles.calendarWeekRow}>
              {[
                t("week.weekdayMinMon"),
                t("week.weekdayMinTue"),
                t("week.weekdayMinWed"),
                t("week.weekdayMinThu"),
                t("week.weekdayMinFri"),
                t("week.weekdayMinSat"),
                t("week.weekdayMinSun"),
              ].map((w, idx) => (
                <Text key={`${w}-${idx}`} style={styles.calendarWeekLabel}>
                  {w}
                </Text>
              ))}
            </View>
            <View style={styles.calendarGrid}>
              {calendarDays.map((day) => {
                const inMonth = day.getMonth() === calendarMonth.getMonth();
                const iso = toISODate(day);
                const selected = iso >= weekStartDate && iso <= toISODate(addDays(new Date(`${weekStartDate}T00:00:00`), 6));
                const hasMenu = plannedDates.has(iso);
                return (
                  <Pressable
                    key={iso}
                    style={[
                      styles.dayCell,
                      hasMenu && [styles.dayCellPlanned, { backgroundColor: theme.ui.softTint }],
                      selected && [styles.dayCellSelected, { backgroundColor: theme.ui.primary }],
                    ]}
                    onPress={() => void pickDate(day)}
                  >
                    <Text style={[styles.dayText, !inMonth && styles.dayTextMuted, selected && styles.dayTextSelected]}>
                      {day.getDate()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable style={[styles.calendarClose, { backgroundColor: theme.ui.primary }]} onPress={() => setCalendarVisible(false)}>
              <Text style={styles.calendarCloseText}>{t("common.close")}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F7FB" },
  calendarRow: {
    paddingHorizontal: 18,
    marginBottom: 2,
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  calendarButton: {
    borderWidth: 1,
    borderColor: "#D6E3F2",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  calendarText: { color: "#1E2A38", fontWeight: "600" },
  content: { paddingHorizontal: 18, paddingBottom: 24 },
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(15,23,42,0.32)" },
  calendarCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 14,
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#EEF2F7",
    alignItems: "center",
    justifyContent: "center",
  },
  calendarTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A", textTransform: "capitalize" },
  calendarMonthLabel: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
    textTransform: "capitalize",
  },
  calendarWeekRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  calendarWeekLabel: {
    width: "14%",
    textAlign: "center",
    color: "#64748B",
    fontWeight: "700",
    fontSize: 12,
  },
  calendarGrid: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 8,
  },
  dayCell: {
    width: "14%",
    aspectRatio: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCellSelected: {
    backgroundColor: "#1E2A38",
  },
  dayCellPlanned: {
    backgroundColor: "#E8F0FF",
  },
  dayText: { color: "#111827", fontWeight: "600" },
  dayTextMuted: { color: "#CBD5E1" },
  dayTextSelected: { color: "#fff" },
  calendarClose: {
    marginTop: 12,
    alignSelf: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: "#1E2A38",
  },
  calendarCloseText: { color: "#fff", fontWeight: "700" },
});
