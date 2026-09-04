import { ScrollView, StyleSheet, View } from "react-native";
import { useCourseStudents } from "@/modules/course";
import { Avatar, ScreenEmpty, ScreenLoading, Separator, Text } from "@/shared/ui";

/**
 * Guruh o'quvchilari — veb `group-workspace.tsx` ning "O'quvchilar" bo'limi.
 * Faqat o'qituvchiga ko'rinadi.
 *
 * O'quvchi QO'SHISH mobilda yo'q: u qidiruv, ro'yxatdan tanlash va tasdiq
 * oqimini talab qiladi (veb'dagi `AddStudentDialog`, 267 qator) va odatda
 * kurs boshida bir marta, kompyuterda bajariladi.
 */
export function StudentsSection({ courseId }: { courseId: string }) {
  const students = useCourseStudents(courseId, { page_size: 100 });

  if (students.isLoading) return <ScreenLoading label="O'quvchilar yuklanmoqda…" />;

  // `getStudents` sahifalangan javob qaytaradi (`Page<Enrollment>`),
  // ro'yxatning o'zi `items` ichida.
  const items = students.data?.items ?? [];
  if (items.length === 0) {
    return <ScreenEmpty title="O'quvchi yo'q" description="Bu guruhga hali hech kim yozilmagan." />;
  }

  return (
    <ScrollView contentContainerStyle={styles.list}>
      {items.map((enrollment, index) => (
        <View key={enrollment.id}>
          {index > 0 ? <Separator inset={60} /> : null}
          <View style={styles.row}>
            <Avatar name={enrollment.student.name} tone={enrollment.student.avatarTone} size="md" />
            <View style={styles.body}>
              <Text variant="label" numberOfLines={1}>
                {enrollment.student.name}
              </Text>
              <Text variant="caption" tone="muted" numberOfLines={1}>
                {enrollment.student.username}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: { paddingVertical: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 10 },
  body: { flex: 1, gap: 2 },
});
