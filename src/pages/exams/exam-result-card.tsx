import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useExamResults } from "@/modules/exam";
import type { ExamStudentResult } from "@/shared/types";
import { Card, Text, useTheme } from "@/shared/ui";

export interface ExamResultCardProps {
  examId: string;
}

/** O'quvchining o'z natijasi — imtihon tugagach ochiladi. */
export function ExamResultCard({ examId }: ExamResultCardProps) {
  const { t } = useTranslation("exam");
  const results = useExamResults(examId);

  if (results.isLoading) {
    return (
      <Text variant="caption" tone="muted">
        {t("result.loading")}
      </Text>
    );
  }
  if (results.data?.hidden) {
    return (
      <Text variant="caption" tone="muted">
        {t("result.hidden")}
      </Text>
    );
  }

  const own = results.data?.results?.[0];
  if (!own) return null;
  return <ExamResultBody result={own} />;
}

export function ExamResultBody({ result }: { result: ExamStudentResult }) {
  const { t } = useTranslation("exam");
  const { palette } = useTheme();
  const total = result.total;

  return (
    <Card style={styles.card}>
      <View style={[styles.total, { backgroundColor: palette["primary-tint"] }]}>
        {total && total.score !== null ? (
          <>
            <Text variant="title" style={{ color: palette["primary-text"] }}>
              {total.score}
              {total.max ? `/${total.max}` : ""}
            </Text>
            <Text variant="caption" tone="muted">
              {total.label || t("result.total")}
            </Text>
            {total.range ? (
              <Text variant="caption" tone="muted">
                {t("result.range", { from: total.range[0], to: total.range[1] })}
              </Text>
            ) : null}
            {total.level ? (
              <Text variant="caption" tone="muted">
                {total.level}
              </Text>
            ) : null}
            {result.approximate ? (
              <Text variant="caption" tone="muted">
                {t("result.approximate")}
              </Text>
            ) : null}
          </>
        ) : (
          <Text variant="caption" tone="muted">
            {t("result.waitingTeacher")}
          </Text>
        )}
      </View>

      {result.sections.map((section) => (
        <View key={section.key} style={styles.row}>
          <Text style={styles.rowTitle}>{section.title}</Text>
          <Text variant="label">
            {section.score !== null
              ? `${section.score}${section.scaleMax ? `/${section.scaleMax}` : ""}`
              : section.percent !== null
                ? `${Math.round(section.percent)}%`
                : t("result.pendingShort")}
          </Text>
        </View>
      ))}

      {result.pending.length ? (
        <Text variant="caption" tone="muted">
          {t("result.pendingList", { list: result.pending.join(", ") })}
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  total: { alignItems: "center", gap: 2, padding: 14, borderRadius: 16 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  rowTitle: { flex: 1 },
});
