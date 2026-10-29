import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useConversations } from "@/modules/conversation";
import {
  homeworkFieldError,
  homeworkKeys,
  useAssignment,
  useDownloadAssignmentFile,
  useDownloadSubmissionFile,
  useHomeworkDraft,
  useSaveHomeworkDraft,
  useSubmission,
  useSubmitHomework,
} from "@/modules/homework";
import { ROUTES } from "@/shared/config";
import { pickDocuments, sanitizeHtml, toUploadFile, type PickedFile } from "@/shared/lib";
import type { Assignment, Submission } from "@/shared/types";
import { bodyFont, dsAlpha, DsGradient, DsText, dsRadius, dsType, headingFont, HtmlView, Icon, MobileActionBar, MobileEmptyCard, MobilePageHeader, toast, useDs } from "@/shared/ui";
import { SubmissionPreview } from "@/pages/workspace/homework/submission-preview";
import { shortDateTime } from "../lib/format";

const DAY_MS = 86_400_000;
const GRADES = [1, 2, 3, 4, 5];
/** Veb `accept=".pdf,.png,.jpg,.jpeg,.webp,.docx"` va gapirish uchun `.mp3,.wav,.m4a,.ogg`. */
const ACCEPT = ["application/pdf", "image/png", "image/jpeg", "image/webp", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
const ACCEPT_SPEAKING = ["audio/mpeg", "audio/wav", "audio/x-wav", "audio/mp4", "audio/x-m4a", "audio/ogg"];

const MAX_FILES = 5;

function fileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}

/**
 * O'quvchining vazifasi — veb `student-homework-item-page.tsx` (tor ekran):
 * topshirilmagan bo'lsa topshirish formasi, topshirilgan bo'lsa natija
 * (AI bahosi, o'qituvchi bahosi, izoh). Qayta topshirish so'ralganda forma
 * qaytadan ochiladi.
 */
export function StudentHomeworkItemPage() {
  const { t } = useTranslation("student");
  const ds = useDs();
  const insets = useSafeAreaInsets();
  const { assignmentId = "" } = useLocalSearchParams<{ assignmentId: string }>();
  const assignment = useAssignment(assignmentId || null);
  const [resubmitting, setResubmitting] = useState(false);

  if (assignment.isError)
    return (
      <View style={[styles.state, { backgroundColor: ds.c.canvas }]}>
        <MobileEmptyCard icon="assign" title={t("workspace.hwItem.notFound")} action={{ label: t("workspace.hwItem.retry"), onPress: () => void assignment.refetch() }} />
      </View>
    );
  if (!assignment.data)
    return (
      <View style={[styles.loading, { backgroundColor: ds.c.canvas, paddingTop: insets.top + 28 }]}>
        <View style={[styles.loadingLine, { backgroundColor: ds.c.skeleton }]} />
        <View style={[styles.loadingCard, { height: 256, backgroundColor: ds.c.surface }]} />
        <View style={[styles.loadingCard, { height: 400, backgroundColor: ds.c.surface }]} />
      </View>
    );

  const mine = assignment.data.mySubmission;
  if (mine && !resubmitting)
    return <HomeworkResult assignment={assignment.data} initial={mine} onResubmit={mine.status === "resubmit_requested" ? () => setResubmitting(true) : undefined} />;
  return <HomeworkSubmit assignment={assignment.data} />;
}

function useCourseRoom(courseId: string) {
  const conversations = useConversations("student");
  return conversations.data?.find((item) => item.courseId === courseId)?.id ?? null;
}

function HomeworkSubmit({ assignment }: { assignment: Assignment }) {
  const { t } = useTranslation("student");
  const { t: th } = useTranslation("homework");
  const months = useTranslation("lesson").t("list.months", { returnObjects: true }) as string[];
  const ds = useDs();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const submit = useSubmitHomework();
  const downloadTask = useDownloadAssignmentFile();
  // Veb #162: qoralama serverda (avval qurilma xotirasida edi), 5 tagacha fayl.
  const draft = useHomeworkDraft(assignment.id);
  const saveDraftMutation = useSaveHomeworkDraft(assignment.id);
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [comment, setComment] = useState("");
  const touched = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const [now] = useState(() => Date.now());

  const speaking = assignment.skillKey === "speaking";
  const left = assignment.dueAt ? Math.ceil((new Date(assignment.dueAt).getTime() - now) / DAY_MS) : null;
  const overdue = assignment.dueAt ? new Date(assignment.dueAt).getTime() < now : false;
  const locked = overdue && !assignment.allowLate;
  const leftLabel = left === null ? "" : overdue ? t("workspace.hwItem.overdue") : left <= 0 ? t("workspace.hwItem.today") : t("workspace.hwItem.daysLeft", { count: left });
  const html = assignment.body ? sanitizeHtml(assignment.body) : "";
  const serverDraft = draft.data?.comment ?? "";

  useEffect(() => {
    if (serverDraft && !touched.current) setComment(serverDraft);
  }, [serverDraft]);

  async function pick() {
    const incoming = await pickDocuments(speaking ? ACCEPT_SPEAKING : ACCEPT);
    if (!incoming.length) return;
    setError(null);
    setFiles((current) => {
      const next = [...current, ...incoming];
      if (next.length > MAX_FILES) toast.error(t("workspace.hwItem.tooManyFiles", { count: MAX_FILES }));
      return next.slice(0, MAX_FILES);
    });
  }

  function send() {
    setError(null);
    submit
      .mutateAsync({ assignmentId: assignment.id, files: files.map(toUploadFile), skillKey: assignment.skillKey, comment })
      .then(() => {
        if (serverDraft) saveDraftMutation.mutate("", { onSuccess: () => rememberDraft("") });
      })
      .catch((reason: unknown) => setError(homeworkFieldError(reason, "file")));
  }

  // 🟡 Vebdan farqi: qoralama so'rovi `staleTime: Infinity` — saqlangach kesh yangilanadi, aks holda shu seansda qayta kirilganda eski qiymat chiqardi.
  function rememberDraft(value: string) {
    queryClient.setQueryData(homeworkKeys.draft(assignment.id), { comment: value, updatedAt: new Date().toISOString() });
  }

  function saveDraft() {
    saveDraftMutation.mutate(comment, {
      onSuccess: () => {
        rememberDraft(comment.trim() ? comment : "");
        toast.success(t("workspace.hwItem.draftSaved"));
      },
      onError: (reason: Error) => toast.error(reason.message),
    });
  }

  const goBack = () => (router.canGoBack() ? router.back() : router.replace(ROUTES.student.homework as never));
  const openBoard = () => router.push(ROUTES.student.homeworkBoard(assignment.id) as never);

  return (
    <View style={[styles.fill, { backgroundColor: ds.c.canvas }]}>
      <ScrollView style={styles.fill} contentContainerStyle={[styles.page, { paddingTop: insets.top + 20 }]} keyboardShouldPersistTaps="handled">
        <DsGradient name="auth" />
        <MobilePageHeader title={assignment.title} backLabel={t("workspace.back")} onBack={goBack} />

        <View style={[styles.task, { backgroundColor: ds.c.surface }]}>
          <View style={styles.chips}>
            {leftLabel ? (
              <View style={[styles.chip, { backgroundColor: overdue ? ds.c["danger-bg"] : ds.c["warning-bg"] }]}>
                <Icon name="timer" size={14} color={overdue ? ds.c["error-text"] : ds.c["warning-fg"]} />
                <DsText v="caption-strong" c={overdue ? "error-text" : "warning-fg"}>
                  {leftLabel}
                </DsText>
              </View>
            ) : null}
            {assignment.aiCheck ? (
              <View style={[styles.chip, { backgroundColor: ds.c["accent-violet-bg"] }]}>
                <DsText v="caption-strong" c="accent-violet-fg">
                  {t("workspace.hwItem.aiCheck")}
                </DsText>
              </View>
            ) : null}
          </View>
          {assignment.description ? <DsText style={styles.description}>{assignment.description}</DsText> : null}
          {html ? <HtmlView html={html} minHeight={20} /> : null}
          {assignment.hasAttachment ? (
            <Pressable
              accessibilityRole="button"
              disabled={downloadTask.isPending}
              onPress={() => downloadTask.mutate({ id: assignment.id, fileName: assignment.attachmentName })}
              style={({ pressed }) => [styles.attachment, { backgroundColor: pressed ? ds.c.muted : ds.c.subtle }]}
            >
              <View style={[styles.fileIcon, { backgroundColor: ds.c.surface }]}>
                <Icon name="description-fill" size={20} color={ds.c["error-text"]} />
              </View>
              <View style={styles.grow}>
                <DsText v="body-sm" w="600" numberOfLines={1}>
                  {assignment.attachmentName || th("detailDialog.defaultFile")}
                </DsText>
                {assignment.attachmentSize ? (
                  <DsText v="caption" c="ink-secondary">
                    {fileSize(assignment.attachmentSize)}
                  </DsText>
                ) : null}
              </View>
              <Icon name="download" size={20} color={ds.c["icon-secondary"]} />
            </Pressable>
          ) : null}
          <View style={styles.facts}>
            <Fact label={th("detail.grading")} value={th(`form.gradings.${assignment.grading}`)} />
            <Fact label={th("detail.allowLate")} value={assignment.allowLate ? th("detail.allowed") : th("detail.notAllowed")} />
            {assignment.lessonTitle ? <Fact label={th("detail.lesson")} value={assignment.lessonTitle} /> : null}
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={locked}
          onPress={openBoard}
          style={({ pressed }) => [styles.board, { borderColor: ds.c["line-strong"], backgroundColor: pressed ? ds.c.subtle : ds.c.surface }, locked && styles.faded]}
        >
          <Icon name="edit" size={18} color={ds.c.ink} />
          <DsText v="body-sm" w="600">
            {t("workspace.hwItem.board")}
          </DsText>
        </Pressable>

        <View style={[styles.form, { backgroundColor: ds.c.surface }]}>
          <DsText v="title-lg" w="600">
            {t("workspace.hwItem.answer")}
          </DsText>
          <DsText v="body-xs" c="ink-secondary" style={styles.mt4}>
            {t("workspace.hwItem.answerHint")}
          </DsText>
          <Pressable
            accessibilityRole="button"
            disabled={locked || files.length >= MAX_FILES}
            onPress={() => void pick()}
            style={({ pressed }) => [
              styles.drop,
              { borderColor: dsAlpha(ds.c.brand, 0.7), backgroundColor: pressed ? ds.c["brand-subtle"] : dsAlpha(ds.c["brand-subtle"], 0.4) },
              (locked || files.length >= MAX_FILES) && styles.faded,
            ]}
          >
            <View style={[styles.dropIcon, { backgroundColor: ds.c.surface }]}>
              <Icon name="attach-file" size={24} color={ds.c.brand} />
            </View>
            <DsText v="title" w="600" style={[styles.mt8, styles.center]}>
              {t("workspace.hwItem.drop")}
            </DsText>
            <DsText v="caption" w="400" c="ink-secondary" style={styles.center}>
              {speaking ? t("workspace.hwItem.dropSpeaking") : t("workspace.hwItem.dropHint")}
            </DsText>
          </Pressable>

          {files.length ? (
            <View style={[styles.fileList, styles.mt16]}>
              {files.map((item, index) => (
                <View key={`${item.name}-${index}`} style={[styles.attachment, { backgroundColor: ds.c.subtle }]}>
                  <View style={[styles.fileIcon, { backgroundColor: ds.c.surface }]}>
                    <Icon name="description-fill" size={20} color={ds.c["error-text"]} />
                  </View>
                  <View style={styles.grow}>
                    <DsText v="body-sm" w="600" numberOfLines={1}>
                      {item.name}
                    </DsText>
                    <DsText v="caption" w="400" c="ink-secondary">
                      {t("workspace.hwItem.fileReady", { size: fileSize(item.size) })}
                    </DsText>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t("workspace.hwItem.remove")}
                    onPress={() => setFiles((current) => current.filter((_, position) => position !== index))}
                    style={styles.remove}
                  >
                    <Icon name="close" size={18} color={ds.c["icon-secondary"]} />
                  </Pressable>
                </View>
              ))}
              <DsText v="caption" c="ink-tertiary">
                {t("workspace.hwItem.filesCount", { count: files.length, max: MAX_FILES })}
              </DsText>
            </View>
          ) : null}
          {error ? (
            <DsText v="body-xs" c="error-text" style={styles.mt8}>
              {error}
            </DsText>
          ) : null}

          <View style={styles.commentField}>
            <DsText v="body-sm" w="500">
              {t("workspace.hwItem.comment")}
            </DsText>
            <TextInput
              multiline
              scrollEnabled={false}
              value={comment}
              maxLength={2000}
              placeholder={t("workspace.hwItem.commentPlaceholder")}
              placeholderTextColor={ds.c["ink-tertiary"]}
              textAlignVertical="top"
              onChangeText={(value) => {
                touched.current = true;
                setComment(value);
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              style={[styles.comment, { borderColor: focused ? ds.c.focus : ds.c["line-strong"], backgroundColor: ds.c.surface, color: ds.c.ink }]}
            />
          </View>

          <View style={[styles.notice, { backgroundColor: locked ? ds.c["danger-bg"] : ds.c["accent-teal-bg"] }]}>
            <Icon name="schedule" size={20} color={locked ? ds.c["error-text"] : ds.c["accent-teal-fg"]} />
            <DsText v="body-xs" c={locked ? "error-text" : "accent-teal-fg"} style={styles.grow}>
              {assignment.dueAt
                ? `${t("workspace.hwItem.dueNotice", { date: shortDateTime(assignment.dueAt, months), left: leftLabel })} ${assignment.allowLate ? t("workspace.hwItem.lateAllowed") : t("workspace.hwItem.lateDenied")}`
                : t("workspace.hwItem.noDue")}
            </DsText>
          </View>
        </View>
      </ScrollView>

      <MobileActionBar>
        <Pressable
          accessibilityRole="button"
          disabled={saveDraftMutation.isPending}
          onPress={saveDraft}
          style={({ pressed }) => [
            styles.footerButton,
            { borderWidth: 1, borderColor: ds.c["line-strong"], backgroundColor: pressed ? ds.c.subtle : ds.c.surface },
            saveDraftMutation.isPending && styles.faded,
          ]}
        >
          <DsText v="body-sm" w="600" numberOfLines={1}>
            {t("workspace.hwItem.draft")}
          </DsText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={!files.length || locked || submit.isPending}
          onPress={send}
          style={({ pressed }) => [styles.footerButton, { backgroundColor: pressed ? ds.c["brand-strong"] : ds.c.brand }, (!files.length || locked || submit.isPending) && styles.faded]}
        >
          <Icon name="send" size={18} color={ds.c["on-action"]} />
          <DsText v="body-sm" w="600" c="on-action" numberOfLines={1}>
            {t("workspace.hwItem.submit")}
          </DsText>
        </Pressable>
      </MobileActionBar>
    </View>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <DsText v="body-sm" c="ink-secondary" style={styles.factLabel}>
        {label}
      </DsText>
      <DsText v="body-sm" w="600" numberOfLines={1} style={styles.shrink}>
        {value}
      </DsText>
    </View>
  );
}

function HomeworkResult({ assignment, initial, onResubmit }: { assignment: Assignment; initial: Submission; onResubmit?: () => void }) {
  const { t } = useTranslation("student");
  const months = useTranslation("lesson").t("list.months", { returnObjects: true }) as string[];
  const ds = useDs();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const submission = useSubmission(initial.id);
  const download = useDownloadSubmissionFile();
  const room = useCourseRoom(assignment.courseId);
  const current = submission.data ?? initial;

  const checking = current.status === "checking";
  const failed = current.status === "error";
  const aiScore = current.overallScore;
  const aiGrade = aiScore === null ? null : Math.max(1, Math.min(5, Math.round(aiScore / 20)));
  const teacherGrade = current.status === "done" ? current.gradeValue : null;
  const findings = (current.result?.questions ?? [])
    .map((question) => question.analysis ?? "")
    .filter(Boolean)
    .slice(0, 3);
  const meta = [assignment.courseTitle, shortDateTime(current.createdAt, months), current.isLate ? t("workspace.hwItem.late") : t("workspace.hwItem.onTime")].filter(Boolean).join(" · ");
  const writeTeacher = () => router.push((room ? ROUTES.student.chat(room) : ROUTES.student.chats) as never);
  const done = () => (router.canGoBack() ? router.back() : router.replace(ROUTES.student.homework as never));

  return (
    <View style={[styles.fill, { backgroundColor: ds.c.canvas }]}>
      <ScrollView style={styles.fill} contentContainerStyle={[styles.page, { paddingTop: insets.top + 20 }]}>
        <DsGradient name="auth" />
        <MobilePageHeader title={assignment.title} backLabel={t("workspace.back")} onBack={done} />
        <DsText v="caption" w="400" c="ink-secondary" style={[styles.center, styles.metaLine]}>
          {meta}
        </DsText>
        {current.fileName ? (
          <View style={[styles.preview, { backgroundColor: ds.c.surface, boxShadow: ds.shadow.sm }]}>
            <SubmissionPreview id={current.id} fileName={current.fileName} />
          </View>
        ) : null}

        <View style={styles.panel}>
          {!assignment.aiCheck ? null : checking ? (
            <View style={[styles.box, { backgroundColor: ds.c["brand-subtle"] }]}>
              <View style={styles.boxHead}>
                <View style={[styles.aiIcon, { backgroundColor: ds.c["accent-violet-fg"] }]}>
                  <Icon name="auto-awesome" size={24} color={ds.c["ink-inverse"]} />
                </View>
                <View style={styles.grow}>
                  <DsText v="body-sm" w="600" c="brand" numberOfLines={1}>
                    {t("workspace.hwItem.checking")}
                  </DsText>
                  <DsText v="caption" w="400" c="ink-secondary">
                    {t("workspace.hwItem.checkingHint")}
                  </DsText>
                </View>
              </View>
              <View style={[styles.pulseTrack, { backgroundColor: ds.c.surface }]}>
                <View style={[styles.pulseFill, { backgroundColor: ds.c["accent-violet-fg"] }]} />
              </View>
            </View>
          ) : failed ? (
            <DsText v="body-sm" c="ink-secondary" style={[styles.box, { backgroundColor: dsAlpha(ds.c.subtle, 0.6) }]}>
              {t("workspace.hwItem.failed")}
            </DsText>
          ) : (
            <View style={[styles.box, { backgroundColor: dsAlpha(ds.c.subtle, 0.6) }]}>
              <View style={styles.boxHead}>
                <View style={[styles.score, { backgroundColor: ds.c.brand }]}>
                  <DsText c="ink-inverse" style={styles.scoreValue}>
                    {aiScore ?? "—"}
                  </DsText>
                  <DsText v="caption" w="400" c="ink-inverse" style={styles.scoreMax}>
                    /100
                  </DsText>
                </View>
                <View style={[styles.grow, styles.gap2]}>
                  <View style={styles.aiTitle}>
                    <Icon name="auto-awesome" size={16} color={ds.c.brand} />
                    <DsText v="body-sm" w="600">
                      {t("workspace.hwItem.aiScore", { value: aiGrade ?? "—" })}
                    </DsText>
                  </View>
                  <DsText v="caption" w="400" c="ink-secondary">
                    {teacherGrade === null ? t("workspace.hwItem.aiHint") : t("workspace.hwItem.aiHintDone")}
                  </DsText>
                </View>
              </View>
              {findings.length ? (
                <View style={styles.findings}>
                  <DsText v="body-xs" w="600">
                    {t("workspace.hwItem.findings")}
                  </DsText>
                  {findings.map((item, index) => (
                    <DsText key={index} v="caption" w="400">
                      • {item}
                    </DsText>
                  ))}
                </View>
              ) : null}
            </View>
          )}

          <View style={styles.gradeBlock}>
            <DsText v="overline" c="ink-secondary" style={styles.upper}>
              {t("workspace.hwItem.teacherGrade")}
            </DsText>
            {teacherGrade === null ? (
              <DsText v="body-sm" c="ink-secondary">
                {t("workspace.hwItem.waitingGrade")}
              </DsText>
            ) : (
              <>
                <View style={styles.grades}>
                  {GRADES.map((value) => (
                    <View key={value} style={[styles.grade, { backgroundColor: teacherGrade === value ? ds.c.brand : ds.c.subtle }]}>
                      <DsText v="title" w="600" c={teacherGrade === value ? "ink-inverse" : "ink"}>
                        {value}
                      </DsText>
                    </View>
                  ))}
                </View>
                {aiGrade !== null && aiGrade === teacherGrade ? (
                  <View style={styles.aiTitle}>
                    <Icon name="check" size={14} color={ds.c["success-fg"]} />
                    <DsText v="caption-strong" c="success-fg">
                      {t("workspace.hwItem.matchesAi")}
                    </DsText>
                  </View>
                ) : null}
              </>
            )}
          </View>

          {current.teacherComment ? (
            <View style={styles.gradeBlock}>
              <DsText v="body-sm" w="500">
                {t("workspace.hwItem.teacherComment")}
              </DsText>
              <DsText v="title" w="400" style={[styles.teacherComment, { backgroundColor: ds.c.subtle }]}>
                {current.teacherComment}
              </DsText>
            </View>
          ) : null}

          {current.resubmitComment ? (
            <View style={styles.gradeBlock}>
              <DsText v="body-sm" w="500">
                {current.status === "resubmit_requested" ? t("workspace.hwItem.resubmitAsked") : t("workspace.hwItem.teacherComment")}
              </DsText>
              <DsText v="title" w="400" style={[styles.teacherComment, { backgroundColor: ds.c.subtle }]}>
                {current.resubmitComment}
              </DsText>
            </View>
          ) : null}

          {current.comment ? (
            <View style={styles.gradeBlock}>
              <DsText v="body-sm" w="500">
                {t("workspace.hwItem.myComment")}
              </DsText>
              <DsText v="body-sm" style={[styles.myComment, { borderColor: ds.c.line }]}>
                {current.comment}
              </DsText>
            </View>
          ) : null}

          {current.files.length > 1 ? (
            <View style={styles.gradeBlock}>
              <DsText v="body-sm" w="500">
                {t("workspace.hwItem.filesTitle", { count: current.files.length })}
              </DsText>
              {current.files.map((item) => (
                <Pressable
                  key={item.index}
                  accessibilityRole="button"
                  disabled={download.isPending}
                  onPress={() => download.mutate({ id: current.id, fileName: item.name, index: item.index })}
                  style={({ pressed }) => [styles.resultFile, { backgroundColor: pressed ? ds.c.tint : ds.c.subtle }, download.isPending && styles.dim]}
                >
                  <Icon name="description-fill" size={18} color={ds.c["error-text"]} />
                  <View style={styles.grow}>
                    <DsText v="body-sm" w="600" numberOfLines={1}>
                      {item.name}
                    </DsText>
                    {item.size ? (
                      <DsText v="caption" c="ink-secondary">
                        {fileSize(item.size)}
                      </DsText>
                    ) : null}
                  </View>
                  <Icon name="download" size={18} color={ds.c["icon-secondary"]} />
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>

      <MobileActionBar>
        <Pressable
          accessibilityRole="button"
          onPress={writeTeacher}
          style={({ pressed }) => [styles.footerButton, { borderWidth: 1, borderColor: ds.c["line-strong"], backgroundColor: pressed ? ds.c.subtle : ds.c.surface }]}
        >
          <DsText w="500" numberOfLines={1} style={styles.footerLabel}>
            {t("workspace.hwItem.writeTeacher")}
          </DsText>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onResubmit ?? done} style={({ pressed }) => [styles.footerButton, { backgroundColor: pressed ? ds.c["brand-strong"] : ds.c.brand }]}>
          <DsText w="500" c="ink-inverse" numberOfLines={1} style={styles.footerLabel}>
            {onResubmit ? t("workspace.hwItem.resubmit") : t("workspace.hwItem.ok")}
          </DsText>
        </Pressable>
      </MobileActionBar>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  shrink: { flexShrink: 1, minWidth: 0, textAlign: "right" },
  center: { textAlign: "center" },
  upper: { textTransform: "uppercase" },
  faded: { opacity: 0.5 },
  dim: { opacity: 0.6 },
  fileList: { gap: 8 },
  myComment: { paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderRadius: dsRadius["2xl"] },
  resultFile: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 12, paddingVertical: 8, borderRadius: dsRadius.xl },
  gap2: { gap: 2 },
  mt4: { marginTop: 4 },
  mt8: { marginTop: 8 },
  mt16: { marginTop: 16 },
  state: { flex: 1, justifyContent: "center", padding: 24 },
  loading: { flex: 1, gap: 20, paddingHorizontal: 16 },
  loadingLine: { width: 320, maxWidth: "100%", height: 36, borderRadius: 18 },
  loadingCard: { borderRadius: dsRadius["2xl"] },
  /* `gap-5 px-4 pt-5 pb-6` */
  page: { gap: 20, paddingHorizontal: 16, paddingBottom: 24 },
  /* `gap-4 rounded-2xl p-5` */
  task: { gap: 16, padding: 20, borderRadius: dsRadius["2xl"] },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { height: 22, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, borderRadius: 11 },
  /* `text-[15px]/5 whitespace-pre-line` */
  description: { fontSize: 15, lineHeight: 20 },
  attachment: { minHeight: 56, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 12, paddingVertical: 10, borderRadius: dsRadius.xl },
  fileIcon: { width: 36, height: 36, borderRadius: dsRadius.lg, alignItems: "center", justifyContent: "center" },
  remove: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  facts: { gap: 12 },
  fact: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  factLabel: { flexShrink: 0 },
  board: { height: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderRadius: 22 },
  /* `rounded-2xl p-5` */
  form: { padding: 20, borderRadius: dsRadius["2xl"] },
  /* `mt-6 min-h-[158px] rounded-xl border-2 border-dashed px-4 py-5 gap-2` */
  drop: { marginTop: 24, minHeight: 158, alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 20, borderWidth: 2, borderStyle: "dashed", borderRadius: dsRadius.xl },
  dropIcon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  commentField: { marginTop: 16, gap: 8 },
  /* `min-h-28 rounded-xl border px-4 py-3 text-body-sm` */
  comment: { minHeight: 112, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, borderWidth: 1, borderRadius: dsRadius.xl, fontFamily: bodyFont("400"), fontSize: dsType["body-sm"].fontSize, lineHeight: 20 },
  notice: { marginTop: 16, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderRadius: dsRadius.xl },
  /* `h-13 flex-1 rounded-full px-3 text-body-sm font-semibold` */
  footerButton: { flex: 1, minWidth: 0, height: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 12, borderRadius: 26 },
  footerLabel: { fontSize: 15 },
  metaLine: { marginTop: -8 },
  preview: { minHeight: 320, width: "100%", maxWidth: 470, alignSelf: "center", overflow: "hidden", borderRadius: dsRadius.xl, alignItems: "center", justifyContent: "center" },
  panel: { gap: 16 },
  box: { gap: 12, padding: 16, borderRadius: dsRadius["2xl"], overflow: "hidden" },
  boxHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  aiIcon: { width: 56, height: 56, borderRadius: dsRadius["2xl"], alignItems: "center", justifyContent: "center" },
  pulseTrack: { height: 6, overflow: "hidden", borderRadius: 3 },
  pulseFill: { width: "50%", height: "100%", borderRadius: 3 },
  score: { width: 64, height: 64, borderRadius: dsRadius["2xl"], alignItems: "center", justifyContent: "center" },
  scoreValue: { fontFamily: headingFont("600"), fontSize: 24, lineHeight: 28 },
  scoreMax: { opacity: 0.8 },
  aiTitle: { flexDirection: "row", alignItems: "center", gap: 6 },
  findings: { gap: 4 },
  gradeBlock: { gap: 8 },
  grades: { flexDirection: "row", gap: 8 },
  grade: { flex: 1, height: 44, borderRadius: dsRadius.xl, alignItems: "center", justifyContent: "center" },
  teacherComment: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: dsRadius["2xl"], overflow: "hidden" },
});
