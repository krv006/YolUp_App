import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Video } from "lucide-react-native";
import type { Lesson } from "@/shared/types";
import { radius, Text, useTheme } from "@/shared/ui";

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
  const { t } = useTranslation("lesson");
  const { palette } = useTheme();

  if (!lesson) return null;

  /* `.live-lesson-bar`: yashil chiziq, pastida chegara, ko'k "Qo'shilish". */
  return (
    <View
      accessibilityRole="summary"
      style={[styles.bar, { backgroundColor: palette["success-soft"], borderBottomColor: palette.border }]}
    >
      <View style={[styles.dot, { backgroundColor: palette["success-strong"] }]} />
      <View style={styles.body}>
        <Text variant="label" style={{ color: palette["success-strong"] }}>
          {t("liveBar.inProgress")}
        </Text>
        <Text variant="caption" numberOfLines={1} style={{ color: palette["muted-foreground"] }}>
          {lesson.title}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onJoin}
        style={({ pressed }) => [styles.join, { backgroundColor: pressed ? palette["primary-hover"] : palette.primary }]}
      >
        <Video size={15} color={palette["primary-foreground"]} />
        <Text variant="caption" style={[styles.joinText, { color: palette["primary-foreground"] }]}>
          {t("liveBar.join")}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 9, borderBottomWidth: 1 },
  dot: { width: 8, height: 8, borderRadius: radius.full },
  body: { flex: 1, minWidth: 0, gap: 1 },
  join: { minHeight: 32, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 13, borderRadius: radius.full },
  joinText: { fontSize: 13, lineHeight: 18, fontWeight: "800" },
});
