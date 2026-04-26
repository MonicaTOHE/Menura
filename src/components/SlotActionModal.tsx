import Ionicons from "@react-native-vector-icons/ionicons";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { DEFAULT_HOUSEHOLD_MEMBER_ID } from "../constants/appConstants";
import { HouseholdMember } from "../types/models";

type Props = {
  visible: boolean;
  hasRecipe: boolean;
  members: HouseholdMember[];
  selectedMemberId: string;
  onSelectMember: (id: string) => void;
  onClose: () => void;
  onChooseRecipe: () => void;
  onSaveText: (text: string) => void;
  onDelete: () => void;
  onViewRecipe: () => void;
  onManageMembers: () => void;
};

export const SlotActionModal = ({
  visible,
  hasRecipe,
  members,
  selectedMemberId,
  onSelectMember,
  onClose,
  onChooseRecipe,
  onSaveText,
  onDelete,
  onViewRecipe,
  onManageMembers,
}: Props) => {
  const { t } = useTranslation();
  const [text, setText] = useState("");

  useEffect(() => {
    if (!visible) setText("");
  }, [visible]);

  const showMemberRow = members.length > 0;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.handle} />
          <Text style={styles.title}>{t("slotAction.title")}</Text>
          <Text style={styles.subtitle}>{t("slotAction.subtitle")}</Text>

          {showMemberRow ? (
            <View style={styles.memberBlock}>
              <View style={styles.memberHeaderRow}>
                <Text style={styles.manualTitle}>{t("slotAction.forMemberTitle", { defaultValue: "Para quien" })}</Text>
                <Pressable
                  onPress={onManageMembers}
                  accessibilityRole="link"
                  accessibilityLabel={t("slotAction.manageMembers", { defaultValue: "Gestionar" })}
                >
                  <Text style={styles.memberManageLink}>{t("slotAction.manageMembers", { defaultValue: "Gestionar" })}</Text>
                </Pressable>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.memberRow}>
                <Pressable
                  style={[styles.memberChip, selectedMemberId === DEFAULT_HOUSEHOLD_MEMBER_ID && styles.memberChipActive]}
                  onPress={() => onSelectMember(DEFAULT_HOUSEHOLD_MEMBER_ID)}
                  accessibilityRole="button"
                  accessibilityLabel={t("slotAction.everyone", { defaultValue: "Todos" })}
                  accessibilityState={{ selected: selectedMemberId === DEFAULT_HOUSEHOLD_MEMBER_ID }}
                >
                  <Text style={styles.memberChipText}>👨‍👩‍👧 {t("slotAction.everyone", { defaultValue: "Todos" })}</Text>
                </Pressable>
                {members.map((member) => {
                  const active = selectedMemberId === member.id;
                  return (
                    <Pressable
                      key={member.id}
                      style={[
                        styles.memberChip,
                        active && styles.memberChipActive,
                        active && { backgroundColor: `${member.color}22`, borderColor: member.color },
                      ]}
                      onPress={() => onSelectMember(member.id)}
                      accessibilityRole="button"
                      accessibilityLabel={member.name}
                      accessibilityState={{ selected: active }}
                    >
                      <Text style={[styles.memberChipText, active && { color: member.color }]}>
                        {member.emoji ?? "•"} {member.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : (
            <Pressable
              style={styles.addMembersRow}
              onPress={onManageMembers}
              accessibilityRole="button"
              accessibilityLabel={t("slotAction.addMembersHint", { defaultValue: "Agrega miembros del hogar" })}
            >
              <View style={styles.actionLeft}>
                <View style={styles.iconBadge}>
                  <Ionicons name="people-outline" size={16} color="#1E2A38" />
                </View>
                <Text style={styles.actionLabel}>
                  {t("slotAction.addMembersHint", { defaultValue: "Agregar miembros del hogar" })}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </Pressable>
          )}

          <Pressable style={styles.actionRow} onPress={onChooseRecipe}>
            <View style={styles.actionLeft}>
              <View style={styles.iconBadge}>
                <Ionicons name="restaurant-outline" size={16} color="#1E2A38" />
              </View>
              <Text style={styles.actionLabel}>{t("slotAction.chooseRecipe")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </Pressable>

          <View style={styles.manualBlock}>
            <Text style={styles.manualTitle}>{t("slotAction.manualTitle")}</Text>
            <TextInput
              style={styles.input}
              placeholder={t("slotAction.manualPlaceholder")}
              placeholderTextColor="#9CA3AF"
              value={text}
              onChangeText={setText}
            />
          </View>
          <Pressable
            style={[styles.ctaButton, !text.trim() && styles.ctaButtonDisabled]}
            disabled={!text.trim()}
            onPress={() => {
              if (text.trim()) onSaveText(text.trim());
              setText("");
            }}
          >
            <Text style={styles.ctaText}>{t("slotAction.manualSave")}</Text>
          </Pressable>

          {hasRecipe ? (
            <Pressable style={styles.actionRow} onPress={onViewRecipe}>
              <View style={styles.actionLeft}>
                <View style={styles.iconBadge}>
                  <Ionicons name="book-outline" size={16} color="#1E2A38" />
                </View>
                <Text style={styles.actionLabel}>{t("slotAction.viewRecipe")}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </Pressable>
          ) : null}

          <Pressable style={styles.deleteRow} onPress={onDelete}>
            <View style={styles.actionLeft}>
              <View style={[styles.iconBadge, styles.iconBadgeDanger]}>
                <Ionicons name="trash-outline" size={16} color="#B42318" />
              </View>
              <Text style={styles.deleteText}>{t("slotAction.clearContent")}</Text>
            </View>
          </Pressable>

          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>{t("common.close")}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.32)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#F8FAFC",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 18,
    gap: 10,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#D0D5DD",
    alignSelf: "center",
    marginBottom: 2,
  },
  title: {
    fontWeight: "700",
    fontSize: 20,
    color: "#101828",
  },
  subtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: -4,
    marginBottom: 2,
  },
  actionRow: {
    minHeight: 52,
    borderRadius: 14,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E4E7EC",
  },
  actionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: "#EEF2F6",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBadgeDanger: {
    backgroundColor: "#FEE4E2",
  },
  actionLabel: {
    color: "#1E2A38",
    fontWeight: "600",
    fontSize: 15,
  },
  manualBlock: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E7EC",
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  manualTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475467",
  },
  input: {
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: 12,
    backgroundColor: "#FCFCFD",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#101828",
  },
  ctaButton: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: "#1E2A38",
    alignItems: "center",
    justifyContent: "center",
  },
  ctaButtonDisabled: {
    opacity: 0.45,
  },
  ctaText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  deleteRow: {
    minHeight: 52,
    borderRadius: 14,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  deleteText: {
    color: "#B42318",
    fontWeight: "600",
    fontSize: 15,
  },
  closeButton: {
    minHeight: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAECF0",
  },
  closeText: {
    color: "#344054",
    fontWeight: "600",
    fontSize: 14,
  },
  memberBlock: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E7EC",
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  memberHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  memberManageLink: {
    color: "#1D4ED8",
    fontSize: 13,
    fontWeight: "700",
  },
  memberRow: {
    paddingVertical: 4,
    gap: 8,
    flexDirection: "row",
  },
  memberChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D0D5DD",
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
  },
  memberChipActive: {
    borderColor: "#1D4ED8",
    backgroundColor: "#EFF6FF",
  },
  memberChipText: {
    color: "#1F2937",
    fontWeight: "700",
    fontSize: 13,
  },
  addMembersRow: {
    minHeight: 52,
    borderRadius: 14,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E4E7EC",
  },
});
