import Ionicons from "@react-native-vector-icons/ionicons";
import { Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { LEGAL_URLS } from "../constants/appConstants";
import { APP_THEMES } from "../constants/themes";
import { RootStackParamList } from "../navigation/types";
import { setAppLanguage } from "../services/localStorage";
import { useAppStore } from "../store/useAppStore";

export const SettingsScreen = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const premium = useAppStore((s) => s.premium);
  const themeId = useAppStore((s) => s.appThemeId);
  const setAppTheme = useAppStore((s) => s.setAppTheme);
  const selectedTheme = APP_THEMES.find((t) => t.id === themeId) ?? APP_THEMES[0];

  const getThemeName = (id: string, fallback: string) => t(`settings.themeNames.${id}`, { defaultValue: fallback });
  const getThemeSubtitle = (id: string, fallback: string) => t(`settings.themeSubtitles.${id}`, { defaultValue: fallback });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: selectedTheme.ui.screenBg }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topSpace} />
        <View style={[styles.heroCard, { borderColor: selectedTheme.ui.border, backgroundColor: selectedTheme.ui.card }]}>
          <View style={[styles.heroOrbA, { backgroundColor: selectedTheme.colors[2] }]} />
          <View style={styles.heroOrbB} />
          <Text style={styles.heroEyebrow}>{t("settings.controlCenter")}</Text>
          <Text style={styles.title}>{t("settings.title")}</Text>
          <Text style={styles.subtitle}>{t("settings.subtitle")}</Text>
        </View>

        <View
          style={[
            styles.premiumCard,
            { borderColor: selectedTheme.ui.border, backgroundColor: selectedTheme.ui.card },
            premium.isPremium && styles.premiumCardActive,
          ]}
        >
          <View style={styles.premiumTopRow}>
            <View style={styles.premiumIconWrap}>
              <Text style={styles.premiumIcon}>{premium.isPremium ? "💎" : "⭐"}</Text>
            </View>
            <View style={[styles.premiumStatusPill, premium.isPremium && styles.premiumStatusPillActive]}>
              <Text style={[styles.premiumStatusText, premium.isPremium && styles.premiumStatusTextActive]}>
                {premium.isPremium ? t("settings.premium.badgePremium") : t("settings.premium.badgeBestValue")}
              </Text>
            </View>
          </View>
          <Text style={styles.premiumTitle}>
            {premium.isPremium ? t("settings.premium.planActive") : t("settings.premium.planCurrentFree")}
          </Text>
          <View style={styles.planBlock}>
            <Text style={styles.planTitle}>{t("settings.premium.freeTitle")}</Text>
            <Text style={styles.planItem}>{t("settings.premium.free1")}</Text>
            <Text style={styles.planItem}>{t("settings.premium.free2")}</Text>
            <Text style={styles.planItem}>{t("settings.premium.free3")}</Text>
            <Text style={styles.planItem}>{t("settings.premium.free4")}</Text>
            <Text style={styles.planItem}>{t("settings.premium.free5")}</Text>
          </View>
          <View style={[styles.planBlock, styles.planBlockPremium]}>
            <Text style={styles.planTitle}>{t("settings.premium.premiumTitle")}</Text>
            <Text style={styles.planItem}>{t("settings.premium.premium1")}</Text>
            <Text style={styles.planItem}>{t("settings.premium.premium2")}</Text>
            <Text style={styles.planItem}>{t("settings.premium.premium3")}</Text>
            <Text style={styles.planItem}>{t("settings.premium.premium4")}</Text>
            <Text style={styles.planItem}>{t("settings.premium.premium5")}</Text>
            <Text style={styles.planItem}>{t("settings.premium.premium6")}</Text>
          </View>
          {!premium.isPremium ? (
            <Pressable
              style={[styles.premiumButton, { backgroundColor: selectedTheme.ui.primary }]}
              onPress={() => navigation.navigate("Paywall")}
              accessibilityRole="button"
              accessibilityLabel={t("settings.premium.upgrade")}
            >
              <Text style={styles.premiumButtonText}>{t("settings.premium.upgrade")}</Text>
            </Pressable>
          ) : (
            <View style={styles.activeBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#0F766E" />
              <Text style={styles.activeBadgeText}>{t("settings.premium.active")}</Text>
            </View>
          )}
        </View>

        <View style={[styles.sectionCard, { borderColor: selectedTheme.ui.border, backgroundColor: selectedTheme.ui.card }]}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="language-outline" size={16} color="#1E2A38" />
            <Text style={styles.sectionTitle}>{t("settings.languageTitle")}</Text>
          </View>
          <Text style={styles.sectionSubtitle}>{t("settings.languageSubtitle")}</Text>
          <View style={styles.languageRow}>
            <Pressable
              style={[styles.languagePill, i18n.language.startsWith("es") && styles.languagePillActive]}
              onPress={() => {
                void i18n.changeLanguage("es");
                void setAppLanguage("es");
              }}
              accessibilityRole="button"
              accessibilityLabel={t("settings.spanish")}
              accessibilityState={{ selected: i18n.language.startsWith("es") }}
            >
              <Text style={[styles.languageText, i18n.language.startsWith("es") && styles.languageTextActive]}>{t("settings.spanish")}</Text>
            </Pressable>
            <Pressable
              style={[styles.languagePill, i18n.language.startsWith("en") && styles.languagePillActive]}
              onPress={() => {
                void i18n.changeLanguage("en");
                void setAppLanguage("en");
              }}
              accessibilityRole="button"
              accessibilityLabel={t("settings.english")}
              accessibilityState={{ selected: i18n.language.startsWith("en") }}
            >
              <Text style={[styles.languageText, i18n.language.startsWith("en") && styles.languageTextActive]}>{t("settings.english")}</Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.sectionCard, { borderColor: selectedTheme.ui.border, backgroundColor: selectedTheme.ui.card }]}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="color-palette-outline" size={16} color="#1E2A38" />
            <Text style={styles.sectionTitle}>{t("settings.themesTitle")}</Text>
          </View>
          <Text style={styles.sectionSubtitle}>{t("settings.themesSubtitle")}</Text>
          <View style={styles.themesGrid}>
            {APP_THEMES.map((theme) => {
              const selected = themeId === theme.id;
              return (
                <Pressable
                  key={theme.id}
                  style={[styles.themeCard, selected && styles.themeCardSelected, selected && { borderColor: selectedTheme.colors[0] }]}
                  onPress={() => {
                    void setAppTheme(theme.id);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={getThemeName(theme.id, theme.name)}
                  accessibilityState={{ selected }}
                >
                  <View style={styles.themeSwatches}>
                    <View style={[styles.swatch, { backgroundColor: theme.colors[0] }]} />
                    <View style={[styles.swatch, { backgroundColor: theme.colors[1] }]} />
                    <View style={[styles.swatch, { backgroundColor: theme.colors[2] }]} />
                  </View>
                  <Text style={styles.themeName}>{getThemeName(theme.id, theme.name)}</Text>
                  <Text style={styles.themeSubtitle}>{getThemeSubtitle(theme.id, theme.subtitle)}</Text>
                  {selected ? (
                    <View style={[styles.themeBadge, { backgroundColor: selectedTheme.colors[0] }]}>
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={[styles.sectionCard, { borderColor: selectedTheme.ui.border, backgroundColor: selectedTheme.ui.card }]}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="people-outline" size={16} color="#1E2A38" />
            <Text style={styles.sectionTitle}>{t("members.title", { defaultValue: "Miembros del hogar" })}</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            {t("members.subtitle", {
              defaultValue:
                "Crea perfiles para que cada uno tenga su propia comida en el plan: util cuando el bebe come distinto, o para apartar la colacion del cole.",
            })}
          </Text>
          <Pressable
            style={[styles.legalLinkPill, { alignSelf: "flex-start", marginTop: 10 }]}
            onPress={() => navigation.navigate("HouseholdMembers")}
            accessibilityRole="button"
            accessibilityLabel={t("members.openFromSettings", { defaultValue: "Gestionar miembros" })}
          >
            <Text style={styles.legalLinkText}>{t("members.openFromSettings", { defaultValue: "Gestionar miembros" })}</Text>
          </Pressable>
        </View>

        <View style={[styles.sectionCard, { borderColor: selectedTheme.ui.border, backgroundColor: selectedTheme.ui.card }]}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="document-text-outline" size={16} color="#1E2A38" />
            <Text style={styles.sectionTitle}>{t("settings.legalTitle")}</Text>
          </View>
          <Text style={styles.sectionSubtitle}>{t("settings.legalSubtitle")}</Text>
          <View style={styles.legalLinksRow}>
            <Pressable
              style={styles.legalLinkPill}
              onPress={() =>
                LEGAL_URLS.privacyPolicy
                  ? void Linking.openURL(LEGAL_URLS.privacyPolicy)
                  : navigation.navigate("LegalDocument", { kind: "privacy" })
              }
              accessibilityRole="link"
              accessibilityLabel={t("settings.privacy")}
            >
              <Text style={styles.legalLinkText}>{t("settings.privacy")}</Text>
            </Pressable>
            <Pressable
              style={styles.legalLinkPill}
              onPress={() =>
                LEGAL_URLS.terms
                  ? void Linking.openURL(LEGAL_URLS.terms)
                  : navigation.navigate("LegalDocument", { kind: "terms" })
              }
              accessibilityRole="link"
              accessibilityLabel={t("settings.terms")}
            >
              <Text style={styles.legalLinkText}>{t("settings.terms")}</Text>
            </Pressable>
            <Pressable
              style={styles.legalLinkPill}
              onPress={() => void Linking.openURL(LEGAL_URLS.manageSubscriptions)}
              accessibilityRole="link"
              accessibilityLabel={t("settings.manageSubs")}
            >
              <Text style={styles.legalLinkText}>{t("settings.manageSubs")}</Text>
            </Pressable>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F8FA", paddingHorizontal: 24, paddingTop: 16 },
  content: { paddingBottom: 32, gap: 16, paddingHorizontal: 4 },
  topSpace: { height: 12 },
  heroCard: {
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginHorizontal: 0,
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  heroOrbA: {
    position: "absolute",
    right: -28,
    top: -26,
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: "#DBEAFE",
    opacity: 0.7,
  },
  heroOrbB: {
    position: "absolute",
    right: 46,
    top: -36,
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "#FDE68A",
    opacity: 0.45,
  },
  heroEyebrow: {
    fontSize: 11,
    letterSpacing: 1.6,
    fontWeight: "700",
    color: "#64748B",
  },
  title: { fontSize: 38, fontWeight: "800", color: "#0F172A", lineHeight: 42, marginTop: 4 },
  subtitle: { marginTop: 4, fontSize: 14, color: "#475467", maxWidth: "78%" },
  premiumCard: {
    backgroundColor: "#FEFEFF",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E5EAF2",
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginHorizontal: 0,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  premiumCardActive: {
    backgroundColor: "#EFFAF4",
    borderColor: "#B7E7CF",
  },
  premiumTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  premiumIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  premiumIcon: { fontSize: 16 },
  premiumStatusPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#FCD34D",
    backgroundColor: "#FFFBEB",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  premiumStatusPillActive: {
    borderColor: "#86EFAC",
    backgroundColor: "#ECFDF5",
  },
  premiumStatusText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#B45309",
    letterSpacing: 0.2,
  },
  premiumStatusTextActive: {
    color: "#047857",
  },
  premiumTitle: { fontSize: 31, fontWeight: "800", color: "#0F172A", lineHeight: 35 },
  planBlock: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#E5EAF2",
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 5,
  },
  planBlockPremium: {
    backgroundColor: "#F0F9FF",
    borderColor: "#BFDBFE",
  },
  planTitle: { fontSize: 13, fontWeight: "800", color: "#0F172A" },
  planItem: { fontSize: 13, color: "#334155", lineHeight: 18 },
  premiumButton: {
    marginTop: 14,
    alignSelf: "flex-start",
    backgroundColor: "#12314E",
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 5 },
    elevation: 1,
  },
  premiumButtonText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  activeBadge: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    backgroundColor: "#ECFDF5",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  activeBadgeText: { color: "#0F766E", fontWeight: "700", fontSize: 13 },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E6EAF0",
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 0,
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { color: "#0F172A", fontWeight: "700", fontSize: 16 },
  sectionSubtitle: { marginTop: 6, color: "#667085", fontSize: 13 },
  themesGrid: { marginTop: 10, flexDirection: "row", flexWrap: "wrap", gap: 10 },
  themeCard: {
    width: "47%",
    borderWidth: 1,
    borderColor: "#DDE5F0",
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 10,
    paddingVertical: 10,
    position: "relative",
  },
  themeCardSelected: {
    borderColor: "#2D5FA0",
    backgroundColor: "#EFF6FF",
  },
  themeSwatches: { flexDirection: "row", gap: 6, marginBottom: 8 },
  swatch: { width: 18, height: 18, borderRadius: 999 },
  themeName: { color: "#0F172A", fontWeight: "700", fontSize: 13 },
  themeSubtitle: { color: "#64748B", fontSize: 11, marginTop: 2 },
  themeBadge: {
    position: "absolute",
    right: 8,
    top: 8,
    width: 18,
    height: 18,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2D5FA0",
  },
  languageRow: {
    marginTop: 10,
    flexDirection: "row",
    gap: 8,
  },
  languagePill: {
    borderWidth: 1,
    borderColor: "#DDE5F0",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  languagePillActive: {
    borderColor: "#2D5FA0",
    backgroundColor: "#EFF6FF",
  },
  languageText: {
    color: "#334155",
    fontWeight: "700",
    fontSize: 13,
  },
  languageTextActive: {
    color: "#123B70",
  },
  legalLinksRow: {
    marginTop: 10,
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  legalLinkPill: {
    borderWidth: 1,
    borderColor: "#DDE5F0",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  legalLinkText: {
    color: "#1D4ED8",
    fontWeight: "700",
    fontSize: 12,
  },
});
