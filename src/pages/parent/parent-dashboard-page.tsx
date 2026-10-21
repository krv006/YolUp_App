import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  Hourglass,
  Timer,
  UsersRound,
  type LucideIcon,
} from "lucide-react-native";
import { useAttendance } from "@/modules/attendance";
import { useAuth } from "@/modules/auth";
import { useParentDashboard, useSelectedChild } from "@/modules/parent";
import { ParentAppBar } from "@/modules/parent/ui/parent-app-bar";
import { ROUTES } from "@/shared/config";
import {
  GradientFill,
  PortalButton,
  PortalCard,
  PortalMetric,
  type PortalMetricTone,
  portalPage,
  PortalSectionHead,
  PullRefresh,
  Screen,
  ScreenError,
  ScreenLoading,
  Text,
  useLegacyColors,
  useTheme,
} from "@/shared/ui";

/** Backend `metric.id` -> ikonka (veb `parent-dashboard-page.tsx` bilan bir xil). */
const METRIC_ICONS: Record<string, LucideIcon> = {
  children: UsersRound,
  requests: Hourglass,
  lessons: CheckCircle2,
  minutes: Timer,
};

const METRIC_TONES: readonly PortalMetricTone[] = ["violet", "amber", "emerald", "rose"];

/**
 * Ota-ona bosh sahifasi — veb `parent-dashboard-page.tsx`: "OTA-ONA
 * KABINETI" salomlashish kartasi, to'rtta ko'rsatkich (tor ekranda bir
 * ustun) va so'nggi davomat.
 */
export function ParentDashboardPage() {
  const { t } = useTranslation("parent");
  const { t: tn } = useTranslation("nav");
  const router = useRouter();
  const { palette } = useTheme();
  const colors = useLegacyColors();
  const { user } = useAuth();
  const { selectedChildId, selectedChild, children, childrenQuery } = useSelectedChild();
  const dashboard = useParentDashboard(selectedChildId);
  const attendance = useAttendance(selectedChildId ? { student: selectedChildId } : {}, Boolean(selectedChildId));

  const appBar = <ParentAppBar a11yTitle={tn("parent.dashboard")} />;

  function refresh() {
    return Promise.all([childrenQuery.refetch(), dashboard.refetch(), attendance.refetch()]);
  }

  if (childrenQuery.isLoading || dashboard.isLoading || attendance.isLoading) {
    return (
      <Screen padded={false}>
        {appBar}
        <ScreenLoading label={t("dashboard.loading")} />
      </Screen>
    );
  }

  // Vebdagi `RouteState`: farzand yo'q — xato emas, nima qilish kerakligi aytiladi.
  if (!childrenQuery.isError && !children.length) {
    return (
      <Screen padded={false}>
        {appBar}
        <View style={styles.state}>
          <Text variant="caption" style={[styles.eyebrow, { color: palette["primary-text"] }]}>
            {t("dashboard.eyebrow")}
          </Text>
          <Text variant="body" style={styles.stateTitle}>
            {t("dashboard.noChildTitle")}
          </Text>
          <Text variant="label" style={[styles.stateText, { color: colors.muted }]}>
            {t("dashboard.noChildDescription")}
          </Text>
          <PortalButton
            variant="primary"
            label={t("dashboard.noChildAction")}
            onPress={() => router.push(ROUTES.parent.children)}
          />
        </View>
      </Screen>
    );
  }

  if (childrenQuery.isError || dashboard.isError || attendance.isError) {
    return (
      <Screen padded={false}>
        {appBar}
        <ScreenError message={t("dashboard.loadError")} onRetry={refresh} />
      </Screen>
    );
  }

  const metrics = dashboard.data?.metrics ?? [];
  const recent = (attendance.data ?? []).slice(0, 5);

  return (
    <Screen padded={false}>
      {appBar}
      <ScrollView
        style={{ backgroundColor: palette.background }}
        contentContainerStyle={portalPage}
        refreshControl={
          <PullRefresh onRefresh={refresh} />
        }
      >
        {/* `.portal-welcome.parent-welcome` — oqdan yashil-och rangga o'tuvchi fon. */}
        <View style={[styles.welcome, { borderColor: palette["success-soft"] }]}>
          <GradientFill colors={[palette.surface, palette["success-soft"]]} />
          {/* `::after` — o'ng yuqoridagi och halqa. */}
          <View pointerEvents="none" style={[styles.ring, { borderColor: palette["primary-soft"] }]} />
          <Text variant="caption" style={[styles.eyebrow, { color: palette["primary-text"] }]}>
            {t("dashboard.eyebrow")}
          </Text>
          <Text variant="body" style={styles.greeting}>
            {t("dashboard.greeting", { name: user?.name?.split(" ")[0] })}
          </Text>
          <Text variant="label" style={[styles.subtitle, { color: colors.muted }]}>
            {selectedChild
              ? t("dashboard.subtitleWithChild", { name: selectedChild.name })
              : t("dashboard.subtitleNoChild")}
          </Text>
        </View>

        <View style={styles.metrics}>
          {metrics.map((metric, index) => (
            <PortalMetric
              key={metric.id}
              icon={METRIC_ICONS[metric.id] ?? UsersRound}
              tone={METRIC_TONES[index % METRIC_TONES.length]!}
              value={metric.value}
              label={metric.label}
            />
          ))}
        </View>

        <PortalCard style={styles.recent}>
          <PortalSectionHead
            eyebrow={t("dashboard.recentActivityEyebrow")}
            title={t("dashboard.attendanceTitle")}
            action={
              <Pressable
                accessibilityRole="link"
                onPress={() => router.push(ROUTES.parent.attendance)}
                style={styles.link}
              >
                <Text variant="label" style={[styles.linkText, { color: palette["primary-text"] }]}>
                  {t("dashboard.allAttendance")}
                </Text>
                <ArrowRight size={15} color={palette["primary-text"]} />
              </Pressable>
            }
          />
          <View style={styles.activity}>
            {recent.map((item) => (
              <View key={item.id} style={[styles.activityRow, { borderColor: colors.border }]}>
                <View style={[styles.activityIcon, { backgroundColor: palette["primary-soft"] }]}>
                  <CalendarCheck2 size={18} color={palette["primary-text"]} />
                </View>
                <View style={styles.activityBody}>
                  <Text variant="label" numberOfLines={1}>
                    {item.lesson}
                  </Text>
                  <Text variant="caption" numberOfLines={1} style={{ color: colors.muted }}>
                    {item.child} · {item.entered}
                  </Text>
                </View>
                <View style={styles.duration}>
                  <Clock3 size={14} color={colors.muted} />
                  <Text variant="caption" style={{ color: colors.muted }}>
                    {item.duration}
                  </Text>
                </View>
              </View>
            ))}
            {!recent.length ? (
              <Text variant="body" style={{ color: colors.muted }}>
                {t("dashboard.emptyAttendance")}
              </Text>
            ) : null}
          </View>
        </PortalCard>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  /* `.portal-eyebrow` */
  eyebrow: { fontSize: 12, lineHeight: 18, fontWeight: "700", letterSpacing: 1.56 },
  /* `.portal-welcome` — 23 20 bo'shliq, radius 20, 1px yashil-och chegara */
  welcome: { overflow: "hidden", minHeight: 138, justifyContent: "center", paddingVertical: 23, paddingHorizontal: 20, borderWidth: 1, borderRadius: 20 },
  ring: { position: "absolute", width: 210, height: 210, right: -65, top: -98, borderWidth: 35, borderRadius: 105, opacity: 0.6 },
  /* `.portal-welcome h1` — 24/36/400, -0.035em */
  greeting: { marginTop: 8, marginBottom: 7, fontSize: 24, lineHeight: 36, fontWeight: "400", letterSpacing: -0.84 },
  subtitle: { fontSize: 13, lineHeight: 19.5, fontWeight: "400" },
  /* `.portal-metric-grid` — tor ekranda bitta ustun, orasi 10 */
  metrics: { gap: 10 },
  /* `.parent-recent-card` — 22 bo'shliq */
  recent: { padding: 22, gap: 18 },
  link: { flexDirection: "row", alignItems: "center", gap: 4 },
  linkText: { fontSize: 13, fontWeight: "700" },
  activity: { gap: 0 },
  activityRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 11, borderBottomWidth: 1 },
  activityIcon: { width: 31, height: 31, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  activityBody: { flex: 1, minWidth: 0, gap: 3 },
  duration: { flexDirection: "row", alignItems: "center", gap: 4 },
  state: { flex: 1, justifyContent: "center", alignItems: "flex-start", gap: 10, padding: 24 },
  stateTitle: { fontSize: 24, lineHeight: 32, fontWeight: "400" },
  stateText: { fontWeight: "400", marginBottom: 6 },
});
