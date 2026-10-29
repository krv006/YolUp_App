import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Image, Pressable, StyleSheet, View } from "react-native";
import type { RoomAttachment } from "@/shared/types";
import { DsText, dsRadius, FileViewer, Icon, useDs } from "@/shared/ui";
import { messageApi } from "../api/message.api";
import { MessageAttachment } from "./message-attachment";

export interface RoomAttachmentsProps {
  roomId: string;
  type: "file" | "media";
  empty?: ReactNode;
}

function shortDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}`;
}

/**
 * Suhbatdagi fayllar yoki rasm/videolar — veb `room-attachments.tsx`.
 * Fayllar — xabardagi fayl kartasi va ostida yuboruvchi · sana; media —
 * 3 ustunli kvadrat plitkalar (video ustida ijro belgisi). Bosilganda
 * ilova ichidagi fayl ko'ruvchi ochiladi.
 */
export function RoomAttachments({ roomId, type, empty }: RoomAttachmentsProps) {
  const { t } = useTranslation("chat");
  const ds = useDs();
  const query = useQuery({
    queryKey: ["conversations", roomId, "attachments", type],
    queryFn: ({ signal }) => messageApi.getAttachments(roomId, type, { signal }),
    staleTime: 30_000,
  });
  const items = query.data ?? [];

  if (query.isLoading)
    return (
      <View style={type === "media" ? styles.grid : styles.list}>
        {Array.from({ length: type === "media" ? 6 : 3 }, (_, index) => (
          <View key={index} style={[type === "media" ? styles.tile : styles.skeletonRow, { backgroundColor: ds.c.skeleton }]} />
        ))}
      </View>
    );

  if (!items.length)
    return (
      empty ?? (
        <View style={[styles.empty, { borderColor: ds.c.line, backgroundColor: ds.c.surface }]}>
          <View style={[styles.emptyIcon, { backgroundColor: ds.c.subtle }]}>
            <Icon name={type === "file" ? "assign" : "camera"} size={22} color={ds.c["ink-tertiary"]} />
          </View>
          <DsText v="label-strong">{type === "file" ? t("info.filesEmpty") : t("info.mediaEmpty")}</DsText>
          <DsText v="caption" c="ink-tertiary" style={styles.center}>
            {type === "file" ? t("info.filesEmptyHint") : t("info.mediaEmptyHint")}
          </DsText>
        </View>
      )
    );

  if (type === "media")
    return (
      <View style={styles.grid}>
        {items.map((item) => (
          <MediaTile key={item.messageId} item={item} />
        ))}
      </View>
    );

  return (
    <View style={styles.list}>
      {items.map((item) => (
        <View key={item.messageId} style={styles.fileItem}>
          <MessageAttachment attachment={item} />
          <DsText v="caption" c="ink-tertiary" numberOfLines={1} style={styles.fileMeta}>
            {[item.senderName, shortDate(item.createdAt)].filter(Boolean).join(" · ")}
          </DsText>
        </View>
      ))}
    </View>
  );
}

function MediaTile({ item }: { item: RoomAttachment }) {
  const { t } = useTranslation("chat");
  const ds = useDs();
  const [open, setOpen] = useState(false);
  const video = item.mimeType.startsWith("video");
  // 🟡 Vebdan farqi: rasm bo'lmagan faylni (backend "media" ga doska PDF'ini ham qo'shadi) rasm qilib chizmaymiz.
  const preview = item.thumbnailUrl ?? (item.mimeType.startsWith("image") ? item.url : null);
  return (
    <>
      <Pressable
        accessibilityRole="imagebutton"
        accessibilityLabel={t("attachment.openAria", { name: item.name })}
        onPress={() => setOpen(true)}
        style={[styles.tile, styles.center, { backgroundColor: ds.c.subtle }]}
      >
        {preview ? (
          <Image source={{ uri: preview }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <Icon name={video ? "videocam" : item.mimeType.startsWith("image") ? "image" : "assign"} size={24} color={ds.c["ink-tertiary"]} />
        )}
        {video ? (
          // `absolute inset-0 bg-black/25`
          <View style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: "rgba(0,0,0,0.25)" }]}>
            <Icon name="play-circle-fill" size={28} color="#ffffff" />
          </View>
        ) : null}
      </Pressable>
      <FileViewer
        open={open}
        onOpenChange={setOpen}
        name={item.name}
        mimeType={item.mimeType}
        meta={[item.senderName, shortDate(item.createdAt)].filter(Boolean).join(" · ")}
        load={(signal) => messageApi.downloadFile(item.messageId, { signal }) as Promise<Blob>}
      />
    </>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center", textAlign: "center" },
  list: { gap: 8 },
  /* `grid-cols-3 gap-2` */
  // `alignItems: "flex-start"` — usiz `flexWrap` qatorida `aspectRatio` li plitka noto'g'ri balandlik oladi.
  grid: { flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start", gap: 8 },
  tile: { width: "31.5%", aspectRatio: 1, overflow: "hidden", borderRadius: dsRadius.xl },
  skeletonRow: { height: 64, borderRadius: dsRadius.xl },
  fileItem: { gap: 4 },
  fileMeta: { paddingHorizontal: 4 },
  empty: { alignItems: "center", gap: 8, paddingHorizontal: 24, paddingVertical: 40, borderWidth: 1, borderRadius: dsRadius["2xl"] },
  emptyIcon: { width: 48, height: 48, borderRadius: dsRadius.full, alignItems: "center", justifyContent: "center" },
});
