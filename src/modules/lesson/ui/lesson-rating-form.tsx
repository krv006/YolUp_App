import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { CheckCircle2 } from "lucide-react-native";
import { formatDateTime } from "@/shared/lib";
import type { Lesson } from "@/shared/types";
import { radius, Text, useTheme } from "@/shared/ui";
import { useLessonRatings, useRateLesson } from "../model/lesson.queries";
import { StarRating } from "./star-rating";

const MAX_DESCRIPTION = 500;

export interface LessonRatingFormProps {
  lesson: Lesson;
  currentUserId?: string;
  onSubmitted?: () => void;
}

/**
 * Darsni baholash formasi — veb `modules/lesson/ui/lesson-rating-form.tsx`:
 * yulduzlar, izoh, "anonim emas" ogohlantirishi; baho qo'yilgan bo'lsa
 * "Bahoyingiz qabul qilingan" kartasi.
 */
export function LessonRatingForm({ lesson, currentUserId, onSubmitted }: LessonRatingFormProps) {
  const { t } = useTranslation("lesson");
  const { palette } = useTheme();
  const [draft, setDraft] = useState<{ stars: number; description: string } | null>(null);
  const [focused, setFocused] = useState(false);
  const ratings = useLessonRatings(lesson.id, lesson.status === "finished");
  const rate = useRateLesson();

  const mine = currentUserId ? (ratings.data?.find((item) => item.studentId === currentUserId) ?? null) : null;
  const value = draft ?? { stars: 0, description: "" };

  function submit() {
    if (!value.stars) return;
    rate.mutate(
      { id: lesson.id, input: { stars: value.stars, description: value.description } },
      {
        onSuccess: () => {
          setDraft(null);
          onSubmitted?.();
        },
      }
    );
  }

  if (lesson.status !== "finished")
    return (
      <Text variant="label" style={[styles.muted, { color: palette["muted-foreground"] }]}>
        {t("ratingForm.notFinished")}
      </Text>
    );

  if (ratings.isLoading) return <View style={[styles.loading, { backgroundColor: palette.muted }]} />;

  if (ratings.data === null)
    return (
      <Text variant="label" style={[styles.muted, { color: palette["muted-foreground"] }]}>
        {t("ratingForm.disabled")}
      </Text>
    );

  if (mine)
    return (
      <View style={[styles.thanks, { borderColor: palette.border, backgroundColor: palette["surface-subtle"] }]}>
        <CheckCircle2 size={20} color={palette["success-strong"]} />
        <View style={styles.thanksBody}>
          <Text variant="label">{t("ratingForm.thanks")}</Text>
          <StarRating value={mine.stars} readOnly size={17} />
          {mine.description ? (
            <Text variant="label" style={styles.muted}>
              {mine.description}
            </Text>
          ) : null}
          <Text variant="caption" style={{ color: palette["muted-foreground"] }}>
            {formatDateTime(mine.createdAt)}
          </Text>
        </View>
      </View>
    );

  return (
    <View style={styles.form}>
      <View style={styles.stars}>
        <StarRating value={value.stars} onChange={(stars) => setDraft({ ...value, stars })} />
        <Text variant="label" style={{ color: palette["muted-foreground"] }}>
          {value.stars ? t("ratingForm.starsOfMax", { stars: value.stars }) : t("ratingForm.chooseStars")}
        </Text>
      </View>

      <View style={styles.field}>
        <Text variant="body" style={styles.label}>
          {t("ratingForm.commentLabel")}
        </Text>
        <TextInput
          multiline
          maxLength={MAX_DESCRIPTION}
          value={value.description}
          editable={!rate.isPending}
          onChangeText={(description) => setDraft({ ...value, description })}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={t("ratingForm.commentPlaceholder")}
          placeholderTextColor={palette["subtle-foreground"]}
          style={[
            styles.textarea,
            {
              color: palette.foreground,
              borderColor: focused ? palette.primary : palette["border-strong"],
              backgroundColor: focused ? palette.surface : palette["surface-tint"],
            },
          ]}
        />
      </View>

      <Text variant="label" style={[styles.muted, { color: palette["muted-foreground"] }]}>
        {t("ratingForm.notAnonymous")}
      </Text>

      {rate.isError ? (
        <Text variant="label" style={[styles.error, { color: palette["destructive-strong"], backgroundColor: palette["destructive-soft"] }]}>
          {rate.error.message}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        disabled={!value.stars || rate.isPending}
        onPress={submit}
        style={[styles.submit, { backgroundColor: palette.primary }, (!value.stars || rate.isPending) && styles.dim]}
      >
        <Text variant="label" style={{ color: palette["primary-foreground"] }}>
          {t("ratingForm.submit")}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  muted: { fontWeight: "400" },
  loading: { height: 120, borderRadius: radius.md },
  thanks: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14, borderWidth: 1, borderRadius: radius.md },
  thanksBody: { flex: 1, gap: 6, alignItems: "flex-start" },
  /* `.rating-form` gap 14 */
  form: { gap: 14 },
  stars: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 11 },
  field: { gap: 6 },
  label: { fontWeight: "700" },
  textarea: { minHeight: 84, paddingHorizontal: 13, paddingVertical: 11, borderWidth: 1, borderRadius: 10, fontSize: 15, fontFamily: "Onest-Medium", textAlignVertical: "top" },
  error: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10, overflow: "hidden" },
  submit: { height: 48, alignItems: "center", justifyContent: "center", borderRadius: radius.full },
  dim: { opacity: 0.5 },
});
