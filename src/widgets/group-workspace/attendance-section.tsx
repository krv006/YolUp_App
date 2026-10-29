import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useAttendanceSummary } from "@/modules/attendance";
import { useLessons } from "@/modules/lesson";
import { formatMessageTime } from "@/shared/lib";
import type { Lesson } from "@/shared/types";
import { Avatar, DsText, dsRadius, Icon, MobileEmptyCard, useDs } from "@/shared/ui";
import { LessonAttendanceDialog } from "@/widgets/lesson-attendance";
import { PanelHeading } from "./panel-heading";

type Range = "all" | "month" | "current";

function dayMonth(value: string): string {
  const date = new Date(value);
  return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Kurs davomati — veb `group-workspace.tsx` dagi `AttendancePanel` ning tor
 * ekran varianti (veb #164): davr filtrlari, ko'k xulosa kartasi (davomat,
 * fokus, darslar), o'quvchilar ro'yxati (N/M dars, davomat chizig'i, fokus) —
 * hammasi backend xulosasidan; pastda tugagan darslar, bosilsa dars davomati
 * oynasi (`LessonAttendanceDialog`).
 */
export function AttendanceSection({ courseId }: { courseId: string }) {
  const { t } = useTranslation("group");
  const ds = useDs();
  const [range, setRange] = useState<Range>("all");
  const [openLesson, setOpenLesson] = useState<Lesson | null>(null);
  const lessons = useLessons({ course: courseId, page_size: 100 }, Boolean(courseId));
  const summary = useAttendanceSummary(courseId, range === "month" ? "30d" : range === "current" ? "month" : "all");
  const [now] = useState(() => new Date());

  const finishedLessons = useMemo(() => {
    const monthAgo = now.getTime() - 30 * 86_400_000;
    return (lessons.data ?? [])
      .filter((lesson) => {
        if (lesson.status !== "finished") return false;
        const date = new Date(lesson.startsAt);
        if (range === "month") return date.getTime() >= monthAgo;
        if (range === "current") return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        return true;
      })
      .sort((a, b) => b.startsAt.localeCompare(a.startsAt));
  }, [lessons.data, range, now]);

  const students = useMemo(
    () => [...(summary.data?.students ?? [])].sort((a, b) => b.attendancePercent - a.attendancePercent || a.name.localeCompare(b.name)),
    [summary.data]
  );
  const lessonCount = summary.data?.lessonCount ?? 0;
  const attendedTotal = students.reduce((sum, item) => sum + item.attendedCount, 0);
  const avgFocus = summary.data?.focusPercent ?? null;

  const FILTERS: Array<{ id: Range; label: string }> = [
    { id: "all", label: t("attendance.filterAllShort") },
    { id: "month", label: t("attendance.filterMonthShort") },
    { id: "current", label: t("attendance.filterCurrent") },
  ];

  return (
    <ScrollView style={styles.fill} contentContainerStyle={styles.page}>
      <PanelHeading eyebrow={t("attendance.eyebrow")} title={t("attendance.title")} style={styles.heading} />

      <View style={styles.filters}>
        {FILTERS.map((item) => {
          const active = range === item.id;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setRange(item.id)}
              style={[styles.filter, { backgroundColor: active ? ds.c.brand : ds.c.surface }]}
            >
              <DsText v="body-sm" w="500" c={active ? "on-action" : "ink"} numberOfLines={1}>
                {item.label}
              </DsText>
            </Pressable>
          );
        })}
      </View>

      {summary.isLoading ? (
        <View style={[styles.list, { backgroundColor: ds.c.surface }]}>
          {Array.from({ length: 4 }, (_, index) => (
            <View key={index} style={[styles.skeletonRow, index < 3 && { borderBottomWidth: 1, borderBottomColor: ds.c.line }]}>
              <View style={[styles.skeletonAvatar, { backgroundColor: ds.c.skeleton }]} />
              <View style={styles.skeletonLines}>
                <View style={[styles.skeletonLine, { width: 140, backgroundColor: ds.c.skeleton }]} />
                <View style={[styles.skeletonLine, { width: 90, backgroundColor: ds.c.skeleton }]} />
              </View>
            </View>
          ))}
        </View>
      ) : lessonCount && students.length ? (
        <>
          {/* `rounded-xl bg-brand p-4 gap-3 text-on-action` */}
          <View style={[styles.summary, { backgroundColor: ds.c.brand }]}>
            <View style={[styles.badge, { backgroundColor: ds.c["on-brand-subtle"] }]}>
              <Icon name="bar-chart" size={14} color={ds.c["on-action"]} />
              <DsText v="caption-strong" c="on-action">
                {t("attendance.mobileBadge", { lessonCount, recordCount: attendedTotal })}
              </DsText>
            </View>
            <View style={styles.tiles}>
              {[
                { value: `${summary.data?.attendancePercent ?? 0}%`, label: t("attendance.statAttendance") },
                { value: avgFocus === null ? "—" : `${avgFocus}%`, label: t("attendance.statFocus") },
                { value: String(lessonCount), label: t("attendance.statLessons") },
              ].map((tile) => (
                <View key={tile.label} style={[styles.tile, { backgroundColor: ds.c["on-brand-subtle"] }]}>
                  <DsText v="title-lg" c="on-action" style={styles.tileValue}>
                    {tile.value}
                  </DsText>
                  <DsText v="caption" c="on-action" numberOfLines={1}>
                    {tile.label}
                  </DsText>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.listHead}>
            <DsText w="600" style={styles.grow}>
              {t("attendance.studentsTitle")}
            </DsText>
            <DsText v="body-sm" c="brand-strong">
              {t("attendance.studentsMetaShort")}
            </DsText>
          </View>

          <View style={[styles.list, styles.listTight, { backgroundColor: ds.c.surface }]}>
            {students.map((student, index) => (
              <View key={student.id} style={[styles.row, index < students.length - 1 && { borderBottomWidth: 1, borderBottomColor: ds.c.line }]}>
                <Avatar variant="legacy" name={student.name} size="sm" box={44} />
                <View style={styles.rowBody}>
                  <DsText v="title" numberOfLines={1}>
                    {student.name}
                  </DsText>
                  <View style={styles.barRow}>
                    <View style={[styles.track, { backgroundColor: ds.c.subtle }]}>
                      <View style={[styles.bar, { width: `${student.attendancePercent}%`, backgroundColor: student.attendancePercent >= 50 ? ds.c.brand : ds.c.danger }]} />
                    </View>
                    <DsText v="caption" c="brand" numeric style={styles.percent}>
                      {t("attendance.studentLessons", { attended: student.attendedCount, total: lessonCount })} · {student.attendancePercent}%
                    </DsText>
                  </View>
                </View>
                <View style={styles.focus}>
                  <DsText v="title" numeric>
                    {student.focusPercent === null ? "—" : `${student.focusPercent}%`}
                  </DsText>
                  <DsText v="caption" c="ink-secondary">
                    {t("attendance.focusSuffix")}
                  </DsText>
                </View>
              </View>
            ))}
          </View>

          {finishedLessons.length ? (
            <>
              <View style={styles.listHead}>
                <DsText w="600" style={styles.grow}>
                  {t("attendance.lessonsTitle")}
                </DsText>
                <DsText v="body-sm" c="brand-strong">
                  {t("attendance.lessonsMeta")}
                </DsText>
              </View>
              <View style={[styles.list, styles.listTight, { backgroundColor: ds.c.surface }]}>
                {finishedLessons.map((lesson, index) => (
                  // `flex items-center gap-3 px-4 py-3`
                  <Pressable
                    key={lesson.id}
                    accessibilityRole="button"
                    onPress={() => setOpenLesson(lesson)}
                    style={({ pressed }) => [
                      styles.lessonRow,
                      index < finishedLessons.length - 1 && { borderBottomWidth: 1, borderBottomColor: ds.c.line },
                      pressed && { backgroundColor: ds.c.subtle },
                    ]}
                  >
                    <View style={styles.lessonTime}>
                      <DsText v="title-sm" numeric>
                        {formatMessageTime(lesson.startsAt)}
                      </DsText>
                      <DsText v="caption" c="ink-secondary">
                        {dayMonth(lesson.startsAt)}
                      </DsText>
                    </View>
                    <View style={styles.grow}>
                      <DsText v="title-sm" numberOfLines={1}>
                        {lesson.title || t("attendance.untitledLesson")}
                      </DsText>
                      <DsText v="body-xs" c="ink-secondary" numberOfLines={1}>
                        {lesson.participantsCount !== null && lesson.studentCount !== null
                          ? t("attendance.lessonJoined", { joined: lesson.participantsCount, total: lesson.studentCount })
                          : t("attendance.lessonOpen")}
                      </DsText>
                    </View>
                    {lesson.attendanceRate !== null ? (
                      <DsText v="title-sm" numeric c={lesson.attendanceRate >= 50 ? "success" : "danger"}>
                        {Math.round(lesson.attendanceRate)}%
                      </DsText>
                    ) : null}
                    <Icon name="chevron-right" size={20} color={ds.c["icon-secondary"]} />
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}
        </>
      ) : (
        <MobileEmptyCard icon="check-circle" title={t("attendance.emptyTitle")} description={t("attendance.emptyDescription")} />
      )}

      <LessonAttendanceDialog lesson={openLesson} open={openLesson !== null} onOpenChange={(open) => !open && setOpenLesson(null)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  /* `gap-5 px-4 pt-5 pb-8` */
  page: { gap: 20, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 32 },
  heading: { flex: 0, marginBottom: 4 },
  filters: { flexDirection: "row", gap: 8 },
  filter: { flex: 1, minWidth: 0, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 22 },
  summary: { gap: 12, padding: 16, borderRadius: dsRadius.xl },
  badge: { alignSelf: "flex-start", height: 24, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, borderRadius: 12 },
  tiles: { flexDirection: "row", gap: 8 },
  tile: { flex: 1, minWidth: 0, height: 64, justifyContent: "center", paddingHorizontal: 12, borderRadius: dsRadius.xl },
  tileValue: { lineHeight: 24 },
  listHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  list: { overflow: "hidden", borderRadius: dsRadius.xl },
  listTight: { marginTop: -4 },
  /* `gap-3 border-b px-4 py-3.5` */
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  rowBody: { flex: 1, minWidth: 0, gap: 6 },
  barRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  track: { flex: 1, minWidth: 0, height: 6, overflow: "hidden", borderRadius: 3 },
  bar: { height: "100%", borderRadius: 3 },
  percent: { flexShrink: 0, textAlign: "right" },
  lessonRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  lessonTime: { width: 48, flexShrink: 0 },
  focus: { width: 48, alignItems: "flex-end" },
  skeletonRow: { height: 74, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16 },
  skeletonAvatar: { width: 44, height: 44, borderRadius: 22 },
  skeletonLines: { gap: 8 },
  skeletonLine: { height: 12, borderRadius: 6 },
});
