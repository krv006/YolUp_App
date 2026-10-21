import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { BookOpen, FileQuestion } from "lucide-react-native";
import { SelectField, Sheet, SheetButton, SheetFooter, Text, useTheme } from "@/shared/ui";

export interface AssignQuizSheetProps {
  open: boolean;
  onClose: () => void;
  /** Tanlanadigan testlar (test oldindan aniq bo'lsa, `quizId` beriladi). */
  quizzes?: ReadonlyArray<{ id: string; label: string }>;
  /** Tanlanadigan guruhlar (guruh oldindan aniq bo'lsa, `courseId` beriladi). */
  courses?: ReadonlyArray<{ id: string; label: string }>;
  quizId?: string | null;
  courseId?: string | null;
  pending?: boolean;
  onSubmit: (value: { quizId: string; courseId: string }) => void;
}

/**
 * Guruhsiz testni guruhga berish — veb `modules/quiz/ui/assign-quiz-dialog.tsx`
 * porti. Oyna yopilganda tanlov tozalanishi uchun forma faqat ochiq
 * paytda chiziladi (vebdagidek).
 */
export function AssignQuizSheet(props: AssignQuizSheetProps) {
  const { t } = useTranslation("quiz");
  return (
    <Sheet
      open={props.open}
      onClose={props.onClose}
      title={t("assignDialog.title")}
      description={t("assignDialog.description")}
    >
      {props.open ? <AssignQuizForm {...props} /> : null}
    </Sheet>
  );
}

function AssignQuizForm({
  onClose,
  quizzes = [],
  courses = [],
  quizId = null,
  courseId = null,
  pending = false,
  onSubmit,
}: AssignQuizSheetProps) {
  const { t } = useTranslation("quiz");
  const { palette } = useTheme();
  const [pickedQuiz, setPickedQuiz] = useState("");
  const [pickedCourse, setPickedCourse] = useState("");
  const finalQuiz = quizId ?? pickedQuiz;
  const finalCourse = courseId ?? pickedCourse;
  const icon = { size: 17, color: palette["subtle-foreground"] };

  return (
    <>
      <View style={styles.body}>
        {quizId ? null : (
          <SelectField
            label={t("assignDialog.quizLabel")}
            icon={<FileQuestion {...icon} />}
            searchable
            value={pickedQuiz}
            onChange={setPickedQuiz}
            options={quizzes.map((item) => ({ value: item.id, label: item.label }))}
          />
        )}
        {courseId ? null : (
          <SelectField
            label={t("assignDialog.courseLabel")}
            icon={<BookOpen {...icon} />}
            searchable
            value={pickedCourse}
            onChange={setPickedCourse}
            options={courses.map((item) => ({ value: item.id, label: item.label }))}
          />
        )}
        {quizId || quizzes.length ? null : (
          <Text variant="caption" tone="muted">
            {t("assignDialog.noQuizzes")}
          </Text>
        )}
        <Text variant="caption" tone="muted">
          {t("assignDialog.draftHint")}
        </Text>
      </View>
      <SheetFooter>
        <SheetButton title={t("assignDialog.cancel")} onPress={onClose} />
        <SheetButton
          variant="primary"
          title={t("assignDialog.submit")}
          loading={pending}
          disabled={!finalQuiz || !finalCourse}
          onPress={() => onSubmit({ quizId: finalQuiz, courseId: finalCourse })}
        />
      </SheetFooter>
    </>
  );
}

const styles = StyleSheet.create({
  body: { gap: 16 },
});
