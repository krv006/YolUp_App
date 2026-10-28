import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useQuizzes } from "@/modules/quiz";
import {
  DsText,
  dsRadius,
  GroupTile,
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

export interface NewLessonValues {
  courseId: string;
  topic: string;
  date: string;
  time: string;
  duration: string;
  quizId: string;
  repeatWeeks: number;
}

export interface NewLessonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses: ReadonlyArray<{ id: string; title: string; studentCount?: number; tone?: string; image?: string | null }>;
  pending?: boolean;
  onSubmit: (values: NewLessonValues) => void;
}

const DURATIONS = [45, 60, 90, 120];
const MIN_WEEKS = 2;
const MAX_WEEKS = 52;

function today(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/**
 * Jadvaldan yangi dars — veb `pages/schedule/new-lesson-dialog.tsx` ning tor
 * ekran varianti: guruh plitkalari, mavzu, sana va vaqt, "Bir marta / Har
 * hafta" va haftalar soni, davomiylik, test.
 */
export function NewLessonDialog({ open, onOpenChange, courses, pending = false, onSubmit }: NewLessonDialogProps) {
  const { t } = useTranslation("lesson");
  const ds = useDs();
  const [courseId, setCourseId] = useState("");
  const [topic, setTopic] = useState("");
  const [repeat, setRepeat] = useState(false);
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("18:00");
  const [duration, setDuration] = useState(90);
  const [quizId, setQuizId] = useState("");
  const [weeks, setWeeks] = useState(8);
  const quizzes = useQuizzes(courseId || null, Boolean(courseId) && open);
  const weekdays = t("list.weekdaysShort", { returnObjects: true }) as string[];
  const months = t("list.months", { returnObjects: true }) as string[];
  const canSubmit = !pending && Boolean(courseId) && Boolean(topic.trim());

  const picked = new Date(`${date}T00:00`);
  const dateLabel = Number.isNaN(picked.getTime())
    ? date
    : `${weekdays[(picked.getDay() + 6) % 7] ?? ""}, ${picked.getDate()}-${(months[picked.getMonth()] ?? "").toLowerCase()}`;

  function submit() {
    onSubmit({ courseId, topic: topic.trim(), date, time, duration: String(duration), quizId, repeatWeeks: repeat ? weeks : 0 });
  }

  return (
    <Sheet
      variant="app"
      open={open}
      onClose={() => onOpenChange(false)}
      title={t("scheduleDialog.title")}
      description={t("scheduleDialog.mobileDescription")}
      footer={
        <>
          <MobileButton variant="secondary" label={t("schedule.cancel")} onPress={() => onOpenChange(false)} />
          <MobileButton label={t("schedule.save")} disabled={!canSubmit} onPress={submit} />
        </>
      }
    >
      <View style={styles.body}>
        <MobileFieldLabel label={t("scheduleDialog.group")}>
          {/* `grid grid-cols-2 gap-x-2 gap-y-3` */}
          <View style={styles.courses}>
            {courses.map((course) => {
              const active = course.id === courseId;
              return (
                <Pressable
                  key={course.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => {
                    setCourseId(course.id);
                    setQuizId("");
                  }}
                  style={[styles.course, active ? { borderColor: ds.c.brand, backgroundColor: ds.c["brand-subtle"] } : { borderColor: "transparent", backgroundColor: ds.c.subtle }]}
                >
                  <GroupTile name={course.title} tone={course.tone} src={course.image} box={32} radius={dsRadius.xl} />
                  <View style={styles.grow}>
                    <DsText v="body-sm" w="600" numberOfLines={1}>
                      {course.title}
                    </DsText>
                    <DsText v="caption" c="ink-secondary" numberOfLines={1}>
                      {t("schedule.students", { count: course.studentCount ?? 0 })}
                    </DsText>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </MobileFieldLabel>

        <MobileFieldLabel label={t("scheduleDialog.topic")}>
          <MobileInput value={topic} placeholder={t("scheduleDialog.topicPlaceholder")} onChangeText={setTopic} />
        </MobileFieldLabel>

        <View style={styles.pair}>
          <View style={styles.grow}>
            <MobileFieldLabel label={t("scheduleDialog.date")}>
              <MobilePickerField type="date" value={date} min={today()} display={dateLabel} ariaLabel={t("scheduleDialog.date")} onChange={setDate} />
            </MobileFieldLabel>
          </View>
          <View style={styles.grow}>
            <MobileFieldLabel label={t("schedule.time")}>
              <MobilePickerField type="time" value={time} display={time} ariaLabel={t("schedule.time")} onChange={setTime} />
            </MobileFieldLabel>
          </View>
        </View>

        <View style={styles.repeatRow}>
          <MobileToggle
            items={[
              { id: "once", label: t("schedule.repeatOnce") },
              { id: "weekly", label: t("schedule.repeatWeekly") },
            ]}
            value={repeat ? "weekly" : "once"}
            onChange={(value) => setRepeat(value === "weekly")}
          />
          {/* `h-13 flex-1 rounded-full bg-subtle px-1.5`: haftalar soni */}
          <View style={[styles.weeks, { backgroundColor: ds.c.subtle }, !repeat && styles.half]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("scheduleDialog.fewerWeeks")}
              disabled={!repeat || weeks <= MIN_WEEKS}
              onPress={() => setWeeks((value) => Math.max(MIN_WEEKS, value - 1))}
              style={[styles.step, { backgroundColor: ds.c.surface }, (!repeat || weeks <= MIN_WEEKS) && styles.half]}
            >
              <Icon name="remove" size={20} color={ds.c.ink} />
            </Pressable>
            <DsText v="body-sm" w="600" numberOfLines={1} style={[styles.grow, styles.center]}>
              {t("scheduleDialog.weeksValue", { count: weeks })}
            </DsText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("scheduleDialog.moreWeeks")}
              disabled={!repeat || weeks >= MAX_WEEKS}
              onPress={() => setWeeks((value) => Math.min(MAX_WEEKS, value + 1))}
              style={[styles.step, { backgroundColor: ds.c.surface }, (!repeat || weeks >= MAX_WEEKS) && styles.half]}
            >
              <Icon name="add" size={20} color={ds.c.ink} />
            </Pressable>
          </View>
        </View>

        <MobileFieldLabel label={t("scheduleDialog.duration")}>
          <MobileChoiceChips items={DURATIONS} value={duration} onChange={setDuration} />
        </MobileFieldLabel>

        <MobileFieldLabel label={t("scheduleDialog.quiz")}>
          <MobilePickerField
            type="select"
            value={quizId}
            display={(quizzes.data ?? []).find((quiz) => quiz.id === quizId)?.title ?? t("scheduleDialog.noQuiz")}
            ariaLabel={t("scheduleDialog.quiz")}
            options={[{ value: "", label: t("scheduleDialog.noQuiz") }, ...(quizzes.data ?? []).map((quiz) => ({ value: quiz.id, label: quiz.title }))]}
            onChange={setQuizId}
          />
        </MobileFieldLabel>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  center: { textAlign: "center" },
  half: { opacity: 0.5 },
  body: { marginTop: -2, gap: 12 },
  courses: { marginTop: 2, flexDirection: "row", flexWrap: "wrap", columnGap: 8, rowGap: 12 },
  course: { width: "48.5%", height: 56, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, borderWidth: 1.5, borderRadius: dsRadius.lg },
  pair: { flexDirection: "row", gap: 12 },
  repeatRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  weeks: { flex: 1, minWidth: 0, height: 52, flexDirection: "row", alignItems: "center", paddingHorizontal: 6, borderRadius: 26 },
  step: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
});
