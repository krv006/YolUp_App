import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import type { MessageAssignment } from "@/shared/types";
import { DsText, dsRadius, Icon, useDs } from "@/shared/ui";
import { AssignmentDetailSheet } from "./assignment-detail-sheet";

export interface HomeworkMessageCardProps {
  assignment: MessageAssignment;
  canReview?: boolean;
  /** O'quvchi uchun topshirgan/topshirmaganligi (`null` — noma'lum). */
  submitted?: boolean | null;
  /** Berilsa tugma vazifani shu yo'l bilan ochadi (aks holda natijalar oynasi). */
  onOpen?: () => void;
}

/**
 * Chatdagi vazifa kartasi — veb `homework-message-card.tsx` ning tor ekran
 * (`compact`) varianti: `max-w-75 rounded-xl bg-surface p-4 gap-3`, sariq
 * belgi, qolgan kun yorlig'i, topshirganlar soni, progress chizig'i va
 * `bg-brand-subtle` tugma.
 */
export function HomeworkMessageCard({ assignment, canReview = false, submitted = null, onOpen }: HomeworkMessageCardProps) {
  const { t } = useTranslation("homework");
  const ds = useDs();
  const [open, setOpen] = useState(false);
  const [now] = useState(() => Date.now());

  const due = assignment.dueAt ? new Date(assignment.dueAt) : null;
  const left = due && !Number.isNaN(due.getTime()) ? Math.ceil((due.getTime() - now) / (24 * 60 * 60 * 1000)) : null;
  const progress = assignment.totalCount
    ? Math.min(100, Math.round((assignment.submittedCount / assignment.totalCount) * 100))
    : 0;

  return (
    <>
      <View style={[styles.card, { backgroundColor: ds.c.surface }]}>
        <View style={styles.head}>
          <View style={[styles.icon, { backgroundColor: ds.c["accent-saffron-bg"] }]}>
            <Icon name="assign" size={22} color={ds.c["accent-saffron-fg"]} />
          </View>
          <View style={styles.grow}>
            <DsText v="caption" c="ink-secondary" style={styles.upper}>
              {t("chatCard.label")}
            </DsText>
            <DsText v="title" numberOfLines={1}>
              {assignment.title}
            </DsText>
          </View>
        </View>

        <View style={styles.row}>
          {left !== null ? (
            <View style={[styles.badge, { backgroundColor: left < 0 ? ds.c["error-bg"] : ds.c["accent-teal-bg"] }]}>
              <Icon name="clock" size={14} color={left < 0 ? ds.c["error-text"] : ds.c["accent-teal-fg"]} />
              <DsText v="caption-strong" c={left < 0 ? "error-text" : "accent-teal-fg"}>
                {left < 0 ? t("chatCard.overdue") : t("chatCard.daysLeft", { count: left })}
              </DsText>
            </View>
          ) : null}
          {submitted !== null ? (
            <DsText v="body-xs" c="ink-secondary" style={styles.aside}>
              {submitted ? t("chatCard.submitted") : t("chatCard.notSubmitted")}
            </DsText>
          ) : assignment.totalCount ? (
            <DsText v="body-xs" c="ink-secondary" style={styles.aside}>
              {t("messageCard.submitted", { done: assignment.submittedCount, total: assignment.totalCount })}
            </DsText>
          ) : null}
        </View>

        <View style={[styles.track, { backgroundColor: ds.c.subtle }]}>
          <View style={[styles.bar, { width: `${progress}%`, backgroundColor: ds.c.brand }]} />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => (onOpen ? onOpen() : setOpen(true))}
          style={({ pressed }) => [styles.button, { backgroundColor: pressed ? ds.c.tint : ds.c["brand-subtle"] }]}
        >
          <DsText v="button" c="brand">
            {onOpen ? t("chatCard.open") : canReview ? t("messageCard.review") : t("chatCard.submit")}
          </DsText>
        </Pressable>
      </View>

      <AssignmentDetailSheet assignmentId={assignment.id} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  card: { alignSelf: "center", width: "100%", maxWidth: 300, gap: 12, padding: 16, borderRadius: dsRadius.xl },
  head: { flexDirection: "row", alignItems: "center", gap: 12 },
  icon: { width: 40, height: 40, borderRadius: dsRadius.lg, alignItems: "center", justifyContent: "center" },
  upper: { textTransform: "uppercase" },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  badge: { height: 24, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, borderRadius: 12 },
  aside: { marginLeft: "auto" },
  track: { height: 6, overflow: "hidden", borderRadius: 3 },
  bar: { height: "100%", borderRadius: 3 },
  button: { height: 44, alignItems: "center", justifyContent: "center", paddingHorizontal: 16, borderRadius: 22 },
});
