import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import type { Lesson } from "@/shared/types";
import { formatDayTime } from "@/shared/lib";
import {
  Avatar,
  Button,
  ConfirmDialog,
  Input,
  ScreenEmpty,
  ScreenLoading,
  radius,
  Separator,
  Sheet,
  Text,
} from "@/shared/ui";
import { useFinishLesson, useLessonRatings, useRateLesson } from "../model/lesson.queries";
import { StarRating } from "./star-rating";

/**
 * Darsni baholash — veb `rate-lesson-dialog.tsx` + `lesson-rating-form.tsx`
 * ning mobil varianti.
 *
 * Faqat TUGAGAN darsga baho qo'yiladi; backend buni ham tekshiradi va
 * xatoni matn bilan qaytaradi — shuning uchun xato formada ko'rsatiladi,
 * toast'da emas (foydalanuvchi sababni tugma yonida ko'rishi kerak).
 */
export function RateLessonSheet({
  lesson,
  onClose,
}: {
  lesson: Lesson | null;
  onClose: () => void;
}) {
  const { t } = useTranslation("mobile");
  const [stars, setStars] = useState(5);
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const rate = useRateLesson();

  function close() {
    setStars(5);
    setDescription("");
    setError("");
    onClose();
  }

  async function submit() {
    if (!lesson) return;
    setError("");
    try {
      await rate.mutateAsync({ id: lesson.id, input: { stars, description: description.trim() } });
      close();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Bahoni saqlab bo'lmadi");
    }
  }

  return (
    <Sheet
      open={Boolean(lesson)}
      onClose={close}
      title={t("lesson.darsni_baholang")}
      description={lesson?.title}
    >
      <View style={styles.center}>
        <StarRating value={stars} onChange={setStars} size={34} />
      </View>

      <Input
        label={t("lesson.izoh_ixtiyoriy")}
        placeholder={t("lesson.dars_sizga_qanday_otdi")}
        value={description}
        onChangeText={setDescription}
        multiline
        error={error || undefined}
      />

      <Button title={t("lesson.yuborish")} size="lg" loading={rate.isPending} onPress={() => void submit()} />
    </Sheet>
  );
}

/**
 * Darsni yakunlash — veb `finish-lesson-dialog.tsx`: qizil ikonka, sarlavha,
 * tavsif va ikki tugma. `onLeaveOnly` berilsa (jonli xonada) chap tugma
 * "Faqat chiqish" bo'ladi va dars davom etadi.
 */
export function FinishLessonSheet({
  lesson,
  onClose,
  onFinished,
  onLeaveOnly,
}: {
  lesson: Lesson | null;
  onClose: () => void;
  onFinished?: () => void;
  onLeaveOnly?: () => void;
}) {
  const { t } = useTranslation("lesson");
  const finish = useFinishLesson();

  /* Veb `finish-lesson-dialog.tsx` ning tor ekran varianti — markazdagi `ConfirmDialog` (brand). */
  return (
    <ConfirmDialog
      open={Boolean(lesson)}
      onOpenChange={(open) => !open && onClose()}
      tone="brand"
      icon="logout"
      title={t("finishDialog.title")}
      description={t("finishDialog.mobileDescription")}
      confirmLabel={t("finishDialog.confirm")}
      cancelLabel={onLeaveOnly ? t("finishDialog.leaveOnly") : t("finishDialog.cancel")}
      pending={finish.isPending}
      onCancel={onLeaveOnly}
      onConfirm={() => {
        if (!lesson) return;
        finish.mutate(
          { id: lesson.id },
          {
            onSuccess: () => {
              onClose();
              onFinished?.();
            },
          }
        );
      }}
    />
  );
}

/**
 * Darsga qo'yilgan baholar — veb `lesson-ratings-dialog.tsx` porti.
 * Anonim EMAS: kim qo'yganini o'qituvchi ko'radi (domen izohi).
 */
export function LessonRatingsSheet({
  lesson,
  onClose,
}: {
  lesson: Lesson | null;
  onClose: () => void;
}) {
  const { t } = useTranslation("mobile");
  const ratings = useLessonRatings(lesson?.id ?? null, Boolean(lesson));

  return (
    <Sheet
      open={Boolean(lesson)}
      onClose={onClose}
      title={t("lesson.dars_baholari")}
      description={lesson?.title}
    >
      {ratings.isLoading ? <ScreenLoading label={t("lesson.yuklanmoqda")} /> : null}

      {!ratings.isLoading && (ratings.data ?? []).length === 0 ? (
        <ScreenEmpty title={t("lesson.hali_baho_yoq")} description={t("lesson.oquvchilar_baholagach_shu_yerda_korinadi")} />
      ) : null}

      {(ratings.data ?? []).map((rating, index) => (
        <View key={rating.id}>
          {index > 0 ? <Separator /> : null}
          <View style={styles.rating}>
            <Avatar name={rating.studentName} size="md" />
            <View style={styles.ratingBody}>
              <Text variant="label" numberOfLines={1}>
                {rating.studentName}
              </Text>
              <StarRating value={rating.stars} readOnly size={14} />
              {rating.description ? <Text variant="caption">{rating.description}</Text> : null}
              <Text variant="caption" tone="muted">
                {formatDayTime(rating.createdAt)}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", paddingVertical: 8 },
  rating: { flexDirection: "row", gap: 12, paddingVertical: 12 },
  ratingBody: { flex: 1, gap: 4 },
  finishIcon: { width: 44, height: 44, borderRadius: radius["2xl"], alignItems: "center", justifyContent: "center" },
});
