import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { Download, FileText } from "lucide-react-native";
import { downloadBlob, fileKindLabel, fileKindOf } from "@/shared/lib";
import type { MessageAttachment as Attachment } from "@/shared/types";
import { radius, Text, toast, useTheme } from "@/shared/ui";
import { messageApi } from "../api/message.api";

/**
 * Xabarga biriktirilgan fayl (odatda dars doskasining PDF'i).
 *
 * Fayl `/api/v1/chat/files/<messageId>/` dan **Authorization header bilan**
 * olinadi — ya'ni uni oddiy havola sifatida ochib bo'lmaydi. Blob olinadi,
 * keshga yoziladi va OS ning ulashish oynasi ochiladi (§8.2, `downloadBlob`).
 *
 * Veb'da bu joyda `FileViewer` modal'i bor edi — ichki ko'ruvchi. Mobilda
 * PDF/rasm ko'ruvchi Faza 3 da qo'shiladi; hozircha OS ning o'z ilovasi
 * ochadi, bu esa foydalanuvchi uchun tanish va tezroq yo'l.
 */
export function MessageAttachment({
  attachment,
  outgoing = false,
}: {
  attachment: Attachment;
  outgoing?: boolean;
}) {
  const { palette } = useTheme();
  const [busy, setBusy] = useState(false);
  const kind = fileKindOf(attachment.mimeType, attachment.name);

  async function open() {
    if (busy) return;
    setBusy(true);
    try {
      const blob = await messageApi.downloadFile(attachment.messageId);
      const saved = await downloadBlob(blob, attachment.name);
      if (!saved) toast.error("Faylni ochib bo'lmadi");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Faylni yuklab bo'lmadi");
    } finally {
      setBusy(false);
    }
  }

  const foreground = outgoing ? palette["primary-foreground"] : palette["primary-text"];
  const background = outgoing ? "rgba(255,255,255,0.16)" : palette["primary-tint"];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${attachment.name} — ochish`}
      accessibilityState={{ busy }}
      onPress={() => void open()}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: background, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <FileText size={18} color={foreground} />
      <View style={styles.body}>
        <Text variant="label" numberOfLines={1} style={{ color: foreground }}>
          {attachment.name}
        </Text>
        <Text variant="caption" style={{ color: foreground, opacity: 0.75 }}>
          {fileKindLabel(kind)}
        </Text>
      </View>
      {busy ? (
        <ActivityIndicator size="small" color={foreground} />
      ) : (
        <Download size={16} color={foreground} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: radius.sm,
    marginTop: 4,
  },
  body: { flex: 1, gap: 2 },
});
