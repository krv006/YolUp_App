import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { DsText, MobileInput, useDs } from "@/shared/ui";
import type { QuizLimitField, QuizLimitsDraft } from "../lib/quiz-limits";

export interface QuizLimitsFieldsProps {
  value: QuizLimitsDraft;
  onChange: (value: QuizLimitsDraft) => void;
  invalid: readonly QuizLimitField[];
  questionCount: number;
  hasGroups: boolean;
}

/**
 * Topshirish sozlamalari — veb `quiz-limits-fields.tsx` ning `compact`
 * varianti: vaqt (daqiqa), urinishlar va har o'quvchiga tushadigan savollar
 * soni uch ustunda; bo'sh — cheklov yo'q. Matn yoki audioga bog'langan testda
 * savollar soni o'chiq.
 */
export function QuizLimitsFields({
  value,
  onChange,
  invalid,
  questionCount,
  hasGroups,
}: QuizLimitsFieldsProps) {
  const { t } = useTranslation("quiz");
  const ds = useDs();
  const fields: Array<{ id: QuizLimitField; placeholder: string }> = [
    { id: "time", placeholder: "—" },
    { id: "attempts", placeholder: "—" },
    { id: "perAttempt", placeholder: String(questionCount) },
  ];

  return (
    <View style={styles.root}>
      <View style={styles.head}>
        <DsText v="body-sm" w="500">
          {t("limits.title")}
        </DsText>
        <DsText v="caption" c="ink-tertiary">
          {t("limits.hint")}
        </DsText>
      </View>
      {/* `grid grid-cols-3 gap-2` */}
      <View style={styles.grid}>
        {fields.map((field) => {
          const wrong = invalid.includes(field.id);
          const locked = field.id === "perAttempt" && hasGroups;
          return (
            <View key={field.id} style={styles.cell}>
              <DsText v="caption" c="ink-secondary" numberOfLines={1}>
                {t(`limits.${field.id}`)}
              </DsText>
              <MobileInput
                keyboardType="number-pad"
                editable={!locked}
                accessibilityLabel={t(`limits.${field.id}`)}
                value={locked ? "" : value[field.id]}
                placeholder={field.placeholder}
                placeholderTextColor={ds.c["ink-tertiary"]}
                style={[
                  styles.input,
                  wrong && { borderColor: ds.c.danger },
                  locked && styles.locked,
                ]}
                onChangeText={(text) => onChange({ ...value, [field.id]: text })}
              />
            </View>
          );
        })}
      </View>
      {invalid.length ? (
        <DsText v="caption" c="danger" accessibilityRole="alert">
          {invalid
            .map((field) =>
              t(`limits.range.${field}`, {
                max: field === "perAttempt" ? questionCount : undefined,
              })
            )
            .join(" · ")}
        </DsText>
      ) : null}
      {hasGroups ? (
        <DsText v="caption" c="ink-tertiary">
          {t("limits.groupedHint")}
        </DsText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  /* `gap-2.5` */
  root: { gap: 10 },
  head: { gap: 2 },
  grid: { flexDirection: "row", gap: 8 },
  /* `min-w-0 gap-1.5` */
  cell: { flex: 1, flexBasis: 0, minWidth: 0, gap: 6 },
  /* `h-12 rounded-lg px-3` */
  input: { height: 48, paddingHorizontal: 12 },
  locked: { opacity: 0.5 },
});
