import { Pressable, StyleSheet, View } from "react-native";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react-native";
import {
  Button,
  Checkbox,
  IconButton,
  Input,
  radius,
  SelectField,
  Text,
  useTheme,
} from "@/shared/ui";
import type { QuizQuestionType } from "@/shared/types";
import {
  changeDraftType,
  MAX_OPTIONS,
  optionLetter,
  QUESTION_TYPE_ORDER,
  validateDraft,
  type DraftError,
  type KeyFactory,
  type QuestionDraft,
} from "../lib/question-draft";

/**
 * Bitta savolni tahrirlash — sakkizta tur uchun.
 *
 * Veb `modules/quiz/ui/question-editor.tsx` (481 qator) ning mobil
 * varianti. BUTUN MANTIQ ko'chirilgan `lib/question-draft.ts` da:
 * qoralama yaratish, tur almashtirish, tekshirish va formaga o'tkazish.
 * Bu fayl faqat chizadi va o'sha funksiyalarni chaqiradi — shuning uchun
 * mobil bilan veb hech qachon boshqacha tekshirmaydi.
 *
 * Veb'dan farqi: matn maydoniga kursor joyiga belgi qo'yish (`insertAt`)
 * ko'chirilmadi. RN `TextInput` da tanlov holatini ishonchli o'qib
 * bo'lmaydi; bo'sh joy sintaksisi o'rniga izoh bilan tushuntiriladi.
 */

export const TYPE_LABELS: Record<QuizQuestionType, string> = {
  single: "Bitta to'g'ri javob",
  multiple: "Bir nechta to'g'ri javob",
  true_false: "To'g'ri / noto'g'ri",
  numeric: "Son kiritish",
  text: "Qisqa matn",
  matching: "Moslashtirish",
  ordering: "Tartibga solish",
  fill_blank: "Bo'sh joyni to'ldirish",
};

const ERROR_MESSAGES: Record<DraftError, string> = {
  questionTextRequired: "savol matni to'ldirilishi kerak",
  pointsInvalid: "ball 1 dan 100 gacha butun son bo'lishi kerak",
  minTwoOptions: "kamida 2 ta variant bo'lishi kerak",
  allOptionsRequired: "barcha variant matnlari to'ldirilishi kerak",
  markCorrect: "to'g'ri javobni belgilang",
  markAtLeastOneCorrect: "kamida bitta to'g'ri javobni belgilang",
  chooseTrueFalse: "to'g'ri yoki noto'g'ri ekanini belgilang",
  numericAnswerRequired: "to'g'ri sonni kiriting",
  numericAnswerInvalid: "javob son bo'lishi kerak",
  toleranceInvalid: "xatolik musbat son bo'lishi kerak",
  textAnswerRequired: "kamida bitta to'g'ri javob yozing",
  minTwoPairs: "kamida 2 ta juft bo'lishi kerak",
  allPairsRequired: "barcha juftlar to'ldirilishi kerak",
  pairsMustBeUnique: "juftlar takrorlanmasligi kerak",
  minTwoItems: "kamida 2 ta element bo'lishi kerak",
  allItemsRequired: "barcha elementlar to'ldirilishi kerak",
  blankRequired: "matnda kamida bitta {{javob}} bo'sh joy bo'lishi kerak",
  blankAnswerRequired: "har bir bo'sh joy ichiga javob yozing",
};

export function draftErrorMessage(error: DraftError): string {
  return ERROR_MESSAGES[error];
}

export interface QuestionEditorProps {
  draft: QuestionDraft;
  index: number;
  canRemove: boolean;
  newKey: KeyFactory;
  onChange: (update: (draft: QuestionDraft) => QuestionDraft) => void;
  onRemove: () => void;
}

export function QuestionEditor({
  draft,
  index,
  canRemove,
  newKey,
  onChange,
  onRemove,
}: QuestionEditorProps) {
  const { palette } = useTheme();
  // Tekshiruv yozilayotganda BEZOVTA QILMASIN: javob hali kiritilmagan
  // bo'lsa xato ko'rsatilmaydi, faqat shakl xatolari chiqadi.
  const error = validateDraft(draft, { allowMissingAnswer: true });

  const isChoice = draft.type === "single" || draft.type === "multiple";
  const isOrdering = draft.type === "ordering";

  function setOption(key: string, text: string) {
    onChange((current) => ({
      ...current,
      options: current.options.map((option) => (option.key === key ? { ...option, text } : option)),
    }));
  }

  function toggleCorrect(key: string) {
    onChange((current) => {
      if (current.type === "single") return { ...current, correctKeys: [key] };
      const has = current.correctKeys.includes(key);
      return {
        ...current,
        correctKeys: has
          ? current.correctKeys.filter((item) => item !== key)
          : [...current.correctKeys, key],
      };
    });
  }

  function moveOption(from: number, to: number) {
    onChange((current) => {
      if (to < 0 || to >= current.options.length) return current;
      const options = [...current.options];
      const [item] = options.splice(from, 1);
      options.splice(to, 0, item);
      return { ...current, options };
    });
  }

  return (
    <View style={[styles.card, { borderColor: palette.border, backgroundColor: palette.surface }]}>
      <View style={styles.head}>
        <Text variant="caption" tone="brand">
          {index + 1}-savol
        </Text>
        {canRemove ? (
          <IconButton accessibilityLabel="Savolni o'chirish" onPress={onRemove}>
                {<Trash2 size={16} color={palette["destructive-strong"]} />}
              </IconButton>
        ) : null}
      </View>

      <SelectField
        label="Savol turi"
        value={draft.type}
        options={QUESTION_TYPE_ORDER.map((type) => ({ value: type, label: TYPE_LABELS[type] }))}
        onChange={(next) => onChange((current) => changeDraftType(current, next as QuizQuestionType, newKey))}
      />

      <Input
        label="Savol matni"
        placeholder={
          draft.type === "fill_blank"
            ? "Poytaxt — {{Toshkent}}"
            : "Masalan: Kvadrat tenglama nechta ildizga ega?"
        }
        value={draft.text}
        multiline
        onChangeText={(text) => onChange((current) => ({ ...current, text }))}
      />

      {draft.type === "fill_blank" ? (
        <Text variant="caption" tone="muted">
          To'g'ri javobni ikki qavs ichida yozing: {"{{javob}}"}. Bir nechta variant bo'lsa
          vertikal chiziq bilan ajrating: {"{{Toshkent|Tashkent}}"}.
        </Text>
      ) : null}

      <Input
        label="Ball"
        value={draft.points}
        keyboardType="number-pad"
        containerStyle={styles.points}
        onChangeText={(points) => onChange((current) => ({ ...current, points }))}
      />

      {isChoice || isOrdering ? (
        <View style={styles.list}>
          <Text variant="label">{isOrdering ? "Elementlar (to'g'ri tartibda)" : "Variantlar"}</Text>
          {draft.options.map((option, position) => (
            <View key={option.key} style={styles.optionRow}>
              {isChoice ? (
                <Pressable
                  accessibilityRole={draft.type === "single" ? "radio" : "checkbox"}
                  accessibilityLabel="To'g'ri javob sifatida belgilash"
                  accessibilityState={{ selected: draft.correctKeys.includes(option.key) }}
                  onPress={() => toggleCorrect(option.key)}
                  style={[
                    styles.mark,
                    draft.type === "single" ? styles.markRound : styles.markSquare,
                    {
                      borderColor: draft.correctKeys.includes(option.key)
                        ? palette.success
                        : palette["border-strong"],
                      backgroundColor: draft.correctKeys.includes(option.key)
                        ? palette.success
                        : "transparent",
                    },
                  ]}
                />
              ) : (
                <Text variant="caption" tone="muted" style={styles.orderIndex}>
                  {position + 1}
                </Text>
              )}

              <Input
                placeholder={isOrdering ? "Element matni" : `${optionLetter(position)} varianti`}
                value={option.text}
                containerStyle={styles.grow}
                onChangeText={(text) => setOption(option.key, text)}
              />

              {isOrdering ? (
                <>
                  <IconButton accessibilityLabel="Yuqoriga" onPress={() => moveOption(position, position - 1)}>
                {<ArrowUp size={16} color={palette["muted-foreground"]} />}
              </IconButton>
                  <IconButton accessibilityLabel="Pastga" onPress={() => moveOption(position, position + 1)}>
                {<ArrowDown size={16} color={palette["muted-foreground"]} />}
              </IconButton>
                </>
              ) : null}

              {draft.options.length > 2 ? (
                <IconButton accessibilityLabel="Variantni o'chirish" onPress={() =>
                    onChange((current) => ({
                      ...current,
                      options: current.options.filter((item) => item.key !== option.key),
                      correctKeys: current.correctKeys.filter((key) => key !== option.key),
                    }))
                  }>
                {<Trash2 size={16} color={palette["muted-foreground"]} />}
              </IconButton>
              ) : null}
            </View>
          ))}

          {draft.options.length < MAX_OPTIONS ? (
            <Button
              title={isOrdering ? "Element qo'shish" : "Variant qo'shish"}
              variant="secondary"
              icon={<Plus size={14} color={palette["secondary-foreground"]} />}
              onPress={() =>
                onChange((current) => ({
                  ...current,
                  options: [...current.options, { key: newKey(), text: "" }],
                }))
              }
            />
          ) : null}
        </View>
      ) : null}

      {draft.type === "true_false" ? (
        <View style={styles.row}>
          {[true, false].map((option) => (
            <Button
              key={String(option)}
              title={option ? "To'g'ri" : "Noto'g'ri"}
              variant={draft.correctBool === option ? "primary" : "secondary"}
              style={styles.grow}
              onPress={() => onChange((current) => ({ ...current, correctBool: option }))}
            />
          ))}
        </View>
      ) : null}

      {draft.type === "numeric" ? (
        <>
          <Input
            label="To'g'ri javob (son)"
            value={draft.acceptedAnswers[0] ?? ""}
            keyboardType="numbers-and-punctuation"
            onChangeText={(value) =>
              onChange((current) => ({ ...current, acceptedAnswers: [value] }))
            }
          />
          <Input
            label="Ruxsat etilgan xatolik"
            placeholder="Masalan: 0.01 — bo'sh qoldirsa aniq moslik talab qilinadi"
            value={draft.tolerance}
            keyboardType="numbers-and-punctuation"
            onChangeText={(tolerance) => onChange((current) => ({ ...current, tolerance }))}
          />
        </>
      ) : null}

      {draft.type === "text" ? (
        <View style={styles.list}>
          <Text variant="label">Qabul qilinadigan javoblar</Text>
          {draft.acceptedAnswers.map((answer, position) => (
            <View key={position} style={styles.optionRow}>
              <Input
                placeholder="To'g'ri javob varianti"
                value={answer}
                containerStyle={styles.grow}
                onChangeText={(value) =>
                  onChange((current) => {
                    const acceptedAnswers = [...current.acceptedAnswers];
                    acceptedAnswers[position] = value;
                    return { ...current, acceptedAnswers };
                  })
                }
              />
              {draft.acceptedAnswers.length > 1 ? (
                <IconButton accessibilityLabel="Variantni o'chirish" onPress={() =>
                    onChange((current) => ({
                      ...current,
                      acceptedAnswers: current.acceptedAnswers.filter((_, i) => i !== position),
                    }))
                  }>
                {<Trash2 size={16} color={palette["muted-foreground"]} />}
              </IconButton>
              ) : null}
            </View>
          ))}
          <Button
            title="Variant qo'shish"
            variant="secondary"
            icon={<Plus size={14} color={palette["secondary-foreground"]} />}
            onPress={() =>
              onChange((current) => ({
                ...current,
                acceptedAnswers: [...current.acceptedAnswers, ""],
              }))
            }
          />
          <Checkbox
            checked={draft.caseSensitive}
            onChange={(caseSensitive) => onChange((current) => ({ ...current, caseSensitive }))}
            label="Katta-kichik harf farqlansin"
          />
        </View>
      ) : null}

      {draft.type === "matching" ? (
        <View style={styles.list}>
          <Text variant="label">Juftliklar</Text>
          {draft.pairs.map((pair, position) => (
            <View key={pair.key} style={styles.optionRow}>
              <Input
                placeholder="Chap"
                value={pair.left}
                containerStyle={styles.grow}
                onChangeText={(left) =>
                  onChange((current) => ({
                    ...current,
                    pairs: current.pairs.map((item) =>
                      item.key === pair.key ? { ...item, left } : item
                    ),
                  }))
                }
              />
              <Input
                placeholder="O'ng"
                value={pair.right}
                containerStyle={styles.grow}
                onChangeText={(right) =>
                  onChange((current) => ({
                    ...current,
                    pairs: current.pairs.map((item) =>
                      item.key === pair.key ? { ...item, right } : item
                    ),
                  }))
                }
              />
              {draft.pairs.length > 2 ? (
                <IconButton accessibilityLabel="Juftlikni o'chirish" onPress={() =>
                    onChange((current) => ({
                      ...current,
                      pairs: current.pairs.filter((_, i) => i !== position),
                    }))
                  }>
                {<Trash2 size={16} color={palette["muted-foreground"]} />}
              </IconButton>
              ) : null}
            </View>
          ))}
          <Button
            title="Juftlik qo'shish"
            variant="secondary"
            icon={<Plus size={14} color={palette["secondary-foreground"]} />}
            onPress={() =>
              onChange((current) => ({
                ...current,
                pairs: [...current.pairs, { key: newKey(), left: "", right: "" }],
              }))
            }
          />
        </View>
      ) : null}

      {error ? (
        <Text variant="caption" style={{ color: palette["destructive-strong"] }}>
          {draftErrorMessage(error)}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 10,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
  },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  list: { gap: 8 },
  row: { flexDirection: "row", gap: 8 },
  grow: { flex: 1 },
  points: { width: 110 },
  optionRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  orderIndex: { width: 18, textAlign: "center" },
  mark: {
    width: 22,
    height: 22,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 22,
  },
  markRound: { borderRadius: radius.full },
  markSquare: { borderRadius: 6 },
});
