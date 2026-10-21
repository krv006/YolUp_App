import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { CheckCircle2, CircleAlert, FileQuestion, FileUp, History, ListChecks, Paperclip, PenLine } from "lucide-react-native";
import {
  homeworkFieldError,
  useAssignments,
  useDownloadAssignmentFile,
  useSubmission,
  useSubmitHomework,
} from "@/modules/homework";
import { HomeworkResultSheet } from "@/modules/homework/ui/homework-result-sheet";
import { QuizAttemptSheet, QuizAttemptsSheet, quizDisplayTitle, useQuizzes } from "@/modules/quiz";
import { formatDayTime, pickDocument, sanitizeHtml, toUploadFile, type PickedFile } from "@/shared/lib";
import type { Assignment, QuizSummary, Submission } from "@/shared/types";
import { HtmlView, radius, Sheet, SheetButton, SheetFooter, Text, toast, useTheme } from "@/shared/ui";
import { PanelHeading } from "./panel-heading";

function isAssignmentOverdue(assignment: Assignment): boolean {
  return Boolean(assignment.dueAt && new Date(assignment.dueAt).getTime() < Date.now());
}

/**
 * O'quvchining guruh vazifalari — veb `student-group-workspace.tsx` dagi
 * `StudentAssignments`: testlar ("Yechish", urinishlar tarixi) va vazifalar
 * (muddat, holat yorlig'i, "Topshirish"). Tor ekranda vebning mo'ljallangan
 * joylashuvi: ikonka va matn, tugmalar ostida 53px chekinish bilan.
 */
export function StudentAssignments({ courseId }: { courseId: string }) {
  const { t } = useTranslation("student");
  const { palette } = useTheme();
  const assignments = useAssignments(courseId);
  const quizzes = useQuizzes(courseId, Boolean(courseId));
  const [selected, setSelected] = useState<Assignment | null>(null);
  const [attemptOf, setAttemptOf] = useState<QuizSummary | null>(null);
  const [historyOf, setHistoryOf] = useState<QuizSummary | null>(null);
  const [resultOf, setResultOf] = useState<Submission | null>(null);
  const items = assignments.data ?? [];
  const quizList = (quizzes.data ?? []).filter((quiz) => quiz.courseId === courseId);

  return (
    <ScrollView style={{ backgroundColor: palette.background }} contentContainerStyle={styles.page}>
      <PanelHeading eyebrow={t("groupWorkspace.assignments.eyebrow")} title={t("groupWorkspace.assignments.title")} />

      {assignments.isLoading ? (
        <View style={[styles.loading, { backgroundColor: palette.muted }]} />
      ) : (
        <View style={styles.list}>
          {quizList.map((quiz) => (
            <Row
              key={quiz.id}
              icon={<FileQuestion size={20} color={palette["primary-text"]} />}
              title={quizDisplayTitle(quiz)}
              meta={`${t("groupWorkspace.assignments.quizBadge")} · ${
                quiz.dueAt ? `${t("groupWorkspace.assignments.dueLabel")}: ${formatDayTime(quiz.dueAt)}` : t("groupWorkspace.assignments.noDue")
              } · ${t("groupWorkspace.assignments.quizQuestions", { count: quiz.questionCount })}`}
              side={
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("groupWorkspace.assignments.quizHistoryAria")}
                  onPress={() => setHistoryOf(quiz)}
                  style={[styles.iconButton, { borderColor: palette.border, backgroundColor: palette.surface }]}
                >
                  <History size={16} color={palette.foreground} />
                </Pressable>
              }
              action={<SmallButton label={t("groupWorkspace.assignments.quizSolve")} onPress={() => setAttemptOf(quiz)} />}
            />
          ))}

          {items.map((item) => {
            const overdue = isAssignmentOverdue(item);
            const deadline = item.dueAt ? formatDayTime(item.dueAt) : null;
            return (
              <Row
                key={item.id}
                overdue={overdue}
                icon={<ListChecks size={20} color={overdue ? palette["destructive-strong"] : palette["primary-text"]} />}
                title={item.title}
                meta={
                  deadline
                    ? `${overdue ? t("groupWorkspace.assignments.overdueLabel") : t("groupWorkspace.assignments.dueLabel")}: ${deadline}`
                    : t("groupWorkspace.assignments.noDue")
                }
                side={item.hasAttachment ? <AttachmentButton assignment={item} /> : null}
                action={
                  item.mySubmission ? (
                    <SubmissionStatus initial={item.mySubmission} onOpen={setResultOf} />
                  ) : overdue ? (
                    <View style={[styles.missed, { borderColor: palette["destructive-soft-border"], backgroundColor: palette["destructive-soft"] }]}>
                      <CircleAlert size={15} color={palette["destructive-strong"]} />
                      <Text variant="caption" style={[styles.heavy, { color: palette["destructive-strong"] }]}>
                        {t("groupWorkspace.assignments.missed")}
                      </Text>
                    </View>
                  ) : (
                    <SmallButton label={t("groupWorkspace.assignments.submit")} onPress={() => setSelected(item)} />
                  )
                }
              />
            );
          })}

          {!items.length && !quizList.length ? (
            <Text variant="label" style={[styles.regular, { color: palette["muted-foreground"] }]}>
              {t("groupWorkspace.assignments.empty")}
            </Text>
          ) : null}
        </View>
      )}

      <QuizAttemptSheet quizId={attemptOf?.id ?? null} open={Boolean(attemptOf)} onClose={() => setAttemptOf(null)} />
      <QuizAttemptsSheet quizId={historyOf?.id ?? null} open={Boolean(historyOf)} onClose={() => setHistoryOf(null)} title={historyOf?.title} />
      <SubmitSheet assignment={selected} onClose={() => setSelected(null)} />
      <HomeworkResultSheet submission={resultOf} onClose={() => setResultOf(null)} />
    </ScrollView>
  );
}

/** `.student-workspace-list article` (tor ekranda o'raladigan ko'rinish). */
function Row({
  icon,
  title,
  meta,
  side,
  action,
  overdue = false,
}: {
  icon: ReactNode;
  title: string;
  meta: string;
  side?: ReactNode;
  action: ReactNode;
  overdue?: boolean;
}) {
  const { palette } = useTheme();
  return (
    <View
      style={[
        styles.row,
        overdue
          ? { borderColor: palette["destructive-soft-border"], backgroundColor: palette["destructive-soft"] }
          : { borderColor: palette.border, backgroundColor: palette.surface },
      ]}
    >
      <View style={styles.rowTop}>
        <View style={[styles.rowIcon, { backgroundColor: overdue ? palette.surface : palette["primary-soft"] }]}>{icon}</View>
        <View style={styles.rowText}>
          <Text variant="label" style={styles.rowTitle}>
            {title}
          </Text>
          <Text
            variant="caption"
            style={overdue ? [styles.heavy, { color: palette["destructive-strong"] }] : { color: palette["muted-foreground"] }}
          >
            {meta}
          </Text>
        </View>
        {side}
      </View>
      <View style={styles.rowAction}>{action}</View>
    </View>
  );
}

function SmallButton({ label, onPress }: { label: string; onPress: () => void }) {
  const { palette } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.small, { backgroundColor: pressed ? palette["primary-hover"] : palette.primary }]}
    >
      <Text variant="label" style={{ color: palette["primary-foreground"] }}>
        {label}
      </Text>
    </Pressable>
  );
}

function AttachmentButton({ assignment }: { assignment: Assignment }) {
  const { t } = useTranslation("student");
  const { palette } = useTheme();
  const download = useDownloadAssignmentFile();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("groupWorkspace.assignments.downloadAria")}
      disabled={download.isPending}
      onPress={() => download.mutate({ id: assignment.id, fileName: assignment.attachmentName || assignment.title })}
      style={[styles.iconButton, { borderColor: palette.border, backgroundColor: palette.surface }]}
    >
      <Paperclip size={16} color={palette.foreground} />
    </Pressable>
  );
}

/** `.grade-pill` — AI tekshiruvi holati; `checking` bo'lsa so'rov qaytariladi. */
function SubmissionStatus({ initial, onOpen }: { initial: Submission; onOpen: (submission: Submission) => void }) {
  const { t } = useTranslation("student");
  const { palette } = useTheme();
  const submission = useSubmission(initial.id, { poll: initial.status === "checking" });
  const data = submission.data ?? initial;
  const tone =
    data.status === "done"
      ? { bg: palette["success-soft"], fg: palette["tone-emerald-fg"] }
      : data.status === "error"
        ? { bg: palette["destructive-soft"], fg: palette["destructive-strong"] }
        : { bg: palette["warning-soft"], fg: palette["warning-strong"] };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("groupWorkspace.assignments.openResultAria")}
      onPress={() => onOpen(data)}
      style={[styles.grade, { backgroundColor: tone.bg }]}
    >
      {data.status === "done" ? <CheckCircle2 size={15} color={tone.fg} /> : null}
      <Text variant="caption" style={[styles.heavy, { color: tone.fg }]}>
        {data.status === "done"
          ? `${data.overallScore} ${t("groupWorkspace.assignments.scoreSuffix")}`
          : data.status === "error"
            ? t("groupWorkspace.assignments.checkError")
            : t("groupWorkspace.assignments.checking")}
      </Text>
    </Pressable>
  );
}

/** Topshirish oynasi — vebdagi `Dialog`: vazifa matni, fayl, "Doskada yechish", fayl tanlash. */
function SubmitSheet({ assignment, onClose }: { assignment: Assignment | null; onClose: () => void }) {
  const { t } = useTranslation("student");
  const { palette } = useTheme();
  const router = useRouter();
  const submit = useSubmitHomework();
  const download = useDownloadAssignmentFile();
  const [file, setFile] = useState<PickedFile | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function close() {
    setFile(null);
    setSubmitError(null);
    onClose();
  }

  async function choose() {
    const picked = await pickDocument();
    if (picked) setFile(picked);
  }

  function send() {
    if (!assignment || !file) return;
    if (isAssignmentOverdue(assignment)) {
      toast.error(t("groupWorkspace.assignments.deadlinePassed"));
      close();
      return;
    }
    setSubmitError(null);
    submit
      .mutateAsync({ assignmentId: assignment.id, file: toUploadFile(file), skillKey: assignment.skillKey })
      .then(close)
      .catch((error: unknown) => setSubmitError(homeworkFieldError(error, "file")));
  }

  const overdue = assignment ? isAssignmentOverdue(assignment) : false;

  return (
    <Sheet
      open={Boolean(assignment)}
      onClose={close}
      title={assignment?.title ?? ""}
      description={t("groupWorkspace.assignments.submitDialogDescription")}
    >
      {assignment ? (
        <View style={styles.dialog}>
          {assignment.description ? <Text variant="body">{assignment.description}</Text> : null}
          {assignment.body ? <HtmlView html={sanitizeHtml(assignment.body)} /> : null}
          {assignment.hasAttachment ? (
            <Pressable
              accessibilityRole="button"
              disabled={download.isPending}
              onPress={() => download.mutate({ id: assignment.id, fileName: assignment.attachmentName || assignment.title })}
              style={[styles.secondary, { borderColor: palette.border, backgroundColor: palette.surface }]}
            >
              <Paperclip size={16} color={palette.foreground} />
              <Text variant="label" numberOfLines={1} style={styles.shrink}>
                {assignment.attachmentName || t("groupWorkspace.assignments.downloadFallback")}
              </Text>
            </Pressable>
          ) : null}

          <View style={styles.boardRow}>
            <Pressable
              accessibilityRole="button"
              disabled={overdue}
              onPress={() => {
                close();
                router.push(`/student/homework-board/${assignment.id}` as never);
              }}
              style={[styles.secondary, { borderColor: palette.border, backgroundColor: palette.surface }, overdue && styles.dim]}
            >
              <PenLine size={16} color={palette.foreground} />
              <Text variant="label">{t("groupWorkspace.assignments.solveOnBoard")}</Text>
            </Pressable>
            <Text variant="caption" style={{ color: palette["muted-foreground"] }}>
              {t("groupWorkspace.assignments.solveOnBoardHint")}
            </Text>
          </View>

          <View style={styles.uploadRow}>
            <Pressable
              accessibilityRole="button"
              onPress={() => void choose()}
              style={[styles.upload, { borderColor: palette["border-accent"], backgroundColor: palette["primary-soft"] }]}
            >
              <FileUp size={16} color={palette["primary-text"]} />
              <Text variant="label" style={{ color: palette["primary-text"] }}>
                {t("groupWorkspace.assignments.chooseFile")}
              </Text>
            </Pressable>
            {file ? (
              <View style={styles.fileName}>
                <Paperclip size={14} color={palette["muted-foreground"]} />
                <Text variant="caption" numberOfLines={1} style={[styles.shrink, { color: palette["muted-foreground"] }]}>
                  {file.name}
                </Text>
              </View>
            ) : null}
          </View>

          {submitError ? (
            <Text variant="label" style={[styles.alert, { color: palette["destructive-strong"], backgroundColor: palette["destructive-soft"] }]}>
              {submitError}
            </Text>
          ) : null}
        </View>
      ) : null}
      <SheetFooter>
        <SheetButton
          variant="primary"
          title={t("groupWorkspace.assignments.send")}
          loading={submit.isPending}
          disabled={!file || overdue}
          onPress={send}
        />
      </SheetFooter>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  page: { gap: 16, padding: 16 },
  regular: { fontWeight: "400" },
  heavy: { fontWeight: "800" },
  shrink: { flexShrink: 1 },
  dim: { opacity: 0.5 },
  loading: { height: 120, borderRadius: 13 },
  list: { gap: 9 },
  row: { gap: 12, padding: 14, borderWidth: 1, borderRadius: 13 },
  rowTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  rowIcon: { width: 41, height: 41, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  rowText: { flex: 1, minWidth: 0, gap: 4 },
  rowTitle: { fontSize: 15, lineHeight: 21 },
  rowAction: { flexDirection: "row", marginLeft: 53 },
  iconButton: { width: 38, height: 38, borderWidth: 1, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  small: { height: 38, justifyContent: "center", paddingHorizontal: 14, borderRadius: 10 },
  missed: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderRadius: radius.full },
  grade: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: radius.full },
  dialog: { gap: 14 },
  secondary: { alignSelf: "flex-start", maxWidth: "100%", height: 44, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, borderWidth: 1, borderRadius: 13 },
  boardRow: { gap: 6 },
  uploadRow: { gap: 8 },
  upload: { alignSelf: "flex-start", height: 44, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, borderWidth: 1, borderStyle: "dashed", borderRadius: 13 },
  fileName: { flexDirection: "row", alignItems: "center", gap: 6 },
  alert: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10, overflow: "hidden", fontWeight: "400" },
});
