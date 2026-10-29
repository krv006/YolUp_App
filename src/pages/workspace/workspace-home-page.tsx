import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTeacherDashboard } from "@/modules/analytics";
import { useCourses } from "@/modules/course";
import { useExams } from "@/modules/exam";
import { homeworkApi, homeworkKeys } from "@/modules/homework";
import { useQuizzes } from "@/modules/quiz";
import { ROUTES } from "@/shared/config";
import {
  DsGradient,
  MobileListCard,
  MobileListRow,
  MobileRoundButton,
  MobileSectionTitle,
  MobileStatsCard,
  MobileTitleHeader,
  PopoverMenu,
  PopoverMenuItem,
  PullRefresh,
  useDs,
  usePopoverAnchor,
  type IconName,
} from "@/shared/ui";


const MODULES: ReadonlyArray<{ id: string; icon: IconName; tone: string; to: string }> = [
  { id: "tests", icon: "quiz", tone: "bg-accent-blue-bg text-accent-blue-fg", to: ROUTES.teacher.tests },
  { id: "analytics", icon: "bar-chart", tone: "bg-accent-green-bg text-accent-green-fg", to: ROUTES.teacher.workspaceAnalytics },
  { id: "ai", icon: "sparkles-fill", tone: "bg-accent-saffron-bg text-accent-saffron-fg", to: ROUTES.teacher.workspaceAi },
  { id: "mock", icon: "assignment-check-fill", tone: "bg-accent-violet-bg text-accent-violet-fg", to: ROUTES.teacher.mockExams },
  { id: "assignments", icon: "assign", tone: "bg-accent-red-bg text-accent-red-fg", to: ROUTES.teacher.homework },
  { id: "materials", icon: "folder", tone: "bg-accent-violet-bg text-accent-red-fg", to: ROUTES.teacher.materials },
];

const CREATE: ReadonlyArray<{ id: string; icon: IconName; to: string }> = [
  { id: "test", icon: "quiz", to: `${ROUTES.teacher.tests}?new=1` },
  { id: "homework", icon: "assign", to: `${ROUTES.teacher.homework}?new=1` },
  { id: "mock", icon: "assignment-check-fill", to: `${ROUTES.teacher.mockExams}?new=1` },
  { id: "ai", icon: "sparkles-fill", to: ROUTES.teacher.workspaceAi },
];

/**
 * O'qituvchining Workspace bosh sahifasi — veb `workspace-home-page.tsx` +
 * `mobile-workspace-home.tsx` (tor ekran): sarlavha va "+" menyusi (test,
 * vazifa, mock, AI), ko'k umumiy ko'rinish kartasi (tekshirilmagan ishlar,
 * testlar, mock imtihonlar) va modullar ro'yxati.
 */
export function WorkspaceHomePage() {
  const { t } = useTranslation("workspace");
  const ds = useDs();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { anchorRef, rect, open, close } = usePopoverAnchor();
  const courses = useCourses();
  const quizzes = useQuizzes(null);
  const exams = useExams(null);
  const dashboard = useTeacherDashboard();

  const groups = useMemo(() => courses.data ?? [], [courses.data]);
  const assignmentQueries = useQueries({
    queries: groups.map((course) => ({
      queryKey: homeworkKeys.assignments(course.id),
      queryFn: ({ signal }: { signal: AbortSignal }) => homeworkApi.getAssignments(course.id, { signal }),
    })),
  });
  const assignments = assignmentQueries.flatMap((query) => query.data ?? []);
  // 🟡 Vebdan farqi: ro'yxat API'si `submissions` ni qaytarmaydi, shuning uchun hisob doim 0 chiqardi — asosiy sahifadagi kabi server soni.
  const unchecked = dashboard.data?.submissionsPending ?? assignments.reduce((sum, item) => sum + item.submissions.filter((entry) => !entry.grade).length, 0);

  function refresh() {
    return Promise.all([courses.refetch(), quizzes.refetch(), exams.refetch(), dashboard.refetch(), ...assignmentQueries.map((query) => query.refetch())]);
  }

  return (
    <View style={[styles.fill, { backgroundColor: ds.c.canvas }]}>
      <ScrollView
        style={styles.fill}
        contentContainerStyle={[styles.page, { paddingTop: insets.top + 22 }]}
        refreshControl={<PullRefresh onRefresh={refresh} />}
      >
        <DsGradient name="auth" />
        <MobileTitleHeader
          eyebrow={t("home.mobile.eyebrow")}
          title={t("title")}
          action={
            <View ref={anchorRef} collapsable={false}>
              <MobileRoundButton icon="add" iconSize={24} label={t("home.mobile.create")} onPress={open} />
              <PopoverMenu rect={rect} onClose={close} height={CREATE.length * 44 + 12}>
                {CREATE.map((item) => (
                  <PopoverMenuItem
                    key={item.id}
                    icon={item.icon}
                    label={t(`home.mobile.createItems.${item.id}`)}
                    onPress={() => {
                      close();
                      router.push(item.to as never);
                    }}
                  />
                ))}
              </PopoverMenu>
            </View>
          }
        />

        <MobileStatsCard
          label={t("home.mobile.overview")}
          actionLabel={t("home.mobile.details")}
          onAction={() => router.push(ROUTES.teacher.workspaceAnalytics as never)}
          items={[
            { id: "unchecked", value: unchecked, label: t("home.mobile.stats.unchecked") },
            { id: "tests", value: quizzes.data?.length ?? 0, label: t("home.mobile.stats.tests") },
            { id: "mock", value: exams.data?.length ?? 0, label: t("home.mobile.stats.mock") },
          ]}
        />

        <View style={styles.section}>
          <MobileSectionTitle>{t("home.modules")}</MobileSectionTitle>
          <MobileListCard>
            {MODULES.map((module, index) => (
              <MobileListRow
                key={module.id}
                icon={module.icon}
                tone={module.tone}
                title={t(`home.mobile.modules.${module.id}.title`)}
                subtitle={t(`home.mobile.modules.${module.id}.description`)}
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
  /* `gap-5.5 px-4 pt-5.5` */
  page: { gap: 22, paddingHorizontal: 16, paddingBottom: 24 },
  section: { gap: 12 },
});
