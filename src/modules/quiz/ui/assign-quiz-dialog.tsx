import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { MobileButton, MobileFieldLabel, MobilePickerField, Sheet } from "@/shared/ui";

export interface AssignQuizDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Tanlanadigan testlar (test oldindan aniq bo'lsa, `quizId` beriladi). */
  quizzes?: ReadonlyArray<{ id: string; label: string }>;
  /** Tanlanadigan guruhlar (guruh oldindan aniq bo'lsa, `courseId` beriladi). */
  courses?: ReadonlyArray<{ id: string; label: string; studentCount?: number }>;
  quizId?: string | null;
  quizLabel?: string;
  courseId?: string | null;
  pending?: boolean;
  onSubmit: (value: { quizId: string; courseId: string; dueAt: string | null }) => void;
}

function today(): string {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Testni guruhga berish — veb `assign-quiz-dialog.tsx` ning tor ekran
 * varianti (pastki oyna): test, guruh (oldindan aniq bo'lmasa), muddat
 * sanasi va vaqti; "Bekor qilish" va "Berish".
 */
export function AssignQuizDialog({
  open,
  onOpenChange,
  quizzes = [],
  courses = [],
  quizId = null,
  quizLabel = "",
  courseId = null,
  pending = false,
  onSubmit,
}: AssignQuizDialogProps) {
  const { t } = useTranslation("quiz");
  const { t: tl } = useTranslation("lesson");
  const months = tl("list.months", { returnObjects: true }) as string[];
  const [pickedQuiz, setPickedQuiz] = useState<string | null>(null);
  const [pickedCourse, setPickedCourse] = useState("");
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("23:59");

  const finalQuiz = pickedQuiz ?? quizId ?? "";
  const finalCourse = courseId ?? pickedCourse;
  const quizOptions = quizId && !quizzes.some((item) => item.id === quizId) ? [{ id: quizId, label: quizLabel }, ...quizzes] : quizzes;
  const quiz = quizOptions.find((item) => item.id === finalQuiz) ?? null;
  const course = courses.find((item) => item.id === finalCourse) ?? null;
  const courseLabel = (item: { label: string; studentCount?: number }) =>
    item.studentCount === undefined ? item.label : `${item.label} · ${t("assignDialog.students", { count: item.studentCount })}`;
  const day = new Date(`${date}T00:00`);
  const dateLabel = Number.isNaN(day.getTime()) ? date : `${day.getDate()}-${(months[day.getMonth()] ?? "").slice(0, 3).toLowerCase()}`;

  function changeOpen(next: boolean) {
    if (!next) setPickedQuiz(null);
    onOpenChange(next);
  }

  function submit() {
    onSubmit({ quizId: finalQuiz, courseId: finalCourse, dueAt: date ? `${date}T${time || "23:59"}` : null });
  }

  return (
    <Sheet
      variant="app"
      open={open}
      onClose={() => changeOpen(false)}
      title={t("assignDialog.title")}
      description={t("assignDialog.description")}
      footer={
        <>
          <MobileButton variant="secondary" label={t("assignDialog.cancel")} onPress={() => changeOpen(false)} />
          <MobileButton label={t("assignDialog.submit")} disabled={pending || !finalQuiz || !finalCourse} onPress={submit} />
        </>
      }
    >
      <View style={styles.body}>
        <MobileFieldLabel label={t("assignDialog.quizLabel")}>
          <MobilePickerField
            type="select"
            value={finalQuiz}
            display={quiz ? quiz.label : t("assignDialog.pick")}
            placeholder={!quiz}
            ariaLabel={t("assignDialog.quizLabel")}
            options={[...(quiz ? [] : [{ value: "", label: t("assignDialog.pick") }]), ...quizOptions.map((item) => ({ value: item.id, label: item.label }))]}
            onChange={setPickedQuiz}
          />
        </MobileFieldLabel>

        {courseId ? null : (
          <MobileFieldLabel label={t("assignDialog.courseLabel")}>
            <MobilePickerField
              type="select"
              value={finalCourse}
              display={course ? courseLabel(course) : t("assignDialog.pick")}
              placeholder={!course}
              ariaLabel={t("assignDialog.courseLabel")}
              options={[...(course ? [] : [{ value: "", label: t("assignDialog.pick") }]), ...courses.map((item) => ({ value: item.id, label: courseLabel(item) }))]}
              onChange={setPickedCourse}
            />
          </MobileFieldLabel>
        )}

        <View style={styles.pair}>
          <View style={styles.grow}>
            <MobileFieldLabel label={t("assignDialog.dueLabel")}>
              <MobilePickerField type="date" value={date} display={dateLabel} min={today()} ariaLabel={t("assignDialog.dueLabel")} onChange={setDate} />
            </MobileFieldLabel>
          </View>
          <View style={styles.grow}>
            <MobileFieldLabel label={t("assignDialog.timeLabel")}>
              <MobilePickerField type="time" value={time} display={time} ariaLabel={t("assignDialog.timeLabel")} onChange={setTime} />
            </MobileFieldLabel>
          </View>
        </View>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  /* `-mt-1 gap-3.5` */
  body: { marginTop: -4, gap: 14 },
  pair: { flexDirection: "row", gap: 12 },
});
