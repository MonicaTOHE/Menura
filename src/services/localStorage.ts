import AsyncStorage from "@react-native-async-storage/async-storage";
import { v4 as uuidv4 } from "uuid";
import { STORAGE_KEYS } from "../constants/storageKeys";
import { PremiumState } from "../types/models";

export const getSeedImported = async (): Promise<boolean> => {
  const value = await AsyncStorage.getItem(STORAGE_KEYS.seedImported);
  return value === "1";
};

export const setSeedImported = async (): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEYS.seedImported, "1");
};

export const getOrCreateDeviceId = async (): Promise<string> => {
  const existing = await AsyncStorage.getItem(STORAGE_KEYS.deviceId);
  if (existing) return existing;
  const deviceId = uuidv4();
  await AsyncStorage.setItem(STORAGE_KEYS.deviceId, deviceId);
  return deviceId;
};

export const getCachedPremiumState = async (): Promise<PremiumState | null> => {
  const value = await AsyncStorage.getItem(STORAGE_KEYS.premiumStateCache);
  if (!value) return null;
  try {
    return JSON.parse(value) as PremiumState;
  } catch {
    return null;
  }
};

export const setCachedPremiumState = async (state: PremiumState): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEYS.premiumStateCache, JSON.stringify(state));
};

export const getOnboardingSeen = async (): Promise<boolean> => {
  const value = await AsyncStorage.getItem(STORAGE_KEYS.onboardingSeen);
  return value === "1";
};

export const setOnboardingSeen = async (): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEYS.onboardingSeen, "1");
};

export const getAppThemeId = async (): Promise<string> => {
  const value = await AsyncStorage.getItem(STORAGE_KEYS.appThemeId);
  return value || "oceano";
};

export const setAppThemeId = async (themeId: string): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEYS.appThemeId, themeId);
};

export const getAppLanguage = async (): Promise<"es" | "en" | null> => {
  const value = await AsyncStorage.getItem(STORAGE_KEYS.appLanguage);
  if (!value) return null;
  return value === "en" ? "en" : "es";
};

export const setAppLanguage = async (lang: "es" | "en"): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEYS.appLanguage, lang);
};
