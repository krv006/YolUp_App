import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import type { HomeworkQuestionType } from "@/shared/types";
import {
  CheckboxMark,
  DsText,
  dsRadius,
  Icon,
  MobileInput,
  MobilePickerField,
  useDs,
  type IconName,
} from "@/shared/ui";
import {
  changeType,
  emptyQuestion,
  isTestQuestion,
  MAX_OPTIONS,
  MAX_POINTS,
  MAX_QUESTIONS,
  questionIssue,
  removeOption,
  toggleCorrect,
  totalPoints,
  type DraftQuestion,
} from "../lib/homework-questions";

const TYPES: HomeworkQuestionType[] = ["single", "multiple", "short", "long"];

export interface QuestionsEditorProps {
  value: DraftQuestion[];
  onChange: (value: DraftQuestion[]) => void;
  locked?: boolean;
  showIssues?: boolean;
}

/**
 * Vazifa savollari muharriri — veb `questions-editor.tsx`: test (bitta yoki
 * bir nechta to'g'ri javob), qisqa va uzun javobli savollar, ball, tartib
 * (yuqoriga/pastga), o'chirish. Topshiriq tushgan vazifada qulflanadi.
 * Savol turi brauzer ro'yxati o'rniga `MobilePickerField` (pastki oyna).
 */
export function QuestionsEditor({
  value,
  onChange,
  locked = false,
  showIssues = false,
}: QuestionsEditorProps) {
  const { t } = useTranslation("homework");
  const ds = useDs();

  function update(index: number, next: DraftQuestion) {
    onChange(value.map((item, position) => (position === index ? next : item)));
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <View style={styles.root}>
      <DsText v="body-xs" c="ink-secondary">
        {t("questions.title")}
        {value.length
          ? ` · ${t("questions.summary", { count: value.length, points: totalPoints(value) })}`
          : ""}
      </DsText>

      {locked ? (
        <DsText
          v="body-sm"
          c="accent-saffron-fg"
          style={[styles.locked, { backgroundColor: ds.c["accent-saffron-bg"] }]}
        >
          {t("questions.locked")}
        </DsText>
      ) : null}

      {value.map((question, index) => {
        const issue = showIssues ? questionIssue(question) : null;
        const test = isTestQuestion(question.type);
        return (
          // `gap-3 rounded-xl border border-line bg-subtle p-3.5`
          <View
            key={question.key}
            style={[styles.card, { borderColor: ds.c.line, backgroundColor: ds.c.subtle }]}
          >
            <View style={styles.row}>
              <DsText v="title-sm" style={styles.grow}>
                {t("questions.number", { n: index + 1 })}
              </DsText>
              <DsText v="body-xs" c="ink-secondary">
                {t("questions.points")}
              </DsText>
              <MobileInput
                surface
                invalid={issue === "points"}
                keyboardType="number-pad"
                editable={!locked}
                accessibilityLabel={t("questions.points")}
                value={Number.isFinite(question.points) ? String(question.points) : ""}
                onChangeText={(text) => {
                  const digits = text.replace(/\D/g, "").slice(0, 4);
                  update(index, {
                    ...question,
                    points: digits ? Math.min(MAX_POINTS, Number(digits)) : Number.NaN,
                  });
                }}
                style={[styles.field, styles.points]}
              />
              {!locked ? (
                <View style={styles.tools}>
                  <ToolButton
                    icon="expand-less"
                    label={t("questions.moveUp")}
                    disabled={index === 0}
                    onPress={() => move(index, -1)}
                  />
                  <ToolButton
                    icon="expand-more"
                    label={t("questions.moveDown")}
                    disabled={index === value.length - 1}
                    onPress={() => move(index, 1)}
                  />
                  <ToolButton
                    icon="delete"
                    danger
                    label={t("questions.remove", { n: index + 1 })}
                    onPress={() => onChange(value.filter((_, position) => position !== index))}
                  />
                </View>
              ) : null}
            </View>

            {locked ? (
              <View style={[styles.type, { backgroundColor: ds.c.surface }]}>
                <DsText v="body-sm" numberOfLines={1}>
                  {t(`questions.types.${question.type}`)}
                </DsText>
              </View>
            ) : (
              <MobilePickerField
                type="select"
                surface
                value={question.type}
                display={t(`questions.types.${question.type}`)}
                ariaLabel={t("questions.typeLabel")}
                options={TYPES.map((type) => ({
                  value: type,
                  label: t(`questions.types.${type}`),
                }))}
                onChange={(type) =>
                  update(index, changeType(question, type as HomeworkQuestionType))
                }
              />
            )}

            <MobileInput
              surface
              multiline
              multilineHeight={72}
              invalid={issue === "text"}
              maxLength={5000}
              editable={!locked}
              value={question.text}
              placeholder={t("questions.textPlaceholder")}
              onChangeText={(text) => update(index, { ...question, text })}
              style={[styles.field, styles.text]}
            />

            {test ? (
              <View style={styles.options}>
                <DsText v="caption" c="ink-tertiary">
                  {question.type === "single" ? t("questions.markOne") : t("questions.markMany")}
                </DsText>
                {question.options.map((option, optionIndex) => {
                  const correct = question.correct.includes(optionIndex);
                  return (
                    <View key={optionIndex} style={styles.option}>
                      <Pressable
                        accessibilityRole={question.type === "single" ? "radio" : "checkbox"}
                        accessibilityState={{ checked: correct, disabled: locked }}
                        accessibilityLabel={t("questions.markCorrect", { n: optionIndex + 1 })}
                        disabled={locked}
                        onPress={() => update(index, toggleCorrect(question, optionIndex))}
                        style={[
                          styles.mark,
                          { backgroundColor: correct ? ds.c["success-bg"] : ds.c.surface },
                        ]}
                      >
                        {question.type === "single" ? (
                          <Icon
                            name={correct ? "check-circle" : "radio-unchecked"}
                            size={20}
                            color={correct ? ds.c["success-fg"] : ds.c["icon-secondary"]}
                          />
                        ) : (
                          <CheckboxMark checked={correct} />
                        )}
                      </Pressable>
                      <View style={styles.grow}>
                        <MobileInput
                          surface
                          invalid={issue === "options" && !option.trim()}
                          maxLength={500}
                          editable={!locked}
                          value={option}
                          placeholder={t("questions.optionPlaceholder", { n: optionIndex + 1 })}
                          onChangeText={(text) =>
                            update(index, {
                              ...question,
                              options: question.options.map((item, position) =>
                                position === optionIndex ? text : item
                              ),
                            })
                          }
                          style={[styles.field, styles.optionInput]}
                        />
                      </View>
                      {!locked && question.options.length > 2 ? (
                        <ToolButton
                          icon="close"
                          iconSize={16}
                          label={t("questions.removeOption", { n: optionIndex + 1 })}
                          onPress={() => update(index, removeOption(question, optionIndex))}
                        />
                      ) : null}
                    </View>
                  );
                })}
                {!locked && question.options.length < MAX_OPTIONS ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      update(index, { ...question, options: [...question.options, ""] })
                    }
                    style={({ pressed }) => [
                      styles.addOption,
                      pressed && { backgroundColor: ds.c["brand-subtle"] },
                    ]}
                  >
                    <Icon name="add" size={16} color={ds.c.brand} />
                    <DsText v="caption-strong" c="brand">
                      {t("questions.addOption")}
                    </DsText>
                  </Pressable>
                ) : null}
              </View>
            ) : (
              <DsText v="caption" c="ink-tertiary">
                {question.type === "short" ? t("questions.shortHint") : t("questions.longHint")}
              </DsText>
            )}

            {issue ? (
              <DsText v="caption" c="danger">
                {t(`questions.issues.${issue}`)}
              </DsText>
            ) : null}
          </View>
        );
      })}

      {!locked && value.length < MAX_QUESTIONS ? (
        // `h-11 rounded-xl border border-dashed border-line-strong text-button text-brand`
        <Pressable
          accessibilityRole="button"
          onPress={() => onChange([...value, emptyQuestion(value.at(-1)?.type ?? "single")])}
          style={({ pressed }) => [
            styles.add,
            {
              borderColor: pressed ? ds.c.brand : ds.c["line-strong"],
              backgroundColor: pressed ? ds.c["brand-subtle"] : "transparent",
            },
          ]}
        >
          <Icon name="add" size={18} color={ds.c.brand} />
          <DsText v="button" c="brand">
            {t("questions.add")}
          </DsText>
        </Pressable>
      ) : null}
    </View>
  );
}

/** `size-8 rounded-full text-ink-secondary` — savol va variant tugmalari. */
function ToolButton({
  icon,
  iconSize = 18,
  label,
  danger = false,
  disabled = false,
  onPress,
}: {
  icon: IconName;
  iconSize?: number;
  label: string;
  danger?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const ds = useDs();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tool,
        pressed && { backgroundColor: danger ? ds.c["danger-bg"] : ds.c.surface },
        disabled && styles.disabled,
      ]}
    >
      {({ pressed }) => (
        <Icon
          name={icon}
          size={iconSize}
          color={danger && pressed ? ds.c.danger : ds.c["ink-secondary"]}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  grow: { flex: 1, minWidth: 0 },
  disabled: { opacity: 0.3 },
  /* `rounded-md px-4 py-3` */
  locked: {
    overflow: "hidden",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: dsRadius.md,
  },
  card: { gap: 12, padding: 14, borderWidth: 1, borderRadius: dsRadius.xl },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  /* `FIELD`: `rounded-md border px-3.5` */
  field: { borderWidth: 1, borderRadius: dsRadius.md, paddingHorizontal: 14 },
  /* `h-9 w-16 text-center` */
  points: { width: 64, height: 36, paddingHorizontal: 8, textAlign: "center" },
  text: { paddingTop: 10, paddingBottom: 10 },
  tools: { flexDirection: "row", alignItems: "center" },
  tool: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  type: { height: 40, justifyContent: "center", paddingHorizontal: 14, borderRadius: dsRadius.md },
  options: { gap: 8 },
  option: { flexDirection: "row", alignItems: "center", gap: 8 },
  mark: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  optionInput: { height: 40 },
  /* `h-9 w-fit rounded-full px-3` */
  addOption: {
    alignSelf: "flex-start",
    height: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: 18,
  },
  add: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: dsRadius.xl,
  },
});
