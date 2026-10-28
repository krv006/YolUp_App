import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useCourse } from "@/modules/course";
import { useAssignments, useDeleteAssignment } from "@/modules/homework";
import { AssignmentDetailSheet } from "@/modules/homework/ui/assignment-detail-sheet";
import { useLessons } from "@/modules/lesson";
import {
  AddQuizDialog,
  AssignQuizDialog,
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
import type { Assignment, QuizImportWarning, QuizSummary } from "@/shared/types";
import { ConfirmDialog, DsText, dsRadius, Icon, MobileEmptyCard, useDs } from "@/shared/ui";
import { AddAssignmentSheet } from "./add-assignment-sheet";
import { PanelHeading } from "./panel-heading";
import { AddQuizMenu, MobileAssignmentList } from "./task-cards";

/**
 * O'qituvchining guruh vazifalari — veb `group-workspace.tsx` dagi
 * `AssignmentsPanel` ning tor ekran varianti: "Vazifa berish" va "Test
 * qo'shish" menyusi, vazifa va test kartalari (`MobileAssignmentList`),
 * bo'sh holat. Test oynalari va yangi vazifa formasi hozircha mobilning
 * mavjud oynalari (4b va 5-bosqichda yangilanadi).
 */
export function TeacherAssignments({
  courseId,
  groupImage = null,
  highlightId = null,
}: {
  courseId: string;
  groupImage?: string | null;
  /** Bildirishnomadan ochilganda ajratiladigan vazifa. */
  highlightId?: string | null;
}) {
  const { t } = useTranslation("group");
  const { t: quizT } = useTranslation("quiz");
  const ds = useDs();
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

  const hasItems = items.length > 0 || courseQuizList.length > 0;
  const loading = assignments.isLoading;

  return (
    <ScrollView style={styles.fill} contentContainerStyle={styles.page}>
      <View style={styles.top}>
        <PanelHeading eyebrow={t("assignments.eyebrow")} title={t("assignments.title")} subtitle={t("assignments.subtitleShort")} style={styles.heading} />
        {hasItems || loading ? (
          <View style={styles.buttons}>
            {/* Ichki chet flex asosiga qo'shiladi (Yoga) — teng ustun uchun tugma o'ramda. */}
            <View style={styles.half}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setDialog(true)}
                style={({ pressed }) => [styles.primary, { backgroundColor: pressed ? ds.c["brand-strong"] : ds.c.brand }]}
              >
                <Icon name="add" size={16} color={ds.c["on-action"]} />
                <DsText v="button" c="on-action" numberOfLines={1}>
                  {t("assignments.addAssignment")}
                </DsText>
              </Pressable>
            </View>
            <AddQuizMenu onFromBank={() => setBankDialog(true)} onCreate={() => setQuizDialog(true)} />
          </View>
        ) : null}
      </View>

      {loading && !hasItems ? (
        <View style={styles.skeletons}>
          {Array.from({ length: 4 }, (_, index) => (
            <View key={index} style={[styles.skeletonCard, { backgroundColor: ds.c.surface }]}>
              <View style={styles.skeletonHead}>
                <View style={[styles.skeletonIcon, { backgroundColor: ds.c.skeleton }]} />
                <View style={styles.skeletonLines}>
                  <View style={[styles.skeletonLine, { width: 160, height: 14, backgroundColor: ds.c.skeleton }]} />
                  <View style={[styles.skeletonLine, { width: 112, backgroundColor: ds.c.skeleton }]} />
                </View>
              </View>
              <View style={[styles.skeletonLine, { width: 96, height: 24, backgroundColor: ds.c.skeleton }]} />
              <View style={[styles.skeletonLine, { height: 6, backgroundColor: ds.c.skeleton }]} />
            </View>
          ))}
        </View>
      ) : hasItems ? (
        <MobileAssignmentList
          assignments={items}
          quizzes={courseQuizList}
          courseTitle={course.data?.title ?? ""}
          courseImage={course.data?.avatarUrl ?? groupImage}
          courseTone={course.data?.color}
          highlightId={highlightId}
          onOpenAssignment={(item) => setDetailId(item.id)}
          onEditAssignment={(item) => {
            setEditingAssignment(item);
            setDialog(true);
          }}
          onDeleteAssignment={setDeleteTarget}
          onOpenQuiz={setAttemptsOf}
          onEditQuiz={setEditQuizTarget}
        />
      ) : (
        <MobileEmptyCard
          icon="assign"
          title={t("assignments.emptyTitle")}
          description={t("assignments.emptyHint")}
          action={{ label: t("assignments.emptyCreateFirst"), icon: "add", onPress: () => setDialog(true) }}
        />
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

      <AssignQuizDialog
        open={bankDialog}
        onOpenChange={setBankDialog}
        quizzes={bankOptions}
        courseId={courseId}
        pending={assignQuiz.isPending}
        onSubmit={(value) => void assignQuiz.mutateAsync(value).then(() => setBankDialog(false))}
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

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        icon="trash"
        title={t("assignments.deleteDialogTitle")}
        description={t("assignments.deleteDialogDescription", { title: deleteTarget?.title ?? "" })}
        confirmLabel={t("assignments.delete")}
        cancelLabel={t("assignments.cancel")}
        pending={remove.isPending}
        onConfirm={() => deleteTarget && remove.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) })}
      />

      <AssignmentDetailSheet assignmentId={detailId} open={Boolean(detailId)} onClose={() => setDetailId(null)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  /* `gap-5 px-4 pt-5 pb-8` */
  page: { gap: 20, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 32 },
  top: { gap: 20 },
  heading: { flex: 0 },
  /* `grid grid-cols-2 gap-2.5` */
  buttons: { flexDirection: "row", gap: 10 },
  half: { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 },
  primary: { height: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: 16, borderRadius: 22 },
  skeletons: { gap: 12 },
  skeletonCard: { gap: 12, padding: 16, borderRadius: dsRadius.xl },
  skeletonHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  skeletonIcon: { width: 44, height: 44, borderRadius: dsRadius.md },
  skeletonLines: { gap: 8 },
  skeletonLine: { height: 12, borderRadius: 6 },
});
