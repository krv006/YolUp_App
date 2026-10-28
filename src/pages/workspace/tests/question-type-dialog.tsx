import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import type { QuizQuestionType } from "@/shared/types";
import { DsText, dsRadius, Icon, Sheet, useDs, type IconName } from "@/shared/ui";

export interface QuestionTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (type: QuizQuestionType) => void;
}

const TYPES: QuizQuestionType[] = ["single", "multiple", "true_false", "numeric", "matching", "ordering", "fill_blank", "essay"];

const TYPE_ICON: Record<QuizQuestionType, IconName> = {
  single: "radio-unchecked",
  multiple: "check-box-fill",
  true_false: "task-alt",
  numeric: "functions",
  text: "text-fields",
  matching: "link",
  ordering: "sort",
  fill_blank: "text-fields",
  essay: "edit-note",
};

/**
 * Savol turini tanlash — veb `question-type-dialog.tsx` ning tor ekran
 * varianti (pastki oyna): 2 ustunli kartalar, belgi, tur nomi va izoh.
 */
export function QuestionTypeDialog({ open, onOpenChange, onPick }: QuestionTypeDialogProps) {
  const { t } = useTranslation("quiz");
  const ds = useDs();
  const rows = Array.from({ length: Math.ceil(TYPES.length / 2) }, (_, index) => TYPES.slice(index * 2, index * 2 + 2));

  return (
    <Sheet variant="app" open={open} onClose={() => onOpenChange(false)} title={t("typeDialog.title")} description={t("typeDialog.description")}>
      {/* `grid grid-cols-2 gap-2.5`, karta `h-26.5 rounded-lg px-3.5 pt-3` */}
      <View style={styles.grid}>
        {rows.map((row) => (
          <View key={row.join("-")} style={styles.row}>
            {row.map((type) => (
              <View key={type} style={styles.cell}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onPick(type)}
                  style={({ pressed }) => [
                    styles.card,
                    pressed ? { borderWidth: 1.5, borderColor: ds.c.brand, backgroundColor: ds.c["brand-subtle"] } : { borderWidth: 1, borderColor: ds.c.line, backgroundColor: ds.c.surface },
                  ]}
                >
                  <View style={[styles.icon, { backgroundColor: ds.c["brand-subtle"] }]}>
                    <Icon name={TYPE_ICON[type]} size={18} color={ds.c.brand} />
                  </View>
                  <DsText v="title" numberOfLines={1} style={styles.title}>
                    {t(`editor.mobile.types.${type}`)}
                  </DsText>
                  <DsText v="body-xs" c="ink-secondary" numberOfLines={2} style={styles.hint}>
                    {t(`typeDialog.hints.${type}`)}
                  </DsText>
                </Pressable>
              </View>
            ))}
          </View>
        ))}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  grid: { marginTop: -4, gap: 10, paddingBottom: 8 },
  row: { flexDirection: "row", gap: 10 },
  cell: { flex: 1, flexBasis: 0 },
  card: { height: 106, paddingHorizontal: 14, paddingTop: 12, borderRadius: dsRadius.lg },
  icon: { width: 32, height: 32, borderRadius: dsRadius.md, alignItems: "center", justifyContent: "center" },
  title: { marginTop: 12 },
  hint: { marginTop: 4 },
});
