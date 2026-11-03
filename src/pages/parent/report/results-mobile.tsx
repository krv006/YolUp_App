import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { parentHome, parentResults } from "@/modules/parent";
import { ROUTES } from "@/shared/config";
import { formatLocalized } from "@/shared/lib";
import { useOnlineStatus } from "@/shared/model";
import { DsText, dsRadius, Icon, MobileEmptyCard, MobileRoundButton, MobileSelectSheet, MobileTitleHeader, useDs, type DsColor, type IconName } from "@/shared/ui";
import { ParentErrorBanner, ParentScreen } from "@/widgets/parent-shell";
import { subjectLook } from "../attendance/attendance-styles";
import { MobileConnect } from "../dashboard/parent-home-mobile";
import { ScoreCard } from "../dashboard/home-side";
import { useHomeworkView } from "../homework/use-homework-view";
import { ResultsTabs } from "./results-parts";

/**
 * Natijalar (reyting) — veb `results-mobile.tsx`: oy tanlash, to'rtta
 * ko'rsatkich (berilgan, topshirilgan, o'rtacha, fanlar), ball dinamikasi
 * va fanlar ro'yxati (bosilsa kurs sahifasi).
 */
export function ResultsMobile() {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const router = useRouter();
  const online = useOnlineStatus();
  const view = useHomeworkView();
  const today = new Date(view.now);
  const [period, setPeriod] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [monthOpen, setMonthOpen] = useState(false);
  const assignments = view.assignments;
  const months = parentResults.activeMonths(assignments, view.now);
  const current = parentResults.monthHomework(assignments, period.year, period.month);
  const previousDate = new Date(period.year, period.month - 1, 1);
  const previous = parentResults.monthHomework(assignments, previousDate.getFullYear(), previousDate.getMonth());
  const points = parentHome.gradedScores(assignments);
  const titles = new Map(
    [...view.courseById.values()].filter((course) => assignments.some((item) => item.courseId === course.id)).map((course) => [course.id, course.title])
  );
  const subjects = parentResults.subjectRows(assignments, titles);

  const tiles: Array<{ icon: IconName; bg: DsColor; fg: DsColor; value: string; label: string }> = [
    { icon: "assignment", bg: "accent-blue-bg", fg: "accent-blue-fg", value: String(current.given), label: t("results.stats.given") },
    {
      icon: "check-circle",
      bg: "accent-green-bg",
      fg: "accent-green-fg",
      value: `${current.percent ?? 0}%`,
      label: `${t("results.stats.submitted")} · ${current.submitted}/${current.given}`,
    },
    { icon: "trending-up", bg: "accent-violet-bg", fg: "accent-violet-fg", value: current.average === null ? "—" : String(current.average), label: t("results.stats.average") },
    { icon: "bar-chart", bg: "accent-saffron-bg", fg: "accent-saffron-fg", value: String(current.subjects.length), label: t("results.stats.subjects") },
  ];

  return (
    <ParentScreen tabs onRefresh={async () => view.retry()}>
      <MobileTitleHeader
        eyebrow={t("results.eyebrow")}
        title={t("results.title")}
        action={<MobileRoundButton icon="tune" label={t("results.month")} background="surface" onPress={() => setMonthOpen(true)} />}
      />
      <ResultsTabs />
      {online && view.failed ? <ParentErrorBanner onRetry={view.retry} /> : null}
      {!view.loading && !view.child ? (
        <MobileConnect />
      ) : (
        <>
          <View style={[styles.tiles, view.loading && styles.loading]}>
            {tiles.map((tile) => (
              <View key={tile.label} style={[styles.tile, { backgroundColor: ds.c.surface }]}>
                <View style={[styles.tileIcon, { backgroundColor: ds.c[tile.bg] }]}>
                  <Icon name={tile.icon} size={20} color={ds.c[tile.fg]} />
                </View>
                <View style={styles.grow}>
                  <DsText v="title-lg" heading numberOfLines={1}>
                    {tile.value}
                  </DsText>
                  <DsText v="caption" c="ink-secondary" numberOfLines={1}>
                    {tile.label}
                  </DsText>
                </View>
              </View>
            ))}
          </View>
          {points.length ? (
            <>
              <ScoreCard
                trend={parentHome.scoreTrend(points, view.now, 6)}
                delta={parentResults.delta(current.average, previous.average)}
                deltaLabel={t("results.thisMonth")}
                gradientId="results-mobile-fill"
              />
              <DsText v="title-lg" heading style={styles.heading}>
                {t("results.subjects")}
              </DsText>
              <View style={[styles.list, { backgroundColor: ds.c.surface }]}>
                {subjects.map((row, index) => {
                  const course = view.courseById.get(row.courseId);
                  const look = subjectLook(`${course?.subject ?? ""} ${course?.subjectLabel ?? ""} ${row.title}`);
                  const share = row.total ? row.submitted / row.total : 0;
                  return (
                    <Pressable
                      key={row.courseId}
                      accessibilityRole="button"
                      onPress={() => router.push(ROUTES.parent.course(row.courseId) as never)}
                      style={({ pressed }) => [styles.subject, index < subjects.length - 1 && { borderBottomWidth: 1, borderBottomColor: ds.c.line }, pressed && { backgroundColor: ds.c.subtle }]}
                    >
                      <View style={styles.subjectHead}>
                        <View style={[styles.subjectIcon, { backgroundColor: ds.c[look.bg] }]}>
                          <Icon name={look.icon} size={22} color={ds.c[look.fg]} />
                        </View>
                        <View style={styles.grow}>
                          <DsText v="title-sm" numberOfLines={1}>
                            {row.title}
                          </DsText>
                          <DsText v="body-xs" c="ink-secondary">
                            {t("mobile.results.submitted", { submitted: row.submitted, total: row.total })}
                          </DsText>
                        </View>
                        <View style={styles.average}>
                          <DsText v="h2" heading w="600" style={styles.averageValue}>
                            {row.average ?? "—"}
                          </DsText>
                          <DsText v="caption" c="ink-tertiary">
                            {t("results.average")}
                          </DsText>
                        </View>
                      </View>
                      <View style={[styles.track, { backgroundColor: ds.c.subtle }]}>
                        <View style={[styles.fill, { width: `${share * 100}%`, backgroundColor: ds.c[share >= 0.8 ? "success" : "brand"] }]} />
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : view.loading ? null : (
            <MobileEmptyCard icon="bar-chart" title={t("results.empty.title")} description={t("results.empty.text")} />
          )}
        </>
      )}
      <MobileSelectSheet
        open={monthOpen}
        onOpenChange={setMonthOpen}
        title={t("results.month")}
        value={`${period.year}-${period.month}`}
        options={months.map((item) => ({ value: `${item.year}-${item.month}`, label: formatLocalized(new Date(item.year, item.month, 1), "LLLL yyyy") }))}
        onChange={(value) => {
          const [year, month] = value.split("-").map(Number);
          setPeriod({ year, month });
        }}
      />
    </ParentScreen>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  loading: { opacity: 0.6 },
  /* `grid grid-cols-2 gap-3` */
  tiles: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  tile: { width: "47%", flexGrow: 1, flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 20 },
  tileIcon: { width: 40, height: 40, borderRadius: dsRadius.xl, alignItems: "center", justifyContent: "center" },
  heading: { paddingHorizontal: 4 },
  list: { overflow: "hidden", borderRadius: 20 },
  subject: { gap: 12, padding: 16 },
  subjectHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  subjectIcon: { width: 44, height: 44, borderRadius: dsRadius.xl, alignItems: "center", justifyContent: "center" },
  average: { flexShrink: 0, alignItems: "flex-end" },
  averageValue: { lineHeight: 28 },
  track: { height: 6, overflow: "hidden", borderRadius: 3 },
  fill: { height: "100%", borderRadius: 3 },
});
