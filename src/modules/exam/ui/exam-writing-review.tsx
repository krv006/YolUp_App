import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { Sparkles } from "lucide-react-native";
import { radius, Text, useTheme } from "@/shared/ui";
import { useExamStudentResult, useRequestWritingAi } from "../model/exam.queries";
import { ExamWritingAiPanel } from "./exam-writing-ai";

export interface ExamWritingReviewProps {
  examId: string;
  studentId: string;
  /** Taklif etilgan bandni o'qituvchi ball maydoniga qo'yadi. */
  onApplyBand?: (band: number) => void;
}

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

/**
 * Qo'lda baholanadigan bo'limlardagi (IELTS Writing) yozma javoblar va AI
 * tahlili — veb `modules/exam/ui/exam-writing-review.tsx` porti.
 */
export function ExamWritingReview({ examId, studentId, onApplyBand }: ExamWritingReviewProps) {
  const { t } = useTranslation("exam");
  const { palette } = useTheme();
  const detail = useExamStudentResult(examId, studentId);
  const ask = useRequestWritingAi(examId);

  if (detail.isLoading) {
    return (
      <Text variant="label" style={[styles.bodySm, { color: palette["subtle-foreground"] }]}>
        {t("result.loading")}
      </Text>
    );
  }
  if (!detail.data) return null;

  const answers = detail.data.manualAnswers;
  const ai = detail.data.writingAi;
  const canAsk = answers.some((answer) => answer.answer.trim()) && ai?.status !== "queued";

  return (
    <View style={styles.root}>
      {canAsk ? (
        <Pressable
          accessibilityRole="button"
          disabled={ask.isPending}
          onPress={() => ask.mutate(studentId)}
          style={({ pressed }) => [
            styles.ask,
            {
              borderColor: palette.border,
              backgroundColor: pressed ? palette["surface-subtle"] : palette.surface,
              opacity: ask.isPending ? 0.5 : 1,
            },
          ]}
        >
          <Sparkles size={16} color={palette.foreground} />
          <Text variant="label">{ai?.status === "done" ? t("writingAi.again") : t("writingAi.ask")}</Text>
        </Pressable>
      ) : null}

      {ai ? <ExamWritingAiPanel ai={ai} onApply={onApplyBand} /> : null}

      {answers.length ? (
        answers.map((answer, index) => (
          <View
            key={`${answer.section}-${index}`}
            style={[styles.card, { borderColor: palette.border, backgroundColor: palette.surface }]}
          >
            <View style={styles.cardHead}>
              <Text variant="body" numberOfLines={1} style={[styles.title, styles.grow]}>
                {t("mock.taskNumber", { number: index + 1 })}
              </Text>
              <Text variant="caption" style={[styles.numeric, { color: palette["subtle-foreground"] }]}>
                {t("mock.wordCount", { count: countWords(answer.answer) })}
              </Text>
            </View>
            {answer.question ? (
              <View style={[styles.question, { backgroundColor: palette["surface-subtle"] }]}>
                <Text variant="label" style={[styles.bodySm, { color: palette["muted-foreground"] }]}>
                  {answer.question}
                </Text>
              </View>
            ) : null}
            <Text variant="body">{answer.answer || t("writing.empty")}</Text>
          </View>
        ))
      ) : (
        <Text variant="label" style={[styles.bodySm, { color: palette["subtle-foreground"] }]}>
          {t("mock.noEssays")}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  bodySm: { fontWeight: "400" },
  numeric: { fontVariant: ["tabular-nums"] },
  title: { fontSize: 16, lineHeight: 24, fontWeight: "600" },
  root: { gap: 16 },
  /* `h-11 w-fit rounded-full border px-4 gap-2` */
  ask: {
    alignSelf: "flex-start",
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: radius.full,
  },
  /* `rounded-2xl border bg-surface p-4 gap-3` */
  card: { gap: 12, padding: 16, borderWidth: 1, borderRadius: radius["2xl"] },
  cardHead: { flexDirection: "row", alignItems: "baseline", gap: 12 },
  question: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: radius.xl },
});
