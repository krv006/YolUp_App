import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Sparkles, TriangleAlert } from "lucide-react-native";
import { Button, Input, Text, useTheme } from "@/shared/ui";
import { useApproveAiBand, useExamStudentResult, useStartAiReview } from "../model/exam.queries";

export interface ExamWritingReviewProps {
  examId: string;
  studentId: string;
}

/**
 * IELTS Writing — AI taklifi va o'qituvchi tasdig'i.
 *
 * Ball o'qituvchi tasdiqlamaguncha o'quvchiga ko'rinmaydi, shuning uchun
 * bu ekran faqat o'qituvchi natijalar oynasida ochiladi.
 */
export function ExamWritingReview({ examId, studentId }: ExamWritingReviewProps) {
  const { t } = useTranslation("exam");
  const { palette } = useTheme();
  const detail = useExamStudentResult(examId, studentId);
  const start = useStartAiReview(examId);
  const approve = useApproveAiBand(examId);
  const [band, setBand] = useState("");

  if (detail.isLoading) {
    return (
      <Text variant="caption" tone="muted">
        {t("result.loading")}
      </Text>
    );
  }
  if (!detail.data) return null;

  const result = detail.data;
  const ai = result.ai;

  return (
    <View style={styles.root}>
      {result.manualAnswers.map((answer, index) => (
        <View key={`${answer.section}-${index}`} style={[styles.essay, { borderColor: palette.border }]}>
          <Text variant="caption" tone="muted">
            {answer.question}
          </Text>
          <Text style={styles.essayText}>{answer.answer}</Text>
        </View>
      ))}

      {!ai ? (
        <View style={styles.row}>
          <Text variant="caption" tone="muted">
            {t("ai.notStarted")}
          </Text>
          <Button
            variant="secondary"
            title={t("ai.start")}
            icon={<Sparkles size={15} color={palette.foreground} />}
            loading={start.isPending}
            onPress={() => start.mutate(studentId)}
          />
        </View>
      ) : null}

      {ai?.status === "running" ? (
        <Text variant="caption" tone="muted">
          {t("ai.running")}
        </Text>
      ) : null}

      {ai?.status === "failed" ? (
        <View style={styles.row}>
          <TriangleAlert size={15} color={palette.destructive} />
          <Text variant="caption" style={{ color: palette.destructive, flex: 1 }}>
            {ai.error || t("ai.failed")}
          </Text>
          <Button
            variant="secondary"
            title={t("ai.retry")}
            loading={start.isPending}
            onPress={() => start.mutate(studentId)}
          />
        </View>
      ) : null}

      {ai && (ai.status === "proposed" || ai.status === "approved") ? (
        <View style={[styles.result, { backgroundColor: palette["primary-tint"] }]}>
          <View style={styles.row}>
            <Text variant="title" style={{ color: palette["primary-text"] }}>
              {ai.approvedBand ?? ai.proposedBand ?? ai.writingBand ?? "—"}
            </Text>
            <Text variant="caption" tone="muted">
              {ai.status === "approved" ? t("ai.approvedBand") : t("ai.proposedBand")}
            </Text>
          </View>

          {ai.tasks.map((task) => (
            <View key={task.taskNumber} style={styles.task}>
              <Text variant="label">
                {t("ai.task", { number: task.taskNumber })} · {task.band ?? "—"}
              </Text>
              {task.words !== null ? (
                <Text variant="caption" tone="muted">
                  {t("ai.words", { words: task.words, min: task.minWords ?? 0 })}
                </Text>
              ) : null}
              <Text variant="caption" tone="muted">
                {task.criteria
                  .map((criterion) => `${t(`ai.criteria.${criterion.key}`)}: ${criterion.score ?? "—"}`)
                  .join(" · ")}
              </Text>
              {task.corrections.map((correction, index) => (
                <Text key={index} variant="caption">
                  {correction.original} → {correction.corrected}
                </Text>
              ))}
              {task.feedback ? <Text variant="caption">{task.feedback}</Text> : null}
            </View>
          ))}

          {ai.overallComment ? <Text variant="caption">{ai.overallComment}</Text> : null}

          {ai.status === "proposed" ? (
            <View style={styles.approve}>
              <View style={styles.bandInput}>
                <Input
                  label={t("ai.bandLabel")}
                  value={band}
                  keyboardType="decimal-pad"
                  placeholder={String(ai.proposedBand ?? "")}
                  onChangeText={(value) => setBand(value.replace(/[^\d.]/g, ""))}
                />
              </View>
              <Button
                title={band.trim() ? t("ai.approveWithBand") : t("ai.approve")}
                loading={approve.isPending}
                onPress={() =>
                  approve.mutate({ studentId, band: band.trim() ? Number(band) : undefined })
                }
              />
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 10 },
  essay: { gap: 4, padding: 10, borderWidth: 1, borderRadius: 13 },
  essayText: { lineHeight: 21 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  result: { gap: 10, padding: 12, borderRadius: 13 },
  task: { gap: 3 },
  approve: { gap: 8 },
  bandInput: { width: 120 },
});
