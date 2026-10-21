import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useCourseStudents } from "@/modules/course";
import { downloadBlob } from "@/shared/lib";
import {
  Avatar,
  radius,
  Sheet,
  SheetButton,
  SheetFooter,
  Text,
  toast,
  useTheme,
  type Palette,
} from "@/shared/ui";
import { quizApi } from "../api/quiz.api";
import { useQuizAttempts } from "../model/quiz.queries";

export interface QuizAttemptsSheetProps {
  quizId: string | null;
  open: boolean;
  onClose: () => void;
  title?: string;
  courseId?: string | null;
}

function scoreTone(score: number, maxScore: number, palette: Palette) {
  if (!maxScore) return { bg: palette["surface-subtle"], fg: palette["muted-foreground"] };
  const percent = (score / maxScore) * 100;
  if (percent >= 70) return { bg: palette["success-soft"], fg: palette["success-strong"] };
  if (percent >= 50) return { bg: palette["primary-soft"], fg: palette.primary };
  return { bg: palette["warning-soft"], fg: palette["warning-strong"] };
}

/**
 * Test urinishlari — veb `modules/quiz/ui/quiz-attempts-dialog.tsx` porti.
 *
 * Ro'yxat, tartib raqami ("2-urinish"), ball rangi va topshirmaganlar
 * vebdagidek. Yuklab olish: vebda `<a download>`, mobilda `downloadBlob`
 * (fayl keshga yoziladi va ulashish oynasi ochiladi).
 */
export function QuizAttemptsSheet({ quizId, open, onClose, title, courseId = null }: QuizAttemptsSheetProps) {
  const { t } = useTranslation("quiz");
  const { t: tl } = useTranslation("lesson");
  const { palette } = useTheme();
  const attempts = useQuizAttempts(quizId, open);
  const students = useCourseStudents(open ? courseId : null, { page_size: 100 });
  const months = tl("list.months", { returnObjects: true }) as string[];

  function formatMoment(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    return `${date.getDate()}-${(months[date.getMonth()] ?? "").toLowerCase()}, ${time}`;
  }

  const rows = useMemo(() => {
    const list = [...(attempts.data ?? [])].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const seen = new Map<string, number>();
    const withOrder = list.map((attempt) => {
      const order = (seen.get(attempt.studentId) ?? 0) + 1;
      seen.set(attempt.studentId, order);
      return { ...attempt, order };
    });
    return withOrder.reverse();
  }, [attempts.data]);

  const missing = useMemo(() => {
    const attempted = new Set(rows.map((row) => row.studentId));
    return (students.data?.items ?? [])
      .map((item) => item.student)
      .filter((student) => !attempted.has(student.id));
  }, [rows, students.data]);

  async function download() {
    if (!quizId) return;
    try {
      const blob = await quizApi.exportAttempts(quizId, "xlsx");
      await downloadBlob(blob as Blob, `${title ?? "quiz"}.xlsx`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("attemptsDialog.exportFailed"));
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title ?? t("attemptsDialog.defaultTitle")}
      description={t("attemptsDialog.description")}
    >
      {attempts.isLoading ? (
        <View style={styles.skeleton}>
          {Array.from({ length: 3 }, (_, index) => (
            <View key={index} style={[styles.skeletonRow, { backgroundColor: palette.muted }]} />
          ))}
        </View>
      ) : rows.length || missing.length ? (
        <View>
          {rows.map((row, index) => {
            const tone = scoreTone(row.score, row.maxScore, palette);
            return (
              <View
                key={row.id}
                style={[styles.row, index > 0 && { borderTopWidth: 1, borderTopColor: palette.border }]}
              >
                <Avatar name={row.studentName} size="sm" />
                <View style={styles.grow}>
                  <Text variant="label" numberOfLines={1}>
                    {row.studentName}
                  </Text>
                  <Text variant="caption" numberOfLines={1} style={{ color: palette["subtle-foreground"] }}>
                    {formatMoment(row.createdAt)}
                    {row.order > 1 ? ` · ${t("attemptsDialog.attemptNo", { count: row.order })}` : ""}
                  </Text>
                </View>
                <View style={[styles.score, { backgroundColor: tone.bg }]}>
                  <Text variant="label" style={[styles.numeric, { color: tone.fg }]}>
                    {row.score}/{row.maxScore}
                  </Text>
                </View>
              </View>
            );
          })}

          {missing.map((student, index) => (
            <View
              key={student.id}
              style={[
                styles.row,
                (rows.length > 0 || index > 0) && { borderTopWidth: 1, borderTopColor: palette.border },
              ]}
            >
              <Avatar name={student.name} tone={student.avatarTone} size="sm" />
              <View style={styles.grow}>
                <Text variant="label" numberOfLines={1}>
                  {student.name}
                </Text>
                <Text variant="caption" numberOfLines={1} style={{ color: palette["subtle-foreground"] }}>
                  {t("attemptsDialog.notAttempted")}
                </Text>
              </View>
              <View style={[styles.dash, { backgroundColor: palette["surface-subtle"] }]}>
                <Text variant="label" style={{ color: palette["subtle-foreground"] }}>
                  —
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Text variant="label" style={[styles.empty, { color: palette["muted-foreground"] }]}>
          {t("attemptsDialog.empty")}
        </Text>
      )}

      <SheetFooter>
        <SheetButton title={t("attemptsDialog.close")} onPress={onClose} />
        <SheetButton
          variant="primary"
          title={t("attemptsDialog.download")}
          disabled={!rows.length}
          onPress={() => void download()}
        />
      </SheetFooter>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  numeric: { fontVariant: ["tabular-nums"] },
  skeleton: { gap: 8 },
  skeletonRow: { height: 56, borderRadius: radius.xl },
  /* `flex items-center gap-3 py-3`, qatorlar orasida chiziq */
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  score: { height: 32, justifyContent: "center", paddingHorizontal: 12, borderRadius: radius.full },
  dash: { width: 32, height: 32, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  empty: { paddingVertical: 24, textAlign: "center", fontWeight: "400" },
});
