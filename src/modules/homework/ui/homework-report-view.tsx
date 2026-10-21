import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { BarChart3, BookOpen, ListChecks, TrendingUp } from "lucide-react-native";
import type { CourseHomeworkReport, HomeworkReport } from "@/shared/types";
import { PortalCard, PortalEmpty, PortalMetric, PortalSectionHead, Text, useLegacyColors, useTheme } from "@/shared/ui";

function scoreLabel(score: number | null): string {
  return score == null ? "—" : String(Math.round(score));
}

/**
 * Uy vazifasi hisoboti — veb `homework-report-view.tsx`: to'rtta
 * ko'rsatkich (tor ekranda bir ustun) va har bir kurs bo'yicha topshirish
 * ulushi chizig'i.
 */
export function HomeworkReportView({ report }: { report: HomeworkReport }) {
  const { t } = useTranslation("homework");
  const { overall, courses } = report;

  return (
    <View style={styles.report}>
      <View style={styles.metrics}>
        <PortalMetric icon={BookOpen} tone="blue" value={overall.assignedCount} label={t("report.assignedCount")} />
        <PortalMetric
          icon={ListChecks}
          tone="violet"
          value={`${overall.submissionRate}%`}
          label={t("report.submittedRate", { submitted: overall.submittedCount, assigned: overall.assignedCount })}
        />
        <PortalMetric icon={TrendingUp} tone="emerald" value={scoreLabel(overall.averageScore)} label={t("report.averageScore")} />
        <PortalMetric icon={BarChart3} tone="amber" value={courses.length} label={t("report.subjectsCount")} />
      </View>

      {/* `.homework-report-list` — 20 bo'shliq */}
      <PortalCard style={styles.list}>
        <View style={styles.head}>
          <PortalSectionHead eyebrow={t("report.bySubjectEyebrow")} title={t("report.bySubjectTitle")} />
        </View>
        {courses.map((course, index) => (
          <CourseReportRow key={course.courseId} course={course} last={index === courses.length - 1} />
        ))}
        {!courses.length ? (
          <PortalEmpty icon={BookOpen} title={t("report.emptyTitle")} description={t("report.emptyDescription")} />
        ) : null}
      </PortalCard>
    </View>
  );
}

function CourseReportRow({ course, last }: { course: CourseHomeworkReport; last: boolean }) {
  const { t } = useTranslation("homework");
  const { palette } = useTheme();
  const colors = useLegacyColors();
  const rate = Math.min(100, Math.max(0, course.submissionRate));
  const score = course.averageScore;
  // `.grade-pill` ohanglari: 80+ yashil, 50+ sariq, past — qizil, baho yo'q — yashil.
  const tone =
    score == null || score >= 80
      ? { fg: palette["tone-emerald-fg"], bg: palette["success-soft"] }
      : score >= 50
        ? { fg: palette["warning-strong"], bg: palette["warning-soft"] }
        : { fg: palette["destructive-strong"], bg: palette["destructive-soft"] };

  return (
    <View style={[styles.row, !last && { borderBottomWidth: 1, borderColor: colors.border }]}>
      <View style={styles.rowHead}>
        <Text variant="label" style={styles.course}>
          {course.courseTitle}
        </Text>
        <Text variant="caption" style={[styles.pill, { color: tone.fg, backgroundColor: tone.bg }]}>
          {score == null ? t("report.noGrade") : `${scoreLabel(score)} ${t("report.pointsSuffix")}`}
        </Text>
      </View>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel={t("report.progressAria", { course: course.courseTitle, rate })}
        accessibilityValue={{ min: 0, max: 100, now: rate }}
        style={[styles.progress, { backgroundColor: palette["primary-soft"] }]}
      >
        <View style={[styles.progressFill, { width: `${rate}%`, backgroundColor: palette.primary }]} />
      </View>
      <Text variant="caption" style={[styles.small, { color: colors.muted }]}>
        {t("report.submittedOf", { submitted: course.submittedCount, assigned: course.assignedCount, rate })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  /* `.homework-report` — orasi 18 */
  report: { gap: 18 },
  metrics: { gap: 10 },
  list: { padding: 20, gap: 4 },
  head: { marginBottom: 14 },
  /* `.homework-report-row` — 14 4, orasi 8 */
  row: { gap: 8, paddingVertical: 14, paddingHorizontal: 4 },
  rowHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  course: { flex: 1, minWidth: 0, fontSize: 14, fontWeight: "700" },
  pill: { overflow: "hidden", paddingVertical: 7, paddingHorizontal: 10, borderRadius: 999, fontSize: 12, lineHeight: 18, fontWeight: "700" },
  progress: { height: 8, overflow: "hidden", borderRadius: 999 },
  progressFill: { height: "100%", borderRadius: 999 },
  small: { fontSize: 11, lineHeight: 16.5 },
});
