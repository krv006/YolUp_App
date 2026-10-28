import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Image, Pressable, StyleSheet, View } from "react-native";
import { downloadBlob, fileKindLabel, fileKindOf, formatFileSize } from "@/shared/lib";
import type { MessageAttachment as Attachment } from "@/shared/types";
import { dsAlpha, DsText, dsRadius, Icon, toast, useDs } from "@/shared/ui";
import { messageApi } from "../api/message.api";

/**
 * Xabardagi fayl — veb `message-attachment.tsx`: rasm bo'lsa xabar ichida
 * (`max-h-[320px] w-full rounded-xl`), aks holda fayl kartasi (kengaytma
 * belgisi, nom, hajm, yuklab olish doirasi).
 *
 * Vebda bosilganda `FileViewer` ochiladi; mobilda fayl token bilan
 * yuklanib, tizimning ochish/ulashish oynasi chiqadi (`downloadBlob`).
 */
export function MessageAttachment({
  attachment,
  failed = false,
  uploading = false,
}: {
  attachment: Attachment;
  failed?: boolean;
  uploading?: boolean;
}) {
  const { t } = useTranslation("chat");
  const { t: tm } = useTranslation("mobile");
  const ds = useDs();
  const [busy, setBusy] = useState(false);
  const [ratio, setRatio] = useState<number | null>(null);
  const kind = fileKindOf(attachment.mimeType, attachment.name);
  const extension = attachment.name.split(".").pop()?.slice(0, 4).toUpperCase() ?? "FILE";
  const meta = [
    attachment.size ? formatFileSize(attachment.size) : "",
    attachment.pageCount ? t("attachment.pages", { count: attachment.pageCount }) : "",
  ]
    .filter(Boolean)
    .join(" · ");

  async function open() {
    if (busy || failed) return;
    setBusy(true);
    try {
      const blob = await messageApi.downloadFile(attachment.messageId);
      const saved = await downloadBlob(blob as Blob, attachment.name);
      if (!saved) toast.error(tm("message.faylni_ochib_bolmadi"));
    } catch {
      toast.error(tm("message.faylni_ochib_bolmadi"));
    } finally {
      setBusy(false);
    }
  }

  if (kind === "image" && attachment.url && !failed) {
    return (
      <Pressable
        accessibilityRole="imagebutton"
        accessibilityLabel={t("attachment.openAria", { name: attachment.name })}
        onPress={() => void open()}
        style={styles.image}
      >
        <Image
          source={{ uri: attachment.url }}
          onLoad={(event) => {
            const { width, height } = event.nativeEvent.source;
            if (width && height) setRatio(width / height);
          }}
          style={[styles.picture, { aspectRatio: ratio ?? 4 / 3, backgroundColor: ds.c.subtle }]}
          resizeMode="cover"
        />
        {uploading || busy ? (
          <View style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: "rgba(0,0,0,0.35)" }]}>
            <ActivityIndicator color="#ffffff" />
          </View>
        ) : null}
      </Pressable>
    );
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("attachment.openAria", { name: attachment.name })}
        disabled={failed}
        onPress={() => void open()}
        style={({ pressed }) => [
          styles.file,
          failed
            ? { borderColor: ds.c["error-bg"], backgroundColor: dsAlpha(ds.c["error-bg"], 0.5) }
            : { borderColor: ds.c.line, backgroundColor: pressed ? ds.c.subtle : ds.c.surface },
        ]}
      >
        <View style={[styles.extension, { backgroundColor: ds.c["error-bg"] }]}>
          {failed ? (
            <Icon name="error" size={20} color={ds.c["error-text"]} />
          ) : (
            <DsText v="caption-strong" c="error-text">
              {extension}
            </DsText>
          )}
        </View>
        <View style={styles.grow}>
          <DsText v="label-strong" numberOfLines={1}>
            {attachment.name}
          </DsText>
          <DsText v="caption" c={failed ? "error-text" : "ink-tertiary"} numberOfLines={1}>
            {failed
              ? `${t("attachment.uploadFailed")} · ${fileKindLabel(kind)}`
              : uploading
                ? t("attachment.uploading")
                : meta || `${fileKindLabel(kind)} · ${t("attachment.openSuffix")}`}
          </DsText>
        </View>
        <View style={[styles.download, failed ? null : { backgroundColor: ds.c.subtle }]}>
          {busy ? (
            <ActivityIndicator size="small" color={ds.c["ink-secondary"]} />
          ) : (
            <Icon name={failed ? "refresh" : "download"} size={16} color={failed ? ds.c["error-text"] : ds.c["ink-secondary"]} />
          )}
        </View>
      </Pressable>
      {uploading && !failed ? (
        <View style={[styles.progress, { backgroundColor: ds.c.muted }]}>
          <View style={[styles.progressFill, { backgroundColor: ds.c.action }]} />
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  center: { alignItems: "center", justifyContent: "center" },
  image: { width: "100%", overflow: "hidden", borderRadius: dsRadius.xl },
  picture: { width: "100%", maxHeight: 320 },
  /* `w-full items-center gap-3 rounded-xl border p-3` */
  file: { width: "100%", flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderWidth: 1, borderRadius: dsRadius.xl },
  extension: { width: 44, height: 44, borderRadius: dsRadius.lg, alignItems: "center", justifyContent: "center" },
  download: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  progress: { marginTop: 4, height: 4, width: "100%", overflow: "hidden", borderRadius: 2 },
  progressFill: { height: "100%", width: "33%", borderRadius: 2 },
});
