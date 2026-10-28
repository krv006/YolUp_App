import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { Lesson } from "@/shared/types";
import { dsAlpha, DsGradient, DsText, dsRadius, GroupTile, Icon, MobileRoundButton, PullRefresh, useDs } from "@/shared/ui";
import { MobileUserHeader } from "@/widgets/mobile-user-header";
import type { CourseLook } from "./lesson-tone";
import { MobileScheduleSkeleton, ScheduleError } from "./schedule-states";

export type MobileScheduleView = "day" | "week" | "month";

const VIEWS: MobileScheduleView[] = ["day", "week", "month"];
const WEEK_OPTIONS = { weekStartsOn: 1 } as const;
const SOON_MINUTES = 90;

export interface MobileScheduleProps {
  view: MobileScheduleView;
  anchor: Date;
  now: Date;
  online: boolean;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  lessons: Lesson[];
  courseLook: (courseId: string) => CourseLook;
  onView: (view: MobileScheduleView) => void;
  onAnchor: (date: Date) => void;
  onSelect: (lesson: Lesson) => void;
  onChat: (lesson: Lesson) => void;
  onJoin: (lesson: Lesson) => void;
  onCreate?: () => void;
  student?: boolean;
  /** Pastki suzuvchi panel egallaydigan joy (`pb-32`). */
  bottomInset?: number;
}

function clock(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function endOf(lesson: Lesson): Date {
  return new Date(new Date(lesson.startsAt).getTime() + (lesson.durationMinutes || 45) * 60_000);
}

function byStart(a: Lesson, b: Lesson): number {
  return a.startsAt.localeCompare(b.startsAt);
}

function onDay(lessons: Lesson[], day: Date): Lesson[] {
  return lessons.filter((lesson) => isSameDay(new Date(lesson.startsAt), day)).sort(byStart);
}

/**
 * Jadval — veb `pages/schedule/mobile-schedule.tsx`: foydalanuvchi sarlavhasi,
 * "Kun / Hafta / Oy" almashtirgichi; kunda hafta qatori va vaqt chizig'i
 * (yaqin dars ko'k karta), haftada xulosa kartasi va kunlar bo'yicha
 * ro'yxat, oyda kalendar va tanlangan kun darslari.
 */
export function MobileSchedule(props: MobileScheduleProps) {
  const { t } = useTranslation("lesson");
  const ds = useDs();
  const insets = useSafeAreaInsets();
  const { view, anchor, now, online, onView, onAnchor } = props;
  const months = t("list.months", { returnObjects: true }) as string[];
  const weekStart = startOfWeek(anchor, WEEK_OPTIONS);
  const weekEnd = endOfWeek(anchor, WEEK_OPTIONS);

  const aside =
    view === "week" ? (
      <DsText v="body-sm" c="ink-secondary">
        {weekStart.getMonth() === weekEnd.getMonth()
          ? `${weekStart.getDate()} – ${weekEnd.getDate()} ${(months[weekEnd.getMonth()] ?? "").toLowerCase()}`
          : `${weekStart.getDate()} ${(months[weekStart.getMonth()] ?? "").toLowerCase()} – ${weekEnd.getDate()} ${(months[weekEnd.getMonth()] ?? "").toLowerCase()}`}
      </DsText>
    ) : view === "day" && isSameDay(anchor, now) ? null : (
      <Pressable accessibilityRole="button" onPress={() => onAnchor(new Date(now))} hitSlop={8}>
        <DsText v="body-sm" w="500" c="brand-strong">
          {t("schedule.today")}
        </DsText>
      </Pressable>
    );

  return (
    <View style={[styles.fill, { backgroundColor: ds.c.canvas }]}>
      <ScrollView
        style={styles.fill}
        contentContainerStyle={[styles.page, { paddingTop: insets.top + 20, paddingBottom: props.bottomInset ?? 128 }]}
        refreshControl={props.onRetry ? <PullRefresh onRefresh={() => props.onRetry?.()} /> : undefined}
      >
        <DsGradient name="auth" />
        <MobileUserHeader />

        {!online ? (
          <View style={[styles.offline, { backgroundColor: ds.c["surface-inverse"] }]}>
            <Icon name="wifi" size={20} color={ds.c["ink-inverse"]} />
            <DsText v="body-sm" c="ink-inverse" numberOfLines={1} style={styles.grow}>
              {t("mobileSchedule.offline")}
            </DsText>
          </View>
        ) : null}

        <View style={styles.toolbar}>
          <View accessibilityRole="tablist" style={[styles.views, { backgroundColor: ds.c.surface }]}>
            {VIEWS.map((item) => {
              const active = view === item;
              return (
                <Pressable
                  key={item}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  onPress={() => onView(item)}
                  style={[styles.viewItem, active && { backgroundColor: ds.c.brand }]}
                >
                  <DsText v="body-sm" w="500" c={active ? "on-action" : "ink"}>
                    {t(`schedule.views.${item}`)}
                  </DsText>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.grow} />
          {aside}
        </View>

        {view === "day" ? <DayView {...props} /> : null}
        {view !== "day" && props.loading ? <MobileScheduleSkeleton /> : null}
        {view !== "day" && props.error ? <ScheduleError onRetry={() => props.onRetry?.()} /> : null}
        {view === "week" && !props.loading && !props.error ? <WeekView {...props} /> : null}
        {view === "month" && !props.loading && !props.error ? <MonthView {...props} /> : null}
      </ScrollView>
    </View>
  );
}

function DayHeading({ day, now, count, pending = false }: { day: Date; now: Date; count: number; pending?: boolean }) {
  const { t } = useTranslation("lesson");
  const monthsLong = t("list.monthsLong", { returnObjects: true }) as string[];
  const weekdaysLong = t("list.weekdaysLong", { returnObjects: true }) as string[];
  const weekday = (day.getDay() + 6) % 7;
  const date = `${day.getDate()}-${(monthsLong[day.getMonth()] ?? "").toLowerCase()}`;

  return (
    <View style={styles.dayHeading}>
      <DsText v="title" heading numberOfLines={1} style={styles.grow}>
        {isSameDay(day, now) ? t("schedule.today") : weekdaysLong[weekday]}, {date}
      </DsText>
      {pending ? null : (
        <DsText v="body-sm" c="ink-secondary">
          {count ? t("schedule.lessonCount", { count }) : weekday === 6 ? t("schedule.dayOff") : t("schedule.noLessonsDay")}
        </DsText>
      )}
    </View>
  );
}

function EmptyCard({ title, hint, onCreate, iconless = false }: { title: string; hint: string; onCreate?: () => void; iconless?: boolean }) {
  const { t } = useTranslation("lesson");
  const ds = useDs();
  return (
    <View style={[styles.empty, { backgroundColor: ds.c.surface }]}>
      {iconless ? null : (
        <View style={[styles.emptyIcon, { backgroundColor: ds.c["brand-subtle"] }]}>
          <Icon name="schedule" size={30} color={ds.c.brand} />
        </View>
      )}
      <DsText v={iconless ? "title-lg" : "title"} heading style={[styles.center, iconless ? null : styles.emptyTitle]}>
        {title}
      </DsText>
      <DsText v="body-sm" c="ink-secondary" style={[styles.center, iconless ? styles.emptyHintTight : styles.emptyHint]}>
        {hint}
      </DsText>
      {onCreate ? (
        <Pressable
          accessibilityRole="button"
          onPress={onCreate}
          style={({ pressed }) => [styles.emptyAction, iconless && styles.emptyActionWide, { backgroundColor: pressed ? ds.c["brand-strong"] : ds.c.brand }]}
        >
          <Icon name="add" size={18} color={ds.c["on-action"]} />
          <DsText v="button" c="on-action">
            {t("schedule.addLesson")}
          </DsText>
        </Pressable>
      ) : null}
    </View>
  );
}

function DayView(props: MobileScheduleProps) {
  const { t } = useTranslation("lesson");
  const ds = useDs();
  const { anchor, now, lessons, onAnchor, onCreate } = props;
  const weekdays = t("list.weekdaysShort", { returnObjects: true }) as string[];
  const start = startOfWeek(anchor, WEEK_OPTIONS);
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));
  const rows = onDay(lessons, anchor);

  return (
    <>
      <View style={styles.week}>
        {days.map((day, index) => {
          const active = isSameDay(day, anchor);
          const has = lessons.some((lesson) => isSameDay(new Date(lesson.startsAt), day));
          const rest = index === 6;
          return (
            <Pressable
              key={day.toISOString()}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => onAnchor(day)}
              style={[styles.weekDay, { backgroundColor: active ? ds.c.brand : ds.c.surface }]}
            >
              <DsText v="caption" c={active ? "on-action" : rest ? "ink-disabled" : "ink-secondary"}>
                {weekdays[index]}
              </DsText>
              <DsText v="title-lg" w="700" c={active ? "on-action" : rest ? "ink-disabled" : "ink"}>
                {day.getDate()}
              </DsText>
              {has && !active ? <View style={[styles.weekDot, { backgroundColor: ds.c.brand }]} /> : null}
            </Pressable>
          );
        })}
      </View>

      <DayHeading day={anchor} now={now} count={rows.length} pending={props.loading || props.error} />

      {props.loading ? (
        <MobileScheduleSkeleton />
      ) : props.error ? (
        <ScheduleError onRetry={() => props.onRetry?.()} />
      ) : rows.length ? (
        <Timeline {...props} rows={rows} />
      ) : (
        <EmptyCard
          title={t("schedule.emptyDay").replace(/\.$/, "")}
          hint={onCreate ? t("mobileSchedule.emptyHint") : t("schedule.emptyStudentHint")}
          onCreate={onCreate}
        />
      )}
    </>
  );
}

function Timeline({ rows, now, courseLook, onSelect, onChat, onJoin, student = false }: MobileScheduleProps & { rows: Lesson[] }) {
  const { t } = useTranslation("lesson");
  const ds = useDs();
  const upcoming =
    rows.find((lesson) => lesson.status === "live") ??
    rows.find((lesson) => lesson.status !== "finished" && new Date(lesson.startsAt).getTime() >= now.getTime());

  return (
    <View style={styles.timeline}>
      {rows.map((lesson, index) => {
        const live = lesson.status === "live";
        const finished = lesson.status === "finished" || (!live && endOf(lesson).getTime() < now.getTime());
        const minutes = Math.round((new Date(lesson.startsAt).getTime() - now.getTime()) / 60_000);
        const highlight = upcoming?.id === lesson.id && (live || minutes <= SOON_MINUTES);
        const look = courseLook(lesson.courseId);
        const last = index === rows.length - 1;

        return (
          <View key={lesson.id} style={styles.timelineRow}>
            <View style={styles.times}>
              <DsText v="title-sm" c={highlight ? "brand" : finished ? "ink-secondary" : "ink"}>
                {clock(lesson.startsAt)}
              </DsText>
              <DsText v="caption" c={finished ? "ink-tertiary" : "ink-secondary"}>
                {clock(endOf(lesson))}
              </DsText>
            </View>

            {/* vertikal chiziq va nuqta */}
            <View style={styles.rail}>
              {last ? null : <View style={[styles.railLine, { backgroundColor: ds.c.line }]} />}
              {/* yaqin dars: `size-2 bg-brand ring-[3px] ring-brand-subtle` (halqa chegarada) */}
              <View
                style={
                  highlight
                    ? [styles.railDotHighlight, { backgroundColor: ds.c.brand, borderColor: ds.c["brand-subtle"] }]
                    : [styles.railDot, { backgroundColor: finished ? ds.c["line-strong"] : dsAlpha(ds.c.brand, 0.6) }]
                }
              />
            </View>

            {highlight ? (
              <Pressable accessibilityRole="button" onPress={() => onSelect(lesson)} style={[styles.hero, { backgroundColor: ds.c.brand }]}>
                <View style={[styles.heroChip, { backgroundColor: ds.c["on-brand-subtle"] }]}>
                  <Icon name="schedule" size={16} color={ds.c["on-action"]} />
                  <DsText v="caption-strong" c="on-action">
                    {live ? t("schedule.live") : t("schedule.startsIn", { count: Math.max(minutes, 0) })}
                  </DsText>
                </View>
                <DsText heading numberOfLines={1} c="on-action" style={styles.heroTitle}>
                  {lesson.courseTitle}
                </DsText>
                <DsText v="body-sm" numberOfLines={1} style={[styles.heroMeta, { color: dsAlpha(ds.c["on-action"], 0.85) }]}>
                  {student
                    ? t("schedule.teacherDuration", { teacher: look.teacher, count: lesson.durationMinutes || 45 })
                    : t("mobileSchedule.studentsAndDuration", { count: look.students, minutes: lesson.durationMinutes || 45 })}
                </DsText>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => (student ? onJoin(lesson) : onChat(lesson))}
                  style={({ pressed }) => [styles.heroButton, { backgroundColor: pressed ? ds.c.subtle : ds.c.surface }]}
                >
                  <Icon name={student ? "videocam-fill" : "chat"} size={20} color={ds.c.ink} />
                  <DsText v="button">{student ? t("schedule.join") : t("schedule.openChat")}</DsText>
                </Pressable>
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={() => onSelect(lesson)}
                style={({ pressed }) => [styles.card, { backgroundColor: pressed ? ds.c.subtle : ds.c.surface }, finished && styles.faded]}
              >
                <GroupTile name={lesson.courseTitle} tone={look.tone} src={look.image} box={44} radius={dsRadius.xl} />
                <View style={styles.cardBody}>
                  <DsText v="title" c={finished ? "ink-secondary" : "ink"} numberOfLines={1} style={styles.cardTitle}>
                    {lesson.courseTitle}
                  </DsText>
                  <LessonMeta lesson={lesson} finished={finished} look={look} student={student} />
                </View>
                <View style={styles.cardChevron}>
                  <Icon name="chevron-right" size={20} color={ds.c["icon-secondary"]} />
                </View>
              </Pressable>
            )}
          </View>
        );
      })}
    </View>
  );
}

function LessonMeta({ lesson, finished, live = false, look, student }: { lesson: Lesson; finished: boolean; live?: boolean; look: CourseLook; student: boolean }) {
  const { t } = useTranslation("lesson");
  const ds = useDs();
  if (live)
    return (
      <View style={styles.metaRow}>
        <View style={[styles.liveDot, { backgroundColor: ds.c.danger }]} />
        <DsText v="body-sm" c="danger" numberOfLines={1}>
          {t("schedule.live")}
        </DsText>
      </View>
    );
  if (lesson.status === "cancelled")
    return (
      <DsText v="body-sm" c="danger" numberOfLines={1}>
        {student ? look.teacher : t("schedule.students", { count: look.students })} · {t("schedule.cancelled")}
      </DsText>
    );
  if (finished)
    return (
      <View style={styles.metaRow}>
        <Icon name="check" size={16} color={ds.c["success-fg"]} />
        <DsText v="body-sm" c="success-fg" numberOfLines={1} style={styles.grow}>
          {student ? t("schedule.finishedBy", { teacher: look.teacher }) : t("mobileSchedule.finished", { count: look.students })}
        </DsText>
      </View>
    );
  return (
    <DsText v="body-sm" c="ink-secondary" numberOfLines={1}>
      {student ? look.teacher : t("schedule.students", { count: look.students })}
    </DsText>
  );
}

function LessonRows({
  rows,
  now,
  courseLook,
  onSelect,
  onJoin,
  student = false,
}: Pick<MobileScheduleProps, "now" | "courseLook" | "onSelect" | "onJoin" | "student"> & { rows: Lesson[] }) {
  const { t } = useTranslation("lesson");
  const ds = useDs();
  return (
    <View style={[styles.rows, { backgroundColor: ds.c.surface }]}>
      {rows.map((lesson, index) => {
        const live = lesson.status === "live";
        const finished = lesson.status === "finished" || (!live && endOf(lesson).getTime() < now.getTime());
        const look = courseLook(lesson.courseId);
        return (
          <Pressable
            key={lesson.id}
            accessibilityRole="button"
            onPress={() => onSelect(lesson)}
            style={({ pressed }) => [
              styles.row,
              index < rows.length - 1 && { borderBottomWidth: 1, borderBottomColor: ds.c.line },
              live ? { backgroundColor: ds.c["brand-subtle"] } : pressed && { backgroundColor: ds.c.subtle },
            ]}
          >
            <View style={styles.rowTimes}>
              <DsText v="title-sm" c={live ? "brand" : finished ? "ink-secondary" : "ink"}>
                {clock(lesson.startsAt)}
              </DsText>
              <DsText v="caption" c="ink-secondary">
                {clock(endOf(lesson))}
              </DsText>
            </View>
            <GroupTile name={lesson.courseTitle} tone={look.tone} src={look.image} box={44} radius={dsRadius.xl} />
            <View style={styles.cardBody}>
              <DsText v="title" c={finished ? "ink-secondary" : "ink"} numberOfLines={1}>
                {lesson.courseTitle}
              </DsText>
              <LessonMeta lesson={lesson} finished={finished} live={live} look={look} student={student} />
            </View>
            {live ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => onJoin(lesson)}
                style={({ pressed }) => [styles.enter, { backgroundColor: pressed ? ds.c["brand-strong"] : ds.c.brand }]}
              >
                <DsText v="button" c="on-action">
                  {t("mobileSchedule.enter")}
                </DsText>
              </Pressable>
            ) : (
              <Icon name="chevron-right" size={20} color={ds.c["icon-secondary"]} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

function WeekView(props: MobileScheduleProps) {
  const { t } = useTranslation("lesson");
  const ds = useDs();
  const { anchor, now, lessons, onView, onAnchor, onCreate } = props;
  const weekdaysLong = t("list.weekdaysLong", { returnObjects: true }) as string[];
  const months = t("list.months", { returnObjects: true }) as string[];
  const start = startOfWeek(anchor, WEEK_OPTIONS);
  const end = endOfWeek(anchor, WEEK_OPTIONS);
  const week = lessons.filter((lesson) => isWithinInterval(new Date(lesson.startsAt), { start, end })).sort(byStart);
  const minutes = week.reduce((sum, lesson) => sum + (lesson.durationMinutes || 45), 0);
  const finished = week.filter((lesson) => lesson.status === "finished").length;
  const current = isWithinInterval(now, { start, end });
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index))
    .filter((day) => !current || day >= startOfDay(now))
    .map((day) => ({ day, rows: onDay(week, day) }))
    .filter((entry) => entry.rows.length);

  const stats = [
    { id: "lessons", value: String(week.length), label: t("mobileSchedule.statLessons") },
    { id: "hours", value: t("mobileSchedule.hoursShort", { count: Math.round(minutes / 60) }), label: t("mobileSchedule.statHours") },
    { id: "finished", value: String(finished), label: t("mobileSchedule.statFinished") },
  ];

  return (
    <>
      <View style={[styles.summary, { backgroundColor: ds.c.brand }]}>
        <View style={styles.summaryHead}>
          <View style={[styles.heroChip, { backgroundColor: ds.c["on-brand-subtle"] }]}>
            <Icon name="bar-chart" size={16} color={ds.c["on-action"]} />
            <DsText v="caption-strong" c="on-action">
              {t("mobileSchedule.thisWeek")}
            </DsText>
          </View>
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => {
              onAnchor(new Date(now));
              onView("day");
            }}
          >
            <DsText v="caption-strong" c="on-action">
              {t("mobileSchedule.more")}
            </DsText>
          </Pressable>
        </View>
        <View style={styles.stats}>
          {stats.map((stat) => (
            <View key={stat.id} style={[styles.stat, { backgroundColor: ds.c["on-brand-subtle"] }]}>
              <DsText w="600" c="on-action" style={styles.statValue}>
                {stat.value}
              </DsText>
              <DsText v="caption" c="on-action" numberOfLines={1} style={styles.statLabel}>
                {stat.label}
              </DsText>
            </View>
          ))}
        </View>
      </View>

      {days.length ? (
        days.map(({ day, rows }) => (
          <View key={day.toISOString()} style={styles.weekSection}>
            <View style={styles.weekLabel}>
              <DsText v="caption-strong" c="ink-secondary" numberOfLines={1} style={[styles.grow, styles.upper]}>
                {weekdaysLong[(day.getDay() + 6) % 7]}, {day.getDate()}-{months[day.getMonth()]}
                {isSameDay(day, now) ? ` · ${t("schedule.today")}` : ""}
              </DsText>
              <DsText v="caption" c="ink-secondary">
                {t("schedule.lessonCountShort", { count: rows.length })}
              </DsText>
            </View>
            <LessonRows {...props} rows={rows} />
          </View>
        ))
      ) : (
        <EmptyCard iconless title={t("schedule.emptyWeek")} hint={onCreate ? t("mobileSchedule.emptyHint") : t("schedule.emptyStudentHint")} onCreate={onCreate} />
      )}
    </>
  );
}

function MonthView(props: MobileScheduleProps) {
  const { t } = useTranslation("lesson");
  const ds = useDs();
  const { anchor, lessons, onAnchor } = props;
  const weekdays = t("list.weekdaysShort", { returnObjects: true }) as string[];
  const monthsLong = t("list.monthsLong", { returnObjects: true }) as string[];
  const weekdaysLong = t("list.weekdaysLong", { returnObjects: true }) as string[];
  const gridStart = startOfWeek(startOfMonth(anchor), WEEK_OPTIONS);
  const gridEnd = endOfWeek(endOfMonth(anchor), WEEK_OPTIONS);
  const cells: Date[] = [];
  for (let day = gridStart; day <= gridEnd; day = addDays(day, 1)) cells.push(day);
  const rows = onDay(lessons, anchor);

  return (
    <>
      <View style={[styles.month, { backgroundColor: ds.c.surface }]}>
        <View style={styles.monthHead}>
          <MobileRoundButton icon="chevron-left" label={t("schedule.prev")} onPress={() => onAnchor(startOfMonth(addMonths(anchor, -1)))} />
          <DsText v="title" heading numberOfLines={1} style={[styles.grow, styles.center]}>
            {monthsLong[anchor.getMonth()]} {anchor.getFullYear()}
          </DsText>
          <MobileRoundButton icon="chevron-right" label={t("schedule.next")} onPress={() => onAnchor(startOfMonth(addMonths(anchor, 1)))} />
        </View>
        <View style={styles.monthWeekdays}>
          {weekdays.map((day) => (
            <DsText key={day} v="caption" c="ink-secondary" style={styles.monthWeekday}>
              {day}
            </DsText>
          ))}
        </View>
        {/* Haftalar alohida qatorda — foizli kenglik `flexWrap` da yaxlitlanib 6 tadan o'ralardi. */}
        <View style={styles.monthGrid}>
          {Array.from({ length: cells.length / 7 }, (_, week) => (
            <View key={week} style={styles.monthRow}>
              {cells.slice(week * 7, week * 7 + 7).map((day, column) => {
                const inMonth = isSameMonth(day, anchor);
                const active = isSameDay(day, anchor);
                const has = inMonth && lessons.some((lesson) => isSameDay(new Date(lesson.startsAt), day));
                const muted = !inMonth || column === 6;
                return (
                  <Pressable
                    key={day.toISOString()}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => onAnchor(day)}
                    style={styles.monthCell}
                  >
                    <View style={[styles.monthDay, active && { backgroundColor: ds.c.brand }]}>
                      <DsText v="body-sm" w="500" c={active ? "on-action" : muted ? "ink-disabled" : "ink"}>
                        {day.getDate()}
                      </DsText>
                      <View style={[styles.monthDot, { backgroundColor: has ? (active ? ds.c["on-action"] : ds.c.brand) : "transparent" }]} />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </View>

      <View style={styles.dayHeading}>
        <DsText v="title" heading numberOfLines={1} style={styles.grow}>
          {anchor.getDate()}-{(monthsLong[anchor.getMonth()] ?? "").toLowerCase()}, {weekdaysLong[(anchor.getDay() + 6) % 7]}
        </DsText>
        <DsText v="body-sm" c="ink-secondary">
          {rows.length ? t("schedule.lessonCount", { count: rows.length }) : t("schedule.noLessonsDay")}
        </DsText>
      </View>

      {rows.length ? <LessonRows {...props} rows={rows} /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  center: { textAlign: "center" },
  upper: { textTransform: "uppercase" },
  faded: { opacity: 0.6 },
  /* `px-4 pt-5 pb-32`, bloklar orasi `gap-5` */
  page: { gap: 20, paddingHorizontal: 16 },
  offline: { height: 44, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, borderRadius: dsRadius.xl },
  toolbar: { flexDirection: "row", alignItems: "center", gap: 12 },
  views: { height: 52, flexDirection: "row", alignItems: "center", padding: 4, borderRadius: 26 },
  viewItem: { height: 44, justifyContent: "center", paddingHorizontal: 16, borderRadius: 22 },
  dayHeading: { flexDirection: "row", alignItems: "center", gap: 12 },
  /* `grid grid-cols-7 gap-1.5`, katak `h-13.5 rounded-lg pt-2` */
  week: { flexDirection: "row", gap: 6 },
  weekDay: { flex: 1, minWidth: 0, height: 54, alignItems: "center", paddingTop: 8, borderRadius: dsRadius.lg },
  weekDot: { marginTop: -1, width: 4, height: 4, borderRadius: 2 },
  empty: { alignItems: "center", paddingHorizontal: 24, paddingVertical: 28, borderRadius: dsRadius.xl },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  emptyTitle: { marginTop: 10 },
  emptyHint: { marginTop: 14 },
  emptyHintTight: { marginTop: 12 },
  emptyAction: { marginTop: 12, height: 44, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, borderRadius: 22 },
  emptyActionWide: { marginTop: 16 },
  timeline: { marginTop: 4 },
  timelineRow: { flexDirection: "row" },
  times: { width: 46, paddingTop: 10 },
  rail: { width: 22, alignItems: "center" },
  railLine: { position: "absolute", top: 24, bottom: -8, width: 2 },
  railDot: { marginTop: 16, width: 10, height: 10, borderRadius: 5 },
  railDotHighlight: { marginTop: 13, width: 14, height: 14, borderRadius: 7, borderWidth: 3 },
  hero: { flex: 1, minWidth: 0, marginBottom: 8, marginLeft: 6, padding: 16, borderRadius: dsRadius.xl },
  heroChip: { alignSelf: "flex-start", height: 24, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, borderRadius: 12 },
  heroTitle: { marginTop: 10, fontSize: 20, lineHeight: 26 },
  heroMeta: { marginTop: 2 },
  heroButton: { marginTop: 12, height: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 22 },
  card: { flex: 1, minWidth: 0, marginBottom: 8, marginLeft: 6, flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: dsRadius.xl },
  cardBody: { flex: 1, minWidth: 0, gap: 2 },
  cardTitle: { paddingRight: 24 },
  cardChevron: { position: "absolute", right: 12, top: 0, bottom: 0, justifyContent: "center" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  liveDot: { width: 8, height: 8, borderRadius: 4, marginRight: 2 },
  rows: { overflow: "hidden", borderRadius: dsRadius.xl },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 16 },
  rowTimes: { width: 44 },
  enter: { height: 36, justifyContent: "center", paddingHorizontal: 16, borderRadius: 18 },
  summary: { gap: 12, padding: 16, borderRadius: dsRadius.xl },
  summaryHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  stats: { flexDirection: "row", gap: 8 },
  stat: { flex: 1, minWidth: 0, height: 62, paddingHorizontal: 12, paddingTop: 10, borderRadius: dsRadius.lg },
  statValue: { fontSize: 20, lineHeight: 26 },
  statLabel: { marginTop: 2 },
  weekSection: { gap: 8 },
  weekLabel: { flexDirection: "row", alignItems: "center", gap: 12 },
  month: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 18, borderRadius: dsRadius.xl },
  monthHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  monthWeekdays: { marginTop: 2, flexDirection: "row" },
  monthWeekday: { flex: 1, textAlign: "center", paddingVertical: 4 },
  monthGrid: { gap: 6 },
  monthRow: { flexDirection: "row" },
  monthCell: { flex: 1, alignItems: "center" },
  monthDay: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: dsRadius.lg },
  monthDot: { width: 4, height: 4, borderRadius: 2 },
});
