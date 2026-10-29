import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useAttendance } from "@/modules/attendance";
import { RateLessonSheet } from "@/modules/lesson";
import { ROUTES } from "@/shared/config";
import type { Lesson, LessonStatus } from "@/shared/types";
import { DsText, dsRadius, Icon, MobileEmptyCard, toast, useDs, type DsColor, type IconName } from "@/shared/ui";
import { PanelHeading } from "@/widgets/group-workspace/panel-heading";

const DAY_MS = 86_400_000;
const HISTORY_DAYS = 30;

const CHIP_ICON: Record<LessonStatus, IconName> = {
  live: "videocam-fill",
  scheduled: "schedule",
  finished: "check-circle",
  cancelled: "cancel",
};

function hhmm(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export interface StudentLessonsProps {
  lessons?: Lesson[];
  loading: boolean;
  teacher?: string;
}

/**
 * Guruhdagi darslar (o'quvchi) — veb `student-lessons.tsx` (tor ekran):
 * oxirgi 30 kun va kelgusi darslar; vaqt plitkasi, holat yorlig'i, mavzu;
 * jonli darsga "Qo'shilish", tugaganida "Video" va "Baholash".
 */
export function StudentLessons({ lessons = [], loading, teacher = "" }: StudentLessonsProps) {
  const { t } = useTranslation("student");
  const { t: tl } = useTranslation("lesson");
  const months = tl("list.months", { returnObjects: true }) as string[];
  const ds = useDs();
  const router = useRouter();
  const attendance = useAttendance({ page_size: 200 });
  const [rateTarget, setRateTarget] = useState<Lesson | null>(null);
  const [now] = useState(() => Date.now());

  const joined = useMemo(() => new Set((attendance.data ?? []).filter((row) => row.joinedAt).map((row) => row.lessonId)), [attendance.data]);
  const visible = useMemo(
    () => lessons.filter((lesson) => lesson.status !== "cancelled" && new Date(lesson.startsAt).getTime() > now - HISTORY_DAYS * DAY_MS).sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    [lessons, now]
  );

  const tile: Record<LessonStatus, string> = { live: ds.c["error-text"], scheduled: ds.c["ink-secondary"], finished: ds.c["line-strong"], cancelled: ds.c["line-strong"] };
  const chip: Record<LessonStatus, { bg?: string; fg: DsColor }> = {
    live: { bg: ds.c["danger-bg"], fg: "error-text" },
    scheduled: { fg: "ink-secondary" },
    finished: { bg: ds.c.subtle, fg: "ink-secondary" },
    cancelled: { bg: ds.c.subtle, fg: "ink-secondary" },
  };

  function dateLabel(start: Date): string {
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const day = new Date(start);
    day.setHours(0, 0, 0, 0);
    const diff = Math.round((day.getTime() - today.getTime()) / DAY_MS);
    const short = `${start.getDate()}-${(months[start.getMonth()] ?? "").toLowerCase()}`;
    if (diff === 0) return t("groupWorkspace.lessonsTab.today", { date: short });
    if (diff === -1) return t("groupWorkspace.lessonsTab.yesterday", { date: short });
    if (diff === 1) return t("groupWorkspace.lessonsTab.tomorrow", { date: short });
    return short;
  }

  return (
    <ScrollView style={styles.fill} contentContainerStyle={styles.page}>
      <PanelHeading eyebrow={t("groupWorkspace.lessonsTab.eyebrow")} title={t("groupWorkspace.lessonsTab.title")} subtitle={t("groupWorkspace.lessonsTab.subtitle")} />

      {loading && !lessons.length ? (
        <View style={styles.list}>
          {Array.from({ length: 3 }, (_, index) => (
            <View key={index} style={[styles.card, { backgroundColor: ds.c.surface }]}>
              <View style={styles.head}>
                <View style={[styles.tile, { backgroundColor: ds.c.skeleton }]} />
                <View style={styles.skeletonLines}>
                  <View style={[styles.skeletonLine, { width: 90, backgroundColor: ds.c.skeleton }]} />
                  <View style={[styles.skeletonLine, { width: 170, height: 16, backgroundColor: ds.c.skeleton }]} />
                  <View style={[styles.skeletonLine, { width: 120, height: 12, backgroundColor: ds.c.skeleton }]} />
                </View>
              </View>
              <View style={styles.pair}>
                <View style={[styles.skeletonButton, { backgroundColor: ds.c.skeleton }]} />
                <View style={[styles.skeletonButton, { backgroundColor: ds.c.skeleton }]} />
              </View>
            </View>
          ))}
        </View>
      ) : visible.length ? (
        <View style={styles.list}>
          {visible.map((lesson) => {
            const start = new Date(lesson.startsAt);
            const minutes = lesson.durationMinutes || 45;
            const end = new Date(start.getTime() + minutes * 60_000);
            const status = lesson.status;
            const attended = lesson.attended ?? joined.has(lesson.id);
            const meta =
              status === "finished"
                ? t(attended ? "groupWorkspace.lessonsTab.attended" : "groupWorkspace.lessonsTab.missed")
                : status === "live"
                  ? teacher
                  : `${hhmm(start)} – ${hhmm(end)}`;
            const tone = chip[status];
            return (
              <View key={lesson.id} style={[styles.card, { backgroundColor: ds.c.surface }]}>
                <View style={styles.head}>
                  <View style={[styles.tile, { backgroundColor: tile[status] }]}>
                    <DsText v="title-sm" w="600" c="ink-inverse" style={styles.tileTime}>
                      {hhmm(start)}
                    </DsText>
                    <DsText v="caption" w="500" c="ink-inverse" style={styles.tileMinutes}>
                      {t("groupWorkspace.lessonsTab.minutes", { count: minutes })}
                    </DsText>
                  </View>
                  <View style={styles.info}>
                    <View style={[styles.chip, tone.bg ? { backgroundColor: tone.bg, paddingHorizontal: 8 } : null]}>
                      <Icon name={CHIP_ICON[status]} size={14} color={ds.c[tone.fg]} />
                      <DsText v="caption-strong" c={tone.fg}>
                        {tl(`status.${status}`)}
                      </DsText>
                    </View>
                    <DsText w="600" numberOfLines={1} style={styles.title}>
                      {lesson.title || t("groupWorkspace.lessonsTab.noTopic")}
                    </DsText>
                    <DsText v="body-sm" c="ink-secondary" numberOfLines={1}>
                      {[dateLabel(start), meta].filter(Boolean).join(" · ")}
                    </DsText>
                  </View>
                </View>

                {status === "live" ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => router.push(ROUTES.live(lesson.id) as never)}
                    style={({ pressed }) => [styles.button, { backgroundColor: pressed ? ds.c["brand-strong"] : ds.c.brand }]}
                  >
                    <Icon name="videocam-fill" size={18} color={ds.c["ink-inverse"]} />
                    <DsText v="button" c="ink-inverse">
                      {t("groupWorkspace.lessonsTab.join")}
                    </DsText>
                  </Pressable>
                ) : status === "finished" ? (
                  <View style={styles.pair}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => router.push(ROUTES.recording(lesson.id) as never)}
                      style={({ pressed }) => [styles.button, styles.half, { borderWidth: 1, borderColor: ds.c["line-strong"], backgroundColor: pressed ? ds.c.subtle : ds.c.surface }]}
                    >
                      <Icon name="play-circle-fill" size={18} color={ds.c.ink} />
                      <DsText v="button">{t("groupWorkspace.lessonsTab.video")}</DsText>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setRateTarget(lesson)}
                      style={({ pressed }) => [styles.button, styles.half, { backgroundColor: ds.c["brand-subtle"], opacity: pressed ? 0.7 : 1 }]}
                    >
                      <Icon name="star" size={18} color={ds.c.brand} />
                      <DsText v="button" c="brand" numberOfLines={1}>
                        {lesson.myRating ? t("groupWorkspace.lessonsTab.myRating", { value: lesson.myRating }) : t("groupWorkspace.lessonsTab.rate")}
                      </DsText>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => toast.info(t("groupWorkspace.soon"))}
                    style={({ pressed }) => [styles.button, { borderWidth: 1, borderColor: ds.c["line-strong"], backgroundColor: pressed ? ds.c.subtle : ds.c.surface }]}
                  >
                    <Icon name="edit" size={18} color={ds.c.ink} />
                    <DsText v="button">{t("groupWorkspace.lessonsTab.remind")}</DsText>
                  </Pressable>
                )}
              </View>
            );
          })}
        </View>
      ) : (
        <MobileEmptyCard icon="schedule" title={t("groupWorkspace.lessonsTab.emptyTitle")} description={t("groupWorkspace.lessonsTab.emptyHint")} />
      )}

      <RateLessonSheet lesson={rateTarget} onClose={() => setRateTarget(null)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  /* `gap-5 px-4 pt-5 pb-8` */
  page: { gap: 20, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 32 },
  list: { gap: 12 },
  /* `gap-4 rounded-xl p-4` */
  card: { gap: 16, padding: 16, borderRadius: dsRadius.xl },
  head: { flexDirection: "row", alignItems: "center", gap: 12 },
  /* `size-14 rounded-[14px]` */
  tile: { width: 56, height: 56, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  tileTime: { lineHeight: 20 },
  tileMinutes: { opacity: 0.9 },
  info: { flex: 1, minWidth: 0, alignItems: "flex-start", gap: 4 },
  chip: { height: 22, flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 11 },
  /* `text-[17px]/[22px] font-semibold` */
  title: { maxWidth: "100%", fontSize: 17, lineHeight: 22 },
  pair: { flexDirection: "row", gap: 8 },
  half: { flex: 1, minWidth: 0 },
  button: { height: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 16, borderRadius: 22 },
  skeletonLines: { gap: 10 },
  skeletonLine: { height: 14, borderRadius: 7 },
  skeletonButton: { flex: 1, height: 44, borderRadius: 22 },
});
