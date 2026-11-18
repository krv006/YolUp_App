import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import type { Assignment, Submission } from "@/shared/types";
import { CenterDialog, DsText, dsRadius, Icon, useDs, type DsColor, type IconName } from "@/shared/ui";
import { shortDateTime } from "../lib/format";

type StepState = "done" | "active" | "waiting";

/** Veb `DOT`: bajarilgan — yashil, joriy — binafsha, kutilayotgan — kulrang. */
const DOT: Record<StepState, { bg: DsColor; fg: DsColor }> = {
  done: { bg: "success", fg: "ink-inverse" },
  active: { bg: "accent-violet-fg", fg: "ink-inverse" },
  waiting: { bg: "subtle", fg: "ink-secondary" },
};

const ICON: Record<StepState, IconName> = { done: "check", active: "auto-awesome", waiting: "schedule" };

export interface HomeworkSubmittedDialogProps {
  open: boolean;
  assignment: Assignment;
  submission: Submission | null;
  onDone: () => void;
}

/**
 * "Vazifa topshirildi" — veb `homework-submitted-dialog.tsx` (`AppDialog
 * variant="confirm"`, markazda): topshirilgan vaqt, AI tekshiruvi (yoqilgan
 * bo'lsa) va o'qituvchi bahosi bosqichlari. Yopish ham "Vazifalarga
 * qaytish" bilan bir xil.
 */
export function HomeworkSubmittedDialog({ open, assignment, submission, onDone }: HomeworkSubmittedDialogProps) {
  const { t } = useTranslation("student");
  const ds = useDs();
  const months = useTranslation("lesson").t("list.months", { returnObjects: true }) as string[];
  const sentHint = submission
    ? [shortDateTime(submission.createdAt, months), submission.isLate ? t("workspace.hwItem.late") : t("workspace.hwItem.onTime")]
        .filter(Boolean)
        .join(" · ")
    : "";
  const steps = [
    { id: "sent", state: "done" as StepState, title: t("workspace.hwItem.doneSent"), hint: sentHint },
    assignment.aiCheck
      ? { id: "ai", state: "active" as StepState, title: t("workspace.hwItem.doneAi"), hint: t("workspace.hwItem.doneAiHint") }
      : null,
    {
      id: "teacher",
      state: (assignment.aiCheck ? "waiting" : "active") as StepState,
      title: assignment.grading === "none" ? t("workspace.hwItem.doneReview") : t("workspace.hwItem.doneTeacher"),
      hint: assignment.grading === "none" ? t("workspace.hwItem.doneReviewHint") : t("workspace.hwItem.doneTeacherHint"),
    },
  ].filter((step) => step !== null);

  return (
    <CenterDialog open={open} onClose={onDone} maxWidth={400}>
      <View style={styles.body}>
        {/* `size-14 rounded-full bg-success-bg text-success-fg` */}
        <View style={[styles.badge, { backgroundColor: ds.c["success-bg"] }]}>
          <Icon name="check-circle" size={28} color={ds.c["success-fg"]} />
        </View>
        <DsText v="title-lg" w="600" style={styles.center}>
          {t("workspace.hwItem.doneTitle")}
        </DsText>
        <DsText v="body-sm" c="ink-secondary" style={styles.center}>
          {t("workspace.hwItem.doneText", { title: assignment.title })}
        </DsText>
        {/* `gap-3 rounded-2xl bg-subtle/60 p-4 text-left` */}
        <View style={[styles.steps, { backgroundColor: ds.c.subtle }]}>
          {steps.map((step) => (
            <View key={step.id} style={styles.step}>
              <View style={[styles.dot, { backgroundColor: ds.c[DOT[step.state].bg] }]}>
                <Icon name={ICON[step.state]} size={16} color={ds.c[DOT[step.state].fg]} />
              </View>
              <View style={styles.grow}>
                <DsText v="body-sm" w="600" c={step.state === "waiting" ? "ink-secondary" : "ink"}>
                  {step.title}
                </DsText>
                {step.hint ? (
                  <DsText v="caption" c="ink-secondary">
                    {step.hint}
                  </DsText>
                ) : null}
              </View>
            </View>
          ))}
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={onDone}
          style={({ pressed }) => [styles.button, { backgroundColor: pressed ? ds.c["brand-strong"] : ds.c.brand }]}
        >
          <DsText v="button" c="on-action">
            {t("workspace.hwItem.doneBack")}
          </DsText>
        </Pressable>
      </View>
    </CenterDialog>
  );
}

const styles = StyleSheet.create({
  body: { alignItems: "center", gap: 12, padding: 24 },
  center: { textAlign: "center" },
  badge: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  steps: { alignSelf: "stretch", gap: 12, padding: 16, borderRadius: dsRadius["2xl"] },
  step: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  dot: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  grow: { flex: 1, minWidth: 0 },
  /* `h-12 w-full rounded-full bg-brand` */
  button: { alignSelf: "stretch", height: 48, alignItems: "center", justifyContent: "center", borderRadius: dsRadius.full, marginTop: 4 },
});
