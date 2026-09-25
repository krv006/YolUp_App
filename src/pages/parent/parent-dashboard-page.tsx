import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import {
  CalendarCheck2,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Hourglass,
  Timer,
  UsersRound,
  type LucideIcon,
} from "lucide-react-native";
import { useAttendance } from "@/modules/attendance";
import { useAuth } from "@/modules/auth";
import { useParentDashboard, useSelectedChild } from "@/modules/parent";
import { ChildSelector } from "@/modules/parent/ui/child-selector";
import { ROUTES } from "@/shared/config";
import {
  radius,
  Screen,
  ScreenEmpty,
  ScreenError,
  ScreenLoading,
  Separator,
  Text,
  useTheme,
} from "@/shared/ui";

/** Backend `metric.id` -> ikonka (veb `parent-dashboard-page.tsx` bilan bir xil). */
const METRIC_ICONS: Record<string, LucideIcon> = {
  children: UsersRound,
  requests: Hourglass,
  lessons: CheckCircle2,
  minutes: Timer,
};

const METRIC_TONES = ["violet", "amber", "emerald", "rose"] as const;

/** Ota-ona paneli — veb `parent-dashboard-page.tsx` porti. */
export function ParentDashboardPage() {
  const router = useRouter();
  const { palette } = useTheme();
  const { user } = useAuth();
  const { children, childrenQuery, selectedChildId, selectedChild } = useSelectedChild();

  const dashboard = useParentDashboard(selectedChildId);
  const attendance = useAttendance(selectedChildId ? { student: selectedChildId } : {});

  const loading = childrenQuery.isLoading || dashboard.isLoading || attendance.isLoading;
  const failed = dashboard.isError || attendance.isError;

  function refresh() {
    void dashboard.refetch();
    void attendance.refetch();
  }

  /*
   * Farzand biriktirilmagan bo'lsa bu XATO emas.
   *
   * Avval so'rovlar baribir yuborilardi, backend esa o'quvchisiz so'rovni
   * rad etardi — natijada yangi ota-ona hisobi birinchi ochilishda
   * "Ma'lumotlarni yuklab bo'lmadi" degan qizil ekranni ko'rardi va nima
   * qilishni bilmasdi. Endi unga nima qilish kerakligi aytiladi.
   *
   * Xuddi shu naqsh `parent-grades-page` va `parent-homework-page` da ham.
   */
  if (!childrenQuery.isLoading && children.length === 0) {
    return (
      <Screen>
        <ScreenEmpty
          title="Farzand biriktirilmagan"
          description="'Farzand' bo'limiga o'ting va o'quvchining taklif kodi bilan uning hisobini ulang."
        />
      </Screen>
    );
  }

  if (loading) {
    return (
      <Screen>
        <ScreenLoading label="Panel yuklanmoqda…" />
      </Screen>
    );
  }

  if (failed) {
    return (
      <Screen>
        <ScreenError message="Ma'lumotlarni yuklab bo'lmadi" onRetry={refresh} />
      </Screen>
    );
  }

  const metrics = dashboard.data?.metrics ?? [];
  const recent = (attendance.data ?? []).slice(0, 5);

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={
          <RefreshControl
            refreshing={dashboard.isRefetching || attendance.isRefetching}
            onRefresh={refresh}
            tintColor={palette["muted-foreground"]}
          />
        }
      >
        <View style={styles.welcome}>
          <Text variant="heading">Salom, {user?.name?.split(" ")[0] ?? "ota-ona"}</Text>
          <Text tone="muted">
            {selectedChild
              ? `${selectedChild.name}ning ta'lim jarayoni.`
              : "Farzandingizning ta'lim jarayonini kuzatib boring."}
          </Text>
        </View>

        <ChildSelector />

        <View style={styles.metrics}>
          {metrics.map((metric, index) => {
            const Icon = METRIC_ICONS[metric.id] ?? UsersRound;
            const tone = METRIC_TONES[index % METRIC_TONES.length]!;
            return (
              <View
                key={metric.id}
                style={[
                  styles.metric,
                  { backgroundColor: palette[`tone-${tone}-bg`], borderColor: palette.border },
                ]}
              >
                <Icon size={20} color={palette[`tone-${tone}-fg`]} />
                <Text variant="subheading">{metric.value}</Text>
                <Text variant="caption" tone="muted" numberOfLines={2}>
                  {metric.label}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <View style={styles.cardHead}>
            <Text variant="label" style={styles.cardTitle}>
              So'nggi davomat
            </Text>
            <Text
              accessibilityRole="button"
              onPress={() => router.push(ROUTES.parent.attendance)}
              variant="caption"
              tone="brand"
            >
              Barchasi
            </Text>
            <ChevronRight size={15} color={palette["primary-text"]} />
          </View>

          {recent.length === 0 ? (
            <Text variant="caption" tone="muted">
              Tanlangan farzand uchun davomat topilmadi.
            </Text>
          ) : (
            recent.map((item, index) => (
              <View key={item.id}>
                {index > 0 ? <Separator /> : null}
                <View style={styles.activity}>
                  <CalendarCheck2 size={18} color={palette["muted-foreground"]} />
                  <View style={styles.activityBody}>
                    <Text variant="label" numberOfLines={1}>
                      {item.lesson}
                    </Text>
                    <Text variant="caption" tone="muted" numberOfLines={1}>
                      {item.child} · {item.entered}
                    </Text>
                  </View>
                  <View style={styles.duration}>
                    <Clock3 size={13} color={palette["muted-foreground"]} />
                    <Text variant="caption" tone="muted">
                      {item.duration}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 16, paddingBottom: 40 },
  welcome: { gap: 4, paddingTop: 8 },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metric: {
    // Ikki ustun: 50% dan yarim oraliq ayiriladi.
    width: "48%",
    flexGrow: 1,
    gap: 6,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: 16,
    gap: 10,
  },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 4 },
  cardTitle: { flex: 1 },
  activity: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  activityBody: { flex: 1, gap: 2 },
  duration: { flexDirection: "row", alignItems: "center", gap: 4 },
});
