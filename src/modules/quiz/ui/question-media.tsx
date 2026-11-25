import { useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import type { QuizQuestion } from "@/shared/types";
import { dsRadius, useDs } from "@/shared/ui";
import { MathText } from "./math-text";

/**
 * Savolning rasmi va rasmdan keyingi matni — veb `question-media.tsx`
 * (#204). Savol matni (rasmdan oldin) alohida ko'rsatiladi.
 *
 * 🟡 `<img class="max-h-96 w-auto max-w-full">` o'rniga: eni to'liq,
 * balandlik rasm nisbatidan (yuklangach), 384 dan oshmaydi, `contain`.
 */
export function QuestionMedia({ question }: { question: Pick<QuizQuestion, "image" | "textAfter"> }) {
  const ds = useDs();
  const [ratio, setRatio] = useState<number | null>(null);
  const after = question.textAfter?.trim() ?? "";
  if (!question.image && !after) return null;
  return (
    <View style={styles.root}>
      {question.image ? (
        <Image
          source={{ uri: question.image.url }}
          accessibilityIgnoresInvertColors
          resizeMode="contain"
          onLoad={(event) => {
            const { width, height } = event.nativeEvent.source;
            if (width && height) setRatio(width / height);
          }}
          style={[styles.image, { aspectRatio: ratio ?? 4 / 3, borderColor: ds.c.line, backgroundColor: ds.c.surface }]}
        />
      ) : null}
      {after ? <MathText text={after} v="body" preLine /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  /* `mt-3 flex flex-col gap-3` */
  root: { marginTop: 12, gap: 12 },
  /* `max-h-96 rounded-lg border border-line bg-surface object-contain` */
  image: { width: "100%", maxHeight: 384, borderWidth: 1, borderRadius: dsRadius.lg },
});
