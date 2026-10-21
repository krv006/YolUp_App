import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { Camera, ClipboardList, FolderClosed, Image as ImageIcon, type LucideIcon } from "lucide-react-native";
import { pickDocument, pickImage, toUploadFile, type PickedFile } from "@/shared/lib/file-picker";
import { radius, Sheet, Text, toast, useTheme } from "@/shared/ui";

/** Vebdagi chegara — `message-composer.tsx` dagi `MAX_FILE_MB`. */
export const MAX_FILE_MB = 20;

export interface AttachmentSheetProps {
  open: boolean;
  onClose: () => void;
  /** Tanlangan fayl — kompozitor uni xabar sifatida yuboradi. */
  onPick: (file: File) => void;
  /** O'qituvchida "Vazifa" plitkasi — berilmasa ko'rinmaydi (vebdagi kabi). */
  onAssignment?: () => void;
}

/**
 * Biriktirma varag'i — veb `attachment-sheet.tsx` ning porti.
 *
 * Plitkalar va ranglari vebdan: Galereya (ko'k), Kamera (yashil),
 * Hujjat (sariq), Vazifa (qizil, faqat o'qituvchida). Plitka 56x56,
 * radius 24, ostida yorliq.
 *
 * Vebda fayl `<input type="file">` bilan tanlanadi; mobilda esa
 * platformaning o'z tanlagichlari (`shared/lib/file-picker`).
 */
export function AttachmentSheet({ open, onClose, onPick, onAssignment }: AttachmentSheetProps) {
  const { t } = useTranslation("chat");
  const { palette } = useTheme();

  async function handle(picker: () => Promise<PickedFile | null>) {
    const picked = await picker();
    if (!picked) return;
    // Vebdagi kabi chegara: katta fayl yuborilmaydi, foydalanuvchiga aytiladi.
    if (picked.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(t("attach.sizeHint", { size: MAX_FILE_MB }));
      return;
    }
    onClose();
    onPick(toUploadFile(picked));
  }

  const tiles: { id: string; label: string; icon: LucideIcon; tone: string; onPress: () => void }[] = [
    {
      id: "gallery",
      label: t("attach.gallery"),
      icon: ImageIcon,
      tone: palette.primary,
      onPress: () => void handle(() => pickImage("library")),
    },
    {
      id: "camera",
      label: t("attach.camera"),
      icon: Camera,
      tone: palette.success,
      onPress: () => void handle(() => pickImage("camera")),
    },
    {
      id: "document",
      label: t("attach.document"),
      icon: FolderClosed,
      tone: palette["warning-strong"],
      onPress: () => void handle(() => pickDocument()),
    },
    ...(onAssignment
      ? [
          {
            id: "assignment",
            label: t("attach.assignment"),
            icon: ClipboardList,
            tone: palette.destructive,
            onPress: () => {
              onClose();
              onAssignment();
            },
          },
        ]
      : []),
  ];

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t("attach.title")}
      description={t("attach.sizeHint", { size: MAX_FILE_MB })}
    >
      <View style={styles.grid}>
        {tiles.map((tile) => (
          <Pressable
            key={tile.id}
            accessibilityRole="button"
            accessibilityLabel={tile.label}
            onPress={tile.onPress}
            style={({ pressed }) => [styles.tile, pressed && { opacity: 0.8 }]}
          >
            <View style={[styles.tileIcon, { backgroundColor: tile.tone }]}>
              <tile.icon size={24} color="#ffffff" />
            </View>
            <Text variant="caption" tone="muted">
              {tile.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  /* Veb: `grid grid-cols-4 gap-3`. */
  grid: { flexDirection: "row", gap: 12, paddingBottom: 8 },
  tile: { flex: 1, alignItems: "center", gap: 8 },
  tileIcon: {
    width: 56,
    height: 56,
    borderRadius: radius["2xl"],
    alignItems: "center",
    justifyContent: "center",
  },
});
