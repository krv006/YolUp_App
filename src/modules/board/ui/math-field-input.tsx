import { useTranslation } from "react-i18next";
import { StyleSheet, TextInput, View } from "react-native";
import { dsRadius, dsType, useDs } from "@/shared/ui";
import { MathMarkup } from "./math-markup";

export interface MathFieldInputProps {
  value: string;
  onChange: (latex: string) => void;
}

/**
 * Formula maydoni — veb `math-field-input.tsx` (MathLive) o'rnida. MathLive
 * Web Component, RN'da yo'q: LaTeX matn sifatida yoziladi, ostida KaTeX
 * ko'rinishi (`MathMarkup`) chiqadi. Maydon uslubi vebdagi
 * `.math-field` (`min-h-[71px] rounded-xl border-[1.5px] border-brand bg-subtle`).
 */
export function MathFieldInput({ value, onChange }: MathFieldInputProps) {
  const { t } = useTranslation("board");
  const ds = useDs();
  return (
    <View style={[styles.field, { borderColor: ds.c.brand, backgroundColor: ds.c.subtle }]}>
      <TextInput
        autoFocus
        multiline
        value={value}
        placeholder="\frac{a}{b}"
        placeholderTextColor={ds.c["ink-tertiary"]}
        accessibilityLabel={t("inline.formula")}
        autoCapitalize="none"
        autoCorrect={false}
        textAlignVertical="top"
        onChangeText={onChange}
        style={[styles.input, { color: ds.c.ink }]}
      />
      {value.trim() ? <MathMarkup latex={value} size={20} framed={false} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { minHeight: 71, overflow: "hidden", paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1.5, borderRadius: dsRadius.xl },
  input: { padding: 0, fontFamily: "monospace", fontSize: dsType["body-sm"].fontSize, lineHeight: 22 },
});
