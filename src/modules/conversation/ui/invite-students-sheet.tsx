import { useTranslation } from "react-i18next";
import { Pressable, Share, StyleSheet, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Icon, radius, Sheet, SheetButton, SheetFooter, Text, toast, useTheme } from "@/shared/ui";

export interface InviteStudentsSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Backendda taklif havolasi endpointi paydo bo'lgach keladi. */
  link?: string | null;
}

/**
 * O'quvchilarni taklif qilish — veb `invite-students-dialog.tsx` porti.
 * Havola hozircha backenddan kelmaydi (vebda ham), shuning uchun
 * "tez orada" matni va o'chiq tugmalar ko'rinadi.
 */
export function InviteStudentsSheet({ open, onClose, title, link = null }: InviteStudentsSheetProps) {
  const { t } = useTranslation("chat");
  const { palette } = useTheme();

  async function copy() {
    if (!link) return;
    await Clipboard.setStringAsync(link);
    toast.success(t("newDialog.inviteCopied"));
  }

  return (
    <Sheet open={open} onClose={onClose} title={t("newDialog.inviteTitle")} description={t("newDialog.inviteDescription", { title })}>
      <View style={[styles.row, { backgroundColor: palette["surface-subtle"] }]}>
        <Icon name="eye" size={18} color={palette["subtle-foreground"]} />
        <Text variant="body" numberOfLines={1} style={[styles.grow, { color: link ? palette.foreground : palette["subtle-foreground"] }]}>
          {link ?? t("newDialog.invitePending")}
        </Text>
        <Pressable accessibilityRole="button" disabled={!link} onPress={() => void copy()} style={!link && styles.disabled}>
          <Text variant="label" style={{ color: palette.primary }}>
            {t("newDialog.inviteCopy")}
          </Text>
        </Pressable>
      </View>
      <SheetFooter>
        <SheetButton title={t("newDialog.cancel")} onPress={onClose} />
        <SheetButton
          variant="primary"
          title={t("newDialog.inviteShare")}
          disabled={!link}
          onPress={() => {
            if (link) void Share.share({ title, message: link });
          }}
        />
      </SheetFooter>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  disabled: { opacity: 0.4 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderRadius: radius.xl },
});
