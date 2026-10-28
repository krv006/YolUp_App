import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { messageApi } from "@/modules/message";
import type { Conversation } from "@/shared/types";
import { ConfirmDialog, DsText, dsRadius, Icon, toast, useDs, type IconName } from "@/shared/ui";
import { useLeaveConversation, useMuteConversation, usePinConversation } from "../model/use-conversations";

export interface ConversationActionsFocus {
  /** Qatorning ekrandagi o'rni (`measureInWindow`). */
  rect: { top: number; left: number; width: number; height: number };
  /** Ko'tarilgan qatorda chiziladigan tarkib — o'sha `ConversationRowBody`. */
  content: ReactNode;
}

export interface ConversationActionsSheetProps {
  conversation: Conversation | null;
  focus: ConversationActionsFocus | null;
  onClose: () => void;
}

/** Menyu: 4 qator × 48 + ajratgich — joylashtirishda balandligi kerak. */
const MENU_WIDTH = 250;
const MENU_HEIGHT = 216;

/**
 * Uzoq bosishdagi amallar (M6.5–6.7) — veb `conversation-actions-sheet.tsx`
 * ning telefon varianti (`focusMenu`): xira fon, qator o'z joyida
 * "ko'tarilgan" oq karta bo'lib turadi, ostida (joy bo'lmasa ustida)
 * qadash, ovozsiz qilish, o'qilgan deb belgilash va o'chirish. O'chirish
 * markaziy tasdiqlash oynasi orqali.
 */
export function ConversationActionsSheet({ conversation, focus, onClose }: ConversationActionsSheetProps) {
  const { t } = useTranslation("chat");
  const ds = useDs();
  const { height: screenHeight } = useWindowDimensions();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const pinRoom = usePinConversation();
  const muteRoom = useMuteConversation();
  const leaveRoom = useLeaveConversation();

  const isPinned = Boolean(conversation?.isPinned);
  const isMuted = Boolean(conversation?.isMuted);

  const actions: Array<{ id: string; icon: IconName; label: string; run: () => void }> = [
    {
      id: "pin",
      icon: "pin",
      label: isPinned ? t("actions.unpin") : t("actions.pin"),
      run: () => conversation && pinRoom.mutate({ roomId: conversation.id, pinned: !isPinned }),
    },
    {
      id: "mute",
      icon: "notifications-off",
      label: isMuted ? t("actions.unmute") : t("actions.mute"),
      run: () => conversation && muteRoom.mutate({ roomId: conversation.id, muted: !isMuted }),
    },
    {
      id: "read",
      icon: "done-all",
      label: t("actions.markRead"),
      run: () => conversation && void messageApi.markRead(conversation.id),
    },
  ];

  const open = Boolean(conversation && focus) && !confirmDelete;
  const below = focus ? focus.rect.top + focus.rect.height + 15 + MENU_HEIGHT < screenHeight : true;
  const menuTop = focus
    ? below
      ? focus.rect.top + focus.rect.height + 15
      : Math.max(12, focus.rect.top - MENU_HEIGHT - 15)
    : 0;

  return (
    <>
      <Modal visible={open} transparent animationType="none" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
        {open && focus ? (
          <Animated.View entering={FadeIn.duration(140)} exiting={FadeOut.duration(100)} style={[styles.fill, { backgroundColor: ds.c.scrim }]}>
            <Pressable accessibilityRole="button" accessibilityLabel={t("actions.cancel")} style={StyleSheet.absoluteFill} onPress={onClose} />
            {/* `rounded-xl bg-surface px-4 shadow-xl` — qator nusxasi o'z joyida */}
            <View
              pointerEvents="none"
              style={[
                styles.focus,
                { top: focus.rect.top, left: focus.rect.left, width: focus.rect.width, height: focus.rect.height },
                { backgroundColor: ds.c.surface, boxShadow: ds.shadow.xl },
              ]}
            >
              {focus.content}
            </View>
            <View style={[styles.menu, { top: menuTop, backgroundColor: ds.c.surface, boxShadow: ds.shadow.xl }]}>
              {actions.map((action) => (
                <Pressable
                  key={action.id}
                  accessibilityRole="menuitem"
                  onPress={() => {
                    action.run();
                    onClose();
                  }}
                  style={({ pressed }) => [styles.item, pressed && { backgroundColor: ds.c.subtle }]}
                >
                  <Icon name={action.icon} size={22} color={ds.c.ink} />
                  <DsText>{action.label}</DsText>
                </Pressable>
              ))}
              <View style={[styles.divider, { backgroundColor: ds.c.line }]} />
              <Pressable
                accessibilityRole="menuitem"
                onPress={() => setConfirmDelete(true)}
                style={({ pressed }) => [styles.item, pressed && { backgroundColor: ds.c["danger-bg"] }]}
              >
                <Icon name="logout" size={22} color={ds.c["error-text"]} />
                <DsText c="error-text">{t("actions.delete")}</DsText>
              </Pressable>
            </View>
          </Animated.View>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={(next) => {
          setConfirmDelete(next);
          if (!next) onClose();
        }}
        icon="trash"
        title={t("actions.deleteTitle")}
        description={t("actions.deleteDescription")}
        confirmLabel={t("actions.confirmDelete")}
        cancelLabel={t("actions.cancel")}
        onConfirm={() => {
          if (conversation)
            leaveRoom.mutate(conversation.id, {
              onSuccess: () => toast.success(t("actions.deleted")),
              onError: (error: Error) => toast.error(error.message),
            });
          setConfirmDelete(false);
          onClose();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  focus: { position: "absolute", flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, borderRadius: dsRadius.xl },
  /* `right-4 w-62.5 rounded-xl bg-surface shadow-xl` */
  menu: { position: "absolute", right: 16, width: MENU_WIDTH, overflow: "hidden", borderRadius: dsRadius.xl },
  /* `h-12 gap-3 px-4` */
  item: { height: 48, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16 },
  divider: { height: 1 },
});
