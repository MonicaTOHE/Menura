import Ionicons from "@react-native-vector-icons/ionicons";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { DEFAULT_HOUSEHOLD_MEMBER_ID, HOUSEHOLD_MEMBER_PRESETS } from "../constants/appConstants";
import { getThemeById } from "../constants/themes";
import { useAppStore } from "../store/useAppStore";
import { HouseholdMember } from "../types/models";

const COLORS = ["#2563EB", "#DB2777", "#F59E0B", "#10B981", "#7C3AED", "#EF4444", "#0EA5E9", "#F97316"];
const EMOJIS = ["🙂", "💞", "🧒", "👶", "👨‍👩‍👧", "🐶", "🐱", "👵", "👴", "🤰"];

const generateId = (): string => `member_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export const HouseholdMembersScreen = () => {
  const { t, i18n } = useTranslation();
  const themeId = useAppStore((s) => s.appThemeId);
  const theme = getThemeById(themeId);
  const members = useAppStore((s) => s.householdMembers);
  const saveMember = useAppStore((s) => s.saveHouseholdMember);
  const removeMember = useAppStore((s) => s.removeHouseholdMember);

  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [editing, setEditing] = useState<string | null>(null);

  const presetSuggestions = useMemo(() => {
    const usedNames = new Set(members.map((m) => m.name.toLowerCase()));
    return HOUSEHOLD_MEMBER_PRESETS.filter((preset) => !usedNames.has(preset.name.toLowerCase()));
  }, [members]);

  const reset = () => {
    setName("");
    setColor(COLORS[0]);
    setEmoji(EMOJIS[0]);
    setEditing(null);
  };

  const submit = async () => {
    const trimmed = name.trim();
    if (trimmed.length === 0) return;
    const member: HouseholdMember = {
      id: editing ?? generateId(),
      name: trimmed,
      color,
      emoji,
      createdAt: editing ? members.find((m) => m.id === editing)?.createdAt ?? new Date().toISOString() : new Date().toISOString(),
    };
    await saveMember(member);
    reset();
  };

  const startEdit = (member: HouseholdMember) => {
    setEditing(member.id);
    setName(member.name);
    setColor(member.color);
    setEmoji(member.emoji ?? EMOJIS[0]);
  };

  const confirmRemove = (member: HouseholdMember) => {
    if (member.id === DEFAULT_HOUSEHOLD_MEMBER_ID) return;
    const message = t("members.removeWarning", {
      defaultValue: "Se borrara este miembro y los slots asignados a el. Esta accion no se puede deshacer.",
    });
    Alert.alert(member.name, message, [
      { text: t("common.cancel", { defaultValue: "Cancelar" }), style: "cancel" },
      {
        text: t("common.remove", { defaultValue: "Eliminar" }),
        style: "destructive",
        onPress: async () => {
          await removeMember(member.id);
          if (editing === member.id) reset();
        },
      },
    ]);
  };

  const applyPreset = (preset: { name: string; color: string; emoji: string }) => {
    setName(preset.name);
    setColor(preset.color);
    setEmoji(preset.emoji);
  };

  const isEs = i18n.language.startsWith("es");

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.ui.screenBg }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Text style={styles.title}>{t("members.title", { defaultValue: "Miembros del hogar" })}</Text>
          <Text style={styles.subtitle}>
            {t("members.subtitle", {
              defaultValue:
                "Crea perfiles para que cada miembro tenga su propia comida en el plan: util cuando el bebe come distinto que tu, o para apartar la colacion del cole.",
            })}
          </Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>
            {editing ? t("members.editTitle", { defaultValue: "Editar miembro" }) : t("members.newTitle", { defaultValue: "Nuevo miembro" })}
          </Text>
          <Text style={styles.label}>{t("members.nameLabel", { defaultValue: "Nombre" })}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={isEs ? "Ej: Pia, Mateo, Bebe..." : "E.g. Pia, Matthew, Baby..."}
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            maxLength={24}
          />
          <Text style={styles.label}>{t("members.emojiLabel", { defaultValue: "Emoji" })}</Text>
          <View style={styles.row}>
            {EMOJIS.map((e) => (
              <Pressable
                key={e}
                onPress={() => setEmoji(e)}
                style={[styles.emojiPill, emoji === e && styles.emojiPillActive]}
                accessibilityRole="button"
                accessibilityLabel={e}
                accessibilityState={{ selected: emoji === e }}
              >
                <Text style={styles.emojiText}>{e}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.label}>{t("members.colorLabel", { defaultValue: "Color" })}</Text>
          <View style={styles.row}>
            {COLORS.map((c) => (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotActive]}
                accessibilityRole="button"
                accessibilityLabel={c}
                accessibilityState={{ selected: color === c }}
              />
            ))}
          </View>

          {presetSuggestions.length > 0 ? (
            <View style={styles.presetWrap}>
              <Text style={styles.label}>{t("members.suggestionsLabel", { defaultValue: "Sugerencias" })}</Text>
              <View style={styles.row}>
                {presetSuggestions.map((preset) => (
                  <Pressable
                    key={preset.name}
                    style={[styles.presetChip, { borderColor: preset.color }]}
                    onPress={() => applyPreset(preset)}
                    accessibilityRole="button"
                    accessibilityLabel={preset.name}
                  >
                    <Text style={[styles.presetChipText, { color: preset.color }]}>
                      {preset.emoji} {preset.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.formActions}>
            {editing ? (
              <Pressable
                style={[styles.secondaryBtn]}
                onPress={reset}
                accessibilityRole="button"
                accessibilityLabel={t("common.cancel", { defaultValue: "Cancelar" })}
              >
                <Text style={styles.secondaryBtnText}>{t("common.cancel", { defaultValue: "Cancelar" })}</Text>
              </Pressable>
            ) : null}
            <Pressable
              style={[styles.primaryBtn, { backgroundColor: theme.ui.primary }, name.trim().length === 0 && styles.disabled]}
              disabled={name.trim().length === 0}
              onPress={() => void submit()}
              accessibilityRole="button"
              accessibilityLabel={editing ? t("common.save", { defaultValue: "Guardar" }) : t("members.create", { defaultValue: "Agregar" })}
            >
              <Text style={styles.primaryBtnText}>
                {editing ? t("common.save", { defaultValue: "Guardar" }) : t("members.create", { defaultValue: "Agregar" })}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>{t("members.listTitle", { defaultValue: "Tus miembros" })}</Text>
          {members.length === 0 ? (
            <Text style={styles.empty}>
              {t("members.empty", {
                defaultValue: "Aun no agregaste miembros. Por defecto, todas las comidas son para 'Todos'.",
              })}
            </Text>
          ) : null}
          {members.map((member) => (
            <View key={member.id} style={[styles.memberRow, { borderColor: `${member.color}55` }]}>
              <View style={styles.memberLeft}>
                <View style={[styles.memberAvatar, { backgroundColor: `${member.color}22` }]}>
                  <Text style={[styles.memberEmoji, { color: member.color }]}>{member.emoji ?? "•"}</Text>
                </View>
                <Text style={styles.memberName}>{member.name}</Text>
              </View>
              <View style={styles.memberActions}>
                <Pressable
                  style={styles.iconHit}
                  onPress={() => startEdit(member)}
                  accessibilityRole="button"
                  accessibilityLabel={t("common.edit", { defaultValue: "Editar" })}
                >
                  <Ionicons name="create-outline" size={18} color="#1F2937" />
                </Pressable>
                <Pressable
                  style={styles.iconHit}
                  onPress={() => confirmRemove(member)}
                  accessibilityRole="button"
                  accessibilityLabel={t("common.remove", { defaultValue: "Eliminar" })}
                >
                  <Ionicons name="trash-outline" size={18} color="#B42318" />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 32, gap: 14 },
  heroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  title: { fontSize: 24, fontWeight: "800", color: "#0F172A" },
  subtitle: { marginTop: 6, fontSize: 13, color: "#475467", lineHeight: 18 },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  label: { fontSize: 12, fontWeight: "700", color: "#475467", marginTop: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#101828",
    minHeight: 44,
    backgroundColor: "#FCFCFD",
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  emojiPill: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D0D5DD",
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  emojiPillActive: { borderColor: "#1D4ED8", backgroundColor: "#EFF6FF" },
  emojiText: { fontSize: 18 },
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  colorDotActive: { borderColor: "#0F172A" },
  presetWrap: { marginTop: 6 },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: "#FFFFFF",
    minHeight: 36,
    justifyContent: "center",
  },
  presetChipText: { fontWeight: "700", fontSize: 13 },
  formActions: { flexDirection: "row", gap: 8, marginTop: 10, justifyContent: "flex-end" },
  primaryBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: "#0F766E",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: "#FFFFFF", fontWeight: "800" },
  secondaryBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: "#EAECF0",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: { color: "#1F2937", fontWeight: "700" },
  disabled: { opacity: 0.5 },
  empty: { fontSize: 13, color: "#6B7280", lineHeight: 18 },
  memberRow: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FCFCFD",
    minHeight: 56,
  },
  memberLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  memberEmoji: { fontSize: 16, fontWeight: "700" },
  memberName: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  memberActions: { flexDirection: "row", gap: 6 },
  iconHit: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#F4F6F9" },
});
