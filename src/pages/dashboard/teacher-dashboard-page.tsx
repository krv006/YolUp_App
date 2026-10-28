import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueries } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNetInfo } from "@react-native-community/netinfo";
import { useAuth } from "@/modules/auth";
import { useTeacherDashboard } from "@/modules/analytics";
import { useConversations, useGroupImages, useNewConversationStore } from "@/modules/conversation";
import { useCourses } from "@/modules/course";
import { homeworkApi, homeworkKeys } from "@/modules/homework";
import { useLessons } from "@/modules/lesson";
import { useLessonPresence } from "@/modules/live";
import { ROUTES } from "@/shared/config";
import type { Lesson } from "@/shared/types";
import {
  DsGradient,
  DsText,
  dsRadius,
  GroupTile,
  Icon,
  MobileListCard,
  MobileListRow,
  MobileSectionTitle,
  MobileWarningNote,
  PullRefresh,
  useDs,
} from "@/shared/ui";
import { MobileUserHeader } from "@/widgets/mobile-user-header";
import { MobileOnboarding } from "./mobile-onboarding";

const LESSON_PAGE_SIZE = 60;
const TICK_MS = 30_000;

function isToday(value: string): boolean {
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toDateString() === new Date().toDateString();
}

function clockOf(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function endOf(lesson: Lesson): Date {
  return new Date(new Date(lesson.startsAt).getTime() + (lesson.durationMinutes || 45) * 60000);
}

function upcoming(items: Lesson[] | undefined): Lesson | undefined {
  const now = Date.now();
  return (items ?? [])
    .filter((lesson) => new Date(lesson.startsAt).getTime() > now && lesson.status === "scheduled")
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];
}

/**
 * O'qituvchining bosh sahifasi (M5.1–5.6) — veb `pages/teacher/dashboard`
 * ning tor ekran varianti (`mobile-dashboard.tsx`): foydalanuvchi sarlavhasi,
 * oflayn va tasdiqlanmagan ogohlantirishlari, dars kartasi (kutilmoqda /
 * jonli), "Tekshirish kerak", bugungi yoki ertangi darslar, guruh yo'q va
 * bugun dars yo'q holatlari, birinchi kirishda tanishuv.
 */
export function TeacherDashboardPage() {
  const { t } = useTranslation("dashboard");
  const ds = useDs();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const net = useNetInfo();
  const online = net.isConnected !== false;
  const { user } = useAuth();
  const openNewGroup = useNewConversationStore((state) => state.setOpen);
  const courses = useCourses();
  const lessons = useLessons({ page_size: LESSON_PAGE_SIZE });
  const dashboard = useTeacherDashboard();
  const conversations = useConversations("teacher");
  const groupImages = useGroupImages("teacher");
  const [today] = useState(() => new Date());

  const groups = useMemo(() => courses.data ?? [], [courses.data]);

  const assignmentQueries = useQueries({
    queries: groups.map((course) => ({
      queryKey: homeworkKeys.assignments(course.id),
      queryFn: ({ signal }: { signal: AbortSignal }) => homeworkApi.getAssignments(course.id, { signal }),
    })),
  });
  const assignments = useMemo(() => assignmentQueries.flatMap((query) => query.data ?? []), [assignmentQueries]);

  const todayLessons = useMemo(
    () =>
      (lessons.data ?? [])
        .filter((lesson) => isToday(lesson.startsAt) && lesson.status !== "cancelled")
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    [lessons.data]
  );

  const liveLesson = todayLessons.find((lesson) => lesson.status === "live") ?? null;
  const presence = useLessonPresence(liveLesson?.id, Boolean(liveLesson));
  const nextToday = todayLessons.find((lesson) => lesson.status === "scheduled") ?? null;
  const heroLesson = liveLesson ?? nextToday;

  const toReview = useMemo(
    () =>
      assignments
        .filter((item) => item.status !== "draft")
        .map((item) => ({ assignment: item, pending: item.submissions.filter((entry) => !entry.grade).length }))
        .filter((row) => row.pending > 0),
    [assignments]
  );
  const pendingWorks = dashboard.data?.submissionsPending ?? toReview.reduce((sum, row) => sum + row.pending, 0);

  const studentsByCourse = new Map(groups.map((course) => [course.id, course.studentCount ?? 0]));
  const toneByCourse = new Map(groups.map((course) => [course.id, course.color]));
  const avatarByCourse = new Map<string, string | null | undefined>(groupImages);
  for (const course of groups) if (course.avatarUrl) avatarByCourse.set(course.id, course.avatarUrl);

  const roomByCourse = new Map(
    (conversations.data ?? []).filter((item) => item.courseId).map((item) => [item.courseId as string, item.id])
  );

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowLessons = (lessons.data ?? [])
    .filter((lesson) => new Date(lesson.startsAt).toDateString() === tomorrow.toDateString() && lesson.status !== "cancelled")
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  const loading = courses.isLoading || lessons.isLoading;
  const approved = user?.isApproved !== false;
  const hasGroups = groups.length > 0;

  const openLesson = (lesson: Lesson) => router.push(ROUTES.live(lesson.id) as never);
  const openSchedule = () => router.navigate(ROUTES.teacher.schedule as never);
  const openReview = () => router.push(ROUTES.teacher.homework as never, { withAnchor: true });
  const openChat = (lesson: Lesson) => {
    const room = roomByCourse.get(lesson.courseId);
    router.push((room ? ROUTES.teacher.chat(room) : ROUTES.teacher.chats) as never);
  };

  const rows = { studentsByCourse, toneByCourse, avatarByCourse, onOpenLesson: openLesson };

  return (
    <View style={[styles.fill, { backgroundColor: ds.c.canvas }]}>
      <ScrollView
        style={styles.fill}
        contentContainerStyle={[styles.page, { paddingTop: insets.top + 20 }]}
        refreshControl={
          <PullRefresh
            onRefresh={() => Promise.all([courses.refetch(), lessons.refetch(), dashboard.refetch(), conversations.refetch()])}
          />
        }
      >
        <DsGradient name="auth" />
        <View style={online ? styles.stackOnline : styles.stackOffline}>
          <MobileUserHeader />

          {!online ? (
            <View style={[styles.offline, { backgroundColor: ds.c["surface-inverse"] }]}>
              <Icon name="wifi" size={20} color={ds.c["ink-inverse"]} />
              <DsText v="body-sm" c="ink-inverse" numberOfLines={1} style={styles.grow}>
                {t("mobile.offline")}
              </DsText>
            </View>
          ) : null}

          {!approved ? <MobileWarningNote>{t("banner.notApproved")}</MobileWarningNote> : null}

          {loading ? (
            <DashboardSkeleton title={t("mobile.todayTitle")} />
          ) : !hasGroups ? (
            <NoGroups onCreate={() => openNewGroup(true)} disabled={!approved} />
          ) : (
            <>
              {heroLesson ? (
                <Hero
                  lesson={heroLesson}
                  live={Boolean(liveLesson)}
                  students={studentsByCourse.get(heroLesson.courseId) ?? 0}
                  joined={liveLesson ? (presence.data?.count ?? null) : null}
                  onOpen={openLesson}
                  onChat={openChat}
                />
              ) : !todayLessons.length ? (
                <NoLessons next={upcoming(lessons.data) ?? null} onAdd={openSchedule} />
              ) : null}

              {pendingWorks > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={openReview}
                  style={({ pressed }) => [styles.review, { backgroundColor: pressed ? ds.c.subtle : ds.c.surface }]}
                >
                  <View style={[styles.reviewIcon, { backgroundColor: ds.c["accent-saffron-bg"] }]}>
                    <Icon name="assign" size={22} color={ds.c["accent-saffron-fg"]} />
                  </View>
                  <View style={styles.grow}>
                    <DsText v="title" numberOfLines={1}>
                      {t("mobile.reviewTitle")}
                    </DsText>
                    <DsText v="body-sm" c="ink-secondary" numberOfLines={1}>
                      {t("mobile.reviewHint", { works: pendingWorks, tasks: toReview.length })}
                    </DsText>
                  </View>
                  <View style={[styles.reviewCount, { backgroundColor: ds.c.brand }]}>
                    <DsText v="label-strong" c="on-action">
                      {pendingWorks}
                    </DsText>
                  </View>
                  <Icon name="chevron-right" size={20} color={ds.c["icon-secondary"]} />
                </Pressable>
              ) : null}

              {todayLessons.length ? (
                <Section title={t("mobile.todayTitle")} action={t("mobile.seeAll")} onAction={openSchedule}>
                  <LessonList {...rows} lessons={todayLessons} />
                </Section>
              ) : tomorrowLessons.length ? (
                <Section title={t("mobile.tomorrowTitle")} action={t("mobile.schedule")} onAction={openSchedule}>
                  <LessonList {...rows} lessons={tomorrowLessons} upcoming />
                </Section>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>

      {user?.id && !loading ? <MobileOnboarding userId={user.id} /> : null}
    </View>
  );
}

function Hero({
  lesson,
  live,
  students,
  joined,
  onOpen,
  onChat,
}: {
  lesson: Lesson;
  live: boolean;
  students: number;
  joined: number | null;
  onOpen: (lesson: Lesson) => void;
  onChat: (lesson: Lesson) => void;
}) {
  const { t } = useTranslation("dashboard");
  const ds = useDs();
  const [now, setNow] = useState(() => Date.now());

  // Har 30 soniyada "N daqiqadan keyin" / "N daqiqa davom etmoqda" yangilanadi.
  useEffect(() => {
    const timer = setTimeout(() => setNow(Date.now()), TICK_MS);
    return () => clearTimeout(timer);
  }, [now]);

  const start = new Date(lesson.startsAt);
  const minutesToStart = Math.round((start.getTime() - now) / 60000);
  const minutesLive = Math.max(0, Math.round((now - start.getTime()) / 60000));
  const range = `${clockOf(start)} – ${clockOf(endOf(lesson))}`;
  const topic = lesson.topic || lesson.title;

  const badge = live
    ? t("mobile.live", { count: minutesLive })
    : minutesToStart <= 0
      ? t("mobile.startsNow")
      : minutesToStart < 60
        ? t("mobile.startsIn", { count: minutesToStart })
        : t("mobile.startsInHours", { count: Math.round(minutesToStart / 60) });

  const meta = live
    ? [t("mobile.joined", { done: joined ?? 0, total: students }), range]
    : [range, t("mobile.students", { count: students }), lesson.quizId ? t("mobile.quizAttached") : null];

  return (
    <View style={[styles.hero, { backgroundColor: ds.c.brand }]}>
      <View style={[styles.heroBadge, { backgroundColor: ds.c["on-brand-subtle"] }]}>
        <View style={[styles.heroDot, { backgroundColor: live ? ds.c.danger : ds.c.saffron }]} />
        <DsText v="caption-strong" c="on-action">
          {badge}
        </DsText>
      </View>
      <DsText v="title-lg" heading c="on-action" numberOfLines={1} style={styles.heroTitle}>
        {topic ? `${lesson.courseTitle} — ${topic}` : lesson.courseTitle}
      </DsText>
      <DsText v="body-sm" c="on-action" numberOfLines={1} style={styles.heroMeta}>
        {meta.filter(Boolean).join(" · ")}
      </DsText>
      <View style={styles.heroActions}>
        <Pressable
          accessibilityRole="button"
          onPress={() => onOpen(lesson)}
          style={({ pressed }) => [styles.heroPrimary, { backgroundColor: ds.c.surface, opacity: pressed ? 0.9 : 1 }]}
        >
          <Icon name="videocam-fill" size={20} color={ds.c.ink} />
          <DsText v="button">{live ? t("mobile.join") : t("mobile.start")}</DsText>
        </Pressable>
        {live ? null : (
          <Pressable
            accessibilityRole="button"
            onPress={() => onChat(lesson)}
            style={({ pressed }) => [styles.heroChat, { backgroundColor: ds.c["brand-subtle"], opacity: pressed ? 0.9 : 1 }]}
          >
            <Icon name="chat" size={18} color={ds.c.brand} />
            <DsText v="button" c="brand">
              {t("mobile.chat")}
            </DsText>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function Section({ title, action, onAction, children }: { title: string; action: string; onAction: () => void; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <DsText v="title" heading numberOfLines={1} style={styles.grow}>
          {title}
        </DsText>
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8}>
          <DsText v="body-sm" w="500" c="brand-strong">
            {action}
          </DsText>
        </Pressable>
      </View>
      {children}
    </View>
  );
}

interface LessonListProps {
  lessons: Lesson[];
  upcoming?: boolean;
  studentsByCourse: Map<string, number>;
  toneByCourse: Map<string, string | undefined>;
  avatarByCourse: Map<string, string | null | undefined>;
  onOpenLesson: (lesson: Lesson) => void;
}

function LessonList({ lessons, upcoming, studentsByCourse, toneByCourse, avatarByCourse, onOpenLesson }: LessonListProps) {
  const { t } = useTranslation("dashboard");
  const ds = useDs();
  return (
    <View style={[styles.lessons, { backgroundColor: ds.c.surface }]}>
      {lessons.map((lesson, index) => {
        const live = !upcoming && lesson.status === "live";
        const finished = !upcoming && lesson.status === "finished";
        const students = studentsByCourse.get(lesson.courseId) ?? 0;
        return (
          <Pressable
            key={lesson.id}
            accessibilityRole="button"
            onPress={() => onOpenLesson(lesson)}
            style={({ pressed }) => [
              styles.lessonRow,
              index < lessons.length - 1 && { borderBottomWidth: 1, borderBottomColor: ds.c.line },
              live ? { backgroundColor: ds.c["brand-subtle"] } : pressed && { backgroundColor: ds.c.subtle },
            ]}
          >
            <View style={styles.lessonTime}>
              <DsText v="title-sm" c={live ? "brand" : finished ? "ink-secondary" : "ink"}>
                {clockOf(lesson.startsAt)}
              </DsText>
              <DsText v="caption" c="ink-secondary">
                {clockOf(endOf(lesson))}
              </DsText>
            </View>
            <GroupTile
              name={lesson.courseTitle}
              tone={toneByCourse.get(lesson.courseId)}
              src={avatarByCourse.get(lesson.courseId)}
              box={44}
              radius={dsRadius.xl}
            />
            <View style={[styles.grow, styles.lessonText]}>
              <DsText v="title" c={finished ? "ink-secondary" : "ink"} numberOfLines={1}>
                {lesson.courseTitle}
              </DsText>
              {live ? (
                <View style={styles.lessonState}>
                  <View style={[styles.liveDot, { backgroundColor: ds.c.danger }]} />
                  <DsText v="body-sm" c="danger" numberOfLines={1}>
                    {t("mobile.liveRow")}
                  </DsText>
                </View>
              ) : finished ? (
                <View style={styles.lessonState}>
                  <Icon name="check" size={16} color={ds.c["success-fg"]} />
                  <DsText v="body-sm" c="success-fg" numberOfLines={1}>
                    {t("mobile.finished", { count: students })}
                  </DsText>
                </View>
              ) : (
                <DsText v="body-sm" c="ink-secondary" numberOfLines={1}>
                  {t("mobile.students", { count: students })}
                </DsText>
              )}
            </View>
            {live ? (
              <View style={[styles.enter, { backgroundColor: ds.c.brand }]}>
                <DsText v="button" c="on-action">
                  {t("mobile.enter")}
                </DsText>
              </View>
            ) : (
              <Icon name="chevron-right" size={20} color={ds.c["icon-secondary"]} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

function NoLessons({ next, onAdd }: { next: Lesson | null; onAdd: () => void }) {
  const { t } = useTranslation("dashboard");
  const ds = useDs();
  return (
    <View style={[styles.noLessons, { backgroundColor: ds.c.surface }]}>
      <View style={styles.noLessonsHead}>
        <View style={[styles.noLessonsIcon, { backgroundColor: ds.c["success-bg"] }]}>
          <Icon name="check-circle" size={22} color={ds.c["success-fg"]} />
        </View>
        <View style={styles.grow}>
          <DsText v="title" numberOfLines={1}>
            {t("mobile.noLessonsTitle")}
          </DsText>
          <DsText v="body-sm" c="ink-secondary" numberOfLines={1}>
            {next ? t("mobile.noLessonsNext", { time: clockOf(next.startsAt), title: next.courseTitle }) : t("mobile.noLessonsHint")}
          </DsText>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onAdd}
        style={({ pressed }) => [styles.addLesson, { backgroundColor: ds.c["brand-subtle"], opacity: pressed ? 0.85 : 1 }]}
      >
        <Icon name="add" size={18} color={ds.c.brand} />
        <DsText v="button" c="brand">
          {t("mobile.addLesson")}
        </DsText>
      </Pressable>
    </View>
  );
}

/** Birinchi qadamlar (`STEPS`) — ohanglar vebdagi klass satrlari. */
const STEPS = [
  { id: "group", icon: "person", tone: "bg-brand-subtle text-ink" },
  { id: "link", icon: "chat", tone: "bg-success-bg text-success-fg" },
  { id: "lesson", icon: "clock", tone: "bg-accent-teal-bg text-accent-teal-fg" },
] as const;

function NoGroups({ onCreate, disabled }: { onCreate: () => void; disabled: boolean }) {
  const { t } = useTranslation("dashboard");
  const ds = useDs();
  return (
    <>
      <View style={[styles.noGroups, { backgroundColor: ds.c.surface }]}>
        <View style={[styles.noGroupsIcon, { backgroundColor: ds.c["brand-subtle"] }]}>
          <Icon name="add" size={30} color={ds.c.brand} />
        </View>
        <DsText v="title" heading w="500" numberOfLines={1} style={styles.noGroupsTitle}>
          {t("mobile.noGroupsTitle")}
        </DsText>
        <DsText v="body-sm" c="ink-secondary" style={styles.noGroupsHint}>
          {t("mobile.noGroupsHint")}
        </DsText>
        <Pressable
          accessibilityRole="button"
          disabled={disabled}
          onPress={onCreate}
          style={({ pressed }) => [
            styles.noGroupsButton,
            { backgroundColor: pressed ? ds.c["brand-strong"] : ds.c.brand },
            disabled && styles.disabled,
          ]}
        >
          <Icon name="add" size={18} color={ds.c["on-action"]} />
          <DsText v="button" c="on-action">
            {t("mobile.createGroup")}
          </DsText>
        </Pressable>
      </View>

      <View style={styles.steps}>
        <MobileSectionTitle>{t("mobile.stepsTitle")}</MobileSectionTitle>
        <MobileListCard>
          {STEPS.map((step, index) => (
            <MobileListRow
              key={step.id}
              icon={step.icon}
              tone={step.tone}
              title={t(`mobile.steps.${step.id}.title`)}
              subtitle={t(`mobile.steps.${step.id}.hint`)}
              last={index === STEPS.length - 1}
              onPress={onCreate}
            />
          ))}
        </MobileListCard>
      </View>
    </>
  );
}

function DashboardSkeleton({ title }: { title: string }) {
  const ds = useDs();
  const bar = (width: number, height: number, color: string) => (
    <View style={{ width, maxWidth: "100%", height, borderRadius: dsRadius.full, backgroundColor: color }} />
  );
  return (
    <>
      <View style={[styles.skeletonHero, { backgroundColor: ds.c["brand-subtle"] }]}>
        {bar(120, 14, ds.c.surface)}
        {bar(260, 20, ds.c.surface)}
        {bar(90, 12, ds.c.surface)}
      </View>
      <View style={styles.section}>
        <DsText v="title" heading>
          {title}
        </DsText>
        <View style={[styles.lessons, { backgroundColor: ds.c.surface }]}>
          {Array.from({ length: 5 }, (_, index) => (
            <View key={index} style={[styles.lessonRow, index < 4 && { borderBottomWidth: 1, borderBottomColor: ds.c.line }]}>
              <View style={[styles.skeletonTime, { backgroundColor: ds.c.subtle }]} />
              <View style={[styles.skeletonTile, { backgroundColor: ds.c.subtle }]} />
              <View style={[styles.grow, styles.skeletonLines]}>
                {bar(140, 12, ds.c.subtle)}
                {bar(90, 12, ds.c.subtle)}
              </View>
            </View>
          ))}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  disabled: { opacity: 0.4 },
  /* `px-4 pt-5 pb-32` — pastda suzuvchi panelga joy */
  page: { paddingHorizontal: 16, paddingBottom: 128 },
  stackOnline: { gap: 24 },
  stackOffline: { gap: 20 },
  /* `h-11 rounded-xl bg-surface-inverse px-4 gap-3` */
  offline: { height: 44, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, borderRadius: dsRadius.xl },
  /* `rounded-xl bg-surface px-4 py-3.5 gap-3` */
  review: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderRadius: dsRadius.xl },
  reviewIcon: { width: 44, height: 44, borderRadius: dsRadius.xl, alignItems: "center", justifyContent: "center" },
  /* `h-7 min-w-8.5 rounded-full bg-brand px-2` */
  reviewCount: { height: 28, minWidth: 34, paddingHorizontal: 8, borderRadius: dsRadius.full, alignItems: "center", justifyContent: "center" },
  /* `rounded-xl bg-brand p-4` */
  hero: { padding: 16, borderRadius: dsRadius.xl },
  heroBadge: { alignSelf: "flex-start", height: 24, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, borderRadius: dsRadius.full },
  heroDot: { width: 8, height: 8, borderRadius: dsRadius.full },
  heroTitle: { marginTop: 12 },
  heroMeta: { marginTop: 2, opacity: 0.85 },
  heroActions: { marginTop: 12, flexDirection: "row", gap: 8 },
  /* `h-12 flex-1 rounded-full bg-surface gap-2` */
  heroPrimary: { flex: 1, minWidth: 0, height: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: dsRadius.full },
  /* `h-12 rounded-full bg-brand-subtle px-4 gap-1.5` */
  heroChat: { height: 48, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, borderRadius: dsRadius.full },
  section: { gap: 12 },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  /* `rounded-xl bg-surface py-1` */
  lessons: { overflow: "hidden", paddingVertical: 4, borderRadius: dsRadius.xl },
  /* `border-b px-4 py-3.5 gap-3` */
  lessonRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  lessonTime: { width: 44 },
  lessonText: { gap: 2 },
  lessonState: { flexDirection: "row", alignItems: "center", gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: dsRadius.full },
  /* `h-9 rounded-full bg-brand px-4` */
  enter: { height: 36, justifyContent: "center", paddingHorizontal: 16, borderRadius: dsRadius.full },
  /* `rounded-xl bg-surface p-4 gap-4` */
  noLessons: { gap: 16, padding: 16, borderRadius: dsRadius.xl },
  noLessonsHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  noLessonsIcon: { width: 40, height: 40, borderRadius: dsRadius.lg, alignItems: "center", justifyContent: "center" },
  addLesson: { height: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: dsRadius.full },
  /* `items-center rounded-xl bg-surface px-10 py-7 text-center` */
  noGroups: { alignItems: "center", paddingHorizontal: 40, paddingVertical: 28, borderRadius: dsRadius.xl },
  noGroupsIcon: { width: 72, height: 72, borderRadius: dsRadius.full, alignItems: "center", justifyContent: "center" },
  noGroupsTitle: { marginTop: 12 },
  noGroupsHint: { marginTop: 12, textAlign: "center" },
  noGroupsButton: { marginTop: 12, height: 44, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, borderRadius: dsRadius.full },
  steps: { gap: 12, paddingTop: 2 },
  /* `h-37.5 rounded-xl bg-brand-subtle p-4 gap-3` */
  skeletonHero: { height: 150, gap: 12, padding: 16, borderRadius: dsRadius.xl },
  skeletonTime: { width: 44, height: 36, borderRadius: dsRadius.md },
  skeletonTile: { width: 44, height: 44, borderRadius: dsRadius.md },
  skeletonLines: { gap: 10 },
});
