const UNIT_MAP: Record<string, string> = {
  gramos: "g",
  gramo: "g",
  g: "g",
  kilo: "kg",
  kilos: "kg",
  kilogramo: "kg",
  kg: "kg",
  ml: "ml",
  mililitros: "ml",
  litro: "l",
  litros: "l",
  l: "l",
  unidad: "unidad",
  unidades: "unidad",
  un: "unidad",
  uds: "unidad",
};

export const removeAccents = (value: string): string =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export const normalizeText = (value: string): string => removeAccents(value.trim().toLowerCase());

export const normalizeUnit = (unit: string): string => {
  const normalized = normalizeText(unit);
  return UNIT_MAP[normalized] ?? normalized;
};

export const parseMaybeNumber = (value: string | number): number | null => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const normalized = value.replace(",", ".").trim();
  if (!normalized) return null;
  const asNumber = Number(normalized);
  return Number.isNaN(asNumber) ? null : asNumber;
};

export const normalizeIngredientKey = (name: string, unit: string): string => {
  return `${normalizeText(name)}|${normalizeUnit(unit)}`;
};
