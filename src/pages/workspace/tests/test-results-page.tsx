import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCourses, useCourseStudents } from "@/modules/course";
import { QuizAttemptsDrawer, quizDisplayTitle, useQuiz, useQuizAttempts } from "@/modules/quiz";
import { ROUTES } from "@/shared/config";
import {
  Avatar,
  DsGradient,
  DsText,
  dsRadius,
  MobileListCard,
  MobileListRow,
  MobileListSkeleton,
  MobileRoundButton,
  MobileTitleHeader,
  PullRefresh,
  useDs,
  type DsColor,
} from "@/shared/ui";

interface Row {
  id: string;
  name: string;
  attempts: number;
  percent: number | null;
  durationSeconds: number | null;
}

function percentTone(value: number): DsColor {
  if (value >= 90) return "success-fg";
  if (value >= 70) return "ink";
  return "warning-fg";
}

/**
 * Test natijalari — veb `test-results-page.tsx` + `mobile-test-results.tsx`
 * (tor ekran): orqaga va urinishlar tugmasi, guruh va savollar soni,
 * uchta katak (yechganlar, o'rtacha, eng yaxshi) va o'quvchilar ro'yxati
 * (eng yaxshi foiz, urinishlar, vaqt).
 */
export function TestResultsPage() {
  const { t } = useTranslation("quiz");
  const ds = useDs();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { quizId = null } = useLocalSearchParams<{ quizId: string }>();
  const [attemptsOpen, setAttemptsOpen] = useState(false);
  const quiz = useQuiz(quizId);
  const courses = useCourses();
  const attempts = useQuizAttempts(quizId, Boolean(quizId));
  const students = useCourseStudents(quiz.data?.courseId ?? null, { page_size: 100 });

  const rows = useMemo<Row[]>(() => {
    const byStudent = new Map<string, Row>();
    for (const item of students.data?.items ?? []) {
      byStudent.set(item.student.id, { id: item.student.id, name: item.student.name, attempts: 0, percent: null, durationSeconds: null });
    }
    for (const attempt of attempts.data ?? []) {
      const current = byStudent.get(attempt.studentId) ?? { id: attempt.studentId, name: attempt.studentName, attempts: 0, percent: null, durationSeconds: null };
      const percent = attempt.maxScore ? Math.round((attempt.score / attempt.maxScore) * 100) : null;
      byStudent.set(attempt.studentId, {
        ...current,
        name: current.name || attempt.studentName,
        attempts: current.attempts + 1,
        percent: current.percent === null ? percent : Math.max(current.percent, percent ?? 0),
        durationSeconds: attempt.durationSeconds ?? current.durationSeconds,
      });
    }
    return [...byStudent.values()].sort((a, b) => (b.percent ?? -1) - (a.percent ?? -1));
  }, [attempts.data, students.data]);

  const solved = rows.filter((row) => row.attempts > 0);
  const average = solved.length ? Math.round(solved.reduce((sum, row) => sum + (row.percent ?? 0), 0) / solved.length) : null;
  const best = solved.length ? Math.max(...solved.map((row) => row.percent ?? 0)) : null;
  const courseTitle = (courses.data ?? []).find((course) => course.id === quiz.data?.courseId)?.title ?? "";
  const loading = attempts.isLoading || students.isLoading;

  const stats: Array<{ id: string; value: string; label: string; tone: DsColor }> = [
    { id: "solved", value: `${solved.length}/${rows.length}`, label: t("results.solved"), tone: "ink" },
    { id: "average", value: average === null ? "—" : `${average}%`, label: t("results.average"), tone: "brand-strong" },
    { id: "best", value: best === null ? "—" : `${best}%`, label: t("results.best"), tone: "success" },
  ];

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace(ROUTES.teacher.tests as never);
  }

  return (
    <View style={[styles.fill, { backgroundColor: ds.c.canvas }]}>
      <ScrollView
        style={styles.fill}
        contentContainerStyle={[styles.page, { paddingTop: insets.top + 22, paddingBottom: insets.bottom + 32 }]}
        refreshControl={<PullRefresh onRefresh={() => Promise.all([quiz.refetch(), attempts.refetch(), students.refetch()])} />}
      >
        <DsGradient name="auth" />
        <View style={styles.header}>
          <MobileRoundButton icon="chevron-left" label={t("tests.mobile.back")} onPress={goBack} />
          <MobileRoundButton icon="assign" label={t("tests.attempts")} onPress={() => setAttemptsOpen(true)} />
        </View>

        <View style={styles.title}>
          <MobileTitleHeader
            eyebrow={[courseTitle, t("tests.questionCount", { count: quiz.data?.questionCount ?? 0 })].filter(Boolean).join(" · ")}
            title={quiz.data ? quizDisplayTitle(quiz.data) : ""}
          />
        </View>

        {/* `mt-5.5 grid grid-cols-3 gap-2`, katak `h-[63px] rounded-lg bg-surface px-3` */}
        <View style={styles.stats}>
          {stats.map((stat) => (
            <View key={stat.id} style={styles.statCell}>
              <View style={[styles.stat, { backgroundColor: ds.c.surface }]}>
                <DsText w="600" c={stat.tone} numberOfLines={1} style={styles.statValue}>
                  {stat.value}
                </DsText>
                <DsText v="body-xs" c="ink-secondary" numberOfLines={1}>
                  {stat.label}
                </DsText>
              </View>
            </View>
          ))}
        </View>

        {loading ? (
          <MobileListSkeleton card rows={4} style={styles.list} />
        ) : rows.length ? (
          <MobileListCard style={styles.list}>
            {rows.map((row, index) => (
              <MobileListRow
                key={row.id}
                chevron={false}
                last={index === rows.length - 1}
                leading={<Avatar variant="legacy" name={row.name} size="sm" box={44} />}
                title={row.name}
                subtitle={
                  row.attempts
                    ? [
                        t("results.mobile.attempt", { count: row.attempts }),
                        row.durationSeconds ? t("results.mobile.minutes", { count: Math.max(1, Math.round(row.durationSeconds / 60)) }) : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")
                    : t("results.mobile.notSolved")
                }
                trailing={
                  row.percent === null ? (
                    <View accessibilityLabel={t("results.mobile.notSolved")} style={[styles.dash, { backgroundColor: ds.c["ink-secondary"] }]} />
                  ) : (
                    <DsText v="title" heading c={percentTone(row.percent)}>
                      {row.percent}%
                    </DsText>
                  )
                }
              />
            ))}
          </MobileListCard>
        ) : (
          <View style={[styles.list, styles.empty, { backgroundColor: ds.c.surface }]}>
            <DsText v="body-sm" c="ink-secondary" style={styles.center}>
              {t("results.empty")}
            </DsText>
          </View>
        )}
      </ScrollView>

      <QuizAttemptsDrawer
        open={attemptsOpen}
        onOpenChange={setAttemptsOpen}
        title={quiz.data ? quizDisplayTitle(quiz.data) : ""}
        subtitle={t("attemptsDrawer.unlimited")}
        attempts={attempts.data ?? []}
        students={rows.map((row) => ({ id: row.id, name: row.name }))}
        loading={attempts.isLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { textAlign: "center" },
  page: { paddingHorizontal: 16 },
  header: { height: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { marginTop: 14 },
  stats: { marginTop: 22, flexDirection: "row", gap: 8 },
  statCell: { flex: 1, flexBasis: 0 },
  stat: { height: 63, justifyContent: "center", paddingHorizontal: 12, borderRadius: dsRadius.lg },
  statValue: { fontSize: 20, lineHeight: 24 },
  list: { marginTop: 20 },
  empty: { paddingHorizontal: 20, paddingVertical: 40, borderRadius: dsRadius.xl },
  dash: { width: 16, height: 2, borderRadius: 1 },
});
