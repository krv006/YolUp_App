import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import {
  buildScheduleDates,
  EVEN_WEEKDAYS,
  findScheduleConflicts,
  findScheduleConflictsForDates,
  MAX_SCHEDULE_LESSONS,
  ODD_WEEKDAYS,
  useCreateLesson,
  useCreateLessonSchedule,
  useLessons,
  useUpdateLesson,
  WEEKDAYS,
} from "@/modules/lesson";
import { quizDisplayTitle, useQuizzes } from "@/modules/quiz";
import type { Lesson } from "@/shared/types";
import {
  DsText,
  dsRadius,
  Icon,
  MobileButton,
  MobileChoiceChips,
  MobileFieldLabel,
  MobileInput,
  MobilePickerField,
  MobileToggle,
  Sheet,
  useDs,
} from "@/shared/ui";

export interface AddLessonDialogProps {
  open: boolean;
  onClose: () => void;
  courseId: string;
  /**
   * Berilsa — oyna tahrir rejimida: maydonlar to'ldirilgan, takrorlash yo'q
   * va saqlash `update` ga ketadi. Chaqiruvchi `key={editing?.id ?? "new"}`
   * bilan qayta quradi (vebdagidek).
   */
  editing?: Lesson | null;
  /** Tahrirda pastdagi "Darsni o'chirish" — tasdiqlash oynasini ochadi. */
  onDelete?: () => void;
}

const MOBILE_DURATIONS = [45, 60, 90, 120] as const;

/** `yyyy-MM-dd` mahalliy vaqt bo'yicha (`toISOString` UTC beradi va sana surilardi). */
function toDateValue(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function todayString(): string {
  return toDateValue(new Date());
}

function nowTimeString(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function monthLaterString(): string {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return toDateValue(date);
}

function parseDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

/**
 * Yangi dars / darsni tahrirlash — veb `group-action-dialogs.tsx` dagi
 * `AddLessonDialog` ning tor ekran (`ModalCard`) varianti: mavzu, "Bir
 * marta / Takrorlanuvchi", sana va vaqt tanlagichlari, davomiylik chiplari,
 * test; takrorlanuvchida hafta kunlari, oraliq va nechta dars bo'lishi.
 * Vaqt band yoki o'tib ketgan bo'lsa maydon qizil va saqlash yopiq.
 *
 * Saqlash shu yerda (vebda `LessonsPanel` da) — mutatsiyalar oyna bilan birga.
 */
export function AddLessonDialog({ open, onClose, courseId, editing = null, onDelete }: AddLessonDialogProps) {
  const { t } = useTranslation("group");
  const { t: tl } = useTranslation("lesson");
  const ds = useDs();
  const create = useCreateLesson();
  const update = useUpdateLesson();
  const createSchedule = useCreateLessonSchedule();

  // To'qnashuv barcha darslar bo'yicha (boshqa guruhdagi ham) — veb `allLessons`.
  const allLessons = useLessons({ page_size: 200 }, open);
  const courseQuizzes = useQuizzes(courseId, open);
  const quizOptions = useMemo(
    () =>
      (courseQuizzes.data ?? [])
        .filter((quiz) => !quiz.lessonId || quiz.lessonId === editing?.id)
        .map((quiz) => ({ value: quiz.id, label: quizDisplayTitle(quiz) })),
    [courseQuizzes.data, editing]
  );

  const months = tl("list.months", { returnObjects: true }) as string[];
  const formatDate = (date: Date) => `${date.getDate()}-${(months[date.getMonth()] ?? "").toLowerCase()}`;
  const weekdayLabels = t("dialogs.lesson.weekdayLabels", { returnObjects: true }) as string[];
  const weekdayShort = t("dialogs.lesson.weekdayShort", { returnObjects: true }) as string[];
  const labelOf = (value: number) => weekdayLabels[WEEKDAYS.findIndex((day) => day.value === value)] ?? "";
  const shortOf = (value: number) => weekdayShort[WEEKDAYS.findIndex((day) => day.value === value)] ?? "";

  const [topic, setTopic] = useState(editing?.topic ?? editing?.title ?? "");
  const [date, setDate] = useState(editing?.date ?? todayString());
  const [time, setTime] = useState(editing?.time ?? "18:30");
  const [duration, setDuration] = useState(String(editing?.durationMinutes ?? editing?.duration ?? "45"));
  const [quizId, setQuizId] = useState(editing?.quizId ?? "");
  const [repeat, setRepeat] = useState(false);
  const [weekdays, setWeekdays] = useState<number[]>([...ODD_WEEKDAYS]);
  const [range, setRange] = useState(() => ({ from: todayString(), to: monthLaterString() }));

  const canRepeat = !editing;
  const isRepeating = canRepeat && repeat;
  const durationMinutes = Number(duration) || 45;
  const durationPicker = { value: durationMinutes, options: MOBILE_DURATIONS, onChange: (value: number) => setDuration(String(value)) };
  const today = todayString();
  const editingPast = Boolean(editing) && date < today;
  const startsInPast = !isRepeating && !editingPast && Boolean(date) && (date < today || (date === today && time < nowTimeString()));
  const invalidRange = isRepeating && Boolean(range.to) && range.to < range.from;
  const existing = useMemo(() => allLessons.data ?? [], [allLessons.data]);

  const dates = useMemo(
    () => (isRepeating ? buildScheduleDates({ startsOn: range.from, endsOn: range.to, weekdays }) : []),
    [isRepeating, range.from, range.to, weekdays]
  );

  const singleConflicts = useMemo(() => {
    if (isRepeating || !date) return [];
    return findScheduleConflicts(existing, { date, time, durationMinutes, excludeLessonId: editing?.id ?? null });
  }, [isRepeating, existing, date, time, durationMinutes, editing]);

  const scheduleConflicts = useMemo(
    () => (isRepeating ? findScheduleConflictsForDates(existing, dates, time, durationMinutes) : []),
    [isRepeating, existing, dates, time, durationMinutes]
  );

  function reset() {
    setTopic("");
    setDate(todayString());
    setTime("18:30");
    setDuration("45");
    setQuizId("");
    setRepeat(false);
    setWeekdays([...ODD_WEEKDAYS]);
    setRange({ from: todayString(), to: monthLaterString() });
  }

  function toggleWeekday(value: number) {
    setWeekdays((current) => (current.includes(value) ? current.filter((day) => day !== value) : [...current, value].sort((a, b) => a - b)));
  }

  const timeBusy = singleConflicts.length > 0 || startsInPast;
  const pending = create.isPending || update.isPending || createSchedule.isPending;
  const submitDisabled = isRepeating
    ? !dates.length || invalidRange || scheduleConflicts.length > 0
    : !topic.trim() || startsInPast || singleConflicts.length > 0;

  async function submit() {
    if (!time || submitDisabled || pending) return;
    try {
      if (isRepeating) {
        await createSchedule.mutateAsync({
          courseId,
          title: "",
          time,
          durationMinutes,
          weekdays,
          startsOn: range.from,
          endsOn: range.to,
          dates,
        });
      } else {
        const form = { courseId, topic, date: date || todayString(), time, duration, quizId };
        if (editing) await update.mutateAsync({ id: editing.id, form });
        else await create.mutateAsync(form);
      }
      reset();
      onClose();
    } catch {
      // Xato toast'ini mutatsiyaning o'zi chiqaradi; oyna ochiq qoladi.
    }
  }

  const dateDisplay = (value: string) => {
    if (!value) return "—";
    const parsed = parseDate(value);
    const label = formatDate(parsed);
    if (value === today) return t("dialogs.lesson.todayDate", { date: label });
    return `${shortOf(parsed.getDay() || 7)}, ${label}`;
  };
  const quizSelectOptions = [{ value: "", label: t("dialogs.lesson.quizNone") }, ...quizOptions];
  const quizLabel = quizSelectOptions.find((option) => option.value === quizId)?.label;

  return (
    <Sheet
      variant="app"
      open={open}
      onClose={onClose}
      title={editing ? t("dialogs.lesson.editTitle") : t("dialogs.lesson.newTitle")}
      description={
        editing
          ? t("dialogs.lesson.editDescription")
          : timeBusy
            ? undefined
            : isRepeating
              ? t("dialogs.lesson.repeatingSubtitle")
              : t("dialogs.lesson.mobileSubtitle")
      }
      footer={
        <View style={styles.footer}>
          <MobileButton
            label={
              editing
                ? t("dialogs.lesson.saveChanges")
                : isRepeating
                  ? t("dialogs.lesson.saveMultiple", { count: dates.length })
                  : t("dialogs.lesson.saveSingle")
            }
            disabled={submitDisabled || pending}
            onPress={() => void submit()}
            style={styles.fullButton}
          />
          {editing && onDelete ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                onClose();
                onDelete();
              }}
              style={styles.delete}
            >
              <Icon name="trash" size={20} color={ds.c["error-text"]} />
              <DsText w="500" c="error-text">
                {t("dialogs.lesson.deleteLesson")}
              </DsText>
            </Pressable>
          ) : null}
        </View>
      }
    >
      {isRepeating ? null : (
        <MobileFieldLabel label={t("dialogs.lesson.topicLabel")}>
          <MobileInput value={topic} onChangeText={setTopic} placeholder={t("dialogs.lesson.topicPlaceholder")} />
        </MobileFieldLabel>
      )}

      {canRepeat && !timeBusy ? (
        <MobileToggle
          items={[
            { id: "single", label: t("dialogs.lesson.single") },
            { id: "repeat", label: t("dialogs.lesson.repeating") },
          ]}
          value={repeat ? "repeat" : "single"}
          onChange={(mode) => {
            setRepeat(mode === "repeat");
            if (mode === "repeat") setTopic("");
          }}
        />
      ) : null}

      {isRepeating ? (
        <>
          <MobileFieldLabel
            label={t("dialogs.lesson.weekdaysLabel")}
            aside={
              <DsText v="body-sm" c="brand-strong">
                <DsText v="body-sm" c="brand-strong" onPress={() => setWeekdays([...ODD_WEEKDAYS])}>
                  {t("dialogs.lesson.oddDays")}
                </DsText>
                {" · "}
                <DsText v="body-sm" c="brand-strong" onPress={() => setWeekdays([...EVEN_WEEKDAYS])}>
                  {t("dialogs.lesson.evenDays")}
                </DsText>
              </DsText>
            }
          >
            <View style={styles.weekdays}>
              {WEEKDAYS.map((day) => {
                const active = weekdays.includes(day.value);
                return (
                  <Pressable
                    key={day.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={labelOf(day.value)}
                    onPress={() => toggleWeekday(day.value)}
                    style={[styles.weekday, { backgroundColor: active ? ds.c.brand : ds.c.subtle }]}
                  >
                    <DsText v="body-sm" w="500" c={active ? "on-action" : "ink"}>
                      {shortOf(day.value)}
                    </DsText>
                  </Pressable>
                );
              })}
            </View>
          </MobileFieldLabel>

          <View style={styles.pair}>
            <View style={styles.grow}>
              <MobileFieldLabel label={t("dialogs.lesson.startDate")}>
                <MobilePickerField
                  type="date"
                  value={range.from}
                  min={today}
                  display={formatDate(parseDate(range.from))}
                  ariaLabel={t("dialogs.lesson.startDate")}
                  onChange={(value) => setRange((current) => ({ from: value, to: current.to && current.to < value ? value : current.to }))}
                />
              </MobileFieldLabel>
            </View>
            <View style={styles.grow}>
              <MobileFieldLabel label={t("dialogs.lesson.endDate")}>
                <MobilePickerField
                  type="date"
                  value={range.to}
                  min={range.from || today}
                  display={formatDate(parseDate(range.to))}
                  ariaLabel={t("dialogs.lesson.endDate")}
                  onChange={(value) => setRange((current) => ({ ...current, to: value }))}
                />
              </MobileFieldLabel>
            </View>
          </View>

          <View style={styles.pair}>
            <View style={styles.grow}>
              <MobileFieldLabel label={t("dialogs.lesson.timeShort")}>
                <MobilePickerField
                  type="time"
                  value={time}
                  display={time}
                  ariaLabel={t("dialogs.lesson.startTime")}
                  duration={durationPicker}
                  onChange={setTime}
                />
              </MobileFieldLabel>
            </View>
            <View style={styles.grow}>
              <MobileFieldLabel label={t("dialogs.lesson.duration")}>
                <MobilePickerField
                  type="select"
                  value={String(durationMinutes)}
                  display={t("dialogs.lesson.minutesValue", { count: durationMinutes })}
                  options={MOBILE_DURATIONS.map((value) => ({ value: String(value), label: t("dialogs.lesson.minutesValue", { count: value }) }))}
                  ariaLabel={t("dialogs.lesson.duration")}
                  onChange={setDuration}
                />
              </MobileFieldLabel>
            </View>
          </View>

          <View style={[styles.summary, { backgroundColor: dates.length ? ds.c["brand-subtle"] : ds.c["warning-bg"] }]}>
            <Icon name={dates.length ? "bolt" : "warning"} size={20} color={dates.length ? ds.c.brand : ds.c["warning-fg"]} />
            <DsText v="body-sm" c={dates.length ? "brand" : "warning-fg"} style={styles.grow}>
              {dates.length
                ? t("dialogs.lesson.scheduleFirst", {
                    count: dates.length,
                    limitNote: dates.length >= MAX_SCHEDULE_LESSONS ? t("dialogs.lesson.limitNote") : "",
                    first: formatDate(new Date(dates[0] ?? "")).toLowerCase(),
                    weekday: labelOf(new Date(dates[0] ?? "").getDay() || 7),
                  })
                : t("dialogs.lesson.noMatchingDays")}
            </DsText>
          </View>
        </>
      ) : (
        <>
          <View style={styles.pair}>
            <View style={styles.grow}>
              <MobileFieldLabel label={t("dialogs.lesson.dateLabel")}>
                <MobilePickerField
                  type="date"
                  value={date}
                  min={editingPast ? undefined : today}
                  display={dateDisplay(date)}
                  ariaLabel={t("dialogs.lesson.dateLabel")}
                  onChange={setDate}
                />
              </MobileFieldLabel>
            </View>
            <View style={[styles.grow, styles.timeColumn]}>
              <MobileFieldLabel label={t("dialogs.lesson.startShort")}>
                <MobilePickerField
                  type="time"
                  value={time}
                  display={time}
                  invalid={timeBusy}
                  ariaLabel={t("dialogs.lesson.startTime")}
                  duration={durationPicker}
                  onChange={setTime}
                />
              </MobileFieldLabel>
              {timeBusy ? (
                <DsText v="caption" c="error-text">
                  {t("dialogs.lesson.timeBusy")}
                </DsText>
              ) : null}
            </View>
          </View>

          {timeBusy ? null : (
            <>
              <MobileFieldLabel label={t("dialogs.lesson.durationMinutes")}>
                <MobileChoiceChips items={MOBILE_DURATIONS} value={durationMinutes as (typeof MOBILE_DURATIONS)[number]} onChange={(value) => setDuration(String(value))} />
              </MobileFieldLabel>
              <MobileFieldLabel label={t("dialogs.lesson.quizLabel")}>
                <MobilePickerField
                  type="select"
                  value={quizId}
                  display={quizLabel}
                  options={quizSelectOptions}
                  ariaLabel={t("dialogs.lesson.quizLabel")}
                  onChange={setQuizId}
                />
              </MobileFieldLabel>
            </>
          )}
        </>
      )}

      {startsInPast && !singleConflicts.length ? (
        <DsText v="body-sm" c="error-text">
          {t("dialogs.lesson.pastTimeError", { time: nowTimeString() })}
        </DsText>
      ) : null}

      <ConflictNotice single={singleConflicts} schedule={scheduleConflicts} formatDate={formatDate} />
    </Sheet>
  );
}

/** Band vaqt haqida ogohlantirish — veb `ConflictNotice`. */
function ConflictNotice({
  single,
  schedule,
  formatDate,
}: {
  single: Lesson[];
  schedule: Array<{ date: string; conflicts: Lesson[] }>;
  formatDate: (date: Date) => string;
}) {
  const { t } = useTranslation("group");
  const ds = useDs();
  if (!single.length && !schedule.length) return null;

  const lines = single.length
    ? single.map((lesson) => ({
        key: lesson.id,
        text: t("dialogs.conflict.lessonLine", { course: lesson.courseTitle, title: lesson.title, time: lesson.time, duration: lesson.durationMinutes }),
      }))
    : [
        ...schedule.slice(0, 4).map(({ date, conflicts }) => ({
          key: date,
          text: t("dialogs.conflict.scheduleLine", { date: formatDate(new Date(date)), course: conflicts[0]?.courseTitle, time: conflicts[0]?.time }),
        })),
        ...(schedule.length > 4 ? [{ key: "more", text: t("dialogs.conflict.andMore", { count: schedule.length - 4 }) }] : []),
      ];

  return (
    <View accessibilityRole="alert" style={[styles.conflict, { backgroundColor: ds.c["warning-bg"] }]}>
      <View style={styles.conflictHead}>
        <Icon name="warning" size={18} color={ds.c.warning} />
        <DsText v="title-sm" c="warning-fg">
          {single.length ? t("dialogs.conflict.singleTitle") : t("dialogs.conflict.scheduleTitle", { count: schedule.length })}
        </DsText>
      </View>
      <DsText v="body-sm" c="warning-fg">
        {lines.map((line) => `${line.text}. `).join("")}
        {t("dialogs.conflict.note")}
      </DsText>
    </View>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  pair: { flexDirection: "row", gap: 12 },
  timeColumn: { gap: 6 },
  footer: { flex: 1, gap: 16 },
  fullButton: { flex: 0, alignSelf: "stretch" },
  delete: { height: 24, flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", paddingLeft: 16 },
  weekdays: { flexDirection: "row", justifyContent: "space-between" },
  weekday: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  /* `min-h-15 rounded-xl px-4 py-2.5 gap-3` */
  summary: { minHeight: 60, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 10, borderRadius: dsRadius.xl },
  conflict: { gap: 6, paddingHorizontal: 16, paddingVertical: 14, borderRadius: dsRadius.xl },
  conflictHead: { flexDirection: "row", alignItems: "center", gap: 8 },
});
