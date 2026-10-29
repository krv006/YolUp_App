import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import type { PracticeSet } from "@/shared/types";
import { DsText, dsRadius, Icon, useDs, type DsColor } from "@/shared/ui";

export interface PracticeSessionProps {
  set: PracticeSet;
  onRestart?: () => void;
  restarting?: boolean;
}

/**
 * Mashq savollari — veb `practice-session.tsx`: har savolda variantlar,
 * tanlangach to'g'ri javob yashil, noto'g'risi qizil va izoh ochiladi;
 * pastda natija va "Yana mashq".
 */
export function PracticeSession({ set, onRestart, restarting = false }: PracticeSessionProps) {
  const { t } = useTranslation("student");
  const ds = useDs();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const answered = Object.keys(answers).length;
  const correct = set.questions.filter((question, index) => answers[index] === question.correctIndex).length;
  const done = answered === set.questions.length;

  return (
    <View style={styles.list}>
      {set.questions.map((question, index) => {
        const picked = answers[index];
        const revealed = picked !== undefined;
        return (
          // `flex-col gap-3 rounded-2xl border border-line bg-surface p-4`
          <View key={index} style={[styles.card, { borderColor: ds.c.line, backgroundColor: ds.c.surface }]}>
            <View style={styles.head}>
              <View style={[styles.number, { backgroundColor: ds.c["brand-subtle"] }]}>
                <DsText v="caption-strong" c="brand">
                  {index + 1}
                </DsText>
              </View>
              <DsText v="title" w="500" style={styles.question}>
                {question.text}
              </DsText>
            </View>
            <View style={styles.options}>
              {question.options.map((option, optionIndex) => {
                const isCorrect = optionIndex === question.correctIndex;
                const isPicked = optionIndex === picked;
                const tone: { border: DsColor; bg: DsColor; fg: DsColor } = !revealed
                  ? { border: "line-strong", bg: "surface", fg: "ink" }
                  : isCorrect
                    ? { border: "success-fg", bg: "success-bg", fg: "success-fg" }
                    : isPicked
                      ? { border: "error-text", bg: "danger-bg", fg: "error-text" }
                      : { border: "line", bg: "surface", fg: "ink-tertiary" };
                return (
                  <Pressable
                    key={optionIndex}
                    accessibilityRole="button"
                    disabled={revealed}
                    onPress={() => setAnswers((current) => ({ ...current, [index]: optionIndex }))}
                    style={({ pressed }) => [
                      styles.option,
                      { borderColor: ds.c[tone.border], backgroundColor: !revealed && pressed ? ds.c.subtle : ds.c[tone.bg] },
                    ]}
                  >
                    <DsText v="body-sm" c={tone.fg} style={styles.grow}>
                      {option}
                    </DsText>
                    {revealed && isCorrect ? <Icon name="check-circle" size={18} color={ds.c[tone.fg]} /> : null}
                    {revealed && isPicked && !isCorrect ? <Icon name="cancel" size={18} color={ds.c[tone.fg]} /> : null}
                  </Pressable>
                );
              })}
            </View>
            {revealed && question.explanation ? (
              <View style={[styles.explanation, { backgroundColor: ds.c.subtle }]}>
                <DsText v="body-xs" c="ink-secondary">
                  {question.explanation}
                </DsText>
              </View>
            ) : null}
          </View>
        );
      })}

      {/* `flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface p-4` */}
      <View style={[styles.card, styles.summary, { borderColor: ds.c.line, backgroundColor: ds.c.surface }]}>
        <View style={styles.grow}>
          <DsText v="title">
            {done ? t("tutor.score", { correct, total: set.questions.length }) : t("tutor.progress", { answered, total: set.questions.length })}
          </DsText>
          {set.limit ? (
            <DsText v="caption" c="ink-tertiary">
              {t("tutor.usage", { used: set.used ?? 0, limit: set.limit })}
            </DsText>
          ) : null}
        </View>
        {onRestart ? (
          <Pressable
            accessibilityRole="button"
            disabled={restarting}
            onPress={onRestart}
            style={({ pressed }) => [styles.more, { backgroundColor: pressed ? ds.c["brand-strong"] : ds.c.brand }, restarting && styles.faded]}
          >
            <Icon name="refresh" size={18} color={ds.c["ink-inverse"]} />
            <DsText v="button" c="ink-inverse">
              {t("tutor.more")}
            </DsText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 16 },
  grow: { flex: 1, minWidth: 0 },
  faded: { opacity: 0.6 },
  card: { gap: 12, padding: 16, borderWidth: 1, borderRadius: dsRadius["2xl"] },
  head: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  number: { width: 28, height: 28, flexShrink: 0, borderRadius: dsRadius.full, alignItems: "center", justifyContent: "center" },
  question: { flex: 1, minWidth: 0, paddingTop: 2 },
  options: { gap: 8 },
  option: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderRadius: dsRadius.xl },
  explanation: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: dsRadius.xl },
  summary: { flexDirection: "row", flexWrap: "wrap", alignItems: "center" },
  more: { height: 44, flexShrink: 0, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 20, borderRadius: dsRadius.full },
});
