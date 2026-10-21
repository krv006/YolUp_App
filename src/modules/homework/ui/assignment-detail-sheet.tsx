import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { BarChart3, CheckCircle2, Clock3, Download, FileText, Paperclip, RefreshCw, Users } from "lucide-react-native";
import { toIntlLocale } from "@/shared/i18n";
import type { Submission } from "@/shared/types";
import { Avatar, radius, Sheet, Text, useTheme } from "@/shared/ui";
import {
  useAssignment,
  useDownloadAssignmentFile,
  useDownloadSubmissionFile,
  useRecheckSubmission,
} from "../model/homework.queries";
import { HomeworkResultSheet } from "./homework-result-sheet";

export interface AssignmentDetailSheetProps {
  assignmentId?: string | null;
  open: boolean;
  onClose: () => void;
}

/**
 * Vazifa natijalari — veb `modules/homework/ui/assignment-detail-dialog.tsx`:
 * tavsif, biriktirilgan fayl, 3 ta statistika va topshiriqlar ro'yxati
 * (yuklab olish, qayta tekshirish, natija).
 */
export function AssignmentDetailSheet({ assignmentId, open, onClose }: AssignmentDetailSheetProps) {
  const { t, i18n } = useTranslation("homework");
  const { palette } = useTheme();
  const assignment = useAssignment(open ? assignmentId : null);
  const downloadAttachment = useDownloadAssignmentFile();
  const [resultOf, setResultOf] = useState<Submission | null>(null);
  const data = assignment.data;
  const submissions = data?.submissions ?? [];

  const description = data
    ? `${data.courseTitle ?? ""}${
        data.dueAt
          ? ` · ${t("detailDialog.dueLabel", {
              date: new Intl.DateTimeFormat(toIntlLocale(i18n.language), { dateStyle: "medium", timeStyle: "short" }).format(new Date(data.dueAt)),
            })}`
          : ` · ${t("detailDialog.noDue")}`
      }`
    : t("detailDialog.loading");

  return (
    <>
      <Sheet open={open} onClose={onClose} title={data?.title || t("detailDialog.defaultTitle")} description={description}>
        {assignment.isError ? (
          <View style={styles.state}>
            <Text variant="label">{t("detailDialog.loadError")}</Text>
            <Pressable accessibilityRole="button" onPress={() => void assignment.refetch()}>
              <Text variant="label" style={{ color: palette.primary }}>
                {t("detailDialog.retry")}
              </Text>
            </Pressable>
          </View>
        ) : assignment.isLoading || !data ? (
          <View style={[styles.loading, { backgroundColor: palette.muted }]} />
        ) : (
          <View style={styles.body}>
            {data.description || data.body ? (
              <Text variant="body" style={[styles.text, { color: palette["muted-foreground"] }]}>
                {data.description || data.body}
              </Text>
            ) : null}

            {data.hasAttachment ? (
              <Pressable
                accessibilityRole="button"
                disabled={downloadAttachment.isPending}
                onPress={() => downloadAttachment.mutate({ id: data.id, fileName: data.attachmentName || `${data.title}.pdf` })}
                style={[styles.attachment, { borderColor: palette.border, backgroundColor: palette.surface }]}
              >
                <Paperclip size={16} color={palette.foreground} />
                <Text variant="label" numberOfLines={1} style={styles.shrink}>
                  {data.attachmentName || t("detailDialog.downloadAttachmentAria")}
                </Text>
              </Pressable>
            ) : null}

            {data.stats ? (
              <View style={styles.stats}>
                {[
                  { icon: Users, value: data.stats.studentsCount ?? 0, label: t("detailDialog.studentsCount") },
                  { icon: CheckCircle2, value: data.stats.submittedCount ?? 0, label: t("detailDialog.submittedCount") },
                  { icon: BarChart3, value: data.stats.averageScore ?? "—", label: t("detailDialog.averageScore") },
                ].map(({ icon: StatIcon, value, label }) => (
                  <View key={label} style={[styles.stat, { borderColor: palette.border, backgroundColor: palette.muted }]}>
                    <StatIcon size={16} color={palette["muted-foreground"]} />
                    <Text variant="heading">{String(value)}</Text>
                    <Text variant="caption" style={{ color: palette["muted-foreground"] }}>
                      {label}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            <Text variant="caption" style={[styles.section, { color: palette["muted-foreground"] }]}>
              {t("detailDialog.submissionsHeader", { count: submissions.length })}
            </Text>
            <View style={styles.list}>
              {submissions.map((submission) => (
                <SubmissionRow key={submission.id} submission={submission} onOpenResult={setResultOf} />
              ))}
              {!submissions.length ? (
                <Text variant="label" style={[styles.regular, { color: palette["muted-foreground"] }]}>
                  {t("detailDialog.noSubmissions")}
                </Text>
              ) : null}
            </View>
          </View>
        )}
      </Sheet>
      <HomeworkResultSheet submission={resultOf} onClose={() => setResultOf(null)} />
    </>
  );
}

function SubmissionRow({ submission, onOpenResult }: { submission: Submission; onOpenResult: (submission: Submission) => void }) {
  const { t } = useTranslation("homework");
  const { palette } = useTheme();
  const download = useDownloadSubmissionFile();
  const recheck = useRecheckSubmission();
  const name = submission.studentName || t("detailDialog.defaultStudent");
  const pill =
    submission.status === "done"
      ? { bg: palette["success-soft"], fg: palette["success-strong"] }
      : submission.status === "error"
        ? { bg: palette["destructive-soft"], fg: palette["destructive-strong"] }
        : { bg: palette["warning-soft"], fg: palette["warning-strong"] };
  const statusLabel =
    submission.status === "done"
      ? t("detailDialog.scorePoints", { score: submission.overallScore ?? "—" })
      : (({ checking: t("status.checking"), error: t("status.error") }) as Record<string, string>)[submission.status] ?? submission.status;

  return (
    <View style={[styles.row, { borderColor: palette.border, backgroundColor: palette.surface }]}>
      <Avatar variant="legacy" name={name} size="sm" />
      <View style={styles.main}>
        <Text variant="label" numberOfLines={1}>
          {name}
        </Text>
        <View style={styles.file}>
          <FileText size={12} color={palette["muted-foreground"]} />
          <Text variant="caption" numberOfLines={1} style={[styles.shrink, { color: palette["muted-foreground"] }]}>
            {submission.fileName || t("detailDialog.defaultFile")}
            {submission.isLate ? (
              <Text variant="caption" style={[styles.late, { color: palette["destructive-strong"] }]}>
                {` · ${t("detailDialog.lateSuffix")}`}
              </Text>
            ) : null}
          </Text>
        </View>
      </View>
      <View style={[styles.pill, { backgroundColor: pill.bg }]}>
        {submission.status === "done" ? <CheckCircle2 size={14} color={pill.fg} /> : <Clock3 size={13} color={pill.fg} />}
        <Text variant="caption" style={[styles.pillText, { color: pill.fg }]}>
          {statusLabel}
        </Text>
      </View>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("detailDialog.downloadSubmissionAria")}
          disabled={download.isPending}
          onPress={() => download.mutate({ id: submission.id, fileName: submission.fileName })}
          style={styles.iconButton}
        >
          <Download size={16} color={palette["muted-foreground"]} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("detailDialog.recheckAria")}
          disabled={recheck.isPending || submission.status === "checking"}
          onPress={() => recheck.mutate(submission.id)}
          style={styles.iconButton}
        >
          <RefreshCw size={16} color={palette["muted-foreground"]} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => onOpenResult(submission)}
          style={[styles.result, { borderColor: palette.border, backgroundColor: palette.surface }]}
        >
          <Text variant="label">{t("detailDialog.result")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shrink: { flexShrink: 1 },
  regular: { fontWeight: "400" },
  body: { gap: 14 },
  text: { lineHeight: 26 },
  state: { alignItems: "center", gap: 8, paddingVertical: 24 },
  loading: { height: 160, borderRadius: radius.md },
  attachment: { alignSelf: "flex-start", maxWidth: "100%", height: 44, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, borderWidth: 1, borderRadius: 13 },
  /* `.assignment-stat-grid` */
  stats: { flexDirection: "row", gap: 8 },
  stat: { flex: 1, alignItems: "center", gap: 2, paddingHorizontal: 8, paddingVertical: 12, borderWidth: 1, borderRadius: 13 },
  section: { fontWeight: "800", letterSpacing: 1.3 },
  list: { gap: 8 },
  /* `.submission-row` (tor ekranda o'raladi) */
  row: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderRadius: 13 },
  main: { flex: 1, minWidth: 0 },
  file: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  late: { fontWeight: "700" },
  pill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: radius.full },
  pillText: { fontWeight: "800" },
  actions: { flexDirection: "row", alignItems: "center", gap: 4 },
  iconButton: { width: 36, height: 36, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  result: { height: 36, justifyContent: "center", paddingHorizontal: 14, borderWidth: 1, borderRadius: 10 },
});
