import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TextInput, View } from "react-native";
import type { ExamStudentResult } from "@/shared/types";
import { dsAlpha, DsText, dsRadius, dsType, headingFont, Icon, MobileButton, Sheet, useDs } from "@/shared/ui";

export interface ExamScoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: ExamStudentResult | null;
  suggested?: Record<string, number>;
  prefill?: Record<string, number>;
  pending?: boolean;
  onSave: (scores: Record<string, number>, comment: string) => void;
}

/**
 * Qo'lda baholash — veb `exam-score-dialog.tsx` ning tor ekran varianti
 * (pastki oyna): har bo'lim qatori (avtomatik baholangani qulflangan,
 * qo'ldagisida band kiritiladi, AI taklifi izohda) va umumiy band.
 */
export function ExamScoreDialog({ open, onOpenChange, result, suggested = {}, prefill, pending = false, onSave }: ExamScoreDialogProps) {
  const { t } = useTranslation("exam");
  const ds = useDs();
  const [scores, setScores] = useState<Record<string, string>>({});
  const [focused, setFocused] = useState<string | null>(null);
  const [syncedId, setSyncedId] = useState<string | null>(null);
  const syncKey = result ? `${result.studentId}:${JSON.stringify(prefill ?? {})}:${open}` : null;

  if (result && syncedId !== syncKey) {
    setSyncedId(syncKey);
    setScores(
      Object.fromEntries(
        result.sections
          .filter((section) => section.manual)
          .map((section) => [section.key, prefill?.[section.key] !== undefined ? String(prefill[section.key]) : section.score === null ? "" : String(section.score)])
      )
    );
  }

  if (!result) return null;

  const values = result.sections
    .map((section) => {
      const raw = (scores[section.key] ?? "").trim().replace(",", ".");
      return section.manual ? (raw ? Number(raw) : Number.NaN) : (section.score ?? Number.NaN);
    })
    .filter((value) => Number.isFinite(value));
  const overall = values.length ? (Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 2) / 2).toFixed(1) : "—";

  function save() {
    const payload: Record<string, number> = {};
    for (const [key, value] of Object.entries(scores)) {
      const score = Number(value.replace(",", "."));
      if (value.trim() && Number.isFinite(score)) payload[key] = score;
    }
    onSave(payload, "");
  }

  return (
    <Sheet
      variant="app"
      open={open}
      onClose={() => onOpenChange(false)}
      title={t("mock.scoreTitle", { name: result.studentName })}
      description={t("mock.scoreDescription")}
      footer={
        <>
          <MobileButton variant="secondary" label={t("mock.scoreCancel")} onPress={() => onOpenChange(false)} />
          <MobileButton label={t("mock.scoreSave")} disabled={pending} onPress={save} />
        </>
      }
    >
      <View style={styles.body}>
        {result.sections.map((section) => {
          const manual = section.manual;
          const hint = suggested[section.key];
          const active = focused === section.key;
          return (
            <View
              key={section.key}
              style={[
                styles.row,
                manual
                  ? { borderColor: active ? ds.c.brand : ds.c.line, backgroundColor: active ? dsAlpha(ds.c["brand-subtle"], 0.4) : ds.c.surface }
                  : { borderColor: "transparent", backgroundColor: ds.c.subtle },
              ]}
            >
              <View style={styles.grow}>
                <DsText v="title-sm" numberOfLines={1}>
                  {section.title}
                </DsText>
                <DsText v="caption" w="400" c={manual ? "brand" : "ink-secondary"} numberOfLines={1}>
                  {!manual ? t("mock.autoScored") : hint !== undefined ? t("mock.aiSuggestion", { value: hint.toFixed(1) }) : t("mock.enterBand")}
                </DsText>
              </View>
              {manual ? (
                <TextInput
                  value={scores[section.key] ?? ""}
                  placeholder="—"
                  placeholderTextColor={ds.c.ink}
                  keyboardType="decimal-pad"
                  onFocus={() => setFocused(section.key)}
                  onBlur={() => setFocused(null)}
                  onChangeText={(value) => setScores((current) => ({ ...current, [section.key]: value }))}
                  style={[styles.input, { color: ds.c.ink }]}
                />
              ) : (
                <View style={styles.locked}>
                  <Icon name="lock-fill" size={14} color={ds.c["ink-secondary"]} />
                  <DsText v="title-lg" heading>
                    {section.score === null ? "—" : section.score.toFixed(1)}
                  </DsText>
                </View>
              )}
            </View>
          );
        })}
        <View style={styles.overall}>
          <DsText v="body-sm" c="ink-secondary" numberOfLines={1} style={styles.grow}>
            {t("mock.overallBand")}
          </DsText>
          <DsText v="h2" heading c="brand">
            {overall}
          </DsText>
        </View>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  body: { marginTop: -4, gap: 10 },
  row: { height: 58, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 12, borderWidth: 1.5, borderRadius: dsRadius.lg },
  input: { width: 64, padding: 0, textAlign: "right", fontSize: dsType["title-lg"].fontSize, fontFamily: headingFont("500") },
  locked: { flexDirection: "row", alignItems: "center", gap: 12 },
  overall: { paddingTop: 6, flexDirection: "row", alignItems: "center", gap: 12 },
});
