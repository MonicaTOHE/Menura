const DAY_MS = 24 * 60 * 60 * 1000;

export const toISODate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const fromISODate = (isoDate: string): Date => {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export const startOfWeekMonday = (date: Date): Date => {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  return copy;
};

export const addDays = (date: Date, days: number): Date => {
  return new Date(date.getTime() + days * DAY_MS);
};

export const getWeekDays = (weekStartDate: string): string[] => {
  const start = fromISODate(weekStartDate);
  return Array.from({ length: 7 }).map((_, idx) => toISODate(addDays(start, idx)));
};

export const formatWeekRange = (weekStartDate: string): string => {
  const start = fromISODate(weekStartDate);
  const end = addDays(start, 6);
  const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()}-${end.getDate()} ${monthNames[end.getMonth()]} ${end.getFullYear()}`;
  }
  return `${start.getDate()} ${monthNames[start.getMonth()]} - ${end.getDate()} ${monthNames[end.getMonth()]} ${end.getFullYear()}`;
};

export const formatWeekRangeNumeric = (weekStartDate: string): string => {
  const start = fromISODate(weekStartDate);
  const end = addDays(start, 6);
  const startY = start.getFullYear();
  const startM = String(start.getMonth() + 1).padStart(2, "0");
  const startD = String(start.getDate()).padStart(2, "0");
  const endY = end.getFullYear();
  const endM = String(end.getMonth() + 1).padStart(2, "0");
  const endD = String(end.getDate()).padStart(2, "0");
  return `${startD}/${startM}/${startY} - ${endD}/${endM}/${endY}`;
};

export const getWeekRangeNumericParts = (
  weekStartDate: string,
): { startLabel: string; endLabel: string } => {
  const start = fromISODate(weekStartDate);
  const end = addDays(start, 6);
  const startLabel = `${String(start.getDate()).padStart(2, "0")}/${String(start.getMonth() + 1).padStart(2, "0")}/${start.getFullYear()}`;
  const endLabel = `${String(end.getDate()).padStart(2, "0")}/${String(end.getMonth() + 1).padStart(2, "0")}/${end.getFullYear()}`;
  return { startLabel, endLabel };
};

export const getTodayWeekStart = (): string => toISODate(startOfWeekMonday(new Date()));
