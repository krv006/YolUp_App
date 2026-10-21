import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { Play, Star } from "lucide-react-native";
import type { Lesson } from "@/shared/types";
import { Icon, radius, Text, useTheme } from "@/shared/ui";
import { hasLessonTopic, isLessonEditable, isLessonJoinable } from "../lib/lesson-status";

export interface LessonActionsProps {
  lesson: Lesson;
  onJoin: (lesson: Lesson) => void;
  onFinish?: (lesson: Lesson) => void;
  onEdit?: (lesson: Lesson) => void;
  onDelete?: (lesson: Lesson) => void;
  onRatings?: (lesson: Lesson) => void;
  onRecording?: (lesson: Lesson) => void;
  onRate?: (lesson: Lesson) => void;
  compact?: boolean;
}

/**
 * Dars kartasi tugmalari — veb `modules/lesson/ui/lesson-actions.tsx`:
 * tugagan darsda baho va "Ko'rish", rejadagisida "Tahrirlash/Bekor
 * qilish", qolganida "Darsga qo'shilish" (+ jonlida "Yakunlash").
 */
export function LessonActions({
  lesson,
  onJoin,
  onFinish,
  onEdit,
  onDelete,
  onRatings,
  onRecording,
  onRate,
  compact = false,
}: LessonActionsProps) {
  const { t } = useTranslation("lesson");
  const { palette } = useTheme();
  const finished = lesson.status === "finished";
  const joinDisabled = !hasLessonTopic(lesson) || !isLessonJoinable(lesson);
  const canEdit = Boolean(onEdit) && isLessonEditable(lesson);
  const planned = lesson.status === "scheduled" && canEdit;

  const ratingChip =
    finished && (onRatings || lesson.ratingCount > 0) ? (
      <>
        <Star size={15} color={palette["saffron-strong"]} fill={palette["saffron-strong"]} />
        <Text variant="label">{lesson.avgRating === null ? "—" : lesson.avgRating.toFixed(1)}</Text>
        {compact ? null : (
          <Text variant="caption" style={{ color: palette["subtle-foreground"] }}>
            {t("list.dayCount", { count: lesson.ratingCount })}
          </Text>
        )}
      </>
    ) : null;

  return (
    <View style={[styles.row, !compact && styles.wrap]}>
      {ratingChip ? (
        <Pressable
          accessibilityRole={onRatings ? "button" : undefined}
          accessibilityLabel={t("actions.ratingsAria", { count: lesson.ratingCount })}
          disabled={!onRatings}
          onPress={() => onRatings?.(lesson)}
          style={[styles.rating, { backgroundColor: palette["saffron-soft"] }]}
        >
          {ratingChip}
        </Pressable>
      ) : null}

      {finished ? (
        onRecording ? (
          <ActionButton kind="primary" onPress={() => onRecording(lesson)} icon={<Play size={15} color={palette["primary-foreground"]} fill={palette["primary-foreground"]} />}>
            {compact ? null : t("actions.view")}
          </ActionButton>
        ) : null
      ) : planned ? (
        <>
          <ActionButton kind="outline" grow onPress={() => onEdit?.(lesson)} icon={<Icon name="edit" size={17} color={palette.foreground} />}>
            {compact ? null : t("actions.edit")}
          </ActionButton>
          {onDelete ? (
            <ActionButton
              kind="outline"
              grow
              onPress={() => onDelete(lesson)}
              icon={
                <View style={styles.rotate}>
                  <Icon name="add" size={17} color={palette.foreground} />
                </View>
              }
            >
              {compact ? null : t("actions.cancel")}
            </ActionButton>
          ) : null}
        </>
      ) : (
        <ActionButton
          kind="primary"
          grow
          disabled={joinDisabled}
          onPress={() => onJoin(lesson)}
          icon={<Icon name="volume" size={17} color={palette["primary-foreground"]} />}
        >
          {compact ? null : t("actions.joinLesson")}
        </ActionButton>
      )}

      {lesson.status === "live" && onFinish ? (
        <ActionButton kind="outline" onPress={() => onFinish(lesson)}>
          {t("actions.finish")}
        </ActionButton>
      ) : null}

      {finished && onRate ? (
        <ActionButton kind="outline" onPress={() => onRate(lesson)} icon={<Star size={17} color={palette.foreground} />}>
          {compact ? null : t("actions.rate")}
        </ActionButton>
      ) : null}

      {finished && canEdit ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("actions.editAria")}
          onPress={() => onEdit?.(lesson)}
          style={[styles.iconButton, { backgroundColor: palette["surface-subtle"] }]}
        >
          <Icon name="edit" size={17} color={palette["muted-foreground"]} />
        </Pressable>
      ) : null}

      {finished && onDelete ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("actions.deleteAria")}
          onPress={() => onDelete(lesson)}
          style={[styles.iconButton, { backgroundColor: palette["surface-subtle"] }]}
        >
          <Icon name="trash" size={17} color={palette["destructive-strong"]} />
        </Pressable>
      ) : null}
    </View>
  );
}

/** `PRIMARY` / `OUTLINE`: `h-11 rounded-xl px-4 gap-2`. */
function ActionButton({
  kind,
  grow = false,
  disabled = false,
  icon,
  onPress,
  children,
}: {
  kind: "primary" | "outline";
  grow?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  onPress: () => void;
  children?: ReactNode;
}) {
  const { palette } = useTheme();
  const primary = kind === "primary";
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        grow && styles.grow,
        primary
          ? { backgroundColor: pressed ? palette["primary-hover"] : palette.primary }
          : { borderWidth: 1, borderColor: palette.border, backgroundColor: pressed ? palette["surface-subtle"] : palette.surface },
        disabled && styles.dim,
      ]}
    >
      {icon}
      {children ? (
        <Text variant="label" style={{ color: primary ? palette["primary-foreground"] : palette.foreground }}>
          {children}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  wrap: { flexWrap: "wrap" },
  grow: { flex: 1 },
  dim: { opacity: 0.5 },
  rotate: { transform: [{ rotate: "45deg" }] },
  rating: { height: 44, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, borderRadius: radius.xl },
  button: { height: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 16, borderRadius: radius.xl },
  iconButton: { width: 44, height: 44, borderRadius: radius.xl, alignItems: "center", justifyContent: "center" },
});
