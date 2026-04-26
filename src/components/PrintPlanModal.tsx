import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { WebView, type WebView as WebViewType } from "react-native-webview";

type Props = {
  visible: boolean;
  html: string | null;
  onClose: () => void;
};

/**
 * Renders the weekly-plan HTML in a hidden WebView and triggers the Android
 * Print Framework via window.print(). The system shows a native dialog with
 * "Save as PDF" / "Print" options. No Expo print API needed.
 */
export const PrintPlanModal = ({ visible, html, onClose }: Props) => {
  const { t } = useTranslation();
  const webViewRef = useRef<WebViewType | null>(null);
  const [printed, setPrinted] = useState(false);

  useEffect(() => {
    if (!visible) setPrinted(false);
  }, [visible]);

  if (!visible) return null;

  const injectedJs = `
    (function () {
      try {
        if (typeof window.print === 'function') {
          // Defer one frame so the print dialog opens after layout.
          window.requestAnimationFrame(function () { window.print(); });
        }
      } catch (e) {}
      true;
    })();
  `;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t("week.exportPdfTitle", { defaultValue: "Plan semanal" })}</Text>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t("common.close")}
            style={styles.closeBtn}
          >
            <Text style={styles.closeBtnText}>{t("common.close")}</Text>
          </Pressable>
        </View>
        <Text style={styles.helper}>
          {t("week.exportPdfHint", {
            defaultValue:
              "Te abriremos el dialogo de impresion del sistema. Elige 'Guardar como PDF' y comparte por WhatsApp, mail o Drive.",
          })}
        </Text>
        <View style={styles.webViewWrapper}>
          {html ? (
            <WebView
              ref={webViewRef}
              originWhitelist={["*"]}
              source={{ html }}
              injectedJavaScript={Platform.OS === "android" ? injectedJs : undefined}
              onLoadEnd={() => {
                if (printed) return;
                setPrinted(true);
                if (webViewRef.current && Platform.OS !== "android") {
                  webViewRef.current.injectJavaScript(injectedJs);
                }
              }}
              startInLoadingState
              javaScriptEnabled
              androidLayerType="software"
              style={styles.webView}
            />
          ) : null}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  title: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  closeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    borderRadius: 999,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
  helper: { fontSize: 12, color: "#475467", paddingHorizontal: 16, paddingVertical: 8 },
  webViewWrapper: { flex: 1, backgroundColor: "#FFFFFF" },
  webView: { flex: 1, backgroundColor: "#FFFFFF" },
});
