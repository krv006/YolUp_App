import { useRef, useState, type ReactNode, type RefObject } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View, type NativeSyntheticEvent, type TextInput, type TextInputSelectionChangeEventData } from "react-native";
import { FormulaPalette, MathFieldInput } from "@/modules/board";
import { MathText } from "@/modules/quiz";
import { DsText, dsRadius, Icon, MobileButton, Sheet, useDs } from "@/shared/ui";
import { formulaSnippet, insertAt } from "../lib/insert-formula";

/** Matn maydoniga beriladigan bog'lamalar: kursor joyi kuzatiladi. */
export interface FormulaFieldBind {
  ref: RefObject<TextInput | null>;
  onSelectionChange: (event: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => void;
}

export interface FormulaFieldProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  /** Maydonning `maxLength` i — formula qo'shilgach oshib ketmasin. */
  maxLength?: number;
  /** Matn maydonining o'zi (`MobileInput` yoki `TextInput`) — `bind` uzatiladi. */
  children: (bind: FormulaFieldBind) => ReactNode;
}

/**
 * Javob maydoni + "Formula" tugmasi — veb `formula-field.tsx`: tugma
 * shablonlar oynasini ochadi, tayyor formula `$latex$` ko'rinishida kursor
 * turgan joyga qo'shiladi; matnda formula bo'lsa ostida chizilgan ko'rinishi.
 *
 * 🟡 Vebdan farqi: maydonning o'zi `children` orqali beriladi (mobilda
 * `MobileInput` va oddiy `TextInput` ikkalasi ham ishlatiladi); MathLive
 * o'rniga doskadagi `MathFieldInput` (LaTeX matn + KaTeX ko'rinishi).
 */
export function FormulaField({ value, onValueChange, disabled = false, maxLength, children }: FormulaFieldProps) {
  const { t } = useTranslation("homework");
  const ds = useDs();
  const fieldRef = useRef<TextInput | null>(null);
  const selection = useRef<{ start: number; end: number } | null>(null);
  const [open, setOpen] = useState(false);
  const hasFormula = /\$[^$]+\$/.test(value);

  function insert(snippet: string) {
    const caret = selection.current ?? { start: value.length, end: value.length };
    const next = insertAt(value, snippet, caret.start, caret.end);
    if (maxLength && next.value.length > maxLength) return false;
    onValueChange(next.value);
    selection.current = { start: next.caret, end: next.caret };
    return true;
  }

  return (
    <View style={styles.root}>
      {children({
        ref: fieldRef,
        onSelectionChange: (event) => {
          selection.current = event.nativeEvent.selection;
        },
      })}
      {disabled ? null : (
        <View style={styles.row}>
          {/* `h-8 gap-1.5 rounded-full bg-brand-subtle px-3 text-caption-strong text-brand` */}
          <Pressable
            accessibilityRole="button"
            onPress={() => setOpen(true)}
            style={({ pressed }) => [styles.button, { backgroundColor: pressed ? ds.c.tint : ds.c["brand-subtle"] }]}
          >
            <Icon name="functions" size={16} color={ds.c.brand} />
            <DsText v="caption-strong" c="brand">
              {t("formula.add")}
            </DsText>
          </Pressable>
        </View>
      )}
      {hasFormula ? (
        <View accessibilityLabel={t("formula.preview")} style={[styles.preview, { backgroundColor: ds.c.subtle }]}>
          <MathText text={value} size={15} v="body-sm" />
        </View>
      ) : null}
      {open ? <FormulaDialog onClose={() => setOpen(false)} onInsert={insert} /> : null}
    </View>
  );
}

function FormulaDialog({ onClose, onInsert }: { onClose: () => void; onInsert: (snippet: string) => boolean }) {
  const { t } = useTranslation("homework");
  const [latex, setLatex] = useState("");
  const [tooLong, setTooLong] = useState(false);
  const snippet = formulaSnippet(latex);

  return (
    <Sheet
      variant="app"
      compact
      open
      onClose={onClose}
      title={t("formula.title")}
      description={t("formula.description")}
      footer={
        <>
          <MobileButton variant="secondary" label={t("formula.cancel")} onPress={onClose} />
          <MobileButton
            label={t("formula.insert")}
            disabled={!snippet}
            onPress={() => {
              if (onInsert(snippet)) onClose();
              else setTooLong(true);
            }}
          />
        </>
      }
    >
      <View style={styles.dialog}>
        {/* Shablon kursorga emas, formula oxiriga qo'shiladi: mobil `MathFieldInput` kursor bermaydi. */}
        <FormulaPalette onInsert={(template) => setLatex((current) => `${current}${template}`)} />
        <MathFieldInput value={latex} onChange={setLatex} />
        {tooLong ? (
          <DsText v="body-xs" c="error-text">
            {t("formula.tooLong")}
          </DsText>
        ) : null}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  root: { gap: 6 },
  row: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  button: { height: 32, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, borderRadius: dsRadius.full },
  preview: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: dsRadius.lg },
  dialog: { gap: 12 },
});
