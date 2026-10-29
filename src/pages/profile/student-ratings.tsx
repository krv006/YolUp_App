import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useCourses } from "@/modules/course";
import { Avatar, DsText, dsRadius, headingFont, Icon, MobileEmptyCard, MobileListSkeleton, useDs } from "@/shared/ui";
import { useStudentAssignments } from "@/pages/student/lib/use-student-assignments";
import { ProfileSubPage } from "./profile-shell";

const DAY_MS = 86_400_000;

function Stars({ value, size }: { value: number; size: number }) {
  const ds = useDs();
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.stars}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Icon key={star} name="star" size={size} color={star <= value ? ds.c["accent-saffron-fg"] : ds.c["line-strong"]} />
      ))}
    </View>
  );
}

/**
 * O'quvchining baholari — veb `student-ratings.tsx` (tor ekran): o'qituvchilar
 * bergan baholardan o'rtacha (yulduzlarda) va taqsimot, ostida so'nggi
 * baholar ro'yxati.
 */
export function StudentRatings() {
  const { t } = useTranslation("account");
  const months = useTranslation("lesson").t("list.months", { returnObjects: true }) as string[];
  const ds = useDs();
  const courses = useCourses();
  const groups = useMemo(() => courses.data ?? [], [courses.data]);
  const assignments = useStudentAssignments(groups);
  const loading = courses.isLoading || assignments.isLoading;

  const rows = assignments.data
    .filter((item) => item.mySubmission?.status === "done" && item.mySubmission.gradeValue !== null)
    .map((item) => {
      const submission = item.mySubmission!;
      const raw = submission.gradeValue as number;
      const course = groups.find((entry) => entry.id === item.courseId);
      return {
        id: item.id,
        teacher: course?.teacher ?? "",
        teacherTone: course?.teacherUser?.avatarTone,
        course: item.courseTitle || course?.title || "",
        at: submission.checkedAt ?? submission.createdAt,
        value: raw,
        stars: Math.max(1, Math.min(5, Math.round(item.grading === "hundred" ? raw / 20 : raw))),
        text: submission.resubmitComment || item.title,
      };
    })
    .sort((a, b) => b.at.localeCompare(a.at));

  const average = rows.length ? rows.reduce((sum, row) => sum + row.stars, 0) / rows.length : null;
  const bars = [5, 4, 3, 2, 1].map((stars) => ({ stars, count: rows.filter((row) => row.stars === stars).length })).filter((bar) => bar.count > 0);

  function when(value: string): string {
    const date = new Date(value);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    if (date >= start) return t("page.mobile.today");
    if (date.getTime() >= start.getTime() - DAY_MS) return t("page.mobile.yesterday");
    return `${date.getDate()}-${(months[date.getMonth()] ?? "").toLowerCase()}`;
  }

  if (!loading && !rows.length)
    return (
      <ProfileSubPage title={t("page.ratingsTitle")}>
        <MobileEmptyCard icon="star" title={t("page.mobile.noRatingsTitle")} description={t("page.studentNoRatingsHint")} />
      </ProfileSubPage>
    );

  return (
    <ProfileSubPage title={t("page.ratingsTitle")}>
      <View style={[styles.summary, { backgroundColor: ds.c.surface }]}>
        <View style={styles.summaryHead}>
          <DsText style={styles.average}>{average === null ? "—" : average.toFixed(1).replace(".", ",")}</DsText>
          <View style={styles.summaryMeta}>
            <Stars value={Math.round(average ?? 0)} size={20} />
            <DsText v="caption" w="400" c="ink-secondary">
              {t("page.ratingsCount", { count: rows.length })}
            </DsText>
          </View>
        </View>
        {bars.map((bar) => (
          <View key={bar.stars} style={styles.barRow}>
            <DsText v="caption" w="400" style={styles.barLabel}>
              {bar.stars}
            </DsText>
            <View style={[styles.barTrack, { backgroundColor: ds.c.subtle }]}>
              <View style={[styles.barFill, { width: `${(bar.count / rows.length) * 100}%`, backgroundColor: ds.c["accent-saffron-fg"] }]} />
            </View>
            <DsText v="caption" w="400" c="ink-secondary" style={styles.barCount}>
              {bar.count}
            </DsText>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <DsText v="title">{t("page.studentRatingsTitle")}</DsText>
        {loading ? (
          <MobileListSkeleton card rows={2} />
        ) : (
          <View style={[styles.list, { backgroundColor: ds.c.surface }]}>
            {rows.map((row, index) => (
              <View key={row.id} style={[styles.row, index > 0 && { borderTopWidth: 1, borderTopColor: ds.c.line }]}>
                <View style={styles.rowHead}>
                  <Avatar variant="legacy" name={row.teacher || row.course} tone={row.teacherTone} size="sm" box={32} />
                  <View style={styles.grow}>
                    <DsText v="body-sm" w="600" numberOfLines={1}>
                      {row.teacher || row.course}
                    </DsText>
                    <DsText v="caption" w="400" c="ink-secondary" numberOfLines={1}>
                      {t("page.studentRatingMeta", { course: row.course, when: when(row.at), value: row.value })}
                    </DsText>
                  </View>
                  <Stars value={row.stars} size={14} />
                </View>
                <DsText v="body-sm">{row.text}</DsText>
              </View>
            ))}
          </View>
        )}
      </View>
    </ProfileSubPage>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  stars: { flexDirection: "row", alignItems: "center", gap: 1 },
  /* `rounded-xl p-4 gap-3` */
  summary: { gap: 12, padding: 16, borderRadius: dsRadius.xl },
  summaryHead: { flexDirection: "row", alignItems: "center", gap: 16 },
  /* `font-heading text-[40px]/10 font-semibold` */
  average: { fontFamily: headingFont("600"), fontSize: 40, lineHeight: 44 },
  summaryMeta: { minWidth: 0, gap: 4 },
  barRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  barLabel: { width: 8 },
  barTrack: { flex: 1, minWidth: 0, height: 8, overflow: "hidden", borderRadius: 4 },
  barFill: { height: "100%", borderRadius: 4 },
  barCount: { width: 24, textAlign: "right" },
  section: { gap: 12 },
  list: { overflow: "hidden", borderRadius: dsRadius["2xl"] },
  /* `gap-2 px-4 py-3.5` */
  row: { gap: 8, paddingHorizontal: 16, paddingVertical: 14 },
  rowHead: { flexDirection: "row", alignItems: "center", gap: 10 },
});
