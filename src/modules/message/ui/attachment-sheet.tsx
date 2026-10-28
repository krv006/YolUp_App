import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { pickDocuments, pickImage, pickImages, writeBlobToCache, type PickedFile } from "@/shared/lib";
import type { ChatMessage } from "@/shared/types";
import { DsText, dsRadius, Icon, Sheet, toast, toneColors, useDs, type IconName } from "@/shared/ui";
import { messageApi } from "../api/message.api";
import { messageKeys } from "../model/message.keys";

const RECENT_LIMIT = 3;

export interface AttachmentSheetProps {
  open: boolean;
  onClose: () => void;
  /** Tanlangan fayllar; `images` — hammasi rasm (rasm yuborish ekrani ochiladi). */
  onPick: (files: PickedFile[], images: boolean) => void;
  onAssignment?: () => void;
  maxSizeMb: number;
  roomId?: string;
}

/**
 * Biriktirish oynasi — veb `attachment-sheet.tsx` ning tor ekran varianti:
 * tepada kamera tugmasi va shu suhbatdagi so'nggi 3 ta rasm (`size-20
 * rounded-xl`), ostida Galereya, Kamera, Hujjat va (o'qituvchi guruhida)
 * Vazifa plitkalari. Fayl tanlash platformaning o'z oynalari orqali.
 */
export function AttachmentSheet({ open, onClose, onPick, onAssignment, maxSizeMb, roomId }: AttachmentSheetProps) {
  const { t } = useTranslation("chat");
  const ds = useDs();
  const client = useQueryClient();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const recent = roomId
    ? (client.getQueryData<ChatMessage[]>(messageKeys.all(roomId)) ?? [])
        .filter((message) => message.attachment?.kind === "image" && message.attachment.url)
        .slice(-RECENT_LIMIT)
        .reverse()
    : [];

  function pick(files: PickedFile[], images: boolean) {
    if (!files.length) return;
    onClose();
    onPick(files, images);
  }

  async function handleTile(id: string) {
    if (id === "gallery") pick(await pickImages(), true);
    if (id === "camera") {
      const photo = await pickImage("camera");
      if (photo) pick([photo], true);
    }
    if (id === "document") pick(await pickDocuments(), false);
    if (id === "assignment") {
      onClose();
      onAssignment?.();
    }
  }

  async function pickRecent(message: ChatMessage) {
    const attachment = message.attachment;
    if (!attachment) return;
    setLoadingId(message.id);
    try {
      const blob = (await messageApi.downloadFile(message.id)) as Blob;
      const file = await writeBlobToCache(blob, attachment.name || "image.jpg");
      pick([{ uri: file.uri, name: attachment.name || "image.jpg", size: blob.size, mimeType: attachment.mimeType || blob.type || "image/jpeg" }], true);
    } catch {
      toast.error(t("attach.recentFailed"));
    } finally {
      setLoadingId(null);
    }
  }

  const tiles: Array<{ id: string; label: string; icon: IconName; tone: string }> = [
    { id: "gallery", label: t("attach.gallery"), icon: "folder", tone: "bg-brand-subtle text-brand" },
    { id: "camera", label: t("attach.camera"), icon: "photo-camera-fill", tone: "bg-accent-green-bg text-success" },
    { id: "document", label: t("attach.document"), icon: "assignment-check-fill", tone: "bg-accent-saffron-bg text-accent-saffron-fg" },
    ...(onAssignment ? [{ id: "assignment", label: t("attach.assignment"), icon: "assign" as IconName, tone: "bg-accent-violet-bg text-accent-violet-fg" }] : []),
  ];

  return (
    <Sheet variant="app" open={open} onClose={onClose} title={t("attach.title")} description={t("attach.sizeHint", { size: maxSizeMb })}>
      <View style={styles.body}>
        <View style={styles.recent}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("attach.camera")}
            onPress={() => void handleTile("camera")}
            style={({ pressed }) => [styles.shot, { backgroundColor: pressed ? ds.c.muted : ds.c.subtle }]}
          >
            <Icon name="photo-camera-fill" size={24} color={ds.c["ink-secondary"]} />
          </Pressable>
          {recent.map((message) => (
            <Pressable
              key={message.id}
              accessibilityRole="imagebutton"
              accessibilityLabel={message.attachment?.name ?? ""}
              disabled={loadingId !== null}
              onPress={() => void pickRecent(message)}
              style={[styles.shot, { backgroundColor: ds.c.subtle, opacity: loadingId === message.id ? 0.6 : 1 }]}
            >
              <Image source={{ uri: message.attachment?.url ?? "" }} style={styles.photo} resizeMode="cover" />
            </Pressable>
          ))}
        </View>

        <View style={styles.tiles}>
          {tiles.map((tile) => {
            const colors = toneColors(tile.tone, ds);
            return (
              <Pressable
                key={tile.id}
                accessibilityRole="button"
                onPress={() => void handleTile(tile.id)}
                style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
              >
                <View style={[styles.tileIcon, { backgroundColor: colors.bg }]}>
                  <Icon name={tile.icon} size={22} color={colors.fg ?? ds.c.ink} />
                </View>
                <DsText v="body-sm" numberOfLines={1}>
                  {tile.label}
                </DsText>
              </Pressable>
            );
          })}
        </View>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.8 },
  /* `-mt-0.5 pb-7.5` */
  body: { marginTop: -2, paddingBottom: 30 },
  recent: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  shot: { width: 80, height: 80, overflow: "hidden", borderRadius: dsRadius.xl, alignItems: "center", justifyContent: "center" },
  photo: { width: "100%", height: "100%" },
  /* `grid grid-cols-4 gap-3` */
  tiles: { flexDirection: "row", gap: 12 },
  tile: { flex: 1, alignItems: "center", gap: 6 },
  tileIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
});
