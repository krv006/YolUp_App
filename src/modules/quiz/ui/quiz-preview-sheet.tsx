import { useState } from "react";
import { StyleSheet, View } from "react-native";
import type { QuizAnswerValue } from "@/shared/types";
import { Badge, radius, Sheet, Text, useTheme } from "@/shared/ui";
import { draftToStudentQuestion, type QuestionDraft } from "../lib/question-draft";
import { QuestionAnswerInput } from "./question-answer-input";
import { TYPE_LABELS } from "./question-editor";

/**
 * "O'quvchi nima ko'radi" — veb `quiz-preview.tsx` ning mobil varianti.
 *
 * 🟡 MOSLASH: vebda bu YONMA-YON ustun bo'lib doim ko'rinib turadi
 * (`quiz-page-split`). Telefonda ikkinchi ustun yo'q, shuning uchun u
 * TALAB BO'YICHA ochiladigan oynaga aylandi.
 *
 * Mantiq o'zgarmagan: qoralama `draftToStudentQuestion` bilan xuddi
 * o'quvchiga boradigan savolga aylantiriladi va AYNAN o'sha
 * `QuestionAnswerInput` bilan chiziladi — ya'ni bu taqlid emas, haqiqiy
 * yechish oynasining o'zi.
 *
 * Javoblar holati saqlanadi, lekin hech qayerga yuborilmaydi: o'qituvchi
 * variantlarni bosib ko'ra oladi, chunki ba'zi savol turlarida (moslashtirish,
 * tartiblash) bosmasdan turib qanday ishlashini tushunib bo'lmaydi.
 */
export interface QuizPreviewSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  questions: readonly QuestionDraft[];
}

export function QuizPreviewSheet({ open, onClose, title, questions }: QuizPreviewSheetProps) {
  const { palette } = useTheme();
  const [answers, setAnswers] = useState<Record<string, QuizAnswerValue>>({});

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title.trim() || "Nomsiz test"}
      description="O'quvchi shu ko'rinishda yechadi. Bu yerdagi javoblar saqlanmaydi."
    >
      {questions.length === 0 ? (
        <Text variant="caption" tone="muted">
          Hali savol yo&apos;q — savol qo&apos;shsangiz shu yerda ko&apos;rinadi.
        </Text>
      ) : null}

      {questions.map((draft, index) => {
        const question = draftToStudentQuestion(draft, index);
        return (
          <View
            key={draft.key}
            style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}
          >
            <View style={styles.head}>
              <Text variant="caption" tone="brand">
                {index + 1}-savol · {TYPE_LABELS[question.type]}
              </Text>
              <Badge label={`${question.points} ball`} tone="neutral" />
            </View>

            <Text variant="label">{question.text}</Text>

            <View style={styles.answer}>
              <QuestionAnswerInput
                question={question}
                value={answers[draft.key]}
                onChange={(value) =>
                  setAnswers((current) => ({ ...current, [draft.key]: value }))
                }
              />
            </View>
          </View>
        );
      })}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 8,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  answer: { marginTop: 4 },
});
