import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { CalendarDays, FileQuestion, Hourglass, Repeat, Trash2, TriangleAlert } from "lucide-react-native";
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
  DateField,
  FullscreenDialog,
  Input,
  SelectField,
  SheetButton,
  Text,
  TimeField,
  useLegacyColors,
  useTheme,
} from "@/shared/ui";

export interface AddLessonDialogProps {
  open: boolean;
  onClose: () => void;
  courseId: string;
  /**
   * Berilsa — oyna TAHRIR rejimida ochiladi: maydonlar to'ldirilgan,
   * takrorlash yo'q va saqlash `update` ga ketadi. Chaqiruvchi oynani
   * `key={editing?.id ?? "new"}` bilan qayta quradi (vebdagidek).
   */
  editing?: Lesson | null;
  /** Tahrirda pastdagi "Darsni o'chirish" — tasdiqlash oynasini ochadi. */
  onDelete?: () => void;
}

const DURATION_OPTIONS = [30, 45, 60, 90];

/**
 * `yyyy-MM-dd` — MAHALLIY vaqt bo'yicha. `toISOString()` UTC qaytaradi va
 * kechqurun (UTC+5) sana bir kun orqaga surilardi.
 */
function toDateValue(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
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

/** `yyyy-MM-dd` -> mahalliy `Date` (yarim tunda). */
function parseDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year!, (month ?? 1) - 1, day ?? 1);
}

/**
 * Yangi dars — veb `group-action-dialogs.tsx` dagi `AddLessonDialog`
 * (telefonda butun ekran): mavzu, "Bitta dars / Takrorlanuvchi", sana,
 * vaqt, davomiylik, test biriktirish; takrorlanuvchida hafta kunlari,
 * oraliq va nechta dars yaratilishi. Vaqt to'qnashuvi — ogohlantirish,
 * taqiq emas (vebdagidek).
 *
 * Saqlash shu yerda (vebda `LessonsPanel` da): mobilda oyna bitta joydan
 * ochiladi va mutatsiyalar u bilan birga turadi.
 */
export function AddLessonDialog({ open, onClose, courseId, editing = null, onDelete }: AddLessonDialogProps) {
  const { t } = useTranslation("group");
  const { t: tl } = useTranslation("lesson");
  const { t: tc } = useTranslation("common");
  const { palette } = useTheme();
  const colors = useLegacyColors();
  const create = useCreateLesson();
  const update = useUpdateLesson();
  const createSchedule = useCreateLessonSchedule();

  // To'qnashuv BARCHA darslar bo'yicha (boshqa guruhdagi ham) — veb `allLessons`.
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
  const formatDate = (value: string) => {
    const date = parseDate(value);
    return `${date.getDate()}-${months[date.getMonth()] ?? ""}`;
  };
  const weekdayLabels = t("dialogs.lesson.weekdayLabels", { returnObjects: true }) as string[];
  const weekdayShort = t("dialogs.lesson.weekdayShort", { returnObjects: true }) as string[];

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
  const today = todayString();
  const editingPast = Boolean(editing) && date < today;
  const startsInPast =
    !isRepeating && !editingPast && Boolean(date) && (date < today || (date === today && time < nowTimeString()));
  const invalidRange = isRepeating && Boolean(range.to) && range.to < range.from;
  const existing = useMemo(() => allLessons.data ?? [], [allLessons.data]);

  const dates = useMemo(
    () => (isRepeating ? buildScheduleDates({ startsOn: range.from, endsOn: range.to, weekdays }) : []),
    [isRepeating, range.from, range.to, weekdays]
  );

  const singleConflicts = useMemo(() => {
    if (isRepeating || !date) return [];
    return findScheduleConflicts(existing, {
      date,
      time,
      durationMinutes,
      excludeLessonId: editing?.id ?? null,
    });
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
    setWeekdays((current) =>
      current.includes(value) ? current.filter((day) => day !== value) : [...current, value].sort((a, b) => a - b)
    );
  }

  const sameDays = (a: readonly number[], b: readonly number[]) =>
    a.length === b.length && a.every((day, index) => day === b[index]);

  const pending = create.isPending || update.isPending || createSchedule.isPending;
  const disabled = isRepeating ? !dates.length || invalidRange : !topic.trim() || startsInPast;

  async function submit() {
    if (!time || startsInPast || disabled) return;
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

  const durationOptions = DURATION_OPTIONS.map((value) => ({ value: String(value), label: String(value) }));
  const startTime = (
    <TimeField label={t("dialogs.lesson.startTime")} value={time} onChange={setTime} />
  );
  const durationField = (
    <SelectField
      label={t("dialogs.lesson.duration")}
      icon={<Hourglass size={17} color={palette["muted-foreground"]} />}
      value={duration}
      onChange={setDuration}
      options={durationOptions}
      suffix={tc("formPickers.minuteUnit")}
    />
  );

  return (
    <FullscreenDialog
      open={open}
      onClose={onClose}
      title={editing ? t("dialogs.lesson.editTitle") : t("dialogs.lesson.newTitle")}
      description={editing ? t("dialogs.lesson.editDescription") : t("dialogs.lesson.description")}
      footer={
        <>
          <SheetButton title={t("dialogs.lesson.cancel")} onPress={onClose} />
          <SheetButton
            variant="primary"
            title={
              editing
                ? t("dialogs.lesson.saveChanges")
                : isRepeating
                  ? t("dialogs.lesson.saveMultiple", { count: dates.length })
                  : t("dialogs.lesson.saveSingle")
            }
            disabled={disabled}
            loading={pending}
            onPress={() => void submit()}
          />
        </>
      }
    >
      {/* `.group-action-form` — bloklar orasi 11 */}
      <View style={styles.form}>
        {isRepeating ? null : (
          <Input
            label={t("dialogs.lesson.topicLabel")}
            value={topic}
            onChangeText={setTopic}
            placeholder={t("dialogs.lesson.topicPlaceholder")}
            autoFocus={!editing}
          />
        )}

        {canRepeat ? (
          <View
            accessibilityRole="radiogroup"
            accessibilityLabel={t("dialogs.lesson.typeAria")}
            style={[styles.mode, { borderColor: colors.border, backgroundColor: palette["surface-subtle"] }]}
          >
            <ModeButton active={!repeat} icon={CalendarDays} label={t("dialogs.lesson.single")} onPress={() => setRepeat(false)} />
            <ModeButton
              active={repeat}
              icon={Repeat}
              label={t("dialogs.lesson.repeating")}
              onPress={() => {
                setRepeat(true);
                setTopic("");
              }}
            />
          </View>
        ) : null}

        {isRepeating ? (
          <>
            <Text variant="caption" style={[styles.note, { color: palette["primary-text"], backgroundColor: palette["primary-tint"] }]}>
              {t("dialogs.lesson.repeatingTopicNote")}
            </Text>

            {/* `.field-block` — yorliq, tayyor to'plamlar va yetti kun */}
            <View style={styles.block}>
              <Text variant="label" style={styles.label}>
                {t("dialogs.lesson.weekdaysLabel")}
              </Text>
              <View style={styles.presets}>
                <Preset active={sameDays(weekdays, ODD_WEEKDAYS)} label={t("dialogs.lesson.oddDays")} onPress={() => setWeekdays([...ODD_WEEKDAYS])} />
                <Preset active={sameDays(weekdays, EVEN_WEEKDAYS)} label={t("dialogs.lesson.evenDays")} onPress={() => setWeekdays([...EVEN_WEEKDAYS])} />
              </View>
              <View style={styles.weekdays}>
                {WEEKDAYS.map((day, index) => {
                  const active = weekdays.includes(day.value);
                  return (
                    <Pressable
                      key={day.value}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={weekdayLabels[index]}
                      onPress={() => toggleWeekday(day.value)}
                      style={[
                        styles.weekday,
                        active
                          ? { borderColor: palette.primary, backgroundColor: palette.primary }
                          : { borderColor: colors.border, backgroundColor: palette.surface },
                      ]}
                    >
                      <Text
                        variant="caption"
                        style={[styles.weekdayText, { color: active ? palette["primary-foreground"] : colors.muted }]}
                      >
                        {weekdayShort[index]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <DateField
              label={t("dialogs.lesson.startDate")}
              value={range.from}
              minimumDate={parseDate(today)}
              onChange={(value) =>
                setRange((current) => ({ from: value, to: current.to && current.to < value ? value : current.to }))
              }
            />
            <DateField
              label={t("dialogs.lesson.endDate")}
              value={range.to}
              minimumDate={parseDate(range.from || today)}
              onChange={(value) => setRange((current) => ({ ...current, to: value }))}
            />
            {startTime}
            {durationField}
          </>
        ) : (
          <>
            <DateField
              label={t("dialogs.lesson.dateLabel")}
              value={date}
              minimumDate={editingPast ? undefined : parseDate(today)}
              onChange={setDate}
            />
            {startTime}
            {durationField}
            <View style={styles.quiz}>
              <SelectField
                label={t("dialogs.lesson.quizLabel")}
                icon={<FileQuestion size={17} color={palette["muted-foreground"]} />}
                value={quizId}
                onChange={setQuizId}
                options={[{ value: "", label: t("dialogs.lesson.quizNone") }, ...quizOptions]}
              />
              <Text variant="caption" style={[styles.hint, { color: palette["subtle-foreground"] }]}>
                {t("dialogs.lesson.quizHint")}
              </Text>
            </View>
          </>
        )}

        {isRepeating ? (
          <Text
            variant="label"
            style={[
              styles.summary,
              dates.length
                ? { color: colors.muted, backgroundColor: palette["surface-subtle"] }
                : { color: palette["warning-strong"], backgroundColor: palette["warning-soft"] },
            ]}
          >
            {dates.length
              ? t("dialogs.lesson.scheduleSummary", {
                  count: dates.length,
                  limitNote: dates.length >= MAX_SCHEDULE_LESSONS ? t("dialogs.lesson.limitNote") : "",
                  first: formatDate(dates[0]!),
                  last: formatDate(dates[dates.length - 1]!),
                })
              : t("dialogs.lesson.noMatchingDays")}
          </Text>
        ) : null}

        {startsInPast ? (
          <Text
            variant="label"
            accessibilityRole="alert"
            style={[
              styles.past,
              {
                borderColor: palette["destructive-soft-border"],
                color: palette["destructive-strong"],
                backgroundColor: palette["destructive-soft"],
              },
            ]}
          >
            {t("dialogs.lesson.pastTimeError", { time: nowTimeString() })}
          </Text>
        ) : null}

        <ConflictNotice single={singleConflicts} schedule={scheduleConflicts} formatDate={formatDate} />

        {editing && onDelete ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              onClose();
              onDelete();
            }}
            style={({ pressed }) => [styles.delete, pressed && { backgroundColor: palette["destructive-soft"] }]}
          >
            <Trash2 size={17} color={palette["destructive-strong"]} />
            <Text variant="label" style={{ color: palette["destructive-strong"] }}>
              {t("dialogs.lesson.deleteLesson")}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </FullscreenDialog>
  );
}

/** `.schedule-mode button` — 38 balandlik, yumaloq, faol bo'lsa ko'k. */
function ModeButton({
  active,
  icon: Icon,
  label,
  onPress,
}: {
  active: boolean;
  icon: typeof CalendarDays;
  label: string;
  onPress: () => void;
}) {
  const { palette } = useTheme();
  const colors = useLegacyColors();
  const color = active ? palette["primary-foreground"] : colors.muted;
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: active }}
      onPress={onPress}
      style={[styles.modeButton, active && { backgroundColor: palette.primary }]}
    >
      <Icon size={15} color={color} />
      <Text variant="label" style={[styles.modeText, { color }]}>
        {label}
      </Text>
    </Pressable>
  );
}

/** `.weekday-presets button` — 6 12, yumaloq, 12px. */
function Preset({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  const { palette } = useTheme();
  const colors = useLegacyColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[
        styles.preset,
        active
          ? { borderColor: palette["border-accent-strong"], backgroundColor: palette["primary-tint"] }
          : { borderColor: colors.border, backgroundColor: palette.surface },
      ]}
    >
      <Text variant="caption" style={[styles.presetText, { color: active ? palette["primary-text"] : colors.muted }]}>
        {label}
      </Text>
    </Pressable>
  );
}

/** `.schedule-conflict` — qizil fonli ogohlantirish va to'qnashgan darslar. */
function ConflictNotice({
  single,
  schedule,
  formatDate,
}: {
  single: Lesson[];
  schedule: Array<{ date: string; conflicts: Lesson[] }>;
  formatDate: (value: string) => string;
}) {
  const { t } = useTranslation("group");
  const { palette } = useTheme();
  const colors = useLegacyColors();
  if (!single.length && !schedule.length) return null;

  const lines = single.length
    ? single.map((lesson) =>
        t("dialogs.conflict.lessonLine", {
          course: lesson.courseTitle,
          title: lesson.title,
          time: lesson.time,
          duration: lesson.durationMinutes,
        })
      )
    : [
        ...schedule.slice(0, 4).map(({ date, conflicts }) =>
          t("dialogs.conflict.scheduleLine", {
            date: formatDate(date),
            course: conflicts[0]?.courseTitle,
            time: conflicts[0]?.time,
          })
        ),
        ...(schedule.length > 4 ? [t("dialogs.conflict.andMore", { count: schedule.length - 4 })] : []),
      ];

  return (
    <View
      accessibilityRole="alert"
      style={[styles.conflict, { borderColor: palette["destructive-soft-border"], backgroundColor: palette["destructive-soft"] }]}
    >
      <TriangleAlert size={16} color={palette["destructive-strong"]} style={styles.conflictIcon} />
      <View style={styles.conflictBody}>
        <Text variant="label" style={[styles.conflictTitle, { color: palette["destructive-strong"] }]}>
          {single.length ? t("dialogs.conflict.singleTitle") : t("dialogs.conflict.scheduleTitle", { count: schedule.length })}
        </Text>
        {lines.map((line) => (
          <Text key={line} variant="label" style={[styles.conflictLine, { color: colors.foreground }]}>
            {`•  ${line}`}
          </Text>
        ))}
        <Text variant="caption" style={{ color: colors.muted }}>
          {t("dialogs.conflict.note")}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 11 },
  label: { lineHeight: 21, fontWeight: "500" },
  /* `.schedule-mode` — 4 bo'shliq, yumaloq, kulrang fon */
  mode: { flexDirection: "row", gap: 3, padding: 4, borderWidth: 1, borderRadius: 999 },
  modeButton: { flex: 1, minHeight: 38, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 999 },
  modeText: { fontSize: 13, lineHeight: 19.5, fontWeight: "600" },
  /* `.schedule-topic-note` — 9 11, radius 10, 12/650 */
  note: { overflow: "hidden", paddingVertical: 9, paddingHorizontal: 11, borderRadius: 10, fontSize: 12, lineHeight: 18, fontWeight: "600" },
  block: { gap: 9 },
  presets: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  preset: { paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1, borderRadius: 999 },
  presetText: { fontSize: 12, lineHeight: 18, fontWeight: "700" },
  /* `.weekday-picker` — yetti teng ustun, orasi 5 */
  weekdays: { flexDirection: "row", gap: 5 },
  weekday: { flex: 1, minHeight: 40, alignItems: "center", justifyContent: "center", borderWidth: 1, borderRadius: 10 },
  weekdayText: { fontSize: 12, lineHeight: 18, fontWeight: "700" },
  quiz: { gap: 6 },
  hint: { paddingHorizontal: 4, fontWeight: "500" },
  /* `.schedule-summary` — 10 12, radius 10, 13px */
  summary: { overflow: "hidden", paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, fontSize: 13, fontWeight: "400" },
  past: { overflow: "hidden", paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderRadius: 10, fontWeight: "500" },
  /* `.schedule-conflict` — 11 13, radius 13 */
  conflict: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 11, paddingHorizontal: 13, borderWidth: 1, borderRadius: 13 },
  conflictIcon: { marginTop: 1 },
  conflictBody: { flex: 1, minWidth: 0, gap: 5 },
  conflictTitle: { fontSize: 14 },
  conflictLine: { fontSize: 13, fontWeight: "400" },
  delete: { alignSelf: "center", height: 44, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, borderRadius: 999 },
});
