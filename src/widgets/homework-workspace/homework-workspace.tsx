import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useCourses, useCourseStudents } from "@/modules/course";
import {
  homeworkApi,
  homeworkKeys,
  useAssignmentAiSummary,
  useAssignments,
  useDeleteAssignment,
  useRemindAssignment,
} from "@/modules/homework";
import { useLessons } from "@/modules/lesson";
import { useSendNotification } from "@/modules/notification";
import type { Assignment, Submission } from "@/shared/types";
import {
  Avatar,
  Icon,
  radius,
  Sheet,
  SheetButton,
  SheetFooter,
  Switch,
  Text,
  useTheme,
  type IconName,
} from "@/shared/ui";
import { AssignmentFormSheet } from "./assignment-form-sheet";
import { SubmissionReview } from "./submission-review";

export interface HomeworkWorkspaceProps {
  courseId?: string | null;
  createOpen?: boolean;
  onCreateOpenChange?: (open: boolean) => void;
}

type ListFilter = "active" | "review" | "done" | "draft";
type RowFilter = "all" | "unchecked" | "graded" | "missing";

interface AiSummaryState {
  assignmentId: string;
  summary: string;
  topics: string[];
  recommendations: string[];
}

interface StudentRow {
  id: string;
  name: string;
  avatarTone?: string;
  submission: Submission | null;
}

function withinWeek(value: string): boolean {
  const date = new Date(value).getTime();
  if (Number.isNaN(date)) return false;
  return Date.now() - date < 7 * 24 * 60 * 60 * 1000;
}

function summaryText(assignment: Assignment): string {
  const parts = assignment.submissions
    .map((item) => item.result?.summary?.recommendations ?? [])
    .flat()
    .map((item) => (typeof item === "string" ? item : ""))
    .filter(Boolean);
  return [...new Set(parts)].slice(0, 2).join(" ");
}

/**
 * Vazifalar ish maydoni — veb `widgets/homework-workspace/homework-workspace.tsx`
 * ning TOR EKRAN varianti: ro'yxat (filtrlar, "Bu hafta"/"Oldingi"),
 * tanlangan vazifa (statistika, AI xulosasi, o'quvchilar jadvali),
 * javobni tekshirish, eslatma yuborish, tahrirlash va o'chirish.
 */
export function HomeworkWorkspace({ courseId = null, createOpen = false, onCreateOpenChange }: HomeworkWorkspaceProps) {
  const { t } = useTranslation("homework");
  const { palette } = useTheme();
  const months = useTranslation("lesson").t("list.months", { returnObjects: true }) as string[];
  const scoped = useAssignments(courseId, Boolean(courseId));
  const courses = useCourses();
  const perCourse = useQueries({
    queries: (courseId ? [] : (courses.data ?? [])).map((course) => ({
      queryKey: homeworkKeys.assignments(course.id),
      queryFn: ({ signal }: { signal: AbortSignal }) => homeworkApi.getAssignments(course.id, { signal }),
    })),
  });
  const assignments = courseId
    ? { data: scoped.data, isLoading: scoped.isLoading }
    : {
        data: perCourse.flatMap((query) => query.data ?? []),
        isLoading: courses.isLoading || perCourse.some((query) => query.isLoading),
      };
  const remove = useDeleteAssignment();
  const remind = useRemindAssignment();
  const aiSummary = useAssignmentAiSummary();

  const [filter, setFilter] = useState<ListFilter>("active");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [remindOpen, setRemindOpen] = useState(false);
  const [remindParents, setRemindParents] = useState(false);
  const [aiResult, setAiResult] = useState<AiSummaryState | null>(null);
  const sendNotification = useSendNotification();
  const [rowFilter, setRowFilter] = useState<RowFilter>("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Assignment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Assignment | null>(null);
  const [reviewId, setReviewId] = useState<string | null>(null);

  const items = useMemo(() => assignments.data ?? [], [assignments.data]);
  // Telefonda (vebdagi `isCompact`) avtomatik tanlov yo'q — ro'yxat ochiladi.
  const selected = items.find((item) => item.id === selectedId) ?? null;
  const students = useCourseStudents(selected?.courseId ?? null, { page_size: 100 });
  const courseLessons = useLessons({ course: selected?.courseId ?? "", page_size: 100 }, Boolean(selected?.courseId));
  const [now] = useState(() => Date.now());

  const rows: StudentRow[] = useMemo(() => {
    if (!selected) return [];
    const byStudent = new Map(selected.submissions.map((item) => [item.studentId, item]));
    const list = (students.data?.items ?? []).map((item) => ({
      id: item.student.id,
      name: item.student.name,
      avatarTone: item.student.avatarTone,
      submission: byStudent.get(item.student.id) ?? null,
    }));
    if (list.length) return list;
    return selected.submissions.map((item) => ({ id: item.studentId, name: item.studentName, submission: item }));
  }, [selected, students.data]);

  const submitted = rows.filter((row) => row.submission).length;
  const graded = rows.filter((row) => row.submission?.grade).length;
  const unchecked = submitted - graded;
  const missing = rows.length - submitted;
  const scores = rows.map((row) => row.submission?.overallScore).filter((value): value is number => typeof value === "number");
  const average = scores.length ? (scores.reduce((sum, value) => sum + value, 0) / scores.length).toFixed(1) : "—";

  const visibleRows = rows.filter((row) => {
    if (search && !row.name.toLowerCase().includes(search.trim().toLowerCase())) return false;
    if (rowFilter === "unchecked") return Boolean(row.submission) && !row.submission?.grade;
    if (rowFilter === "graded") return Boolean(row.submission?.grade);
    if (rowFilter === "missing") return !row.submission;
    return true;
  });

  const listItems = items.filter((item) => {
    if (filter === "draft") return item.status === "draft";
    if (item.status === "draft") return false;
    const due = item.dueAt ? new Date(item.dueAt).getTime() : null;
    const open = due === null || due >= now;
    if (filter === "active") return open;
    if (filter === "review") return item.submissions.some((entry) => !entry.grade);
    return !open;
  });

  const draftCount = items.filter((item) => item.status === "draft").length;
  const missingIds = rows.filter((row) => !row.submission).map((row) => row.id);
  const thisWeek = listItems.filter((item) => withinWeek(item.createdAt));
  const earlier = listItems.filter((item) => !withinWeek(item.createdAt));

  function formatDue(value: string | null): string {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    return `${date.getDate()}-${(months[date.getMonth()] ?? "").toLowerCase()}, ${time}`;
  }

  function closeRemind() {
    setRemindOpen(false);
    setRemindParents(false);
  }

  const reviewSubmission = reviewId ? (selected?.submissions.find((item) => item.id === reviewId) ?? null) : null;

  const formSheet = (
    <AssignmentFormSheet
      open={createOpen || Boolean(editing)}
      onClose={() => {
        onCreateOpenChange?.(false);
        setEditing(null);
      }}
      courseId={courseId}
      assignment={editing}
      submittedCount={editing?.submissions.length ?? 0}
      lessons={(courseLessons.data ?? []).map((lesson) => ({ id: lesson.id, title: lesson.title, date: lesson.date }))}
      onDelete={(item) => setDeleteTarget(item)}
    />
  );

  if (!assignments.isLoading && !items.length) {
    return (
      <View style={[styles.empty, { backgroundColor: palette.background }]}>
        <View style={[styles.emptyIcon, { backgroundColor: palette.primary }]}>
          <Icon name="assign" size={26} color={palette["primary-foreground"]} />
        </View>
        <Text variant="subheading" style={styles.center}>
          {t("workspace.emptyTitle")}
        </Text>
        <Text variant="label" style={[styles.bodySm, styles.center, { color: palette["muted-foreground"] }]}>
          {t("workspace.emptyDescription")}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => onCreateOpenChange?.(true)}
          style={({ pressed }) => [styles.emptyAction, { backgroundColor: pressed ? palette["primary-hover"] : palette.primary }]}
        >
          <Text variant="label" style={{ color: palette["primary-foreground"] }}>
            {t("workspace.emptyAction")}
          </Text>
        </Pressable>
        {formSheet}
      </View>
    );
  }

  if (reviewSubmission && selected) {
    return (
      <SubmissionReview
        submission={reviewSubmission}
        grading={selected.grading}
        maxScore={selected.maxScore}
        onClose={() => setReviewId(null)}
        onStep={(direction) => {
          const all = selected.submissions;
          const index = all.findIndex((item) => item.id === reviewSubmission.id);
          const next = all[(index + direction + all.length) % all.length];
          if (next) setReviewId(next.id);
        }}
      />
    );
  }

  const chip = (active: boolean) =>
    active ? { backgroundColor: palette["primary-soft"] } : { borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface };

  return (
    <View style={styles.fill}>
      <ScrollView style={{ backgroundColor: palette.background }} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        {!selected ? (
          <>
            <View style={styles.chips}>
              {(
                [
                  ["active", t("workspace.filterActive", { count: items.length })],
                  ["review", t("workspace.filterReview", { count: unchecked })],
                  ["done", t("workspace.filterDone")],
                  ["draft", t("workspace.filterDraftCount", { count: draftCount })],
                ] as const
              ).map(([id, label]) => (
                <Pressable
                  key={id}
                  accessibilityRole="button"
                  onPress={() => {
                    setFilter(id);
                    setSelectedId(null);
                  }}
                  style={[styles.chip, styles.chipWide, chip(filter === id)]}
                >
                  <Text variant="label" style={{ color: filter === id ? palette.primary : palette["muted-foreground"] }}>
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {assignments.isLoading
              ? Array.from({ length: 3 }, (_, index) => <View key={index} style={[styles.skeleton, { backgroundColor: palette.muted }]} />)
              : null}

            {(
              [
                [t("workspace.thisWeek"), thisWeek],
                [t("workspace.earlier"), earlier],
              ] as const
            ).map(([label, group]) =>
              group.length ? (
                <View key={label} style={styles.group}>
                  <Text variant="caption" style={[styles.overline, styles.groupLabel, { color: palette["subtle-foreground"] }]}>
                    {label}
                  </Text>
                  {group.map((item) => {
                    const total = item.stats?.studentsCount ?? null;
                    const done = item.stats?.submittedCount ?? item.submissions.length;
                    const progress = total ? Math.round((done / total) * 100) : 0;
                    return (
                      <Pressable
                        key={item.id}
                        accessibilityRole="button"
                        onPress={() => {
                          setSelectedId(item.id);
                          setRowFilter("all");
                        }}
                        style={({ pressed }) => [
                          styles.card,
                          { borderColor: palette.border, backgroundColor: pressed ? palette["surface-subtle"] : palette.surface },
                        ]}
                      >
                        <View style={styles.cardHead}>
                          <View style={[styles.cardIcon, { backgroundColor: palette["primary-soft"] }]}>
                            <Icon name="assign" size={18} color={palette.primary} />
                          </View>
                          <View style={styles.grow}>
                            <Text variant="caption" style={{ color: palette["subtle-foreground"] }}>
                              {t("chatCard.label")}
                            </Text>
                            <Text variant="label" numberOfLines={1}>
                              {item.courseTitle}
                            </Text>
                          </View>
                          {item.status === "draft" ? (
                            <View style={[styles.draftBadge, { backgroundColor: palette["surface-subtle"] }]}>
                              <Text variant="caption" style={[styles.strong, { color: palette["muted-foreground"] }]}>
                                {t("workspace.draftBadge")}
                              </Text>
                            </View>
                          ) : null}
                          <Text variant="caption" style={[styles.strong, { color: palette.primary }]}>
                            {total ? t("workspace.submittedOf", { done, total }) : t("workspace.submittedCount", { count: done })}
                          </Text>
                        </View>
                        <Text variant="subheading">
                          {item.title}
                        </Text>
                        {item.description ? (
                          <Text variant="label" numberOfLines={2} style={[styles.bodySm, { color: palette["muted-foreground"] }]}>
                            {item.description}
                          </Text>
                        ) : null}
                        <View style={styles.meta}>
                          <View style={styles.metaItem}>
                            <Icon name="clock" size={14} color={palette["subtle-foreground"]} />
                            <Text variant="caption" style={{ color: palette["subtle-foreground"] }}>
                              {formatDue(item.dueAt)}
                            </Text>
                          </View>
                          {item.hasAttachment ? (
                            <View style={styles.metaItem}>
                              <Icon name="assign" size={14} color={palette["subtle-foreground"]} />
                              <Text variant="caption" style={{ color: palette["subtle-foreground"] }}>
                                {t("chatCard.fileCount", { count: 1 })}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        <View style={[styles.track, { backgroundColor: palette["surface-subtle"] }]}>
                          <View style={[styles.fill2, { width: `${progress}%`, backgroundColor: palette.success }]} />
                        </View>
                        <View style={[styles.openAnswers, { borderColor: palette.border, backgroundColor: palette.surface }]}>
                          <Text variant="label">{t("workspace.openAnswers")}</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null
            )}
          </>
        ) : (
          <>
            <View style={styles.detailHead}>
              <RoundButton icon="arrow-back" label={t("workspace.backToList")} onPress={() => setSelectedId(null)} />
              <View style={styles.grow}>
                <Text variant="heading" numberOfLines={1}>
                  {selected.title}
                </Text>
                <Text variant="label" numberOfLines={1} style={[styles.bodySm, { color: palette["subtle-foreground"] }]}>
                  {selected.courseTitle} · {t("workspace.dueLabel", { value: formatDue(selected.dueAt) })}
                  {selected.hasAttachment ? ` · ${t("chatCard.fileCount", { count: 1 })}` : ""}
                </Text>
              </View>
            </View>
            <View style={styles.detailActions}>
              <Pressable
                accessibilityRole="button"
                disabled={!missing}
                onPress={() => setRemindOpen(true)}
                style={({ pressed }) => [
                  styles.remind,
                  { borderColor: palette.border, backgroundColor: pressed ? palette["surface-subtle"] : palette.surface, opacity: missing ? 1 : 0.5 },
                ]}
              >
                <Icon name="bell" size={17} color={palette.foreground} />
                <Text variant="label">{t("workspace.remind", { count: missing })}</Text>
              </Pressable>
              <RoundButton icon="edit" label={t("workspace.edit")} onPress={() => setEditing(selected)} size={44} />
              <RoundButton icon="more" label={t("workspace.delete")} onPress={() => setDeleteTarget(selected)} size={44} />
            </View>

            <View style={styles.stats}>
              {(
                [
                  ["check-circle", palette.success, `${submitted} / ${rows.length}`, t("workspace.statSubmitted")],
                  ["assign", palette["saffron-strong"], String(unchecked), t("workspace.statUnchecked")],
                  ["clock", palette.destructive, String(missing), t("workspace.statMissing")],
                  ["check-circle", palette["saffron-strong"], average, t("workspace.statAverage")],
                ] as const
              ).map(([icon, tone, value, label], index) => (
                <View key={index} style={styles.statCell}>
                  <View style={[styles.stat, { borderColor: palette.border, backgroundColor: palette.surface }]}>
                    <View style={[styles.statIcon, { backgroundColor: tone }]}>
                      <Icon name={icon as IconName} size={17} color="#ffffff" />
                    </View>
                    <Text variant="heading">{value}</Text>
                    <Text variant="caption" style={{ color: palette["muted-foreground"] }}>
                      {label}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={[styles.summary, { backgroundColor: palette["saffron-soft"] }]}>
              <View style={styles.summaryHead}>
                <Icon name="check-circle" size={17} color={palette["saffron-strong"]} />
                <Text variant="label" style={styles.grow}>
                  {t("workspace.aiSummary")}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  disabled={aiSummary.isPending}
                  onPress={() =>
                    aiSummary.mutate(selected.id, {
                      onSuccess: (data) =>
                        setAiResult({
                          assignmentId: selected.id,
                          summary: data.summary,
                          topics: data.topics,
                          recommendations: data.recommendations,
                        }),
                    })
                  }
                  style={aiSummary.isPending && styles.dim}
                >
                  <Text variant="label" style={{ color: palette.primary }}>
                    {aiSummary.isPending ? t("workspace.aiLoading") : t("workspace.aiAction")}
                  </Text>
                </Pressable>
              </View>
              <Text variant="label" style={[styles.bodySm, { color: palette["muted-foreground"] }]}>
                {aiResult?.assignmentId === selected.id && aiResult.summary
                  ? aiResult.summary
                  : summaryText(selected) || t("workspace.aiEmpty")}
              </Text>
              {aiResult?.assignmentId === selected.id && aiResult.topics.length ? (
                <View style={styles.topics}>
                  {aiResult.topics.map((topic) => (
                    <View key={topic} style={[styles.topic, { backgroundColor: palette.surface }]}>
                      <Text variant="caption" style={[styles.strong, { color: palette["muted-foreground"] }]}>
                        {topic}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
              {aiResult?.assignmentId === selected.id && aiResult.recommendations.length ? (
                <View style={styles.recommendations}>
                  {aiResult.recommendations.map((item) => (
                    <View key={item} style={styles.recommendation}>
                      <View style={styles.recommendationIcon}>
                        <Icon name="check-circle" size={14} color={palette.success} />
                      </View>
                      <Text variant="label" style={[styles.bodySm, styles.grow, { color: palette["muted-foreground"] }]}>
                        {item}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>

            <View style={styles.chips}>
              {(
                [
                  ["all", t("workspace.rowAll", { count: rows.length })],
                  ["unchecked", t("workspace.rowUnchecked", { count: unchecked })],
                  ["graded", t("workspace.rowGraded", { count: graded })],
                  ["missing", t("workspace.rowMissing", { count: missing })],
                ] as const
              ).map(([id, label]) => (
                <Pressable key={id} accessibilityRole="button" onPress={() => setRowFilter(id)} style={[styles.chip, styles.chipWide, chip(rowFilter === id)]}>
                  <Text variant="label" style={{ color: rowFilter === id ? palette.primary : palette["muted-foreground"] }}>
                    {label}
                  </Text>
                </Pressable>
              ))}
              <View style={[styles.search, { borderColor: palette.border, backgroundColor: palette.surface }]}>
                <Icon name="search" size={17} color={palette["subtle-foreground"]} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder={t("workspace.searchStudent")}
                  placeholderTextColor={palette["subtle-foreground"]}
                  style={[styles.searchInput, { color: palette.foreground }]}
                />
              </View>
            </View>

            <View style={[styles.table, { borderColor: palette.border, backgroundColor: palette.surface }]}>
              <View style={[styles.tableHead, { borderBottomColor: palette.border, backgroundColor: palette["surface-subtle"] }]}>
                <Text variant="caption" style={[styles.overline, styles.grow, { color: palette["subtle-foreground"] }]}>
                  {t("workspace.colStudent")}
                </Text>
                <Text variant="caption" style={[styles.overline, styles.colStatus, { color: palette["subtle-foreground"] }]}>
                  {t("workspace.colStatus")}
                </Text>
                <Text variant="caption" style={[styles.overline, styles.colGrade, { color: palette["subtle-foreground"] }]}>
                  {t("workspace.colGrade")}
                </Text>
                <View style={styles.colChevron} />
              </View>
              {visibleRows.map((row, index) => {
                const state = !row.submission
                  ? "missing"
                  : row.submission.status === "resubmit_requested"
                    ? "resubmit"
                    : row.submission.grade
                      ? "graded"
                      : row.submission.isLate
                        ? "late"
                        : "unchecked";
                const tone =
                  state === "graded"
                    ? { bg: palette["success-soft"], fg: palette["success-strong"] }
                    : state === "resubmit"
                      ? { bg: palette["primary-soft"], fg: palette.primary }
                      : state === "unchecked"
                      ? { bg: palette["saffron-soft"], fg: palette["saffron-strong"] }
                      : { bg: palette["destructive-soft"], fg: palette["destructive-strong"] };
                return (
                  <Pressable
                    key={row.id}
                    accessibilityRole="button"
                    onPress={() => row.submission && setReviewId(row.submission.id)}
                    style={({ pressed }) => [
                      styles.row,
                      index < visibleRows.length - 1 && { borderBottomWidth: 1, borderBottomColor: palette.border },
                      pressed && { backgroundColor: palette["surface-subtle"] },
                    ]}
                  >
                    <View style={[styles.grow, styles.rowName]}>
                      <Avatar variant="legacy" name={row.name} tone={row.avatarTone} size="sm" />
                      <Text variant="label" numberOfLines={1} style={[styles.bodySm, styles.grow]}>
                        {row.name}
                      </Text>
                    </View>
                    <View style={styles.colStatus}>
                      <View style={[styles.state, { backgroundColor: tone.bg }]}>
                        <Text variant="caption" style={[styles.strong, { color: tone.fg }]}>
                          {t(`workspace.state.${state}`)}
                        </Text>
                      </View>
                    </View>
                    <Text variant="label" style={[styles.bodySm, styles.colGrade, styles.centerText]}>
                      {row.submission?.grade ? (row.submission.overallScore ?? "—") : "—"}
                    </Text>
                    <View style={styles.colChevron}>
                      <Icon name="chevron-right" size={18} color={palette["subtle-foreground"]} />
                    </View>
                  </Pressable>
                );
              })}
              {!visibleRows.length ? (
                <Text variant="label" style={[styles.bodySm, styles.center, styles.noRows, { color: palette["subtle-foreground"] }]}>
                  {t("workspace.noStudents")}
                </Text>
              ) : null}
            </View>
          </>
        )}
      </ScrollView>

      <Sheet
        open={remindOpen}
        onClose={closeRemind}
        title={t("workspace.remindTitle")}
        description={t("workspace.remindDescription", { count: missing })}
      >
        {/* `rounded-2xl border px-4 py-3 gap-3` — ota-onalarga ham yuborish. */}
        <View style={[styles.parents, { borderColor: palette.border }]}>
          <View style={[styles.parentsIcon, { backgroundColor: palette.primary }]}>
            <Icon name="groups" size={17} color={palette["primary-foreground"]} />
          </View>
          <View style={styles.grow}>
            <Text variant="label">{t("workspace.remindParents")}</Text>
            <Text variant="caption" style={{ color: palette["subtle-foreground"] }}>
              {t("workspace.remindParentsHint")}
            </Text>
          </View>
          <Switch
            checked={remindParents}
            onCheckedChange={setRemindParents}
            accessibilityLabel={t("workspace.remindParents")}
          />
        </View>

        {remindParents ? (
          <View style={[styles.message, { backgroundColor: palette["surface-subtle"] }]}>
            <Text variant="caption" style={[styles.overline, { color: palette["subtle-foreground"] }]}>
              {t("workspace.remindMessageLabel")}
            </Text>
            <Text variant="label" style={styles.bodySm}>
              {t("workspace.remindMessage", { title: selected?.title ?? "", due: formatDue(selected?.dueAt ?? null) })}
            </Text>
          </View>
        ) : null}

        <Text variant="caption" style={{ color: palette["subtle-foreground"] }}>
          {t("workspace.remindThrottleNote")}
        </Text>
        <SheetFooter>
          <SheetButton title={t("workspace.remindCancel")} onPress={closeRemind} />
          <SheetButton
            variant="primary"
            title={t("workspace.remindSend")}
            disabled={remind.isPending || sendNotification.isPending || !missing || !selected}
            onPress={() => {
              if (!selected) return;
              // O'quvchilarga — bitta server chaqiruvi; ota-onalarga — ixtiyoriy bildirishnoma.
              remind.mutate(selected.id);
              if (remindParents && missingIds.length)
                sendNotification.mutate({
                  description: t("workspace.remindMessage", { title: selected.title, due: formatDue(selected.dueAt) }),
                  targetType: "parents_of",
                  userIds: missingIds,
                  kind: "homework_reminder",
                });
              closeRemind();
            }}
          />
        </SheetFooter>
      </Sheet>

      {formSheet}

      <Sheet
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={t("workspace.deleteTitle")}
        description={t("workspace.deleteDescription", { count: deleteTarget?.submissions.length ?? 0 })}
      >
        <SheetFooter>
          <SheetButton title={t("workspace.cancel")} onPress={() => setDeleteTarget(null)} />
          <SheetButton
            variant="danger"
            title={t("workspace.delete")}
            disabled={remove.isPending}
            onPress={() => {
              if (!deleteTarget) return;
              remove.mutate(deleteTarget.id, {
                onSuccess: () => {
                  setDeleteTarget(null);
                  setSelectedId(null);
                },
              });
            }}
          />
        </SheetFooter>
      </Sheet>
    </View>
  );
}

function RoundButton({ icon, label, onPress, size = 40 }: { icon: IconName; label: string; onPress: () => void; size?: number }) {
  const { palette } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.round,
        { width: size, height: size, borderColor: palette.border, backgroundColor: pressed ? palette["surface-subtle"] : palette.surface },
      ]}
    >
      <Icon name={icon} size={18} color={palette.foreground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  center: { textAlign: "center" },
  centerText: { textAlign: "center" },
  bodySm: { fontWeight: "400" },
  strong: { fontWeight: "600" },
  overline: { fontWeight: "600", letterSpacing: 0.6, textTransform: "uppercase" },
  page: { gap: 12, padding: 16 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 24 },
  emptyIcon: { width: 64, height: 64, borderRadius: radius["2xl"], alignItems: "center", justifyContent: "center" },
  emptyAction: { marginTop: 4, height: 48, justifyContent: "center", paddingHorizontal: 24, borderRadius: radius.full },
  chips: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  chip: { height: 36, justifyContent: "center", paddingHorizontal: 12, borderRadius: radius.full },
  chipWide: { paddingHorizontal: 14 },
  skeleton: { height: 160, borderRadius: radius["2xl"] },
  group: { gap: 8 },
  groupLabel: { paddingHorizontal: 4 },
  /* `rounded-2xl border p-4 gap-2` */
  card: { gap: 8, padding: 16, borderWidth: 1, borderRadius: radius["2xl"] },
  cardHead: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  cardIcon: { width: 40, height: 40, borderRadius: radius.xl, alignItems: "center", justifyContent: "center" },
  meta: { flexDirection: "row", alignItems: "center", gap: 12 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  track: { height: 6, borderRadius: radius.full, overflow: "hidden" },
  fill2: { height: "100%", borderRadius: radius.full },
  openAnswers: { marginTop: 4, height: 44, alignItems: "center", justifyContent: "center", borderWidth: 1, borderRadius: radius.full },
  detailHead: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  detailActions: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 12 },
  remind: { height: 44, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, borderWidth: 1, borderRadius: radius.full },
  round: { borderWidth: 1, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  stats: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6, rowGap: 12 },
  statCell: { width: "50%", paddingHorizontal: 6 },
  stat: { gap: 8, padding: 16, borderWidth: 1, borderRadius: radius["2xl"] },
  statIcon: { width: 36, height: 36, borderRadius: radius.xl, alignItems: "center", justifyContent: "center" },
  summary: { gap: 8, padding: 16, borderRadius: radius["2xl"] },
  summaryHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  search: { flexGrow: 1, minWidth: 220, height: 44, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, borderWidth: 1, borderRadius: radius.full },
  searchInput: { flex: 1, height: "100%", fontSize: 14, fontFamily: "Onest-Regular" },
  table: { overflow: "hidden", borderWidth: 1, borderRadius: radius["2xl"] },
  tableHead: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  rowName: { flexDirection: "row", alignItems: "center", gap: 12 },
  colStatus: { width: 112 },
  colGrade: { width: 64, textAlign: "center" },
  colChevron: { width: 24, alignItems: "center" },
  state: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  noRows: { paddingHorizontal: 16, paddingVertical: 40 },
  message: { gap: 8, padding: 14, borderRadius: radius.xl },
  parents: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderRadius: radius["2xl"] },
  /* `size-9 rounded-xl` */
  parentsIcon: { width: 36, height: 36, borderRadius: radius.xl, alignItems: "center", justifyContent: "center" },
  /* `rounded-full px-2 py-1` */
  draftBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.full },
  /* `flex flex-wrap gap-1.5`; har biri `rounded-full px-2.5 py-1` */
  topics: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  topic: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  recommendations: { gap: 4 },
  recommendation: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  recommendationIcon: { marginTop: 2 },
  dim: { opacity: 0.6 },
});
