import { Share } from "react-native";
import { APP_BRAND } from "../constants/appConstants";
import { GroceryDisplayItem } from "../types/models";

const groupByCategory = (items: GroceryDisplayItem[]): Record<string, GroceryDisplayItem[]> => {
  const groups: Record<string, GroceryDisplayItem[]> = {};
  items.forEach((item) => {
    const key = item.category || "Otros";
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });
  return groups;
};

export const buildGroceryShareText = ({
  items,
  weekRangeLabel,
  title,
}: {
  items: GroceryDisplayItem[];
  weekRangeLabel: string;
  title: string;
}): string => {
  if (items.length === 0) {
    return `${title}\n${weekRangeLabel}\n\n— —`;
  }
  const groups = groupByCategory(items);
  const sections = Object.entries(groups)
    .map(([category, list]) => {
      const lines = list
        .map((item) => {
          const qty = item.qtyText && item.qtyText.trim().length > 0 ? ` (${item.qtyText.trim()})` : "";
          return `  • ${item.displayName}${qty}`;
        })
        .join("\n");
      return `\n${category}\n${lines}`;
    })
    .join("\n");
  return `${title}\n${weekRangeLabel}\n${sections}\n\n— ${APP_BRAND}`;
};

export const shareGroceryList = async (params: Parameters<typeof buildGroceryShareText>[0]): Promise<void> => {
  const text = buildGroceryShareText(params);
  await Share.share({ message: text, title: params.title });
};
