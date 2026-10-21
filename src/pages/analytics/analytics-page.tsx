import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuth } from "@/modules/auth";
import { useMyAnalytics } from "@/modules/analytics";
import { NotificationBell } from "@/modules/notification";
import { ROLES } from "@/shared/constants";
import { formatDateTime } from "@/shared/lib";
import type { StudentAnalytics, TeacherAnalytics } from "@/shared/types";
import { AppBar, AppBarAction, Icon, radius, Screen, Text, useTheme, type IconName } from "@/shared/ui";

function percent(value: number | null): string {
  return value === null ? "—" : `${Math.round(value)}%`;
}

/** `rounded-2xl border bg-surface p-3 gap-2`, ikonka 36x36 `rounded-lg`. */
function StatCard({ icon, tone, value, label }: { icon: IconName; tone: string; value: string; label: string }) {
  const { palette } = useTheme();
  return (
    <View style={[styles.stat, { backgroundColor: palette.surface, borderColor: palette.border }]}>
      <View style={[styles.statIcon, { backgroundColor: tone }]}>
        <Icon name={icon} size={17} color="#ffffff" />
      </View>
      <Text variant="subheading">{value}</Text>
      <Text variant="caption" style={{ color: palette["muted-foreground"] }}>
        {label}
      </Text>
    </View>
  );
}

function Meter({ label, value, tone }: { label: string; value: string; tone: string }) {
  const { palette } = useTheme();
  const width = Number.parseFloat(value.replace(/[^\d.]/g, ""));
  const ratio = value.includes("/") ? (Number.parseFloat(value) / 5) * 100 : Number.isFinite(width) ? width : 0;
  return (
    <View style={styles.meter}>
      <View style={styles.meterHead}>
        <Text variant="label" style={[styles.bodySm, styles.grow, { color: palette["muted-foreground"] }]}>
          {label}
        </Text>
        <Text variant="label" style={styles.numeric}>
          {value}
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: palette["surface-subtle"] }]}>
        <View style={[styles.fill, { width: `${Math.max(0, Math.min(100, ratio))}%`, backgroundColor: tone }]} />
      </View>
    </View>
  );
}

function StudentView({ data }: { data: StudentAnalytics }) {
  const { t } = useTranslation("workspace");
  const { palette } = useTheme();
  return (
    <>
      <View style={styles.grid}>
        <View style={styles.cell2}>
          <StatCard icon="assign" tone={palette.primary} value={String(data.attemptCount)} label={t("analytics.attemptCount")} />
        </View>
        <View style={styles.cell2}>
          <StatCard
            icon="check-circle"
            tone={palette.success}
            value={percent(data.avgPercentage)}
            label={t("analytics.avgPercentage")}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text variant="body" style={styles.title}>
          {t("analytics.recentAttempts")}
        </Text>
        {data.recentAttempts.length ? (
          <View style={[styles.list, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            {data.recentAttempts.map((item, index) => (
              <View
                key={`${item.quizId}-${index}`}
                style={[
                  styles.row,
                  index < data.recentAttempts.length - 1 && { borderBottomWidth: 1, borderBottomColor: palette.border },
                ]}
              >
                <View style={styles.grow}>
                  <Text variant="label" numberOfLines={1}>
                    {item.quizTitle}
                  </Text>
                  <Text variant="caption" numberOfLines={1} style={{ color: palette["subtle-foreground"] }}>
                    {`${item.courseTitle} · ${formatDateTime(item.takenAt)}`}
                  </Text>
                </View>
                <Text variant="label" style={[styles.numeric, { color: palette.primary }]}>
                  {percent(item.percentage)}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text variant="label" style={[styles.bodySm, { color: palette["subtle-foreground"] }]}>
            {t("analytics.noAttempts")}
          </Text>
        )}
      </View>
    </>
  );
}

function TeacherView({ data }: { data: TeacherAnalytics }) {
  const { t } = useTranslation("workspace");
  const { palette } = useTheme();
  const overall = data.overall;
  const stats: Array<{ icon: IconName; tone: string; value: string; label: string }> = [
    {
      icon: "check-circle",
      tone: palette["saffron-strong"],
      value: overall.avgRating === null ? "—" : overall.avgRating.toFixed(1),
      label: t("analytics.avgRating"),
    },
    { icon: "done-all", tone: palette.success, value: String(overall.ratingCount), label: t("analytics.ratingCount") },
    { icon: "school", tone: palette.primary, value: String(overall.courseCount), label: t("analytics.courseCount") },
    { icon: "person", tone: palette.primary, value: String(overall.studentCount), label: t("analytics.studentCount") },
    {
      icon: "nav-calendar",
      tone: palette.primary,
      value: String(overall.lessonsFinished),
      label: t("analytics.lessonsFinished"),
    },
    { icon: "check-circle", tone: palette.success, value: percent(overall.reliability), label: t("analytics.reliability") },
  ];

  return (
    <>
      <View style={styles.grid}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.cell3}>
            <StatCard {...stat} />
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text variant="body" style={styles.title}>
          {t("analytics.byCourse")}
        </Text>
        {data.courses.length ? (
          data.courses.map((course) => (
            <View key={course.courseId} style={[styles.course, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <View style={[styles.courseHead, { borderBottomColor: palette.border }]}>
                <View style={[styles.courseIcon, { backgroundColor: palette.primary }]}>
                  <Icon name="groups" size={18} color={palette["primary-foreground"]} />
                </View>
                <View style={styles.grow}>
                  <Text variant="body" numberOfLines={1} style={styles.title}>
                    {course.courseTitle}
                  </Text>
                  <Text variant="caption" style={{ color: palette["subtle-foreground"] }}>
                    {t("analytics.studentCountValue", { count: course.studentCount ?? 0 })}
                  </Text>
                </View>
              </View>
              <Meter
                label={t("analytics.avgRating")}
                value={course.avgRating === null ? "—" : `${course.avgRating.toFixed(1)} / 5`}
                tone={palette["saffron-strong"]}
              />
              <Meter label={t("analytics.quizAvg")} value={percent(course.quizAvgPercentage)} tone={palette.primary} />
              <Meter label={t("analytics.attendance")} value={percent(course.attendanceRate)} tone={palette.success} />
              <Meter label={t("analytics.reliability")} value={percent(course.reliability)} tone={palette.foreground} />
            </View>
          ))
        ) : (
          <View style={[styles.empty, { borderColor: palette.border }]}>
            <View style={[styles.emptyIcon, { backgroundColor: palette.primary }]}>
              <Icon name="nav-workspace" size={26} color={palette["primary-foreground"]} />
            </View>
            <Text variant="subheading" style={styles.center}>
              {t("analytics.emptyTitle")}
            </Text>
            <Text variant="label" style={[styles.bodySm, styles.center, { color: palette["muted-foreground"] }]}>
              {t("analytics.noCourses")}
            </Text>
          </View>
        )}
      </View>
    </>
  );
}

/**
 * Tahlil — veb `pages/workspace/analytics-page.tsx` porti (Workspace ichidagi
 * sahifa: tepa panelda orqaga, "Workspace", qidiruv va qo'ng'iroq).
 * O'qituvchida 6 ta ko'rsatkich va kurslar bo'yicha o'lchagichlar,
 * o'quvchida urinishlar soni, o'rtacha natija va so'nggi urinishlar.
 */
export function AnalyticsPage() {
  const { t } = useTranslation("workspace");
  const { t: tn } = useTranslation("nav");
  const router = useRouter();
  const { palette } = useTheme();
  const { user } = useAuth();
  const query = useMyAnalytics();
  const prefix = user?.role === ROLES.STUDENT ? "/student" : "/teacher";
  const workspacePath = `${prefix}/workspace`;

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        router.replace(workspacePath);
        return true;
      });
      return () => subscription.remove();
    }, [router, workspacePath])
  );

  const appBar = (
    <AppBar title={tn("titles.workspace")} back={{ label: t("searchBack"), onPress: () => router.replace(workspacePath) }}>
      <AppBarAction name="search" label={t("searchAria")} onPress={() => router.push(`${prefix}/search`)} />
      <NotificationBell />
    </AppBar>
  );

  if (query.isLoading) {
    return (
      <Screen padded={false}>
        {appBar}
        <View style={[styles.page, { backgroundColor: palette.background }]}>
          <View style={styles.grid}>
            {Array.from({ length: 6 }, (_, index) => (
              <View key={index} style={styles.cell3}>
                <View style={[styles.skeletonStat, { backgroundColor: palette.muted }]} />
              </View>
            ))}
          </View>
          {Array.from({ length: 2 }, (_, index) => (
            <View key={index} style={[styles.skeletonCourse, { backgroundColor: palette.muted }]} />
          ))}
        </View>
      </Screen>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Screen padded={false}>
        {appBar}
        <View style={[styles.error, { backgroundColor: palette.background }]}>
          <View style={[styles.errorIcon, { backgroundColor: palette["destructive-soft"] }]}>
            <Icon name="error" size={26} color={palette["destructive-strong"]} />
          </View>
          <Text variant="subheading" style={styles.center}>
            {t("analytics.loadError")}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void query.refetch()}
            style={({ pressed }) => [styles.retry, { backgroundColor: pressed ? palette["primary-hover"] : palette.primary }]}
          >
            <Text variant="label" style={{ color: palette["primary-foreground"] }}>
              {t("analytics.retry")}
            </Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      {appBar}
      <ScrollView style={{ backgroundColor: palette.background }} contentContainerStyle={styles.page}>
        <Text variant="label" style={[styles.bodySm, { color: palette["muted-foreground"] }]}>
          {t("analytics.subtitle")}
        </Text>
        {query.data.kind === "student" ? <StudentView data={query.data} /> : <TeacherView data={query.data} />}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  center: { textAlign: "center" },
  bodySm: { fontWeight: "400" },
  numeric: { fontVariant: ["tabular-nums"] },
  title: { fontSize: 16, lineHeight: 24, fontWeight: "600" },
  /* `flex-col gap-5 p-4` */
  page: { gap: 20, padding: 16 },
  /* `grid grid-cols-3 gap-3` / `grid-cols-2` */
  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6, rowGap: 12 },
  cell3: { width: "33.333%", paddingHorizontal: 6 },
  cell2: { width: "50%", paddingHorizontal: 6 },
  stat: { flex: 1, gap: 8, padding: 12, borderWidth: 1, borderRadius: radius["2xl"] },
  statIcon: { width: 36, height: 36, borderRadius: radius.lg, alignItems: "center", justifyContent: "center" },
  section: { gap: 12 },
  list: { overflow: "hidden", borderWidth: 1, borderRadius: radius["2xl"] },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  /* `rounded-2xl border bg-surface p-4 gap-4` */
  course: { gap: 16, padding: 16, borderWidth: 1, borderRadius: radius["2xl"] },
  courseHead: { flexDirection: "row", alignItems: "center", gap: 12, paddingBottom: 16, borderBottomWidth: 1 },
  courseIcon: { width: 40, height: 40, borderRadius: radius.lg, alignItems: "center", justifyContent: "center" },
  meter: { gap: 6 },
  meterHead: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  track: { height: 6, borderRadius: radius.full, overflow: "hidden" },
  fill: { height: "100%", borderRadius: radius.full },
  empty: { alignItems: "center", gap: 12, paddingHorizontal: 24, paddingVertical: 40, borderWidth: 1, borderStyle: "dashed", borderRadius: radius["2xl"] },
  emptyIcon: { width: 64, height: 64, borderRadius: radius["2xl"], alignItems: "center", justifyContent: "center" },
  skeletonStat: { height: 112, borderRadius: radius["2xl"] },
  skeletonCourse: { height: 224, borderRadius: radius["2xl"] },
  error: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 24 },
  errorIcon: { width: 64, height: 64, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  retry: { marginTop: 4, height: 48, justifyContent: "center", paddingHorizontal: 20, borderRadius: radius.full },
});
