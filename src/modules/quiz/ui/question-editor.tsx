import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
} from "react-native";
import { ArrowDown, ArrowUp, Check, FileQuestion, Layers, Plus, Sigma, Trash2, X } from "lucide-react-native";
import type { QuizQuestionType } from "@/shared/types";
import { radius, SelectField, Text, useTheme } from "@/shared/ui";
import {
  MAX_OPTIONS,
  QUESTION_TYPE_ORDER,
  changeDraftType,
  optionLetter,
  type GroupDraft,
  type KeyFactory,
  type QuestionDraft,
} from "../lib/question-draft";
import { QUIZ_RADIUS, useQuizColors } from "./quiz-colors";

export interface QuestionEditorProps {
  draft: QuestionDraft;
  groups?: GroupDraft[];
  index: number;
  canRemove: boolean;
  newKey: KeyFactory;
  onChange: (update: (draft: QuestionDraft) => QuestionDraft) => void;
  onRemove: () => void;
}

/** Oxirgi fokuslangan maydon — formula va bo'sh joy shu yerga qo'yiladi. */
interface FocusTarget {
  value: string;
  selection: { start: number; end: number };
  apply: (value: string) => void;
}

function move<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/**
 * Bitta savol muharriri — veb `modules/quiz/ui/question-editor.tsx` porti.
 *
 * Uslublar 390px veb DOM'idan o'lchangan (`.quiz-page-*`):
 *   karta      oq, radius 16, bo'shliq 16, oraliq 12
 *   raqam      28x28 doira, `--bg-subtle`, 13/700
 *   matn       kulrang fon, radius 12, bo'shliq 10/14, 14px 600
 *   asboblar   Σ 32x32 chegarali (radius 10), o'chirish 32x32
 *   tur/ball   tanlash maydoni + "Ball" 13/700 va 56x38 son maydoni
 *   variantlar chapdan 30, oraliq 10; harf 26x26, maydon radius 12
 *   to'g'ri    harflar 28x28, 2px chegara; tanlangani yashil
 *
 * Vebdan farqi: formula oynasida MathLive va belgilar palitrasi yo'q —
 * LaTeX matn sifatida yoziladi va `$...$` ichida kursor joyiga qo'yiladi.
 */
export function QuestionEditor({
  draft,
  groups = [],
  index,
  canRemove,
  newKey,
  onChange,
  onRemove,
}: QuestionEditorProps) {
  const { t } = useTranslation("quiz");
  const { palette } = useTheme();
  const colors = useQuizColors();
  const number = index + 1;
  const focusRef = useRef<FocusTarget | null>(null);
  const textSelection = useRef({ start: draft.text.length, end: draft.text.length });
  const [formulaOpen, setFormulaOpen] = useState(false);
  const [formula, setFormula] = useState("");

  function patch(next: Partial<QuestionDraft> | ((current: QuestionDraft) => Partial<QuestionDraft>)) {
    onChange((current) => ({ ...current, ...(typeof next === "function" ? next(current) : next) }));
  }

  /** Maydon fokus va kursorini eslab qoladi (veb `remember`). */
  function track(value: string, apply: (value: string) => void): Partial<TextInputProps> {
    return {
      onFocus: () => {
        focusRef.current = { value, selection: { start: value.length, end: value.length }, apply };
      },
      onSelectionChange: (event) => {
        focusRef.current = { value, selection: event.nativeEvent.selection, apply };
      },
    };
  }

  function insertSnippet(snippet: string) {
    const target = focusRef.current ?? {
      value: draft.text,
      selection: textSelection.current,
      apply: (text: string) => patch({ text }),
    };
    const { start, end } = target.selection;
    target.apply(`${target.value.slice(0, start)}${snippet}${target.value.slice(end)}`);
  }

  function applyFormula() {
    const latex = formula.trim();
    if (latex) insertSnippet(`$${latex}$`);
    setFormula("");
    setFormulaOpen(false);
  }

  function updateOption(key: string, text: string) {
    patch((current) => ({
      options: current.options.map((option) => (option.key === key ? { ...option, text } : option)),
    }));
  }

  function removeOption(key: string) {
    patch((current) => ({
      options: current.options.filter((option) => option.key !== key),
      correctKeys: current.correctKeys.filter((correctKey) => correctKey !== key),
    }));
  }

  function toggleCorrect(key: string) {
    if (draft.type === "single") {
      patch({ correctKeys: [key] });
      return;
    }
    patch({
      correctKeys: draft.correctKeys.includes(key)
        ? draft.correctKeys.filter((correctKey) => correctKey !== key)
        : [...draft.correctKeys, key],
    });
  }

  function updateAnswer(position: number, value: string) {
    patch((current) => ({
      acceptedAnswers: current.acceptedAnswers.map((answer, item) => (item === position ? value : answer)),
    }));
  }

  function updatePair(key: string, side: "left" | "right", value: string) {
    patch((current) => ({
      pairs: current.pairs.map((pair) => (pair.key === key ? { ...pair, [side]: value } : pair)),
    }));
  }

  const blankSyntax = {
    syntax: `{{${t("editor.blankWord")}}}`,
    example: `{{${t("editor.blankExample")}}}`,
    sample: "{{100}}",
    interpolation: { escapeValue: false },
  };
  const typeOptions = QUESTION_TYPE_ORDER.map((type) => ({ value: type, label: t(`types.${type}`) }));
  const isChoice = draft.type === "single" || draft.type === "multiple";
  const iconColor = palette["subtle-foreground"];

  return (
    <View style={[styles.card, { backgroundColor: palette.surface }]}>
      <View style={styles.head}>
        <View style={[styles.number, { backgroundColor: palette["surface-subtle"] }]}>
          <Text variant="caption" style={[styles.numberText, { color: palette["muted-foreground"] }]}>
            {number}.
          </Text>
        </View>
        <Field
          multiline
          value={draft.text}
          onChangeText={(text) => patch({ text })}
          onSelectionChange={(event) => {
            textSelection.current = event.nativeEvent.selection;
            focusRef.current = {
              value: draft.text,
              selection: event.nativeEvent.selection,
              apply: (text) => patch({ text }),
            };
          }}
          placeholder={
            draft.type === "fill_blank"
              ? t("editor.fillBlankPlaceholder", blankSyntax)
              : t("createDialog.questionTextPlaceholder")
          }
          baseStyle={[styles.questionText, { color: colors.foreground }]}
          idleColor={palette["surface-subtle"]}
          borderIdle="transparent"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("editor.formulaAria")}
          accessibilityState={{ expanded: formulaOpen }}
          onPress={() => setFormulaOpen((current) => !current)}
          style={[
            styles.tool,
            formulaOpen
              ? { borderColor: palette.primary, backgroundColor: palette["primary-tint"] }
              : { borderColor: colors.border },
          ]}
        >
          <Sigma size={16} color={formulaOpen ? palette["primary-text"] : colors.muted} />
        </Pressable>
        {canRemove ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("createDialog.removeQuestionAria", { number })}
            onPress={onRemove}
            style={styles.tool}
          >
            <Trash2 size={15} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>

      {formulaOpen ? (
        <View style={[styles.formula, { borderColor: palette.border, backgroundColor: colors.surfaceTint }]}>
          <Field
            value={formula}
            onChangeText={setFormula}
            placeholder="x^2+\frac{1}{2}"
            autoCapitalize="none"
            baseStyle={[styles.optionInput, { color: colors.foreground }]}
            idleColor={palette.surface}
            borderIdle={palette.input}
          />
          <View style={styles.formulaActions}>
            <Text variant="caption" style={[styles.grow, { color: colors.muted }]}>
              {t("editor.formulaHint")}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("editor.formulaCancel")}
              onPress={() => {
                setFormula("");
                setFormulaOpen(false);
              }}
              style={[styles.formulaButton, { borderColor: palette.border }]}
            >
              <X size={15} color={colors.muted} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("editor.formulaInsert")}
              disabled={!formula.trim()}
              onPress={applyFormula}
              style={[
                styles.formulaButton,
                { backgroundColor: palette.primary, borderColor: palette.primary },
                !formula.trim() && styles.disabled,
              ]}
            >
              <Check size={15} color={palette["primary-foreground"]} />
            </Pressable>
          </View>
        </View>
      ) : null}

      <View style={styles.meta}>
        <SelectField
          label={t("editor.typeLabel")}
          hideLabel
          icon={<FileQuestion size={17} color={iconColor} />}
          value={draft.type}
          onChange={(value) =>
            onChange((current) => changeDraftType(current, value as QuizQuestionType, newKey))
          }
          options={typeOptions}
          style={styles.grow}
        />
        {groups.length ? (
          <SelectField
            label={t("groups.questionGroupLabel")}
            hideLabel
            icon={<Layers size={17} color={iconColor} />}
            value={draft.groupKey ?? ""}
            onChange={(value) => patch({ groupKey: value || null })}
            options={[
              { value: "", label: t("groups.noGroup") },
              ...groups.map((group, groupIndex) => ({
                value: group.key,
                label: group.title.trim() || t("groups.titlePlaceholder", { number: groupIndex + 1 }),
              })),
            ]}
            style={styles.grow}
          />
        ) : null}
        <View style={styles.points}>
          <Text variant="caption" style={[styles.smallStrong, { color: colors.muted }]}>
            {t("editor.pointsLabel")}
          </Text>
          <TextInput
            value={draft.points}
            keyboardType="number-pad"
            accessibilityLabel={t("editor.pointsAria", { number })}
            onChangeText={(points) => patch({ points })}
            style={[
              styles.pointsInput,
              { borderColor: colors.borderStrong, backgroundColor: palette.surface, color: colors.foreground },
            ]}
          />
        </View>
      </View>

      {isChoice ? (
        <>
          <View style={styles.options}>
            {draft.options.map((option, optionIndex) => {
              const correct = draft.correctKeys.includes(option.key);
              const letter = optionLetter(optionIndex);
              return (
                <View key={option.key} style={styles.optionRow}>
                  <View
                    style={[
                      styles.letter,
                      { backgroundColor: correct ? colors.statusSuccess : palette["surface-subtle"] },
                    ]}
                  >
                    <Text
                      variant="caption"
                      style={[styles.heavy, { color: correct ? "#ffffff" : palette["muted-foreground"] }]}
                    >
                      {letter}
                    </Text>
                  </View>
                  <Field
                    value={option.text}
                    onChangeText={(text) => updateOption(option.key, text)}
                    {...track(option.text, (text) => updateOption(option.key, text))}
                    placeholder={t("createDialog.optionPlaceholderLettered", { letter })}
                    baseStyle={[styles.optionInput, { color: colors.foreground }]}
                    idleColor={palette.surface}
                    borderIdle={correct ? colors.statusSuccess : palette.input}
                  />
                  {draft.options.length > 2 ? (
                    <RowButton
                      label={t("editor.removeOptionAria", { letter })}
                      onPress={() => removeOption(option.key)}
                    >
                      <X size={14} color={colors.muted} />
                    </RowButton>
                  ) : null}
                </View>
              );
            })}
            {draft.options.length < MAX_OPTIONS ? (
              <AddRow
                label={t("editor.addOption")}
                onPress={() => patch({ options: [...draft.options, { key: newKey(), text: "" }] })}
              />
            ) : null}
          </View>

          <View
            style={styles.answerRow}
            accessibilityRole={draft.type === "single" ? "radiogroup" : undefined}
            accessibilityLabel={t("createDialog.correctAnswerGroupAria", { number })}
          >
            <Text variant="caption" style={[styles.answerLabel, { color: colors.muted }]}>
              {draft.type === "single" ? t("createDialog.correctAnswerLabel") : t("editor.correctAnswersLabel")}
            </Text>
            {draft.options.map((option, optionIndex) => {
              const active = draft.correctKeys.includes(option.key);
              return (
                <Pressable
                  key={option.key}
                  accessibilityRole={draft.type === "single" ? "radio" : "checkbox"}
                  accessibilityState={{ checked: active }}
                  accessibilityLabel={`${t("createDialog.markCorrectAria")}: ${optionLetter(optionIndex)}`}
                  onPress={() => toggleCorrect(option.key)}
                  style={[
                    styles.answerLetter,
                    draft.type === "multiple" && styles.square,
                    active
                      ? { borderColor: colors.success, backgroundColor: colors.success }
                      : { borderColor: colors.borderStrong },
                  ]}
                >
                  <Text
                    variant="caption"
                    style={[styles.answerLetterText, { color: active ? "#ffffff" : colors.muted }]}
                  >
                    {optionLetter(optionIndex)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}

      {draft.type === "true_false" ? (
        <View
          style={styles.answerRow}
          accessibilityRole="radiogroup"
          accessibilityLabel={t("createDialog.correctAnswerGroupAria", { number })}
        >
          <Text variant="caption" style={[styles.answerLabel, { color: colors.muted }]}>
            {t("createDialog.correctAnswerLabel")}
          </Text>
          {[true, false].map((value) => {
            const active = draft.correctBool === value;
            return (
              <Pressable
                key={String(value)}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                onPress={() => patch({ correctBool: value })}
                style={[
                  styles.chip,
                  active
                    ? { borderColor: colors.success, backgroundColor: colors.success }
                    : { borderColor: colors.borderStrong },
                ]}
              >
                <Text variant="caption" style={[styles.answerLetterText, { color: active ? "#ffffff" : colors.muted }]}>
                  {value ? t("answer.true") : t("answer.false")}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {draft.type === "essay" ? (
        <View style={styles.options}>
          <View style={styles.inlineField}>
            <Text variant="caption" style={[styles.smallStrong, { color: colors.muted }]}>
              {t("editor.minWordsLabel")}
            </Text>
            <UnderlineInput
              value={draft.minWords}
              keyboardType="number-pad"
              onChangeText={(minWords) => patch({ minWords })}
            />
          </View>
          <Hint>{t("editor.essayHint")}</Hint>
        </View>
      ) : null}

      {draft.type === "numeric" || draft.type === "text" ? (
        <View style={styles.options}>
          <Text variant="caption" style={[styles.smallStrong, { color: colors.muted }]}>
            {t("editor.acceptedAnswersLabel")}
          </Text>
          {draft.acceptedAnswers.map((answer, answerIndex) => (
            <View key={answerIndex} style={styles.optionRow}>
              <View style={[styles.letter, { backgroundColor: palette["surface-subtle"] }]}>
                <Text variant="caption" style={[styles.heavy, { color: palette["muted-foreground"] }]}>
                  {answerIndex + 1})
                </Text>
              </View>
              <Field
                value={answer}
                keyboardType={draft.type === "numeric" ? "numbers-and-punctuation" : undefined}
                onChangeText={(value) => updateAnswer(answerIndex, value)}
                placeholder={draft.type === "numeric" ? t("editor.numericPlaceholder") : t("editor.textPlaceholder")}
                baseStyle={[styles.optionInput, { color: colors.foreground }]}
                idleColor={palette.surface}
                borderIdle={palette.input}
              />
              {draft.acceptedAnswers.length > 1 ? (
                <RowButton
                  label={t("editor.removeAnswerAria", { number: answerIndex + 1 })}
                  onPress={() =>
                    patch({ acceptedAnswers: draft.acceptedAnswers.filter((_, item) => item !== answerIndex) })
                  }
                >
                  <X size={14} color={colors.muted} />
                </RowButton>
              ) : null}
            </View>
          ))}
          {draft.acceptedAnswers.length < MAX_OPTIONS ? (
            <AddRow
              label={t("editor.addAnswerVariant")}
              onPress={() => patch({ acceptedAnswers: [...draft.acceptedAnswers, ""] })}
            />
          ) : null}
          {draft.type === "numeric" ? (
            <View style={styles.inlineField}>
              <Text variant="caption" style={[styles.smallStrong, { color: colors.muted }]}>
                {t("editor.toleranceLabel")}
              </Text>
              <UnderlineInput
                value={draft.tolerance}
                keyboardType="numbers-and-punctuation"
                placeholder="0"
                onChangeText={(tolerance) => patch({ tolerance })}
              />
            </View>
          ) : (
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: draft.caseSensitive }}
              onPress={() => patch({ caseSensitive: !draft.caseSensitive })}
              style={styles.check}
            >
              <View
                style={[
                  styles.checkBox,
                  draft.caseSensitive
                    ? { backgroundColor: palette.primary, borderColor: palette.primary }
                    : { borderColor: colors.borderStrong },
                ]}
              >
                {draft.caseSensitive ? <Check size={11} color="#ffffff" strokeWidth={3} /> : null}
              </View>
              <Text variant="caption" style={[styles.checkText, { color: colors.foreground }]}>
                {t("editor.caseSensitive")}
              </Text>
            </Pressable>
          )}
          <Hint>{draft.type === "numeric" ? t("editor.numericHint") : t("editor.textHint")}</Hint>
        </View>
      ) : null}

      {draft.type === "matching" ? (
        <View style={styles.options}>
          <Hint>{t("editor.matchingHint")}</Hint>
          {draft.pairs.map((pair, pairIndex) => (
            <View key={pair.key} style={styles.optionRow}>
              <View style={[styles.letter, { backgroundColor: palette["surface-subtle"] }]}>
                <Text variant="caption" style={[styles.heavy, { color: palette["muted-foreground"] }]}>
                  {pairIndex + 1})
                </Text>
              </View>
              <UnderlineInput
                grow
                value={pair.left}
                onChangeText={(value) => updatePair(pair.key, "left", value)}
                {...track(pair.left, (value) => updatePair(pair.key, "left", value))}
                placeholder={t("editor.pairLeftPlaceholder")}
              />
              <Text variant="label" style={[styles.heavy, { color: colors.muted }]}>
                ↔
              </Text>
              <UnderlineInput
                grow
                value={pair.right}
                onChangeText={(value) => updatePair(pair.key, "right", value)}
                {...track(pair.right, (value) => updatePair(pair.key, "right", value))}
                placeholder={t("editor.pairRightPlaceholder")}
              />
              {draft.pairs.length > 2 ? (
                <RowButton
                  label={t("editor.removePairAria", { number: pairIndex + 1 })}
                  onPress={() => patch({ pairs: draft.pairs.filter((item) => item.key !== pair.key) })}
                >
                  <X size={14} color={colors.muted} />
                </RowButton>
              ) : null}
            </View>
          ))}
          {draft.pairs.length < MAX_OPTIONS ? (
            <AddRow
              label={t("editor.addPair")}
              onPress={() => patch({ pairs: [...draft.pairs, { key: newKey(), left: "", right: "" }] })}
            />
          ) : null}
        </View>
      ) : null}

      {draft.type === "ordering" ? (
        <View style={styles.options}>
          <Hint>{t("editor.orderingHint")}</Hint>
          {draft.options.map((option, optionIndex) => (
            <View key={option.key} style={styles.optionRow}>
              <View style={[styles.letter, { backgroundColor: palette["surface-subtle"] }]}>
                <Text variant="caption" style={[styles.heavy, { color: palette["muted-foreground"] }]}>
                  {optionIndex + 1})
                </Text>
              </View>
              <Field
                value={option.text}
                onChangeText={(text) => updateOption(option.key, text)}
                {...track(option.text, (text) => updateOption(option.key, text))}
                placeholder={t("editor.itemPlaceholder", { number: optionIndex + 1 })}
                baseStyle={[styles.optionInput, { color: colors.foreground }]}
                idleColor={palette.surface}
                borderIdle={palette.input}
              />
              <RowButton
                label={t("editor.moveUpAria")}
                disabled={optionIndex === 0}
                onPress={() => patch({ options: move(draft.options, optionIndex, optionIndex - 1) })}
              >
                <ArrowUp size={14} color={colors.muted} />
              </RowButton>
              <RowButton
                label={t("editor.moveDownAria")}
                disabled={optionIndex === draft.options.length - 1}
                onPress={() => patch({ options: move(draft.options, optionIndex, optionIndex + 1) })}
              >
                <ArrowDown size={14} color={colors.muted} />
              </RowButton>
              {draft.options.length > 2 ? (
                <RowButton
                  label={t("editor.removeItemAria", { number: optionIndex + 1 })}
                  onPress={() => removeOption(option.key)}
                >
                  <X size={14} color={colors.muted} />
                </RowButton>
              ) : null}
            </View>
          ))}
          {draft.options.length < MAX_OPTIONS ? (
            <AddRow
              label={t("editor.addItem")}
              onPress={() => patch({ options: [...draft.options, { key: newKey(), text: "" }] })}
            />
          ) : null}
        </View>
      ) : null}

      {draft.type === "fill_blank" ? (
        <View style={styles.options}>
          <Hint>{t("editor.fillBlankHint", blankSyntax)}</Hint>
          <AddRow
            label={t("editor.addBlank")}
            onPress={() => {
              focusRef.current = {
                value: draft.text,
                selection: textSelection.current,
                apply: (text) => patch({ text }),
              };
              insertSnippet("{{}}");
            }}
          />
        </View>
      ) : null}
    </View>
  );
}

/** Fokusda chegarasi ko'k bo'ladigan matn maydoni. */
function Field({
  baseStyle,
  idleColor,
  borderIdle,
  multiline = false,
  ...rest
}: TextInputProps & {
  baseStyle: StyleProp<TextStyle>;
  /** Tinch holatdagi fon; fokusda oq bo'ladi. */
  idleColor: string;
  borderIdle: string;
}) {
  const { palette } = useTheme();
  const colors = useQuizColors();
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      {...rest}
      multiline={multiline}
      scrollEnabled={false}
      textAlignVertical={multiline ? "top" : "center"}
      placeholderTextColor={colors.muted}
      onFocus={(event) => {
        setFocused(true);
        rest.onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        rest.onBlur?.(event);
      }}
      style={[
        styles.field,
        baseStyle,
        {
          backgroundColor: focused ? palette.surface : idleColor,
          borderColor: focused ? palette.primary : borderIdle,
        },
      ]}
    />
  );
}

/** `.quiz-page-inline-field input` / `.quiz-page-pair input` — pastki chiziqli. */
function UnderlineInput({ grow = false, ...rest }: TextInputProps & { grow?: boolean }) {
  const { palette } = useTheme();
  const colors = useQuizColors();
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      {...rest}
      placeholderTextColor={colors.muted}
      onFocus={(event) => {
        setFocused(true);
        rest.onFocus?.(event);
      }}
      onBlur={() => setFocused(false)}
      style={[
        styles.underline,
        grow ? styles.grow : styles.underlineFixed,
        { borderBottomColor: focused ? palette.primary : colors.borderStrong, color: colors.foreground },
      ]}
    />
  );
}

/** `.quiz-page-row-remove` — 28x28, radius 10. */
function RowButton({
  label,
  onPress,
  disabled = false,
  children,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={[styles.rowButton, disabled && styles.disabled]}
    >
      {children}
    </Pressable>
  );
}

/** `.quiz-page-add-row` — h32, bo'shliq 0 10, 13/700 action. */
function AddRow({ label, onPress }: { label: string; onPress: () => void }) {
  const { palette } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.addRow, pressed && { backgroundColor: palette["primary-tint"] }]}
    >
      <Plus size={14} color={palette["primary-text"]} />
      <Text variant="caption" style={[styles.smallStrong, { color: palette["primary-text"] }]}>
        {label}
      </Text>
    </Pressable>
  );
}

/** `.quiz-page-hint` — 12px, qator 1.45. */
function Hint({ children }: { children: string }) {
  const colors = useQuizColors();
  return (
    <Text variant="caption" style={[styles.hint, { color: colors.muted }]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  disabled: { opacity: 0.35 },
  heavy: { fontWeight: "700" },
  smallStrong: { fontSize: 13, lineHeight: 20, fontWeight: "700" },

  card: { gap: 12, padding: 16, borderRadius: 16 },
  head: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  number: { width: 28, height: 28, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  numberText: { fontSize: 13, lineHeight: 20, fontWeight: "700" },
  field: { borderWidth: 1 },
  /* `.quiz-page-question-text` — radius 12, 10/14, 14px 600 */
  questionText: {
    flex: 1,
    minWidth: 0,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 14,
    lineHeight: 19,
    fontFamily: "Onest-SemiBold",
  },
  tool: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: QUIZ_RADIUS.sm,
    alignItems: "center",
    justifyContent: "center",
  },

  /* `.quiz-formula-box` — telefonda chapdan surilmaydi */
  formula: { gap: 8, padding: 10, borderWidth: 1, borderRadius: QUIZ_RADIUS.md },
  formulaActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  formulaButton: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderRadius: QUIZ_RADIUS.sm,
    alignItems: "center",
    justifyContent: "center",
  },

  /* `.quiz-page-question-meta` — gap 8 */
  meta: { flexDirection: "row", alignItems: "center", gap: 8 },
  points: { flexDirection: "row", alignItems: "center", gap: 6 },
  pointsInput: {
    width: 56,
    height: 38,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderRadius: QUIZ_RADIUS.sm,
    fontSize: 13,
    fontFamily: "Onest-SemiBold",
    textAlign: "center",
  },

  /* `.quiz-page-options` — chapdan 30, gap 10 */
  options: { gap: 10, paddingLeft: 30 },
  optionRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  letter: { width: 26, height: 26, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  /* `.quiz-page-option input` — radius 12, 10/14, 14px */
  optionInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 43,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Onest-Regular",
  },
  rowButton: { width: 28, height: 28, borderRadius: QUIZ_RADIUS.sm, alignItems: "center", justifyContent: "center" },
  addRow: {
    alignSelf: "flex-start",
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    borderRadius: QUIZ_RADIUS.sm,
  },

  /* `.quiz-page-answer-row` — chapdan 30, tepadan 4, gap 8 */
  answerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
    paddingLeft: 30,
  },
  answerLabel: { marginRight: 4, fontSize: 13, lineHeight: 20, fontWeight: "700" },
  answerLetter: {
    width: 28,
    height: 28,
    borderWidth: 2,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  square: { borderRadius: QUIZ_RADIUS.sm },
  answerLetterText: { fontSize: 13, lineHeight: 18, fontWeight: "700" },
  /* `.quiz-page-answer-chip` */
  chip: { minHeight: 32, justifyContent: "center", paddingHorizontal: 14, borderWidth: 2, borderRadius: radius.full },

  inlineField: { flexDirection: "row", alignItems: "center", gap: 10 },
  underline: {
    borderBottomWidth: 1,
    paddingHorizontal: 2,
    paddingVertical: 5,
    fontSize: 14,
    fontFamily: "Onest-Regular",
  },
  underlineFixed: { width: 110 },
  check: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start" },
  checkBox: { width: 16, height: 16, borderWidth: 1.5, borderRadius: 4, alignItems: "center", justifyContent: "center" },
  checkText: { fontSize: 13, lineHeight: 20 },
  hint: { lineHeight: 17 },
});
