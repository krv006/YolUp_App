import { useMemo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { AttendanceList, useAttendance } from "@/modules/attendance";
import { useLessons } from "@/modules/lesson";
import { ScreenLoading, Text } from "@/shared/ui";

/**
 * Kurs davomat hisoboti — veb `group-workspace.tsx` ning "Davomat" bo'limi.
 * Faqat o'qituvchiga ko'rinadi.
 *
 * Backend davomatni KURS bo'yicha filtrlay olmaydi, shuning uchun barcha
 * yozuvlar olinadi va shu kursning darslari bo'yicha ajratiladi — veb'dagi
 * bilan aynan bir xil yondashuv.
 */
export function AttendanceSection({ courseId }: { courseId: string }) {
  const lessons = useLessons({ course: courseId, page_size: 100 }, Boolean(courseId));
  const attendance = useAttendance({ page_size: 200 });

  const filtered = useMemo(() => {
    const lessonIds = new Set((lessons.data ?? []).map((lesson) => lesson.id));
    return (attendance.data ?? []).filter((row) => lessonIds.has(row.lessonId));
  }, [lessons.data, attendance.data]);

  const lessonCount = useMemo(
    () => new Set(filtered.map((row) => row.lessonId)).size,
    [filtered]
  );

  if (lessons.isLoading || attendance.isLoading) {
    return <ScreenLoading label="Davomat yuklanmoqda…" />;
  }

  return (
    <ScrollView contentContainerStyle={styles.list}>
      <View style={styles.head}>
        <Text variant="label">Davomat va fokus</Text>
        <Text variant="caption" tone="muted">
          {lessonCount} ta dars · {filtered.length} ta yozuv
        </Text>
      </View>

      <AttendanceList rows={filtered} emptyLabel="Davomat hali yo'q" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16 },
  head: { gap: 2, paddingBottom: 12 },
});
