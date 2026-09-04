import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Plus, UserMinus } from "lucide-react-native";
import { useCourseStudents, useUnenrollStudent } from "@/modules/course";
import {
  Avatar,
  Button,
  IconButton,
  ScreenEmpty,
  ScreenLoading,
  Separator,
  Text,
  useTheme,
} from "@/shared/ui";
import { AddStudentSheet } from "./add-student-sheet";

/**
 * Guruh o'quvchilari — veb `group-workspace.tsx` ning "O'quvchilar" bo'limi.
 * Faqat o'qituvchiga ko'rinadi.
 *
 * Qo'shish, ro'yxat va kursdan chiqarish — veb bilan teng.
 */
export function StudentsSection({ courseId }: { courseId: string }) {
  const { palette } = useTheme();
  const [addOpen, setAddOpen] = useState(false);
  const unenroll = useUnenrollStudent();
  const students = useCourseStudents(courseId, { page_size: 100 });

  if (students.isLoading) return <ScreenLoading label="O'quvchilar yuklanmoqda…" />;

  // `getStudents` sahifalangan javob qaytaradi (`Page<Enrollment>`),
  // ro'yxatning o'zi `items` ichida.
  const items = students.data?.items ?? [];

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.list}>
        <View style={styles.addRow}>
          <Button
            title="O'quvchi qo'shish"
            variant="secondary"
            icon={<Plus size={16} color={palette["secondary-foreground"]} />}
            onPress={() => setAddOpen(true)}
          />
        </View>

        {items.length === 0 ? (
          <ScreenEmpty title="O'quvchi yo'q" description="Bu guruhga hali hech kim yozilmagan." />
        ) : null}

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
              <IconButton
                accessibilityLabel="Kursdan chiqarish"
                disabled={unenroll.isPending}
                onPress={() => unenroll.mutate({ courseId, studentId: enrollment.student.id })}
              >
                <UserMinus size={18} color={palette["muted-foreground"]} />
              </IconButton>
            </View>
          </View>
        ))}
      </ScrollView>

      <AddStudentSheet open={addOpen} onClose={() => setAddOpen(false)} courseId={courseId} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { paddingVertical: 8 },
  addRow: { paddingHorizontal: 16, paddingBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 10 },
  body: { flex: 1, gap: 2 },
});
