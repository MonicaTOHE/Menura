import { Component, type ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

type Props = { children: ReactNode };
type State = { error: Error | null; info: string };

/**
 * Catches render-time errors anywhere below it and renders a visible message
 * instead of crashing the bundle. Useful while the app is being verified on
 * physical devices.
 */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: "" };

  static getDerivedStateFromError(error: Error): State {
    return { error, info: "" };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    this.setState({ error, info: info.componentStack ?? "" });
  }

  render() {
    if (this.state.error) {
      return (
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Menura — error de arranque</Text>
          <Text style={styles.subtitle}>
            La app cacho un error y lo muestra aca para poder diagnosticar sin USB.
          </Text>
          <View style={styles.box}>
            <Text style={styles.label}>Mensaje</Text>
            <Text style={styles.code}>{String(this.state.error?.message || this.state.error)}</Text>
          </View>
          {this.state.error.stack ? (
            <View style={styles.box}>
              <Text style={styles.label}>Stack</Text>
              <Text style={styles.code}>{this.state.error.stack}</Text>
            </View>
          ) : null}
          {this.state.info ? (
            <View style={styles.box}>
              <Text style={styles.label}>Componente</Text>
              <Text style={styles.code}>{this.state.info}</Text>
            </View>
          ) : null}
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 60, backgroundColor: "#FFF" },
  title: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  subtitle: { marginTop: 6, fontSize: 13, color: "#475467" },
  box: {
    marginTop: 14,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F8FAFC",
  },
  label: { fontSize: 11, fontWeight: "800", color: "#64748B", letterSpacing: 0.5, marginBottom: 4 },
  code: { fontSize: 12, color: "#0F172A", lineHeight: 18, fontFamily: "monospace" },
});
