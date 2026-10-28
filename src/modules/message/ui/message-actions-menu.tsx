import { useTranslation } from "react-i18next";
import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import type { ChatMessage, MessageCapabilities } from "@/shared/types";
import { DsText, dsRadius, Icon, toast, useDs, type IconName } from "@/shared/ui";
import { useChatUiStore } from "../model/chat-ui.store";
import { MessageBubbleCard } from "./message-bubble";

/** Uzoq bosilgan pufakning ekrandagi o'rni (`measureInWindow`). */
export interface MessageMenuAnchor {
  top: number;
  left: number;
  width: number;
  height: number;
  outgoing: boolean;
}

export interface MessageActionsMenuProps {
  message: ChatMessage | null;
  anchor: MessageMenuAnchor | null;
  onClose: () => void;
  onReply: (message: ChatMessage) => void;
  onEdit: (message: ChatMessage) => void;
  onDelete: (message: ChatMessage, scope: "me" | "everyone") => void;
  onReact: (message: ChatMessage, emoji: string) => void;
  onForward?: (message: ChatMessage) => void;
  /** `pinned` — xabar hozir qadalganmi (`useChat().pinMessage` shu ma'noda). */
  onPin?: (message: ChatMessage, pinned: boolean) => void;
  pinnedIds?: string[];
  capabilities?: MessageCapabilities;
}

const QUICK_REACTIONS = ["👍", "❤️", "🔥", "😂", "😮", "🙏"];
const EDGE_GAP = 12;
const PILL_HEIGHT = 50;
const PILL_GAP = 15;
const MENU_GAP = 23;
const MENU_ITEM = 48;
const MENU_WIDTH = 250;
const BOTTOM_GAP = 27;

/**
 * Xabar amallari — veb `message-actions-menu.tsx` ning telefon varianti
 * (`focus`): xira fon, tepada 6 ta tezkor reaksiya, o'rtada pufakning
 * "ko'tarilgan" nusxasi, ostida amallar ro'yxati (javob, nusxa, tahrir,
 * qadash, uzatish, tanlash va o'chirish). Joylashuv vebdagi hisob bilan:
 * hammasi ekranga sig'masa yuqoriga suriladi.
 */
export function MessageActionsMenu({
  message,
  anchor,
  onClose,
  onReply,
  onEdit,
  onDelete,
  onReact,
  onForward,
  onPin,
  pinnedIds = [],
  capabilities,
}: MessageActionsMenuProps) {
  const { t } = useTranslation("chat");
  const ds = useDs();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const startSelection = useChatUiStore((state) => state.startSelection);

  const open = Boolean(message);
  const rights: MessageCapabilities = message?.capabilities ?? capabilities ?? { reply: true, edit: false, delete: true, react: true };
  const isPinned = message ? pinnedIds.includes(message.id) : false;

  const items: Array<{ id: string; icon: IconName; label: string; run: (target: ChatMessage) => void }> = message
    ? [
        { id: "reply", icon: "chat" as IconName, label: t("actionsMenu.reply"), run: onReply, hidden: rights.reply === false },
        {
          id: "copy",
          icon: "assign" as IconName,
          label: t("actionsMenu.copy"),
          run: (target: ChatMessage) => {
            void Clipboard.setStringAsync(target.text);
            toast.success(t("actionsMenu.copied"));
          },
          hidden: !message.text,
        },
        { id: "edit", icon: "edit" as IconName, label: t("actionsMenu.edit"), run: onEdit, hidden: !rights.edit },
        {
          id: "pin",
          icon: "pin" as IconName,
          label: isPinned ? t("actionsMenu.unpin") : t("actionsMenu.pin"),
          run: (target: ChatMessage) => onPin?.(target, isPinned),
          hidden: !rights.pin || !onPin,
        },
        {
          id: "forward",
          icon: "send" as IconName,
          label: t("actionsMenu.forward"),
          run: (target: ChatMessage) => (onForward ? onForward(target) : toast.info(t("actions.notAvailable"))),
          hidden: rights.forward === false,
        },
        { id: "select", icon: "check-circle" as IconName, label: t("actionsMenu.select"), run: (target: ChatMessage) => startSelection(target.id), hidden: false },
      ].filter((item) => !item.hidden)
    : [];

  const deleteCount = (rights.delete === false ? 0 : 1) + (rights.deleteEveryone ? 1 : 0);
  const menuHeight = (items.length + deleteCount) * MENU_ITEM + (deleteCount ? 1 : 0) + 12;
  const box = anchor ?? { top: screenHeight / 3, left: 16, width: screenWidth - 32, height: 0, outgoing: true };
  const total = PILL_HEIGHT + PILL_GAP + box.height + MENU_GAP + menuHeight;
  // Vebdagi chekkalar + tizim panellari (holat paneli va imo-ishora chizig'i).
  const maxTop = screenHeight - BOTTOM_GAP - insets.bottom - total;
  const pillTop = Math.max(EDGE_GAP + insets.top, Math.min(box.top - PILL_GAP - PILL_HEIGHT, maxTop));
  const bubbleTop = pillTop + PILL_HEIGHT + PILL_GAP;
  const menuTop = bubbleTop + box.height + MENU_GAP;
  const menuLeft = Math.max(EDGE_GAP, box.outgoing ? box.left + box.width - MENU_WIDTH : box.left);

  function react(emoji: string) {
    if (!message) return;
    if (rights.react !== false) onReact(message, emoji);
    else toast.info(t("actions.notAvailable"));
    onClose();
  }

  return (
    <Modal visible={open} transparent animationType="none" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      {message ? (
        <Animated.View entering={FadeIn.duration(140)} exiting={FadeOut.duration(100)} style={[styles.fill, { backgroundColor: ds.c.scrim }]}>
          <Pressable accessibilityRole="button" accessibilityLabel={t("actionsMenu.closeAria")} style={StyleSheet.absoluteFill} onPress={onClose} />

          {/* `rounded-full bg-surface px-3 shadow-xl`, kengligi pufakdek */}
          <View
            style={[
              styles.pill,
              { top: pillTop, left: box.left, width: Math.max(box.width, 264), backgroundColor: ds.c.surface, boxShadow: ds.shadow.xl },
              box.outgoing ? { left: box.left + box.width - Math.max(box.width, 264) } : null,
            ]}
          >
            {QUICK_REACTIONS.map((emoji) => (
              <Pressable
                key={emoji}
                accessibilityRole="button"
                onPress={() => react(emoji)}
                style={({ pressed }) => [styles.emoji, pressed && { backgroundColor: ds.c.subtle }]}
              >
                <DsText style={styles.emojiText}>{emoji}</DsText>
              </Pressable>
            ))}
          </View>

          {anchor ? (
            <View pointerEvents="none" style={[styles.lifted, { top: bubbleTop, left: anchor.left, width: anchor.width }]}>
              <MessageBubbleCard message={message} outgoing={anchor.outgoing} fill />
            </View>
          ) : null}

          <View
            accessibilityRole="menu"
            style={[styles.menu, { top: menuTop, left: menuLeft, backgroundColor: ds.c.surface, boxShadow: ds.shadow.xl }]}
          >
            {items.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="menuitem"
                onPress={() => {
                  item.run(message);
                  onClose();
                }}
                style={({ pressed }) => [styles.item, pressed && { backgroundColor: ds.c.subtle }]}
              >
                <Icon name={item.icon} size={22} color={ds.c.ink} />
                <DsText>{item.label}</DsText>
              </Pressable>
            ))}
            {deleteCount ? <View style={[styles.divider, { backgroundColor: ds.c.line }]} /> : null}
            {rights.delete === false ? null : (
              <Pressable
                accessibilityRole="menuitem"
                onPress={() => {
                  onDelete(message, "me");
                  onClose();
                }}
                style={({ pressed }) => [styles.item, pressed && { backgroundColor: ds.c["danger-bg"] }]}
              >
                <Icon name="logout" size={22} color={ds.c["error-text"]} />
                <DsText c="error-text">{t("actionsMenu.deleteForMe")}</DsText>
              </Pressable>
            )}
            {rights.deleteEveryone ? (
              <Pressable
                accessibilityRole="menuitem"
                onPress={() => {
                  onDelete(message, "everyone");
                  onClose();
                }}
                style={({ pressed }) => [styles.item, pressed && { backgroundColor: ds.c["danger-bg"] }]}
              >
                <Icon name="logout" size={22} color={ds.c["error-text"]} />
                <DsText c="error-text">{t("actionsMenu.deleteForEveryone")}</DsText>
              </Pressable>
            ) : null}
          </View>
        </Animated.View>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  pill: { position: "absolute", height: PILL_HEIGHT, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, borderRadius: PILL_HEIGHT / 2 },
  emoji: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  emojiText: { fontSize: 22, lineHeight: 28 },
  lifted: { position: "absolute" },
  /* `rounded-xl bg-surface py-1.5 shadow-xl` */
  menu: { position: "absolute", width: MENU_WIDTH, overflow: "hidden", paddingVertical: 6, borderRadius: dsRadius.xl },
  /* `h-12 gap-3 px-4 text-body` */
  item: { height: MENU_ITEM, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16 },
  divider: { height: 1 },
});
