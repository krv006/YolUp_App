import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { homeworkApi } from "@/modules/homework";
import { parentHomework, retryMinutes, useRemindChildHomework, type HomeworkState } from "@/modules/parent";
import { downloadBlob, formatLocalized, htmlToPlainText } from "@/shared/lib";
import type { Assignment, Course } from "@/shared/types";
import { Avatar, DsText, dsRadius, FileViewer, Icon, toast, useDs, type DsColor, type IconName } from "@/shared/ui";
import { subjectLook } from "../attendance/attendance-styles";
import { fileKind, formatBytes, resultTone } from "./homework-format";
import { StateChip } from "./homework-list";

type Step = { tone: "done" | "fail" | "current" | "todo"; title: string; meta?: string };
type Viewable = { name: string; mimeType: string; meta: string; source: string; load: (signal: AbortSignal) => Promise<Blob> };

const STEP_DOT: Record<Step["tone"], DsColor> = {
  done: "success",
  fail: "danger",
  current: "accent-teal-fg",
  todo: "line-strong",
};
const STEP_ICON: Partial<Record<Step["tone"], IconName>> = { done: "check", fail: "close", current: "more-horiz" };
const KIND_TILE: Record<"pdf" | "image" | "file", { icon: IconName; bg: DsColor; fg: DsColor }> = {
  pdf: { icon: "description-fill", bg: "danger-bg", fg: "error-text" },
  image: { icon: "image", bg: "accent-blue-bg", fg: "accent-blue-fg" },
  file: { icon: "attach-file", bg: "subtle", fg: "icon-secondary" },
};
const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Bosqichlar — `rounded-2xl bg-subtle px-5 py-4`, nuqtalar orasida chiziq. */
function Timeline({ steps }: { steps: Step[] }) {
  const ds = useDs();
  return (
    <View style={[styles.timeline, { backgroundColor: ds.c.subtle }]}>
      {steps.map((step, index) => {
        const icon = STEP_ICON[step.tone];
        return (
          <View key={step.title} style={[styles.step, index < steps.length - 1 && styles.stepGap]}>
            {index < steps.length - 1 ? <View style={[styles.stepLine, { backgroundColor: ds.c[step.tone === "done" ? "success" : "line-strong"] }]} /> : null}
            <View style={[styles.stepDot, { backgroundColor: ds.c[STEP_DOT[step.tone]] }]}>{icon ? <Icon name={icon} size={14} color={ds.c["on-action"]} /> : null}</View>
            <View style={styles.grow}>
              <DsText v="title-sm" c={step.tone === "fail" ? "error-text" : step.tone === "todo" ? "ink-tertiary" : "ink"}>
                {step.title}
              </DsText>
              {step.meta ? (
                <DsText v="body-xs" c="ink-secondary">
                  {step.meta}
                </DsText>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** Fayl kartasi — ko'rish (`FileViewer`) va yuklab olish (ulashish oynasi). */
function FileCard({ file, onView }: { file: Viewable; onView: (file: Viewable) => void }) {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const tile = KIND_TILE[fileKind(file.name, file.mimeType)];
  const [busy, setBusy] = useState(false);

  async function download() {
    setBusy(true);
    try {
      if (!(await downloadBlob(await file.load(new AbortController().signal), file.name))) throw new Error();
    } catch {
      toast.error(t("homeworkView.downloadError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={[styles.file, { backgroundColor: ds.c.subtle }]}>
      <View style={[styles.fileIcon, { backgroundColor: ds.c[tile.bg] }]}>
        <Icon name={tile.icon} size={22} color={ds.c[tile.fg]} />
      </View>
      <View style={styles.grow}>
        <DsText v="title-sm" numberOfLines={1}>
          {file.name}
        </DsText>
        <DsText v="body-xs" c="ink-secondary" numberOfLines={1}>
          {file.meta}
        </DsText>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("homeworkView.view")}
        onPress={() => onView(file)}
        style={({ pressed }) => [styles.fileButton, { backgroundColor: pressed ? ds.c.muted : ds.c.surface }]}
      >
        <Icon name="visibility" size={18} color={ds.c.icon} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("homeworkView.download")}
        disabled={busy}
        onPress={() => void download()}
        style={({ pressed }) => [styles.fileButton, { backgroundColor: pressed ? ds.c.muted : ds.c.surface }, busy && styles.faded]}
      >
        <Icon name="download" size={18} color={ds.c.icon} />
      </Pressable>
    </View>
  );
}

/** Farzandga eslatma — `h-11 self-start rounded-full bg-brand-subtle px-4 text-button text-brand`. */
function RemindChild({ assignmentId, childId, name }: { assignmentId: string; childId: string; name: string }) {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const remind = useRemindChildHomework(childId);
  const sent = remind.isSuccess && remind.variables === assignmentId;
  const disabled = sent || remind.isPending;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() =>
        remind.mutate(assignmentId, {
          onSuccess: () => toast.success(t("homeworkView.remind.done", { name })),
          onError: (error) => {
            const minutes = retryMinutes(error);
            toast.error(minutes === null ? t("homeworkView.remind.failed") : t("homeworkView.remind.limit", { count: minutes }));
          },
        })
      }
      style={({ pressed }) => [styles.remind, { backgroundColor: ds.c["brand-subtle"], opacity: disabled ? 0.6 : pressed ? 0.85 : 1 }]}
    >
      <Icon name={sent ? "check" : "notifications-active"} size={18} color={ds.c.brand} />
      <DsText v="button" c="brand">
        {sent ? t("homeworkView.remind.sent") : t("homeworkView.remind.action", { name })}
      </DsText>
    </Pressable>
  );
}

/** Rangli izoh qutisi — `flex items-start gap-3 rounded-2xl px-4 py-3 text-body-sm`. */
function Banner({ icon, children }: { icon: IconName; children: React.ReactNode }) {
  const ds = useDs();
  return (
    <View style={[styles.banner, { backgroundColor: ds.c["danger-bg"] }]}>
      <Icon name={icon} size={20} color={ds.c["error-text"]} />
      <DsText v="body-sm" c="error-text" style={styles.grow}>
        {children}
      </DsText>
    </View>
  );
}

/**
 * Vazifa tafsiloti — veb `homework-detail.tsx`: fan va holat chiplari,
 * sarlavha, o'qituvchi; holatga qarab qolgan vaqt hisoblagichi, natija
 * halqasi (guruh o'rtachasi va o'rni), ogohlantirishlar, bosqichlar,
 * o'qituvchi izohi, topshiriq matni va fayllar, farzandga eslatish.
 */
export function HomeworkDetail({
  assignment,
  assignments,
  course,
  childId,
  childName,
  now,
}: {
  assignment: Assignment;
  assignments: Assignment[];
  course: Course | undefined;
  childId: string | null;
  childName: string;
  now: number;
}) {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const [viewing, setViewing] = useState<Viewable | null>(null);
  const state: HomeworkState = parentHomework.homeworkState(assignment, now);
  const submission = assignment.mySubmission;
  const first = childName.split(" ")[0] || childName;
  const teacher = course?.teacher ?? "";
  const look = subjectLook(`${course?.subject ?? ""} ${course?.subjectLabel ?? ""} ${assignment.courseTitle}`);
  const pattern = t("homeworkView.shortPattern");
  const short = (value: string) => formatLocalized(value, pattern).toLowerCase();
  const full = (value: string) => formatLocalized(value, t("homeworkView.fullPattern")).toLowerCase();
  const description = assignment.description || htmlToPlainText(assignment.body);

  const attachment: Viewable | null = assignment.hasAttachment
    ? {
        name: assignment.attachmentName || t("homeworkView.attachment"),
        mimeType: "",
        meta: [fileKind(assignment.attachmentName).toUpperCase(), formatBytes(assignment.attachmentSize), t("homeworkView.fromTeacher")].filter(Boolean).join(" · "),
        source: t("homeworkView.fromTeacher"),
        load: (signal) => homeworkApi.downloadAssignment(assignment.id, { signal }),
      }
    : null;
  const answers: Viewable[] = submission
    ? (submission.files.length ? submission.files : submission.fileName ? [{ name: submission.fileName, size: null, mimeType: "", index: 0 }] : []).map((file) => ({
        name: file.name,
        mimeType: file.mimeType,
        meta: [formatBytes(file.size), t("homeworkView.uploadedBy", { name: first })].filter(Boolean).join(" · "),
        source: t("homeworkView.uploadedBy", { name: first }),
        load: (signal: AbortSignal) => homeworkApi.downloadSubmission(submission.id, { signal }, file.index),
      }))
    : [];

  const given: Step = { tone: "done", title: t("homeworkView.steps.given"), meta: [short(assignment.createdAt), teacher].filter(Boolean).join(" · ") };
  const submittedStep: Step | null = submission
    ? {
        tone: "done",
        title: t("homeworkView.steps.submitted"),
        meta: [
          full(submission.createdAt),
          assignment.dueAt && parentHomework.countdown(assignment.dueAt, Date.parse(submission.createdAt)).days >= 1
            ? t("homeworkView.steps.early", { count: parentHomework.countdown(assignment.dueAt, Date.parse(submission.createdAt)).days })
            : submission.isLate
              ? t("homeworkView.steps.late")
              : "",
        ]
          .filter(Boolean)
          .join(" · "),
      }
    : null;

  let steps: Step[] = [];
  if (state === "checking" && submittedStep)
    steps = [
      given,
      submittedStep,
      { tone: "current", title: t("homeworkView.steps.checking"), meta: t("homeworkView.steps.checkingMeta") },
      { tone: "todo", title: t("homeworkView.steps.graded") },
    ];
  if (state === "error" && submittedStep)
    steps = [
      submittedStep,
      { tone: "fail", title: t("homeworkView.steps.aiFailed"), meta: t("homeworkView.steps.aiFailedMeta") },
      { tone: "current", title: t("homeworkView.steps.teacherCheck"), meta: t("homeworkView.steps.teacherCheckMeta") },
      { tone: "todo", title: t("homeworkView.steps.graded") },
    ];
  if (state === "overdue")
    steps = [
      given,
      { tone: "fail", title: t("homeworkView.steps.notSubmitted"), meta: assignment.dueAt ? t("homeworkView.steps.dueEnded", { date: full(assignment.dueAt) }) : undefined },
      ...(assignment.allowLate ? [{ tone: "current" as const, title: t("homeworkView.steps.lateAllowed"), meta: t("homeworkView.steps.lateAllowedMeta") }] : []),
    ];
  if (state === "resubmit" && submittedStep) steps = [submittedStep, { tone: "current", title: t("homeworkView.steps.resubmit"), meta: submission?.resubmitComment || undefined }];
  if (state === "done" && submittedStep) steps = [given, submittedStep, { tone: "done", title: t("homeworkView.steps.accepted") }];

  const percent = submission?.gradeValue != null && assignment.maxScore ? (submission.gradeValue / assignment.maxScore) * 100 : 0;
  const delta = state === "graded" ? parentHomework.scoreDelta(assignment, assignments) : null;
  const left = assignment.dueAt ? parentHomework.countdown(assignment.dueAt, now) : null;
  const group = state === "graded" ? assignment.groupStats : null;
  const canRemind = Boolean(childId) && (state === "pending" || state === "resubmit" || (state === "overdue" && assignment.allowLate));

  return (
    // `flex flex-col gap-5 rounded-[24px] bg-surface p-5`
    <View style={[styles.card, { backgroundColor: ds.c.surface }]}>
      <View style={styles.head}>
        <View style={styles.chips}>
          <View style={[styles.subject, { backgroundColor: ds.c[look.bg] }]}>
            <Icon name={look.icon} size={14} color={ds.c[look.fg]} />
            <DsText v="caption-strong" c={look.fg} numberOfLines={1}>
              {assignment.courseTitle}
            </DsText>
          </View>
          <StateChip assignment={assignment} state={state} now={now} />
        </View>
        {/* `font-heading text-[24px]/8 font-semibold` */}
        <DsText v="h1" heading style={styles.title}>
          {assignment.title}
        </DsText>
        <View style={styles.teacher}>
          {teacher ? <Avatar variant="legacy" name={teacher} src={course?.teacherUser?.avatarUrl ?? undefined} size="sm" box={24} /> : null}
          <DsText v="body-xs" c="ink-secondary" style={styles.grow}>
            {[teacher, t("homeworkView.givenOn", { date: short(assignment.createdAt) })].filter(Boolean).join(" · ")}
          </DsText>
        </View>
      </View>

      {state === "error" ? <Banner icon="warning-fill">{t("homeworkView.errorBanner")}</Banner> : null}
      {state === "overdue" && assignment.dueAt ? (
        <Banner icon="schedule">
          {t("homeworkView.overdueBanner", { count: Math.max(1, parentHomework.daysBetween(Date.parse(assignment.dueAt), now)) })}{" "}
          {assignment.allowLate ? t("homeworkView.lateAccepted") : t("homeworkView.lateRejected")}
        </Banner>
      ) : null}

      {state === "pending" && left && assignment.dueAt ? (
        <View style={[styles.countdown, { backgroundColor: ds.c["warning-bg"] }]}>
          <View style={styles.countdownHead}>
            <View style={styles.row}>
              <Icon name="timer" size={18} color={ds.c["warning-text"]} />
              <DsText v="title-sm" c="warning-text">
                {t("homeworkView.timeLeft")}
              </DsText>
            </View>
            <DsText v="body-xs" c="warning-text">
              {t("homeworkView.dueOn", { date: full(assignment.dueAt) })}
            </DsText>
          </View>
          <View style={styles.units}>
            {(["days", "hours", "minutes"] as const).map((unit) => (
              <View key={unit} style={[styles.unit, { backgroundColor: ds.c.surface }]}>
                <DsText v="h1" heading c="warning-text" style={styles.unitValue}>
                  {String(left[unit]).padStart(2, "0")}
                </DsText>
                <DsText v="caption" c="ink-secondary">
                  {t(`homeworkView.units.${unit}`)}
                </DsText>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {state === "graded" && submission ? (
        <View style={[styles.result, { backgroundColor: ds.c["accent-green-bg"] }]}>
          <View style={styles.ring}>
            <Svg width={96} height={96} viewBox="0 0 96 96" style={styles.ringSvg}>
              <Circle cx={48} cy={48} r={RADIUS} fill="none" strokeWidth={8} stroke={ds.c.surface} />
              <Circle
                cx={48}
                cy={48}
                r={RADIUS}
                fill="none"
                strokeWidth={8}
                strokeLinecap="round"
                stroke={ds.c.success}
                strokeDasharray={`${(percent / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
              />
            </Svg>
            <DsText v="h2" heading w="600" style={styles.ringValue}>
              {submission.gradeValue}/{assignment.maxScore}
            </DsText>
          </View>
          <View style={styles.resultText}>
            <DsText v="h2" heading w="600" c="accent-green-fg" style={styles.ringValue}>
              {t(`homeworkView.result.${resultTone(percent)}`)}
            </DsText>
            {delta !== null && delta !== 0 ? (
              <View style={[styles.delta, { backgroundColor: ds.c.surface }]}>
                <Icon name="trending-up" size={14} color={ds.c["success-text"]} />
                <DsText v="caption-strong" c="success-text">
                  {t("homeworkView.delta", { value: `${delta > 0 ? "+" : ""}${delta}` })}
                </DsText>
              </View>
            ) : null}
            {group && (group.average !== null || group.rank !== null) ? (
              <DsText v="body-xs" c="ink-secondary">
                {[
                  group.average !== null ? t("homeworkView.group.average", { value: group.average }) : "",
                  group.rank !== null ? t("homeworkView.group.rank", { name: first, rank: group.rank, total: group.total ?? "—" }) : "",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </DsText>
            ) : null}
          </View>
        </View>
      ) : null}

      {canRemind && childId ? <RemindChild assignmentId={assignment.id} childId={childId} name={first} /> : null}

      {steps.length ? <Timeline steps={steps} /> : null}

      {state === "graded" && submission?.teacherComment ? (
        <View style={[styles.comment, { backgroundColor: ds.c["accent-violet-bg"] }]}>
          <Avatar variant="legacy" name={teacher || "?"} src={course?.teacherUser?.avatarUrl ?? undefined} size="sm" box={36} />
          <View style={styles.grow}>
            <DsText v="caption-strong" c="accent-violet-fg">
              {teacher}
            </DsText>
            <DsText v="body-sm">{submission.teacherComment}</DsText>
          </View>
        </View>
      ) : null}

      {(state === "pending" || state === "overdue") && description ? (
        <View style={styles.task}>
          <DsText v="title-sm">{t("homeworkView.task")}</DsText>
          <DsText v="body-sm" c="ink-secondary">
            {description}
          </DsText>
        </View>
      ) : null}

      {(state === "pending" || state === "overdue") && attachment ? <FileCard file={attachment} onView={setViewing} /> : null}
      {submission ? answers.map((file) => <FileCard key={`${file.name}-${file.meta}`} file={file} onView={setViewing} />) : null}

      <FileViewer
        open={Boolean(viewing)}
        onOpenChange={(open) => {
          if (!open) setViewing(null);
        }}
        name={viewing?.name ?? ""}
        mimeType={viewing?.mimeType}
        meta={viewing?.source}
        load={viewing?.load ?? (() => Promise.reject(new Error("no file")))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  faded: { opacity: 0.5 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  card: { gap: 20, padding: 20, borderRadius: 24 },
  head: { gap: 12 },
  chips: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  subject: { maxWidth: "100%", flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: dsRadius.full },
  title: { lineHeight: 32 },
  teacher: { flexDirection: "row", alignItems: "center", gap: 8 },
  banner: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderRadius: dsRadius["2xl"] },
  countdown: { gap: 12, padding: 16, borderRadius: dsRadius["2xl"] },
  countdownHead: { gap: 4 },
  units: { flexDirection: "row", gap: 8 },
  unit: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: dsRadius["2xl"] },
  /* `font-heading text-[26px]/8 font-semibold` */
  unitValue: { fontSize: 26, lineHeight: 32 },
  result: { flexDirection: "row", alignItems: "center", gap: 20, paddingHorizontal: 20, paddingVertical: 16, borderRadius: dsRadius["2xl"] },
  ring: { width: 96, height: 96, alignItems: "center", justifyContent: "center" },
  ringSvg: { position: "absolute", transform: [{ rotate: "-90deg" }] },
  ringValue: { lineHeight: 28 },
  resultText: { flex: 1, minWidth: 0, alignItems: "flex-start", gap: 6 },
  delta: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: dsRadius.full },
  remind: { alignSelf: "flex-start", height: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 16, borderRadius: dsRadius.full },
  timeline: { paddingHorizontal: 20, paddingVertical: 16, borderRadius: dsRadius["2xl"] },
  step: { flexDirection: "row", gap: 12 },
  stepGap: { paddingBottom: 16 },
  /* `absolute top-6 bottom-0 left-[11px] w-0.5` */
  stepLine: { position: "absolute", top: 24, bottom: 0, left: 11, width: 2 },
  stepDot: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  comment: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderRadius: dsRadius["2xl"] },
  task: { gap: 6 },
  file: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderRadius: dsRadius["2xl"] },
  fileIcon: { width: 44, height: 44, borderRadius: dsRadius.xl, alignItems: "center", justifyContent: "center" },
  fileButton: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
});
