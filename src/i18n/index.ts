import i18n from "i18next";
import * as RNLocalize from "react-native-localize";
import { initReactI18next } from "react-i18next";
import en from "../locales/en.json";
import es from "../locales/es.json";
import { getAppLanguage } from "../services/localStorage";

export type SupportedLanguage = "es" | "en";

const resources = {
  es: { translation: es },
  en: { translation: en },
};

const normalizeLanguage = (raw?: string | null): SupportedLanguage => {
  if (!raw) return "es";
  const lower = raw.toLowerCase();
  return lower.startsWith("en") ? "en" : "es";
};

export const initI18n = async (): Promise<void> => {
  if (i18n.isInitialized) return;
  const stored = await getAppLanguage();
  const fallbackLocale = RNLocalize.getLocales?.()?.[0]?.languageTag ?? "es";
  const lng = normalizeLanguage(stored ?? fallbackLocale);

  await i18n.use(initReactI18next).init({
    resources,
    lng,
    fallbackLng: "es",
    compatibilityJSON: "v4",
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
};

export default i18n;
