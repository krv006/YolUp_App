import { Pressable, StyleSheet, View } from "react-native";
import { Clock, Pencil, PlayCircle, Square, Star, Trash2, Video } from "lucide-react-native";
import type { Lesson } from "@/shared/types";
import { Badge, radius, Text, useTheme, type BadgeTone } from "@/shared/ui";
import { isLessonClosed, lessonStatusMeta } from "../lib/lesson-status";

export interface LessonCardProps {
  lesson: Lesson;
  onJoin?: (lesson: Lesson) => void;
  onRecording?: (lesson: Lesson) => void;
  onRate?: (lesson: Lesson) => void;
  /** O'qituvchi: jonli darsni yakunlash. */
  onFinish?: (lesson: Lesson) => void;
  /** O'qituvchi: qo'yilgan baholarni ko'rish. */
  onRatings?: (lesson: Lesson) => void;
  /** O'qituvchi: darsni tahrirlash. */
  onEdit?: (lesson: Lesson) => void;
  /** O'qituvchi: darsni o'chirish. */
  onDelete?: (lesson: Lesson) => void;
}

/** Veb `lessonStatusMeta` ohangini mobil `Badge` ohangiga bog'laydi. */
const TONE: Record<ReturnType<typeof lessonStatusMeta>["tone"], BadgeTone> = {
  scheduled: "brand",
  live: "danger",
  finished: "neutral",
  cancelled: "warning",
};

/**
 * Bitta darsning kartochkasi — jadval ro'yxatida va kun ostidagi ro'yxatda.
 *
 * Amallar dars HOLATIGA qarab chiqadi: jonli darsga kirish, tugaganini
 * ko'rish yoki baholash. Veb'da bularning hammasi bir qatorda edi; mobilda
 * bir vaqtda bittadan ko'pi kerak bo'lmaydi.
 */
export function LessonCard({
  lesson,
  onJoin,
  onRecording,
  onRate,
  onFinish,
  onRatings,
  onEdit,
  onDelete,
}: LessonCardProps) {
  const { palette } = useTheme();
  const meta = lessonStatusMeta(lesson.status);
  const closed = isLessonClosed(lesson);

  return (
    <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
      <View style={styles.head}>
        <View style={styles.headBody}>
          <Text variant="label" numberOfLines={2}>
            {lesson.title || lesson.topic || "Dars"}
          </Text>
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {lesson.courseTitle}
          </Text>
        </View>
        <Badge label={meta.label} tone={TONE[meta.tone]} />
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Clock size={14} color={palette["muted-foreground"]} />
          <Text variant="caption" tone="muted">
            {lesson.time} · {lesson.durationMinutes} daqiqa
          </Text>
        </View>
        {lesson.avgRating !== null ? (
          <View style={styles.metaItem}>
            <Star size={14} color={palette.warning} fill={palette.warning} />
            <Text variant="caption" tone="muted">
              {lesson.avgRating.toFixed(1)} ({lesson.ratingCount})
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.actions}>
        {lesson.status === "live" && onJoin ? (
          <Action
            label="Darsga kirish"
            tone="danger"
            icon={<Video size={16} color={palette["destructive-foreground"]} />}
            onPress={() => onJoin(lesson)}
          />
        ) : null}

        {lesson.status === "scheduled" && onJoin ? (
          <Action
            label="Kirish"
            tone="primary"
            icon={<Video size={16} color={palette["primary-foreground"]} />}
            onPress={() => onJoin(lesson)}
          />
        ) : null}

        {closed && onRecording ? (
          <Action
            label="Yozuvni ko'rish"
            tone="secondary"
            icon={<PlayCircle size={16} color={palette["secondary-foreground"]} />}
            onPress={() => onRecording(lesson)}
          />
        ) : null}

        {lesson.status === "finished" && onRate ? (
          <Action
            label="Baholash"
            tone="secondary"
            icon={<Star size={16} color={palette["secondary-foreground"]} />}
            onPress={() => onRate(lesson)}
          />
        ) : null}

        {lesson.status === "live" && onFinish ? (
          <Action
            label="Yakunlash"
            tone="secondary"
            icon={<Square size={16} color={palette["secondary-foreground"]} />}
            onPress={() => onFinish(lesson)}
          />
        ) : null}

        {/*
         * Tahrirlash va o'chirish faqat BOSHLANMAGAN darsda: ketayotgan yoki
         * tugagan darsning vaqtini o'zgartirish ma'nosiz, o'chirish esa
         * davomat va yozuvni ham olib ketadi. Veb ham shu qoidani tutadi.
         */}
        {lesson.status === "scheduled" && onEdit ? (
          <Action
            label="Tahrirlash"
            tone="secondary"
            icon={<Pencil size={16} color={palette["secondary-foreground"]} />}
            onPress={() => onEdit(lesson)}
          />
        ) : null}

        {lesson.status === "scheduled" && onDelete ? (
          <Action
            label="O'chirish"
            tone="secondary"
            icon={<Trash2 size={16} color={palette.destructive} />}
            onPress={() => onDelete(lesson)}
          />
        ) : null}

        {/* Baholarni ko'rish faqat baho qo'yilgan tugagan darsda ma'noli. */}
        {lesson.status === "finished" && onRatings && lesson.ratingCount > 0 ? (
          <Action
            label="Baholar"
            tone="secondary"
            icon={<Star size={16} color={palette["secondary-foreground"]} />}
            onPress={() => onRatings(lesson)}
          />
        ) : null}
      </View>
    </View>
  );
}

function Action({
  label,
  tone,
  icon,
  onPress,
}: {
  label: string;
  tone: "primary" | "secondary" | "danger";
  icon: React.ReactNode;
  onPress: () => void;
}) {
  const { palette } = useTheme();
  const colors = {
    primary: { background: palette.primary, text: palette["primary-foreground"] },
    secondary: { background: palette.secondary, text: palette["secondary-foreground"] },
    danger: { background: palette.destructive, text: palette["destructive-foreground"] },
  }[tone];

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        { backgroundColor: colors.background, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      {icon}
      <Text variant="label" style={{ color: colors.text }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: 14,
    gap: 10,
  },
  head: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  headBody: { flex: 1, gap: 3 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: radius.sm,
  },
});
