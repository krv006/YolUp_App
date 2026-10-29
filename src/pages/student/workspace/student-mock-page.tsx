import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatClock, secondsUntil, syncServerTime, useExamCurrent, useExamReminder } from "@/modules/exam";
import { ROUTES } from "@/shared/config";
import type { ExamSummary } from "@/shared/types";
import { DsGradient, DsText, dsRadius, headingFont, Icon, MobileEmptyCard, MobilePageHeader, MobileSegment, PullRefresh, toast, useDs, type DsColor } from "@/shared/ui";
import { sameDay, shortDateTime } from "../lib/format";
import { useStudentWorkspace } from "./use-student-workspace";

/**
 * O'quvchining mock testlari — veb `student-mock-page.tsx` (tor ekran):
 * davom etayotgan imtihon kartasi (qolgan vaqt), shablon bo'yicha filtr
 * (bittadan ko'p bo'lsa) va imtihonlar ro'yxati.
 */
export function StudentMockPage() {
  const { t } = useTranslation("student");
  const { t: te } = useTranslation("exam");
  const months = useTranslation("lesson").t("list.months", { returnObjects: true }) as string[];
  const ds = useDs();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const data = useStudentWorkspace();
  const [filter, setFilter] = useState("all");
  const reminder = useExamReminder();

  function toggleReminder(exam: ExamSummary) {
    const enabled = !exam.hasReminder;
    reminder.mutate(
      { id: exam.id, enabled },
      {
        onSuccess: (minutes) => toast.success(enabled ? t("workspace.mock.reminderSet", { count: minutes ?? 15 }) : t("workspace.mock.reminderCleared")),
      }
    );
  }

  const items = [...data.exams].sort((a, b) => {
    const rank = { running: 0, upcoming: 1, finished: 2 };
    return rank[a.state] - rank[b.state] || (a.state === "finished" ? b.startsAt.localeCompare(a.startsAt) : a.startsAt.localeCompare(b.startsAt));
  });
  const templates = [...new Set(items.map((exam) => exam.templateKey))];
  const visible = filter === "all" ? items : items.filter((exam) => exam.templateKey === filter);
  const live = items.find((exam) => exam.state === "running") ?? null;
  const chips = [
    { id: "all", label: `${t("workspace.mock.filters.all")} · ${items.length}` },
    ...templates.map((key) => ({ id: key, label: `${te(`mock.templates.${key}`, { defaultValue: key.toUpperCase() })} · ${items.filter((exam) => exam.templateKey === key).length}` })),
  ];

  function length(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (!hours) return t("workspace.mock.minutesOnly", { count: rest });
    return rest ? t("workspace.mock.hoursMinutes", { hours, minutes: rest }) : t("workspace.mock.hours", { count: hours });
  }

  function when(exam: ExamSummary): string {
    const start = new Date(exam.startsAt);
    if (sameDay(start, data.now)) return t("workspace.mock.today", { time: `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}` });
    return shortDateTime(start, months);
  }

  const chipTone: Record<ExamSummary["state"], { bg: string; fg: DsColor }> = {
    running: { bg: ds.c["danger-bg"], fg: "error-text" },
    upcoming: { bg: ds.c["brand-subtle"], fg: "brand" },
    finished: { bg: ds.c["success-bg"], fg: "success-fg" },
  };

  const goBack = () => (router.canGoBack() ? router.back() : router.replace(ROUTES.student.workspace as never));

  return (
    <View style={[styles.fill, { backgroundColor: ds.c.canvas }]}>
      <ScrollView
        style={styles.fill}
        contentContainerStyle={[styles.page, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }]}
        refreshControl={<PullRefresh onRefresh={() => queryClient.refetchQueries({ type: "active" })} />}
      >
        <DsGradient name="auth" />
        <MobilePageHeader title={t("workspace.mock.title")} backLabel={t("workspace.back")} onBack={goBack} />
        {live ? <LiveCard exam={live} /> : null}
        {templates.length > 1 ? <MobileSegment scroll="auto" items={chips} value={filter} onChange={setFilter} /> : null}

        <View style={styles.list}>
          {data.examsLoading ? Array.from({ length: 3 }, (_, index) => <View key={index} style={[styles.skeleton, { backgroundColor: ds.c.surface }]} />) : null}
          {visible.map((exam) => {
            const tone = chipTone[exam.state];
            return (
              <View key={exam.id} style={[styles.card, { backgroundColor: ds.c.surface }]}>
                <View style={styles.cardHead}>
                  <View style={[styles.icon, { backgroundColor: ds.c["brand-subtle"] }]}>
                    <Icon name="emoji-events" size={22} color={ds.c.brand} />
                  </View>
                  <View style={styles.grow}>
                    <View style={styles.titleRow}>
                      <DsText v="title" numberOfLines={1} style={styles.shrink}>
                        {exam.title}
                      </DsText>
                      <View style={[styles.state, { backgroundColor: tone.bg }]}>
                        {exam.state === "running" ? <View style={[styles.stateDot, { backgroundColor: ds.c["error-text"] }]} /> : null}
                        <DsText v="caption-strong" c={tone.fg}>
                          {t(`workspace.mock.states.${exam.state}`)}
                        </DsText>
                      </View>
                    </View>
                    <DsText v="body-xs" c="ink-secondary" numberOfLines={1}>
                      {[exam.courseTitle, when(exam), length(exam.totalMinutes)].filter(Boolean).join(" · ")}
                    </DsText>
                  </View>
                </View>
                {exam.state === "running" ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => router.push(ROUTES.student.mockExam(exam.id) as never)}
                    style={({ pressed }) => [styles.action, { backgroundColor: pressed ? ds.c.tint : ds.c["brand-subtle"] }]}
                  >
                    <DsText v="body-sm" w="600" c="brand">
                      {t("workspace.mock.continue")}
                    </DsText>
                  </Pressable>
                ) : exam.state === "finished" ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => router.push(ROUTES.student.mockResults(exam.id) as never)}
                    style={({ pressed }) => [styles.action, { borderWidth: 1, borderColor: ds.c["line-strong"], backgroundColor: pressed ? ds.c.subtle : ds.c.surface }]}
                  >
                    <DsText v="body-sm" w="600">
                      {t("workspace.mock.result")}
                    </DsText>
                    {exam.myTotal?.label || exam.myTotal?.score != null ? (
                      // `rounded-full bg-success-bg px-2 py-0.5 text-caption-strong text-success-fg`
                      <View style={[styles.total, { backgroundColor: ds.c["success-bg"] }]}>
                        <DsText v="caption-strong" c="success-fg">
                          {exam.myTotal.label || exam.myTotal.score}
                        </DsText>
                      </View>
                    ) : null}
                  </Pressable>
                ) : (
                  // Veb #161: mock eslatmasi — yoqilgan bo'lsa `bg-brand-subtle text-brand` va daqiqasi
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: Boolean(exam.hasReminder) }}
                    disabled={reminder.isPending && reminder.variables?.id === exam.id}
                    onPress={() => toggleReminder(exam)}
                    style={({ pressed }) => [
                      styles.action,
                      exam.hasReminder
                        ? { backgroundColor: pressed ? ds.c.tint : ds.c["brand-subtle"] }
                        : { borderWidth: 1, borderColor: ds.c["line-strong"], backgroundColor: pressed ? ds.c.subtle : ds.c.surface },
                    ]}
                  >
                    <Icon name={exam.hasReminder ? "notifications-off" : "notifications"} size={18} color={exam.hasReminder ? ds.c.brand : ds.c.ink} />
                    <DsText v="body-sm" w="600" c={exam.hasReminder ? "brand" : "ink"}>
                      {exam.hasReminder ? t("workspace.mock.reminderOn", { count: exam.reminderMinutes ?? 15 }) : t("workspace.mock.remind")}
                    </DsText>
                  </Pressable>
                )}
              </View>
            );
          })}
          {!data.examsLoading && !visible.length ? <MobileEmptyCard icon="emoji-events" title={t("workspace.mock.emptyTitle")} description={t("workspace.mock.emptyHint")} /> : null}
        </View>
      </ScrollView>
    </View>
  );
}

/** Davom etayotgan imtihon — `rounded-2xl bg-brand p-[18px]`, katta soat va "Imtihonga qaytish". */
function LiveCard({ exam }: { exam: ExamSummary }) {
  const { t } = useTranslation("student");
  const ds = useDs();
  const router = useRouter();
  const current = useExamCurrent(exam.id, 30_000);
  const [, setTick] = useState(0);

  useEffect(() => {
    syncServerTime(current.data?.serverNow ?? exam.serverNow);
  }, [current.data?.serverNow, exam.serverNow]);

  useEffect(() => {
    const id = setInterval(() => setTick((value) => value + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const section = current.data?.item?.title ?? "";
  const remaining = secondsUntil(current.data?.item?.endsAt ?? current.data?.endsAt ?? exam.endsAt);

  return (
    <View style={[styles.live, { backgroundColor: ds.c.brand }]}>
      <View style={styles.liveHead}>
        <View style={[styles.liveBadge, { backgroundColor: ds.c.surface }]}>
          <View style={[styles.liveDot, { backgroundColor: ds.c["error-text"] }]} />
          <DsText v="caption-strong" c="error-text" style={styles.upper}>
            {t("workspace.mock.live")}
          </DsText>
        </View>
        <DsText v="body-xs" c="ink-inverse" numberOfLines={1} style={styles.shrink}>
          {[exam.title, section].filter(Boolean).join(" · ")}
        </DsText>
      </View>
      <DsText c="ink-inverse" numeric style={styles.clock}>
        {formatClock(remaining)}
      </DsText>
      <DsText v="body-xs" c="ink-inverse" style={styles.mt8}>
        {section ? t("workspace.mock.leftSection", { section }) : t("workspace.mock.left")}
      </DsText>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push(ROUTES.student.mockExam(exam.id) as never)}
        style={({ pressed }) => [styles.liveButton, { backgroundColor: pressed ? ds.c.subtle : ds.c.surface }]}
      >
        <Icon name="arrow-forward" size={18} color={ds.c.ink} />
        <DsText v="body-sm" w="600">
          {t("workspace.mock.back")}
        </DsText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  grow: { flex: 1, minWidth: 0, gap: 2 },
  shrink: { flexShrink: 1, minWidth: 0 },
  upper: { textTransform: "uppercase" },
  mt8: { marginTop: 8 },
  /* `gap-5 px-4 pt-5 pb-32` */
  page: { gap: 20, paddingHorizontal: 16 },
  list: { gap: 12 },
  skeleton: { height: 80, borderRadius: dsRadius["2xl"] },
  /* `min-h-20 rounded-2xl px-4 py-3 gap-3`, tugma `col-span-2` */
  card: { minHeight: 80, gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderRadius: dsRadius["2xl"] },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  icon: { width: 44, height: 44, borderRadius: dsRadius.xl, alignItems: "center", justifyContent: "center" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  state: { height: 20, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 6, borderRadius: 10 },
  stateDot: { width: 6, height: 6, borderRadius: 3 },
  action: { height: 42, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 14, borderRadius: 21 },
  total: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: dsRadius.full },
  /* `rounded-2xl bg-brand p-[18px]` */
  live: { padding: 18, borderRadius: dsRadius["2xl"] },
  liveHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  liveBadge: { height: 22, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, borderRadius: 11 },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  /* `font-heading text-[48px]/[56px] font-bold tabular-nums` */
  clock: { marginTop: 12, fontFamily: headingFont("700"), fontSize: 48, lineHeight: 56 },
  liveButton: { marginTop: 12, height: 42, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 21 },
});
