import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { Download } from "lucide-react-native";
import { radius, Sheet, SheetButton, SheetFooter, Text, useTheme } from "@/shared/ui";
import type { QuizExportMode, QuizExportType } from "../api/quiz.api";

export interface QuizExportSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Hozir yuklanayotgan fayl (`mode:type`) — qatorda aylanuvchi belgi. */
  pending?: string | null;
  onExport: (type: QuizExportType, mode: QuizExportMode) => void;
}

const PHONE_TYPES: ReadonlyArray<QuizExportType> = ["pdf", "docx", "xlsx"];

/**
 * Testni faylga chiqarish — veb `modules/quiz/ui/quiz-export-dialog.tsx`
 * ning TELEFON varianti (`isCompact`): uchta qator, hammasi o'qituvchi
 * nusxasi (javob kaliti bilan).
 */
export function QuizExportSheet({ open, onClose, title, pending = null, onExport }: QuizExportSheetProps) {
  const { t } = useTranslation("quiz");
  const { palette } = useTheme();

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t("exportDialog.title")}
      description={t("exportDialog.phoneDescription", { title })}
    >
      <View>
        {PHONE_TYPES.map((type) => (
          <Pressable
            key={type}
            accessibilityRole="button"
            disabled={Boolean(pending)}
            onPress={() => onExport(type, "teacher")}
            style={({ pressed }) => [
              styles.row,
              pressed && { backgroundColor: palette["surface-subtle"] },
              Boolean(pending) && styles.disabled,
            ]}
          >
            {pending === `teacher:${type}` ? (
              <ActivityIndicator size="small" color={palette["muted-foreground"]} />
            ) : (
              <Download size={19} color={palette["muted-foreground"]} />
            )}
            <Text variant="body">{t(`exportDialog.type.${type}`)}</Text>
          </Pressable>
        ))}
      </View>
      <SheetFooter>
        <SheetButton title={t("exportDialog.close")} onPress={onClose} />
      </SheetFooter>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  /* `h-14 rounded-xl px-2 gap-3 text-body` */
  row: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 8,
    borderRadius: radius.xl,
  },
  disabled: { opacity: 0.5 },
});
