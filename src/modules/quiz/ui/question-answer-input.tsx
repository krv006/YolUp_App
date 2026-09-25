import { Pressable, StyleSheet, View } from "react-native";
import { ArrowDown, ArrowUp, Check } from "lucide-react-native";
import type { QuizAnswerValue, QuizQuestion } from "@/shared/types";
import {
  Badge,
  Input,
  MIN_TOUCH_SIZE,
  radius,
  SelectField,
  Text,
  useTheme,
} from "@/shared/ui";
import { blankTextForDisplay } from "../lib/answer-value";

/**
 * Bitta savolning javob maydoni — sakkizta savol turi uchun.
 *
 * Veb `modules/quiz/ui/question-answer-input.tsx` ning mobil varianti.
 * Mantiq (qaysi tur qanday qiymat qaytaradi) AYNAN bir xil; farq faqat
 * boshqaruv elementlarida:
 *
 *   matching  — veb'da `<select>`, mobilda `SelectField` (to'liq ekranli ro'yxat)
 *   ordering  — veb'da ham, mobilda ham yuqori/quyi strelkalar. Sudrab
 *               ko'chirish ATAYLAB olinmadi: ro'yxat aylantiriladigan
 *               ekran ichida turadi va ikkala gesture bir-biriga xalaqit
 *               beradi. Strelka ishonchli va ekran o'quvchisi uchun ham aniq.
 *
 * MATEMATIKA HOZIRCHA ODDIY MATN. Veb `MathText` bilan LaTeX ni chizadi;
 * mobilda buning uchun KaTeX WebView kerak (doskadagi `MathMarkup`), va
 * har savol uchun alohida WebView ochish og'ir. Bu test bosqichining
 * ikkinchi qismida hal qilinadi.
 */
export interface QuestionAnswerInputProps {
  question: QuizQuestion;
  value: QuizAnswerValue;
  onChange: (value: QuizAnswerValue) => void;
}

export function QuestionAnswerInput({ question, value, onChange }: QuestionAnswerInputProps) {
  const { palette } = useTheme();

  if (value.type === "single") {
    return (
      <View style={styles.list}>
        {question.options.map((option) => (
          <Choice
            key={option.id}
            label={option.text}
            selected={value.optionId === option.id}
            shape="radio"
            onPress={() => onChange({ type: "single", optionId: option.id })}
          />
        ))}
      </View>
    );
  }

  if (value.type === "multiple") {
    return (
      <View style={styles.list}>
        {question.options.map((option) => {
          const selected = value.optionIds.includes(option.id);
          return (
            <Choice
              key={option.id}
              label={option.text}
              selected={selected}
              shape="box"
              onPress={() =>
                onChange({
                  type: "multiple",
                  optionIds: selected
                    ? value.optionIds.filter((id) => id !== option.id)
                    : [...value.optionIds, option.id],
                })
              }
            />
          );
        })}
      </View>
    );
  }

  if (value.type === "true_false") {
    return (
      <View style={styles.row}>
        {[true, false].map((option) => (
          <Choice
            key={String(option)}
            label={option ? "To'g'ri" : "Noto'g'ri"}
            selected={value.value === option}
            shape="radio"
            style={styles.half}
            onPress={() => onChange({ type: "true_false", value: option })}
          />
        ))}
      </View>
    );
  }

  if (value.type === "numeric") {
    return (
      <Input
        placeholder="Son kiriting"
        value={value.value}
        keyboardType="numbers-and-punctuation"
        onChangeText={(next) => onChange({ type: "numeric", value: next })}
      />
    );
  }

  if (value.type === "text") {
    return (
      <Input
        placeholder="Javobingizni yozing"
        value={value.value}
        multiline
        onChangeText={(next) => onChange({ type: "text", value: next })}
      />
    );
  }

  if (value.type === "matching") {
    const options = question.matchRight.map((right) => ({ value: right.id, label: right.text }));
    return (
      <View style={styles.list}>
        {question.matchLeft.map((left) => (
          <View key={left.id} style={styles.matchRow}>
            <Text style={styles.matchLeft}>{left.text || "…"}</Text>
            <SelectField
              label=""
              placeholder="Tanlang"
              value={value.pairs[left.id] ?? ""}
              options={options}
              onChange={(next) => {
                const pairs = { ...value.pairs };
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

  if (value.type === "ordering") {
    const byId = new Map(question.options.map((option) => [option.id, option]));
    // Noma'lum id'lar tashlab yuboriladi, yangi variantlar oxiriga qo'shiladi —
    // savol tahrirlangan bo'lsa ham tartib buzilmaydi.
    const known = value.order.filter((id) => byId.has(id));
    const order = [
      ...known,
      ...question.options.map((option) => option.id).filter((id) => !known.includes(id)),
    ];

    function move(from: number, to: number) {
      if (to < 0 || to >= order.length) return;
      const next = [...order];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      onChange({ type: "ordering", order: next });
    }

    return (
      <View style={styles.list}>
        {order.map((id, position) => (
          <View
            key={id}
            style={[styles.orderRow, { borderColor: palette.border, backgroundColor: palette.surface }]}
          >
            <Badge label={String(position + 1)} tone="neutral" />
            <Text style={styles.orderText}>{byId.get(id)?.text || "…"}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Yuqoriga"
              disabled={position === 0}
              onPress={() => move(position, position - 1)}
              style={styles.arrow}
            >
              <ArrowUp
                size={18}
                color={position === 0 ? palette["border-strong"] : palette["primary-text"]}
              />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Pastga"
              disabled={position === order.length - 1}
              onPress={() => move(position, position + 1)}
              style={styles.arrow}
            >
              <ArrowDown
                size={18}
                color={
                  position === order.length - 1
                    ? palette["border-strong"]
                    : palette["primary-text"]
                }
              />
            </Pressable>
          </View>
        ))}
      </View>
    );
  }

  // fill_blank
  return (
    <View style={styles.list}>
      <Text variant="caption" tone="muted">
        {blankTextForDisplay(question.text)}
      </Text>
      {value.values.map((entry, index) => (
        <Input
          key={index}
          label={`${index + 1}-bo'sh joy`}
          value={entry}
          onChangeText={(next) => {
            const values = [...value.values];
            values[index] = next;
            onChange({ type: "fill_blank", values });
          }}
        />
      ))}
    </View>
  );
}

function Choice({
  label,
  selected,
  shape,
  onPress,
  style,
}: {
  label: string;
  selected: boolean;
  shape: "radio" | "box";
  onPress: () => void;
  style?: object;
}) {
  const { palette } = useTheme();
  return (
    <Pressable
      accessibilityRole={shape === "radio" ? "radio" : "checkbox"}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        {
          borderColor: selected ? palette.primary : palette.border,
          backgroundColor: selected ? palette["primary-tint"] : palette.surface,
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.mark,
          shape === "radio" ? styles.markRound : styles.markSquare,
          { borderColor: selected ? palette.primary : palette["border-strong"] },
        ]}
      >
        {selected ? (
          shape === "radio" ? (
            <View style={[styles.dot, { backgroundColor: palette.primary }]} />
          ) : (
            <Check size={12} color={palette.primary} strokeWidth={3} />
          )
        ) : null}
      </View>
      <Text style={styles.choiceText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { gap: 8 },
  row: { flexDirection: "row", gap: 8 },
  half: { flex: 1 },
  choice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: MIN_TOUCH_SIZE,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
  },
  choiceText: { flex: 1 },
  mark: {
    width: 20,
    height: 20,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  markRound: { borderRadius: radius.full },
  markSquare: { borderRadius: 6 },
  dot: { width: 10, height: 10, borderRadius: radius.full },
  matchRow: { gap: 4 },
  matchLeft: { fontWeight: "600" },
  orderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: MIN_TOUCH_SIZE,
    paddingHorizontal: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
  },
  orderText: { flex: 1 },
  arrow: {
    width: MIN_TOUCH_SIZE,
    height: MIN_TOUCH_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
});
