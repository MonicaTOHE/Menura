import { useMemo, useState } from "react";
import { Alert, Linking, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { LEGAL_URLS } from "../constants/appConstants";
import { RootStackParamList } from "../navigation/types";
import { useAppStore } from "../store/useAppStore";
import { IapPendingError, IapUserCancelledError } from "../services/iapService";

type Props = NativeStackScreenProps<RootStackParamList, "Paywall">;

export const PaywallScreen = ({ navigation }: Props) => {
  const { t } = useTranslation();
  const premium = useAppStore((s) => s.premium);
  const iapCatalog = useAppStore((s) => s.iapCatalog);
  const buyMonthly = useAppStore((s) => s.buyMonthly);
  const buyLifetime = useAppStore((s) => s.buyLifetime);
  const restorePurchases = useAppStore((s) => s.restorePurchases);

  const [loading, setLoading] = useState(false);
  const monthlyPrice = iapCatalog?.monthly.price;
  const lifetimePrice = iapCatalog?.lifetime.price;

  const normalizedMonthlyPrice = useMemo(() => monthlyPrice ?? null, [monthlyPrice]);
  const normalizedLifetimePrice = useMemo(() => lifetimePrice ?? null, [lifetimePrice]);

  const purchasesAvailable = Platform.OS !== "web";

  const runAction = async (action: () => Promise<void>) => {
    try {
      setLoading(true);
      await action();
      Alert.alert(t("paywall.title"), t("paywall.updated"));
    } catch (error) {
      if (error instanceof IapUserCancelledError) {
        return;
      }
      if (error instanceof IapPendingError) {
        Alert.alert(t("paywall.title"), t("paywall.pending"));
        return;
      }
      const rawMessage = error instanceof Error ? error.message : "";
      const friendlyMessage =
        rawMessage === "IAP_UNAVAILABLE"
          ? t("paywall.unavailable")
          : rawMessage === "IAP_USER_CANCELLED"
            ? null
            : rawMessage === "IAP_PENDING"
              ? t("paywall.pending")
              : t("paywall.error");
      if (friendlyMessage) {
        Alert.alert(t("paywall.title"), friendlyMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const subscribeLabel = normalizedMonthlyPrice
    ? t("paywall.subscribe", { price: normalizedMonthlyPrice })
    : t("paywall.subscribePending");
  const lifetimeLabel = normalizedLifetimePrice
    ? t("paywall.oneTime", { price: normalizedLifetimePrice })
    : t("paywall.oneTimePending");

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title} accessibilityRole="header">
          {t("paywall.title")}
        </Text>
        <Text style={styles.subtitle}>{t("paywall.subtitle")}</Text>
        <View style={styles.featureBox}>
          <Text style={styles.featureText}>• {t("paywall.feature1")}</Text>
          <Text style={styles.featureText}>• {t("paywall.feature2")}</Text>
          <Text style={styles.featureText}>• {t("paywall.feature3")}</Text>
        </View>
        <View style={styles.disclosureBox} accessible accessibilityRole="text">
          <Text style={styles.disclosureTitle}>{t("paywall.disclosureTitle")}</Text>
          <Text style={styles.disclosureText}>
            {t("paywall.disclosureLine1", { price: normalizedMonthlyPrice ?? t("paywall.pricePending") })}
          </Text>
          <Text style={styles.disclosureText}>{t("paywall.disclosureLine2")}</Text>
          <Text style={styles.disclosureText}>{t("paywall.disclosureLine3")}</Text>
        </View>
        <View style={styles.stateBox}>
          <Text style={styles.stateText}>{t("paywall.status", { plan: premium.isPremium ? "PREMIUM" : "FREE" })}</Text>
        </View>
        {!purchasesAvailable ? (
          <View style={styles.webNoteBox}>
            <Text style={styles.webNoteText}>{t("paywall.webOnlyNote")}</Text>
          </View>
        ) : null}
        <Pressable
          style={[styles.primary, (!purchasesAvailable || loading) && styles.buttonDisabled]}
          disabled={loading || !purchasesAvailable}
          onPress={() => runAction(buyMonthly)}
          accessibilityRole="button"
          accessibilityLabel={subscribeLabel}
          accessibilityState={{ disabled: loading || !purchasesAvailable, busy: loading }}
        >
          <Text style={styles.btnText}>{subscribeLabel}</Text>
        </Pressable>
        <Pressable
          style={[styles.primary, (!purchasesAvailable || loading) && styles.buttonDisabled]}
          disabled={loading || !purchasesAvailable}
          onPress={() => runAction(buyLifetime)}
          accessibilityRole="button"
          accessibilityLabel={lifetimeLabel}
          accessibilityState={{ disabled: loading || !purchasesAvailable, busy: loading }}
        >
          <Text style={styles.btnText}>{lifetimeLabel}</Text>
        </Pressable>
        <Pressable
          style={[styles.secondary, (!purchasesAvailable || loading) && styles.buttonDisabled]}
          disabled={loading || !purchasesAvailable}
          onPress={() => runAction(restorePurchases)}
          accessibilityRole="button"
          accessibilityLabel={t("paywall.restore")}
          accessibilityState={{ disabled: loading || !purchasesAvailable, busy: loading }}
        >
          <Text style={styles.btnText}>{t("paywall.restore")}</Text>
        </Pressable>
        <View style={styles.linksRow}>
          <Pressable
            onPress={() => void Linking.openURL(LEGAL_URLS.manageSubscriptions)}
            accessibilityRole="link"
            accessibilityLabel={t("paywall.manageSubs")}
            style={styles.linkHit}
          >
            <Text style={styles.linkText}>{t("paywall.manageSubs")}</Text>
          </Pressable>
          <Pressable
            onPress={() =>
              LEGAL_URLS.privacyPolicy
                ? void Linking.openURL(LEGAL_URLS.privacyPolicy)
                : navigation.navigate("LegalDocument", { kind: "privacy" })
            }
            accessibilityRole="link"
            accessibilityLabel={t("paywall.privacy")}
            style={styles.linkHit}
          >
            <Text style={styles.linkText}>{t("paywall.privacy")}</Text>
          </Pressable>
          <Pressable
            onPress={() =>
              LEGAL_URLS.terms ? void Linking.openURL(LEGAL_URLS.terms) : navigation.navigate("LegalDocument", { kind: "terms" })
            }
            accessibilityRole="link"
            accessibilityLabel={t("paywall.terms")}
            style={styles.linkHit}
          >
            <Text style={styles.linkText}>{t("paywall.terms")}</Text>
          </Pressable>
        </View>
        <Pressable
          style={styles.close}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel={t("common.close")}
        >
          <Text style={styles.closeText}>{t("common.close")}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7f7" },
  scroll: { padding: 14, paddingBottom: 28 },
  title: { fontSize: 28, fontWeight: "800", color: "#0F172A" },
  subtitle: { marginTop: 8, color: "#1F2937", fontSize: 14, lineHeight: 20 },
  featureBox: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    backgroundColor: "#fff",
    padding: 10,
    gap: 6,
  },
  featureText: { color: "#1F2937", fontSize: 14, lineHeight: 20 },
  stateBox: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    backgroundColor: "#fff",
    padding: 10,
  },
  stateText: { fontWeight: "700", color: "#0F172A" },
  disclosureBox: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    padding: 12,
    gap: 4,
  },
  disclosureTitle: {
    fontWeight: "700",
    color: "#0F172A",
    fontSize: 14,
  },
  disclosureText: {
    color: "#1F2937",
    fontSize: 13,
    lineHeight: 18,
  },
  primary: {
    marginTop: 12,
    backgroundColor: "#0f766e",
    borderRadius: 10,
    paddingVertical: 14,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  secondary: {
    marginTop: 8,
    backgroundColor: "#1f2937",
    borderRadius: 10,
    paddingVertical: 14,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  webNoteBox: {
    marginTop: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    backgroundColor: "#EFF6FF",
    padding: 12,
  },
  webNoteText: {
    color: "#1E3A8A",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  linksRow: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  linkHit: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    minHeight: 44,
    justifyContent: "center",
  },
  linkText: {
    color: "#1D4ED8",
    fontWeight: "600",
    fontSize: 13,
  },
  close: { marginTop: 12, alignItems: "center", paddingVertical: 12, minHeight: 44, justifyContent: "center" },
  closeText: { color: "#0F172A", fontWeight: "600", fontSize: 14 },
});
