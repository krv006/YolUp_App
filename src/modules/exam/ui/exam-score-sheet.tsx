import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import type { ExamStudentResult } from "@/shared/types";
import { Input, radius, Sheet, SheetButton, SheetFooter, Text, useTheme } from "@/shared/ui";

export interface ExamScoreSheetProps {
  open: boolean;
  onClose: () => void;
  result: ExamStudentResult | null;
  pending?: boolean;
  onSave: (scores: Record<string, number>, comment: string) => void;
}

/**
 * Qo'lda ball qo'yish — veb `modules/exam/ui/exam-score-dialog.tsx` porti:
 * avtomatik bo'limlar (faqat o'qish uchun), qo'lda baholanadiganlar,
 * umumiy band va izoh.
 */
export function ExamScoreSheet({ open, onClose, result, pending = false, onSave }: ExamScoreSheetProps) {
  const { t } = useTranslation("exam");
  const { palette } = useTheme();
  const [scores, setScores] = useState<Record<string, string>>({});
  const [comment, setComment] = useState("");
  const [syncedId, setSyncedId] = useState<string | null>(null);

  if (result && syncedId !== result.studentId) {
    setSyncedId(result.studentId);
    setScores(
      Object.fromEntries(
        result.sections
          .filter((section) => section.manual)
          .map((section) => [section.key, section.score === null ? "" : String(section.score)])
      )
    );
    setComment("");
  }

  if (!result) return null;

  const autoSections = result.sections.filter((section) => !section.manual);
  const manualSections = result.sections.filter((section) => section.manual);
  const values = result.sections
    .map((section) => (section.manual ? Number(scores[section.key] ?? "") : (section.score ?? Number.NaN)))
    .filter((value) => Number.isFinite(value)) as number[];
  const overall = values.length
    ? (Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 2) / 2).toFixed(1)
    : "—";

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t("mock.scoreTitle", { name: result.studentName })}
      description={t("mock.scoreDescription")}
    >
      <View style={styles.body}>
        {autoSections.map((section) => (
          <Input
            key={section.key}
            label={t("mock.autoLabel", { title: section.title })}
            value={section.score === null ? "—" : String(section.score)}
            editable={false}
          />
        ))}
        {manualSections.map((section) => (
          <Input
            key={section.key}
            label={section.title}
            value={scores[section.key] ?? ""}
            placeholder={t("mock.scorePlaceholder")}
            keyboardType="decimal-pad"
            onChangeText={(value) => setScores((current) => ({ ...current, [section.key]: value }))}
          />
        ))}

        {/* `rounded-xl bg-action-subtle px-4 py-3` */}
        <View style={[styles.overall, { backgroundColor: palette["primary-soft"] }]}>
          <Text variant="label" style={[styles.grow, { color: palette.primary }]}>
            {t("mock.overallBand")}
          </Text>
          <Text variant="subheading" style={{ color: palette.primary }}>
            {overall}
          </Text>
        </View>

        <Input
          label={t("mock.scoreComment")}
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={2}
        />
      </View>

      <SheetFooter>
        <SheetButton title={t("mock.scoreCancel")} onPress={onClose} />
        <SheetButton
          variant="primary"
          title={t("mock.scoreSave")}
          disabled={pending}
          loading={pending}
          onPress={() => {
            const payload: Record<string, number> = {};
            for (const [key, value] of Object.entries(scores)) {
              const score = Number(value);
              if (value.trim() && Number.isFinite(score)) payload[key] = score;
            }
            onSave(payload, comment);
          }}
        />
      </SheetFooter>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1 },
  body: { gap: 16 },
  overall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.xl,
  },
});
