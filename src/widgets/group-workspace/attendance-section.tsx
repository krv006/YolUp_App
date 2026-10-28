import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useAttendance, useAttendanceSummary } from "@/modules/attendance";
import { useLessons } from "@/modules/lesson";
import { Avatar, DsText, dsRadius, Icon, MobileEmptyCard, useDs } from "@/shared/ui";
import { PanelHeading } from "./panel-heading";

type Range = "all" | "month" | "current";

/**
 * Kurs davomati — veb `group-workspace.tsx` dagi `AttendancePanel` ning tor
 * ekran varianti: davr filtrlari, ko'k xulosa kartasi (davomat, fokus,
 * darslar) va o'quvchilar ro'yxati (davomat chizig'i, fokus foizi). Backend
 * xulosasi bo'lsa u ishlatiladi, bo'lmasa yozuvlardan hisoblanadi.
 */
export function AttendanceSection({ courseId }: { courseId: string }) {
  const { t } = useTranslation("group");
  const ds = useDs();
  const [range, setRange] = useState<Range>("all");
  const lessons = useLessons({ course: courseId, page_size: 100 }, Boolean(courseId));
  const attendance = useAttendance({ page_size: 100 });
  const summary = useAttendanceSummary(courseId, range === "month" ? "30d" : range === "current" ? "month" : "all");
  const lessonList = useMemo(() => lessons.data ?? [], [lessons.data]);
  const rows = useMemo(() => attendance.data ?? [], [attendance.data]);
  const [now] = useState(() => Date.now());

  const filtered = useMemo(() => {
    const dates = new Map(lessonList.map((lesson) => [lesson.id, new Date(lesson.startsAt)]));
    const today = new Date(now);
    const monthAgo = new Date(now - 30 * 86_400_000);
    return rows.filter((row) => {
      if (!dates.has(row.lessonId)) return false;
      const date = dates.get(row.lessonId);
      if (!date) return range === "all";
      if (range === "month") return date >= monthAgo;
      if (range === "current") return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
      return true;
    });
  }, [rows, lessonList, range, now]);

  const computedLessonCount = new Set(filtered.map((row) => row.lessonId)).size;
  const lessonCount = summary.data?.lessonCount ?? computedLessonCount;

  const students = useMemo(() => {
    if (summary.data?.students.length)
      return summary.data.students
        .map((item) => ({ id: item.id, name: item.name, tone: undefined as string | undefined, attendance: item.attendancePercent, focus: item.focusPercent }))
        .sort((a, b) => b.attendance - a.attendance);
    const map = new Map<string, { name: string; tone?: string; lessons: Set<string>; answered: number; total: number }>();
    for (const row of filtered) {
      const current = map.get(row.studentId) ?? {
        name: row.student?.name || row.child,
        tone: row.student?.avatarTone,
        lessons: new Set<string>(),
        answered: 0,
        total: 0,
      };
      current.lessons.add(row.lessonId);
      current.answered += row.attentionAnswered;
      current.total += row.attentionTotal;
      map.set(row.studentId, current);
    }
    return [...map.entries()]
      .map(([id, value]) => ({
        id,
        name: value.name,
        tone: value.tone,
        attendance: computedLessonCount ? Math.round((value.lessons.size / computedLessonCount) * 100) : 0,
        focus: value.total ? Math.round((value.answered / value.total) * 100) : null,
      }))
      .sort((a, b) => b.attendance - a.attendance);
  }, [summary.data, filtered, computedLessonCount]);

  const avgAttendance =
    summary.data?.attendancePercent ??
    (students.length ? Math.round(students.reduce((sum, item) => sum + item.attendance, 0) / students.length) : 0);
  const focusValues = students.map((item) => item.focus).filter((value): value is number => value !== null);
  const avgFocus =
    summary.data?.focusPercent ?? (focusValues.length ? Math.round(focusValues.reduce((sum, value) => sum + value, 0) / focusValues.length) : 0);

  const FILTERS: Array<{ id: Range; label: string }> = [
    { id: "all", label: t("attendance.filterAllShort") },
    { id: "month", label: t("attendance.filterMonthShort") },
    { id: "current", label: t("attendance.filterCurrent") },
  ];

  return (
    <ScrollView style={styles.fill} contentContainerStyle={styles.page}>
      <PanelHeading eyebrow={t("attendance.eyebrow")} title={t("attendance.title")} style={styles.heading} />

      {attendance.isLoading ? (
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
      ) : students.length ? (
        <>
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

          {/* `rounded-xl bg-brand p-4 gap-3 text-on-action` */}
          <View style={[styles.summary, { backgroundColor: ds.c.brand }]}>
            <View style={[styles.badge, { backgroundColor: ds.c["on-brand-subtle"] }]}>
              <Icon name="bar-chart" size={14} color={ds.c["on-action"]} />
              <DsText v="caption-strong" c="on-action">
                {t("attendance.mobileBadge", { lessonCount, recordCount: filtered.length })}
              </DsText>
            </View>
            <View style={styles.tiles}>
              {[
                { value: `${avgAttendance}%`, label: t("attendance.statAttendance") },
                { value: `${avgFocus}%`, label: t("attendance.statFocus") },
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
                <Avatar variant="legacy" name={student.name} tone={student.tone} size="sm" box={44} />
                <View style={styles.rowBody}>
                  <DsText v="title" numberOfLines={1}>
                    {student.name}
                  </DsText>
                  <View style={styles.barRow}>
                    <View style={[styles.track, { backgroundColor: ds.c.subtle }]}>
                      <View style={[styles.bar, { width: `${student.attendance}%`, backgroundColor: student.attendance >= 50 ? ds.c.brand : ds.c.danger }]} />
                    </View>
                    <DsText v="caption" c="brand" numeric style={styles.percent}>
                      {student.attendance}%
                    </DsText>
                  </View>
                </View>
                <View style={styles.focus}>
                  <DsText v="title" numeric>
                    {student.focus === null ? "—" : `${student.focus}%`}
                  </DsText>
                  <DsText v="caption" c="ink-secondary">
                    {t("attendance.focusSuffix")}
                  </DsText>
                </View>
              </View>
            ))}
          </View>
        </>
      ) : (
        <MobileEmptyCard icon="check-circle" title={t("attendance.emptyTitle")} description={t("attendance.emptyDescription")} />
      )}
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
  percent: { width: 32, textAlign: "right" },
  focus: { width: 48, alignItems: "flex-end" },
  skeletonRow: { height: 74, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16 },
  skeletonAvatar: { width: 44, height: 44, borderRadius: 22 },
  skeletonLines: { gap: 8 },
  skeletonLine: { height: 12, borderRadius: 6 },
});
