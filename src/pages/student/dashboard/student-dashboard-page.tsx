import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLessonPresence } from "@/modules/live";
import { notificationContent } from "@/modules/notification";
import { ROUTES } from "@/shared/config";
import { useOnlineStatus } from "@/shared/model";
import type { Lesson } from "@/shared/types";
import { DsGradient, DsText, dsRadius, GroupTile, Icon, MobileListCard, MobileListRow, PullRefresh, useDs } from "@/shared/ui";
import { MobileUserHeader } from "@/widgets/mobile-user-header";
import { lessonClock } from "../lib/clock";
import { useStudentHome } from "./use-student-home";

type Home = ReturnType<typeof useStudentHome>;

const DAY_MS = 86_400_000;

function endOf(lesson: Lesson): Date {
  return new Date(new Date(lesson.startsAt).getTime() + (lesson.durationMinutes || 45) * 60000);
}

/**
 * O'quvchining bosh sahifasi — veb `student-dashboard-page.tsx` ning tor
 * ekran shoxi (`student-mobile-home.tsx`): sarlavha, oflayn ogohlantirish,
 * navbatdagi/jonli dars kartasi, muddati yaqin vazifalar, bugungi darslar
 * (yoki "Bugun dars yo'q") va so'nggi baholar.
 */
export function StudentDashboardPage() {
  const { t } = useTranslation("student");
  const { t: td } = useTranslation("dashboard");
  const months = td("months", { returnObjects: true }) as string[];
  const ds = useDs();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const online = useOnlineStatus();
  const queryClient = useQueryClient();
  const home = useStudentHome();
  const presence = useLessonPresence(home.liveLesson?.id, Boolean(home.liveLesson));
  const { now, heroLesson, todayLessons } = home;
  const joinedCount = home.liveLesson ? (presence.data?.count ?? null) : null;

  const dayLabel = (date: Date) => `${date.getDate()}-${(months[date.getMonth()] ?? "").toLowerCase()}`;
  const upcoming = heroLesson && heroLesson.status === "scheduled" && !todayLessons.length ? heroLesson : null;
  const emptyHint = upcoming
    ? new Date(upcoming.startsAt).toDateString() === new Date(now.getTime() + DAY_MS).toDateString()
      ? t("home.today.emptyNext", { time: lessonClock(new Date(upcoming.startsAt)), title: upcoming.courseTitle })
      : t("home.today.emptyLater", { date: dayLabel(new Date(upcoming.startsAt)), title: upcoming.courseTitle })
    : t("home.today.emptyNone");

  const openChat = (courseId: string) => {
    const room = home.roomByCourse.get(courseId);
    router.push((room ? ROUTES.student.chat(room) : ROUTES.student.chats) as never);
  };
  const openSchedule = () => router.navigate(ROUTES.student.schedule as never);

  function due(value: string): string {
    const date = new Date(value);
    if (date.toDateString() === now.toDateString()) return t("home.tasks.today", { time: lessonClock(date) });
    if (date.toDateString() === new Date(now.getTime() + DAY_MS).toDateString()) return t("home.tasks.tomorrow", { time: lessonClock(date) });
    return t("home.tasks.daysLeft", { count: Math.ceil((date.getTime() - now.getTime()) / DAY_MS) });
  }

  const nearest = home.tasks.find((task) => task.dueAt);

  return (
    <View style={[styles.fill, { backgroundColor: ds.c.canvas }]}>
      <ScrollView style={styles.fill} contentContainerStyle={[styles.page, { paddingTop: insets.top + 20 }]} refreshControl={<PullRefresh onRefresh={() => queryClient.refetchQueries({ type: "active" })} />}>
        <DsGradient name="auth" />
        <View style={styles.stack}>
          <MobileUserHeader />

          {!online ? (
            <View style={[styles.offline, { backgroundColor: ds.c["surface-inverse"] }]}>
              <Icon name="wifi" size={20} color={ds.c["ink-inverse"]} />
              <DsText v="body-sm" c="ink-inverse" numberOfLines={1} style={styles.grow}>
                {t("home.offline")}
              </DsText>
            </View>
          ) : null}

          {home.loading ? (
            <HomeSkeleton />
          ) : (
            <>
              {heroLesson ? <Hero home={home} lesson={heroLesson} joinedCount={joinedCount} onChat={openChat} /> : null}

              {home.tasks.length ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push(ROUTES.student.homework as never, { withAnchor: true })}
                  style={({ pressed }) => [styles.tasks, { backgroundColor: pressed ? ds.c.subtle : ds.c.surface }]}
                >
                  <View style={[styles.tasksIcon, { backgroundColor: ds.c["accent-saffron-bg"] }]}>
                    <Icon name="assign" size={22} color={ds.c["accent-saffron-fg"]} />
                  </View>
                  <View style={styles.grow}>
                    <DsText v="title" numberOfLines={1}>
                      {t("home.mobile.tasksTitle")}
                    </DsText>
                    <DsText v="body-sm" c="ink-secondary" numberOfLines={1}>
                      {nearest?.dueAt ? t("home.mobile.tasksHint", { count: home.tasks.length, when: due(nearest.dueAt) }) : t("home.tasks.test", { count: home.tasks.length })}
                    </DsText>
                  </View>
                  <View style={[styles.count, { backgroundColor: ds.c.brand }]}>
                    <DsText v="label-strong" c="on-action">
                      {home.tasks.length}
                    </DsText>
                  </View>
                  <Icon name="chevron-right" size={20} color={ds.c["icon-secondary"]} />
                </Pressable>
              ) : null}

              {todayLessons.length ? (
                <View style={styles.section}>
                  <View style={styles.sectionHead}>
                    <DsText v="title" heading numberOfLines={1} style={styles.grow}>
                      {t("home.today.title")}
                    </DsText>
                    <Pressable accessibilityRole="button" onPress={openSchedule} hitSlop={8}>
                      <DsText v="body-sm" w="500" c="brand-strong">
                        {t("home.seeAll")}
                      </DsText>
                    </Pressable>
                  </View>
                  <View style={[styles.lessons, { backgroundColor: ds.c.surface }]}>
                    {todayLessons.map((lesson, index) => (
                      <LessonRow key={lesson.id} home={home} lesson={lesson} last={index === todayLessons.length - 1} />
                    ))}
                  </View>
                </View>
              ) : (
                <View style={[styles.empty, { backgroundColor: ds.c.surface }]}>
                  <View style={styles.emptyHead}>
                    <View style={[styles.emptyIcon, { backgroundColor: ds.c["success-bg"] }]}>
                      <Icon name="event-fill" size={22} color={ds.c["success-fg"]} />
                    </View>
                    <View style={styles.grow}>
                      <DsText v="title" numberOfLines={1}>
                        {t("home.today.emptyTitle")}
                      </DsText>
                      <DsText v="body-sm" c="ink-secondary" numberOfLines={2}>
                        {emptyHint}
                      </DsText>
                    </View>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    onPress={openSchedule}
                    style={({ pressed }) => [styles.openSchedule, { backgroundColor: ds.c["brand-subtle"], opacity: pressed ? 0.85 : 1 }]}
                  >
                    <Icon name="nav-calendar" size={18} color={ds.c.brand} />
                    <DsText v="button" c="brand">
                      {t("home.today.openSchedule")}
                    </DsText>
                  </Pressable>
                </View>
              )}

              {home.recentGrades.length ? (
                <View style={styles.section}>
                  <DsText v="title" heading>
                    {t("home.grades.title")}
                  </DsText>
                  <MobileListCard>
                    {home.recentGrades.slice(0, 3).map((item, index, list) => {
                      const { title, body } = notificationContent(item);
                      return (
                        <MobileListRow
                          key={item.id}
                          icon={item.link?.type === "submission" ? "quiz" : "star"}
                          tone="bg-accent-saffron-bg text-accent-saffron-fg"
                          title={title}
                          subtitle={body}
                          chevron={false}
                          last={index === list.length - 1}
                        />
                      );
                    })}
                  </MobileListCard>
                </View>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function LessonRow({ home, lesson, last }: { home: Home; lesson: Lesson; last: boolean }) {
  const { t } = useTranslation("student");
  const ds = useDs();
  const router = useRouter();
  const live = lesson.status === "live";
  const finished = lesson.status === "finished";
  const course = home.courseById.get(lesson.courseId);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push((finished ? ROUTES.recording(lesson.id) : ROUTES.live(lesson.id)) as never)}
      style={({ pressed }) => [
        styles.lessonRow,
        !last && { borderBottomWidth: 1, borderBottomColor: ds.c.line },
        live ? { backgroundColor: ds.c["brand-subtle"] } : pressed && { backgroundColor: ds.c.subtle },
      ]}
    >
      <View style={styles.lessonTime}>
        <DsText v="title-sm" c={live ? "brand" : finished ? "ink-secondary" : "ink"}>
          {lessonClock(new Date(lesson.startsAt))}
        </DsText>
        <DsText v="caption" c="ink-secondary">
          {lessonClock(endOf(lesson))}
        </DsText>
      </View>
      <GroupTile name={lesson.courseTitle} tone={course?.color} src={course?.avatarUrl} box={44} radius={dsRadius.xl} />
      <View style={[styles.grow, styles.lessonText]}>
        <DsText v="title" c={finished ? "ink-secondary" : "ink"} numberOfLines={1}>
          {lesson.courseTitle}
        </DsText>
        {live ? (
          <View style={styles.lessonState}>
            <View style={[styles.liveDot, { backgroundColor: ds.c.danger }]} />
            <DsText v="body-sm" c="danger" numberOfLines={1}>
              {t("home.mobile.liveRow")}
            </DsText>
          </View>
        ) : finished ? (
          <View style={styles.lessonState}>
            <Icon name="check" size={16} color={ds.c["success-fg"]} />
            <DsText v="body-sm" c="success-fg" numberOfLines={1}>
              {t("home.today.finished", { teacher: course?.teacher ?? "" })}
            </DsText>
          </View>
        ) : (
          <DsText v="body-sm" c="ink-secondary" numberOfLines={1}>
            {[course?.teacher, lesson.title].filter(Boolean).join(" · ")}
          </DsText>
        )}
      </View>
      {live ? (
        <View style={[styles.enter, { backgroundColor: ds.c.brand }]}>
          <DsText v="button" c="on-action">
            {t("home.mobile.enter")}
          </DsText>
        </View>
      ) : (
        <Icon name="chevron-right" size={20} color={ds.c["icon-secondary"]} />
      )}
    </Pressable>
  );
}

function Hero({ home, lesson, joinedCount, onChat }: { home: Home; lesson: Lesson; joinedCount: number | null; onChat: (courseId: string) => void }) {
  const { t } = useTranslation("student");
  const ds = useDs();
  const router = useRouter();
  const now = home.now.getTime();
  const start = new Date(lesson.startsAt);
  const live = lesson.status === "live";
  const today = start.toDateString() === new Date(now).toDateString();
  const minutesToStart = Math.round((start.getTime() - now) / 60000);
  const minutesLive = Math.max(0, Math.round((now - start.getTime()) / 60000));
  const teacher = home.courseById.get(lesson.courseId)?.teacher ?? "";

  const badge = live
    ? t("home.hero.live", { count: minutesLive })
    : !today
      ? t("home.hero.tomorrow", { time: lessonClock(start) })
      : minutesToStart <= 0
        ? t("home.hero.startsNow")
        : minutesToStart < 60
          ? t("home.hero.startsIn", { count: minutesToStart })
          : t("home.hero.startsInHours", { count: Math.round(minutesToStart / 60) });

  const meta = live
    ? [teacher, joinedCount !== null ? t("home.hero.inLesson", { count: joinedCount }) : ""]
    : [`${lessonClock(start)} – ${lessonClock(endOf(lesson))}`, teacher];

  return (
    <View style={[styles.hero, { backgroundColor: ds.c.brand }]}>
      <View style={[styles.heroBadge, { backgroundColor: ds.c["on-brand-subtle"] }]}>
        <View style={[styles.heroDot, { backgroundColor: live ? ds.c.danger : ds.c.saffron }]} />
        <DsText v="caption-strong" c="on-action">
          {badge}
        </DsText>
      </View>
      <DsText v="title-lg" heading c="on-action" numberOfLines={1} style={styles.heroTitle}>
        {lesson.title ? `${lesson.courseTitle} — ${lesson.title}` : lesson.courseTitle}
      </DsText>
      <DsText v="body-sm" c="on-action" numberOfLines={1} style={styles.heroMeta}>
        {meta.filter(Boolean).join(" · ")}
      </DsText>
      <View style={styles.heroActions}>
        <Pressable
          accessibilityRole="button"
          onPress={() => (today ? router.push(ROUTES.live(lesson.id) as never) : router.navigate(ROUTES.student.schedule as never))}
          style={({ pressed }) => [styles.heroPrimary, { backgroundColor: ds.c.surface, opacity: pressed ? 0.9 : 1 }]}
        >
          <Icon name={today ? "videocam-fill" : "nav-calendar"} size={20} color={ds.c.ink} />
          <DsText v="button">{today ? t("home.hero.join") : t("home.hero.details")}</DsText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => onChat(lesson.courseId)}
          style={({ pressed }) => [styles.heroChat, { backgroundColor: ds.c["brand-subtle"], opacity: pressed ? 0.9 : 1 }]}
        >
          <Icon name="chat" size={18} color={ds.c.brand} />
          <DsText v="button" c="brand">
            {t("home.mobile.chat")}
          </DsText>
        </Pressable>
      </View>
    </View>
  );
}

/** Veb `CardsSkeleton` — kartalar o'rnida xira bloklar. */
function HomeSkeleton() {
  const ds = useDs();
  return (
    <>
      <View style={[styles.skeletonHero, { backgroundColor: ds.c["brand-subtle"] }]} />
      <View style={[styles.skeletonCard, { backgroundColor: ds.c.surface }]} />
      <View style={[styles.skeletonCard, { backgroundColor: ds.c.surface }]} />
    </>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  /* `px-4 pt-5 pb-32` — pastda suzuvchi panelga joy */
  page: { paddingHorizontal: 16, paddingBottom: 128 },
  stack: { gap: 24 },
  offline: { height: 44, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, borderRadius: dsRadius.xl },
  /* `rounded-xl bg-brand p-4` */
  hero: { padding: 16, borderRadius: dsRadius.xl },
  heroBadge: { alignSelf: "flex-start", height: 24, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, borderRadius: dsRadius.full },
  heroDot: { width: 8, height: 8, borderRadius: dsRadius.full },
  heroTitle: { marginTop: 12 },
  heroMeta: { marginTop: 2, opacity: 0.85 },
  heroActions: { marginTop: 12, flexDirection: "row", gap: 8 },
  heroPrimary: { flex: 1, minWidth: 0, height: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: dsRadius.full },
  heroChat: { height: 48, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, borderRadius: dsRadius.full },
  /* `rounded-xl bg-surface px-4 py-3.5 gap-3` */
  tasks: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderRadius: dsRadius.xl },
  tasksIcon: { width: 44, height: 44, borderRadius: dsRadius.xl, alignItems: "center", justifyContent: "center" },
  count: { height: 28, minWidth: 34, paddingHorizontal: 8, borderRadius: dsRadius.full, alignItems: "center", justifyContent: "center" },
  section: { gap: 12 },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  lessons: { overflow: "hidden", paddingVertical: 4, borderRadius: dsRadius.xl },
  lessonRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  lessonTime: { width: 44 },
  lessonText: { gap: 2 },
  lessonState: { flexDirection: "row", alignItems: "center", gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: dsRadius.full },
  enter: { height: 36, justifyContent: "center", paddingHorizontal: 16, borderRadius: dsRadius.full },
  /* `rounded-xl bg-surface p-4 gap-4` */
  empty: { gap: 16, padding: 16, borderRadius: dsRadius.xl },
  emptyHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  emptyIcon: { width: 40, height: 40, borderRadius: dsRadius.lg, alignItems: "center", justifyContent: "center" },
  openSchedule: { height: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: dsRadius.full },
  skeletonHero: { height: 150, borderRadius: dsRadius.xl },
  skeletonCard: { height: 72, borderRadius: dsRadius.xl },
});
