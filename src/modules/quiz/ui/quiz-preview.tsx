import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import type { QuizAnswerValue } from "@/shared/types";
import { Text, useTheme } from "@/shared/ui";
import { draftToStudentQuestion, type QuestionDraft } from "../lib/question-draft";
import { QuestionAnswerInput, QuestionPrompt } from "./question-answer-input";
import { useQuizColors } from "./quiz-colors";

export interface QuizPreviewProps {
  title: string;
  questions: readonly QuestionDraft[];
}

/**
 * "O'quvchi ko'radi" — veb `modules/quiz/ui/quiz-preview.tsx` porti.
 * Savollar aynan o'quvchi ko'radigan `QuestionAnswerInput` bilan chiziladi.
 *
 * Uslublar 390px veb DOM'idan:
 *   sarlavha   11/16.5/900 KATTA HARF, oraliq 1.32 + nom 16/24/700
 *   varaq      fon #f7f9fc, chegara 1, radius 16, bo'shliq 18, oraliq 16
 *   savol      oq, chegara 1, radius 16, bo'shliq 14, oraliq 8
 *   bosh qator 12/18/800 KATTA HARF, oraliq 0.6
 */
export function QuizPreview({ title, questions }: QuizPreviewProps) {
  const { t } = useTranslation("quiz");
  const { palette, scheme } = useTheme();
  const colors = useQuizColors();
  const [answers, setAnswers] = useState<Record<string, QuizAnswerValue>>({});

  return (
    <View style={styles.root} accessibilityLabel={t("preview.regionAria")}>
      <View style={styles.head}>
        <Text variant="caption" style={[styles.eyebrow, { color: colors.muted }]}>
          {t("preview.eyebrow")}
        </Text>
        <Text variant="body" style={[styles.title, { color: colors.foreground }]}>
          {title || t("preview.untitled")}
        </Text>
      </View>

      <View
        style={[
          styles.sheet,
          {
            backgroundColor: scheme === "dark" ? palette["surface-subtle"] : "#f7f9fc",
            borderColor: colors.border,
          },
        ]}
      >
        {questions.map((draft, index) => {
          const question = draftToStudentQuestion(draft, index);
          return (
            <View
              key={draft.key}
              style={[styles.question, { backgroundColor: palette.surface, borderColor: colors.border }]}
            >
              <View style={styles.questionHead}>
                <Text variant="caption" numberOfLines={1} style={[styles.meta, styles.grow, { color: colors.muted }]}>
                  {t("attemptDialog.questionNumber", { number: index + 1 })} · {t(`types.${question.type}`)}
                </Text>
                <Text variant="caption" style={[styles.meta, styles.points, { color: colors.muted }]}>
                  {t("attemptDialog.pointsSuffix", { count: question.points })}
                </Text>
              </View>
              <QuestionPrompt question={question} />
              <QuestionAnswerInput
                question={question}
                number={index + 1}
                value={answers[draft.key]}
                onChange={(value) => setAnswers((current) => ({ ...current, [draft.key]: value }))}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  root: { gap: 12 },
  head: { gap: 3 },
  eyebrow: { fontSize: 11, lineHeight: 16, fontWeight: "700", letterSpacing: 1.32, textTransform: "uppercase" },
  title: { fontWeight: "700" },
  sheet: { gap: 16, padding: 18, borderWidth: 1, borderRadius: 16 },
  question: { gap: 8, padding: 14, borderWidth: 1, borderRadius: 16 },
  questionHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  meta: { fontSize: 12, lineHeight: 18, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase" },
  points: { flexShrink: 0 },
});
