import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import type { Assignment } from "@/shared/types";
import { DsText, dsRadius, Icon, useDs } from "@/shared/ui";

export interface BankAssignmentCardProps {
  item: Assignment;
  onOpen: () => void;
  onGive: () => void;
}

/**
 * Bazadagi vazifa kartasi — veb `bank-assignment-card.tsx` (`compact`):
 * kitob belgisi, nom, savollar va nechta guruhga berilgani; o'ngda "Berish".
 */
export function BankAssignmentCard({ item, onOpen, onGive }: BankAssignmentCardProps) {
  const { t } = useTranslation("homework");
  const ds = useDs();
  const meta = [
    item.questionsCount ? t("bank.questions", { count: item.questionsCount }) : "",
    item.copiesCount ? t("bank.copies", { count: item.copiesCount }) : t("bank.notGiven"),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    // `gap-3 rounded-xl bg-surface p-4`
    <View style={[styles.card, { backgroundColor: ds.c.surface }]}>
      <View style={[styles.icon, { backgroundColor: ds.c["brand-subtle"] }]}>
        <Icon name="menu-book" size={20} color={ds.c.brand} />
      </View>
      <Pressable accessibilityRole="button" onPress={onOpen} style={styles.body}>
        <DsText v="title" numberOfLines={1}>
          {item.title}
        </DsText>
        <DsText v="body-xs" c="ink-tertiary" numberOfLines={1}>
          {meta}
        </DsText>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={onGive}
        style={({ pressed }) => [
          styles.give,
          { backgroundColor: pressed ? ds.c["brand-strong"] : ds.c.brand },
        ]}
      >
        <Icon name="send" size={16} color={ds.c["on-action"]} />
        <DsText v="button" c="on-action">
          {t("bank.give")}
        </DsText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: dsRadius.xl,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: dsRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, minWidth: 0, gap: 2 },
  /* `h-10 gap-1.5 rounded-full px-4` */
  give: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
});
