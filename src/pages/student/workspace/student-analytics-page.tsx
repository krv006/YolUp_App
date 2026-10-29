import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { startOfWeek } from "date-fns";
import { useLessons } from "@/modules/lesson";
import { ROUTES } from "@/shared/config";
import { DsGradient, DsText, dsRadius, GroupTile, headingFont, Icon, MobilePageHeader, useDs, type DsColor } from "@/shared/ui";
import { monthAttendanceRate } from "../lib/attendance-rate";
import { useStudentWorkspace } from "./use-student-workspace";

const WEEKS = 8;
const WEEK_MS = 7 * 86_400_000;
const CHART_HEIGHT = 220;

function decimal(value: number): string {
  return value.toFixed(1).replace(".", ",");
}

/**
 * O'quvchining tahlili — veb `student-analytics-page.tsx` (tor ekran):
 * to'rtta ko'rsatkich (o'rtacha baho, darslar, davomat, vazifalar), oxirgi
 * 8 haftadagi test natijalari ustunlari va fanlar bo'yicha ro'yxat.
 */
export function StudentAnalyticsPage() {
  const { t } = useTranslation("student");
  const ds = useDs();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const data = useStudentWorkspace();
  const { now } = data;
  const lessons = useLessons({ page_size: 200 });

  const grades = data.assignments.map((item) => item.mySubmission?.gradeValue ?? null).filter((value): value is number => value !== null);
  const avgGrade = grades.length ? grades.reduce((sum, value) => sum + value, 0) / grades.length : null;

  const finished = (lessons.data ?? []).filter((lesson) => lesson.status === "finished");
  const attended = finished.filter((lesson) => lesson.attended === true).length;
  const rate = monthAttendanceRate(lessons.data ?? [], now);

  const due = data.assignments.filter((item) => item.mySubmission || (item.dueAt && new Date(item.dueAt).getTime() < now.getTime()));
  const onTime = due.filter((item) => item.mySubmission && (!item.dueAt || new Date(item.mySubmission.createdAt).getTime() <= new Date(item.dueAt).getTime())).length;
  const localHomeworkRate = due.length ? Math.round((onTime / due.length) * 100) : null;
  // Veb #162: server umumiy ko'rsatkichlari bo'lsa — ular, aks holda ro'yxatlardan hisob.
  const overview = data.overview;
  const shownGrade = overview ? overview.avgGrade : avgGrade;
  const gradeCount = overview ? overview.gradesCount : grades.length;
  const shownAttended = overview ? overview.lessonsAttended : attended;
  const shownMissed = overview ? overview.lessonsMissed : finished.length - attended;
  const shownRate = overview ? overview.attendanceRateMonth : rate;
  const homeworkRate = overview ? overview.homeworkOnTimeRate : localHomeworkRate;
  const courseStats = new Map((overview?.courses ?? []).map((item) => [item.courseId, item]));

  const weeks = useMemo(() => {
    const first = startOfWeek(new Date(now.getTime() - (WEEKS - 1) * WEEK_MS), { weekStartsOn: 1 }).getTime();
    return Array.from({ length: WEEKS }, (_, index) => {
      const start = first + index * WEEK_MS;
      const items = data.attempts.filter((attempt) => {
        const time = new Date(attempt.takenAt).getTime();
        return time >= start && time < start + WEEK_MS && attempt.percentage !== null;
      });
      return items.length ? Math.round(items.reduce((sum, attempt) => sum + (attempt.percentage ?? 0), 0) / items.length) : null;
    });
  }, [data.attempts, now]);

  const subjects = data.courses.map((course) => {
    const tests = data.attempts.filter((attempt) => attempt.courseTitle === course.title && attempt.percentage !== null);
    const marks = data.assignments
      .filter((item) => item.courseId === course.id)
      .map((item) => item.mySubmission?.gradeValue ?? null)
      .filter((value): value is number => value !== null);
    const server = courseStats.get(course.id);
    return {
      course,
      test: server
        ? server.testAvg === null
          ? null
          : Math.round(server.testAvg)
        : tests.length
          ? Math.round(tests.reduce((sum, attempt) => sum + (attempt.percentage ?? 0), 0) / tests.length)
          : null,
      grade: server ? server.gradeAvg : marks.length ? marks.reduce((sum, value) => sum + value, 0) / marks.length : null,
    };
  });

  const stats: Array<{ id: string; value: string; hint: string; tone: DsColor }> = [
    { id: "grade", value: shownGrade === null ? "—" : decimal(shownGrade), hint: t("workspace.analytics.stats.gradeHint", { count: gradeCount }), tone: "success-fg" },
    { id: "lessons", value: !overview && lessons.isLoading ? "—" : String(shownAttended), hint: t("workspace.analytics.stats.lessonsHint", { count: shownMissed }), tone: "ink" },
    { id: "attendance", value: shownRate === null ? "—" : `${shownRate}%`, hint: t("workspace.analytics.stats.attendanceHint"), tone: "ink" },
    { id: "homework", value: homeworkRate === null ? "—" : `${homeworkRate}%`, hint: t("workspace.analytics.stats.homeworkHint"), tone: "brand" },
  ];

  const goBack = () => (router.canGoBack() ? router.back() : router.replace(ROUTES.student.workspace as never));

  return (
    <View style={[styles.fill, { backgroundColor: ds.c.canvas }]}>
      <ScrollView style={styles.fill} contentContainerStyle={[styles.page, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }]}>
        <DsGradient name="auth" />
        <MobilePageHeader title={t("workspace.analytics.title")} backLabel={t("workspace.back")} onBack={goBack} />

        <View style={styles.statGrid}>
          {stats.map((stat) => (
            <View key={stat.id} style={[styles.stat, { backgroundColor: ds.c.surface }]}>
              <DsText v="body-xs" c="ink-secondary" numberOfLines={1}>
                {t(`workspace.analytics.stats.${stat.id}`)}
              </DsText>
              <DsText c={stat.tone} numberOfLines={1} style={styles.statValue}>
                {stat.value}
              </DsText>
              <DsText v="caption" w="400" c="ink-secondary" numberOfLines={1}>
                {stat.hint}
              </DsText>
            </View>
          ))}
        </View>

        <View style={[styles.card, { backgroundColor: ds.c.surface }]}>
          <View style={[styles.chartHead, { borderBottomColor: ds.c.line }]}>
            <DsText v="title" numberOfLines={1} style={styles.grow}>
              {t("workspace.analytics.chart.title")}
            </DsText>
            <DsText v="body-xs" w="500" c="brand">
              {t("workspace.analytics.chart.range")}
            </DsText>
          </View>
          {weeks.some((value) => value !== null) ? (
            <View style={styles.chart}>
              {[0.25, 0.5, 0.75].map((line) => (
                <View key={line} style={[styles.gridLine, { bottom: CHART_HEIGHT * line, backgroundColor: ds.c.line }]} />
              ))}
              <View style={styles.bars}>
                {weeks.map((value, index) => (
                  <View key={index} style={styles.bar}>
                    {value !== null ? <DsText v="caption-strong">{value}</DsText> : null}
                    <View style={[styles.barFill, { height: value === null ? 0 : Math.max(6, (value / 100) * CHART_HEIGHT), backgroundColor: ds.c.brand }]} />
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <DsText v="body-sm" c="ink-secondary" style={styles.chartEmpty}>
              {t("workspace.analytics.chart.empty")}
            </DsText>
          )}
        </View>

        <View style={[styles.card, styles.subjects, { backgroundColor: ds.c.surface }]}>
          <DsText v="title">{t("workspace.analytics.subjects.title")}</DsText>
          {subjects.length ? (
            subjects.map(({ course, test, grade }) => (
              <View key={course.id} style={styles.subject}>
                <GroupTile name={course.title} tone={course.color} src={course.avatarUrl} box={36} radius={dsRadius.lg} />
                <View style={styles.grow}>
                  <DsText v="body-sm" w="600" numberOfLines={1}>
                    {course.title}
                  </DsText>
                  <DsText v="caption" w="400" c="ink-secondary" numberOfLines={1}>
                    {[course.teacher, test === null ? "" : t("workspace.analytics.subjects.test", { value: test })].filter(Boolean).join(" · ")}
                  </DsText>
                </View>
                {grade !== null ? (
                  <View style={styles.grade}>
                    <Icon name="star" size={16} color={ds.c["warning-fg"]} />
                    <DsText v="body-sm" w="600" c="warning-fg">
                      {decimal(grade)}
                    </DsText>
                  </View>
                ) : null}
              </View>
            ))
          ) : (
            <DsText v="body-sm" c="ink-secondary">
              {t("workspace.analytics.subjects.empty")}
            </DsText>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  /* `gap-5 px-4 pt-5 pb-32` */
  page: { gap: 20, paddingHorizontal: 16 },
  /* `grid-cols-2 gap-3`, karta `rounded-2xl p-4 gap-1` */
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  stat: { width: "48%", flexGrow: 1, minWidth: 0, gap: 4, padding: 16, borderRadius: dsRadius["2xl"] },
  statValue: { fontFamily: headingFont("600"), fontSize: 28, lineHeight: 36 },
  card: { padding: 16, borderRadius: dsRadius["2xl"] },
  chartHead: { flexDirection: "row", alignItems: "center", gap: 12, paddingBottom: 16, borderBottomWidth: 1 },
  chart: { marginTop: 16, height: CHART_HEIGHT + 24 },
  gridLine: { position: "absolute", left: 0, right: 0, height: 1 },
  /* `absolute inset-0 flex items-end justify-between gap-2 px-2.5` */
  bars: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 8, paddingHorizontal: 10 },
  bar: { width: 40, minWidth: 0, flexShrink: 1, alignItems: "center", justifyContent: "flex-end", gap: 4 },
  barFill: { width: "100%", borderTopLeftRadius: dsRadius.lg, borderTopRightRadius: dsRadius.lg },
  chartEmpty: { paddingVertical: 64, textAlign: "center" },
  subjects: { gap: 12 },
  subject: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 12 },
  grade: { flexDirection: "row", alignItems: "center", gap: 4 },
});
