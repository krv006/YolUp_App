import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import type { HomeworkQuestion } from "@/shared/types";
import { DsText, dsRadius, Icon, MobileInput, useDs } from "@/shared/ui";
import { isAnswered, type AnswerDraft } from "../lib/homework-answers";

export interface QuestionsAnswerFormProps {
  questions: HomeworkQuestion[];
  value: AnswerDraft;
  onChange: (value: AnswerDraft) => void;
  disabled?: boolean;
}

/**
 * O'quvchining vazifa ichidagi savollarga javobi — veb
 * `questions-answer-form.tsx`: test (bitta yoki bir nechta variant), qisqa
 * va uzun javob. `disabled` — muddati o'tgan va kech topshirish yopiq.
 */
export function QuestionsAnswerForm({
  questions,
  value,
  onChange,
  disabled = false,
}: QuestionsAnswerFormProps) {
  const { t } = useTranslation("homework");
  const ds = useDs();
  const answered = questions.filter((question) => isAnswered(value[question.id])).length;

  return (
    <View style={styles.root}>
      <View style={styles.head}>
        <DsText v="title" style={styles.grow}>
          {t("questions.answerTitle")}
        </DsText>
        <DsText v="caption" c="ink-secondary">
          {t("questions.answered", { count: answered, total: questions.length })}
        </DsText>
      </View>
      {questions.map((question, index) => {
        const current = value[question.id];
        const picked = Array.isArray(current) ? current : [];
        const text = typeof current === "string" ? current : "";
        const test = question.type === "single" || question.type === "multiple";
        return (
          // `fieldset` — `gap-2.5 rounded-xl border border-line p-4`
          <View key={question.id} style={[styles.card, { borderColor: ds.c.line }]}>
            <View style={styles.top}>
              <DsText v="title-sm" c="brand">
                {index + 1}.
              </DsText>
              <DsText v="body" style={styles.grow}>
                {question.text}
              </DsText>
              <View style={[styles.points, { backgroundColor: ds.c.subtle }]}>
                <DsText v="caption-strong" c="ink-secondary">
                  {t("questions.pointsValue", { count: question.points })}
                </DsText>
              </View>
            </View>
            {test ? (
              <View
                accessibilityRole={question.type === "single" ? "radiogroup" : undefined}
                accessibilityLabel={t("questions.number", { n: index + 1 })}
                style={styles.options}
              >
                {question.type === "multiple" ? (
                  <DsText v="caption" c="ink-tertiary">
                    {t("questions.pickMany")}
                  </DsText>
                ) : null}
                {question.options.map((option, optionIndex) => {
                  const checked = picked.includes(optionIndex);
                  return (
                    <Pressable
                      key={optionIndex}
                      accessibilityRole={question.type === "single" ? "radio" : "checkbox"}
                      accessibilityState={{ checked, disabled }}
                      disabled={disabled}
                      onPress={() =>
                        onChange({
                          ...value,
                          [question.id]:
                            question.type === "single"
                              ? [optionIndex]
                              : checked
                                ? picked.filter((item) => item !== optionIndex)
                                : [...picked, optionIndex].sort((a, b) => a - b),
                        })
                      }
                      style={[
                        styles.option,
                        { backgroundColor: checked ? ds.c["brand-subtle"] : ds.c.subtle },
                        disabled && styles.disabled,
                      ]}
                    >
                      {question.type === "single" ? (
                        <View
                          style={[
                            styles.radio,
                            {
                              borderColor: checked ? ds.c.brand : ds.c["line-strong"],
                              backgroundColor: ds.c.surface,
                            },
                          ]}
                        >
                          {checked ? (
                            <View style={[styles.dot, { backgroundColor: ds.c.brand }]} />
                          ) : null}
                        </View>
                      ) : (
                        <View
                          style={[
                            styles.box,
                            checked
                              ? { borderColor: ds.c.brand, backgroundColor: ds.c.brand }
                              : { borderColor: ds.c["line-strong"], backgroundColor: ds.c.surface },
                          ]}
                        >
                          {checked ? (
                            <Icon name="check" size={14} color={ds.c["on-action"]} />
                          ) : null}
                        </View>
                      )}
                      <DsText v="body" style={styles.grow}>
                        {option}
                      </DsText>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <MobileInput
                accessibilityLabel={t("questions.number", { n: index + 1 })}
                editable={!disabled}
                value={text}
                placeholder={
                  question.type === "short"
                    ? t("questions.shortPlaceholder")
                    : t("questions.longPlaceholder")
                }
                maxLength={question.type === "short" ? 500 : 10000}
                multiline={question.type === "long"}
                // `textarea rows={5} py-3`
                multilineHeight={144}
                onChangeText={(next) => onChange({ ...value, [question.id]: next })}
                style={[
                  question.type === "short" ? styles.short : styles.long,
                  disabled && styles.disabled,
                ]}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  head: { flexDirection: "row", alignItems: "center", gap: 8 },
  grow: { flex: 1, minWidth: 0 },
  card: { gap: 10, padding: 16, borderWidth: 1, borderRadius: dsRadius.xl },
  top: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  /* `rounded-full bg-subtle px-2 py-0.5` */
  points: { flexShrink: 0, paddingHorizontal: 8, paddingVertical: 2, borderRadius: dsRadius.full },
  options: { gap: 6 },
  /* `min-h-11 gap-3 rounded-lg px-3.5 py-2`, tanlanganda `bg-brand-subtle` */
  option: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: dsRadius.lg,
  },
  /* `size-4.5 accent-brand` — tizim radio/checkbox o'rniga */
  radio: {
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderRadius: 9,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  box: {
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderRadius: 4,
  },
  /* `h-12 rounded-md border px-4` */
  short: { height: 48, borderWidth: 1, borderRadius: dsRadius.md },
  long: { borderWidth: 1, borderRadius: dsRadius.md },
  disabled: { opacity: 0.6 },
});
