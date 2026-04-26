import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export const LoadingView = ({ text = "Cargando..." }: { text?: string }) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0f766e" />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  text: {
    color: "#444",
  },
});
