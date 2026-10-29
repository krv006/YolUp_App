import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ROUTES } from "@/shared/config";
import type { Assignment } from "@/shared/types";
import { DsGradient, DsText, dsRadius, MobileEmptyCard, MobilePageHeader, MobileSegment, PullRefresh, useDs } from "@/shared/ui";
import { TaskCards } from "@/widgets/group-workspace/task-cards";
import { useAssignmentRows } from "@/widgets/student-group-workspace/use-assignment-rows";
import { useStudentWorkspace } from "./use-student-workspace";

type Filter = "all" | "open" | "checking" | "graded";

const FILTERS: Filter[] = ["all", "open", "checking", "graded"];

function stateOf(item: Assignment): Exclude<Filter, "all"> {
  if (!item.mySubmission) return "open";
  return item.mySubmission.status === "done" ? "graded" : "checking";
}

/**
 * O'quvchining vazifalari — veb `student-homework-page.tsx` (tor ekran):
 * filtr chiplari va guruhlar bo'yicha vazifa kartalari (`TaskCards`).
 */
export function StudentHomeworkPage() {
  const { t } = useTranslation("student");
  const ds = useDs();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const data = useStudentWorkspace();
  const toRow = useAssignmentRows();
  const [filter, setFilter] = useState<Filter>("all");

  const items = [...data.assignments].sort((a, b) => {
    const open = Number(Boolean(a.mySubmission)) - Number(Boolean(b.mySubmission));
    return open || (a.dueAt ?? "9999").localeCompare(b.dueAt ?? "9999");
  });
  const counts = FILTERS.reduce<Record<Filter, number>>(
    (acc, item) => ({ ...acc, [item]: item === "all" ? items.length : items.filter((row) => stateOf(row) === item).length }),
    { all: 0, open: 0, checking: 0, graded: 0 }
  );
  const chips = FILTERS.map((item) => ({ id: item, label: `${t(`workspace.homework.filters.${item}`)} · ${counts[item]}` }));
  const visible = items.filter((item) => filter === "all" || stateOf(item) === filter);
  const sections = data.courses.map((course) => ({ course, rows: visible.filter((item) => item.courseId === course.id) })).filter((section) => section.rows.length);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace(ROUTES.student.workspace as never));

  return (
    <View style={[styles.fill, { backgroundColor: ds.c.canvas }]}>
      <ScrollView
        style={styles.fill}
        contentContainerStyle={[styles.page, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }]}
        refreshControl={<PullRefresh onRefresh={() => queryClient.refetchQueries({ type: "active" })} />}
      >
        <DsGradient name="auth" />
        <MobilePageHeader title={t("workspace.homework.title")} backLabel={t("workspace.back")} onBack={goBack} />
        <MobileSegment scroll="auto" items={chips} value={filter} onChange={setFilter} />
        {data.assignmentsLoading ? (
          <View style={styles.list}>
            {Array.from({ length: 4 }, (_, index) => (
              <View key={index} style={[styles.skeleton, { backgroundColor: ds.c.surface }]} />
            ))}
          </View>
        ) : sections.length ? (
          sections.map(({ course, rows }) => (
            <View key={course.id} style={styles.section}>
              <DsText v="overline" c="ink-secondary" style={styles.upper}>
                {course.title}
              </DsText>
              <TaskCards rows={rows.map(toRow)} courseTitle={course.title} courseImage={course.avatarUrl} courseTone={course.color} />
            </View>
          ))
        ) : (
          <MobileEmptyCard icon="assign" title={t("workspace.homework.emptyTitle")} description={t("workspace.homework.emptyHint")} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  upper: { textTransform: "uppercase" },
  /* `gap-5 px-4 pt-5 pb-32` */
  page: { gap: 20, paddingHorizontal: 16 },
  section: { gap: 12 },
  list: { gap: 12 },
  skeleton: { height: 112, borderRadius: dsRadius.xl },
});
