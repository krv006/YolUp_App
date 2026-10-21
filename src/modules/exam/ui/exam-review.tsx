import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { CheckCircle2, XCircle } from "lucide-react-native";
import { useQuizColors } from "@/modules/quiz";
import { Text } from "@/shared/ui";
import { useExamStudentResult } from "../model/exam.queries";
import { ExamWritingAiPanel } from "./exam-writing-ai";

export interface ExamReviewProps {
  examId: string;
  studentId: string;
}

/**
 * Savol-savol tahlil — veb `modules/exam/ui/exam-review.tsx` porti
 * (`.exam-review*`): o'quvchi nima yozgan, to'g'ri javob nima; bo'limlar
 * bo'yicha guruhlanadi.
 */
export function ExamReview({ examId, studentId }: ExamReviewProps) {
  const { t } = useTranslation("exam");
  const colors = useQuizColors();
  const detail = useExamStudentResult(examId, studentId);

  if (detail.isLoading) return <Muted text={t("result.loading")} />;
  const rows = detail.data?.review ?? [];
  const writing = detail.data?.writingAi;
  if (!rows.length && !writing) return <Muted text={t("review.empty")} />;

  const sections: Array<{ key: string; title: string; rows: typeof rows }> = [];
  for (const row of rows) {
    const last = sections[sections.length - 1];
    if (last && last.key === row.section) last.rows.push(row);
    else sections.push({ key: row.section, title: row.sectionTitle, rows: [row] });
  }

  return (
    <View style={styles.root}>
      {sections.map((section) => {
        const right = section.rows.filter((row) => row.isCorrect).length;
        return (
          <View key={section.key}>
            <View style={styles.sectionHead}>
              <Text variant="body" style={styles.heavy}>
                {section.title}
              </Text>
              <Text variant="caption" style={{ color: colors.muted }}>
                {t("review.correctCount", { right, total: section.rows.length })}
              </Text>
            </View>
            {section.rows.map((row) => (
              <View
                key={`${row.section}-${row.number}`}
                style={[
                  styles.row,
                  { backgroundColor: row.isCorrect ? "rgba(21, 128, 61, 0.05)" : "rgba(185, 28, 28, 0.05)" },
                ]}
              >
                {row.isCorrect ? (
                  <CheckCircle2 size={16} color="#15803d" />
                ) : (
                  <XCircle size={16} color="#b91c1c" />
                )}
                <View style={styles.grow}>
                  <Text variant="body" style={styles.question}>
                    <Text variant="body" style={styles.heavy}>
                      {row.number}.
                    </Text>{" "}
                    {row.question.replace(/\{\{\d+\}\}/g, "____")}
                  </Text>
                  <Text variant="caption" style={styles.small}>
                    {t("review.yourAnswer")}: {row.given || t("review.noAnswer")}
                  </Text>
                  {!row.isCorrect && row.correctAnswer ? (
                    <Text variant="caption" style={[styles.small, styles.right]}>
                      {t("review.correctAnswer")}: {row.correctAnswer}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        );
      })}
      {writing ? (
        <View>
          <Text variant="body" style={styles.heavy}>
            {t("writingAi.sectionTitle")}
          </Text>
          <ExamWritingAiPanel ai={writing} />
        </View>
      ) : null}
    </View>
  );
}

function Muted({ text }: { text: string }) {
  const colors = useQuizColors();
  return (
    <Text variant="caption" style={[styles.small, { color: colors.muted }]}>
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  heavy: { fontWeight: "700" },
  small: { fontSize: 13, lineHeight: 19, opacity: 0.85 },
  root: { gap: 14, marginTop: 8 },
  sectionHead: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 8, marginBottom: 6 },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "rgba(127, 127, 127, 0.2)",
    borderRadius: 10,
  },
  question: { marginBottom: 4 },
  right: { color: "#15803d", fontWeight: "600", opacity: 1 },
});
