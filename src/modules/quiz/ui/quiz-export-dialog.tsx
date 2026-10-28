import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { DsText, dsRadius, Icon, MobileButton, Sheet, useDs, type IconName } from "@/shared/ui";
import type { QuizExportMode, QuizExportType } from "../api/quiz.api";

export interface QuizExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Hozir yuklanayotgan fayl — tugma o'chiq turadi. */
  pending?: string | null;
  onExport: (type: QuizExportType, mode: QuizExportMode) => void;
}

const MODES: QuizExportMode[] = ["student", "teacher"];

const FORMATS: ReadonlyArray<{ type: QuizExportType; icon: IconName; teacherOnly?: boolean }> = [
  { type: "pdf", icon: "description-fill" },
  { type: "docx", icon: "description-fill" },
  { type: "xlsx", icon: "grid-view", teacherOnly: true },
];

/**
 * Testni yuklab olish — veb `quiz-export-dialog.tsx` ning tor ekran varianti
 * (pastki oyna): o'quvchi yoki o'qituvchi nusxasi, format (PDF, DOCX,
 * Excel — faqat o'qituvchi nusxasida) va "Yuklab olish".
 */
export function QuizExportDialog({ open, onOpenChange, title, pending = null, onExport }: QuizExportDialogProps) {
  const { t } = useTranslation("quiz");
  const ds = useDs();
  const [mode, setMode] = useState<QuizExportMode>("student");
  const [type, setType] = useState<QuizExportType>("pdf");

  function pickMode(next: QuizExportMode) {
    setMode(next);
    if (next === "student" && type === "xlsx") setType("pdf");
  }

  return (
    <Sheet
      variant="app"
      open={open}
      onClose={() => onOpenChange(false)}
      title={t("exportDialog.title")}
      description={t("exportDialog.description", { title })}
      footer={<MobileButton label={t("exportDialog.submit")} disabled={Boolean(pending)} onPress={() => onExport(type, mode)} />}
    >
      <View style={styles.body}>
        <View style={styles.modes}>
          {MODES.map((item) => {
            const active = mode === item;
            return (
              <Pressable
                key={item}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                onPress={() => pickMode(item)}
                style={[styles.mode, active ? { borderColor: ds.c.brand, backgroundColor: ds.c["brand-subtle"] } : { borderColor: ds.c.line, backgroundColor: ds.c.surface }]}
              >
                <View style={styles.grow}>
                  <DsText v="title" numberOfLines={1}>
                    {t(`exportDialog.${item}`)}
                  </DsText>
                  <DsText v="body-xs" c="ink-secondary" numberOfLines={1}>
                    {t(`exportDialog.${item}Hint`)}
                  </DsText>
                </View>
                <View style={[styles.radio, active ? { backgroundColor: ds.c.brand } : { borderWidth: 1.5, borderColor: ds.c["line-strong"], backgroundColor: ds.c.surface }]}>
                  {active ? <View style={[styles.radioDot, { backgroundColor: ds.c.surface }]} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        <DsText v="caption-strong" c="ink-secondary" style={styles.label}>
          {t("exportDialog.format")}
        </DsText>

        {/* `grid grid-cols-3 gap-2.5`, har biri `h-18.5 rounded-lg border-[1.5px]` */}
        <View style={styles.formats}>
          {FORMATS.map((format) => {
            const disabled = Boolean(format.teacherOnly) && mode !== "teacher";
            const active = type === format.type && !disabled;
            return (
              <View key={format.type} style={styles.formatCell}>
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active, disabled }}
                  disabled={disabled}
                  onPress={() => setType(format.type)}
                  style={[styles.format, active ? { borderColor: ds.c.brand, backgroundColor: ds.c["brand-subtle"] } : { borderColor: ds.c.line, backgroundColor: ds.c.surface }, disabled && styles.faded]}
                >
                  <Icon name={format.icon} size={22} color={active ? ds.c.brand : ds.c["icon-secondary"]} />
                  <DsText v="title-sm">{t(`exportDialog.type.${format.type}`)}</DsText>
                </Pressable>
              </View>
            );
          })}
        </View>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  faded: { opacity: 0.4 },
  body: { marginTop: -2, gap: 10 },
  modes: { gap: 10 },
  mode: { height: 70, flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, borderWidth: 1.5, borderRadius: dsRadius.lg },
  radio: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  label: { marginTop: -5, marginBottom: -6, textTransform: "uppercase" },
  formats: { flexDirection: "row", gap: 10 },
  formatCell: { flex: 1, flexBasis: 0 },
  format: { height: 74, alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1.5, borderRadius: dsRadius.lg },
});
