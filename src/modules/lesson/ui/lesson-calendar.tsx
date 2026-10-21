import { useMemo, useState } from "react";
import { addMonths, startOfMonth } from "date-fns";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import type { Lesson } from "@/shared/types";
import { Icon, radius, Text, useTheme } from "@/shared/ui";
import { buildMonthGrid, resolveInitialMonth, toDayKey, type CalendarDay } from "../lib/lesson-calendar";
import { hasLessonTopic, useLessonStatusMeta } from "../lib/lesson-status";
import { LessonActions, type LessonActionsProps } from "./lesson-actions";
import { timeBadgeColors } from "./lesson-list";

export type LessonCalendarProps = Omit<LessonActionsProps, "lesson" | "compact"> & { lessons: Lesson[] };

const MAX_CHIPS = 3;

/**
 * Oylik taqvim — veb `modules/lesson/ui/lesson-calendar.tsx`: 7 ustunli
 * katakchalar (har birida 3 tagacha vaqt chipi), ostida tanlangan kun
 * darslari ixcham tugmalar bilan.
 */
export function LessonCalendar({ lessons, ...actions }: LessonCalendarProps) {
  const { t } = useTranslation("lesson");
  const { palette } = useTheme();
  const lessonStatusMeta = useLessonStatusMeta();
  const weekdays = t("calendar.weekdays", { returnObjects: true }) as string[];
  const monthNames = t("list.monthsLong", { returnObjects: true }) as string[];
  const [month, setMonth] = useState(() => resolveInitialMonth(lessons));
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const days = useMemo(() => buildMonthGrid(month, lessons), [month, lessons]);

  const fallbackKey = useMemo(() => {
    const today = days.find((day) => day.isToday && day.inCurrentMonth);
    if (today) return today.key;
    return days.find((day) => day.inCurrentMonth && day.lessons.length)?.key ?? null;
  }, [days]);
  const activeKey = selectedKey && days.some((day) => day.key === selectedKey) ? selectedKey : fallbackKey;
  const selected = days.find((day) => day.key === activeKey) ?? null;

  function selectDay(day: CalendarDay) {
    setSelectedKey(day.key);
    if (!day.inCurrentMonth) setMonth(startOfMonth(day.date));
  }

  const weeks = Array.from({ length: Math.ceil(days.length / 7) }, (_, index) => days.slice(index * 7, index * 7 + 7));

  return (
    <View style={styles.root}>
      <View style={styles.head}>
        <Text variant="subheading" style={styles.grow}>
          {monthNames[month.getMonth()]} {month.getFullYear()}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("calendar.prevMonth")}
          onPress={() => setMonth((value) => addMonths(value, -1))}
          style={[styles.arrow, { backgroundColor: palette["surface-subtle"] }]}
        >
          <Icon name="chevron-left" size={18} color={palette["muted-foreground"]} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            const now = new Date();
            setMonth(startOfMonth(now));
            setSelectedKey(toDayKey(now));
          }}
          style={[styles.today, { borderColor: palette.border, backgroundColor: palette.surface }]}
        >
          <Text variant="label">{t("calendar.todayButton")}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("calendar.nextMonth")}
          onPress={() => setMonth((value) => addMonths(value, 1))}
          style={[styles.arrow, { backgroundColor: palette["surface-subtle"] }]}
        >
          <Icon name="chevron-right" size={18} color={palette["muted-foreground"]} />
        </Pressable>
      </View>

      <View style={styles.week}>
        {weekdays.map((label, index) => (
          <Text key={index} variant="caption" style={[styles.weekday, { color: palette["subtle-foreground"] }]}>
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {weeks.map((week, index) => (
          <View key={index} style={styles.week}>
            {week.map((day) => {
              const active = day.key === activeKey;
              const hidden = day.lessons.length - MAX_CHIPS;
              return (
                <Pressable
                  key={day.key}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={t("calendar.dayCellAria", {
                    date: `${day.date.getDate()}-${monthNames[day.date.getMonth()]}`,
                    count: day.lessons.length,
                  })}
                  onPress={() => selectDay(day)}
                  style={[
                    styles.cell,
                    { borderColor: active ? palette.primary : palette.border },
                    day.inCurrentMonth ? { backgroundColor: palette.surface } : [styles.outside, { backgroundColor: palette.background }],
                  ]}
                >
                  <View style={[styles.dayNumber, day.isToday && { backgroundColor: palette.primary }]}>
                    <Text
                      variant="caption"
                      style={[styles.strong, { color: day.isToday ? palette["primary-foreground"] : palette["muted-foreground"] }]}
                    >
                      {day.dayOfMonth}
                    </Text>
                  </View>
                  {day.lessons.slice(0, MAX_CHIPS).map((lesson) => {
                    const tone = timeBadgeColors(palette, lessonStatusMeta(lesson.status).tone);
                    return (
                      <View key={lesson.id} style={[styles.chip, { backgroundColor: tone.bg }]}>
                        <Text style={[styles.chipText, { color: tone.fg }]}>{lesson.time}</Text>
                      </View>
                    );
                  })}
                  {hidden > 0 ? <Text style={[styles.more, { color: palette["subtle-foreground"] }]}>+{hidden}</Text> : null}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      {selected ? (
        <View style={[styles.panel, { borderColor: palette.border, backgroundColor: palette.surface }]}>
          <View style={styles.panelHead}>
            <Text variant="body" style={[styles.grow, styles.strong]}>
              {`${selected.date.getDate()}-${monthNames[selected.date.getMonth()]}`}
            </Text>
            <Text variant="caption" style={{ color: palette["subtle-foreground"] }}>
              {t("calendar.lessonsCount", { count: selected.lessons.length })}
            </Text>
          </View>
          {selected.lessons.length ? (
            selected.lessons.map((lesson, index) => {
              const meta = lessonStatusMeta(lesson.status);
              const tone = timeBadgeColors(palette, meta.tone);
              const topic = hasLessonTopic(lesson);
              return (
                <View key={lesson.id} style={[styles.item, index > 0 && { borderTopWidth: 1, borderTopColor: palette.border }]}>
                  <View style={styles.itemTime}>
                    <Text variant="body" style={styles.strong}>
                      {lesson.time}
                    </Text>
                    <Text variant="caption" style={{ color: palette["subtle-foreground"] }}>
                      {t("list.durationShort", { count: lesson.durationMinutes })}
                    </Text>
                  </View>
                  <View style={[styles.grow, styles.itemBody]}>
                    <Text
                      variant="label"
                      numberOfLines={1}
                      style={topic ? null : [styles.italic, { color: palette["subtle-foreground"] }]}
                    >
                      {topic ? lesson.title : t("list.missingTopic")}
                    </Text>
                    <View style={[styles.pill, { backgroundColor: tone.bg }]}>
                      <Text variant="caption" style={[styles.strong, { color: tone.fg }]}>
                        {meta.label}
                      </Text>
                    </View>
                  </View>
                  <LessonActions lesson={lesson} compact {...actions} />
                </View>
              );
            })
          ) : (
            <Text variant="label" style={[styles.regular, { color: palette["subtle-foreground"] }]}>
              {t("calendar.noLessonsThisDay")}
            </Text>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 16 },
  grow: { flex: 1, minWidth: 0 },
  regular: { fontWeight: "400" },
  strong: { fontWeight: "600" },
  italic: { fontStyle: "italic" },
  head: { flexDirection: "row", alignItems: "center", gap: 12 },
  arrow: { width: 40, height: 40, borderRadius: radius.xl, alignItems: "center", justifyContent: "center" },
  today: { height: 40, justifyContent: "center", paddingHorizontal: 16, borderWidth: 1, borderRadius: radius.full },
  /* `grid-cols-7 gap-1.5` */
  week: { flexDirection: "row", gap: 6 },
  weekday: { flex: 1, textAlign: "center", fontWeight: "600", letterSpacing: 0.3, textTransform: "uppercase" },
  grid: { gap: 6 },
  cell: { flex: 1, minHeight: 72, gap: 4, padding: 4, borderWidth: 1, borderRadius: radius.md },
  outside: { opacity: 0.6 },
  dayNumber: { width: 24, height: 24, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  chip: { borderRadius: 4, paddingVertical: 2, paddingHorizontal: 1 },
  chipText: { fontSize: 10, lineHeight: 12, fontWeight: "600", textAlign: "center" },
  more: { fontSize: 11, lineHeight: 13, paddingHorizontal: 4 },
  panel: { gap: 12, padding: 16, borderWidth: 1, borderRadius: radius["2xl"] },
  panelHead: { flexDirection: "row", alignItems: "baseline", gap: 12 },
  item: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 12, paddingVertical: 12 },
  itemTime: { width: 56 },
  itemBody: { gap: 4 },
  pill: { alignSelf: "flex-start", height: 24, justifyContent: "center", paddingHorizontal: 10, borderRadius: radius.full },
});
