import Ionicons from "@react-native-vector-icons/ionicons";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";

type Props = {
  startLabel: string;
  endLabel: string;
  kicker: string;
  fromLabel: string;
  toLabel: string;
  onPrevWeek: () => void;
  onNextWeek: () => void;
};

export const WeekHeader = ({ startLabel, endLabel, kicker, fromLabel, toLabel, onPrevWeek, onNextWeek }: Props) => {
  const { width } = useWindowDimensions();
  const compact = width < 390;

  return (
    <View style={styles.container}>
      <Pressable style={[styles.arrowButton, compact && styles.arrowButtonCompact]} onPress={onPrevWeek}>
        <Ionicons name="chevron-back" size={18} color="#1E2A38" />
      </Pressable>
      <View style={[styles.centerBlock, compact && styles.centerBlockCompact]}>
        <Text style={styles.kicker}>{kicker}</Text>
        <View style={[styles.rangePill, compact && styles.rangePillCompact]}>
          <View style={styles.dot} />
          <View style={styles.rangeColumns}>
            <View style={styles.rangeCol}>
              <Text style={styles.rangeMeta}>{fromLabel}</Text>
              <Text style={[styles.range, compact && styles.rangeCompact]} numberOfLines={1}>
                {startLabel}
              </Text>
            </View>
            <View style={styles.rangeDivider} />
            <View style={styles.rangeCol}>
              <Text style={styles.rangeMeta}>{toLabel}</Text>
              <Text style={[styles.range, compact && styles.rangeCompact]} numberOfLines={1}>
                {endLabel}
              </Text>
            </View>
          </View>
        </View>
      </View>
      <Pressable style={[styles.arrowButton, compact && styles.arrowButtonCompact]} onPress={onNextWeek}>
        <Ionicons name="chevron-forward" size={18} color="#1E2A38" />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 16,
  },
  arrowButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#EAF0F8",
    alignItems: "center",
    justifyContent: "center",
  },
  arrowButtonCompact: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  centerBlock: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginHorizontal: 10,
  },
  centerBlockCompact: {
    marginHorizontal: 6,
  },
  kicker: {
    fontSize: 10,
    letterSpacing: 1.1,
    color: "#64748B",
    fontWeight: "700",
  },
  rangePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: "#FDFEFF",
    shadowColor: "#0F172A",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
    width: "100%",
    maxWidth: 340,
    justifyContent: "center",
  },
  rangePillCompact: {
    paddingHorizontal: 8,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: "#14B8A6",
  },
  rangeColumns: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  rangeCol: {
    flex: 1,
    minWidth: 0,
  },
  rangeDivider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: "#EAECF0",
    marginHorizontal: 10,
  },
  range: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E2A38",
    fontVariant: ["tabular-nums"],
  },
  rangeCompact: {
    fontSize: 14,
  },
  rangeMeta: {
    fontSize: 11,
    color: "#667085",
    fontWeight: "600",
    marginBottom: 1,
  },
});
