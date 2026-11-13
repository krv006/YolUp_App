import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import type { AssignmentCopy } from "@/shared/types";
import { DsText, dsRadius, Icon, useDs } from "@/shared/ui";
import { formatDue } from "./format-due";

export interface BankCopiesProps {
  copies: AssignmentCopy[];
  onOpen: (id: string) => void;
}

/**
 * "Berilgan guruhlar" — veb `bank-copies.tsx` (`compact`): bazadagi vazifa
 * berilgan har guruh nusxasi (muddat, nechta topshirgani, butun guruh yoki
 * tanlangan o'quvchilar); bosilsa shu nusxa ochiladi.
 */
export function BankCopies({ copies, onOpen }: BankCopiesProps) {
  const { t } = useTranslation("homework");
  const ds = useDs();
  const months = useTranslation("lesson").t("list.months", { returnObjects: true }) as string[];
  if (!copies.length) return null;

  return (
    // `gap-1 rounded-xl bg-surface p-2`
    <View style={[styles.root, { backgroundColor: ds.c.surface }]}>
      <DsText v="title-sm" style={styles.title}>
        {t("bank.copiesTitle", { count: copies.length })}
      </DsText>
      {copies.map((copy) => (
        <Pressable
          key={copy.id}
          accessibilityRole="button"
          onPress={() => onOpen(copy.id)}
          style={({ pressed }) => [styles.row, pressed && { backgroundColor: ds.c.subtle }]}
        >
          <View style={[styles.icon, { backgroundColor: ds.c["brand-subtle"] }]}>
            <Icon name={copy.studentIds ? "person" : "groups"} size={20} color={ds.c.brand} />
          </View>
          <View style={styles.body}>
            <DsText v="title-sm" numberOfLines={1}>
              {copy.courseTitle || t("bank.copyNoGroup")}
            </DsText>
            <DsText v="body-xs" c="ink-secondary" numberOfLines={1}>
              {[
                copy.dueAt
                  ? t("bank.copyDue", { date: formatDue(copy.dueAt, months) })
                  : t("bank.copyNoDue"),
                t("bank.copySubmitted", { count: copy.submissionsCount }),
              ].join(" · ")}
            </DsText>
            <DsText v="caption" c="ink-tertiary" numberOfLines={1}>
              {copy.studentIds
                ? t("bank.copyStudents", { count: copy.studentIds.length })
                : t("bank.copyWholeGroup")}
            </DsText>
          </View>
          <Icon name="chevron-right" size={18} color={ds.c["icon-tertiary"]} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 4, padding: 8, borderRadius: dsRadius.xl },
  /* `px-3 pt-2 pb-1` */
  title: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4 },
  /* `gap-3 rounded-md px-3 py-2.5` */
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: dsRadius.md,
  },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  body: { flex: 1, minWidth: 0, gap: 2 },
});
