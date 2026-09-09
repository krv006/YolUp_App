import { useState } from "react";
import { StyleSheet, View } from "react-native";
import type { Lesson } from "@/shared/types";
import { formatDayTime } from "@/shared/lib";
import {
  Avatar,
  Button,
  Input,
  ScreenEmpty,
  ScreenLoading,
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
      title="Darsni baholang"
      description={lesson?.title}
    >
      <View style={styles.center}>
        <StarRating value={stars} onChange={setStars} size={34} />
      </View>

      <Input
        label="Izoh (ixtiyoriy)"
        placeholder="Dars sizga qanday o'tdi?"
        value={description}
        onChangeText={setDescription}
        multiline
        error={error || undefined}
      />

      <Button title="Yuborish" size="lg" loading={rate.isPending} onPress={() => void submit()} />
    </Sheet>
  );
}

/**
 * Darsni yakunlash — veb `finish-lesson-dialog.tsx` ning mobil varianti.
 *
 * Yozuv NOMI shu yerda beriladi: backend uni guruh chatiga e'lon qiladi
 * (docs/PROJECT.md §10). Bo'sh qoldirilsa dars nomi olinadi.
 */
export function FinishLessonSheet({
  lesson,
  onClose,
  onFinished,
}: {
  lesson: Lesson | null;
  onClose: () => void;
  onFinished?: () => void;
}) {
  const [title, setTitle] = useState("");
  const finish = useFinishLesson();

  function close() {
    setTitle("");
    onClose();
  }

  async function submit() {
    if (!lesson) return;
    try {
      await finish.mutateAsync({ id: lesson.id, recordingTitle: title.trim() || undefined });
      close();
      onFinished?.();
    } catch {
      /*
       * XATO BU YERDA KO'RSATILMAYDI — uni mutatsiyaning `onError` i
       * chiqaradi. Ilgari ikkalasi ham chiqarardi va toast EKRANDA IKKI
       * MARTA ko'rinardi.
       *
       * `catch` o'zi kerak: `mutateAsync` rad javob bersa, quyidagi
       * `close()` bajarilmasligi va rad javob e'tiborsiz qolmasligi shart.
       */
    }
  }

  return (
    <Sheet
      open={Boolean(lesson)}
      onClose={close}
      title="Darsni yakunlash"
      description="Yakunlangach doska PDF'i va video yozuv guruh chatiga tushadi."
    >
      <Input
        label="Yozuv nomi"
        placeholder={lesson?.title ?? "Dars nomi"}
        value={title}
        onChangeText={setTitle}
      />
      <Text variant="caption" tone="muted">
        Bo'sh qoldirsangiz dars nomi ishlatiladi.
      </Text>

      <Button
        title="Darsni yakunlash"
        variant="danger"
        size="lg"
        loading={finish.isPending}
        onPress={() => void submit()}
      />
    </Sheet>
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
  const ratings = useLessonRatings(lesson?.id ?? null, Boolean(lesson));

  return (
    <Sheet
      open={Boolean(lesson)}
      onClose={onClose}
      title="Dars baholari"
      description={lesson?.title}
    >
      {ratings.isLoading ? <ScreenLoading label="Yuklanmoqda…" /> : null}

      {!ratings.isLoading && (ratings.data ?? []).length === 0 ? (
        <ScreenEmpty title="Hali baho yo'q" description="O'quvchilar baholagach shu yerda ko'rinadi." />
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
});
