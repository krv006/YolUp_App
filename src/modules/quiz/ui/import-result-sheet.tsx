import { StyleSheet, View } from "react-native";
import { radius, Button, Sheet, Text, toast, useTheme } from "@/shared/ui";
import type { QuizImportWarning } from "@/shared/types";
import type { ImportedQuiz } from "../api/quiz.api";
import { usePublishQuiz } from "../model/quiz.queries";

/**
 * Import natijasi — ogohlantirishlar va e'lon qilish.
 *
 * 🆕 MOBIL: vebda import natijasi TAHRIRLASH dialogini ochadi
 * (`teacher-quizzes-page.tsx:187`), u yerda o'qituvchi savollarni
 * tuzatib, keyin "E'lon qilish"ni bosadi.
 *
 * Mobilda test tahrirlash oynasi hali yo'q, lekin importni ogohlantirishsiz
 * qoldirib bo'lmaydi: import qilingan test QORALAMA bo'lib keladi va
 * o'quvchilarga KO'RINMAYDI. Buni aytmasak, o'qituvchi testni yaratdim deb
 * o'ylab ketadi.
 *
 * Shuning uchun natija shu oynada ko'rsatiladi: nechta savol olindi, nimaga
 * e'tibor berish kerak va e'lon qilish tugmasi. Tahrirlash qo'shilganda
 * bu oyna o'sha dialogga yo'l ochadi.
 */
export interface ImportResultSheetProps {
  result: ImportedQuiz | null;
  onClose: () => void;
  /** Tahrirlash oynasini ochish — ogohlantirishlarni tuzatish uchun. */
  onEdit?: (quizId: string) => void;
}

/** Veb `importWarning.*` kalitlarining matn ko'rinishi (DECISIONS §13). */
function warningMessage(warning: QuizImportWarning): string {
  const number = warning.questionNumber;
  if (warning.reason === "answer_not_detected") {
    return `${number}-savol: to'g'ri javob aniqlanmadi — qo'lda belgilang`;
  }
  if (warning.reason === "unsupported_type") {
    return `${number}-savol import qilinmadi: faqat bitta va bir nechta tanlovli savollar olinadi`;
  }
  return `${number}-savol: variantlar yetarli emas — tekshiring`;
}

export function ImportResultSheet({ result, onClose, onEdit }: ImportResultSheetProps) {
  const { palette } = useTheme();
  const publish = usePublishQuiz();

  const quiz = result?.quiz;
  const warnings = result?.warnings ?? [];

  /*
   * Google Forms to'g'ri javoblarni UMUMAN bermaydi — o'shanda har bir
   * savol uchun alohida ogohlantirish chiqadi va ro'yxat foydasiz uzayadi.
   * Veb bunday holatda bitta umumiy jumla ko'rsatadi (`allAnswersMissing`).
   */
  const missingAnswers = warnings.filter((item) => item.reason === "answer_not_detected");
  const allAnswersMissing =
    Boolean(quiz?.questions.length) && missingAnswers.length >= (quiz?.questions.length ?? 0);
  const listed = allAnswersMissing
    ? warnings.filter((item) => item.reason !== "answer_not_detected")
    : warnings;

  return (
    <Sheet
      open={Boolean(result)}
      onClose={onClose}
      title="Test import qilindi"
      description={`${quiz?.questions.length ?? 0} ta savol olindi.`}
    >
      <View
        style={[
          styles.notice,
          { backgroundColor: palette["primary-tint"], borderColor: palette["border-accent"] },
        ]}
      >
        <Text variant="caption">
          Bu test qoralama — o&apos;quvchilarga ko&apos;rinmaydi. To&apos;g&apos;ri javoblarni
          tekshirib, &quot;E&apos;lon qilish&quot;ni bosing.
        </Text>
      </View>

      {allAnswersMissing ? (
        <Text variant="caption" tone="muted">
          Google Forms to&apos;g&apos;ri javoblarni bermaydi — har bir savolda to&apos;g&apos;ri
          javobni o&apos;zingiz belgilang.
        </Text>
      ) : null}

      {listed.map((warning) => (
        <Text
          key={`${warning.questionNumber}-${warning.reason}`}
          variant="caption"
          tone="muted"
        >
          {warningMessage(warning)}
        </Text>
      ))}

      {/*
        * Tahrirlash E'LON QILISHDAN OLDIN turadi: ogohlantirish bo'lsa,
        * avval to'g'ri javoblarni to'ldirish kerak — e'lon qilingan test
        * o'quvchilarga darrov ko'rinadi.
        */}
      {onEdit ? (
        <Button
          title="Savollarni tekshirish"
          size="lg"
          variant="secondary"
          onPress={() => {
            if (quiz) onEdit(quiz.id);
          }}
        />
      ) : null}

      <Button
        title="E'lon qilish"
        size="lg"
        variant={warnings.length ? "secondary" : "primary"}
        loading={publish.isPending}
        onPress={() => {
          if (!quiz) return;
          /*
           * `usePublishQuiz` da `onError` yo'q (veb bilan bayt-bayt bir xil,
           * o'zgartirilmaydi). Shuning uchun xato SHU YERDA ushlanadi —
           * aks holda e'lon qilinmagani jimgina o'tib ketardi.
           */
          publish.mutate(quiz.id, {
            onSuccess: onClose,
            onError: (error: Error) => toast.error(error.message),
          });
        }}
      />

      <Button title="Keyinroq" variant="ghost" onPress={onClose} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  notice: {
    padding: 12,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
