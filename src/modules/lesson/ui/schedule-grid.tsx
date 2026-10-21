import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { addDays, isSameDay, isSameMonth, isToday, startOfDay, startOfMonth, startOfWeek } from "date-fns";
import type { Lesson } from "@/shared/types";
import { Icon, radius, Text, useTheme, type Palette } from "@/shared/ui";
import { groupLessonsByDay, toDayKey } from "../lib/lesson-calendar";

/**
 * Jadval ko'rinishlari — veb `modules/lesson/ui/schedule-grid.tsx` porti.
 *
 * Vebda har ko'rinishning ikki varianti bor: keng ekran (7 ustunli soat
 * to'ri, kataklarda dars nomlari) va tor ekran (`useIsCompact`, `lg:hidden`).
 * Bu yerda faqat TOR EKRAN varianti — telefonda boshqasi hech qachon
 * chiqmaydi.
 *
 * Veb sinflari -> qiymatlar:
 *   text-ink           palette.foreground
 *   text-ink-secondary palette["muted-foreground"]   (#545a66)
 *   text-ink-tertiary  palette["subtle-foreground"]  (#626775)
 *   text-action        palette.primary
 *   rounded-2xl 24 · rounded-xl 20
 *   text-title 16/24/600 · text-label-strong 14/20/600
 *   text-body-sm 14/20/400 · text-caption 12/16
 *   font-numeric       tabular-nums
 */

const WEEK_OPTIONS = { weekStartsOn: 1 } as const;
const START_HOUR = 8;
const END_HOUR = 20;
const HOUR_HEIGHT = 100;

export interface ScheduleViewProps {
  anchor: Date;
  lessons: Lesson[];
  onSelect: (lesson: Lesson) => void;
  onSelectDay?: (date: Date) => void;
}

export function endTime(lesson: Lesson): string {
  const start = new Date(lesson.startsAt);
  const end = new Date(start.getTime() + (lesson.durationMinutes || 45) * 60000);
  return `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;
}

function minutesFromStart(date: Date): number {
  return (date.getHours() - START_HOUR) * 60 + date.getMinutes();
}

/** Haftaning dushanbadan boshlangan tartib raqami (0..6). */
function weekdayIndex(day: Date): number {
  return (day.getDay() + 6) % 7;
}

function useLessonText() {
  const { t } = useTranslation("lesson");
  return {
    t,
    months: t("list.months", { returnObjects: true }) as string[],
    weekdaysLong: t("list.weekdaysLong", { returnObjects: true }) as string[],
    weekdaysShort: t("list.weekdaysShort", { returnObjects: true }) as string[],
  };
}

/* ────────────────────────────── umumiy qismlar ───────────────────────── */

type RowVariant = "list" | "card";

/**
 * Dars qatori — ro'yxat, hafta va oy ko'rinishlarida.
 *
 * Vebda ikki xil yozilgan:
 *   list  `px-4 py-3`, chiziq rangi holatga qarab, tugash vaqti tertiary
 *   card  `p-3`, chiziq doim action, vaqt ustuni secondary
 */
function LessonRow({
  lesson,
  title,
  subtitle,
  onSelect,
  variant,
}: {
  lesson: Lesson;
  title: string;
  subtitle: string;
  onSelect: (lesson: Lesson) => void;
  variant: RowVariant;
}) {
  const { palette } = useTheme();
  const list = variant === "list";
  const bar = !list
    ? palette.primary
    : lesson.status === "live"
      ? palette.destructive
      : lesson.status === "finished"
        ? palette.muted
        : palette.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${lesson.time}`}
      onPress={() => onSelect(lesson)}
      style={({ pressed }) => [
        styles.row,
        list ? styles.rowList : styles.rowCard,
        {
          backgroundColor: pressed ? palette["surface-subtle"] : palette.surface,
          borderColor: palette.border,
        },
      ]}
    >
      <View style={[styles.rowBar, { backgroundColor: bar }]} />
      <View style={styles.rowBody}>
        <Text variant="label" numberOfLines={1}>
          {title}
        </Text>
        <Text variant="caption" numberOfLines={1} style={{ color: palette["subtle-foreground"] }}>
          {subtitle}
        </Text>
      </View>
      <View style={styles.rowTime}>
        <Text variant="label" style={styles.numeric}>
          {lesson.time}
        </Text>
        <Text
          variant="caption"
          style={[
            styles.numeric,
            { color: list ? palette["subtle-foreground"] : palette["muted-foreground"] },
          ]}
        >
          {endTime(lesson)}
        </Text>
      </View>
    </Pressable>
  );
}

/** Kunda dars yo'q. Hafta va oy ko'rinishida uzuq chiziqli quti ichida. */
function EmptyDay({ dashed = false }: { dashed?: boolean }) {
  const { t } = useTranslation("lesson");
  const { palette } = useTheme();
  const text = (
    <Text variant="label" style={[styles.bodySm, { color: palette["subtle-foreground"] }]}>
      {t("schedule.noLessonsDay")}
    </Text>
  );
  if (!dashed) return text;
  return <View style={[styles.emptyDay, { borderColor: palette.border }]}>{text}</View>;
}

/* ─────────────────────────────── RO'YXAT ─────────────────────────────── */

/** Tanlangan kundan boshlab 7 kun, kunlar bo'yicha guruhlangan. */
export function ScheduleList({ anchor, lessons, onSelect, onSelectDay }: ScheduleViewProps) {
  const { t, months, weekdaysLong } = useLessonText();
  const { palette } = useTheme();
  const byDay = groupLessonsByDay(lessons);
  const days = Array.from({ length: 7 }, (_, index) => addDays(anchor, index));

  function dayLabel(day: Date): string {
    const weekday = weekdaysLong?.[weekdayIndex(day)] ?? "";
    const date = `${day.getDate()}-${(months[day.getMonth()] ?? "").toLowerCase()}`;
    if (isToday(day)) return `${t("schedule.today")}, ${date} · ${weekday}`;
    if (isSameDay(day, addDays(new Date(), 1))) return `${t("schedule.tomorrow")}, ${date} · ${weekday}`;
    return `${date} · ${weekday}`;
  }

  return (
    <ScrollView style={{ backgroundColor: palette.background }} contentContainerStyle={styles.listBody}>
      {days.map((day) => {
        const items = byDay.get(toDayKey(day)) ?? [];
        const weekend = day.getDay() === 0 || day.getDay() === 6;
        return (
          <View key={day.toISOString()} style={styles.section}>
            <Pressable accessibilityRole="button" onPress={() => onSelectDay?.(day)} style={styles.baselineRow}>
              <Text variant="body" numberOfLines={1} style={[styles.title, styles.grow]}>
                {dayLabel(day)}
              </Text>
              <Text
                variant="label"
                style={{ color: items.length ? palette.primary : palette["subtle-foreground"] }}
              >
                {items.length
                  ? t("schedule.lessonCountShort", { count: items.length })
                  : weekend
                    ? t("schedule.dayOff")
                    : ""}
              </Text>
            </Pressable>

            {items.length ? (
              items.map((lesson) => (
                <LessonRow
                  key={lesson.id}
                  variant="list"
                  lesson={lesson}
                  title={lesson.courseTitle}
                  subtitle={[
                    lesson.topic || t("schedule.online"),
                    lesson.quizId ? t("schedule.quizAttached") : "",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                  onSelect={onSelect}
                />
              ))
            ) : (
              <EmptyDay />
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

/* ──────────────────────────────── KUN ────────────────────────────────── */

function lessonTone(lesson: Lesson, palette: Palette) {
  if (lesson.status === "live")
    return { border: palette.destructive, bg: palette["destructive-soft"], fg: palette["destructive-strong"] };
  if (lesson.status === "finished")
    return { border: palette.border, bg: palette["surface-subtle"], fg: palette["muted-foreground"] };
  if (lesson.status === "cancelled")
    return { border: palette.border, bg: palette.muted, fg: palette["subtle-foreground"] };
  // `border-action/40` — action rangi 40% shaffoflikda.
  return { border: "rgba(69, 103, 245, 0.4)", bg: palette["primary-soft"], fg: palette.primary };
}

function LessonBlock({ lesson, onSelect }: { lesson: Lesson; onSelect: (lesson: Lesson) => void }) {
  const { palette } = useTheme();
  const start = new Date(lesson.startsAt);
  const top = (minutesFromStart(start) / 60) * HOUR_HEIGHT;
  const height = Math.max(44, ((lesson.durationMinutes || 45) / 60) * HOUR_HEIGHT - 6);
  const tone = lessonTone(lesson, palette);
  const strike = lesson.status === "cancelled" ? styles.strike : null;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onSelect(lesson)}
      style={({ pressed }) => [
        styles.block,
        { top, height, backgroundColor: tone.bg, borderColor: tone.border, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <Text variant="caption" numberOfLines={1} style={[styles.strong, strike, { color: tone.fg }]}>
        {lesson.courseTitle}
      </Text>
      {lesson.topic ? (
        <Text variant="caption" numberOfLines={1} style={[strike, { color: tone.fg }]}>
          {lesson.topic}
        </Text>
      ) : null}
      <Text variant="caption" style={[styles.numeric, strike, { color: tone.fg }]}>
        {lesson.time} – {endTime(lesson)}
      </Text>
    </Pressable>
  );
}

/** Bitta kun: yuqorida xulosa, ostida 08:00–20:00 soatlar to'ri. */
export function ScheduleDay({ anchor, lessons, onSelect }: ScheduleViewProps) {
  const { t, months, weekdaysLong } = useLessonText();
  const { palette } = useTheme();
  const items = (groupLessonsByDay(lessons).get(toDayKey(anchor)) ?? []).filter(Boolean);
  const finished = items.filter((item) => item.status === "finished").length;
  const live = items.filter((item) => item.status === "live").length;
  const left = items.length - finished - live;
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, index) => START_HOUR + index);

  return (
    <View style={[styles.fill, { backgroundColor: palette.background }]}>
      <View style={[styles.daySummary, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
        <View style={[styles.dayBadge, { backgroundColor: palette["primary-soft"] }]}>
          <Text variant="caption" style={[styles.strong, styles.numeric, { color: palette.primary }]}>
            {anchor.getDate()}
          </Text>
        </View>
        <View style={styles.grow}>
          <Text variant="subheading" numberOfLines={1} style={styles.title}>
            {weekdaysLong?.[weekdayIndex(anchor)] ?? ""}, {anchor.getDate()}-
            {(months[anchor.getMonth()] ?? "").toLowerCase()}
          </Text>
          <Text variant="caption" style={{ color: palette["subtle-foreground"] }}>
            {isToday(anchor) ? `${t("schedule.today")} · ` : ""}
            {t("schedule.lessonCount", { count: items.length })}
          </Text>
        </View>
        <View style={styles.pills}>
          <Pill bg={palette["success-soft"]} fg={palette["success-strong"]}>
            {t("schedule.finishedCount", { count: finished })}
          </Pill>
          <Pill bg={palette["primary-soft"]} fg={palette.primary}>
            {t("schedule.liveCount", { count: live })}
          </Pill>
          <Pill bg={palette["saffron-soft"]} fg={palette["saffron-strong"]}>
            {t("schedule.leftCount", { count: Math.max(0, left) })}
          </Pill>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.gridScroll}>
        <View style={styles.hourColumn}>
          {hours.map((hour) => (
            <View key={hour} style={{ height: HOUR_HEIGHT }}>
              <Text
                variant="caption"
                style={[styles.hourLabel, styles.numeric, { color: palette["subtle-foreground"] }]}
              >
                {String(hour).padStart(2, "0")}:00
              </Text>
            </View>
          ))}
        </View>
        <View style={[styles.hourArea, { borderLeftColor: palette.border, height: hours.length * HOUR_HEIGHT }]}>
          {hours.map((_, index) => (
            <View
              key={index}
              pointerEvents="none"
              style={[styles.hourLine, { top: index * HOUR_HEIGHT, borderTopColor: palette.border }]}
            />
          ))}
          {items.map((lesson) => (
            <LessonBlock key={lesson.id} lesson={lesson} onSelect={onSelect} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function Pill({ bg, fg, children }: { bg: string; fg: string; children: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text variant="caption" style={[styles.strong, { color: fg }]}>
        {children}
      </Text>
    </View>
  );
}

/* ─────────────────────────────── HAFTA ───────────────────────────────── */

/** Hafta — tor ekran varianti: tanlangan kundan hafta oxirigacha. */
export function ScheduleWeek({ anchor, lessons, onSelect, onSelectDay }: ScheduleViewProps) {
  const { t, weekdaysShort } = useLessonText();
  const { palette } = useTheme();
  const byDay = groupLessonsByDay(lessons);
  const weekStart = addDays(anchor, -weekdayIndex(anchor));
  const rest = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)).filter(
    (day) => day.getTime() >= startOfDay(anchor).getTime()
  );
  const restCount = rest.reduce((sum, day) => sum + (byDay.get(toDayKey(day)) ?? []).length, 0);

  return (
    <ScrollView style={{ backgroundColor: palette.background }} contentContainerStyle={styles.weekBody}>
      <View style={styles.baselineRow}>
        <Text variant="subheading" style={[styles.title, styles.grow]}>
          {t("schedule.restOfWeek")}
        </Text>
        <Text variant="label" style={{ color: palette.primary }}>
          {t("schedule.lessonCount", { count: restCount })}
        </Text>
      </View>

      {rest.map((day) => {
        const items = byDay.get(toDayKey(day)) ?? [];
        const active = isSameDay(day, anchor);
        return (
          <View key={day.toISOString()} style={styles.weekRow}>
            <Pressable accessibilityRole="button" onPress={() => onSelectDay?.(day)} style={styles.weekDate}>
              <Text variant="caption" style={{ color: active ? palette.primary : palette["subtle-foreground"] }}>
                {weekdaysShort[weekdayIndex(day)]}
              </Text>
              <Text
                variant="body"
                style={[styles.title, styles.numeric, { color: active ? palette.primary : palette.foreground }]}
              >
                {day.getDate()}
              </Text>
            </Pressable>
            <View style={styles.weekItems}>
              {items.length ? (
                items.map((lesson) => (
                  <LessonRow
                    key={lesson.id}
                    variant="card"
                    lesson={lesson}
                    title={lesson.title || lesson.courseTitle}
                    subtitle={lesson.courseTitle}
                    onSelect={onSelect}
                  />
                ))
              ) : (
                <EmptyDay dashed />
              )}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

/* ──────────────────────────────── OY ─────────────────────────────────── */

/**
 * Oy — tor ekran varianti: 6 haftalik to'r (darsli kunda nuqta), izoh va
 * tanlangan kunning darslari.
 *
 * Haftalar `flex: 1` — vebdagidek bo'sh joyni to'ldiradi, lekin 52 dan
 * past tushmaydi (`min-h-[52px] flex-1`).
 */
export function ScheduleMonth({ anchor, lessons, onSelect, onSelectDay }: ScheduleViewProps) {
  const { t, months, weekdaysLong, weekdaysShort } = useLessonText();
  const { palette } = useTheme();
  const byDay = groupLessonsByDay(lessons);
  const start = startOfWeek(startOfMonth(anchor), WEEK_OPTIONS);
  const weeks = Array.from({ length: 6 }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => addDays(start, week * 7 + day))
  );
  const selected = byDay.get(toDayKey(anchor)) ?? [];

  return (
    <View style={[styles.fill, { backgroundColor: palette.background }]}>
      <View style={[styles.monthHead, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
        {weekdaysShort.map((label, index) => (
          <Text
            key={label}
            variant="caption"
            style={[
              styles.monthHeadCell,
              { color: index > 4 ? palette["subtle-foreground"] : palette["muted-foreground"] },
            ]}
          >
            {label}
          </Text>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.monthScroll}>
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={[styles.monthWeek, { borderBottomColor: palette.border }]}>
            {week.map((day) => {
              const count = (byDay.get(toDayKey(day)) ?? []).length;
              const outside = !isSameMonth(day, anchor);
              const today = isToday(day);
              /*
               * Fon: vebdagi sinflar ro'yxatida `bg-subtle/50` (dam olish)
               * va `bg-action-subtle/40` (tanlangan) ham bor, lekin CSS
               * tartibida `bg-surface` ulardan keyin keladi va ustun turadi —
               * brauzerda ular KO'RINMAYDI. Shu sabab bu yerda faqat
               * oy ichi (oq) va oy tashqarisi (kanva) farqlanadi.
               */
              return (
                <Pressable
                  key={day.toISOString()}
                  accessibilityRole="button"
                  onPress={() => onSelectDay?.(day)}
                  style={[
                    styles.monthCell,
                    {
                      backgroundColor: outside ? palette.background : palette.surface,
                      borderLeftColor: palette.border,
                    },
                  ]}
                >
                  <View style={[styles.monthDay, today && { backgroundColor: palette.primary }]}>
                    <Text
                      variant="caption"
                      style={[
                        styles.strong,
                        styles.numeric,
                        {
                          color: today
                            ? palette["primary-foreground"]
                            : outside
                              ? palette["subtle-foreground"]
                              : palette.foreground,
                        },
                      ]}
                    >
                      {day.getDate()}
                    </Text>
                  </View>
                  {count ? <View style={[styles.dot, { backgroundColor: palette.primary }]} /> : null}
                </Pressable>
              );
            })}
          </View>
        ))}

        <View style={styles.monthFoot}>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: palette.primary }]} />
              <Text variant="caption" style={{ color: palette["subtle-foreground"] }}>
                {t("schedule.legendHasLesson")}
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: palette.muted }]} />
              <Text variant="caption" style={{ color: palette["subtle-foreground"] }}>
                {t("schedule.legendWeekend")}
              </Text>
            </View>
          </View>

          <View style={styles.baselineRow}>
            <Text variant="subheading" numberOfLines={1} style={[styles.title, styles.grow]}>
              {anchor.getDate()}-{(months[anchor.getMonth()] ?? "").toLowerCase()},{" "}
              {weekdaysLong[weekdayIndex(anchor)]}
            </Text>
            {isToday(anchor) ? (
              <Text variant="label" style={{ color: palette.primary }}>
                {t("schedule.today")}
              </Text>
            ) : null}
          </View>

          {selected.length ? (
            selected.map((lesson) => (
              <LessonRow
                key={lesson.id}
                variant="card"
                lesson={lesson}
                title={lesson.title || lesson.courseTitle}
                subtitle={lesson.courseTitle}
                onSelect={onSelect}
              />
            ))
          ) : (
            <EmptyDay dashed />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

/* ─────────────────────────── bo'sh va yuklanish ──────────────────────── */

export function ScheduleEmpty({
  title,
  onCreate,
  canCreate,
}: {
  title: string;
  onCreate: () => void;
  canCreate: boolean;
}) {
  const { t } = useTranslation("lesson");
  const { palette } = useTheme();
  return (
    <View style={[styles.empty, { backgroundColor: palette.background }]}>
      <View style={[styles.emptyIcon, { backgroundColor: palette["primary-soft"] }]}>
        <Icon name="nav-calendar" size={26} color={palette.primary} />
      </View>
      <Text variant="subheading" style={styles.center}>
        {title}
      </Text>
      <Text
        variant="label"
        style={[styles.bodySm, styles.center, styles.emptyText, { color: palette["muted-foreground"] }]}
      >
        {t("schedule.emptyHint")}
      </Text>
      {canCreate ? (
        <Pressable
          accessibilityRole="button"
          onPress={onCreate}
          style={({ pressed }) => [
            styles.emptyAction,
            { backgroundColor: pressed ? palette["primary-hover"] : palette.primary },
          ]}
        >
          <Icon name="add" size={18} color={palette["primary-foreground"]} />
          <Text variant="label" style={{ color: palette["primary-foreground"] }}>
            {t("schedule.addLesson")}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function ScheduleSkeleton() {
  const { palette } = useTheme();
  const bar = { backgroundColor: palette.muted };
  return (
    <View style={[styles.skeleton, { backgroundColor: palette.background }]}>
      {Array.from({ length: 4 }, (_, index) => (
        <View
          key={index}
          style={[styles.skeletonCard, { backgroundColor: palette.surface, borderColor: palette.border }]}
        >
          <View style={[styles.skeletonLine, bar, { width: "40%" }]} />
          <View style={[styles.skeletonLine, bar, { width: "80%" }]} />
          <View style={[styles.skeletonLine, bar, { width: "60%" }]} />
          <View style={[styles.skeletonBlock, bar]} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  grow: { flex: 1 },
  center: { textAlign: "center" },
  numeric: { fontVariant: ["tabular-nums"] },
  /* text-title 16/24/600 — `font-heading` bo'lsa variant `subheading` beriladi. */
  title: { fontSize: 16, lineHeight: 24, fontWeight: "600" },
  /* text-body-sm 14/20/400 */
  bodySm: { fontWeight: "400" },
  /* text-caption-strong */
  strong: { fontWeight: "600" },
  strike: { textDecorationLine: "line-through" },
  baselineRow: { flexDirection: "row", alignItems: "baseline", gap: 12 },

  /* Ro'yxat — `flex-col gap-5 p-4`, bo'lim `gap-2` */
  listBody: { padding: 16, gap: 20 },
  section: { gap: 8 },

  row: { flexDirection: "row", alignItems: "flex-start", gap: 12, borderWidth: 1, borderRadius: radius["2xl"] },
  rowList: { paddingHorizontal: 16, paddingVertical: 12 },
  rowCard: { padding: 12 },
  rowBar: { width: 4, height: 40, marginTop: 2, borderRadius: radius.full },
  rowBody: { flex: 1, minWidth: 0 },
  rowTime: { alignItems: "flex-end" },

  emptyDay: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: radius["2xl"],
    paddingHorizontal: 12,
    paddingVertical: 12,
  },

  /* Kun — sarlavha `flex-wrap gap-3 px-4 py-3` */
  daySummary: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  dayBadge: { width: 44, height: 44, borderRadius: radius.xl, alignItems: "center", justifyContent: "center" },
  pills: { width: "100%", flexDirection: "row", alignItems: "center", gap: 8 },
  pill: { borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 4 },
  gridScroll: { flexDirection: "row", paddingTop: 16 },
  hourColumn: { width: 64 },
  hourLabel: { position: "absolute", top: -8, right: 12 },
  hourArea: { flex: 1, borderLeftWidth: 1 },
  hourLine: { position: "absolute", left: 0, right: 0, borderTopWidth: 1 },
  block: {
    position: "absolute",
    left: 4,
    right: 4,
    gap: 2,
    overflow: "hidden",
    borderWidth: 1,
    borderRadius: radius.xl,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  /* Hafta — `gap-3 px-4 pt-1 pb-6` */
  weekBody: { gap: 12, paddingHorizontal: 16, paddingTop: 4, paddingBottom: 24 },
  weekRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  weekDate: { width: 32, alignItems: "center", paddingTop: 8 },
  weekItems: { flex: 1, minWidth: 0, gap: 8 },

  /* Oy */
  monthHead: { flexDirection: "row", borderBottomWidth: 1 },
  monthHeadCell: { flex: 1, paddingHorizontal: 12, paddingVertical: 10 },
  monthScroll: { flexGrow: 1 },
  monthWeek: { flex: 1, flexDirection: "row", minHeight: 52, borderBottomWidth: 1 },
  monthCell: { flex: 1, minWidth: 0, alignItems: "center", gap: 4, padding: 6, borderLeftWidth: 1 },
  monthDay: { width: 28, height: 28, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  dot: { width: 6, height: 6, borderRadius: radius.full },
  monthFoot: { gap: 12, padding: 16 },
  legend: { flexDirection: "row", alignItems: "center", gap: 16 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },

  /* Bo'sh holat */
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 24 },
  emptyIcon: { width: 64, height: 64, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  emptyText: { maxWidth: 360 },
  emptyAction: {
    marginTop: 4,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    borderRadius: radius.full,
  },

  /* Yuklanish — 4 ta kartochka, `gap-4 p-4` */
  skeleton: { flex: 1, gap: 16, padding: 16 },
  skeletonCard: { gap: 12, padding: 16, borderWidth: 1, borderRadius: radius["2xl"] },
  skeletonLine: { height: 12, borderRadius: radius.full },
  skeletonBlock: { height: 64, borderRadius: radius.xl },
});
