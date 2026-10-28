import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMyAnalytics } from "@/modules/analytics";
import { useConversations } from "@/modules/conversation";
import { useCourses } from "@/modules/course";
import { ROUTES } from "@/shared/config";
import {
  DsGradient,
  DsText,
  dsRadius,
  GroupTile,
  MobileEmptyCard,
  MobileListCard,
  MobileListRow,
  MobileListSkeleton,
  MobileRoundButton,
  MobileSectionTitle,
  MobileStatsCard,
  MobileTitleHeader,
  PullRefresh,
  useDs,
} from "@/shared/ui";

function percent(value: number | null): string {
  return value === null ? "—" : `${Math.round(value)}%`;
}

/**
 * O'qituvchi tahlili — veb `analytics-page.tsx` + `mobile-analytics.tsx`
 * (tor ekran): joriy oy kartasi (o'rtacha baho, baholar soni, ishonchlilik),
 * guruhlar bo'yicha test va davomat foizi; guruh bosilsa uning chati ochiladi.
 *
 * "Batafsil" profildagi "Baholarim" sahifasini ochadi.
 */
export function WorkspaceAnalyticsPage() {
  const { t } = useTranslation("workspace");
  const { t: tl } = useTranslation("lesson");
  const ds = useDs();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const analytics = useMyAnalytics();
  const groups = useCourses();
  const conversations = useConversations("teacher");
  const months = tl("list.monthsLong", { returnObjects: true }) as string[];
  const month = months[new Date().getMonth()] ?? "";

  const stats = analytics.data?.kind === "teacher" ? analytics.data.overall : null;
  const courses = analytics.data?.kind === "teacher" ? analytics.data.courses : [];
  const empty = !analytics.isLoading && ((!stats && !courses.length) || (!courses.length && !stats?.ratingCount));
  const looks = new Map((groups.data ?? []).map((course) => [course.id, { src: course.avatarUrl, tone: course.color }]));
  const rooms = new Map((conversations.data ?? []).filter((item) => item.courseId).map((item) => [item.courseId as string, item.id]));

  function openCourse(courseId: string) {
    const room = rooms.get(courseId);
    router.push((room ? ROUTES.teacher.chat(room) : ROUTES.teacher.chats) as never);
  }

  return (
    <View style={[styles.fill, { backgroundColor: ds.c.canvas }]}>
      <ScrollView
        style={styles.fill}
        contentContainerStyle={[styles.page, { paddingTop: insets.top + 22, paddingBottom: insets.bottom + 32 }]}
        refreshControl={<PullRefresh onRefresh={() => Promise.all([analytics.refetch(), groups.refetch()])} />}
      >
        <DsGradient name="auth" />
        <MobileTitleHeader
          eyebrow={t("analytics.mobile.eyebrow")}
          title={t("analytics.title")}
          action={
            empty ? (
              <View style={styles.spacer} />
            ) : (
              <MobileRoundButton icon="settings" label={t("analytics.mobile.settings")} onPress={() => router.push(`${ROUTES.teacher.profile}/system` as never, { withAnchor: true })} />
            )
          }
        />

        {analytics.isLoading ? (
          <MobileListSkeleton card rows={3} />
        ) : empty ? (
          <MobileEmptyCard icon="bar-chart" title={t("analytics.emptyTitle")} description={t("analytics.emptyDescription")} />
        ) : (
          <>
            <MobileStatsCard
              label={month}
              actionLabel={t("home.mobile.details")}
              onAction={() => router.push(`${ROUTES.teacher.profile}/ratings` as never, { withAnchor: true })}
              items={[
                { id: "rating", value: stats?.avgRating == null ? "—" : stats.avgRating.toFixed(1).replace(".", ","), label: t("analytics.avgRating") },
                { id: "count", value: stats?.ratingCount ?? 0, label: t("analytics.mobile.ratings") },
                { id: "reliability", value: percent(stats?.reliability ?? null), label: t("analytics.reliability") },
              ]}
            />

            <View style={styles.section}>
              <MobileSectionTitle>{t("analytics.byCourse")}</MobileSectionTitle>
              {courses.length ? (
                <MobileListCard>
                  {courses.map((course, index) => {
                    const look = looks.get(course.courseId);
                    return (
                      <MobileListRow
                        key={course.courseId}
                        leading={<GroupTile name={course.courseTitle} src={look?.src} tone={look?.tone} box={44} radius={dsRadius.xl} />}
                        title={course.courseTitle}
                        subtitle={
                          <>
                            <DsText v="body-xs" w="600" c="brand-strong">
                              {t("analytics.mobile.test", { value: percent(course.quizAvgPercentage) })}
                            </DsText>
                            {"   "}
                            <DsText v="body-xs" w="600" c="success-fg">
                              {t("analytics.mobile.attendance", { value: percent(course.attendanceRate) })}
                            </DsText>
                          </>
                        }
                        last={index === courses.length - 1}
                        onPress={() => openCourse(course.courseId)}
                      />
                    );
                  })}
                </MobileListCard>
              ) : (
                <View style={[styles.noCourses, { backgroundColor: ds.c.surface }]}>
                  <DsText v="body-sm" c="ink-secondary" style={styles.center}>
                    {t("analytics.noCourses")}
                  </DsText>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { textAlign: "center" },
  /* `gap-5.5 px-4 pt-5.5 pb-8` */
  page: { gap: 22, paddingHorizontal: 16 },
  spacer: { width: 44, height: 44 },
  section: { gap: 12 },
  noCourses: { paddingHorizontal: 20, paddingVertical: 32, borderRadius: dsRadius.xl },
});
