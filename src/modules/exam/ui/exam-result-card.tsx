import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useQuizColors } from "@/modules/quiz";
import type { ExamStudentResult } from "@/shared/types";
import { Text, useTheme } from "@/shared/ui";

export interface ExamResultCardProps {
  result: ExamStudentResult;
}

/**
 * O'quvchining natija kartasi — veb `modules/exam/ui/exam-result-card.tsx`
 * porti (`.exam-result-card`, `.exam-result-total`, `.exam-result-section`).
 */
export function ExamResultCard({ result }: ExamResultCardProps) {
  const { t } = useTranslation("exam");
  const { palette } = useTheme();
  const colors = useQuizColors();
  const total = result.total;

  return (
    <View style={[styles.card, { borderColor: colors.border, backgroundColor: palette.surface }]}>
      <View style={[styles.total, { backgroundColor: palette["primary-tint"] }]}>
        {total && total.score !== null ? (
          <>
            <Text variant="body" style={[styles.score, { color: palette["primary-text"] }]}>
              {total.score}
              {total.max ? (
                <Text variant="body" style={[styles.scoreMax, { color: colors.muted }]}>
                  /{total.max}
                </Text>
              ) : null}
            </Text>
            <Text variant="caption" style={[styles.label, { color: colors.muted }]}>
              {total.label || t("result.total")}
            </Text>
            {total.range ? (
              <Text variant="caption" style={{ color: colors.muted }}>
                {t("result.range", { from: total.range[0], to: total.range[1] })}
              </Text>
            ) : null}
            {total.level ? (
              <Text variant="caption" style={{ color: colors.muted }}>
                {total.level}
              </Text>
            ) : null}
            {result.approximate ? (
              <Text variant="caption" style={[styles.italic, { color: colors.muted }]}>
                {t("result.approximate")}
              </Text>
            ) : null}
          </>
        ) : (
          <>
            <Text variant="body" style={[styles.score, { color: colors.muted }]}>
              —
            </Text>
            <Text variant="caption" style={[styles.label, { color: colors.muted }]}>
              {t("result.waitingTeacher")}
            </Text>
          </>
        )}
      </View>

      <View style={styles.sections}>
        {result.sections.map((section) => (
          <View key={section.key} style={styles.section}>
            <Text variant="body" style={[styles.sectionTitle, { color: colors.foreground }]}>
              {section.title}
            </Text>
            <Text variant="body" style={[styles.sectionScore, { color: colors.foreground }]}>
              {section.score !== null
                ? `${section.score}${section.scaleMax ? `/${section.scaleMax}` : ""}`
                : section.percent !== null && !section.manual
                  ? `${Math.round(section.percent)}%`
                  : t("result.pendingShort")}
            </Text>
            {section.earned !== null && section.max !== null && !section.manual ? (
              <Text variant="caption" style={{ color: colors.muted }}>
                {t("result.earned", { earned: section.earned, max: section.max })}
              </Text>
            ) : null}
          </View>
        ))}
      </View>

      {result.pending.length ? (
        <Text variant="caption" style={styles.pending}>
          {t("result.pendingList", { list: result.pending.join(", ") })}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  italic: { fontStyle: "italic" },
  /* `.exam-result-card` — bo'shliq 18, chegara 1, radius 16, oraliq 14 */
  card: { alignSelf: "center", maxWidth: 520, gap: 14, padding: 18, borderWidth: 1, borderRadius: 16 },
  total: { alignItems: "center", gap: 2, padding: 14, borderRadius: 16 },
  score: { fontSize: 28, lineHeight: 30, fontWeight: "700" },
  scoreMax: { fontSize: 16, fontWeight: "400" },
  label: { fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase" },
  sections: { gap: 8 },
  section: { flexDirection: "row", alignItems: "baseline", gap: 10 },
  sectionTitle: { flex: 1, minWidth: 0, fontWeight: "600" },
  sectionScore: { fontSize: 15, fontWeight: "600" },
  pending: { fontSize: 13, color: "#7a5100" },
});
