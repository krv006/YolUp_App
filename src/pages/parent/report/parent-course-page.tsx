import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { parentHome, parentResults } from "@/modules/parent";
import { ROUTES } from "@/shared/config";
import { DsText, MobilePageHeader, useDs } from "@/shared/ui";
import { ParentScreen, useParentBack } from "@/widgets/parent-shell";
import { ScoreCard } from "../dashboard/home-side";
import { useHomeworkView } from "../homework/use-homework-view";
import { CourseRank, GradeRow } from "./results-parts";

const RADIUS = 38;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Fan natijalari — veb `parent-course-page.tsx` (faqat telefon): o'rtacha ball halqasi, o'rin, dinamika, baholar. */
export function ParentCoursePage({ courseId }: { courseId: string }) {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const back = useParentBack(ROUTES.parent.grades);
  const view = useHomeworkView();

  const course = view.courseById.get(courseId);
  const assignments = view.assignments.filter((item) => item.courseId === courseId);
  const row = parentResults.subjectRows(assignments, new Map(course ? [[courseId, course.title]] : []))[0];
  const points = parentHome.gradedScores(assignments);
  const graded = assignments.filter((item) => item.mySubmission).sort((a, b) => (b.mySubmission?.createdAt ?? "").localeCompare(a.mySubmission?.createdAt ?? ""));
  const average = row?.average ?? null;
  const title = course?.title || assignments[0]?.courseTitle || "";

  return (
    <ParentScreen onRefresh={async () => view.retry()}>
      <MobilePageHeader title={title} backLabel={t("results.title")} onBack={back} />
      {view.loading ? (
        <View style={[styles.skeleton, { backgroundColor: ds.c.surface }]} />
      ) : (
        <>
          <View style={[styles.summary, { backgroundColor: ds.c.surface }]}>
            <View style={styles.ring}>
              <Svg width={88} height={88} viewBox="0 0 88 88" style={styles.ringSvg}>
                <Circle cx={44} cy={44} r={RADIUS} fill="none" strokeWidth={8} stroke={ds.c["success-bg"]} />
                {average !== null ? (
                  <Circle
                    cx={44}
                    cy={44}
                    r={RADIUS}
                    fill="none"
                    strokeWidth={8}
                    strokeLinecap="round"
                    stroke={ds.c.success}
                    strokeDasharray={`${(average / 10) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                  />
                ) : null}
              </Svg>
              <DsText v="h2" heading w="600" style={styles.ringValue}>
                {average ?? "—"}
              </DsText>
            </View>
            <View style={styles.summaryText}>
              <DsText v="title-lg" heading>
                {t("results.panel.average")}
              </DsText>
              <DsText v="body-xs" c="ink-secondary">
                {[course?.teacher, row ? t("results.panel.counts", { submitted: row.submitted, total: row.total, graded: points.length }) : ""].filter(Boolean).join(" · ")}
              </DsText>
              <CourseRank childId={view.child?.id ?? null} courseId={courseId} now={view.now} />
            </View>
          </View>
          {points.length ? <ScoreCard trend={parentHome.scoreTrend(points, view.now, 6)} delta={null} gradientId="course-mobile-fill" /> : null}
          <DsText v="title-lg" heading style={styles.heading}>
            {t("results.panel.grades")}
          </DsText>
          {graded.length ? (
            <View style={[styles.list, { backgroundColor: ds.c.surface }]}>
              {graded.map((assignment, index) => (
                <GradeRow key={assignment.id} assignment={assignment} last={index === graded.length - 1} />
              ))}
            </View>
          ) : (
            <DsText v="body-sm" c="ink-tertiary" style={[styles.empty, { backgroundColor: ds.c.surface }]}>
              {t("results.panel.noGrades")}
            </DsText>
          )}
        </>
      )}
    </ParentScreen>
  );
}

const styles = StyleSheet.create({
  skeleton: { height: 360, borderRadius: 20 },
  summary: { flexDirection: "row", alignItems: "center", gap: 16, padding: 16, borderRadius: 20 },
  ring: { width: 88, height: 88, alignItems: "center", justifyContent: "center" },
  ringSvg: { position: "absolute", transform: [{ rotate: "-90deg" }] },
  /* `font-heading text-[22px]/7 font-semibold` */
  ringValue: { fontSize: 22, lineHeight: 28 },
  summaryText: { flex: 1, minWidth: 0, gap: 4 },
  heading: { paddingHorizontal: 4 },
  list: { overflow: "hidden", borderRadius: 20 },
  empty: { paddingHorizontal: 16, paddingVertical: 32, textAlign: "center", borderRadius: 20, overflow: "hidden" },
});
