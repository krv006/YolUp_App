import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toIntlLocale } from "@/shared/i18n";
import type { Submission } from "@/shared/types";
import { DsGradient, DsText, dsRadius, Icon, MobileRoundButton, useDs, type DsColor, type IconName } from "@/shared/ui";
import { submissionAiState } from "../lib/submission-ai-state";
import { useRecheckSubmission, useReviewSubmission, useSubmission } from "../model/homework.queries";

export interface HomeworkResultDialogProps {
  submissionId?: string | null;
  initial?: Submission | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canRecheck?: boolean;
  canReview?: boolean;
}

function asText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return typeof value === "string" ? value : JSON.stringify(value);
}

const SECTIONS: Array<{ key: "strengths" | "topicsToReview" | "recommendations"; icon: IconName; tone: DsColor }> = [
  { key: "strengths", icon: "check-circle", tone: "success" },
  { key: "topicsToReview", icon: "warning-fill", tone: "accent-saffron-fg" },
  { key: "recommendations", icon: "sparkles-fill", tone: "brand" },
];

/**
 * AI natijasi — veb `homework-result-dialog.tsx` ning tor ekran varianti
 * (to'liq ekran): faylsiz topshiriqda matnli javob, `ai_state` bo'yicha
 * holat (tekshirilmoqda — qachondan beri; baholay olmadi; ball qo'ymadi —
 * AI xulosasi; AI ishlatilmagan), ko'k ball kartasi (bahoni tahrirlash va
 * qayta tekshirish — faqat fayl bo'lsa), kuchli tomonlar, takrorlash kerak
 * mavzular va tavsiyalar.
 */
export function HomeworkResultDialog({ submissionId, initial = null, open, onOpenChange, canRecheck = false, canReview = false }: HomeworkResultDialogProps) {
  const { t, i18n } = useTranslation("homework");
  const ds = useDs();
  const insets = useSafeAreaInsets();
  const query = useSubmission(open ? submissionId : null, { poll: initial?.status !== "done" });
  const recheck = useRecheckSubmission();
  const review = useReviewSubmission();
  const submission = query.data ?? initial;
  const aiState = submission ? submissionAiState(submission) : "checking";
  const hasFiles = Boolean(submission?.files.length);
  const showScore = aiState === "ready" || submission?.status === "done";
  const textAnswer = submission && !hasFiles && submission.comment ? submission.comment : "";
  const checkingSince = submission?.aiCheckingSince
    ? new Intl.DateTimeFormat(toIntlLocale(i18n.language), { hour: "2-digit", minute: "2-digit" }).format(new Date(submission.aiCheckingSince))
    : "";
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ score: string; grade: string; questions: Record<string, string> } | null>(null);

  function beginEdit() {
    if (!submission) return;
    setDraft({
      score: submission.overallScore == null ? "" : String(submission.overallScore),
      grade: submission.grade ?? "",
      questions: Object.fromEntries(
        (submission.result?.questions ?? []).map((item, index) => [String(index), item.score == null ? "" : String(item.score)])
      ),
    });
  }

  function buildResult(edited: NonNullable<typeof draft>, score: number | null) {
    const raw = submission?.rawResult;
    if (!raw) return undefined;
    const questions = Array.isArray(raw.questions) ? raw.questions : null;
    return {
      ...raw,
      overall_score: score,
      grade: edited.grade,
      ...(questions
        ? {
            questions: questions.map((item, index) => {
              const value = edited.questions[String(index)];
              if (value === undefined) return item;
              return { ...(item as Record<string, unknown>), score: value.trim() === "" ? null : Number(value) };
            }),
          }
        : {}),
    };
  }

  function saveReview() {
    if (!submission || !draft) return;
    const score = draft.score.trim() === "" ? null : Number(draft.score);
    if (score !== null && (!Number.isFinite(score) || score < 0 || score > 100)) {
      setReviewError(t("resultDialog.scoreRange"));
      return;
    }
    setReviewError(null);
    review.mutate(
      { id: submission.id, input: { overallScore: score, grade: draft.grade, result: buildResult(draft, score) } },
      {
        onSuccess: () => {
          setDraft(null);
          setReviewError(null);
        },
        onError: (error: Error) => setReviewError(error.message),
      }
    );
  }

  const onAction = ds.c["on-action"];
  const stateTone = aiState === "failed" ? ds.c.danger : aiState === "unscored" ? ds.c["accent-violet-fg"] : ds.c["ink-secondary"];

  return (
    <Modal visible={open} animationType="slide" statusBarTranslucent navigationBarTranslucent onRequestClose={() => onOpenChange(false)}>
      <View style={[styles.fill, { backgroundColor: ds.c.canvas }]}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.page, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }]}>
          <DsGradient name="auth" />
          <View style={styles.header}>
            <MobileRoundButton icon="chevron-left" label={t("resultDialog.cancel")} onPress={() => onOpenChange(false)} />
            <DsText v="title-lg" w="600" numberOfLines={1} style={styles.headerTitle}>
              {t("mobileResult.title")}
            </DsText>
            <View style={styles.spacer} />
          </View>

          {textAnswer ? (
            // `mt-4 gap-2 rounded-lg bg-surface p-4`
            <View style={[styles.section, { backgroundColor: ds.c.surface }]}>
              <DsText v="caption" c="ink-secondary">
                {t("detailDialog.textAnswer")}
              </DsText>
              <DsText v="body-sm">{textAnswer}</DsText>
            </View>
          ) : null}

          {!submission || aiState === "checking" ? (
            <View style={[styles.card, { backgroundColor: ds.c.surface }]}>
              <View style={styles.row}>
                <View style={[styles.icon, { backgroundColor: ds.c["brand-subtle"] }]}>
                  <Icon name="hourglass-empty" size={20} color={ds.c.brand} />
                </View>
                <View style={styles.grow}>
                  <DsText v="title" style={styles.lh24}>
                    {t("mobileResult.checking")}
                  </DsText>
                  <DsText v="body-sm" c="ink-secondary">
                    {checkingSince ? t("resultDialog.checkingSince", { time: checkingSince }) : t("mobileResult.checkingHint")}
                  </DsText>
                </View>
              </View>
              <View style={[styles.track, { backgroundColor: ds.c.subtle }]}>
                <View style={[styles.bar, { backgroundColor: ds.c.brand }]} />
              </View>
            </View>
          ) : !showScore ? (
            // `mt-4 items-start gap-3 rounded-lg p-4` — AI baholay olmadi / ball qo'ymadi / ishlatilmagan
            <View style={[styles.state, { backgroundColor: aiState === "failed" ? ds.c["danger-bg"] : ds.c.surface }]}>
              <View style={styles.stateIcon}>
                <Icon name={aiState === "failed" ? "warning-fill" : aiState === "unscored" ? "auto-awesome" : "info"} size={20} color={stateTone} />
              </View>
              <View style={[styles.grow, styles.stateBody]}>
                <DsText v="title-sm" c={aiState === "failed" ? "error-text" : "ink"}>
                  {aiState === "failed"
                    ? t("resultDialog.aiFailedTitle")
                    : aiState === "unscored"
                      ? t("resultDialog.aiUnscoredTitle")
                      : t("resultDialog.aiNone")}
                </DsText>
                {aiState === "failed" && submission.error ? (
                  <DsText v="body-xs" c="ink-secondary">
                    {submission.error}
                  </DsText>
                ) : null}
                {aiState === "unscored" && submission.aiSummary ? (
                  <DsText v="body-sm" c="ink-secondary" style={styles.summary}>
                    {submission.aiSummary}
                  </DsText>
                ) : null}
              </View>
            </View>
          ) : (
            <>
              {/* `rounded-lg bg-brand p-4 gap-3 text-on-action` */}
              <View style={[styles.card, { backgroundColor: ds.c.brand }]}>
                <View style={styles.row}>
                  <View style={styles.grow}>
                    <DsText v="caption" c="on-action">
                      {t("resultDialog.overallScore")}
                    </DsText>
                    <View style={styles.scoreRow}>
                      {draft ? (
                        <TextInput
                          keyboardType="number-pad"
                          value={draft.score}
                          onChangeText={(value) => setDraft({ ...draft, score: value.replace(/[^\d]/g, "") })}
                          style={[styles.scoreInput, { color: onAction, backgroundColor: ds.c["on-brand-subtle"] }]}
                        />
                      ) : (
                        <DsText w="700" c="on-action" style={styles.score}>
                          {submission.overallScore ?? "—"}
                        </DsText>
                      )}
                      <DsText w="700" c="on-action" style={styles.score}>
                        {" "}/ 100
                      </DsText>
                    </View>
                  </View>
                  {draft ? (
                    <TextInput
                      value={draft.grade}
                      onChangeText={(value) => setDraft({ ...draft, grade: value })}
                      style={[styles.grade, styles.gradeInput, { color: ds.c.brand, backgroundColor: ds.c.surface }]}
                    />
                  ) : (
                    <View style={[styles.grade, { backgroundColor: ds.c.surface }]}>
                      <DsText w="700" c="brand" style={styles.gradeText}>
                        {submission.grade || "—"}
                      </DsText>
                    </View>
                  )}
                </View>
                <View style={styles.pair}>
                  {draft ? (
                    <>
                      <ScoreButton label={t("resultDialog.cancel")} onPress={() => setDraft(null)} />
                      <ScoreButton label={t("resultDialog.save")} color="brand" disabled={review.isPending} onPress={saveReview} />
                    </>
                  ) : (
                    <>
                      <ScoreButton icon="edit" label={t("resultDialog.editGrade")} disabled={!canReview} onPress={beginEdit} />
                      <ScoreButton
                        icon="refresh"
                        label={t("mobileResult.recheck")}
                        disabled={!canRecheck || !hasFiles || recheck.isPending}
                        onPress={() => recheck.mutate(submission.id)}
                      />
                    </>
                  )}
                </View>
              </View>
              {reviewError ? (
                <View style={[styles.reviewError, { backgroundColor: ds.c["danger-bg"] }]}>
                  <DsText v="body-sm" c="error-text">
                    {reviewError}
                  </DsText>
                </View>
              ) : null}

              {SECTIONS.map(({ key, icon, tone }) => {
                const values = (submission.result?.summary?.[key] ?? []).map(asText).filter(Boolean);
                if (!values.length) return null;
                return (
                  <View key={key} style={[styles.section, { backgroundColor: ds.c.surface }]}>
                    <View style={styles.sectionHead}>
                      <Icon name={icon} size={20} color={ds.c[tone]} />
                      <DsText v="title">{t(`resultDialog.${key}`)}</DsText>
                    </View>
                    {values.map((value, index) => (
                      <DsText key={index} v="body-sm" c="ink-secondary">
                        • {value}
                      </DsText>
                    ))}
                  </View>
                );
              })}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

/** Ball kartasidagi oq tugma — `h-11 rounded-full bg-surface text-button`. */
function ScoreButton({ icon, label, color = "ink", disabled = false, onPress }: { icon?: IconName; label: string; color?: DsColor; disabled?: boolean; onPress: () => void }) {
  const ds = useDs();
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.scoreButton, { backgroundColor: pressed ? ds.c.subtle : ds.c.surface }, disabled && styles.dim]}
    >
      {icon ? <Icon name={icon} size={16} color={ds.c[color]} /> : null}
      <DsText v="button" c={color} numberOfLines={1}>
        {label}
      </DsText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  dim: { opacity: 0.5 },
  lh24: { lineHeight: 24 },
  /* `px-4 pt-5 pb-8` */
  page: { paddingHorizontal: 16 },
  header: { height: 44, flexDirection: "row", alignItems: "center", gap: 12 },
  headerTitle: { flex: 1, minWidth: 0, textAlign: "center" },
  spacer: { width: 44, height: 44 },
  card: { marginTop: 16, gap: 12, padding: 16, borderRadius: dsRadius.lg },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  icon: { width: 40, height: 40, borderRadius: dsRadius.lg, alignItems: "center", justifyContent: "center" },
  track: { height: 6, overflow: "hidden", borderRadius: 3 },
  bar: { height: "100%", width: "30%", borderRadius: 3 },
  state: { marginTop: 16, flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 16, borderRadius: dsRadius.lg },
  stateIcon: { marginTop: 2 },
  stateBody: { gap: 2 },
  summary: { marginTop: 4 },
  scoreRow: { flexDirection: "row", alignItems: "center" },
  score: { fontSize: 32, lineHeight: 38 },
  scoreInput: { width: 80, height: 38, paddingHorizontal: 8, paddingVertical: 0, borderRadius: dsRadius.lg, fontSize: 32, fontWeight: "700" },
  grade: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center" },
  gradeInput: { textAlign: "center", fontSize: 28, fontWeight: "700", padding: 0 },
  gradeText: { fontSize: 28, lineHeight: 34 },
  pair: { flexDirection: "row", gap: 8 },
  scoreButton: { flex: 1, minWidth: 0, height: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 22 },
  reviewError: { marginTop: 12, paddingHorizontal: 16, paddingVertical: 12, borderRadius: dsRadius.xl },
  section: { marginTop: 16, gap: 8, padding: 16, borderRadius: dsRadius.lg },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: 8 },
});
