import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, Pressable, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useKeyboardState } from "react-native-keyboard-controller";
import { AtSign, Mic, Plus, SendHorizontal, Smile, X } from "lucide-react-native";
import type { ChatMessage, SendMessagePayload } from "@/shared/types";
import { AttachmentSheet } from "./attachment-sheet";
import { IconButton, MIN_TOUCH_SIZE, radius, Text, useTheme } from "@/shared/ui";

export interface MessageComposerProps {
  onSend: (payload: SendMessagePayload) => void;
  /** Biriktirma varag'idagi "Vazifa" plitkasi — faqat o'qituvchida beriladi. */
  onAssignment?: () => void;
  onTyping: () => void;
  replyTo: ChatMessage | null;
  onCancelReply: () => void;
  disabled?: boolean;
  /** Blok holati sababi — direct suhbat `pending`/`blocked` bo'lsa. */
  disabledReason?: string;
}

/** "Yozmoqda" signali shu oraliqda bir martadan ko'p yuborilmaydi. */
const TYPING_THROTTLE_MS = 2500;

/**
 * Xabar yozish paneli.
 *
 * Balandligi matn bilan birga o'sadi, lekin cheklangan: aks holda uzun xabar
 * yozayotganda butun ekranni egallab, suhbatning o'zi ko'rinmay qoladi.
 */
export function MessageComposer({
  onSend,
  onAssignment,
  onTyping,
  replyTo,
  onCancelReply,
  disabled = false,
  disabledReason,
}: MessageComposerProps) {
  const { t } = useTranslation("mobile");
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  /*
   * Klaviatura ochiq bo'lsa pastki xavfsiz zona QO'SHILMAYDI.
   *
   * Klaviatura tizim navigatsiya chizig'ini o'zi bekitadi, shuning uchun
   * unga qo'shimcha `insets.bottom` berilsa, kompozitor bilan klaviatura
   * orasida bo'sh tasma paydo bo'ladi.
   */
  const keyboardVisible = useKeyboardState((state) => state.isVisible);
  const bottomInset = keyboardVisible ? 8 : insets.bottom > 0 ? insets.bottom : 8;
  const [text, setText] = useState("");
  const inputRef = useRef<TextInput>(null);
  const [attachOpen, setAttachOpen] = useState(false);
  const [lastTypingAt, setLastTypingAt] = useState(0);

  const canSend = text.trim().length > 0 && !disabled;

  function handleChange(value: string) {
    setText(value);
    const now = Date.now();
    if (now - lastTypingAt > TYPING_THROTTLE_MS) {
      setLastTypingAt(now);
      onTyping();
    }
  }

  function send() {
    const value = text.trim();
    if (!value) return;
    onSend({
      text: value,
      replyTo: replyTo
        ? { author: replyTo.senderName || "Xabar", text: replyTo.text }
        : undefined,
    });
    setText("");
    onCancelReply();
  }

  if (disabled && disabledReason) {
    return (
      <View
        style={[
          styles.blocked,
          {
            backgroundColor: palette.surface,
            borderTopColor: palette.border,
            paddingBottom: bottomInset + 4,
          },
        ]}
      >
        <Text variant="caption" tone="muted" style={styles.blockedText}>
          {disabledReason}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: palette.surface,
          borderTopColor: palette.border,
          paddingBottom: bottomInset,
        },
      ]}
    >
      {replyTo ? (
        <View style={[styles.replyBar, { backgroundColor: palette["primary-tint"] }]}>
          <View style={[styles.replyAccent, { backgroundColor: palette["primary-text"] }]} />
          <View style={styles.replyBody}>
            <Text variant="caption" tone="brand" numberOfLines={1}>
              {replyTo.senderName || "Xabar"}
            </Text>
            <Text variant="caption" tone="muted" numberOfLines={1}>
              {replyTo.text}
            </Text>
          </View>
          <IconButton accessibilityLabel={t("message.javobni_bekor_qilish")} onPress={onCancelReply}>
            <X size={18} color={palette["muted-foreground"]} />
          </IconButton>
        </View>
      ) : null}

      <View style={styles.row}>
        {/*
          * "+" — biriktirma varag'ini ochadi: galereya, kamera, hujjat va
          * o'qituvchida vazifa. Vebdagi kabi.
          */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("message.biriktirish")}
          onPress={() => setAttachOpen(true)}
          style={({ pressed }) => [
            styles.circle48,
            { backgroundColor: palette["surface-subtle"], opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Plus size={22} color={palette.foreground} />
        </Pressable>

        {/*
          * Maydon — vebdagi kabi ichida @ va emoji. O'lchamlar veb
          * DOM'idan: 56 balandlik, radius 24, fon `--bg-canvas`,
          * chegara 1px, bo'shliq 12/20, oraliq 8.
          */}
        <View
          style={[
            styles.inputWrap,
            { backgroundColor: palette.background, borderColor: palette.border },
          ]}
        >
          <TextInput
            ref={inputRef}
            style={[styles.input, { color: palette.foreground }]}
            placeholder={t("message.xabar_yozing")}
            placeholderTextColor={palette["muted-foreground"]}
            value={text}
            onChangeText={handleChange}
            multiline
            // iOS'da `multiline` bilan `blurOnSubmit=false` bo'lmasa Enter
            // klaviaturani yopib yuboradi.
            blurOnSubmit={false}
            accessibilityLabel={t("message.xabar_matni")}
            maxLength={4000}
          />
          {/* @ — vebdagi kabi matnga "@" qo'shadi. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("message.eslatish")}
            hitSlop={8}
            onPress={() => {
              handleChange(`${text}@`);
              inputRef.current?.focus();
            }}
            style={styles.inlineIcon}
          >
            <AtSign size={20} color={palette["muted-foreground"]} />
          </Pressable>
          {/*
            * Emoji — telefon klaviaturasida emoji bo'limi bor, shuning
            * uchun tugma maydonni ochadi va foydalanuvchi o'sha yerdan
            * tanlaydi.
            */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("message.emoji")}
            hitSlop={8}
            onPress={() => inputRef.current?.focus()}
            style={styles.inlineIcon}
          >
            <Smile size={20} color={palette["muted-foreground"]} />
          </Pressable>
        </View>

        {/*
          * Matn bo'lsa YUBORISH (44), bo'lmasa MIKROFON (48) — vebdagi
          * kabi. Ovozli xabar mobilda hali ulanmagan (xabar moduli
          * vebdan orqada), mikrofon hozircha ko'rinish uchun.
          */}
        {canSend ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("message.yuborish")}
            onPress={send}
            style={({ pressed }) => [
              styles.send,
              { backgroundColor: palette.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <SendHorizontal size={20} color={palette["primary-foreground"]} />
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("message.ovozli_xabar")}
            style={({ pressed }) => [
              styles.circle48,
              { backgroundColor: palette.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Mic size={22} color={palette["primary-foreground"]} />
          </Pressable>
        )}
      </View>

      <AttachmentSheet
        open={attachOpen}
        onClose={() => setAttachOpen(false)}
        // Fayl alohida xabar bo'lib ketadi — vebdagi kabi, matnsiz.
        onPick={(file) => onSend({ text: "", file })}
        onAssignment={onAssignment}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 8, paddingHorizontal: 10, gap: 8 },
  row: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  /*
   * O'lchamlar veb DOM'idan (390px): o'ram 56 balandlik, radius 24,
   * fon `--bg-canvas`, chegara 1px, ichki bo'shliq 12/20, matn 16/24.
   *
   * Ilgari radius 16, chegara hairline va matn 15px edi.
   */
  /*
   * Maydon o'rami — veb DOM'idan: 56 balandlik, radius 24, chegara 1px,
   * bo'shliq 12/20, oraliq 8. Matnning o'zi shaffof, fon o'ramda.
   */
  inputWrap: {
    flex: 1,
    minHeight: 56,
    maxHeight: 130,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    borderRadius: radius["2xl"],
    borderWidth: 1,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    paddingTop: Platform.OS === "ios" ? 16 : 12,
    paddingBottom: Platform.OS === "ios" ? 16 : 12,
    fontSize: 16,
    lineHeight: 24,
  },
  /* Veb: @ va emoji tugmalari 28x28. */
  inlineIcon: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  /* Veb: "+" va mikrofon `size-12` — 48x48. */
  circle48: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  send: {
    width: MIN_TOUCH_SIZE,
    height: MIN_TOUCH_SIZE,
    borderRadius: MIN_TOUCH_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  replyBar: { flexDirection: "row", alignItems: "center", borderRadius: radius.sm, overflow: "hidden" },
  replyAccent: { width: 3, alignSelf: "stretch" },
  replyBody: { flex: 1, paddingHorizontal: 10, paddingVertical: 6, gap: 2 },
  blocked: { borderTopWidth: StyleSheet.hairlineWidth, padding: 16 },
  blockedText: { textAlign: "center" },
});
