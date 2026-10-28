import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import type { QuizAttemptSummary } from "@/shared/types";
import { Avatar, DsText, dsRadius, Icon, MobileScreenDialog, useDs, type DsColor } from "@/shared/ui";

export interface QuizAttemptsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  attempts: readonly QuizAttemptSummary[];
  students?: ReadonlyArray<{ id: string; name: string; avatarUrl?: string | null }>;
  studentCount?: number;
  loading?: boolean;
}

interface StudentRow {
  id: string;
  name: string;
  avatarUrl?: string | null;
  attempts: QuizAttemptSummary[];
  best: number | null;
  last: string | null;
}

function percent(attempt: QuizAttemptSummary): number | null {
  return attempt.maxScore ? Math.round((attempt.score / attempt.maxScore) * 100) : null;
}

/**
 * Urinishlar — veb `quiz-attempts-drawer.tsx` ning tor ekran varianti
 * (to'liq ekranli oyna): test nomi, uchta katak (urinishlar, o'rtacha,
 * yechganlar), o'quvchilar ro'yxati (eng yaxshi natija); o'quvchi bosilsa
 * pastda uning urinishlari tarixi.
 */
export function QuizAttemptsDrawer({ open, onOpenChange, title, subtitle, attempts, students = [], studentCount = 0, loading = false }: QuizAttemptsDrawerProps) {
  const { t } = useTranslation("quiz");
  const { t: tl } = useTranslation("lesson");
  const ds = useDs();
  const months = tl("list.months", { returnObjects: true }) as string[];
  const [expanded, setExpanded] = useState<string | null>(null);

  const rows = useMemo<StudentRow[]>(() => {
    const map = new Map<string, StudentRow>();
    for (const attempt of attempts) {
      const current = map.get(attempt.studentId) ?? { id: attempt.studentId, name: attempt.studentName, attempts: [], best: null, last: null };
      const value = percent(attempt);
      current.attempts.push(attempt);
      current.best = current.best === null ? value : Math.max(current.best, value ?? 0);
      current.last = !current.last || attempt.createdAt > current.last ? attempt.createdAt : current.last;
      map.set(attempt.studentId, current);
    }
    return [...map.values()].sort((a, b) => (b.best ?? -1) - (a.best ?? -1));
  }, [attempts]);

  const average = rows.length ? Math.round(rows.reduce((sum, row) => sum + (row.best ?? 0), 0) / rows.length) : null;
  const listed: StudentRow[] = [
    ...rows.map((row) => ({ ...row, avatarUrl: students.find((item) => item.id === row.id)?.avatarUrl })),
    ...students
      .filter((student) => !rows.some((row) => row.id === student.id))
      .map((student) => ({ id: student.id, name: student.name, avatarUrl: student.avatarUrl, attempts: [], best: null, last: null })),
  ];
  const detail = listed.find((row) => row.id === expanded && row.attempts.length) ?? null;

  function dateLabel(value: string, withTime: boolean) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const clock = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    const day = `${date.getDate()}-${(months[date.getMonth()] ?? "").slice(0, 3).toLowerCase()}`;
    return withTime ? `${day}, ${clock}` : day;
  }

  function lastLabel(value: string) {
    const date = new Date(value);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return t("attemptsDrawer.lastToday", { time: dateLabel(value, true).split(", ")[1] ?? "" });
    if (date.toDateString() === yesterday.toDateString()) return t("attemptsDrawer.yesterday");
    return dateLabel(value, false);
  }

  const stats = [
    { id: "attempts", value: String(attempts.length), label: t("attemptsDrawer.attempts") },
    { id: "average", value: average === null ? "—" : `${average}%`, label: t("attemptsDrawer.average") },
    { id: "solved", value: `${rows.length}/${Math.max(studentCount, listed.length, rows.length)}`, label: t("attemptsDrawer.solved") },
  ];

  return (
    <MobileScreenDialog open={open} onOpenChange={onOpenChange} title={t("attemptsDrawer.title")} closeLabel={t("attemptsDrawer.close")}>
      <DsText v="label-lg" w="400" c="ink-secondary" style={styles.subtitle}>
        {subtitle ? `“${title}” · ${subtitle}` : `“${title}”`}
      </DsText>

      {/* `mt-[11px] grid grid-cols-3 gap-2`, katak `h-16.5 rounded-lg bg-surface px-3` */}
      <View style={styles.stats}>
        {stats.map((stat) => (
          <View key={stat.id} style={styles.statCell}>
            <View style={[styles.stat, { backgroundColor: ds.c.surface }]}>
              <DsText v="title-lg" heading numberOfLines={1}>
                {stat.value}
              </DsText>
              <DsText v="body-xs" c="ink-secondary" numberOfLines={1}>
                {stat.label}
              </DsText>
            </View>
          </View>
        ))}
      </View>

      {loading ? (
        <View style={styles.skeletons}>
          {Array.from({ length: 4 }, (_, index) => (
            <View key={index} style={[styles.skeleton, { backgroundColor: ds.c.surface }]} />
          ))}
        </View>
      ) : listed.length ? (
        <View style={[styles.list, { backgroundColor: ds.c.surface }]}>
          {listed.map((row) => {
            const tone: DsColor = row.best === null ? "ink" : row.best >= 90 ? "success" : row.best >= 70 ? "ink" : "warning-fg";
            return (
              <Pressable
                key={row.id}
                accessibilityRole="button"
                accessibilityState={{ expanded: expanded === row.id }}
                onPress={() => setExpanded(expanded === row.id ? null : row.id)}
                style={styles.row}
              >
                <Avatar variant="legacy" name={row.name} src={row.avatarUrl ?? undefined} size="sm" box={36} />
                <View style={styles.grow}>
                  <DsText v="title-sm" numberOfLines={1}>
                    {row.name}
                  </DsText>
                  <DsText v="caption" w="400" c="ink-secondary" numberOfLines={1}>
                    {row.attempts.length
                      ? [t("attemptsDrawer.attemptCount", { count: row.attempts.length }), row.last ? lastLabel(row.last) : ""].filter(Boolean).join(" · ")
                      : t("attemptsDrawer.noAttempts")}
                  </DsText>
                </View>
                {row.best === null ? (
                  <View style={[styles.dash, { backgroundColor: ds.c.ink }]} />
                ) : (
                  <DsText v="title" c={tone}>
                    {row.best}%
                  </DsText>
                )}
                <View style={expanded === row.id ? styles.flipped : undefined}>
                  <Icon name="chevron-down" size={20} color={ds.c["icon-secondary"]} />
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View style={[styles.empty, { backgroundColor: ds.c.surface }]}>
          <DsText v="body-sm" c="ink-secondary" style={styles.center}>
            {t("attemptsDrawer.empty")}
          </DsText>
        </View>
      )}

      {detail ? (
        <View style={styles.detail}>
          <DsText v="title-sm">{t("attemptsDrawer.detailTitle", { name: detail.name })}</DsText>
          <View style={styles.detailList}>
            {[...detail.attempts]
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .map((attempt, index, list) => {
                const value = percent(attempt);
                return (
                  <View key={attempt.id} style={styles.detailRow}>
                    <DsText v="caption" w="400" c="ink-secondary" numberOfLines={1} style={styles.grow}>
                      {t("attemptsDrawer.attemptLine", { number: list.length - index })} · {dateLabel(attempt.createdAt, true)}
                    </DsText>
                    <DsText v="caption" w="600">
                      {value === null ? "—" : `${value}%`}
                    </DsText>
                  </View>
                );
              })}
          </View>
        </View>
      ) : null}
    </MobileScreenDialog>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  center: { textAlign: "center" },
  flipped: { transform: [{ rotate: "180deg" }] },
  subtitle: { marginTop: 18 },
  stats: { marginTop: 11, flexDirection: "row", gap: 8 },
  statCell: { flex: 1, flexBasis: 0 },
  stat: { height: 66, justifyContent: "center", paddingHorizontal: 12, borderRadius: dsRadius.lg },
  skeletons: { marginTop: 12, gap: 8 },
  skeleton: { height: 56, borderRadius: dsRadius.lg },
  /* `gap-[30px] rounded-xl bg-surface px-4 pt-4 pb-3` */
  list: { marginTop: 12, gap: 30, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, borderRadius: dsRadius.xl },
  row: { height: 40, flexDirection: "row", alignItems: "center", gap: 12 },
  dash: { width: 14, height: 2, borderRadius: 1 },
  empty: { marginTop: 12, paddingHorizontal: 20, paddingVertical: 40, borderRadius: dsRadius.xl },
  detail: { marginTop: 24, paddingHorizontal: 12 },
  detailList: { marginTop: 3 },
  detailRow: { height: 22, flexDirection: "row", alignItems: "center", gap: 12 },
});
