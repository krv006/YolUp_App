import { useLocalSearchParams } from "expo-router";
import { BoardSurface } from "@/modules/board";

/**
 * Doska marshruti — chatdagi `.../boards/<lesson_id>` havolasidan ochiladi.
 *
 * Doskaning o'zi `modules/board` ichida: uni jonli dars xonasi ham
 * ishlatadi, widget esa page qatlamini import qila olmaydi (FSD qoidasi).
 */
export function BoardPage() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  return <BoardSurface lessonId={lessonId ?? ""} />;
}
