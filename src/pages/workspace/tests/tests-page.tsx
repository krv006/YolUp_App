import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCourses, useSubjects } from "@/modules/course";
import {
  AssignQuizDialog,
  QuizAttemptsDrawer,
  QuizExportDialog,
  QuizImportDialog,
  quizDisplayTitle,
  useAssignQuizToCourse,
  useCreateQuiz,
  useDeleteQuiz,
  useExportQuiz,
  usePublishQuiz,
  useQuizAttempts,
  useQuizzes,
  useUpdateQuiz,
} from "@/modules/quiz";
import { ROUTES } from "@/shared/config";
import type { QuizSummary } from "@/shared/types";
import {
  ConfirmDialog,
  DsGradient,
  DsText,
  dsRadius,
  Icon,
  MobileEmptyCard,
  MobileListSkeleton,
  MobilePageHeader,
  MobileRoundButton,
  MobileSearchField,
  MobileSegment,
  PopoverMenu,
  PopoverMenuItem,
  PullRefresh,
  useDs,
  usePopoverAnchor,
  type IconName,
} from "@/shared/ui";
import { NewTestDialog, type NewTestDraft } from "./new-test-dialog";

const DRAFT = "draft";

/**
 * Testlar — veb `tests-page.tsx` + `mobile-tests.tsx` (tor ekran): sarlavha
 * va "+", qidiruv, fanlar bo'yicha suriladigan segment, "Qoralamalar" va
 * "E'lon qilingan" bo'limlarida test kartalari. Karta sarlavhasi menyuni
 * ochadi (tahrirlash, natijalar, urinishlar, yuklab olish, o'chirish);
 * pastda qoralamada "Tahrirlash / E'lon qilish", aks holda "Natijalar /
 * Guruhga berish". `?new=1` bilan ochilsa yangi test oynasi ochiq.
 */
export function TestsPage() {
  const { t } = useTranslation("quiz");
  const ds = useDs();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ new?: string }>();
  const quizzes = useQuizzes(null);
  const courses = useCourses();
  const subjectOptions = useSubjects();
  const publish = usePublishQuiz();
  const create = useCreateQuiz();
  const update = useUpdateQuiz();
  const assign = useAssignQuizToCourse();
  const remove = useDeleteQuiz();
  const exportQuiz = useExportQuiz();
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(() => params.new === "1");
  const [exportOf, setExportOf] = useState<QuizSummary | null>(null);
  const [deleting, setDeleting] = useState<QuizSummary | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<QuizSummary | null>(null);
  const [attemptsOf, setAttemptsOf] = useState<QuizSummary | null>(null);
  const attempts = useQuizAttempts(attemptsOf?.id ?? null, Boolean(attemptsOf));

  const items = useMemo(() => quizzes.data ?? [], [quizzes.data]);
  const courseOptions = (courses.data ?? []).map((course) => ({
    id: course.id,
    label: course.title,
    subject: course.subject,
    studentCount: course.studentCount ?? 0,
  }));

  const subjects = useMemo(() => {
    const map = new Map<string, { label: string; count: number }>();
    for (const course of courses.data ?? []) {
      const key = course.subject || course.subjectLabel;
      if (key && !map.has(key)) map.set(key, { label: course.subjectLabel || key, count: 0 });
    }
    for (const quiz of items) {
      const key = quiz.subject || quiz.subjectLabel || "other";
      const entry = map.get(key);
      if (entry) entry.count += 1;
      else map.set(key, { label: quiz.subjectLabel || key, count: 1 });
    }
    return [...map.entries()].map(([id, value]) => ({ id, ...value }));
  }, [items, courses.data]);

  const needle = query.trim().toLocaleLowerCase();
  const matches = items.filter(
    (quiz) =>
      (filter === "all" || (quiz.subject || quiz.subjectLabel) === filter) &&
      (!needle || [quizDisplayTitle(quiz), quiz.topic, quiz.subjectLabel].some((value) => (value ?? "").toLocaleLowerCase().includes(needle)))
  );
  const drafts = matches.filter((quiz) => quiz.status === DRAFT);
  const published = matches.filter((quiz) => quiz.status !== DRAFT);
  const empty = !quizzes.isLoading && !drafts.length && !published.length;

  function changeCreateOpen(open: boolean) {
    setCreateOpen(open);
    if (!open && params.new) router.setParams({ new: undefined });
  }

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace(ROUTES.teacher.workspace as never);
  }

  function startTest(draft: NewTestDraft) {
    create.mutate(
      {
        courseId: draft.courseId,
        subject: draft.subject || undefined,
        status: "draft",
        lessonId: null,
        title: draft.title,
        topic: draft.title,
        description: "",
        dueAt: draft.dueAt,
        opensAt: null,
        groups: [],
        questions: [],
      },
      {
        onSuccess: (quiz) => {
          changeCreateOpen(false);
          router.push(`${ROUTES.teacher.test(quiz.id)}?step=2` as never);
        },
      }
    );
  }

  const card = {
    publishPending: publish.isPending,
    onEdit: (quiz: QuizSummary) => router.push((quiz.status === DRAFT ? ROUTES.teacher.test(quiz.id) : ROUTES.teacher.testEdit(quiz.id)) as never),
    onPublish: (quiz: QuizSummary) => publish.mutate(quiz.id),
    onResults: (quiz: QuizSummary) => router.push(ROUTES.teacher.testResults(quiz.id) as never),
    onAssign: setAssignTarget,
    onAttempts: setAttemptsOf,
    onDownload: setExportOf,
    onDelete: setDeleting,
  };

  return (
    <View style={[styles.fill, { backgroundColor: ds.c.canvas }]}>
      <ScrollView
        style={styles.fill}
        contentContainerStyle={[styles.page, { paddingTop: insets.top + 22, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={<PullRefresh onRefresh={() => Promise.all([quizzes.refetch(), courses.refetch()])} />}
      >
        <DsGradient name="auth" />
        <MobilePageHeader
          title={t("tests.title")}
          backLabel={t("tests.mobile.back")}
          onBack={goBack}
          action={<MobileRoundButton icon="add" iconSize={24} label={t("tests.create")} onPress={() => changeCreateOpen(true)} />}
        />

        <MobileSearchField style={styles.search} value={query} onChange={setQuery} placeholder={t("tests.mobile.searchPlaceholder")} clearLabel={t("tests.mobile.clearSearch")} />

        <View style={styles.chips}>
          <MobileSegment
            scroll
            items={[{ id: "all", label: t("tests.filters.all") }, ...subjects.map((subject) => ({ id: subject.id, label: subject.label }))]}
            value={filter === DRAFT ? "all" : filter}
            onChange={setFilter}
          />
        </View>

        {quizzes.isLoading ? <MobileListSkeleton style={styles.skeleton} /> : null}

        {!quizzes.isLoading ? (
          <View style={styles.list}>
            {[
              { id: "drafts" as const, rows: drafts },
              { id: "published" as const, rows: published },
            ].map((section) =>
              section.rows.length ? (
                <View key={section.id} style={styles.section}>
                  <DsText v="caption-strong" c="ink-secondary" style={styles.upper}>
                    {t(`tests.mobile.${section.id}`, { count: section.rows.length })}
                  </DsText>
                  {section.rows.map((quiz) => (
                    <TestCard key={quiz.id} quiz={quiz} {...card} />
                  ))}
                </View>
              ) : null
            )}

            {empty ? (
              query || filter !== "all" ? (
                <MobileEmptyCard icon="search" title={t("tests.mobile.emptySearch")} />
              ) : (
                <MobileEmptyCard
                  icon="quiz"
                  title={t("tests.emptyTitle")}
                  description={t("tests.emptyHint")}
                  action={{ label: t("tests.create"), icon: "add", onPress: () => changeCreateOpen(true) }}
                />
              )
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      <NewTestDialog
        open={createOpen}
        onOpenChange={changeCreateOpen}
        courses={courseOptions}
        subjects={(subjectOptions.data ?? []).map((item) => ({ value: item.value, label: item.label }))}
        pending={create.isPending}
        onContinue={startTest}
        onImport={() => setImportOpen(true)}
      />

      <QuizImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        request={{ topic: t("tests.importedTopic") }}
        onImported={(quiz) => {
          changeCreateOpen(false);
          router.push(ROUTES.teacher.test(quiz.id) as never);
        }}
      />

      <AssignQuizDialog
        open={Boolean(assignTarget)}
        onOpenChange={(open) => !open && setAssignTarget(null)}
        quizId={assignTarget?.id ?? null}
        quizLabel={assignTarget ? quizDisplayTitle(assignTarget) : ""}
        quizzes={items.filter((quiz) => quiz.status !== DRAFT).map((quiz) => ({ id: quiz.id, label: quizDisplayTitle(quiz) }))}
        courses={courseOptions.map((course) => ({ id: course.id, label: course.label, studentCount: course.studentCount }))}
        pending={assign.isPending}
        onSubmit={({ quizId, courseId, dueAt }) => {
          const target = items.find((quiz) => quiz.id === quizId) ?? assignTarget;
          void assign.mutateAsync({ quizId, courseId }).then(() => {
            if (dueAt && target) update.mutate({ id: target.id, values: { dueAt } });
            setAssignTarget(null);
          });
        }}
      />

      <QuizAttemptsDrawer
        open={Boolean(attemptsOf)}
        onOpenChange={(open) => !open && setAttemptsOf(null)}
        title={attemptsOf ? quizDisplayTitle(attemptsOf) : ""}
        subtitle={t("attemptsDrawer.unlimited")}
        attempts={attempts.data ?? []}
        loading={attempts.isLoading}
      />

      <QuizExportDialog
        open={Boolean(exportOf)}
        onOpenChange={(open) => !open && setExportOf(null)}
        title={exportOf ? quizDisplayTitle(exportOf) : ""}
        pending={exportQuiz.isPending ? "pending" : null}
        onExport={(type, mode) => {
          if (!exportOf) return;
          void exportQuiz.mutateAsync({ id: exportOf.id, type, mode, name: quizDisplayTitle(exportOf) }).then(() => setExportOf(null));
        }}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        icon="trash"
        title={t("tests.mobile.deleteTitle")}
        description={t("tests.mobile.deleteDescription", { title: deleting ? quizDisplayTitle(deleting) : "" })}
        confirmLabel={t("tests.mobile.delete")}
        cancelLabel={t("tests.mobile.cancel")}
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </View>
  );
}

interface TestCardProps {
  quiz: QuizSummary;
  publishPending: boolean;
  onEdit: (quiz: QuizSummary) => void;
  onPublish: (quiz: QuizSummary) => void;
  onResults: (quiz: QuizSummary) => void;
  onAssign: (quiz: QuizSummary) => void;
  onAttempts: (quiz: QuizSummary) => void;
  onDownload: (quiz: QuizSummary) => void;
  onDelete: (quiz: QuizSummary) => void;
}

/** Test kartasi — `rounded-xl bg-surface p-4`; sarlavha bosilsa menyu. */
function TestCard({ quiz, ...props }: TestCardProps) {
  const { t } = useTranslation("quiz");
  const ds = useDs();
  const { anchorRef, rect, open, close } = usePopoverAnchor();
  const draft = quiz.status === DRAFT;
  const menuItems = 2 + (draft ? 1 : 3);

  function pick(action: (quiz: QuizSummary) => void) {
    close();
    action(quiz);
  }

  return (
    <View style={[styles.card, { backgroundColor: ds.c.surface }]}>
      <View style={styles.cardHead}>
        <View ref={anchorRef} collapsable={false} style={styles.grow}>
          <Pressable accessibilityRole="button" onPress={open} style={styles.cardTitle}>
            <View style={[styles.cardIcon, { backgroundColor: ds.c["accent-violet-bg"] }]}>
              <Icon name="quiz" size={20} color={ds.c["accent-violet-fg"]} />
            </View>
            <View style={styles.grow}>
              <DsText v="title" numberOfLines={1}>
                {quizDisplayTitle(quiz)}
              </DsText>
              <DsText v="body-sm" c="ink-secondary" numberOfLines={1}>
                {[quiz.subjectLabel, t("tests.questionCount", { count: quiz.questionCount })].filter(Boolean).join(" · ")}
              </DsText>
            </View>
          </Pressable>
          <PopoverMenu rect={rect} onClose={close} align="start" height={menuItems * 44 + 12}>
            <PopoverMenuItem label={t("tests.edit")} onPress={() => pick(props.onEdit)} />
            {draft ? null : (
              <>
                <PopoverMenuItem label={t("tests.results")} onPress={() => pick(props.onResults)} />
                <PopoverMenuItem label={t("tests.attempts")} onPress={() => pick(props.onAttempts)} />
              </>
            )}
            <PopoverMenuItem label={t("tests.mobile.download")} onPress={() => pick(props.onDownload)} />
            <PopoverMenuItem danger label={t("tests.mobile.delete")} onPress={() => pick(props.onDelete)} />
          </PopoverMenu>
        </View>

        {draft ? (
          <View style={[styles.draftChip, { backgroundColor: ds.c["accent-violet-bg"] }]}>
            <Icon name="edit" size={14} color={ds.c["accent-violet-fg"]} />
            <DsText v="caption-strong" c="accent-violet-fg">
              {t("tests.draft")}
            </DsText>
          </View>
        ) : null}
      </View>

      {/* `mt-3 grid grid-cols-2 gap-2` */}
      <View style={styles.actions}>
        {draft ? (
          <>
            <CardButton icon="edit" label={t("tests.edit")} onPress={() => props.onEdit(quiz)} />
            <CardButton soft icon="send" label={t("tests.publish")} disabled={props.publishPending} onPress={() => props.onPublish(quiz)} />
          </>
        ) : (
          <>
            <CardButton icon="bar-chart" label={t("tests.results")} onPress={() => props.onResults(quiz)} />
            <CardButton soft icon="send" label={t("tests.assign")} onPress={() => props.onAssign(quiz)} />
          </>
        )}
      </View>
    </View>
  );
}

/** `h-11 rounded-full px-3 text-button` — chegarali oq yoki `bg-brand-subtle`. */
function CardButton({ icon, label, soft = false, disabled = false, onPress }: { icon: IconName; label: string; soft?: boolean; disabled?: boolean; onPress: () => void }) {
  const ds = useDs();
  return (
    <View style={styles.actionCell}>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.action,
          soft
            ? { backgroundColor: pressed ? ds.c.tint : ds.c["brand-subtle"] }
            : { borderWidth: 1, borderColor: ds.c["line-strong"], backgroundColor: pressed ? ds.c.subtle : ds.c.surface },
          disabled && styles.faded,
        ]}
      >
        <Icon name={icon} size={18} color={soft ? ds.c["brand-strong"] : ds.c.ink} />
        <DsText v="button" c={soft ? "brand-strong" : "ink"} numberOfLines={1}>
          {label}
        </DsText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  faded: { opacity: 0.5 },
  upper: { textTransform: "uppercase" },
  /* `px-4 pt-5.5 pb-8` */
  page: { paddingHorizontal: 16 },
  search: { marginTop: 18 },
  chips: { marginTop: 20 },
  skeleton: { marginTop: 14 },
  list: { marginTop: 20, gap: 12 },
  section: { gap: 12 },
  card: { padding: 16, borderRadius: dsRadius.xl },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardTitle: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardIcon: { width: 40, height: 40, borderRadius: dsRadius.md, alignItems: "center", justifyContent: "center" },
  draftChip: { height: 24, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 8, borderRadius: 12 },
  actions: { marginTop: 12, flexDirection: "row", gap: 8 },
  actionCell: { flex: 1, flexBasis: 0 },
  action: { height: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 12, borderRadius: 22 },
});
