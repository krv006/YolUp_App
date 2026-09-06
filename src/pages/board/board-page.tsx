import { useLocalSearchParams } from "expo-router";
import { BoardSurface } from "@/modules/board";
import { useLesson } from "@/modules/lesson";

/**
 * Doska marshruti — chatdagi `.../boards/<lesson_id>` havolasidan ochiladi.
 *
 * Doskaning o'zi `modules/board` ichida: uni jonli dars xonasi ham
 * ishlatadi, widget esa page qatlamini import qila olmaydi (FSD qoidasi).
 */
export function BoardPage() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  // Kurs "chizishga ruxsat" ro'yxati uchun kerak. Veb ham shu maqsadda
  // `useLesson` chaqirib `courseId` ni `BoardPanel` ga uzatadi.
  const lesson = useLesson(lessonId ?? null);
  return <BoardSurface lessonId={lessonId ?? ""} courseId={lesson.data?.courseId ?? null} />;
}
