import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Chip, ChipRow, MIN_TOUCH_SIZE, radius, useTheme } from "@/shared/ui";
import { FORMULA_GROUPS } from "../lib/formula-palette";
import { MathMarkup } from "./math-field-sheet";

/**
 * Formula shablonlari palitrasi.
 *
 * Shablonlar ro'yxati ko'chirilgan `lib/formula-palette.ts` da — veb bilan
 * bir xil o'n uchta guruh.
 *
 * 🟡 VEB'DAN FARQ — PLACEHOLDER'LAR.
 *
 * Veb MathLive klaviaturasidan foydalanadi va shablonlardagi `#0` (joriy
 * tanlov) hamda `#?` (keyingi bo'sh joy) belgilarini o'sha klaviatura
 * tushunadi: bosilgach kursor avtomatik bo'sh joyga tushadi.
 *
 * Mobilda LaTeX oddiy `TextInput` da yoziladi (sabab `math-field-sheet.tsx`
 * boshida), shuning uchun bu belgilar shunchaki OLIB TASHLANADI:
 * `\frac{#0}{#?}` -> `\frac{}{}`. O'qituvchi qavslar ichini o'zi to'ldiradi.
 * Bu baribir butun buyruqni qo'lda yozishdan ancha tez.
 */

const GROUP_LABELS: Record<string, string> = {
  fraction: "Drob",
  script: "Indeks",
  radical: "Radikal",
  integral: "Integral",
  largeOperator: "Katta operator",
  bracket: "Qavs",
  function: "Funksiya",
  accent: "Diakritik",
  limit: "Limit va log",
  operator: "Operator",
  matrix: "Matritsa",
  symbol: "Belgilar",
  chemistry: "Kimyo",
};

/** MathLive bo'sh joy belgilari oddiy matn maydonida ma'noga ega emas. */
export function toPlainTemplate(insert: string): string {
  return insert.replace(/#0|#\?/g, "");
}

export function FormulaPalette({ onInsert }: { onInsert: (latex: string) => void }) {
  const { palette } = useTheme();
  const [groupId, setGroupId] = useState(FORMULA_GROUPS[0]?.id ?? "");
  const group = FORMULA_GROUPS.find((item) => item.id === groupId) ?? FORMULA_GROUPS[0];

  return (
    <View style={styles.root}>
      <ChipRow>
        {FORMULA_GROUPS.map((item) => (
          <Chip
            key={item.id}
            label={GROUP_LABELS[item.id] ?? item.id}
            selected={item.id === groupId}
            onPress={() => setGroupId(item.id)}
          />
        ))}
      </ChipRow>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.items}>
        {group?.items.map((item, index) => (
          <Pressable
            key={`${item.insert}-${index}`}
            accessibilityRole="button"
            accessibilityLabel={item.insert}
            onPress={() => onInsert(toPlainTemplate(item.insert))}
            style={({ pressed }) => [
              styles.item,
              {
                borderColor: palette.border,
                backgroundColor: pressed ? palette["primary-tint"] : palette.surface,
              },
            ]}
          >
            <MathMarkup latex={item.preview} size={16} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 8 },
  items: { gap: 8, paddingVertical: 2 },
  item: {
    minWidth: MIN_TOUCH_SIZE,
    minHeight: MIN_TOUCH_SIZE,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
  },
});
