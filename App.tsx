import { useEffect, useState } from "react";
import { Platform, Pressable, Text, TextInput } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SystemBars } from "react-native-edge-to-edge";
import { LoadingView } from "./src/components/LoadingView";
import i18n, { initI18n } from "./src/i18n";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { useAppStore } from "./src/store/useAppStore";

const APP_FONT_FAMILY = Platform.select({
  android: "Manrope-Regular",
  ios: "Manrope-Regular",
  default: "Manrope-Regular, Inter, Segoe UI, sans-serif",
});

const TextAny = Text as unknown as { defaultProps?: { style?: unknown } };
const TextInputAny = TextInput as unknown as { defaultProps?: { style?: unknown } };

TextAny.defaultProps = TextAny.defaultProps || {};
TextAny.defaultProps.style = [TextAny.defaultProps.style, { fontFamily: APP_FONT_FAMILY }];

TextInputAny.defaultProps = TextInputAny.defaultProps || {};
TextInputAny.defaultProps.style = [TextInputAny.defaultProps.style, { fontFamily: APP_FONT_FAMILY }];

export default function App() {
  const [i18nReady, setI18nReady] = useState(false);
  const initialized = useAppStore((s) => s.initialized);
  const loading = useAppStore((s) => s.loading);
  const error = useAppStore((s) => s.error);
  const initialize = useAppStore((s) => s.initialize);

  useEffect(() => {
    void (async () => {
      await initI18n();
      setI18nReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!initialized && !loading && !error) {
      void initialize();
    }
  }, [initialized, loading, error, initialize]);

  if (!i18nReady || loading || !initialized) {
    if (error) {
      return (
        <SafeAreaProvider>
          <Text style={{ marginTop: 60, textAlign: "center", paddingHorizontal: 20 }}>{error}</Text>
          <Pressable
            onPress={() => void initialize()}
            style={{
              marginTop: 20,
              alignSelf: "center",
              backgroundColor: "#111827",
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>{i18n.t("common.retry")}</Text>
          </Pressable>
        </SafeAreaProvider>
      );
    }
    return (
      <SafeAreaProvider>
        <LoadingView text={i18nReady ? i18n.t("app.loadingInit") : i18n.t("app.loadingStyles")} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SystemBars style="dark" />
      <RootNavigator />
    </SafeAreaProvider>
  );
}
