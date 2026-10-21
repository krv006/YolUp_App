import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import {
  addDays,
  endOfDay,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  startOfDay,
} from "date-fns";
import { useAuth } from "@/modules/auth";
import { useConversations } from "@/modules/conversation";
import {
  LessonCreateSheet,
  LessonDetailSheet,
  RateLessonSheet,
  ScheduleDay,
  ScheduleEmpty,
  ScheduleList,
  ScheduleMonth,
  ScheduleSidebar,
  ScheduleSkeleton,
  ScheduleWeek,
  useLessons,
  useScheduleStore,
  type ScheduleView,
} from "@/modules/lesson";
import { ROLES } from "@/shared/constants";
import { ROUTES } from "@/shared/config";
import type { Lesson } from "@/shared/types";
import { AppBar, AppBarAction, Icon, radius, Screen, Segmented, Text, useTheme } from "@/shared/ui";
import { NotificationBell } from "@/modules/notification";

const VIEWS: readonly ScheduleView[] = ["list", "day", "week", "month"];

/**
 * Jadval — veb `pages/schedule/schedule-page.tsx` va uning tepa paneli
 * (`widgets/conversation-topbar`, `section="schedule"`) porti.
 *
 * Tuzilish (tor ekran):
 *   tepa panel     "Jadval" · [+] (o'qituvchi) · qo'ng'iroq
 *   boshqaruv      Ro'yxat / Kun / Hafta / Oy;  ‹ oraliq › Bugun
 *   yon panel      hafta tasmasi + eng yaqin dars (kun/hafta ko'rinishida)
 *   ko'rinish      tanlangan oraliqdagi darslar yoki bo'sh holat
 *
 * Holat (`useScheduleStore`) vebdan aynan ko'chirilgan: ko'rinish, tayanch
 * sana va qadam qoidasi bir xil.
 */
export function SchedulePage() {
  const { t } = useTranslation("lesson");
  const { t: tm } = useTranslation("mobile");
  const router = useRouter();
  const { palette } = useTheme();
  const { user } = useAuth();
  const lessons = useLessons({ page_size: 200 });
  const view = useScheduleStore((state) => state.view);
  const anchorValue = useScheduleStore((state) => state.anchor);
  const setView = useScheduleStore((state) => state.setView);
  const setAnchor = useScheduleStore((state) => state.setAnchor);
  const step = useScheduleStore((state) => state.step);
  const goToday = useScheduleStore((state) => state.goToday);
  const createOpen = useScheduleStore((state) => state.createOpen);
  const setCreateOpen = useScheduleStore((state) => state.setCreateOpen);
  const [detail, setDetail] = useState<Lesson | null>(null);
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [rateTarget, setRateTarget] = useState<Lesson | null>(null);

  const isStudent = user?.role === ROLES.STUDENT;
  const canManage = !isStudent;
  const role = isStudent ? "student" : "teacher";
  const conversations = useConversations(role);

  const anchor = new Date(anchorValue);
  const items = lessons.data ?? [];
  const months = t("list.months", { returnObjects: true }) as string[];
  const monthsLong = t("list.monthsLong", { returnObjects: true }) as string[];

  const inRange = items.filter((lesson) => {
    const date = new Date(lesson.startsAt);
    if (view === "day") return isSameDay(date, anchor);
    if (view === "week")
      return isWithinInterval(date, {
        start: startOfDay(addDays(anchor, -3)),
        end: endOfDay(addDays(anchor, 3)),
      });
    if (view === "list")
      return isWithinInterval(date, {
        start: startOfDay(anchor),
        end: endOfDay(addDays(anchor, 6)),
      });
    return isSameMonth(date, anchor);
  });

  function monthName(index: number): string {
    return (monthsLong[index] ?? "").toLowerCase();
  }

  function rangeLabel(): string {
    const date = anchor;
    if (view === "month") return `${monthsLong[date.getMonth()]}, ${date.getFullYear()}`;
    if (view === "list") {
      const end = addDays(date, 6);
      return date.getMonth() === end.getMonth()
        ? `${date.getDate()} – ${end.getDate()} ${monthName(date.getMonth())}, ${date.getFullYear()}`
        : `${date.getDate()} ${months[date.getMonth()]} – ${end.getDate()} ${months[end.getMonth()]}, ${end.getFullYear()}`;
    }
    if (view === "day") return `${date.getDate()} ${monthName(date.getMonth())}, ${date.getFullYear()}`;
    const start = addDays(date, -3);
    const end = addDays(date, 3);
    return start.getMonth() === end.getMonth()
      ? `${start.getDate()} – ${end.getDate()} ${monthName(start.getMonth())}, ${start.getFullYear()}`
      : `${start.getDate()} ${months[start.getMonth()]} – ${end.getDate()} ${months[end.getMonth()]}, ${end.getFullYear()}`;
  }

  /**
   * Kurs suhbatini kerakli bo'limda ochadi.
   *
   * Vebda davomat va vazifalar — alohida sahifalar (`/teacher/attendance`,
   * `/teacher/chats/assignments`). Mobilda ular guruh ichidagi bo'limlar,
   * shuning uchun kursning suhbati topilib, o'sha bo'lim ochiladi.
   */
  function openCourseTab(lesson: Lesson, tab: "attendance" | "assignments") {
    const room = (conversations.data ?? []).find((item) => item.courseId === lesson.courseId);
    if (!room) {
      router.push(isStudent ? ROUTES.student.chats : ROUTES.teacher.chats);
      return;
    }
    const chat = isStudent ? `${ROUTES.student.chats}/${room.id}` : ROUTES.teacher.chat(room.id);
    router.push(`${chat}?tab=${tab}`);
  }

  function openAttendance(lesson: Lesson) {
    setDetail(null);
    // O'quvchi uchun vebda ham shu jadval sahifasining o'zi.
    if (isStudent) return;
    openCourseTab(lesson, "attendance");
  }

  function openHomework(lesson: Lesson) {
    setDetail(null);
    openCourseTab(lesson, "assignments");
  }

  const emptyTitle =
    view === "list"
      ? t("schedule.emptyWeek")
      : view === "day"
        ? t("schedule.emptyDay")
        : view === "week"
          ? t("schedule.emptyWeek")
          : t("schedule.emptyMonth");

  const onSelectDay = (date: Date) => setAnchor(startOfDay(date));

  return (
    <Screen padded={false}>
      <AppBar title={tm("schedule.jadval")}>
        {role === "teacher" ? (
          <AppBarAction
            name="add"
            variant="primary"
            label={t("schedule.addLesson")}
            onPress={() => setCreateOpen(true)}
          />
        ) : null}
        <NotificationBell />
      </AppBar>

      {/* Boshqaruv — `flex-col gap-2.5 border-b bg-canvas px-4 pb-3` */}
      <View
        style={[styles.controls, { backgroundColor: palette.background, borderBottomColor: palette.border }]}
      >
        <Segmented
          label={tm("schedule.jadval")}
          value={view}
          onChange={setView}
          options={VIEWS.map((item) => ({ value: item, label: t(`schedule.${item}`) }))}
        />

        <View style={styles.navigator}>
          <RoundButton label={t("calendar.prevMonth")} onPress={() => step(-1)}>
            <Icon name="chevron-left" size={18} color={palette["muted-foreground"]} />
          </RoundButton>
          <Text variant="label" numberOfLines={1} style={styles.range}>
            {rangeLabel()}
          </Text>
          <RoundButton label={t("calendar.nextMonth")} onPress={() => step(1)}>
            <Icon name="chevron-right" size={18} color={palette["muted-foreground"]} />
          </RoundButton>
          <Pressable
            accessibilityRole="button"
            onPress={goToday}
            style={({ pressed }) => [
              styles.today,
              {
                backgroundColor: pressed ? palette["surface-subtle"] : palette.surface,
                borderColor: palette.border,
              },
            ]}
          >
            <Text variant="label">{t("schedule.today")}</Text>
          </Pressable>
        </View>
      </View>

      <ScheduleSidebar
        anchor={anchor}
        lessons={items}
        onSelectDay={onSelectDay}
        onAttendance={openAttendance}
        compact={view === "month" || view === "list"}
        hideUpcoming={view === "day"}
      />

      <View style={styles.section}>
        {lessons.isLoading && !items.length ? (
          <ScheduleSkeleton />
        ) : !inRange.length ? (
          <ScheduleEmpty title={emptyTitle} canCreate={canManage} onCreate={() => setCreateOpen(true)} />
        ) : view === "list" ? (
          <ScheduleList anchor={anchor} lessons={inRange} onSelect={setDetail} onSelectDay={onSelectDay} />
        ) : view === "day" ? (
          <ScheduleDay anchor={anchor} lessons={inRange} onSelect={setDetail} />
        ) : view === "week" ? (
          <ScheduleWeek anchor={anchor} lessons={inRange} onSelect={setDetail} onSelectDay={onSelectDay} />
        ) : (
          <ScheduleMonth anchor={anchor} lessons={inRange} onSelect={setDetail} onSelectDay={onSelectDay} />
        )}
      </View>

      <LessonDetailSheet
        lesson={detail}
        onClose={() => setDetail(null)}
        canManage={canManage}
        onAttendance={openAttendance}
        onHomework={openHomework}
        onEdit={(lesson) => {
          setDetail(null);
          setEditing(lesson);
        }}
        onRate={(lesson) => {
          setDetail(null);
          setRateTarget(lesson);
        }}
      />

      <LessonCreateSheet
        open={createOpen || Boolean(editing)}
        onClose={() => {
          setCreateOpen(false);
          setEditing(null);
        }}
        date={anchor}
        lesson={editing}
      />

      <RateLessonSheet lesson={rateTarget} onClose={() => setRateTarget(null)} />
    </Screen>
  );
}

/** `size-10 rounded-full border border-line bg-surface` */
function RoundButton({
  label,
  onPress,
  children,
}: {
  label: string;
  onPress: () => void;
  children: React.ReactNode;
}) {
  const { palette } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.round,
        {
          backgroundColor: pressed ? palette["surface-subtle"] : palette.surface,
          borderColor: palette.border,
        },
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  controls: { gap: 10, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  navigator: { flexDirection: "row", alignItems: "center", gap: 8 },
  range: { flex: 1, minWidth: 0, textAlign: "center" },
  round: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  today: {
    height: 40,
    justifyContent: "center",
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: radius.full,
  },
  section: { flex: 1, minHeight: 0 },
});
