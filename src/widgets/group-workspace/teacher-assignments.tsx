import { useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { BarChart3, CalendarDays, ClipboardList, FileQuestion, Library, Pencil, Plus, Trash2 } from "lucide-react-native";
import { useCourse } from "@/modules/course";
import { useAssignments, useDeleteAssignment } from "@/modules/homework";
import { AssignmentDetailSheet } from "@/modules/homework/ui/assignment-detail-sheet";
import { useLessons } from "@/modules/lesson";
import {
  AddQuizDialog,
  AssignQuizSheet,
  QuizAttemptsSheet,
  quizDisplayTitle,
  quizErrorMessage,
  useAssignQuizToCourse,
  useCreateQuiz,
  usePublishQuiz,
  useQuiz,
  useQuizAttempts,
  useQuizzes,
  useRemoveGroupAudio,
  useUpdateQuiz,
  useUploadGroupAudio,
} from "@/modules/quiz";
import { formatDayTime } from "@/shared/lib";
import type { Assignment, QuizImportWarning, QuizSummary } from "@/shared/types";
import { radius, Sheet, SheetButton, SheetFooter, Text, useTheme } from "@/shared/ui";
import { AddAssignmentSheet } from "./add-assignment-sheet";
import { PanelHeading } from "./panel-heading";

/**
 * O'qituvchining guruh vazifalari — veb `group-workspace.tsx` dagi
 * `AssignmentsPanel`: "Vazifa berish", "Tayyor testdan", "Test yaratish",
 * guruh testlari va vazifalar kartalari ("Natijalar", tahrirlash, o'chirish).
 *
 * Vebda vazifalar ro'yxati panelga uzatilmaydi (xato) va faqat testlar
 * ko'rinadi; mobilda vazifalar ham shu karta dizaynida chiqadi.
 */
export function TeacherAssignments({ courseId }: { courseId: string }) {
  const { t } = useTranslation("group");
  const { t: quizT } = useTranslation("quiz");
  const { palette } = useTheme();
  const course = useCourse(courseId);
  const assignments = useAssignments(courseId);
  const remove = useDeleteAssignment();
  const [dialog, setDialog] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Assignment | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [quizDialog, setQuizDialog] = useState(false);
  const [bankDialog, setBankDialog] = useState(false);
  const [attemptsOf, setAttemptsOf] = useState<QuizSummary | null>(null);
  const [editQuizTarget, setEditQuizTarget] = useState<QuizSummary | null>(null);
  const [importedWarnings, setImportedWarnings] = useState<QuizImportWarning[]>([]);
  const [publishError, setPublishError] = useState<string | null>(null);
  const assignQuiz = useAssignQuizToCourse();
  const createQuiz = useCreateQuiz();
  const updateQuiz = useUpdateQuiz();
  const publishQuiz = usePublishQuiz();
  const editQuizDetail = useQuiz(editQuizTarget?.id ?? null);
  const editQuizAttempts = useQuizAttempts(editQuizTarget?.id ?? null, Boolean(editQuizTarget));
  const uploadAudio = useUploadGroupAudio(editQuizTarget?.id ?? "");
  const removeAudio = useRemoveGroupAudio(editQuizTarget?.id ?? "");
  const lessons = useLessons({ course: courseId, page_size: 100 }, dialog);
  const courseQuizzes = useQuizzes(courseId, Boolean(courseId));
  const allQuizzes = useQuizzes(null, bankDialog);
  const courseSubject = course.data?.subject ?? "";

  const courseQuizList = useMemo(
    () => (courseQuizzes.data ?? []).filter((quiz) => quiz.courseId === courseId),
    [courseQuizzes.data, courseId]
  );
  // Tayyor (guruhsiz) testlar: avval shu guruh fanidagilar — AI yaratganlari ham shu yerda.
  const bankOptions = useMemo(
    () =>
      (allQuizzes.data ?? [])
        .filter((quiz) => !quiz.courseId)
        .sort((a, b) => Number(b.subject === courseSubject) - Number(a.subject === courseSubject))
        .map((quiz) => ({
          id: quiz.id,
          label: `${quizDisplayTitle(quiz)} · ${t("assignments.quizQuestions", { count: quiz.questionCount })}${
            quiz.status === "draft" ? ` · ${quizT("teacherPage.draftBadge")}` : ""
          }`,
        })),
    [allQuizzes.data, courseSubject, quizT, t]
  );
  const items = assignments.data ?? [];

  function closeQuizEditor() {
    setEditQuizTarget(null);
    setImportedWarnings([]);
    setPublishError(null);
  }

  return (
    <ScrollView style={{ backgroundColor: palette.background }} contentContainerStyle={styles.page}>
      <View style={styles.top}>
        <PanelHeading eyebrow={t("assignments.eyebrow")} title={t("assignments.title")} subtitle={t("assignments.subtitle")} />
        <View style={styles.buttons}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setDialog(true)}
            style={({ pressed }) => [styles.primary, { backgroundColor: pressed ? palette["primary-hover"] : palette.primary }]}
          >
            <Plus size={17} color={palette["primary-foreground"]} />
            <Text variant="label" style={{ color: palette["primary-foreground"] }}>
              {t("assignments.addAssignment")}
            </Text>
          </Pressable>
          <View style={styles.pair}>
            <OutlineButton icon={<Library size={17} color={palette.foreground} />} label={t("assignments.fromBank")} onPress={() => setBankDialog(true)} />
            <OutlineButton icon={<Pencil size={17} color={palette.foreground} />} label={t("assignments.addQuiz")} onPress={() => setQuizDialog(true)} />
          </View>
        </View>
      </View>

      {courseQuizList.map((quiz) => (
        <Card
          key={quiz.id}
          icon={<FileQuestion size={20} color={palette["primary-foreground"]} />}
          title={quizDisplayTitle(quiz)}
          badge={{
            label: quiz.status === "draft" ? quizT("teacherPage.draftBadge") : t("assignments.quizBadge"),
            bg: quiz.status === "draft" ? palette["saffron-soft"] : palette["success-soft"],
            fg: quiz.status === "draft" ? palette["saffron-strong"] : palette["success-strong"],
          }}
          meta={`${quiz.dueAt ? t("assignments.dueLabel", { date: formatDayTime(quiz.dueAt) }) : t("assignments.noDue")} · ${t("assignments.quizQuestions", { count: quiz.questionCount })}`}
          onResults={() => setAttemptsOf(quiz)}
          onEdit={() => setEditQuizTarget(quiz)}
          editLabel={quizT("editDialog.editAria")}
        />
      ))}

      {assignments.isLoading && !items.length ? (
        <View style={styles.skeletons}>
          {Array.from({ length: 3 }, (_, index) => (
            <View key={index} style={[styles.skeleton, { backgroundColor: palette.muted }]} />
          ))}
        </View>
      ) : items.length ? (
        items.map((item) => (
          <Card
            key={item.id}
            icon={<ClipboardList size={20} color={palette["primary-foreground"]} />}
            title={item.title}
            badge={item.subject ? { label: item.subject, bg: palette["surface-subtle"], fg: palette["muted-foreground"] } : undefined}
            description={item.description}
            meta={`${item.dueAt ? t("assignments.dueLabel", { date: formatDayTime(item.dueAt) }) : t("assignments.noDue")} · ${t("assignments.submissionsCount", { count: item.submissionsCount ?? 0 })}`}
            lessonTitle={item.lessonTitle}
            onResults={() => setDetailId(item.id)}
            onEdit={() => {
              setEditingAssignment(item);
              setDialog(true);
            }}
            editLabel={t("assignments.editAria")}
            onDelete={() => setDeleteTarget(item)}
            deleteLabel={t("assignments.deleteAria")}
          />
        ))
      ) : courseQuizList.length ? null : (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: palette["primary-soft"] }]}>
            <ClipboardList size={28} color={palette.primary} />
          </View>
          <Text variant="subheading">{t("assignments.emptyTitle")}</Text>
          <Pressable accessibilityRole="button" onPress={() => setDialog(true)} style={[styles.emptyAction, { backgroundColor: palette.primary }]}>
            <Text variant="label" style={{ color: palette["primary-foreground"] }}>
              {t("assignments.emptyCreateFirst")}
            </Text>
          </Pressable>
        </View>
      )}

      <QuizAttemptsSheet
        courseId={courseId}
        quizId={attemptsOf?.id ?? null}
        open={Boolean(attemptsOf)}
        onClose={() => setAttemptsOf(null)}
        title={attemptsOf?.title}
      />

      {editQuizTarget && editQuizDetail.data && !editQuizAttempts.isLoading ? (
        <AddQuizDialog
          key={editQuizTarget.id}
          open
          onOpenChange={(next) => {
            if (!next) closeQuizEditor();
          }}
          courses={[]}
          editQuiz={editQuizDetail.data}
          initialWarnings={importedWarnings}
          uploadingAudio={uploadAudio.isPending}
          onUploadAudio={(groupId, file) => uploadAudio.mutate({ groupId, file })}
          onRemoveAudio={(groupId) => removeAudio.mutate(groupId)}
          startOnQuestions={importedWarnings.length > 0}
          questionsLocked={(editQuizAttempts.data ?? []).length > 0}
          saving={updateQuiz.isPending}
          publishing={publishQuiz.isPending}
          publishError={publishError}
          showSchedule
          onCreate={() => undefined}
          onUpdate={(values) =>
            updateQuiz
              .mutateAsync({ id: editQuizTarget.id, values })
              .then(() => closeQuizEditor())
              .catch((error: unknown) => setPublishError(quizErrorMessage(error)))
          }
          onPublish={() => {
            setPublishError(null);
            publishQuiz
              .mutateAsync(editQuizTarget.id)
              .then(() => closeQuizEditor())
              .catch((error: unknown) => setPublishError(quizErrorMessage(error)));
          }}
        />
      ) : null}

      <AssignQuizSheet
        open={bankDialog}
        onClose={() => setBankDialog(false)}
        quizzes={bankOptions}
        courseId={courseId}
        pending={assignQuiz.isPending}
        onSubmit={(value) => assignQuiz.mutateAsync(value).then(() => setBankDialog(false))}
      />

      {quizDialog ? (
        <AddQuizDialog
          open
          onOpenChange={(open) => {
            if (!open) setQuizDialog(false);
          }}
          courses={[{ id: courseId, title: course.data?.title ?? "" }]}
          showSchedule
          onImported={(result) => {
            setImportedWarnings(result.warnings);
            setPublishError(null);
            setQuizDialog(false);
            setEditQuizTarget({ ...result.quiz });
          }}
          onCreate={(values) => createQuiz.mutate(values, { onSuccess: () => setQuizDialog(false) })}
        />
      ) : null}

      <AddAssignmentSheet
        key={editingAssignment?.id ?? "new"}
        open={dialog}
        onClose={() => {
          setDialog(false);
          setEditingAssignment(null);
        }}
        courseId={courseId}
        lessons={lessons.data ?? []}
        isLanguageSubject={Boolean(course.data?.isLanguageSubject)}
        assignment={editingAssignment}
      />

      <Sheet
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={t("assignments.deleteDialogTitle")}
        description={t("assignments.deleteDialogDescription", { title: deleteTarget?.title ?? "" })}
      >
        <SheetFooter>
          <SheetButton title={t("assignments.cancel")} onPress={() => setDeleteTarget(null)} />
          <SheetButton
            variant="primary"
            title={t("assignments.delete")}
            loading={remove.isPending}
            onPress={() => {
              if (!deleteTarget) return;
              remove.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
            }}
          />
        </SheetFooter>
      </Sheet>

      <AssignmentDetailSheet assignmentId={detailId} open={Boolean(detailId)} onClose={() => setDetailId(null)} />
    </ScrollView>
  );
}

function OutlineButton({ icon, label, onPress }: { icon: ReactNode; label: string; onPress: () => void }) {
  const { palette } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.outline,
        { borderColor: palette.border, backgroundColor: pressed ? palette["surface-subtle"] : palette.surface },
      ]}
    >
      {icon}
      <Text variant="label" numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

/** `rounded-2xl border p-4 gap-3`: ikonka, sarlavha + yorliq, ma'lumot, "Natijalar" va amallar. */
function Card({
  icon,
  title,
  badge,
  description,
  meta,
  lessonTitle,
  onResults,
  onEdit,
  editLabel,
  onDelete,
  deleteLabel,
}: {
  icon: ReactNode;
  title: string;
  badge?: { label: string; bg: string; fg: string };
  description?: string | null;
  meta: string;
  lessonTitle?: string | null;
  onResults: () => void;
  onEdit: () => void;
  editLabel: string;
  onDelete?: () => void;
  deleteLabel?: string;
}) {
  const { t } = useTranslation("group");
  const { palette } = useTheme();
  return (
    <View style={[styles.card, { borderColor: palette.border, backgroundColor: palette.surface }]}>
      <View style={styles.cardHead}>
        <View style={[styles.cardIcon, { backgroundColor: palette.primary }]}>{icon}</View>
        <View style={styles.cardBody}>
          <View style={styles.titleRow}>
            <Text variant="body" style={styles.title}>
              {title}
            </Text>
            {badge ? (
              <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                <Text variant="caption" style={[styles.strong, { color: badge.fg }]}>
                  {badge.label}
                </Text>
              </View>
            ) : null}
          </View>
          {description ? (
            <Text variant="label" numberOfLines={2} style={[styles.regular, { color: palette["muted-foreground"] }]}>
              {description}
            </Text>
          ) : null}
          <Text variant="label" style={[styles.regular, { color: palette["subtle-foreground"] }]}>
            {meta}
          </Text>
          {lessonTitle ? (
            <View style={styles.lesson}>
              <CalendarDays size={13} color={palette["subtle-foreground"]} />
              <Text variant="caption" style={{ color: palette["subtle-foreground"] }}>
                {lessonTitle}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
      <View style={styles.cardActions}>
        <Pressable
          accessibilityRole="button"
          onPress={onResults}
          style={({ pressed }) => [
            styles.results,
            { borderColor: palette.border, backgroundColor: pressed ? palette["surface-subtle"] : palette.surface },
          ]}
        >
          <BarChart3 size={17} color={palette.foreground} />
          <Text variant="label">{t("assignments.results")}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={editLabel} onPress={onEdit} style={[styles.square, { backgroundColor: palette["surface-subtle"] }]}>
          <Pencil size={17} color={palette["muted-foreground"]} />
        </Pressable>
        {onDelete ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={deleteLabel}
            onPress={onDelete}
            style={[styles.square, { backgroundColor: palette["destructive-soft"] }]}
          >
            <Trash2 size={17} color={palette["destructive-strong"]} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { gap: 20, padding: 16 },
  regular: { fontWeight: "400" },
  strong: { fontWeight: "600" },
  top: { gap: 16 },
  buttons: { gap: 12 },
  /* `h-12 rounded-full bg-action` */
  primary: { height: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: radius.full },
  pair: { flexDirection: "row", gap: 12 },
  outline: { flex: 1, height: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 16, borderWidth: 1, borderRadius: radius.full },
  card: { gap: 12, padding: 16, borderWidth: 1, borderRadius: radius["2xl"] },
  cardHead: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  cardIcon: { width: 44, height: 44, borderRadius: radius.xl, alignItems: "center", justifyContent: "center" },
  cardBody: { flex: 1, minWidth: 0, gap: 4 },
  titleRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  title: { fontWeight: "600", flexShrink: 1 },
  badge: { height: 24, justifyContent: "center", paddingHorizontal: 10, borderRadius: radius.full },
  lesson: { flexDirection: "row", alignItems: "center", gap: 6 },
  cardActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  results: { flex: 1, height: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderRadius: radius.xl },
  square: { width: 44, height: 44, borderRadius: radius.xl, alignItems: "center", justifyContent: "center" },
  skeletons: { gap: 12 },
  skeleton: { height: 128, borderRadius: radius["2xl"] },
  empty: { alignItems: "center", gap: 12, paddingHorizontal: 24, paddingVertical: 56 },
  emptyIcon: { width: 64, height: 64, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  emptyAction: { marginTop: 4, height: 48, justifyContent: "center", paddingHorizontal: 20, borderRadius: radius.full },
});
