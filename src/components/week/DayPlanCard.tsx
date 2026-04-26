import { Pressable, StyleSheet, Text, View } from "react-native";
import { MealType } from "../../types/models";

type MealRowData = {
  mealType: MealType;
  mealLabel: string;
  mealIcon: string;
  valueText: string;
  hasContent: boolean;
  isFavorite: boolean;
};

type Props = {
  dayLabel: string;
  emptyLabel: string;
  addLabel: string;
  editLabel: string;
  rows: MealRowData[];
  onPressRow: (mealType: MealType) => void;
};

export const DayPlanCard = ({ dayLabel, emptyLabel, addLabel, editLabel, rows, onPressRow }: Props) => {
  const toneByMeal: Record<MealType, { accent: string; soft: string }> = {
    BREAKFAST: { accent: "#F59E0B", soft: "#FFF7E8" },
    SCHOOL_SNACK: { accent: "#0EA5E9", soft: "#E0F2FE" },
    LUNCH: { accent: "#14B8A6", soft: "#ECFDF8" },
    DINNER: { accent: "#6366F1", soft: "#EEF2FF" },
    SNACK: { accent: "#EC4899", soft: "#FDF2F8" },
  };

  return (
    <View style={styles.card}>
      <Text style={styles.dayTitle}>{dayLabel}</Text>
      <View style={styles.rowsContainer}>
        {rows.map((row) => {
          const tone = toneByMeal[row.mealType];
          return (
            <Pressable
              key={row.mealType}
              onPress={() => onPressRow(row.mealType)}
              style={[styles.row, row.hasContent ? { backgroundColor: tone.soft } : styles.rowEmpty]}
            >
              <View style={[styles.accentBar, { backgroundColor: tone.accent }]} />
              <View style={styles.leftBlock}>
                <Text style={styles.mealIcon}>{row.mealIcon}</Text>
                <Text style={styles.mealLabel}>{row.mealLabel}</Text>
              </View>
              <View style={styles.middleBlock}>
                <Text style={[styles.valueText, row.hasContent ? styles.valueTextFilled : styles.valueTextEmpty]} numberOfLines={1}>
                  {row.hasContent ? row.valueText : emptyLabel}
                </Text>
                {row.isFavorite ? <Text style={styles.favorite}>★</Text> : null}
              </View>
              <Text style={styles.actionText}>{row.hasContent ? editLabel : addLabel}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  dayTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#18212C",
  },
  rowsContainer: {
    marginTop: 12,
    gap: 12,
  },
  row: {
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#EEF2F6",
  },
  rowEmpty: {
    backgroundColor: "#FBFCFE",
  },
  accentBar: {
    width: 4,
    height: 28,
    borderRadius: 999,
    marginRight: 8,
  },
  leftBlock: {
    flexDirection: "row",
    alignItems: "center",
    width: 112,
    gap: 6,
  },
  mealIcon: {
    fontSize: 15,
  },
  mealLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  middleBlock: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginHorizontal: 8,
  },
  valueText: {
    fontSize: 14,
    flex: 1,
    letterSpacing: 0.1,
  },
  valueTextEmpty: {
    color: "#98A2B3",
    fontWeight: "500",
    fontStyle: "italic",
  },
  valueTextFilled: {
    color: "#0B2942",
    fontWeight: "700",
    fontSize: 14,
  },
  favorite: {
    color: "#F59E0B",
    fontSize: 12,
    marginTop: -1,
  },
  actionText: {
    color: "#1E2A38",
    fontSize: 13,
    fontWeight: "700",
  },
});
