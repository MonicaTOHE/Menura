import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LEGAL_DOCUMENTS } from "../constants/legalDocuments";
import { RootStackParamList } from "../navigation/types";
import { getThemeById } from "../constants/themes";
import { useAppStore } from "../store/useAppStore";
import { useTranslation } from "react-i18next";

type Props = NativeStackScreenProps<RootStackParamList, "LegalDocument">;

export const LegalDocumentScreen = ({ route }: Props) => {
  const { i18n } = useTranslation();
  const appThemeId = useAppStore((s) => s.appThemeId);
  const theme = getThemeById(appThemeId);
  const lang = i18n.language.startsWith("en") ? "en" : "es";
  const document = LEGAL_DOCUMENTS[lang][route.params.kind];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.ui.screenBg }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: theme.ui.card, borderColor: theme.ui.border }]}>
          <Text style={[styles.eyebrow, { color: theme.ui.primary }]}>{document.lastUpdated}</Text>
          <Text style={[styles.title, { color: theme.ui.text }]}>{document.title}</Text>
          <Text style={[styles.intro, { color: theme.ui.muted }]}>{document.intro}</Text>
        </View>

        {document.sections.map((section) => (
          <View key={section.heading} style={[styles.sectionCard, { backgroundColor: theme.ui.card, borderColor: theme.ui.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.ui.text }]}>{section.heading}</Text>
            {section.paragraphs.map((paragraph, index) => (
              <Text key={`${section.heading}-${index}`} style={[styles.paragraph, { color: theme.ui.muted }]}>
                {paragraph}
              </Text>
            ))}
          </View>
        ))}

        <View style={[styles.footerCard, { backgroundColor: theme.ui.cardAlt, borderColor: theme.ui.border }]}>
          <Text style={[styles.footerText, { color: theme.ui.muted }]}>{document.footer}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 28, gap: 14 },
  hero: {
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  eyebrow: { fontSize: 12, fontWeight: "700", letterSpacing: 0.3 },
  title: { marginTop: 6, fontSize: 28, lineHeight: 32, fontWeight: "800" },
  intro: { marginTop: 8, fontSize: 14, lineHeight: 21 },
  sectionCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  sectionTitle: { fontSize: 17, fontWeight: "800" },
  paragraph: { fontSize: 14, lineHeight: 21 },
  footerCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  footerText: { fontSize: 13, lineHeight: 19, fontWeight: "600" },
});
