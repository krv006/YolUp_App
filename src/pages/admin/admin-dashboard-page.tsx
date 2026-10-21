import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import {
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  GraduationCap,
  LogOut,
  ShieldCheck,
  Star,
  UsersRound,
  type LucideIcon,
} from "lucide-react-native";
import {
  TrendLineChart,
  TrendStackedBarChart,
  useDashboardSummary,
  useDashboardTrends,
} from "@/modules/analytics";
import { useAuth } from "@/modules/auth";
import { NotificationBell, SentNotificationsPanel } from "@/modules/notification";
import { can, PERMISSIONS } from "@/modules/permission";
import { ROUTES } from "@/shared/config";
import type { DashboardPeriod } from "@/shared/types";
import {
  PortalButton,
  PortalHeading,
  portalPage,
  Screen,
  ScreenError,
  ScreenLoading,
  Text,
  useLegacyColors,
  useTheme,
} from "@/shared/ui";
import { AdminTable, Pill, Rank, Stars } from "./admin-table";
import { ServerMonitoringPanel, StoragePanel } from "./system-panels";

const PERIODS: DashboardPeriod[] = ["day", "week", "month", "year"];

type Tone = "blue" | "violet" | "amber" | "emerald" | "rose";

/**
 * Admin boshqaruv paneli — veb `admin-dashboard-page.tsx`: sarlavha va
 * amallar, davr tanlagichi, oltita ko'rsatkich, uchta grafik, top kurslar
 * va o'qituvchilar jadvallari, video yozuvlar, server holati va yuborilgan
 * xabarlar.
 *
 * Jadvallar vebdagidek bir qatorli va gorizontal aylanadi; grafik
 * qiymatlari bosilganda tepada chiqadi (vebda sichqoncha bilan).
 */
export function AdminDashboardPage() {
  const { t } = useTranslation("admin");
  const router = useRouter();
  const { palette } = useTheme();
  const { user, logout } = useAuth();
  const [period, setPeriod] = useState<DashboardPeriod>("month");

  const summary = useDashboardSummary();
  const trends = useDashboardTrends(period);

  async function signOut() {
    await logout();
    router.replace(ROUTES.auth.login);
  }

  function refresh() {
    void summary.refetch();
    void trends.refetch();
  }

  if (summary.isLoading || trends.isLoading) {
    return (
      <Screen>
        <ScreenLoading label={t("dashboard.loading")} />
      </Screen>
    );
  }

  if (summary.isError || trends.isError || !summary.data || !trends.data) {
    return (
      <Screen>
        <ScreenError
          message={summary.error?.message ?? trends.error?.message ?? t("dashboard.loadError")}
          onRetry={refresh}
        />
      </Screen>
    );
  }

  const s = summary.data;
  const trendData = trends.data;
  const lastIndex = trendData.labels.length - 1;
  const noun = t(`dashboard.periodNoun.${period}`);

  return (
    <Screen padded={false}>
      <ScrollView
        style={{ backgroundColor: palette.background }}
        contentContainerStyle={portalPage}
        refreshControl={
          <RefreshControl
            refreshing={summary.isRefetching || trends.isRefetching}
            onRefresh={refresh}
            tintColor={palette["muted-foreground"]}
          />
        }
      >
        <PortalHeading
          eyebrowIcon={ShieldCheck}
          eyebrow={t("dashboard.eyebrow")}
          title={t("dashboard.welcome", { name: user?.name })}
          description={t("dashboard.subtitle")}
          actions={
            <View style={styles.actions}>
              {/* `.portal-primary-link` — 44, 0 14, 13/800 */}
              <PortalButton
                variant="primary"
                size="link"
                icon={UsersRound}
                label={t("dashboard.teachersLink")}
                onPress={() => router.push(ROUTES.admin.teachers)}
              />
              <NotificationBell />
              <PortalButton size="dense" icon={LogOut} label={t("dashboard.logout")} onPress={() => void signOut()} style={styles.grow} />
            </View>
          }
        />

        <PeriodSwitch value={period} onChange={setPeriod} />

        <View style={styles.kpis}>
          <Kpi icon={UsersRound} tone="blue" value={s.activeStudents} label={t("dashboard.kpi.activeStudents")} />
          <Kpi icon={GraduationCap} tone="violet" value={s.activeTeachers} label={t("dashboard.kpi.activeTeachers")} />
          <Kpi icon={BookOpen} tone="amber" value={s.activeCourses} label={t("dashboard.kpi.activeCourses")} />
          <Kpi
            icon={CalendarCheck}
            tone="emerald"
            value={trendData.lessonsCompleted[lastIndex] ?? 0}
            label={t("dashboard.kpi.lessonsCompleted")}
            delta={t("dashboard.kpi.lessonsCancelledCaption", { count: trendData.lessonsCancelled[lastIndex] ?? 0, noun })}
          />
          <Kpi
            icon={CheckCircle2}
            tone="rose"
            value={trendData.attendanceRate[lastIndex] != null ? `${trendData.attendanceRate[lastIndex]}%` : "—"}
            label={t("dashboard.kpi.attendance")}
            delta={t("dashboard.kpi.attendanceCaption", { noun })}
          />
          <Kpi
            icon={Star}
            tone="blue"
            value={s.avgRating != null ? s.avgRating.toFixed(1) : "—"}
            label={t("dashboard.kpi.rating")}
            delta={t("dashboard.kpi.ratingCaption", { count: s.ratingCount })}
          />
        </View>

        <DashPanel
          title={t("dashboard.charts.enrollTitle")}
          caption={t("dashboard.charts.periodCaption")}
          legend={[{ color: palette["chart-1"], label: t("dashboard.charts.enrollLegend") }]}
        >
          <TrendLineChart
            labels={trendData.labels}
            series={[
              {
                key: "enroll",
                name: t("dashboard.charts.enrollLegend"),
                color: palette["chart-1"],
                values: trendData.enrollments,
                area: true,
              },
            ]}
          />
        </DashPanel>

        <DashPanel
          title={t("dashboard.charts.lessonsTitle")}
          caption={t("dashboard.charts.periodCaption")}
          legend={[
            { color: palette["chart-2"], label: t("dashboard.charts.completedLegend") },
            { color: palette["chart-4"], label: t("dashboard.charts.cancelledLegend") },
          ]}
        >
          <TrendStackedBarChart
            labels={trendData.labels}
            series={[
              { key: "completed", name: t("dashboard.charts.completedLegend"), color: palette["chart-2"], values: trendData.lessonsCompleted },
              { key: "cancelled", name: t("dashboard.charts.cancelledLegend"), color: palette["chart-4"], values: trendData.lessonsCancelled },
            ]}
          />
        </DashPanel>

        <DashPanel
          title={t("dashboard.charts.quizTitle")}
          caption={t("dashboard.charts.quizCaption")}
          legend={[{ color: palette["chart-5"], label: t("dashboard.charts.quizLegend") }]}
        >
          <TrendLineChart
            zeroBase={false}
            labels={trendData.labels}
            series={[{ key: "quiz", name: t("dashboard.charts.quizLegend"), color: palette["chart-5"], values: trendData.quizAvgScore }]}
          />
        </DashPanel>

        <DashPanel title={t("dashboard.tables.topCoursesTitle")} caption={t("dashboard.tables.topCoursesSubtitle")}>
          <AdminTable
            rows={s.topCourses.length}
            empty={t("dashboard.tables.noCourses")}
            columns={[
              { key: "rank", header: "#", cell: (row) => <Rank value={row + 1} /> },
              { key: "course", header: t("dashboard.tables.colCourse"), strong: true, cell: (row) => s.topCourses[row]!.title },
              { key: "teacher", header: t("dashboard.tables.colTeacher"), cell: (row) => s.topCourses[row]!.teacherName },
              { key: "students", header: t("dashboard.tables.colStudents"), cell: (row) => s.topCourses[row]!.studentCount },
              { key: "rating", header: t("dashboard.tables.colRating"), cell: (row) => <Stars value={s.topCourses[row]!.avgRating} /> },
              {
                key: "attendance",
                header: t("dashboard.tables.colAttendance"),
                cell: (row) => <Pill value={s.topCourses[row]!.attendanceRate} threshold={85} suffix="%" />,
              },
            ]}
          />
        </DashPanel>

        <DashPanel title={t("dashboard.tables.topTeachersTitle")} caption={t("dashboard.tables.topTeachersSubtitle")}>
          <AdminTable
            rows={s.topTeachers.length}
            empty={t("dashboard.tables.noTeachers")}
            columns={[
              { key: "rank", header: "#", cell: (row) => <Rank value={row + 1} /> },
              { key: "teacher", header: t("dashboard.tables.colTeacher"), strong: true, cell: (row) => s.topTeachers[row]!.name },
              { key: "courses", header: t("dashboard.tables.colCourses"), cell: (row) => s.topTeachers[row]!.courseCount },
              { key: "lessons", header: t("dashboard.tables.colLessonsThisMonth"), cell: (row) => s.topTeachers[row]!.lessonsThisMonth },
              { key: "rating", header: t("dashboard.tables.colRating"), cell: (row) => <Stars value={s.topTeachers[row]!.avgRating} /> },
              {
                key: "reliability",
                header: t("dashboard.tables.colReliability"),
                cell: (row) => <Pill value={s.topTeachers[row]!.reliability} threshold={85} suffix="%" />,
              },
            ]}
          />
        </DashPanel>

        <StoragePanel />
        <ServerMonitoringPanel />

        {can(user, PERMISSIONS.NOTIFICATION_SEND) ? <SentNotificationsPanel /> : null}
      </ScrollView>
    </Screen>
  );
}

/** `.dash-period-switch` — kulrang fon ichida oq faol tugma. */
function PeriodSwitch({ value, onChange }: { value: DashboardPeriod; onChange: (value: DashboardPeriod) => void }) {
  const { t } = useTranslation("admin");
  const { palette } = useTheme();
  const colors = useLegacyColors();
  return (
    <View style={[styles.periods, { backgroundColor: colors.mutedBg }]}>
      {PERIODS.map((item) => {
        const active = item === value;
        return (
          <Pressable
            key={item}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(item)}
            style={[styles.period, active && [styles.periodActive, { backgroundColor: palette.surface }]]}
          >
            <Text variant="caption" style={[styles.periodText, { color: active ? colors.foreground : colors.muted }]}>
              {t(`dashboard.periods.${item}`)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** `.dash-kpi-card` — 16 bo'shliq, radius 16, 32px rangli ikonka. */
function Kpi({ icon: Icon, tone, value, label, delta }: { icon: LucideIcon; tone: Tone; value: ReactNode; label: string; delta?: string }) {
  const { palette } = useTheme();
  const colors = useLegacyColors();
  return (
    <View style={[styles.kpi, { borderColor: colors.border, backgroundColor: palette.card }]}>
      <View style={[styles.kpiIcon, { backgroundColor: palette[`tone-${tone}-bg`] }]}>
        <Icon size={16} color={palette[`tone-${tone}-fg`]} />
      </View>
      <Text variant="body" style={styles.kpiNum}>
        {value}
      </Text>
      <Text variant="caption" style={[styles.kpiLabel, { color: colors.muted }]}>
        {label}
      </Text>
      {delta ? (
        <Text variant="caption" style={[styles.kpiDelta, { color: colors.muted }]}>
          {delta}
        </Text>
      ) : null}
    </View>
  );
}

/** `.dash-panel` — sarlavha, izoh va o'ngda legenda. */
function DashPanel({
  title,
  caption,
  legend,
  children,
}: {
  title: string;
  caption: string;
  legend?: Array<{ color: string; label: string }>;
  children: ReactNode;
}) {
  const { palette } = useTheme();
  const colors = useLegacyColors();
  return (
    <View style={[styles.panel, { borderColor: colors.border, backgroundColor: palette.card }]}>
      <View style={styles.panelHead}>
        <View style={styles.panelTitle}>
          <Text variant="body" style={styles.panelH3}>
            {title}
          </Text>
          <Text variant="caption" style={[styles.panelCaption, { color: colors.muted }]}>
            {caption}
          </Text>
        </View>
        {legend ? (
          <View style={styles.legend}>
            {legend.map((item) => (
              <View key={item.label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text variant="caption" style={[styles.legendText, { color: colors.muted }]}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  grow: { flexGrow: 1 },
  /* `.heading-actions` — orasi 9 */
  actions: { flex: 1, flexDirection: "row", alignItems: "center", gap: 9 },
  /* `.dash-period-switch` — 3 bo'shliq, radius 10 */
  periods: { alignSelf: "flex-start", flexDirection: "row", gap: 2, padding: 3, borderRadius: 10 },
  period: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  periodActive: {
    shadowColor: "#000000",
    shadowOpacity: 0.06,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  periodText: { fontSize: 12, lineHeight: 18, fontWeight: "700" },
  /* `.dash-kpi-grid` — tor ekranda ikki ustun, orasi 14 */
  kpis: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  kpi: { flexGrow: 1, flexBasis: "40%", padding: 16, borderWidth: 1, borderRadius: 16 },
  kpiIcon: { width: 32, height: 32, marginBottom: 12, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  kpiNum: { fontSize: 24, lineHeight: 28, fontWeight: "700", letterSpacing: -0.24 },
  kpiLabel: { marginTop: 5, fontSize: 12, lineHeight: 18 },
  kpiDelta: { marginTop: 9, fontSize: 11, lineHeight: 16.5, fontWeight: "700" },
  /* `.dash-panel` — 18 18 14, radius 16 */
  panel: { paddingTop: 18, paddingHorizontal: 18, paddingBottom: 14, borderWidth: 1, borderRadius: 16 },
  panelHead: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 4 },
  panelTitle: { flexShrink: 1 },
  panelH3: { fontSize: 15, lineHeight: 22.5, fontWeight: "700" },
  panelCaption: { marginTop: 2, fontSize: 11, lineHeight: 16.5 },
  legend: { flexShrink: 1, flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-end", gap: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 2 },
  legendText: { fontSize: 11, lineHeight: 16.5, fontWeight: "600" },
});
