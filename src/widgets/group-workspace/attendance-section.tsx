import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { CheckCircle2 } from "lucide-react-native";
import { useAttendance, useAttendanceSummary } from "@/modules/attendance";
import { useLessons } from "@/modules/lesson";
import { Avatar, radius, Text, useTheme } from "@/shared/ui";
import { PanelHeading } from "./panel-heading";

type Range = "all" | "month" | "current";

/**
 * Kurs davomati — veb `group-workspace.tsx` dagi `AttendancePanel`:
 * 3 ta statistika kartasi, davr filtrlari va o'quvchilar ro'yxati
 * (davomat chizig'i, fokus foizi). Backend xulosasi bo'lsa u ishlatiladi,
 * bo'lmasa yozuvlardan hisoblanadi — vebdagidek.
 */
export function AttendanceSection({ courseId }: { courseId: string }) {
  const { t } = useTranslation("group");
  const { palette } = useTheme();
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

  if (attendance.isLoading)
    return (
      <View style={[styles.page, { backgroundColor: palette.background }]}>
        {Array.from({ length: 3 }, (_, index) => (
          <View key={index} style={[styles.skeleton, { backgroundColor: palette.muted }]} />
        ))}
      </View>
    );

  const FILTERS: Array<{ id: Range; label: string }> = [
    { id: "all", label: t("attendance.filterAll") },
    { id: "month", label: t("attendance.filterMonth") },
    { id: "current", label: t("attendance.filterCurrent") },
  ];

  return (
    <ScrollView style={{ backgroundColor: palette.background }} contentContainerStyle={styles.page}>
      <PanelHeading
        eyebrow={t("attendance.eyebrow")}
        title={t("attendance.title")}
        subtitle={t("attendance.summary", { lessonCount, recordCount: filtered.length })}
      />

      {rows.length ? (
        <View style={styles.filters}>
          {FILTERS.map((item) => {
            const active = range === item.id;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                onPress={() => setRange(item.id)}
                style={[styles.filter, { backgroundColor: active ? palette.primary : palette["surface-subtle"] }]}
              >
                <Text variant="label" style={{ color: active ? palette["primary-foreground"] : palette["muted-foreground"] }}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {students.length ? (
        <>
          <View style={styles.tiles}>
            {[
              { value: `${avgAttendance}%`, label: t("attendance.statAttendance") },
              { value: `${avgFocus}%`, label: t("attendance.statFocus") },
              { value: String(lessonCount), label: t("attendance.statLessons") },
            ].map((tile) => (
              <View key={tile.label} style={[styles.tile, { borderColor: palette.border, backgroundColor: palette.surface }]}>
                <Text variant="heading">{tile.value}</Text>
                <Text variant="label" style={[styles.regular, { color: palette["muted-foreground"] }]}>
                  {tile.label}
                </Text>
              </View>
            ))}
          </View>

          <View style={[styles.card, { borderColor: palette.border, backgroundColor: palette.surface }]}>
            <View style={styles.cardHead}>
              <Text variant="body" style={[styles.grow, styles.strong]}>
                {t("attendance.studentsTitle")}
              </Text>
              <Text variant="caption" style={{ color: palette["subtle-foreground"] }}>
                {t("attendance.studentsMeta")}
              </Text>
            </View>
            {students.map((student, index) => {
              const good = student.attendance >= 70;
              return (
                <View key={student.id} style={[styles.row, index > 0 && { borderTopWidth: 1, borderTopColor: palette.border }]}>
                  <Avatar variant="legacy" name={student.name} tone={student.tone} size="sm" />
                  <View style={[styles.grow, styles.rowBody]}>
                    <Text variant="label" numberOfLines={1}>
                      {student.name}
                    </Text>
                    <View style={styles.barRow}>
                      <View style={[styles.track, { backgroundColor: palette["surface-subtle"] }]}>
                        <View
                          style={[
                            styles.bar,
                            { width: `${student.attendance}%`, backgroundColor: good ? palette.success : palette.destructive },
                          ]}
                        />
                      </View>
                      <Text variant="caption" style={{ color: good ? palette["muted-foreground"] : palette["destructive-strong"] }}>
                        {student.attendance}%
                      </Text>
                    </View>
                  </View>
                  <View style={styles.focus}>
                    <Text variant="body" style={styles.strong}>
                      {student.focus === null ? "—" : `${student.focus}%`}
                    </Text>
                    <Text variant="caption" style={{ color: palette["subtle-foreground"] }}>
                      {t("attendance.focusSuffix")}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </>
      ) : (
        <View style={[styles.empty, { borderColor: palette.border }]}>
          <View style={[styles.emptyIcon, { backgroundColor: palette.primary }]}>
            <CheckCircle2 size={30} color={palette["primary-foreground"]} />
          </View>
          <Text variant="subheading" style={styles.center}>
            {t("attendance.emptyTitle")}
          </Text>
          <Text variant="label" style={[styles.regular, styles.center, { color: palette["muted-foreground"] }]}>
            {t("attendance.emptyDescription")}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { gap: 20, padding: 16 },
  grow: { flex: 1, minWidth: 0 },
  regular: { fontWeight: "400" },
  strong: { fontWeight: "600" },
  center: { textAlign: "center" },
  skeleton: { height: 96, borderRadius: radius["2xl"] },
  filters: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  filter: { height: 44, justifyContent: "center", paddingHorizontal: 16, borderRadius: radius.full },
  /* `grid-cols-3 gap-3` */
  tiles: { flexDirection: "row", gap: 12 },
  tile: { flex: 1, gap: 4, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderRadius: radius["2xl"] },
  card: { gap: 12, padding: 16, borderWidth: 1, borderRadius: radius["2xl"] },
  cardHead: { flexDirection: "row", alignItems: "baseline", gap: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  rowBody: { gap: 6 },
  barRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  track: { flex: 1, maxWidth: 160, height: 6, overflow: "hidden", borderRadius: radius.full },
  bar: { height: "100%", borderRadius: radius.full },
  focus: { alignItems: "flex-end" },
  empty: { alignItems: "center", gap: 12, paddingHorizontal: 24, paddingVertical: 48, borderWidth: 1, borderStyle: "dashed", borderRadius: radius["2xl"] },
  emptyIcon: { width: 64, height: 64, borderRadius: radius["2xl"], alignItems: "center", justifyContent: "center" },
});
