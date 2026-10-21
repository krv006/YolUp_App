import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TextInput, View } from "react-native";
import { Check, Type } from "lucide-react-native";
import { Sheet, SheetButton, SheetFooter, Text, useTheme } from "@/shared/ui";
import type { FormulaSolutionDto } from "../api/board.dto";
import { FormulaPalette } from "./formula-palette";

export interface FormulaSolverSheetProps {
  open: boolean;
  onClose: () => void;
  formula: string;
  onFormulaChange: (formula: string) => void;
  solution: FormulaSolutionDto | null;
  solving: boolean;
  placing: boolean;
  canPlace: boolean;
  onSolve: () => void;
  onPlace: () => void;
  onPlaceResultOnly: () => void;
}

/**
 * Formula yechuvchi — veb `formula-solver-dialog.tsx`: tenglama maydoni,
 * formula palitrasi, yechim qadamlari va javob. Yechilmaguncha pastda
 * "Yechish", yechilgach "Faqat javob" va "Doskaga qo'shish".
 */
export function FormulaSolverSheet({
  open,
  onClose,
  formula,
  onFormulaChange,
  solution,
  solving,
  placing,
  canPlace,
  onSolve,
  onPlace,
  onPlaceResultOnly,
}: FormulaSolverSheetProps) {
  const { t } = useTranslation("board");
  const { palette } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const steps = solution?.steps ?? [];

  return (
    <Sheet open={open} onClose={onClose} title={t("formulaDialog.title")} description={t("formulaDialog.description")}>
      <View style={styles.form}>
        {/* `label` — 14/600 kulrang yorliq, `h-12 rounded-xl bg-subtle px-3.5` maydon */}
        <View style={styles.field}>
          <Text variant="label" style={{ color: palette["muted-foreground"] }}>
            {t("formulaDialog.formulaLabel")}
          </Text>
          <View style={[styles.inputShell, { backgroundColor: palette["surface-subtle"] }]}>
            <TextInput
              ref={inputRef}
              autoFocus
              value={formula}
              onChangeText={onFormulaChange}
              placeholder={t("formulaDialog.placeholder")}
              placeholderTextColor={palette["subtle-foreground"]}
              selectionColor={palette.primary}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="go"
              onSubmitEditing={onSolve}
              style={[styles.input, { color: palette.foreground }]}
            />
            <View style={styles.inputIcon}>
              <Type size={16} color={palette["subtle-foreground"]} />
            </View>
          </View>
        </View>

        <FormulaPalette
          onInsert={(latex) => {
            onFormulaChange(`${formula}${latex}`);
            inputRef.current?.focus();
          }}
        />
      </View>

      {solution ? (
        // `rounded-xl border p-3.5 gap-2.5`
        <View style={[styles.solution, { borderColor: palette.border }]}>
          <Text variant="caption" style={[styles.stepsTitle, { color: palette["subtle-foreground"] }]}>
            {t("formulaDialog.solutionSteps", { count: steps.length })}
          </Text>

          {steps.length ? (
            <View style={styles.steps}>
              {steps.map((step, index) => (
                <View key={`${index}-${step}`} style={styles.step}>
                  <Text variant="caption" style={[styles.stepIndex, { color: palette.primary }]}>
                    {index + 1}
                  </Text>
                  <Text variant="label" style={styles.stepText}>
                    {step}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text variant="label" style={styles.stepText}>
              {solution.pretty}
            </Text>
          )}

          <View style={[styles.answer, { backgroundColor: palette["success-soft"] }]}>
            <Check size={16} color={palette["success-strong"]} />
            <Text variant="label" style={styles.stepText}>
              {t("formulaDialog.answer", { value: solution.result })}
            </Text>
          </View>
        </View>
      ) : null}

      <SheetFooter>
        {solution ? (
          <>
            <SheetButton title={t("formulaDialog.resultOnly")} disabled={placing || !canPlace} onPress={onPlaceResultOnly} />
            <SheetButton
              variant="primary"
              title={t("formulaDialog.place")}
              disabled={placing || !canPlace}
              loading={placing}
              onPress={onPlace}
            />
          </>
        ) : (
          <SheetButton
            variant="primary"
            title={t("formulaDialog.solve")}
            disabled={solving || !formula.trim()}
            loading={solving}
            onPress={onSolve}
          />
        )}
      </SheetFooter>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  form: { gap: 12 },
  field: { gap: 6 },
  inputShell: { height: 48, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, borderRadius: 12 },
  input: { flex: 1, minWidth: 0, height: "100%", fontSize: 16, fontFamily: "Onest-Regular", fontVariant: ["tabular-nums"] },
  inputIcon: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  solution: { gap: 10, padding: 14, borderWidth: 1, borderRadius: 12 },
  stepsTitle: { fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase" },
  steps: { gap: 8 },
  step: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  stepIndex: { width: 16, fontWeight: "600", fontVariant: ["tabular-nums"] },
  stepText: { flex: 1, minWidth: 0, fontWeight: "400", fontVariant: ["tabular-nums"] },
  answer: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8 },
});
