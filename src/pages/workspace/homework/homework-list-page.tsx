import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCourses } from "@/modules/course";
import { homeworkApi, homeworkKeys, useCreateAssignment, useDeleteAssignment } from "@/modules/homework";
import { ROUTES } from "@/shared/config";
import type { Assignment, Course } from "@/shared/types";
import {
  DsGradient,
  DsText,
  dsRadius,
  GroupTile,
  Icon,
  MobileEmptyCard,
  MobilePageHeader,
  MobileRoundButton,
  MobileSegment,
  PopoverMenu,
  PopoverMenuItem,
  PullRefresh,
  useDs,
  usePopoverAnchor,
} from "@/shared/ui";
import { AssignmentFormDialog } from "@/widgets/homework-workspace/assignment-form-dialog";
import { DeleteAssignmentDialog } from "./delete-assignment-dialog";
import { formatDue } from "./format-due";

type HomeworkFilter = "active" | "review" | "draft";

const FILTERS: HomeworkFilter[] = ["active", "review", "draft"];

function dueInDays(value: string | null, now: number): number | null {
  if (!value) return null;
  const due = new Date(value).getTime();
  if (Number.isNaN(due)) return null;
  return Math.ceil((due - now) / 86_400_000);
}

function needsReview(item: Assignment): boolean {
  const submitted = item.stats?.submittedCount ?? 0;
  const checked = item.submissions?.filter((row) => row.status === "done").length ?? 0;
  return submitted > checked;
}

/**
 * Vazifalar ro'yxati — veb `homework-list-page.tsx` + `mobile-homework-list.tsx`
 * (tor ekran): sarlavha va "+", "Faol / Tekshirish / Qoralama" (soni bilan),
 * "Shu hafta" va "Avvalroq" bo'limlarida vazifa kartalari (guruh, muddat,
 * tekshirish/qolgan kun belgisi, topshirganlar va chiziq); kartadagi menyu —
 * ochish, tekshirish, o'chirish. `?new=1` bilan ochilsa yaratish oynasi ochiq.
 */
export function HomeworkListPage() {
  const { t } = useTranslation("homework");
  const ds = useDs();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ new?: string }>();
  const courses = useCourses();
  const create = useCreateAssignment();
  const remove = useDeleteAssignment();
  const [filter, setFilter] = useState<HomeworkFilter>("active");
  const [createOpen, setCreateOpen] = useState(() => params.new === "1");
  const [deleting, setDeleting] = useState<Assignment | null>(null);
  const [now] = useState(() => Date.now());

  const groups = useMemo(() => courses.data ?? [], [courses.data]);
  const queries = useQueries({
    queries: groups.map((course) => ({
      queryKey: homeworkKeys.assignments(course.id),
      queryFn: ({ signal }: { signal: AbortSignal }) => homeworkApi.getAssignments(course.id, { signal }),
    })),
  });
  const items = queries.flatMap((query) => query.data ?? []);
  const loading = courses.isLoading || queries.some((query) => query.isLoading);
  const lookup = new Map(groups.map((course) => [course.id, course]));

  const active = items.filter((item) => item.status === "active");
  const drafts = items.filter((item) => item.status === "draft");
  const counts: Record<HomeworkFilter, number> = { active: active.length, review: active.filter(needsReview).length, draft: drafts.length };
  const visible = filter === "draft" ? drafts : filter === "review" ? active.filter(needsReview) : active;

  const week: Assignment[] = [];
  const earlier: Assignment[] = [];
  for (const item of visible) {
    const days = dueInDays(item.dueAt, now);
    if (days !== null && days >= 0 && days <= 7) week.push(item);
    else earlier.push(item);
  }
  const sections = [
    { id: "week" as const, rows: week },
    { id: "earlier" as const, rows: earlier },
  ];
  const empty = !loading && !visible.length;

  function changeCreateOpen(open: boolean) {
    setCreateOpen(open);
    if (!open && params.new) router.setParams({ new: undefined });
  }

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace(ROUTES.teacher.workspace as never);
  }

  return (
    <View style={[styles.fill, { backgroundColor: ds.c.canvas }]}>
      <ScrollView
        style={styles.fill}
        contentContainerStyle={[styles.page, { paddingTop: insets.top + 22, paddingBottom: insets.bottom + 32 }]}
        refreshControl={<PullRefresh onRefresh={() => Promise.all([courses.refetch(), ...queries.map((query) => query.refetch())])} />}
      >
        <DsGradient name="auth" />
        <MobilePageHeader
          title={t("list.title")}
          backLabel={t("list.mobile.back")}
          onBack={goBack}
          action={<MobileRoundButton icon="add" iconSize={24} label={t("list.create")} onPress={() => changeCreateOpen(true)} />}
        />

        <View style={styles.filters}>
          <MobileSegment
            items={FILTERS.map((id) => ({ id, label: counts[id] ? `${t(`list.filters.${id}`)} · ${counts[id]}` : t(`list.filters.${id}`) }))}
            value={filter}
            onChange={setFilter}
          />
        </View>

        <View style={styles.list}>
          {loading ? Array.from({ length: 3 }, (_, index) => <View key={index} style={[styles.skeleton, { backgroundColor: ds.c.surface }]} />) : null}

          {sections.map((section) =>
            section.rows.length ? (
              <View key={section.id} style={styles.section}>
                <DsText v="caption-strong" c="ink-secondary" style={styles.upper}>
                  {t(`list.sections.${section.id}`)}
                </DsText>
                {section.rows.map((item) => (
                  <AssignmentCard
                    key={item.id}
                    item={item}
                    course={lookup.get(item.courseId)}
                    now={now}
                    onOpen={() => router.push(ROUTES.teacher.homeworkItem(item.id) as never)}
                    onReview={() => router.push(ROUTES.teacher.homeworkReview(item.id) as never)}
                    onDelete={() => setDeleting(item)}
                  />
                ))}
              </View>
            ) : null
          )}

          {empty ? <MobileEmptyCard icon="assign" title={t("list.empty")} /> : null}
        </View>
      </ScrollView>

      <AssignmentFormDialog
        open={createOpen}
        onOpenChange={changeCreateOpen}
        courses={groups.map((course) => ({ id: course.id, title: course.title, studentCount: course.studentCount ?? 0 }))}
        pending={create.isPending}
        onSubmit={(values) => create.mutate(values, { onSuccess: () => changeCreateOpen(false) })}
      />
      <DeleteAssignmentDialog
        open={Boolean(deleting)}
        count={deleting?.stats?.submittedCount ?? deleting?.submissions.length ?? 0}
        pending={remove.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </View>
  );
}

/** Vazifa kartasi — `rounded-xl bg-surface p-4`. */
function AssignmentCard({
  item,
  course,
  now,
  onOpen,
  onReview,
  onDelete,
}: {
  item: Assignment;
  course: Course | undefined;
  now: number;
  onOpen: () => void;
  onReview: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation("homework");
  const { t: tl } = useTranslation("lesson");
  const ds = useDs();
  const { anchorRef, rect, open, close } = usePopoverAnchor();
  const months = tl("list.months", { returnObjects: true }) as string[];
  const days = dueInDays(item.dueAt, now);
  const due = item.dueAt ? formatDue(item.dueAt, months).replace(", 23:59", "") : "";
  const submitted = item.stats?.submittedCount ?? 0;
  const total = item.stats?.studentsCount ?? 0;
  const pending = item.submissions.filter((row) => row.status !== "done").length;
  const percent = total ? Math.min(100, Math.round((submitted / total) * 100)) : 0;

  function pick(action: () => void) {
    close();
    action();
  }

  return (
    <View style={[styles.card, { backgroundColor: ds.c.surface }]}>
      <View style={styles.cardHead}>
        <GroupTile name={item.courseTitle} src={course?.avatarUrl} tone={course?.color} box={44} radius={dsRadius.xl} />
        <View style={styles.grow}>
          <DsText v="title" numberOfLines={1} onPress={onOpen}>
            {item.title}
          </DsText>
          <DsText v="body-sm" c="ink-secondary" numberOfLines={1} onPress={onOpen}>
            {item.courseTitle}
            {due ? ` · ${days !== null && days >= 0 ? t("list.due", { value: due }) : due}` : ""}
          </DsText>
        </View>
        <View ref={anchorRef} collapsable={false} style={styles.moreWrap}>
          <Pressable accessibilityRole="button" accessibilityLabel={t("list.mobile.more")} onPress={open} style={styles.more}>
            <Icon name="more" size={20} color={ds.c["icon-secondary"]} />
          </Pressable>
          <PopoverMenu rect={rect} onClose={close} height={3 * 44 + 12}>
            <PopoverMenuItem label={t("list.open")} onPress={() => pick(onOpen)} />
            <PopoverMenuItem label={t("list.mobile.review")} onPress={() => pick(onReview)} />
            <PopoverMenuItem danger label={t("list.mobile.delete")} onPress={() => pick(onDelete)} />
          </PopoverMenu>
        </View>
      </View>

      <View style={styles.meta}>
        {pending ? (
          <View style={[styles.chip, { backgroundColor: ds.c["brand-subtle"] }]}>
            <Icon name="quiz" size={14} color={ds.c.brand} />
            <DsText v="caption-strong" c="brand">
              {t("list.reviewChip", { count: pending })}
            </DsText>
          </View>
        ) : days !== null && days >= 0 ? (
          <View style={[styles.chip, { backgroundColor: ds.c["accent-teal-bg"] }]}>
            <Icon name="schedule" size={14} color={ds.c["accent-teal-fg"]} />
            <DsText v="caption-strong" c="accent-teal-fg">
              {t("list.daysLeft", { count: days })}
            </DsText>
          </View>
        ) : null}
        <DsText v="body-xs" c="ink-secondary" numberOfLines={1} style={styles.submitted}>
          {t("list.submitted", { submitted, total })}
        </DsText>
      </View>

      <View style={[styles.track, { backgroundColor: ds.c.subtle }]}>
        <View style={[styles.trackFill, { width: `${percent}%`, backgroundColor: ds.c.brand }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  upper: { textTransform: "uppercase" },
  /* `px-4 pt-5.5 pb-8` */
  page: { paddingHorizontal: 16 },
  filters: { marginTop: 18 },
  list: { marginTop: 20, gap: 12 },
  section: { gap: 12 },
  skeleton: { height: 130, borderRadius: dsRadius.xl },
  card: { padding: 16, borderRadius: dsRadius.xl },
  cardHead: { height: 44, flexDirection: "row", alignItems: "center", gap: 12 },
  moreWrap: { marginRight: -12 },
  more: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  meta: { marginTop: 12, height: 24, flexDirection: "row", alignItems: "center", gap: 12 },
  chip: { height: 24, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 8, borderRadius: 12 },
  submitted: { marginLeft: "auto", flexShrink: 1 },
  track: { marginTop: 12, height: 6, overflow: "hidden", borderRadius: 3 },
  trackFill: { height: "100%", borderRadius: 3 },
});
