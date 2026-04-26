import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Ionicons from "@react-native-vector-icons/ionicons";
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { ShareGroceryModal } from "../components/ShareGroceryModal";
import { getThemeById } from "../constants/themes";
import { RootStackParamList } from "../navigation/types";
import { useAppStore } from "../store/useAppStore";
import { GroceryCategory, GroceryDisplayItem } from "../types/models";
import { addDays, formatWeekRangeNumeric, fromISODate, getTodayWeekStart, startOfWeekMonday, toISODate } from "../utils/date";
import { normalizeUnit } from "../utils/normalize";

const CATEGORY_ORDER: GroceryCategory[] = ["Verduras/Frutas", "Carnes", "Lacteos", "Abarrotes", "Especias", "Otros"];
const UNIT_OPTIONS = ["g", "kg", "unidad", "ml", "l"];
const CATEGORY_ICONS: Record<GroceryCategory, string> = {
  "Verduras/Frutas": "🥬",
  Carnes: "🥩",
  Lacteos: "🥛",
  Abarrotes: "🧺",
  Especias: "🧂",
  Otros: "📦",
};

type EditModalState = {
  visible: boolean;
  mode: "create" | "edit";
  source: "manual" | "generated";
  original?: GroceryDisplayItem;
  name: string;
  qty: string;
  unit: string;
  category: string;
};

const defaultModalState: EditModalState = {
  visible: false,
  mode: "create",
  source: "manual",
  name: "",
  qty: "",
  unit: "unidad",
  category: "",
};

export const GroceryListScreen = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const weekStartDate = useAppStore((s) => s.weekStartDate);
  const appThemeId = useAppStore((s) => s.appThemeId);
  const moveWeek = useAppStore((s) => s.moveWeek);
  const setWeekStartDate = useAppStore((s) => s.setWeekStartDate);
  const groceryChecks = useAppStore((s) => s.groceryChecks);
  const setGroceryItemChecked = useAppStore((s) => s.setGroceryItemChecked);
  const getGroceryDisplayListForRange = useAppStore((s) => s.getGroceryDisplayListForRange);
  const getShoppingPlannedDatesInRange = useAppStore((s) => s.getShoppingPlannedDatesInRange);
  const addManualItem = useAppStore((s) => s.addManualItem);
  const updateManualItem = useAppStore((s) => s.updateManualItem);
  const deleteManualItem = useAppStore((s) => s.deleteManualItem);
  const hideGeneratedItem = useAppStore((s) => s.hideGeneratedItem);

  const [calendarVisible, setCalendarVisible] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date(`${weekStartDate}T00:00:00`));
  const [items, setItems] = useState<GroceryDisplayItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalState, setModalState] = useState<EditModalState>(defaultModalState);
  const [shareVisible, setShareVisible] = useState(false);
  const todayWeekStart = getTodayWeekStart();
  const isCurrentWeek = weekStartDate === todayWeekStart;
  const [shoppingPlannedDates, setShoppingPlannedDates] = useState<Set<string>>(new Set());
  const theme = getThemeById(appThemeId);
  const refreshSeqRef = useRef(0);

  useEffect(() => {
    setCalendarMonth(new Date(`${weekStartDate}T00:00:00`));
  }, [weekStartDate]);

  const refresh = useCallback(async () => {
    const seq = ++refreshSeqRef.current;
    const targetWeek = weekStartDate;
    setLoading(true);
    const rangeStart = targetWeek;
    const rangeEnd = toISODate(addDays(new Date(`${targetWeek}T00:00:00`), 6));
    const nextItems = await getGroceryDisplayListForRange(rangeStart, rangeEnd, true);
    // Ignore stale async responses from previous weeks.
    if (seq !== refreshSeqRef.current) return;
    setItems(nextItems);
    setLoading(false);
  }, [getGroceryDisplayListForRange, weekStartDate]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const grouped = useMemo(() => {
    const map = new Map<string, GroceryDisplayItem[]>();
    CATEGORY_ORDER.forEach((cat) => map.set(cat, []));
    items.forEach((item) => {
      const key = item.category?.trim() || "Otros";
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    });
    Array.from(map.keys()).forEach((cat) => {
      const sorted = (map.get(cat) ?? []).sort((a, b) => {
        const aChecked = groceryChecks[a.itemKey] ? 1 : 0;
        const bChecked = groceryChecks[b.itemKey] ? 1 : 0;
        if (aChecked !== bChecked) return aChecked - bChecked;
        return a.displayName.localeCompare(b.displayName);
      });
      map.set(cat, sorted);
    });
    return map;
  }, [items, groceryChecks]);

  const categoryKeys = useMemo(() => {
    const fromItems = Array.from(grouped.keys());
    const standard = CATEGORY_ORDER.filter((cat) => fromItems.includes(cat));
    const custom = fromItems.filter((cat) => !CATEGORY_ORDER.includes(cat as GroceryCategory)).sort((a, b) => a.localeCompare(b));
    return [...standard, ...custom];
  }, [grouped]);

  const openCreateModal = () => {
    setModalState({
      ...defaultModalState,
      visible: true,
      mode: "create",
      source: "manual",
      category: "",
    });
  };

  const openEditModal = (item: GroceryDisplayItem) => {
    const qtySplit = item.qtyText.split(" ");
    const qty = qtySplit[0] ?? "";
    const unit = qtySplit.slice(1).join(" ") || item.unit || "unidad";
    setModalState({
      visible: true,
      mode: "edit",
      source: item.source,
      original: item,
      name: item.displayName,
      qty,
      unit: unit || "unidad",
      category: item.category || "",
    });
  };

  const closeModal = () => setModalState(defaultModalState);

  const saveModal = async () => {
    const name = modalState.name.trim();
    const qty = modalState.qty.trim();
    const unit = normalizeUnit(modalState.unit);
    if (!name || !qty) return;

    if (modalState.mode === "create") {
      await addManualItem({
        weekStartDate,
        name,
        qty,
        unit,
        category: modalState.category.trim() || null,
      });
      await refresh();
      closeModal();
      return;
    }

    const original = modalState.original;
    if (!original) return;

    if (original.source === "manual" && original.manualId) {
      await updateManualItem({
        id: original.manualId,
        weekStartDate,
        name,
        qty,
        unit,
        category: modalState.category.trim() || null,
      });
      await refresh();
      closeModal();
      return;
    }

    const originalGeneratedKey = original.itemKey.replace(/^gen:/, "");
    await hideGeneratedItem(weekStartDate, originalGeneratedKey);
    await addManualItem({
      weekStartDate,
      name,
      qty,
      unit,
      category: modalState.category.trim() || null,
    });
    await refresh();
    closeModal();
  };

  const deleteItem = async (item: GroceryDisplayItem) => {
    if (item.source === "manual" && item.manualId) {
      await deleteManualItem(item.manualId);
    } else {
      await hideGeneratedItem(weekStartDate, item.itemKey.replace(/^gen:/, ""));
    }
    await refresh();
  };

  const openShare = () => {
    setShareVisible(true);
  };

  const weekLabel = isCurrentWeek ? t("grocery.currentWeek") : t("grocery.selectedWeek");
  const rangeLabel = formatWeekRangeNumeric(weekStartDate);
  const categoryLabel = (category: string) => {
    if (category === "Verduras/Frutas") return t("grocery.catVerduras");
    if (category === "Carnes") return t("grocery.catCarnes");
    if (category === "Lacteos") return t("grocery.catLacteos");
    if (category === "Abarrotes") return t("grocery.catAbarrotes");
    if (category === "Especias") return t("grocery.catEspecias");
    if (category === "Otros") return t("grocery.catOtros");
    return category;
  };
  const categorySuggestions = [
    t("grocery.suggestionGroceries"),
    t("grocery.suggestionDairy"),
    t("grocery.suggestionVegetables"),
    t("grocery.suggestionMeats"),
    t("grocery.suggestionFrozen"),
    t("grocery.suggestionCleaning"),
  ];

  const monthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
  const monthEnd = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
  const startGrid = new Date(monthStart);
  startGrid.setDate(monthStart.getDate() - ((monthStart.getDay() + 6) % 7));
  const calendarDays = Array.from({ length: 42 }).map((_, idx) => {
    const d = new Date(startGrid);
    d.setDate(startGrid.getDate() + idx);
    return d;
  });

  useEffect(() => {
    if (!calendarVisible) return;
    const monthStartLocal = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const firstDay = new Date(monthStartLocal);
    firstDay.setDate(monthStartLocal.getDate() - ((monthStartLocal.getDay() + 6) % 7));
    const lastDay = new Date(firstDay);
    lastDay.setDate(firstDay.getDate() + 41);
    const first = toISODate(firstDay);
    const last = toISODate(lastDay);
    void (async () => {
      const planned = await getShoppingPlannedDatesInRange(first, last);
      setShoppingPlannedDates(planned);
    })();
  }, [calendarVisible, calendarMonth, weekStartDate, getShoppingPlannedDatesInRange]);

  const pickDate = async (date: Date) => {
    const monday = startOfWeekMonday(date);
    await setWeekStartDate(toISODate(monday));
    setCalendarVisible(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.ui.screenBg }]}>
      <View style={[styles.header, { backgroundColor: theme.ui.card, borderColor: theme.ui.border }]}>
        <View style={styles.titleBlock}>
          <View style={styles.titleRow}>
            <View style={[styles.titleAccent, { backgroundColor: theme.ui.secondary }]} />
            <Text style={[styles.title, { color: theme.ui.text }]}>{t("grocery.title")}</Text>
          </View>
          <Text style={[styles.subtitle, { color: theme.ui.muted }]}>{weekLabel}</Text>
          <Text style={[styles.range, { color: theme.ui.muted }]}>{rangeLabel}</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            style={styles.iconButton}
            onPress={openShare}
            accessibilityRole="button"
            accessibilityLabel={t("share.title", { defaultValue: "Compartir lista" })}
          >
            <Ionicons name="share-social-outline" size={18} color="#1E2A38" />
          </Pressable>
        </View>
      </View>
      <ShareGroceryModal
        visible={shareVisible}
        items={items}
        weekRangeLabel={rangeLabel}
        title={t("grocery.shareTitle")}
        onClose={() => setShareVisible(false)}
      />

      <View style={[styles.configCard, { backgroundColor: theme.ui.card, borderColor: theme.ui.border }]}>
        <View style={styles.weekNavRow}>
          <Text style={styles.weekNavLabel}>{t("grocery.changeWeek")}</Text>
          <View style={styles.weekNavShell}>
            <Pressable style={styles.weekArrowButton} onPress={() => moveWeek(-1)}>
              <Ionicons name="chevron-back" size={17} color="#0F2A4A" />
            </Pressable>
            <View style={styles.weekDivider} />
            <Pressable style={styles.weekArrowButton} onPress={() => moveWeek(1)}>
              <Ionicons name="chevron-forward" size={17} color="#0F2A4A" />
            </Pressable>
          </View>
        </View>
        <Pressable style={[styles.datePickerButton, { borderColor: theme.ui.border }]} onPress={() => setCalendarVisible(true)}>
          <Ionicons name="calendar-outline" size={16} color={theme.ui.primary} />
          <Text style={[styles.datePickerText, { color: theme.ui.primary }]}>{t("grocery.calendar")}</Text>
        </Pressable>
        <View style={styles.currentWeekRow}>
          <Pressable
            style={[
              styles.currentWeekButton,
              { borderColor: theme.ui.primary },
              isCurrentWeek && styles.currentWeekButtonActive,
              isCurrentWeek && { borderColor: theme.ui.secondary, backgroundColor: theme.ui.softTint },
            ]}
            onPress={() => setWeekStartDate(todayWeekStart)}
          >
            <Ionicons
              name={isCurrentWeek ? "checkmark-circle" : "calendar-outline"}
              size={14}
              color={isCurrentWeek ? "#0F766E" : "#1E2A38"}
            />
            <Text style={[styles.currentWeekButtonText, isCurrentWeek && styles.currentWeekButtonTextActive]}>
              {t("grocery.weekNowButton")}
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {items.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.ui.card, borderColor: theme.ui.border }]}>
            <View style={[styles.emptyIconWrap, { backgroundColor: theme.ui.softTint }]}>
              <Text style={styles.emptyEmoji}>🛒</Text>
            </View>
            <Text style={[styles.emptyTitle, { color: theme.ui.text }]}>{t("grocery.emptyTitle")}</Text>
            <Text style={[styles.emptySubtitle, { color: theme.ui.muted }]}>{t("grocery.emptySubtitle")}</Text>
            <Pressable style={[styles.emptyButton, { backgroundColor: theme.ui.primary }]} onPress={openCreateModal}>
              <Text style={styles.emptyButtonText}>{t("grocery.addProduct")}</Text>
            </Pressable>
          </View>
        ) : (
          categoryKeys.map((category) => {
            const list = grouped.get(category) ?? [];
            if (list.length === 0) return null;
            return (
              <View key={category} style={[styles.categoryCard, { backgroundColor: theme.ui.card, borderColor: theme.ui.border }]}>
                <Text style={styles.categoryTitle}>
                  {CATEGORY_ICONS[(category as GroceryCategory)] ?? "🧾"} {categoryLabel(category)}
                </Text>
                {list.map((item) => {
                  const checked = Boolean(groceryChecks[item.itemKey]);
                  return (
                    <View key={item.itemKey} style={[styles.itemRow, checked && styles.itemRowChecked]}>
                      <Pressable
                        style={styles.checkboxWrap}
                        onPress={() => void setGroceryItemChecked(weekStartDate, item.itemKey, !checked)}
                      >
                        <Text style={styles.checkbox}>{checked ? "☑" : "☐"}</Text>
                      </Pressable>
                      <Pressable style={styles.itemMain} onPress={() => openEditModal(item)}>
                        <Text style={[styles.itemName, checked && styles.itemDone]} numberOfLines={1}>
                          {item.source === "generated" ? "📘 " : ""}
                          {item.displayName}
                        </Text>
                        <Text style={[styles.itemQty, checked && styles.itemDone]}>{item.qtyText}</Text>
                      </Pressable>
                      <Pressable style={styles.deleteInline} onPress={() => void deleteItem(item)}>
                        <Ionicons name="trash-outline" size={16} color="#B42318" />
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            );
          })
        )}
      </ScrollView>

      <Pressable style={[styles.fab, { backgroundColor: theme.ui.primary }]} onPress={openCreateModal}>
        <Ionicons name="add" size={24} color="#fff" />
      </Pressable>

      <Modal visible={calendarVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
              <Pressable style={styles.iconButton} onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}>
                <Ionicons name="chevron-back" size={16} color="#1E2A38" />
              </Pressable>
                <Text style={styles.calendarTitle}>
                  {t("grocery.calendar")}
                </Text>
              <Pressable style={styles.iconButton} onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}>
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
                const hasShopping = shoppingPlannedDates.has(iso);
                return (
                  <Pressable
                    key={iso}
                    style={[
                      styles.dayCell,
                      hasShopping && [styles.dayCellPlanned, { backgroundColor: theme.ui.softTint }],
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

      <Modal visible={modalState.visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.ui.card, borderColor: theme.ui.border }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeaderRow}>
              <View style={[styles.modalIconWrap, { backgroundColor: theme.ui.softTint }]}>
                <Ionicons name="bag-add-outline" size={18} color={theme.ui.primary} />
              </View>
              <View style={styles.modalHeaderTextWrap}>
                <Text style={[styles.modalTitle, { color: theme.ui.text }]}>
                  {modalState.mode === "create" ? t("grocery.addProductTitle") : t("grocery.editProductTitle")}
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.ui.muted }]}>{t("grocery.autoSaveNote")}</Text>
              </View>
            </View>

            <Text style={[styles.modalLabel, { color: theme.ui.muted }]}>{t("grocery.product")}</Text>
            <TextInput
              style={[styles.modalInput, { borderColor: theme.ui.border, color: theme.ui.text }]}
              value={modalState.name}
              onChangeText={(name) => setModalState((prev) => ({ ...prev, name }))}
              placeholder={t("grocery.namePlaceholder")}
              placeholderTextColor="#98A2B3"
            />
            <Text style={[styles.modalLabel, { color: theme.ui.muted }]}>{t("grocery.qtyUnit")}</Text>
            <View style={styles.qtyRow}>
              <TextInput
                style={[styles.modalInput, styles.qtyInput, { borderColor: theme.ui.border, color: theme.ui.text }]}
                value={modalState.qty}
                onChangeText={(qty) => setModalState((prev) => ({ ...prev, qty }))}
                placeholder={t("grocery.qtyPlaceholder")}
                keyboardType="numeric"
                placeholderTextColor="#98A2B3"
              />
              <View style={styles.unitWrap}>
                {UNIT_OPTIONS.map((unit) => (
                  <Pressable
                    key={unit}
                    style={[
                      styles.unitPill,
                      { borderColor: theme.ui.border },
                      normalizeUnit(modalState.unit) === unit && [styles.unitPillActive, { backgroundColor: theme.ui.primary, borderColor: theme.ui.primary }],
                    ]}
                    onPress={() => setModalState((prev) => ({ ...prev, unit }))}
                  >
                    <Text
                      style={[
                        styles.unitText,
                        { color: theme.ui.muted },
                        normalizeUnit(modalState.unit) === unit && styles.unitTextActive,
                      ]}
                    >
                      {unit}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <Text style={[styles.modalLabel, { color: theme.ui.muted }]}>{t("grocery.category")}</Text>
            <TextInput
              style={[styles.modalInput, { borderColor: theme.ui.border, color: theme.ui.text }]}
              value={modalState.category}
              onChangeText={(category) => setModalState((prev) => ({ ...prev, category }))}
              placeholder={t("grocery.categoryPlaceholder")}
              placeholderTextColor="#98A2B3"
            />
            <View style={styles.categorySuggestionWrap}>
              {categorySuggestions.map((suggestion) => (
                <Pressable
                  key={suggestion}
                  style={[styles.categorySuggestionPill, { borderColor: theme.ui.border, backgroundColor: theme.ui.softTint }]}
                  onPress={() => setModalState((prev) => ({ ...prev, category: suggestion }))}
                >
                  <Text style={[styles.categorySuggestionText, { color: theme.ui.primary }]}>{suggestion}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalCancel, { borderColor: theme.ui.border }]} onPress={closeModal}>
                <Text style={styles.modalCancelText}>{t("common.cancel")}</Text>
              </Pressable>
              <Pressable style={[styles.modalSave, { backgroundColor: theme.ui.primary }]} onPress={() => void saveModal()}>
                <Text style={styles.modalSaveText}>{t("common.save")}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F8FA", paddingHorizontal: 20, paddingTop: 16 },
  header: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5EAF2",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  titleBlock: { flex: 1, marginRight: 10 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  titleAccent: {
    width: 6,
    height: 26,
    borderRadius: 999,
    backgroundColor: "#0EA5A4",
  },
  title: { fontSize: 30, fontWeight: "800", color: "#0F172A", flexShrink: 1 },
  subtitle: { fontSize: 13, color: "#64748B", marginTop: 4, marginLeft: 16 },
  range: { fontSize: 12, color: "#475467", marginTop: 2, marginLeft: 16 },
  headerActions: { flexDirection: "row", gap: 8 },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#EEF2F7",
    alignItems: "center",
    justifyContent: "center",
  },
  configCard: {
    marginTop: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 13,
    borderWidth: 1,
    borderColor: "#E6EAF0",
    marginHorizontal: 2,
  },
  weekNavRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  weekNavLabel: {
    color: "#344054",
    fontWeight: "600",
  },
  weekNavButtons: {
    flexDirection: "row",
    gap: 8,
  },
  weekNavShell: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D6E0EC",
    paddingHorizontal: 4,
    paddingVertical: 4,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  weekArrowButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  weekDivider: {
    width: 1,
    height: 16,
    backgroundColor: "#D6E0EC",
    marginHorizontal: 6,
  },
  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 3 },
  toggleLabel: { color: "#334155", fontWeight: "600" },
  datePickerButton: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#D5DDE7",
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  datePickerText: { color: "#1E2A38", fontWeight: "600" },
  currentWeekRow: {
    marginTop: 10,
    alignItems: "center",
  },
  currentWeekButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#1E2A38",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "#FFFFFF",
  },
  currentWeekButtonActive: {
    borderColor: "#10B981",
    backgroundColor: "#ECFDF5",
  },
  currentWeekButtonText: {
    color: "#1E2A38",
    fontSize: 12,
    fontWeight: "700",
  },
  currentWeekButtonTextActive: {
    color: "#0F766E",
  },
  input: {
    borderWidth: 1,
    borderColor: "#D5DDE7",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  smallAction: {
    alignSelf: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#1E2A38",
  },
  smallActionText: { color: "#fff", fontWeight: "700" },
  list: { marginTop: 14, flex: 1 },
  listContent: { paddingHorizontal: 2, paddingBottom: 96, gap: 12 },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E6EAF0",
    padding: 22,
    alignItems: "center",
  },
  emptyIconWrap: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#EEF4FB",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyEmoji: { fontSize: 34 },
  emptyTitle: { marginTop: 8, fontSize: 18, fontWeight: "700", color: "#111827" },
  emptySubtitle: { marginTop: 6, fontSize: 13, color: "#667085", textAlign: "center" },
  emptyButton: {
    marginTop: 14,
    backgroundColor: "#1E2A38",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  emptyButtonText: { color: "#fff", fontWeight: "700" },
  categoryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E6EAF0",
    padding: 13,
    marginHorizontal: 2,
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  categoryTitle: { fontSize: 17, fontWeight: "800", color: "#0F172A", marginBottom: 9 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "#EEF2F6",
    backgroundColor: "#FCFDFE",
  },
  itemRowChecked: { opacity: 0.55 },
  checkboxWrap: { paddingHorizontal: 4, paddingVertical: 2 },
  checkbox: { fontSize: 22 },
  itemMain: { flex: 1, marginLeft: 8 },
  itemName: { fontSize: 15, color: "#101828", fontWeight: "600" },
  itemQty: { marginTop: 3, fontSize: 13, color: "#667085" },
  itemDone: { textDecorationLine: "line-through" },
  deleteInline: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#FEE4E2",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 30,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#1E2A38",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.24,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
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
    backgroundColor: "#FFF4E8",
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
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "#E5EAF2",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    gap: 9,
  },
  modalHandle: {
    alignSelf: "center",
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#D6DEE9",
    marginBottom: 4,
  },
  modalHeaderRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  modalIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  modalHeaderTextWrap: { flex: 1 },
  modalTitle: { fontSize: 20, fontWeight: "700", color: "#0F172A" },
  modalSubtitle: { marginTop: 2, fontSize: 12, lineHeight: 16, color: "#64748B", fontWeight: "500" },
  modalLabel: { marginTop: 4, fontSize: 12, fontWeight: "700", letterSpacing: 0.2, color: "#667085" },
  modalInput: {
    borderWidth: 1,
    borderColor: "#D5DDE7",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  qtyRow: { gap: 8 },
  qtyInput: { marginBottom: 2 },
  unitWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  unitPill: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 6,
    backgroundColor: "#F8FAFC",
  },
  unitPillActive: { backgroundColor: "#1E2A38", borderColor: "#1E2A38" },
  unitText: { color: "#475467", fontWeight: "600" },
  unitTextActive: { color: "#fff", fontWeight: "700" },
  categorySuggestionWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 2 },
  categorySuggestionPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  categorySuggestionText: { fontSize: 12, fontWeight: "700" },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 4 },
  modalCancel: {
    borderWidth: 1,
    borderColor: "#D5DDE7",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  modalCancelText: { color: "#475467", fontWeight: "600" },
  modalSave: {
    backgroundColor: "#1E2A38",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  modalSaveText: { color: "#fff", fontWeight: "700" },
});
