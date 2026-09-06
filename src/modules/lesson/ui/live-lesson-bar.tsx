import { StyleSheet, View } from "react-native";
import { Video } from "lucide-react-native";
import type { Lesson } from "@/shared/types";
import { Button, radius, Text, useTheme } from "@/shared/ui";

export interface LiveLessonBarProps {
  /**
   * Ketayotgan dars. Veb varianti uni o'zi (`useLiveLesson`) so'raydi;
   * mobilda esa suhbat sahifasi allaqachon BARCHA jonli darslarni bitta
   * so'rovda oladi (ro'yxatdagi belgilar uchun), shuning uchun bu yerda
   * yana bir so'rov ochilmaydi — dars tayyor holda beriladi.
   */
  lesson: Lesson | null | undefined;
  onJoin: () => void;
}

/**
 * Chat tepasidagi "dars ketmoqda" chizig'i — veb `live-lesson-bar.tsx`
 * ning mobil varianti (Telegram video chat uslubi).
 *
 * Dars bo'lmasa umuman chizilmaydi: chat balandligi bekorga qisqarmaydi.
 */
export function LiveLessonBar({ lesson, onJoin }: LiveLessonBarProps) {
  const { palette } = useTheme();

  if (!lesson) return null;

  return (
    <View
      accessibilityRole="summary"
      style={[styles.bar, { backgroundColor: palette["destructive-soft"] }]}
    >
      <View style={[styles.dot, { backgroundColor: palette.destructive }]} />

      <View style={styles.body}>
        <Text variant="label" style={{ color: palette["destructive-strong"] }}>
          Dars ketmoqda
        </Text>
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {lesson.title || lesson.topic || lesson.courseTitle}
        </Text>
      </View>

      <Button
        title="Qo'shilish"
        variant="danger"
        fullWidth={false}
        icon={<Video size={15} color={palette["destructive-foreground"]} />}
        onPress={onJoin}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.sm,
    marginHorizontal: 8,
    marginTop: 6,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  body: { flex: 1, gap: 1 },
});
