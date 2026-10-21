import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import type { Lesson } from "@/shared/types";
import { Icon, radius, Text, useTheme, type Palette } from "@/shared/ui";
import { groupLessonsByDay, toDayKey } from "../lib/lesson-calendar";
import { hasLessonTopic, useLessonStatusMeta } from "../lib/lesson-status";
import { LessonActions, type LessonActionsProps } from "./lesson-actions";

export type LessonListProps = Omit<LessonActionsProps, "lesson" | "compact"> & { lessons: Lesson[] };

interface DaySection {
  key: string;
  date: Date;
  lessons: Lesson[];
}

/** Veb `TIME_BADGE`: holatga qarab vaqt blokining rangi. */
export function timeBadgeColors(palette: Palette, status: string): { bg: string; fg: string } {
  if (status === "live") return { bg: palette.destructive, fg: "#ffffff" };
  if (status === "finished") return { bg: palette.primary, fg: palette["primary-foreground"] };
  if (status === "cancelled") return { bg: palette.muted, fg: palette["muted-foreground"] };
  return { bg: palette["saffron-strong"], fg: "#ffffff" };
}

/** Veb `STATUS_PILL`: holat yorlig'i. */
export function statusPillColors(palette: Palette, tone: string): { bg: string; fg: string } {
  if (tone === "live") return { bg: palette["destructive-soft"], fg: palette["destructive-strong"] };
  if (tone === "finished") return { bg: palette["success-soft"], fg: palette["success-strong"] };
  if (tone === "cancelled") return { bg: palette["surface-subtle"], fg: palette["subtle-foreground"] };
  return { bg: palette["saffron-soft"], fg: palette["saffron-strong"] };
}

function buildSections(lessons: Lesson[]): DaySection[] {
  const byDay = groupLessonsByDay(lessons);
  const todayKey = toDayKey(new Date());
  return [...byDay.entries()]
    .sort((a, b) => {
      const aUpcoming = a[0] >= todayKey;
      const bUpcoming = b[0] >= todayKey;
      if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;
      return aUpcoming ? a[0].localeCompare(b[0]) : b[0].localeCompare(a[0]);
    })
    .map(([key, items]) => ({ key, date: new Date(items[0].startsAt), lessons: items }));
}

/**
 * Darslar ro'yxati — veb `modules/lesson/ui/lesson-list.tsx`: kun
 * sarlavhalari ("BUGUN, 21-OKT · 1 ta"), rangli vaqt bloki, holat yorlig'i.
 * Kelgusi kunlar avval (yaqinidan), o'tganlar keyin (yaqinidan).
 */
export function LessonList({ lessons, ...actions }: LessonListProps) {
  const { t } = useTranslation("lesson");
  const { palette } = useTheme();
  const lessonStatusMeta = useLessonStatusMeta();
  const sections = useMemo(() => buildSections(lessons), [lessons]);
  const months = t("list.months", { returnObjects: true }) as string[];
  const weekdays = t("list.weekdays", { returnObjects: true }) as string[];

  function dayLabel(date: Date): string {
    const stamp = `${date.getDate()}-${months[date.getMonth()] ?? ""}`;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const day = new Date(date);
    day.setHours(0, 0, 0, 0);
    const diff = Math.round((day.getTime() - today.getTime()) / 86_400_000);
    if (diff === 0) return `${t("list.today")}, ${stamp}`;
    if (diff === -1) return `${t("list.yesterday")}, ${stamp}`;
    return `${stamp}, ${weekdays[date.getDay()] ?? ""}`;
  }

  if (!sections.length)
    return (
      <View style={styles.empty}>
        <View style={[styles.emptyIcon, { backgroundColor: palette["primary-soft"] }]}>
          <Icon name="nav-calendar" size={28} color={palette.primary} />
        </View>
        <Text variant="label" style={[styles.regular, styles.center, { color: palette["muted-foreground"] }]}>
          {t("list.empty")}
        </Text>
      </View>
    );

  return (
    <View style={styles.sections}>
      {sections.map((section) => (
        <View key={section.key} style={styles.section}>
          <View style={styles.dayRow}>
            <Text variant="caption" style={[styles.overline, { color: palette["subtle-foreground"] }]}>
              {dayLabel(section.date)}
            </Text>
            <View style={[styles.rule, { backgroundColor: palette.border }]} />
            <Text variant="caption" style={[styles.strong, { color: palette["subtle-foreground"] }]}>
              {t("list.dayCount", { count: section.lessons.length })}
            </Text>
          </View>

          {section.lessons.map((lesson) => {
            const meta = lessonStatusMeta(lesson.status);
            const badge = timeBadgeColors(palette, lesson.status);
            const pill = statusPillColors(palette, meta.tone);
            const topic = hasLessonTopic(lesson);
            return (
              <View key={lesson.id} style={[styles.card, { borderColor: palette.border, backgroundColor: palette.surface }]}>
                <View style={styles.cardHead}>
                  <View style={[styles.timeBadge, { backgroundColor: badge.bg }]}>
                    <Text variant="body" style={[styles.time, { color: badge.fg }]}>
                      {lesson.time}
                    </Text>
                    <Text style={[styles.duration, { color: badge.fg }]}>
                      {t("list.durationShort", { count: lesson.durationMinutes })}
                    </Text>
                  </View>
                  <View style={styles.grow}>
                    <View style={[styles.pill, { backgroundColor: pill.bg }]}>
                      <Text variant="caption" style={[styles.strong, { color: pill.fg }]}>
                        {meta.label}
                      </Text>
                    </View>
                    <Text
                      variant="body"
                      numberOfLines={1}
                      style={[styles.title, topic ? null : [styles.italic, { color: palette["subtle-foreground"] }]]}
                    >
                      {topic ? lesson.title : t("list.missingTopic")}
                    </Text>
                    <View style={styles.clock}>
                      <Icon name="clock" size={15} color={palette["subtle-foreground"]} />
                      <Text variant="label" style={[styles.regular, { color: palette["subtle-foreground"] }]}>
                        {lesson.time} — {t("list.durationShort", { count: lesson.durationMinutes })}
                      </Text>
                    </View>
                  </View>
                </View>
                <LessonActions lesson={lesson} {...actions} />
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0, gap: 4 },
  regular: { fontWeight: "400" },
  strong: { fontWeight: "600" },
  center: { textAlign: "center" },
  italic: { fontStyle: "italic" },
  overline: { fontWeight: "600", letterSpacing: 0.3, textTransform: "uppercase" },
  empty: { alignItems: "center", gap: 12, paddingHorizontal: 24, paddingVertical: 64 },
  emptyIcon: { width: 64, height: 64, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  sections: { gap: 24 },
  section: { gap: 12 },
  dayRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  rule: { flex: 1, height: 1 },
  /* `rounded-2xl border p-4 gap-3` */
  card: { gap: 12, padding: 16, borderWidth: 1, borderRadius: radius["2xl"] },
  cardHead: { flexDirection: "row", alignItems: "flex-start", gap: 16 },
  /* `size-16 rounded-xl` */
  timeBadge: { width: 64, height: 64, borderRadius: radius.xl, alignItems: "center", justifyContent: "center" },
  time: { fontWeight: "600", fontVariant: ["tabular-nums"] },
  duration: { fontSize: 11, lineHeight: 14, opacity: 0.8 },
  pill: { alignSelf: "flex-start", height: 24, justifyContent: "center", paddingHorizontal: 10, borderRadius: radius.full },
  title: { fontWeight: "600" },
  clock: { flexDirection: "row", alignItems: "center", gap: 6 },
});
