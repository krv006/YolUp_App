import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import {
  useDownloadSubmissionFile,
  useRecheckSubmission,
  useRequestResubmit,
  useReviewSubmission,
  useSubmission,
} from "@/modules/homework";
import type { GradingScale, Submission } from "@/shared/types";
import { Avatar, Icon, Input, radius, Sheet, SheetButton, SheetFooter, Switch, Text, useTheme, type IconName } from "@/shared/ui";

export interface SubmissionReviewProps {
  submission: Submission;
  grading?: GradingScale;
  maxScore?: number;
  onClose: () => void;
  onStep: (direction: 1 | -1) => void;
}

const SCORES = [2, 3, 4, 5];

function aiComment(result: Submission["result"] | null | undefined): string {
  if (!result?.summary) return "";
  const parts = [...(result.summary.recommendations ?? []), ...(result.summary.weaknesses ?? [])];
  return parts
    .map((item) => (typeof item === "string" ? item : ""))
    .filter(Boolean)
    .slice(0, 2)
    .join(" ");
}

function initialScore(submission: Submission, fallback: number | null): number | null {
  return submission.gradeValue ?? submission.overallScore ?? fallback;
}

/** Saqlangan o'qituvchi izohi (`result.teacher_comment`), bo'lmasa AI qoralamasi. */
function initialComment(submission: Submission): string {
  const stored = submission.rawResult?.teacher_comment;
  if (typeof stored === "string" && stored) return stored;
  return aiComment(submission.result) || "";
}

/**
 * O'quvchi javobini tekshirish — veb `widgets/homework-workspace/submission-review.tsx`
 * porti, telefon ko'rinishi (bitta ustun): o'quvchi, fayl, AI tahlili,
 * baho (vazifa shkalasiga qarab: 2–5 tugmalari, 100 ballik maydon yoki
 * bahosiz), izoh, ota-onaga ulashish, qayta topshirishni so'rash va tasdiqlash.
 */
export function SubmissionReview({ submission, grading = "five", maxScore = 100, onClose, onStep }: SubmissionReviewProps) {
  const { t } = useTranslation("homework");
  const { palette } = useTheme();
  const months = useTranslation("lesson").t("list.months", { returnObjects: true }) as string[];
  const detail = useSubmission(submission.id);
  const review = useReviewSubmission();
  const recheck = useRecheckSubmission();
  const download = useDownloadSubmissionFile();
  const requestResubmit = useRequestResubmit();

  const current = detail.data ?? submission;
  const ai = current.result;
  const aiScore = ai?.overallScore ?? null;

  const [score, setScore] = useState<number | null>(initialScore(current, aiScore));
  const [comment, setComment] = useState(initialComment(current));
  const [shareWithParent, setShareWithParent] = useState(current.shareWithParent);
  const [resubmitOpen, setResubmitOpen] = useState(false);
  const [resubmitComment, setResubmitComment] = useState("");
  const [syncedId, setSyncedId] = useState(current.id);

  if (syncedId !== current.id) {
    setSyncedId(current.id);
    setScore(initialScore(current, current.result?.overallScore ?? null));
    setComment(initialComment(current));
    setShareWithParent(current.shareWithParent);
  }

  function closeResubmit() {
    setResubmitOpen(false);
    setResubmitComment("");
  }

  const questions = ai?.questions ?? [];
  const correct = questions.filter((item) => (item.score ?? 0) > 0).length;
  const issues = questions.filter((item) => (item.mistakes?.length ?? 0) > 0 || (item.score ?? 0) <= 0);

  function submitted(): string {
    const date = new Date(current.createdAt);
    if (Number.isNaN(date.getTime())) return "—";
    const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    return date.toDateString() === new Date().toDateString()
      ? `${t("review.today")}, ${time}`
      : `${date.getDate()}-${(months[date.getMonth()] ?? "").toLowerCase()}, ${time}`;
  }

  const border = { borderColor: palette.border };
  const resubmitDisabled = current.status === "resubmit_requested" || current.status === "checking";
  const confirmDisabled = review.isPending || (grading !== "none" && score === null);

  return (
    <ScrollView style={{ backgroundColor: palette.background }} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <View style={styles.head}>
        <RoundButton icon="arrow-back" label={t("review.back")} onPress={onClose} />
        <Avatar variant="legacy" name={current.studentName} size="lg" />
        <View style={styles.grow}>
          <Text variant="subheading" numberOfLines={1}>
            {current.studentName}
          </Text>
          <Text variant="label" numberOfLines={1} style={[styles.bodySm, { color: palette["subtle-foreground"] }]}>
            {submitted()} · {current.isLate ? t("review.late") : t("review.onTime")}
          </Text>
        </View>
        <RoundButton icon="chevron-left" label={t("review.prev")} onPress={() => onStep(-1)} muted />
        <RoundButton icon="chevron-right" label={t("review.next")} onPress={() => onStep(1)} muted />
      </View>

      <View style={[styles.fileCard, border, { backgroundColor: palette.surface }]}>
        <View style={[styles.preview, { backgroundColor: palette["surface-subtle"] }]}>
          <Icon name="assign" size={26} color={palette["subtle-foreground"]} />
          <Text variant="caption" style={{ color: palette["subtle-foreground"] }}>
            {current.fileName || t("review.noFile")}
          </Text>
        </View>
        <View style={styles.fileBar}>
          <Text variant="caption" numberOfLines={1} style={[styles.grow, { color: palette["subtle-foreground"] }]}>
            {current.fileName || "—"}
          </Text>
          <RoundButton
            icon="download"
            label={t("review.download")}
            onPress={() => download.mutate({ id: current.id, fileName: current.fileName || undefined })}
          />
          <RoundButton icon="refresh" label={t("review.recheck")} onPress={() => recheck.mutate(current.id)} />
        </View>
      </View>

      {current.status === "resubmit_requested" ? (
        <View style={[styles.resubmitNote, border, { backgroundColor: palette["primary-soft"] }]}>
          <View style={styles.noteIcon}>
            <Icon name="refresh" size={16} color={palette.primary} />
          </View>
          <Text variant="label" style={[styles.bodySm, styles.grow]}>
            {t("review.resubmitRequested")}
            {current.resubmitComment ? ` · ${current.resubmitComment}` : ""}
          </Text>
        </View>
      ) : null}

      {current.error ? (
        <View style={[styles.error, { backgroundColor: palette["destructive-soft"], borderColor: palette["destructive-soft"] }]}>
          <Text variant="label" style={[styles.bodySm, { color: palette["destructive-strong"] }]}>
            {current.error}
          </Text>
        </View>
      ) : null}

      {/* AI tahlili */}
      <View style={[styles.box, border]}>
        <View style={styles.aiHead}>
          <View style={[styles.aiIcon, { backgroundColor: palette["saffron-strong"] }]}>
            <Icon name="check-circle" size={18} color="#ffffff" />
          </View>
          <View style={styles.grow}>
            <Text variant="label">{t("review.aiTitle")}</Text>
            <Text variant="caption" style={{ color: palette["subtle-foreground"] }}>
              {t("review.aiHint")}
            </Text>
          </View>
          <Text variant="title">
            {aiScore === null ? "—" : aiScore}
            <Text variant="caption" style={{ color: palette["subtle-foreground"] }}>
              /{grading === "hundred" ? maxScore : 5}
            </Text>
          </Text>
        </View>

        {questions.length ? (
          <View style={styles.meter}>
            <View style={styles.meterHead}>
              <Text variant="caption" style={[styles.grow, { color: palette["muted-foreground"] }]}>
                {t("review.correctAnswers")}
              </Text>
              <Text variant="caption" style={styles.strong}>
                {correct} / {questions.length}
              </Text>
            </View>
            <View style={[styles.track, { backgroundColor: palette["surface-subtle"] }]}>
              <View style={[styles.fill, { width: `${Math.round((correct / questions.length) * 100)}%`, backgroundColor: palette.success }]} />
            </View>
          </View>
        ) : null}

        {issues.length ? (
          <View style={styles.issues}>
            <Text variant="caption" style={[styles.overline, { color: palette["subtle-foreground"] }]}>
              {t("review.issues")}
            </Text>
            {issues.slice(0, 4).map((item, index) => (
              <View key={index} style={styles.issue}>
                <Icon name="error" size={15} color={palette["destructive-strong"]} />
                <Text variant="caption" style={[styles.grow, { color: palette["muted-foreground"] }]}>
                  {item.questionNumber ? `${item.questionNumber}. ` : ""}
                  {item.analysis || item.question || t("review.issueFallback")}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {aiComment(ai) ? (
          <View style={[styles.draft, { backgroundColor: palette["surface-subtle"] }]}>
            <Text variant="caption" style={[styles.overline, { color: palette["subtle-foreground"] }]}>
              {t("review.aiDraft")}
            </Text>
            <Text variant="caption" style={{ color: palette["muted-foreground"] }}>
              {aiComment(ai)}
            </Text>
          </View>
        ) : null}
      </View>

      {/* O'qituvchi bahosi */}
      <View style={styles.gradeBlock}>
        <Text variant="caption" style={[styles.overline, { color: palette["subtle-foreground"] }]}>
          {t("review.yourGrade")}
        </Text>
        {grading === "five" ? (
          <View style={styles.scores}>
            {SCORES.map((value) => (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityState={{ selected: score === value }}
                onPress={() => setScore(value)}
                style={[
                  styles.score,
                  score === value
                    ? { borderColor: palette.primary, backgroundColor: palette.primary }
                    : { borderColor: palette.border, backgroundColor: palette.surface },
                ]}
              >
                <Text variant="subheading" style={{ color: score === value ? palette["primary-foreground"] : palette.foreground }}>
                  {value}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {grading === "hundred" ? (
          <Input
            label={t("review.scoreOf", { max: maxScore })}
            keyboardType="number-pad"
            value={score === null ? "" : String(score)}
            onChangeText={(value) => {
              const digits = value.replace(/\D/g, "");
              setScore(digits ? Math.min(Number(digits), maxScore) : null);
            }}
          />
        ) : null}

        {grading === "none" ? (
          <Text variant="caption" style={{ color: palette["subtle-foreground"] }}>
            {t("review.gradingNone")}
          </Text>
        ) : null}

        {aiScore !== null && grading !== "none" ? (
          <View style={styles.suggestion}>
            <Icon name="check-circle" size={14} color={palette["saffron-strong"]} />
            <Text variant="caption" style={{ color: palette["subtle-foreground"] }}>
              {t("review.aiSuggestion", { value: aiScore, state: score === aiScore ? t("review.matches") : t("review.differs") })}
            </Text>
          </View>
        ) : null}

        <Input label={t("review.comment")} value={comment} onChangeText={setComment} multiline numberOfLines={4} />

        <View style={[styles.share, border]}>
          <View style={[styles.shareIcon, { backgroundColor: palette.primary }]}>
            <Icon name="groups" size={17} color={palette["primary-foreground"]} />
          </View>
          <View style={styles.grow}>
            <Text variant="label">{t("review.shareParent")}</Text>
            <Text variant="caption" style={{ color: palette["subtle-foreground"] }}>
              {t("review.shareParentHint")}
            </Text>
          </View>
          <Switch checked={shareWithParent} accessibilityLabel={t("review.shareParent")} onCheckedChange={setShareWithParent} />
        </View>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            disabled={resubmitDisabled}
            onPress={() => setResubmitOpen(true)}
            style={({ pressed }) => [
              styles.action,
              border,
              { borderWidth: 1, backgroundColor: pressed ? palette["surface-subtle"] : palette.surface },
              resubmitDisabled && styles.dim,
            ]}
          >
            <Text variant="label">{t("review.resubmit")}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={confirmDisabled}
            onPress={() =>
              review.mutate({
                id: current.id,
                input: {
                  gradeValue: grading === "none" ? undefined : score,
                  shareWithParent,
                  result: { ...(current.rawResult ?? {}), teacher_comment: comment },
                },
              })
            }
            style={({ pressed }) => [
              styles.action,
              {
                backgroundColor: pressed ? palette["primary-hover"] : palette.primary,
                opacity: confirmDisabled ? 0.5 : 1,
              },
            ]}
          >
            <Text variant="label" style={{ color: palette["primary-foreground"] }}>
              {t("review.confirm")}
            </Text>
          </Pressable>
        </View>
      </View>

      <Sheet
        open={resubmitOpen}
        onClose={closeResubmit}
        title={t("review.resubmitTitle")}
        description={t("review.resubmitDescription", { name: current.studentName })}
      >
        <Input
          label={t("review.resubmitComment")}
          value={resubmitComment}
          onChangeText={setResubmitComment}
          placeholder={t("review.resubmitPlaceholder")}
          multiline
          numberOfLines={4}
        />
        <SheetFooter>
          <SheetButton title={t("review.resubmitCancel")} onPress={closeResubmit} />
          <SheetButton
            variant="primary"
            title={t("review.resubmitSend")}
            disabled={requestResubmit.isPending || !resubmitComment.trim()}
            loading={requestResubmit.isPending}
            onPress={() =>
              requestResubmit.mutate({ id: current.id, comment: resubmitComment.trim() }, { onSuccess: closeResubmit })
            }
          />
        </SheetFooter>
      </Sheet>
    </ScrollView>
  );
}

function RoundButton({ icon, label, onPress, muted = false }: { icon: IconName; label: string; onPress: () => void; muted?: boolean }) {
  const { palette } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.round, { borderColor: palette.border, backgroundColor: pressed ? palette["surface-subtle"] : palette.surface }]}
    >
      <Icon name={icon} size={18} color={muted ? palette["muted-foreground"] : palette.foreground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  bodySm: { fontWeight: "400" },
  strong: { fontWeight: "600" },
  overline: { fontWeight: "600", letterSpacing: 0.6, textTransform: "uppercase" },
  page: { gap: 16, padding: 16 },
  head: { flexDirection: "row", alignItems: "center", gap: 12 },
  round: { width: 40, height: 40, borderWidth: 1, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  fileCard: { minHeight: 220, gap: 12, padding: 16, borderWidth: 1, borderRadius: radius["2xl"] },
  preview: { minHeight: 180, flex: 1, alignItems: "center", justifyContent: "center", gap: 8, borderRadius: radius.xl },
  fileBar: { flexDirection: "row", alignItems: "center", gap: 12 },
  /* `rounded-2xl border bg-action-subtle/40 px-4 py-3 gap-2` */
  resubmitNote: { flexDirection: "row", alignItems: "flex-start", gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderRadius: radius["2xl"] },
  noteIcon: { marginTop: 2 },
  dim: { opacity: 0.5 },
  error: { paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderRadius: radius["2xl"] },
  box: { gap: 12, padding: 16, borderWidth: 1, borderRadius: radius["2xl"] },
  aiHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  aiIcon: { width: 40, height: 40, borderRadius: radius.xl, alignItems: "center", justifyContent: "center" },
  meter: { gap: 8 },
  meterHead: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  track: { height: 6, borderRadius: radius.full, overflow: "hidden" },
  fill: { height: "100%", borderRadius: radius.full },
  issues: { gap: 8 },
  issue: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  draft: { gap: 6, padding: 12, borderRadius: radius.xl },
  gradeBlock: { gap: 12 },
  scores: { flexDirection: "row", gap: 8 },
  score: { flex: 1, height: 56, borderWidth: 1, borderRadius: radius.xl, alignItems: "center", justifyContent: "center" },
  suggestion: { flexDirection: "row", alignItems: "center", gap: 6 },
  share: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderRadius: radius["2xl"] },
  shareIcon: { width: 36, height: 36, borderRadius: radius.xl, alignItems: "center", justifyContent: "center" },
  actions: { flexDirection: "row", gap: 12 },
  action: { flex: 1, height: 48, alignItems: "center", justifyContent: "center", borderRadius: radius.full },
});
