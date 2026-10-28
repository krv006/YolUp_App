import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { DsText, dsRadius, Icon, useDs } from "@/shared/ui";
import { messageApi } from "../api/message.api";
import { messageKeys } from "../model/message.keys";

export interface PinnedMessageBarProps {
  roomId: string;
  canUnpin?: boolean;
  onUnpin?: (messageId: string) => void;
  /** `workspace` — guruh tablari ostida (`mt-3`), aks holda sarlavha ostida (`mt-4`). */
  variant?: "default" | "workspace";
}

/**
 * Qadalgan xabar — veb `pinned-message-bar.tsx` ning tor ekran varianti:
 * `mx-4 h-12 rounded-xl bg-surface pr-2 pl-4 gap-3`, chapda ko'k qadoq,
 * o'ngda olib tashlash tugmasi.
 */
export function PinnedMessageBar({ roomId, canUnpin = true, onUnpin, variant = "default" }: PinnedMessageBarProps) {
  const { t } = useTranslation("chat");
  const ds = useDs();
  const pinned = useQuery({
    queryKey: messageKeys.pinned(roomId),
    queryFn: ({ signal }) => messageApi.getPinned(roomId, { signal }),
    enabled: Boolean(roomId),
  });

  const current = pinned.data?.[0];
  if (!current) return null;

  return (
    <View style={[styles.bar, { marginTop: variant === "workspace" ? 12 : 16, backgroundColor: ds.c.surface }]}>
      <Icon name="pin" size={18} color={ds.c.brand} />
      <DsText v="body-sm" numberOfLines={1} style={styles.text}>
        {current.text || t("pinned.attachment")}
      </DsText>
      {canUnpin ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("pinned.removeAria")}
          onPress={() => onUnpin?.(current.messageId)}
          style={({ pressed }) => [styles.close, pressed && { backgroundColor: ds.c.subtle }]}
        >
          <Icon name="close" size={18} color={ds.c["ink-secondary"]} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { marginHorizontal: 16, height: 48, flexDirection: "row", alignItems: "center", gap: 12, paddingLeft: 16, paddingRight: 8, borderRadius: dsRadius.xl },
  text: { flex: 1, minWidth: 0 },
  close: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
});
