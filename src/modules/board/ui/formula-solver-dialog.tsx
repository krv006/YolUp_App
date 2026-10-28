import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { bodyFont, DsText, dsRadius, dsType, MobileButton, Sheet, useDs } from "@/shared/ui";
import type { FormulaSolutionDto } from "../api/board.dto";

const QUICK_KEYS = [
  { label: "x²", insert: "x²" },
  { label: "√", insert: "√" },
  { label: "π", insert: "π" },
  { label: "÷", insert: "÷" },
  { label: "×", insert: "×" },
  { label: "( )", insert: "()", caret: 1 },
  { label: "=", insert: "=" },
];

export interface FormulaSolverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formula: string;
  onFormulaChange: (formula: string) => void;
  solution: FormulaSolutionDto | null;
  solving: boolean;
  placing: boolean;
  canPlace: boolean;
  onSolve: () => void;
  onPlace: () => void;
}

/**
 * Formula yechuvchi — veb `formula-solver-dialog.tsx` (tor ekran): ifoda,
 * tezkor tugmalar (kursor joyiga qo'yiladi), yechim qadamlari; pastda
 * "Yechish" va "Doskaga qo'yish".
 */
export function FormulaSolverDialog({ open, onOpenChange, formula, onFormulaChange, solution, solving, placing, canPlace, onSolve, onPlace }: FormulaSolverDialogProps) {
  const { t } = useTranslation("board");
  const ds = useDs();
  const inputRef = useRef<TextInput>(null);
  const selectionRef = useRef<{ start: number; end: number } | null>(null);
  const [focused, setFocused] = useState(false);
  const steps = solution?.steps ?? [];

  function insertAtCaret(text: string, caret = text.length) {
    const selection = selectionRef.current ?? { start: formula.length, end: formula.length };
    onFormulaChange(`${formula.slice(0, selection.start)}${text}${formula.slice(selection.end)}`);
    const position = selection.start + caret;
    selectionRef.current = { start: position, end: position };
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelection(position, position);
    });
  }

  return (
    <Sheet
      variant="app"
      compact
      open={open}
      onClose={() => onOpenChange(false)}
      title={t("formulaDialog.title")}
      description={t("formulaDialog.description")}
      footer={
        <>
          <MobileButton variant="secondary" label={t("formulaDialog.solve")} disabled={solving || !formula.trim()} onPress={onSolve} />
          <MobileButton label={t("formulaDialog.place")} disabled={!solution || placing || !canPlace} onPress={onPlace} />
        </>
      }
    >
      <View style={styles.form}>
        <TextInput
          ref={inputRef}
          autoFocus
          value={formula}
          placeholder={t("formulaDialog.placeholder")}
          placeholderTextColor={ds.c["ink-tertiary"]}
          accessibilityLabel={t("formulaDialog.formulaLabel")}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="go"
          onChangeText={onFormulaChange}
          onSelectionChange={(event) => {
            selectionRef.current = event.nativeEvent.selection;
          }}
          onSubmitEditing={() => formula.trim() && !solving && onSolve()}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            styles.input,
            formula ? styles.inputFilled : styles.inputEmpty,
            { backgroundColor: ds.c.subtle, borderColor: focused ? ds.c.brand : "transparent", color: ds.c.ink },
          ]}
        />
        <View style={styles.keys}>
          {QUICK_KEYS.map((key) => (
            <Pressable
              key={key.label}
              accessibilityRole="button"
              onPress={() => insertAtCaret(key.insert, key.caret)}
              style={({ pressed }) => [styles.key, { backgroundColor: pressed ? ds.c.muted : ds.c.subtle }]}
            >
              <DsText v="body-sm" w="600">
                {key.label}
              </DsText>
            </Pressable>
          ))}
        </View>
      </View>

      {solution ? (
        <View style={[styles.solution, { borderColor: ds.c.brand, backgroundColor: ds.c.canvas }]}>
          <DsText v="caption-strong" c="brand">
            {t("formulaDialog.solutionSteps", { count: steps.length }).toUpperCase()}
          </DsText>
          <View style={styles.steps}>
            {(steps.length ? steps : [solution.pretty]).map((step, index) => (
              <View key={`${index}-${step}`} style={styles.step}>
                <View style={[styles.stepNumber, { backgroundColor: ds.c.brand }]}>
                  <DsText v="caption-strong" c="on-action" numeric>
                    {index + 1}
                  </DsText>
                </View>
                <DsText v="body-sm" style={styles.grow}>
                  {step}
                </DsText>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  /* `-mt-[3px] gap-3` */
  form: { marginTop: -3, gap: 12 },
  /* `h-14 rounded-lg border-[1.5px] px-5 font-numeric text-title font-semibold` */
  input: { height: 56, paddingHorizontal: 20, borderWidth: 1.5, borderRadius: dsRadius.lg, fontSize: dsType.title.fontSize, fontVariant: ["tabular-nums"] },
  inputFilled: { fontFamily: bodyFont("600") },
  inputEmpty: { fontFamily: bodyFont("400") },
  /* `grid-cols-7 gap-1.5`, tugma `h-9 rounded-[10px]` */
  keys: { flexDirection: "row", gap: 6 },
  key: { flex: 1, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  /* `-mt-1 gap-2.5 rounded-lg border p-4 pb-[11px]` */
  solution: { marginTop: -4, gap: 10, padding: 16, paddingBottom: 11, borderWidth: 1, borderRadius: dsRadius.lg },
  steps: { gap: 10 },
  step: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  stepNumber: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
});
