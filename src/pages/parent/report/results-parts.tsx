import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useChildRank } from "@/modules/parent";
import { formatLocalized } from "@/shared/lib";
import type { Assignment } from "@/shared/types";
import { DsText, dsRadius, Icon, useDs } from "@/shared/ui";

/** Guruhdagi o'rni — veb `results-parts.tsx` `CourseRank` (oylik reyting). */
export function CourseRank({ childId, courseId, now }: { childId: string | null; courseId: string; now: number }) {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const date = new Date(now);
  const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  const rank = useChildRank(childId, courseId, month);
  const data = rank.data;
  if (!data || data.rank === null || !data.total) return null;
  return (
    <View style={[styles.rank, { backgroundColor: ds.c["accent-violet-bg"] }]} accessibilityLabel={`${data.rank} / ${data.total}`}>
      <Icon name="emoji-events" size={14} color={ds.c["accent-violet-fg"]} />
      <DsText v="caption-strong" c="accent-violet-fg" numberOfLines={1}>
        {[t("results.rank.place", { rank: data.rank }), data.top_percent !== null ? t("results.rank.top", { value: data.top_percent }) : ""].filter(Boolean).join(" · ")}
      </DsText>
    </View>
  );
}

/** Baho qatori — veb `GradeRow`: baholangan (ball) yoki tekshirilmoqda. */
export function GradeRow({ assignment, last }: { assignment: Assignment; last: boolean }) {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const submission = assignment.mySubmission;
  const graded = submission?.gradeValue != null;
  return (
    <View style={[styles.grade, !last && { borderBottomWidth: 1, borderBottomColor: ds.c.line }]}>
      <View style={[styles.gradeIcon, { backgroundColor: ds.c[graded ? "accent-green-bg" : "accent-teal-bg"] }]}>
        <Icon name={graded ? "check-circle" : "assignment"} size={20} color={ds.c[graded ? "accent-green-fg" : "accent-teal-fg"]} />
      </View>
      <View style={styles.grow}>
        <DsText v="title-sm" numberOfLines={1}>
          {assignment.title}
        </DsText>
        <DsText v="body-xs" c="ink-secondary" numberOfLines={1}>
          {assignment.courseTitle}
          {submission ? ` · ${formatLocalized(submission.checkedAt ?? submission.createdAt, t("homeworkView.shortPattern")).toLowerCase()}` : ""}
        </DsText>
      </View>
      {graded ? (
        <View style={[styles.score, { backgroundColor: ds.c["success-bg"] }]}>
          <DsText v="title-lg" heading c="success-text">
            {submission?.gradeValue}
          </DsText>
          <DsText v="caption-strong" c="success-text">
            /{assignment.maxScore}
          </DsText>
        </View>
      ) : (
        <View style={[styles.checking, { backgroundColor: ds.c["accent-teal-bg"] }]}>
          <Icon name="pending" size={14} color={ds.c["accent-teal-fg"]} />
          <DsText v="caption-strong" c="accent-teal-fg">
            {t("homeworkView.state.checking")}
          </DsText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  rank: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: dsRadius.full },
  grade: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  gradeIcon: { width: 40, height: 40, borderRadius: dsRadius.xl, alignItems: "center", justifyContent: "center" },
  score: { flexShrink: 0, flexDirection: "row", alignItems: "baseline", gap: 2, paddingHorizontal: 10, paddingVertical: 4, borderRadius: dsRadius.xl },
  checking: { flexShrink: 0, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: dsRadius.full },
});
