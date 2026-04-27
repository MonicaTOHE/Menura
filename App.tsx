import { useEffect, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SystemBars } from "react-native-edge-to-edge";
import { AppErrorBoundary } from "./src/components/AppErrorBoundary";
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

// Surface uncaught JS errors directly in the UI so we can diagnose without USB.
type ErrorUtilsLike = {
  setGlobalHandler?: (handler: (error: Error, isFatal?: boolean) => void) => void;
  getGlobalHandler?: () => (error: Error, isFatal?: boolean) => void;
};

let bootError: { message: string; stack?: string } | null = null;
let bootErrorListeners: Array<() => void> = [];
const setBootError = (next: { message: string; stack?: string } | null) => {
  bootError = next;
  bootErrorListeners.forEach((fn) => {
    try {
      fn();
    } catch {}
  });
};

const errorUtils = (globalThis as unknown as { ErrorUtils?: ErrorUtilsLike }).ErrorUtils;
if (errorUtils?.setGlobalHandler) {
  const previous = errorUtils.getGlobalHandler?.();
  errorUtils.setGlobalHandler((err) => {
    setBootError({ message: err?.message ?? String(err), stack: err?.stack });
    if (previous) {
      try {
        previous(err);
      } catch {}
    }
  });
}

export default function App() {
  const [, forceRerender] = useState(0);
  const [i18nReady, setI18nReady] = useState(false);
  const initialized = useAppStore((s) => s.initialized);
  const loading = useAppStore((s) => s.loading);
  const error = useAppStore((s) => s.error);
  const initialize = useAppStore((s) => s.initialize);

  useEffect(() => {
    const unsubscribe = () => undefined;
    bootErrorListeners.push(() => forceRerender((n) => n + 1));
    return () => {
      bootErrorListeners = bootErrorListeners.filter((fn) => fn !== unsubscribe);
    };
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await initI18n();
      } catch (err) {
        setBootError({
          message: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
        });
      } finally {
        setI18nReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!initialized && !loading && !error) {
      void initialize();
    }
  }, [initialized, loading, error, initialize]);

  if (bootError) {
    return (
      <SafeAreaProvider>
        <ScrollView contentContainerStyle={styles.errorScroll}>
          <Text style={styles.errorTitle}>Menura — error de arranque</Text>
          <Text style={styles.errorSubtitle}>{bootError.message}</Text>
          {bootError.stack ? <Text style={styles.errorStack}>{bootError.stack}</Text> : null}
        </ScrollView>
      </SafeAreaProvider>
    );
  }

  if (!i18nReady || loading || !initialized) {
    if (error) {
      return (
        <SafeAreaProvider>
          <View style={styles.errorScroll}>
            <Text style={styles.errorTitle}>{error}</Text>
            <Pressable onPress={() => void initialize()} style={styles.retryBtn}>
              <Text style={styles.retryBtnText}>{i18n.t("common.retry")}</Text>
            </Pressable>
          </View>
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
      <AppErrorBoundary>
        <RootNavigator />
      </AppErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  errorScroll: { padding: 20, paddingTop: 60, backgroundColor: "#FFF" },
  errorTitle: { fontSize: 16, fontWeight: "800", color: "#0F172A", marginBottom: 6 },
  errorSubtitle: { fontSize: 13, color: "#1F2937" },
  errorStack: {
    marginTop: 14,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    color: "#0F172A",
    fontSize: 11,
    lineHeight: 16,
    fontFamily: "monospace",
  },
  retryBtn: {
    marginTop: 20,
    alignSelf: "center",
    backgroundColor: "#111827",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: { color: "#FFF", fontWeight: "700" },
});
