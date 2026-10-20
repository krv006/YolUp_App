import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { addDays, isSameDay, isToday } from "date-fns";
import type { Lesson } from "@/shared/types";
import { radius, Text, useTheme } from "@/shared/ui";
import { groupLessonsByDay, toDayKey } from "../lib/lesson-calendar";
import { endTime } from "./schedule-grid";

export interface ScheduleSidebarProps {
  anchor: Date;
  lessons: Lesson[];
  onSelectDay: (date: Date) => void;
  onAttendance: (lesson: Lesson) => void;
  /** Oy va ro'yxat ko'rinishida butunlay yashiriladi. */
  compact?: boolean;
  /** Kun ko'rinishida "hozir" kartasi yashiriladi. */
  hideUpcoming?: boolean;
}

/**
 * Jadval yon paneli — veb `modules/lesson/ui/schedule-sidebar.tsx` ning
 * TOR EKRAN qismi.
 *
 * Vebda bu panel kompyuterda chap ustun (oy kalendari, "Guruhlarim"),
 * telefonda esa ko'rinish ustidagi ikki blok: hafta tasmasi va eng yaqin
 * dars kartasi. Kompyuter bloklari `lg:flex` — telefonda chiqmaydi, shuning
 * uchun ko'chirilmadi.
 */
export function ScheduleSidebar({
  anchor,
  lessons,
  onSelectDay,
  onAttendance,
  compact = false,
  hideUpcoming = false,
}: ScheduleSidebarProps) {
  const { t } = useTranslation("lesson");
  const { palette } = useTheme();
  const weekdays = t("list.weekdaysShort", { returnObjects: true }) as string[];
  const byDay = groupLessonsByDay(lessons);

  const [now] = useState(() => Date.now());
  const upcoming = [...lessons]
    .filter((lesson) => lesson.status !== "finished" && lesson.status !== "cancelled")
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .find((lesson) => new Date(lesson.startsAt).getTime() + lesson.durationMinutes * 60000 > now);

  const live = upcoming && new Date(upcoming.startsAt).getTime() <= now;
  const minutesLeft = upcoming
    ? Math.max(0, Math.round((new Date(upcoming.startsAt).getTime() - now) / 60000))
    : 0;

  const weekStart = addDays(anchor, -((anchor.getDay() + 6) % 7));

  if (compact) return null;

  return (
    <View style={[styles.aside, { backgroundColor: palette.background }]}>
      {/* Hafta tasmasi — `rounded-2xl border bg-surface p-2` */}
      <View style={[styles.strip, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <View style={styles.cols}>
          {weekdays.map((label) => (
            <Text key={label} variant="caption" style={[styles.col, { color: palette["subtle-foreground"] }]}>
              {label}
            </Text>
          ))}
        </View>
        <View style={styles.cols}>
          {Array.from({ length: 7 }, (_, index) => {
            const day = addDays(weekStart, index);
            const selected = isSameDay(day, anchor);
            const count = (byDay.get(toDayKey(day)) ?? []).length;
            return (
              <Pressable
                key={day.toISOString()}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => onSelectDay(day)}
                style={[styles.col, styles.dayCell]}
              >
                <View style={[styles.dayCircle, selected && { backgroundColor: palette.primary }]}>
                  <Text
                    variant="label"
                    style={[
                      styles.bodySm,
                      styles.numeric,
                      {
                        color: selected
                          ? palette["primary-foreground"]
                          : isToday(day)
                            ? palette.primary
                            : palette.foreground,
                      },
                    ]}
                  >
                    {day.getDate()}
                  </Text>
                </View>
                {count && !selected ? (
                  <View style={[styles.dot, { backgroundColor: palette.primary }]} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Eng yaqin dars — `rounded-2xl bg-action-subtle p-4 gap-3` */}
      {upcoming && !hideUpcoming ? (
        <View style={[styles.upcoming, { backgroundColor: palette["primary-soft"] }]}>
          <Text variant="caption" style={[styles.strong, { color: palette.primary }]}>
            {live
              ? t("schedule.liveNow")
              : `${t("schedule.now")} · ${
                  minutesLeft >= 1440
                    ? t("schedule.inDays", { count: Math.round(minutesLeft / 1440) })
                    : minutesLeft >= 60
                      ? t("schedule.inHours", { count: Math.round(minutesLeft / 60) })
                      : t("schedule.inMinutes", { count: minutesLeft })
                }`}
          </Text>
          <Text variant="subheading">{upcoming.courseTitle}</Text>
          <Text variant="label" style={[styles.bodySm, styles.numeric, { color: palette["muted-foreground"] }]}>
            {upcoming.time} – {endTime(upcoming)}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => onAttendance(upcoming)}
            style={({ pressed }) => [
              styles.action,
              { backgroundColor: pressed ? palette["primary-hover"] : palette.primary },
            ]}
          >
            <Text variant="label" style={{ color: palette["primary-foreground"] }}>
              {t("schedule.attendance")}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  /* `flex-col gap-3 bg-canvas px-4 py-3` */
  aside: { gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  strip: { gap: 8, padding: 8, borderWidth: 1, borderRadius: radius["2xl"] },
  cols: { flexDirection: "row" },
  col: { flex: 1, textAlign: "center" },
  dayCell: { alignItems: "center", justifyContent: "center", paddingVertical: 4 },
  dayCircle: { width: 36, height: 36, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  dot: { position: "absolute", bottom: 0, width: 4, height: 4, borderRadius: radius.full },
  numeric: { fontVariant: ["tabular-nums"] },
  bodySm: { fontWeight: "400" },
  strong: { fontWeight: "600" },
  upcoming: { gap: 12, padding: 16, borderRadius: radius["2xl"] },
  action: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    borderRadius: radius.full,
  },
});
