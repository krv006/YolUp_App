import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, TextInput, View, type StyleProp, type ViewStyle } from "react-native";
import { ArrowDown, ArrowUp, Check, ChevronDown } from "lucide-react-native";
import type { QuizAnswerValue, QuizQuestion } from "@/shared/types";
import { radius, Sheet, Text, useTheme } from "@/shared/ui";
import { emptyAnswer } from "../lib/answer-value";
import { QUIZ_RADIUS, useQuizColors } from "./quiz-colors";

/**
 * Savolga javob berish — veb `modules/quiz/ui/question-answer-input.tsx`
 * porti. Test yechishda, mock testda va muharrirdagi "O'quvchi ko'radi"
 * yorlig'ida bir xil ko'rinadi.
 *
 * Uslublar vebdagi `legacy.css` qoidalaridan (`.quiz-attempt-option`,
 * `.quiz-option-radio`, `.quiz-answer-*`):
 *   variant   min-h 42, bo'shliq 0 12, chegara 1 `--border-strong`,
 *             radius 13, fon `--surface-tint`, oraliq 10;
 *             tanlangan: chegara action, fon action-tint
 *   radio     20x20, 2px chegara, ichida 10x10 nuqta
 *   belgi     20x20, radius 6, tanlanganda to'la action va oq belgi
 *
 * Vebdan farqi: `$...$` formulalar hozircha oddiy matn bo'lib chiqadi —
 * vebda ular MathLive bilan chiziladi, mobilda bunday renderer yo'q.
 */
export interface QuestionAnswerInputProps {
  question: QuizQuestion;
  /** Savol raqami — ekran o'quvchisi uchun ("3-savol javoblari"). */
  number?: number;
  value: QuizAnswerValue | undefined;
  onChange: (value: QuizAnswerValue) => void;
}

function countWords(value: string): number {
  const trimmed = value.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function asType<T extends QuizAnswerValue["type"]>(
  value: QuizAnswerValue,
  type: T
): Extract<QuizAnswerValue, { type: T }> | null {
  return value.type === type ? (value as Extract<QuizAnswerValue, { type: T }>) : null;
}

/** Savol matni — veb `QuestionPrompt`. */
export function QuestionPrompt({ question }: { question: QuizQuestion }) {
  const { t } = useTranslation("quiz");
  const colors = useQuizColors();
  if (question.type === "fill_blank") {
    return (
      <Text variant="caption" style={{ color: colors.muted }}>
        {t("answer.fillBlankHint")}
      </Text>
    );
  }
  if (!question.text.trim()) {
    return (
      <Text variant="label" style={[styles.prompt, styles.placeholder, { color: colors.muted }]}>
        {t("preview.questionPlaceholder")}
      </Text>
    );
  }
  return (
    <Text
      variant="label"
      style={[styles.prompt, question.type === "essay" && styles.essayPrompt, { color: colors.foreground }]}
    >
      {question.text}
    </Text>
  );
}

export function QuestionAnswerInput({ question, number = 1, value, onChange }: QuestionAnswerInputProps) {
  const { t } = useTranslation("quiz");
  const { palette } = useTheme();
  const colors = useQuizColors();
  const current = value && value.type === question.type ? value : emptyAnswer(question);
  const groupLabel = t("attemptDialog.answersAria", { number });

  const single = asType(current, "single");
  if (single) {
    return (
      <View style={styles.list} accessibilityRole="radiogroup" accessibilityLabel={groupLabel}>
        {question.options.map((option) => (
          <Choice
            key={option.id}
            shape="radio"
            selected={single.optionId === option.id}
            label={option.text}
            placeholder={t("preview.optionPlaceholder")}
            onPress={() => onChange({ type: "single", optionId: option.id })}
          />
        ))}
      </View>
    );
  }

  const multiple = asType(current, "multiple");
  if (multiple) {
    return (
      <View style={styles.list} accessibilityLabel={groupLabel}>
        <Text variant="caption" style={{ color: colors.muted }}>
          {t("answer.multipleHint")}
        </Text>
        {question.options.map((option) => {
          const active = multiple.optionIds.includes(option.id);
          return (
            <Choice
              key={option.id}
              shape="box"
              selected={active}
              label={option.text}
              placeholder={t("preview.optionPlaceholder")}
              onPress={() =>
                onChange({
                  type: "multiple",
                  optionIds: active
                    ? multiple.optionIds.filter((id) => id !== option.id)
                    : [...multiple.optionIds, option.id],
                })
              }
            />
          );
        })}
      </View>
    );
  }

  const trueFalse = asType(current, "true_false");
  if (trueFalse) {
    return (
      <View style={styles.bool} accessibilityRole="radiogroup" accessibilityLabel={groupLabel}>
        {[true, false].map((option) => (
          <Choice
            key={String(option)}
            shape="radio"
            selected={trueFalse.value === option}
            label={option ? t("answer.true") : t("answer.false")}
            onPress={() => onChange({ type: "true_false", value: option })}
            style={styles.half}
          />
        ))}
      </View>
    );
  }

  const numeric = asType(current, "numeric");
  if (numeric) {
    return (
      <AnswerInput
        value={numeric.value}
        label={groupLabel}
        placeholder={t("answer.numericPlaceholder")}
        keyboardType="numbers-and-punctuation"
        onChange={(next) => onChange({ type: "numeric", value: next })}
      />
    );
  }

  const essay = asType(current, "essay");
  if (essay) {
    const words = countWords(essay.value);
    const minimum = question.minWords ?? 0;
    return (
      <View style={styles.list}>
        <AnswerInput
          value={essay.value}
          label={groupLabel}
          placeholder={t("answer.essayPlaceholder")}
          multiline
          onChange={(next) => onChange({ type: "essay", value: next })}
        />
        <Text
          variant="caption"
          // `.quiz-answer-words.is-short` #b45309, `.is-enough` #15803d
          style={{ color: minimum && words < minimum ? "#b45309" : "#15803d" }}
        >
          {minimum ? t("answer.wordsOfMin", { count: words, min: minimum }) : t("answer.words", { count: words })}
        </Text>
      </View>
    );
  }

  const text = asType(current, "text");
  if (text) {
    return (
      <AnswerInput
        value={text.value}
        label={groupLabel}
        placeholder={t("answer.textPlaceholder")}
        onChange={(next) => onChange({ type: "text", value: next })}
      />
    );
  }

  const matching = asType(current, "matching");
  if (matching) {
    return (
      <View style={styles.list} accessibilityLabel={groupLabel}>
        {question.matchLeft.map((left) => (
          <View key={left.id} style={styles.matchRow}>
            <Text variant="body" style={[styles.matchLeft, { color: colors.foreground }]}>
              {left.text || "…"}
            </Text>
            <MatchSelect
              value={matching.pairs[left.id] ?? ""}
              placeholder={t("answer.matchPlaceholder")}
              options={question.matchRight.map((right) => ({ value: right.id, label: right.text }))}
              onChange={(next) => {
                const pairs = { ...matching.pairs };
                if (next) pairs[left.id] = next;
                else delete pairs[left.id];
                onChange({ type: "matching", pairs });
              }}
            />
          </View>
        ))}
      </View>
    );
  }

  const ordering = asType(current, "ordering");
  if (ordering) {
    const byId = new Map(question.options.map((option) => [option.id, option]));
    const known = ordering.order.filter((id) => byId.has(id));
    const order = [...known, ...question.options.map((option) => option.id).filter((id) => !known.includes(id))];
    const moveItem = (from: number, to: number) => {
      if (to < 0 || to >= order.length) return;
      const next = [...order];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      onChange({ type: "ordering", order: next });
    };
    return (
      <View style={styles.list} accessibilityLabel={groupLabel}>
        {order.map((id, position) => (
          <View
            key={id}
            style={[styles.orderRow, { borderColor: colors.borderStrong, backgroundColor: colors.surfaceTint }]}
          >
            <View style={[styles.orderIndex, { backgroundColor: palette["primary-tint"] }]}>
              <Text variant="caption" style={[styles.heavy, { color: palette["primary-text"] }]}>
                {position + 1}
              </Text>
            </View>
            <Text variant="body" style={[styles.grow, { color: colors.foreground }]}>
              {byId.get(id)?.text || "…"}
            </Text>
            <OrderButton
              label={t("editor.moveUpAria")}
              disabled={position === 0}
              onPress={() => moveItem(position, position - 1)}
            >
              <ArrowUp size={14} color={colors.muted} />
            </OrderButton>
            <OrderButton
              label={t("editor.moveDownAria")}
              disabled={position === order.length - 1}
              onPress={() => moveItem(position, position + 1)}
            >
              <ArrowDown size={14} color={colors.muted} />
            </OrderButton>
          </View>
        ))}
      </View>
    );
  }

  const fill = asType(current, "fill_blank");
  if (fill) {
    const parts = question.text.split(/(\{\{\d+\}\})/g);
    return (
      <View style={styles.fill}>
        {parts.flatMap((part, index) => {
          const match = /^\{\{(\d+)\}\}$/.exec(part);
          if (!match) {
            // Matn so'zlarga bo'linadi — qator oxirida o'ralishi uchun.
            return part
              .split(/(\s+)/)
              .filter((word) => word.trim())
              .map((word, wordIndex) => (
                <Text
                  key={`${index}-${wordIndex}`}
                  variant="label"
                  style={[styles.fillText, { color: colors.foreground }]}
                >
                  {word}
                </Text>
              ));
          }
          const blankIndex = Number(match[1]) - 1;
          return [
            <TextInput
              key={index}
              value={fill.values[blankIndex] ?? ""}
              accessibilityLabel={t("answer.blankAria", { number: blankIndex + 1 })}
              onChangeText={(next) => {
                const values = Array.from(
                  { length: Math.max(question.blankCount, fill.values.length, blankIndex + 1) },
                  (_, position) => fill.values[position] ?? ""
                );
                values[blankIndex] = next;
                onChange({ type: "fill_blank", values });
              }}
              style={[
                styles.blank,
                {
                  borderBottomColor: palette.primary,
                  backgroundColor: palette["primary-tint"],
                  color: colors.foreground,
                },
              ]}
            />,
          ];
        })}
      </View>
    );
  }

  return null;
}

/**
 * Variant tugmasi — `.quiz-attempt-option` + `.quiz-option-radio` /
 * `.quiz-option-check`. Mock test ham shuni ishlatadi.
 */
export function Choice({
  label,
  placeholder,
  selected,
  shape,
  onPress,
  style,
}: {
  label: string;
  /** Matn bo'sh bo'lsa (muharrirdagi ko'rinish) — kulrang o'rinbosar. */
  placeholder?: string;
  selected: boolean;
  shape: "radio" | "box";
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { palette } = useTheme();
  const colors = useQuizColors();
  return (
    <Pressable
      accessibilityRole={shape === "radio" ? "radio" : "checkbox"}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[
        styles.option,
        {
          borderColor: selected ? palette.primary : colors.borderStrong,
          backgroundColor: selected ? palette["primary-tint"] : colors.surfaceTint,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.mark,
          shape === "radio" ? styles.markRound : styles.markSquare,
          {
            borderColor: selected ? palette.primary : colors.borderStrong,
            backgroundColor: selected && shape === "box" ? palette.primary : "transparent",
          },
        ]}
      >
        {selected ? (
          shape === "radio" ? (
            <View style={[styles.dot, { backgroundColor: palette.primary }]} />
          ) : (
            <Check size={13} color={palette["primary-foreground"]} strokeWidth={3} />
          )
        ) : null}
      </View>
      <Text
        variant="body"
        style={[styles.grow, { color: label ? colors.foreground : colors.muted }]}
      >
        {label || placeholder}
      </Text>
    </Pressable>
  );
}

/** `.quiz-answer-input` — min-h 42, chegara 1 `--border-strong`, radius 13. */
function AnswerInput({
  value,
  label,
  placeholder,
  onChange,
  multiline = false,
  keyboardType,
}: {
  value: string;
  label: string;
  placeholder: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  keyboardType?: "numbers-and-punctuation";
}) {
  const { palette } = useTheme();
  const colors = useQuizColors();
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      value={value}
      accessibilityLabel={label}
      placeholder={placeholder}
      placeholderTextColor={colors.muted}
      keyboardType={keyboardType}
      multiline={multiline}
      textAlignVertical={multiline ? "top" : "center"}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChangeText={onChange}
      style={[
        styles.input,
        multiline && styles.essayInput,
        {
          borderColor: focused ? palette.primary : colors.borderStrong,
          backgroundColor: palette.surface,
          color: colors.foreground,
        },
      ]}
    />
  );
}

/** Moslashtirishdagi tanlov — vebda `<select>`, mobilda ro'yxatli oyna. */
function MatchSelect({
  value,
  placeholder,
  options,
  onChange,
}: {
  value: string;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  const { palette } = useTheme();
  const colors = useQuizColors();
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={[styles.select, { borderColor: colors.borderStrong, backgroundColor: palette.surface }]}
      >
        <Text variant="body" numberOfLines={1} style={[styles.grow, { color: colors.foreground }]}>
          {selected?.label ?? placeholder}
        </Text>
        <ChevronDown size={16} color={colors.muted} />
      </Pressable>
      <Sheet open={open} onClose={() => setOpen(false)} title={placeholder}>
        {[{ value: "", label: placeholder }, ...options].map((option) => (
          <Pressable
            key={option.value || "__empty"}
            accessibilityRole="button"
            onPress={() => {
              onChange(option.value);
              setOpen(false);
            }}
            style={({ pressed }) => [
              styles.selectOption,
              (pressed || option.value === value) && { backgroundColor: palette["surface-subtle"] },
            ]}
          >
            <Text variant="body" style={styles.grow}>
              {option.label}
            </Text>
            {option.value === value ? <Check size={18} color={palette.primary} /> : null}
          </Pressable>
        ))}
      </Sheet>
    </>
  );
}

function OrderButton({
  label,
  disabled,
  onPress,
  children,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={[styles.orderButton, disabled && styles.disabled]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  half: { flex: 1 },
  heavy: { fontWeight: "700" },
  disabled: { opacity: 0.35 },
  /* Savol matni — 14/21, 650 */
  prompt: { fontSize: 14, lineHeight: 21, fontWeight: "600" },
  placeholder: { fontWeight: "400" },
  essayPrompt: { lineHeight: 22 },
  /* `.quiz-option-list` — gap 6 */
  list: { gap: 6 },
  bool: { flexDirection: "row", gap: 6 },
  option: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: QUIZ_RADIUS.md,
  },
  mark: { width: 20, height: 20, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  markRound: { borderRadius: radius.full },
  markSquare: { borderRadius: 6 },
  dot: { width: 10, height: 10, borderRadius: radius.full },
  input: {
    minHeight: 42,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: QUIZ_RADIUS.md,
    fontSize: 16,
    fontFamily: "Onest-Regular",
  },
  /* `.quiz-answer-essay-input` — min-h 280, qator 1.6 */
  essayInput: { minHeight: 280, lineHeight: 26 },
  /* `.quiz-answer-match-row` — telefonda bitta ustun, gap 4 */
  matchRow: { gap: 4 },
  matchLeft: { fontWeight: "600" },
  select: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: QUIZ_RADIUS.md,
  },
  selectOption: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    borderRadius: radius.xl,
  },
  /* `.quiz-answer-ordering li` — min-h 42, bo'shliq 0 6 0 10, gap 8 */
  orderRow: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 10,
    paddingRight: 6,
    borderWidth: 1,
    borderRadius: QUIZ_RADIUS.md,
  },
  orderIndex: { width: 22, height: 22, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  orderButton: { width: 30, height: 30, borderRadius: QUIZ_RADIUS.sm, alignItems: "center", justifyContent: "center" },
  /* `.quiz-answer-fill` — 14px, 600, qator 2.2 */
  fill: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: 4, rowGap: 4 },
  fillText: { fontSize: 14, lineHeight: 30, fontWeight: "600" },
  blank: {
    width: 110,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderBottomWidth: 2,
    borderTopLeftRadius: QUIZ_RADIUS.sm,
    borderTopRightRadius: QUIZ_RADIUS.sm,
    fontSize: 14,
    fontFamily: "Onest-SemiBold",
    textAlign: "center",
  },
});
