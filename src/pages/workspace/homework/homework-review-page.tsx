import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  HomeworkResultDialog,
  useAssignment,
  useDownloadSubmissionFile,
  useRequestResubmit,
  useReviewSubmission,
  useSubmission,
} from "@/modules/homework";
import { ROUTES } from "@/shared/config";
import { Avatar, DsGradient, DsText, dsRadius, Icon, MobileRoundButton, useDs } from "@/shared/ui";
import { formatDue } from "./format-due";
import { ResubmitDialog } from "./resubmit-dialog";
import { SubmissionPreview } from "./submission-preview";

const GRADES = [1, 2, 3, 4, 5];

/**
 * Topshiriqlarni tekshirish — veb `homework-review-page.tsx` ning tor ekran
 * varianti: "N / M topshiriq" va oldingi/keyingi, o'quvchi, fayl ko'rinishi
 * (yuklab olish), AI dastlabki bahosi (bosilsa AI natijasi), 1–5 baho
 * tugmalari; pastda "Qayta topshirish" va "Tasdiqlash".
 */
export function HomeworkReviewPage() {
  const { t } = useTranslation("homework");
  const ds = useDs();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const months = useTranslation("lesson").t("list.months", { returnObjects: true }) as string[];
  const { assignmentId = null, s } = useLocalSearchParams<{ assignmentId: string; s?: string }>();
  const assignment = useAssignment(assignmentId);
  const review = useReviewSubmission();
  const resubmit = useRequestResubmit();
  const download = useDownloadSubmissionFile();

  const [grade, setGrade] = useState<number | null>(null);
  const [shareWithParent, setShareWithParent] = useState(true);
  const [resubmitOpen, setResubmitOpen] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [loadedId, setLoadedId] = useState<string | null>(null);

  const item = assignment.data ?? null;
  const rows = useMemo(() => item?.submissions ?? [], [item]);
  const visible = rows.filter((row) => row.status !== "done");
  const activeId = s ?? visible[0]?.id ?? rows[0]?.id ?? null;
  const submission = useSubmission(activeId);
  const current = submission.data ?? rows.find((row) => row.id === activeId) ?? null;

  if (current && loadedId !== current.id) {
    setLoadedId(current.id);
    setGrade(current.gradeValue ?? null);
    setShareWithParent(current.shareWithParent);
  }

  const index = rows.findIndex((row) => row.id === activeId);
  const checking = current?.status === "checking";
  const aiScore = current?.overallScore ?? null;
  const aiGrade = aiScore === null ? null : Math.max(1, Math.min(5, Math.round(aiScore / 20)));
  const findings = (current?.result?.questions ?? []).filter((question) => (question.analysis ?? "").length > 0).slice(0, 2);
  const questions = current?.result?.questions ?? [];
  const correctCount = questions.filter((question) => (question.score ?? 0) > 0).length;

  function move(step: number) {
    const next = rows[index + step];
    if (next) router.setParams({ s: next.id });
  }

  function back() {
    if (router.canGoBack()) router.back();
    else router.replace((assignmentId ? ROUTES.teacher.homeworkItem(assignmentId) : ROUTES.teacher.workspace) as never);
  }

  function confirm() {
    if (!current) return;
    review.mutate(
      { id: current.id, input: { gradeValue: grade, grade: grade === null ? "" : String(grade), shareWithParent } },
      { onSuccess: () => move(1) }
    );
  }

  return (
    <View style={[styles.fill, { backgroundColor: ds.c.canvas }]}>
      <ScrollView contentContainerStyle={[styles.page, { paddingTop: insets.top + 20 }]}>
        <DsGradient name="auth" />
        <View style={styles.header}>
          <MobileRoundButton icon="chevron-left" label={index <= 0 ? t("review.back") : t("review.prev")} onPress={() => (index <= 0 ? back() : move(-1))} />
          <DsText v="title-lg" numberOfLines={1} style={styles.headerTitle}>
            {t("mobileReview.position", { current: Math.max(index + 1, 1), total: rows.length })}
          </DsText>
          <MobileRoundButton icon="chevron-right" label={t("review.next")} disabled={index < 0 || index >= rows.length - 1} onPress={() => move(1)} />
        </View>

        <View style={styles.student}>
          <Avatar variant="legacy" name={current?.studentName} size="sm" box={48} />
          <View style={styles.studentBody}>
            <DsText v="title-lg" numberOfLines={1}>
              {current?.studentName}
            </DsText>
            <View style={styles.studentMeta}>
              {current?.isLate ? (
                <View style={[styles.late, { backgroundColor: ds.c["accent-saffron-bg"] }]}>
                  <Icon name="hourglass-empty" size={13} color={ds.c["accent-saffron-fg"]} />
                  <DsText v="caption-strong" c="accent-saffron-fg">
                    {t("mobileDetail.status.late")}
                  </DsText>
                </View>
              ) : null}
              <DsText v="caption" c="ink-secondary">
                {formatDue(current?.createdAt ?? null, months)}
              </DsText>
            </View>
          </View>
        </View>

        {/* `h-42 rounded-xl bg-surface` — fayl ko'rinishi */}
        <View style={[styles.preview, { backgroundColor: ds.c.surface }]}>
          {current?.fileName ? (
            <SubmissionPreview id={current.id} fileName={current.fileName} />
          ) : (
            <DsText v="body-sm" c="ink-secondary">
              {t("review.noFile")}
            </DsText>
          )}
          {current?.fileName ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => download.mutate({ id: current.id, fileName: current.fileName })}
              style={({ pressed }) => [styles.download, { borderColor: ds.c["line-strong"], backgroundColor: pressed ? ds.c.subtle : ds.c.surface }]}
            >
              <Icon name="add" size={18} color={ds.c.ink} />
              <DsText v="button">{t("review.download")}</DsText>
            </Pressable>
          ) : null}
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={!current}
          onPress={() => setResultOpen(true)}
          style={({ pressed }) => [styles.ai, { backgroundColor: pressed ? ds.c.subtle : ds.c.surface }]}
        >
          <View style={styles.aiHead}>
            <Icon name="auto-awesome" size={20} color={ds.c["accent-saffron-fg"]} />
            <DsText v="title" style={styles.grow}>
              {checking ? t("review.aiChecking") : t("mobileReview.aiGrade")}
            </DsText>
            {checking ? null : (
              <DsText v="title-lg" c="brand">
                {aiGrade ?? "—"} / 5
              </DsText>
            )}
          </View>
          <DsText v="caption" c="ink-secondary">
            {checking ? t("review.aiCheckingHint") : t("review.aiSuggestionHint")}
          </DsText>
          {questions.length && !checking ? (
            <View style={styles.finding}>
              <Icon name="check-circle" size={18} color={ds.c.success} />
              <DsText v="body-sm">{t("mobileReview.correct", { correct: correctCount, total: questions.length })}</DsText>
            </View>
          ) : null}
          {findings.map((question, position) => (
            <View key={position} style={styles.finding}>
              <Icon name="warning" size={18} color={ds.c["accent-saffron-fg"]} />
              <DsText v="body-sm" numberOfLines={2} style={styles.grow}>
                {question.analysis}
              </DsText>
            </View>
          ))}
        </Pressable>

        <DsText v="body-sm" style={styles.gradeLabel}>
          {t("review.yourGrade")}
        </DsText>
        <View style={styles.grades}>
          {GRADES.map((value) => {
            const active = grade === value;
            return (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setGrade(value)}
                style={[styles.gradeButton, active ? { backgroundColor: ds.c.brand } : { borderWidth: 1, borderColor: ds.c["line-strong"], backgroundColor: ds.c.surface }]}
              >
                <DsText v="title-sm" c={active ? "on-action" : "ink"}>
                  {value}
                </DsText>
              </Pressable>
            );
          })}
        </View>
        {aiGrade !== null ? (
          <DsText v="caption-strong" c={grade === aiGrade ? "success-fg" : "ink-secondary"} style={styles.aiHint}>
            {grade === aiGrade ? t("mobileReview.matches", { value: aiGrade }) : t("review.aiSuggestion", { value: aiGrade })}
          </DsText>
        ) : null}
      </ScrollView>

      {/* `grid-cols-[1fr_1.4fr] gap-2 rounded-t-2xl bg-surface px-4 pt-3 pb-8` */}
      <View style={[styles.footer, { backgroundColor: ds.c.surface, paddingBottom: Math.max(32, insets.bottom + 12) }]}>
        <Pressable
          accessibilityRole="button"
          disabled={!current}
          onPress={() => setResubmitOpen(true)}
          style={({ pressed }) => [styles.footerButton, styles.resubmit, { borderColor: ds.c["line-strong"], backgroundColor: pressed ? ds.c.subtle : ds.c.surface }, !current && styles.dim]}
        >
          <Icon name="refresh" size={18} color={ds.c.ink} />
          <DsText v="title" w="500" numberOfLines={1}>
            {t("mobileReview.resubmit")}
          </DsText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={!current || review.isPending || grade === null}
          onPress={confirm}
          style={({ pressed }) => [
            styles.footerButton,
            styles.confirm,
            { backgroundColor: pressed ? ds.c["brand-strong"] : ds.c.brand },
            (!current || review.isPending || grade === null) && styles.dim,
          ]}
        >
          <Icon name="check" size={18} color={ds.c["on-action"]} />
          <DsText v="title" w="500" c="on-action" numberOfLines={1}>
            {t("review.confirm")}
          </DsText>
        </Pressable>
      </View>

      <ResubmitDialog
        open={resubmitOpen}
        student={current?.studentName ?? ""}
        pending={resubmit.isPending}
        onOpenChange={setResubmitOpen}
        onConfirm={(comment) => current && resubmit.mutate({ id: current.id, comment }, { onSuccess: () => setResubmitOpen(false) })}
      />
      <HomeworkResultDialog
        submissionId={current?.id}
        initial={current ?? undefined}
        open={resultOpen && Boolean(current)}
        onOpenChange={setResultOpen}
        canRecheck
        canReview
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  dim: { opacity: 0.4 },
  page: { paddingHorizontal: 16, paddingBottom: 24 },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerTitle: { flex: 1, minWidth: 0, textAlign: "center" },
  student: { marginTop: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  studentBody: { flex: 1, minWidth: 0, alignItems: "flex-start", gap: 4 },
  studentMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  late: { height: 24, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, borderRadius: 12 },
  preview: { marginTop: 16, height: 168, overflow: "hidden", alignItems: "center", justifyContent: "center", borderRadius: dsRadius.xl },
  download: { position: "absolute", right: 12, bottom: 12, height: 40, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, borderWidth: 1, borderRadius: 20 },
  ai: { marginTop: 16, gap: 8, padding: 16, borderRadius: dsRadius.xl },
  aiHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  finding: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  gradeLabel: { marginTop: 20 },
  grades: { marginTop: 8, flexDirection: "row", gap: 8 },
  gradeButton: { flex: 1, minWidth: 0, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 22 },
  aiHint: { marginTop: 8 },
  footer: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingTop: 12, borderTopLeftRadius: dsRadius["2xl"], borderTopRightRadius: dsRadius["2xl"] },
  footerButton: { minWidth: 0, flexBasis: 0, height: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 26 },
  resubmit: { flexGrow: 1, borderWidth: 1 },
  confirm: { flexGrow: 1.4 },
});
