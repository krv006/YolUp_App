import { useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { CalendarDays, List } from "lucide-react-native";
import { useAuth } from "@/modules/auth";
import {
  FinishLessonSheet,
  formatDayTitle,
  groupLessonsByDay,
  resolveInitialMonth,
  toDayKey,
  useLessons,
  useLessonView,
  RateLessonSheet,
} from "@/modules/lesson";
import { LessonCalendar } from "@/modules/lesson/ui/lesson-calendar";
import { LessonCard } from "@/modules/lesson/ui/lesson-card";
import { ROLES } from "@/shared/constants";
import { ROUTES } from "@/shared/config";
import type { Lesson } from "@/shared/types";
import {
  Chip,
  Screen,
  ScreenEmpty,
  ScreenError,
  ScreenLoading,
  Text,
  useTheme,
} from "@/shared/ui";

/**
 * Barcha guruhlardagi darslar — veb `pages/schedule/schedule-page.tsx` porti.
 *
 * Backend ro'yxatni rolga o'zi moslashtiradi: o'quvchi yozilgan
 * kurslarining, o'qituvchi o'z kurslarining darslarini oladi.
 *
 * Ko'rinish tanlovi (`useLessonView`) veb bilan bir xil store'dan keladi va
 * MMKV'da saqlanadi — foydalanuvchi tanlovi ilova yopilgach ham qoladi.
 */
export function SchedulePage() {
  const router = useRouter();
  const { palette } = useTheme();
  const { user } = useAuth();
  const { view, setView } = useLessonView();

  const lessons = useLessons({ page_size: 200 });
  const items = useMemo(() => lessons.data ?? [], [lessons.data]);

  const [rateTarget, setRateTarget] = useState<Lesson | null>(null);
  const [finishTarget, setFinishTarget] = useState<Lesson | null>(null);
  const [month, setMonth] = useState<Date | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  // Ochiladigan oy darslar kelgandan keyin aniqlanadi (veb bilan bir xil
  // qoida: bugungi oy, bo'lmasa eng yaqin dars oyi).
  const activeMonth = month ?? resolveInitialMonth(items);
  const activeKey = selectedKey ?? toDayKey(new Date());

  const byDay = useMemo(() => groupLessonsByDay(items), [items]);
  const dayLessons = byDay.get(activeKey) ?? [];

  const isStudent = user?.role === ROLES.STUDENT;

  /**
   * Jadvalda dars TAHRIRLANMAYDI — u kursga tegishli amal va guruh ichida
   * qilinadi (veb bilan bir xil qaror). Bu yerda faqat kirish va yozuv.
   */
  const actions = {
    onJoin: (lesson: Lesson) => router.push(ROUTES.live(lesson.id)),
    onRecording: (lesson: Lesson) => router.push(ROUTES.recording(lesson.id)),
    // Baholash — faqat o'quvchida; yakunlash — faqat o'qituvchida.
    onRate: isStudent ? setRateTarget : undefined,
    onFinish: isStudent ? undefined : setFinishTarget,
  };

  if (lessons.isLoading) {
    return (
      <Screen>
        <ScreenLoading label="Kalendar yuklanmoqda…" />
      </Screen>
    );
  }

  if (lessons.isError) {
    return (
      <Screen>
        <ScreenError
          message={lessons.error?.message ?? "Darslarni yuklab bo'lmadi"}
          onRetry={() => void lessons.refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <View style={[styles.head, { borderBottomColor: palette.border }]}>
        <Text variant="heading">Mening darslarim</Text>
        <View style={styles.switch}>
          <Chip label="Kalendar" selected={view === "calendar"} onPress={() => setView("calendar")} />
          <Chip label="Ro'yxat" selected={view === "list"} onPress={() => setView("list")} />
        </View>
      </View>

      {items.length === 0 ? (
        <ScreenEmpty
          title="Hali dars rejalashtirilmagan"
          description="Kursga yozilganingizdan keyin darslar shu yerda ko'rinadi."
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.body}
          refreshControl={
            <RefreshControl
              refreshing={lessons.isRefetching}
              onRefresh={() => void lessons.refetch()}
              tintColor={palette["muted-foreground"]}
            />
          }
        >
          {view === "calendar" ? (
            <>
              <LessonCalendar
                lessons={items}
                month={activeMonth}
                onMonthChange={setMonth}
                selectedKey={activeKey}
                onSelectDay={setSelectedKey}
              />

              <View style={styles.dayHead}>
                <CalendarDays size={16} color={palette["muted-foreground"]} />
                <Text variant="label" style={styles.dayTitle}>
                  {formatDayTitle(new Date(activeKey))}
                </Text>
              </View>

              {dayLessons.length === 0 ? (
                <Text variant="caption" tone="muted" style={styles.dayEmpty}>
                  Bu kunda dars yo'q.
                </Text>
              ) : (
                dayLessons.map((lesson) => (
                  <LessonCard key={lesson.id} lesson={lesson} {...actions} />
                ))
              )}
            </>
          ) : (
            <>
              <View style={styles.dayHead}>
                <List size={16} color={palette["muted-foreground"]} />
                <Text variant="label" style={styles.dayTitle}>
                  Barcha darslar ({items.length})
                </Text>
              </View>
              {items.map((lesson) => (
                <LessonCard key={lesson.id} lesson={lesson} {...actions} />
              ))}
            </>
          )}
        </ScrollView>
      )}

      <RateLessonSheet lesson={rateTarget} onClose={() => setRateTarget(null)} />
      <FinishLessonSheet
        lesson={finishTarget}
        onClose={() => setFinishTarget(null)}
        onFinished={() => void lessons.refetch()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: {
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  switch: { flexDirection: "row", gap: 8 },
  body: { padding: 16, gap: 12, paddingBottom: 32 },
  dayHead: { flexDirection: "row", alignItems: "center", gap: 8, paddingTop: 6 },
  dayTitle: { textTransform: "capitalize" },
  dayEmpty: { paddingVertical: 12 },
});
