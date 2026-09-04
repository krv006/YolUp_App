import { ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useLessons } from "@/modules/lesson";
import { LessonCard } from "@/modules/lesson/ui/lesson-card";
import { ROUTES } from "@/shared/config";
import type { Lesson } from "@/shared/types";
import { ScreenEmpty, ScreenLoading } from "@/shared/ui";

/**
 * Guruhning darslari — veb `group-workspace.tsx` ning "Darslar" bo'limi.
 *
 * Dars YARATISH bu yerda yo'q: u forma, sana tanlash va haftalik jadval
 * generatori talab qiladi — o'qituvchi buni odatda kompyuterda qiladi.
 * Mobilda asosiy ehtiyoj darsga KIRISH va yozuvni ko'rish.
 */
export function LessonsSection({ courseId }: { courseId: string }) {
  const router = useRouter();
  const lessons = useLessons({ course: courseId, page_size: 100 }, Boolean(courseId));

  if (lessons.isLoading) return <ScreenLoading label="Darslar yuklanmoqda…" />;

  const items = lessons.data ?? [];
  if (items.length === 0) {
    return <ScreenEmpty title="Dars yo'q" description="Bu guruhda hali dars rejalashtirilmagan." />;
  }

  return (
    <ScrollView contentContainerStyle={styles.list}>
      {items.map((lesson: Lesson) => (
        <LessonCard
          key={lesson.id}
          lesson={lesson}
          onJoin={(item) => router.push(ROUTES.live(item.id))}
          onRecording={(item) => router.push(ROUTES.recording(item.id))}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 12 },
});
