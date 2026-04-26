import { APP_BRAND } from "../constants/appConstants";
import { HouseholdMember, MealPlanEntry, MealType, Recipe } from "../types/models";

type Labels = {
  title: string;
  weekRange: string;
  days: Record<number, string>; // 0 = Monday … 6 = Sunday
  meals: Record<MealType, string>;
  empty: string;
  member: string;
  generatedBy: string;
  notesLabel: string;
};

const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const MEAL_ORDER: MealType[] = ["BREAKFAST", "SCHOOL_SNACK", "LUNCH", "SNACK", "DINNER"];

export const buildPlanHtml = ({
  weekStartDate,
  weekDays,
  entries,
  recipes,
  members,
  labels,
}: {
  weekStartDate: string;
  weekDays: string[];
  entries: MealPlanEntry[];
  recipes: Recipe[];
  members: HouseholdMember[];
  labels: Labels;
}): string => {
  const recipeMap = new Map(recipes.map((r) => [r.id, r]));
  const memberMap = new Map(members.map((m) => [m.id, m]));

  const renderEntry = (entry: MealPlanEntry): string => {
    const recipe = entry.recipeId ? recipeMap.get(entry.recipeId) : null;
    const valueText = recipe ? recipe.title : entry.customText ?? "";
    const memberInfo = entry.forMember && memberMap.has(entry.forMember) ? memberMap.get(entry.forMember)! : null;
    const memberLabel = memberInfo
      ? `<span class="member" style="background:${escapeHtml(memberInfo.color)}22;color:${escapeHtml(memberInfo.color)}">${memberInfo.emoji ?? "•"} ${escapeHtml(memberInfo.name)}</span>`
      : "";
    const notesLine = entry.notes
      ? `<div class="notes"><strong>${escapeHtml(labels.notesLabel)}:</strong> ${escapeHtml(entry.notes)}</div>`
      : "";
    return `
      <div class="entry">
        <div class="entry-main">${escapeHtml(valueText)} ${memberLabel}</div>
        ${notesLine}
      </div>
    `;
  };

  const renderDay = (date: string, dayIndex: number) => {
    const dayLabel = labels.days[dayIndex] ?? date;
    const dateObj = new Date(`${date}T00:00:00`);
    const dateLabel = `${String(dateObj.getDate()).padStart(2, "0")}/${String(dateObj.getMonth() + 1).padStart(2, "0")}`;
    const dayEntries = entries.filter((entry) => entry.date === date);

    const rows = MEAL_ORDER.map((mealType) => {
      const slotEntries = dayEntries.filter((entry) => entry.mealType === mealType);
      if (slotEntries.length === 0) {
        return `<tr><th>${escapeHtml(labels.meals[mealType])}</th><td class="empty">${escapeHtml(labels.empty)}</td></tr>`;
      }
      const cells = slotEntries.map(renderEntry).join("");
      return `<tr><th>${escapeHtml(labels.meals[mealType])}</th><td>${cells}</td></tr>`;
    }).join("");

    return `
      <section class="day">
        <h2>${escapeHtml(dayLabel)} <small>${escapeHtml(dateLabel)}</small></h2>
        <table>
          <colgroup>
            <col style="width:28%" />
            <col style="width:72%" />
          </colgroup>
          <tbody>${rows}</tbody>
        </table>
      </section>
    `;
  };

  const dayBlocks = weekDays.map((date, index) => renderDay(date, index)).join("");

  return `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(labels.title)} — ${escapeHtml(weekStartDate)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #111827; padding: 28px; margin: 0; background: #FFFFFF; }
  header { border-bottom: 2px solid #0F766E; padding-bottom: 12px; margin-bottom: 16px; }
  header h1 { margin: 0; font-size: 22px; color: #0F766E; }
  header p { margin: 4px 0 0; color: #475467; font-size: 12px; }
  section.day { margin-bottom: 18px; page-break-inside: avoid; }
  section.day h2 { font-size: 16px; margin: 0 0 6px; color: #0F172A; }
  section.day h2 small { color: #6B7280; font-weight: 400; font-size: 12px; margin-left: 6px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { text-align: left; background: #F8FAFC; padding: 6px 8px; border: 1px solid #E5E7EB; font-weight: 700; color: #1F2937; vertical-align: top; }
  td { padding: 6px 8px; border: 1px solid #E5E7EB; vertical-align: top; }
  td.empty { color: #9CA3AF; font-style: italic; }
  .entry { padding: 2px 0; }
  .entry + .entry { border-top: 1px dashed #E5E7EB; padding-top: 4px; margin-top: 4px; }
  .entry-main { font-weight: 600; }
  .notes { font-size: 11px; color: #4B5563; margin-top: 2px; }
  .member { display: inline-block; padding: 1px 6px; border-radius: 999px; font-size: 10px; font-weight: 700; margin-left: 4px; }
  footer { margin-top: 18px; font-size: 10px; color: #9CA3AF; text-align: center; }
</style>
</head>
<body>
  <header>
    <h1>${escapeHtml(labels.title)}</h1>
    <p>${escapeHtml(labels.weekRange)}</p>
  </header>
  ${dayBlocks}
  <footer>${escapeHtml(labels.generatedBy)} ${escapeHtml(APP_BRAND)}</footer>
</body>
</html>`;
};

