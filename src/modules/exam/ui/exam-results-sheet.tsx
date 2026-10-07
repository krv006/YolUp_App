import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { UserRoundX } from "lucide-react-native";
import type { ExamStudentResult, ExamSummary } from "@/shared/types";
import { Avatar, Button, Card, Input, Sheet, Text, useTheme } from "@/shared/ui";
import { useExamResults, useSaveManualScores } from "../model/exam.queries";
import { ExamWritingReview } from "./exam-writing-review";

export interface ExamResultsSheetProps {
  exam: ExamSummary | null;
  onClose: () => void;
}

/** Imtihon natijalari — barcha o'quvchilar, kelmaganlar ham. */
export function ExamResultsSheet({ exam, onClose }: ExamResultsSheetProps) {
  const { t } = useTranslation("exam");
  const results = useExamResults(exam?.id ?? null, Boolean(exam));

  return (
    <Sheet
      open={Boolean(exam)}
      onClose={onClose}
      title={exam ? t("teacherList.resultsTitle", { title: exam.title }) : ""}
      description={t("teacherList.resultsDescription")}
    >
      <ScrollView contentContainerStyle={styles.body}>
        {results.isLoading ? (
          <Text variant="caption" tone="muted">
            {t("result.loading")}
          </Text>
        ) : null}
        {results.isError ? (
          <Text variant="caption" tone="muted">
            {t("result.loadError")}
          </Text>
        ) : null}
        {results.data && !results.data.results.length ? (
          <Text variant="caption" tone="muted">
            {t("result.noStudents")}
          </Text>
        ) : null}

        {(results.data?.results ?? []).map((result) => (
          <ResultRow key={result.studentId} examId={exam?.id ?? ""} engine={exam?.engine ?? ""} result={result} />
        ))}
      </ScrollView>
    </Sheet>
  );
}

function ResultRow({
  examId,
  engine,
  result,
}: {
  examId: string;
  engine: string;
  result: ExamStudentResult;
}) {
  const { t } = useTranslation("exam");
  const { palette } = useTheme();
  const save = useSaveManualScores(examId);
  const [open, setOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [scores, setScores] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      result.sections
        .filter((section) => section.manual)
        .map((section) => [section.key, section.score === null ? "" : String(section.score)])
    )
  );

  const manualSections = result.sections.filter((section) => section.manual);
  const total = result.total;

  return (
    <Card style={styles.row}>
      <View style={styles.rowHead}>
        <Avatar name={result.studentName} size="sm" />
        <View style={styles.rowBody}>
          <Text variant="label" numberOfLines={1}>
            {result.studentName || result.username}
          </Text>
          {result.participated ? (
            <Text variant="caption" tone="muted">
              {result.sections
                .map((section) =>
                  section.score !== null
                    ? `${section.title}: ${section.score}`
                    : section.percent !== null
                      ? `${section.title}: ${Math.round(section.percent)}%`
                      : `${section.title}: ${t("result.pendingShort")}`
                )
                .join(" · ")}
            </Text>
          ) : (
            <View style={styles.absent}>
              <UserRoundX size={13} color={palette["muted-foreground"]} />
              <Text variant="caption" tone="muted">
                {t("result.absent")}
              </Text>
            </View>
          )}
        </View>
        {total && total.score !== null ? (
          <Text variant="label" style={{ color: palette["primary-text"] }}>
            {total.score}
            {total.max ? `/${total.max}` : ""}
          </Text>
        ) : null}
      </View>

      {result.participated && manualSections.length ? (
        <View style={styles.manual}>
          {open ? (
            <>
              {manualSections.map((section) => (
                <Input
                  key={section.key}
                  label={section.title}
                  value={scores[section.key] ?? ""}
                  keyboardType="decimal-pad"
                  onChangeText={(value) =>
                    setScores((current) => ({ ...current, [section.key]: value.replace(/[^\d.]/g, "") }))
                  }
                />
              ))}
              <Button
                title={t("result.saveScores")}
                loading={save.isPending}
                onPress={() => {
                  const payload: Record<string, number> = {};
                  for (const [key, value] of Object.entries(scores)) {
                    if (!value.trim()) continue;
                    const score = Number(value);
                    if (Number.isFinite(score)) payload[key] = score;
                  }
                  void save
                    .mutateAsync({ studentId: result.studentId, scores: payload })
                    .then(() => setOpen(false));
                }}
              />
            </>
          ) : (
            <View style={styles.actions}>
              <Button variant="secondary" title={t("result.manualScores")} onPress={() => setOpen(true)} />
              {engine === "ielts" ? (
                <Button
                  variant="ghost"
                  title={reviewOpen ? t("ai.hide") : t("ai.show")}
                  onPress={() => setReviewOpen((current) => !current)}
                />
              ) : null}
            </View>
          )}
        </View>
      ) : null}

      {reviewOpen ? <ExamWritingReview examId={examId} studentId={result.studentId} /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  body: { gap: 10, paddingBottom: 24 },
  row: { gap: 10 },
  rowHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowBody: { flex: 1, gap: 2 },
  absent: { flexDirection: "row", alignItems: "center", gap: 5 },
  manual: { gap: 8 },
  actions: { flexDirection: "row", gap: 8 },
});
