import Ionicons from "@react-native-vector-icons/ionicons";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { GroceryDisplayItem } from "../types/models";
import { buildGroceryShareText, shareGroceryList } from "../services/shareGrocery";

type Props = {
  visible: boolean;
  items: GroceryDisplayItem[];
  weekRangeLabel: string;
  title: string;
  onClose: () => void;
};

const QR_MAX_LENGTH = 1200;

export const ShareGroceryModal = ({ visible, items, weekRangeLabel, title, onClose }: Props) => {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  const text = useMemo(() => buildGroceryShareText({ items, weekRangeLabel, title }), [items, weekRangeLabel, title]);

  const qrValue = useMemo(() => {
    if (text.length <= QR_MAX_LENGTH) return text;
    return text.slice(0, QR_MAX_LENGTH - 3) + "...";
  }, [text]);

  const truncated = text.length > QR_MAX_LENGTH;

  const onShare = async () => {
    try {
      setBusy(true);
      await shareGroceryList({ items, weekRangeLabel, title });
    } catch {
      // ignored — Share API surfaces its own UI feedback
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.handle} />
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>{t("share.title", { defaultValue: "Compartir lista" })}</Text>
            <Text style={styles.subtitle}>
              {t("share.subtitle", {
                defaultValue: "Manda la lista por WhatsApp, mail o pasale el QR a tu pareja para que la vea.",
              })}
            </Text>

            <View style={styles.qrCard}>
              {items.length > 0 ? (
                <View style={styles.qrInner} accessible accessibilityLabel={t("share.qrA11y", { defaultValue: "Codigo QR" })}>
                  <QRCode value={qrValue} size={200} />
                </View>
              ) : (
                <Text style={styles.qrEmpty}>
                  {t("share.empty", { defaultValue: "Tu lista esta vacia. Agrega ingredientes o productos manuales." })}
                </Text>
              )}
              {truncated ? (
                <Text style={styles.qrNote}>
                  {t("share.qrTruncated", {
                    defaultValue: "El QR muestra parte del texto porque la lista es larga. Usa el boton para enviar la versi\u00f3n completa.",
                  })}
                </Text>
              ) : (
                <Text style={styles.qrNote}>
                  {t("share.qrHint", { defaultValue: "Escanea con la camara para leer la lista como texto." })}
                </Text>
              )}
            </View>

            <View style={styles.previewBox}>
              <Text style={styles.previewLabel}>{t("share.previewLabel", { defaultValue: "Texto a compartir" })}</Text>
              <Text style={styles.previewText} numberOfLines={6}>
                {text}
              </Text>
            </View>

            <Pressable
              style={[styles.shareBtn, (busy || items.length === 0) && styles.shareBtnDisabled]}
              disabled={busy || items.length === 0}
              onPress={() => void onShare()}
              accessibilityRole="button"
              accessibilityLabel={t("share.shareCta", { defaultValue: "Compartir" })}
            >
              <Ionicons name="share-social-outline" size={18} color="#FFFFFF" />
              <Text style={styles.shareBtnText}>
                {busy
                  ? t("share.sharing", { defaultValue: "Enviando..." })
                  : t("share.shareCta", { defaultValue: "Compartir" })}
              </Text>
            </Pressable>

            <Pressable
              style={styles.closeBtn}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t("common.close")}
            >
              <Text style={styles.closeText}>{t("common.close")}</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(15,23,42,0.32)", justifyContent: "flex-end" },
  container: {
    backgroundColor: "#F8FAFC",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 18,
    maxHeight: "90%",
  },
  handle: { width: 38, height: 4, borderRadius: 999, backgroundColor: "#D0D5DD", alignSelf: "center", marginBottom: 8 },
  scroll: { paddingBottom: 12, gap: 12 },
  title: { fontSize: 22, fontWeight: "800", color: "#101828" },
  subtitle: { fontSize: 13, color: "#6B7280", lineHeight: 18 },
  qrCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    alignItems: "center",
    gap: 10,
  },
  qrInner: { padding: 8, backgroundColor: "#FFFFFF", borderRadius: 12 },
  qrEmpty: { color: "#6B7280", fontStyle: "italic" },
  qrNote: { fontSize: 12, color: "#475467", textAlign: "center", lineHeight: 16 },
  previewBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 12,
  },
  previewLabel: { fontSize: 12, fontWeight: "700", color: "#475467", marginBottom: 4 },
  previewText: { fontSize: 12, color: "#1F2937", lineHeight: 18 },
  shareBtn: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: "#0F766E",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  shareBtnDisabled: { opacity: 0.5 },
  shareBtnText: { color: "#FFFFFF", fontWeight: "800", fontSize: 14 },
  closeBtn: {
    minHeight: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAECF0",
  },
  closeText: { color: "#344054", fontWeight: "600", fontSize: 14 },
});
