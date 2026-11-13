import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TextInput, View } from "react-native";
import type { HomeworkAnswer } from "@/shared/types";
import { bodyFont, dsAlpha, DsText, dsRadius, dsType, useDs } from "@/shared/ui";

function scoreText(value: number | null): string {
  if (value === null) return "—";
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export interface QuestionsResultProps {
  answers: HomeworkAnswer[];
  scores?: Record<string, string>;
  onScoreChange?: (questionId: string, value: string) => void;
}

/**
 * Savollar bo'yicha natija — veb `questions-result.tsx`: har savolda javob,
 * to'g'ri/noto'g'ri variantlar va ball. `onScoreChange` berilsa (o'qituvchi
 * tekshiruvi) ball maydoni tahrirlanadi va AI bahosi ko'rinadi.
 */
export function QuestionsResult({ answers, scores, onScoreChange }: QuestionsResultProps) {
  const { t } = useTranslation("homework");
  const ds = useDs();
  const total = answers.reduce((sum, item) => sum + item.points, 0);
  const earned = answers.reduce((sum, item) => sum + (item.score ?? 0), 0);

  return (
    <View style={styles.root}>
      <View style={styles.head}>
        <DsText v="title" style={styles.grow}>
          {t("questions.resultTitle")}
        </DsText>
        <View style={[styles.total, { backgroundColor: ds.c["brand-subtle"] }]}>
          <DsText v="caption-strong" c="brand">
            {t("questions.resultTotal", { earned: scoreText(earned), total })}
          </DsText>
        </View>
      </View>
      {answers.map((answer, index) => {
        const test = answer.type === "single" || answer.type === "multiple";
        const picked = Array.isArray(answer.answer) ? answer.answer : [];
        const tone =
          answer.isCorrect === true
            ? { borderColor: dsAlpha(ds.c["success-fg"], 0.4), backgroundColor: ds.c["success-bg"] }
            : answer.isCorrect === false
              ? { borderColor: dsAlpha(ds.c.danger, 0.3), backgroundColor: ds.c["danger-bg"] }
              : { borderColor: ds.c.line, backgroundColor: ds.c.surface };
        return (
          <View key={answer.questionId} style={[styles.card, tone]}>
            <View style={styles.top}>
              <DsText v="title-sm" c="brand">
                {index + 1}.
              </DsText>
              <DsText v="body" style={styles.grow}>
                {answer.text}
              </DsText>
              {onScoreChange ? (
                <View style={styles.scoreEdit}>
                  <ScoreInput
                    label={t("questions.scoreAria", { n: index + 1 })}
                    value={
                      scores?.[answer.questionId] ??
                      (answer.score === null ? "" : String(answer.score))
                    }
                    onChange={(next) =>
                      onScoreChange(
                        answer.questionId,
                        next.replace(/[^\d.,]/g, "").replace(",", ".")
                      )
                    }
                  />
                  <DsText v="caption-strong" c="ink-secondary">
                    / {answer.points}
                  </DsText>
                </View>
              ) : (
                <View style={[styles.pill, { backgroundColor: ds.c.surface }]}>
                  <DsText v="caption-strong" c="ink-secondary">
                    {scoreText(answer.score)} / {answer.points}
                  </DsText>
                </View>
              )}
            </View>
            {test ? (
              <View style={styles.options}>
                {answer.options.map((option, optionIndex) => {
                  const chosen = picked.includes(optionIndex);
                  const right = answer.correct?.includes(optionIndex) ?? false;
                  const color = right ? "success-fg" : chosen ? "danger" : "ink-secondary";
                  return (
                    <View key={optionIndex} style={styles.option}>
                      <DsText
                        v="body-sm"
                        c={color}
                        accessibilityElementsHidden
                        importantForAccessibility="no"
                      >
                        {chosen ? (right ? "✓" : "✗") : right ? "✓" : "•"}
                      </DsText>
                      <DsText
                        v="body-sm"
                        c={color}
                        w={chosen ? "600" : undefined}
                        style={styles.shrink}
                      >
                        {option}
                      </DsText>
                      {chosen ? (
                        <DsText v="caption" c={color}>
                          {t("questions.yourChoice")}
                        </DsText>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            ) : (
              <DsText v="body-sm" style={[styles.answer, { backgroundColor: ds.c.subtle }]}>
                {typeof answer.answer === "string" && answer.answer
                  ? answer.answer
                  : t("questions.noAnswer")}
              </DsText>
            )}
            {answer.aiScore !== null && onScoreChange ? (
              <DsText v="caption" c="ink-tertiary">
                {t("questions.aiScore", { score: scoreText(answer.aiScore) })}
              </DsText>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

/** `h-8 w-14 rounded-md border border-line bg-surface text-center text-body-sm`, fokusda `border-focus`. */
function ScoreInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const ds = useDs();
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      accessibilityLabel={label}
      keyboardType="decimal-pad"
      value={value}
      onChangeText={onChange}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      selectionColor={ds.c.brand}
      style={[
        styles.scoreInput,
        {
          borderColor: focused ? ds.c.focus : ds.c.line,
          backgroundColor: ds.c.surface,
          color: ds.c.ink,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  head: { flexDirection: "row", alignItems: "center", gap: 8 },
  grow: { flex: 1, minWidth: 0 },
  shrink: { flexShrink: 1, minWidth: 0 },
  /* `rounded-full px-2.5 py-0.5` */
  total: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: dsRadius.full },
  /* `gap-2 rounded-xl border p-4` */
  card: { gap: 8, padding: 16, borderWidth: 1, borderRadius: dsRadius.xl },
  top: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  pill: { flexShrink: 0, paddingHorizontal: 8, paddingVertical: 2, borderRadius: dsRadius.full },
  scoreEdit: { flexShrink: 0, flexDirection: "row", alignItems: "center", gap: 4 },
  scoreInput: {
    width: 56,
    height: 32,
    paddingHorizontal: 8,
    paddingVertical: 0,
    borderWidth: 1,
    borderRadius: dsRadius.md,
    textAlign: "center",
    fontFamily: bodyFont("400"),
    fontSize: dsType["body-sm"].fontSize,
  },
  options: { gap: 4 },
  /* `gap-2 rounded-md px-3 py-1.5` */
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: dsRadius.md,
  },
  /* `rounded-md bg-subtle px-3 py-2` */
  answer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: dsRadius.md,
    overflow: "hidden",
  },
});
