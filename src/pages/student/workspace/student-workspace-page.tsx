import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMaterials } from "@/modules/material";
import { ROUTES } from "@/shared/config";
import { DsGradient, MobileListCard, MobileListRow, MobileSectionTitle, MobileStatsCard, MobileTitleHeader, PullRefresh, useDs, type IconName } from "@/shared/ui";
import { shortDateTime } from "../lib/format";
import { useStudentWorkspace } from "./use-student-workspace";

type ModuleId = "tests" | "assignments" | "mock" | "ai" | "analytics" | "materials";

const MODULES: ReadonlyArray<{ id: ModuleId; icon: IconName; tone: string; to: string }> = [
  { id: "tests", icon: "quiz", tone: "bg-accent-blue-bg text-accent-blue-fg", to: ROUTES.student.tests },
  { id: "assignments", icon: "assign", tone: "bg-accent-saffron-bg text-accent-saffron-fg", to: ROUTES.student.homework },
  { id: "mock", icon: "emoji-events", tone: "bg-accent-red-bg text-accent-red-fg", to: ROUTES.student.mockExams },
  { id: "ai", icon: "auto-awesome", tone: "bg-accent-violet-bg text-accent-violet-fg", to: ROUTES.student.ai },
  { id: "analytics", icon: "bar-chart", tone: "bg-accent-green-bg text-accent-green-fg", to: ROUTES.student.workspaceAnalytics },
  { id: "materials", icon: "folder", tone: "bg-accent-blue-bg text-accent-blue-fg", to: ROUTES.student.materials },
];

/**
 * O'quvchining Workspace bosh sahifasi — veb `student-workspace-page.tsx`
 * (tor ekran): sarlavha, umumiy holat kartasi (yangi testlar, vazifalar,
 * o'rtacha natija) va modullar ro'yxati.
 */
export function StudentWorkspacePage() {
  const { t } = useTranslation("student");
  const { t: tw } = useTranslation("workspace");
  const months = useTranslation("lesson").t("list.months", { returnObjects: true }) as string[];
  const ds = useDs();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const data = useStudentWorkspace();
  const materials = useMaterials({});

  const fresh = data.quizzes.filter((quiz) => !data.attemptByQuiz.has(quiz.id));
  const open = data.assignments.filter((item) => !item.mySubmission);
  const nextExam =
    data.exams.find((exam) => exam.state === "running") ??
    [...data.exams].filter((exam) => exam.state === "upcoming").sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0] ??
    null;
  const examLabel = nextExam ? shortDateTime(nextExam.startsAt, months) : t("workspace.counts.mockNone");
  const average = data.avgPercentage === null ? "—" : `${Math.round(data.avgPercentage)}%`;
  const loading = data.quizzesLoading || data.assignmentsLoading;

  const counts: Record<ModuleId, string> = {
    tests: t("workspace.counts.tests", { count: fresh.length }),
    assignments: t("workspace.counts.assignments", { count: open.length }),
    mock: examLabel,
    ai: t("workspace.counts.ai"),
    analytics: t("workspace.counts.analytics", { value: average }),
    materials: t("workspace.counts.materials", { count: materials.data?.length ?? 0 }),
  };

  return (
    <View style={[styles.fill, { backgroundColor: ds.c.canvas }]}>
      <ScrollView
        style={styles.fill}
        contentContainerStyle={[styles.page, { paddingTop: insets.top + 22 }]}
        refreshControl={<PullRefresh onRefresh={() => queryClient.refetchQueries({ type: "active" })} />}
      >
        <DsGradient name="auth" />
        <MobileTitleHeader eyebrow={t("workspace.mobile.eyebrow")} title={tw("title")} />
        <MobileStatsCard
          label={t("workspace.mobile.overview")}
          actionLabel={t("workspace.mobile.details")}
          onAction={() => router.push(ROUTES.student.workspaceAnalytics as never)}
          items={[
            { id: "tests", value: loading ? "—" : fresh.length, label: t("workspace.mobile.stats.tests") },
            { id: "assignments", value: loading ? "—" : open.length, label: t("workspace.mobile.stats.assignments") },
            { id: "average", value: average, label: t("workspace.mobile.stats.average") },
          ]}
        />
        <View style={styles.section}>
          <MobileSectionTitle>{t("workspace.modulesTitle")}</MobileSectionTitle>
          <MobileListCard>
            {MODULES.map((module, index) => (
              <MobileListRow
                key={module.id}
                icon={module.icon}
                tone={module.tone}
                title={t(`workspace.modules.${module.id}.title`)}
                subtitle={counts[module.id]}
                last={index === MODULES.length - 1}
                onPress={() => router.push(module.to as never)}
              />
            ))}
          </MobileListCard>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  /* `gap-5.5 px-4 pt-5.5 pb-32` */
  page: { gap: 22, paddingHorizontal: 16, paddingBottom: 24 },
  section: { gap: 12 },
});
