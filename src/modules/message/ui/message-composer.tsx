import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, Pressable, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useKeyboardState } from "react-native-keyboard-controller";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from "expo-audio";
import { AtSign, Mic, Plus, SendHorizontal, Smile, Trash2, X } from "lucide-react-native";
import { toUploadFile } from "@/shared/lib/file-picker";
import type { ChatMessage, SendMessagePayload } from "@/shared/types";
import { AttachmentSheet } from "./attachment-sheet";
import { IconButton, MIN_TOUCH_SIZE, radius, Text, toast, useTheme } from "@/shared/ui";

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
/** `mm:ss` — vebdagi `formatDuration` kabi. */
function formatSeconds(total: number): string {
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

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
  const { t: tc } = useTranslation("chat");

  /*
   * OVOZLI XABAR — veb `message-composer.tsx` dagi oqim:
   * mikrofon bosiladi -> yozish boshlanadi va kompozitor o'rnini yozish
   * lentasi egallaydi -> "yuborish" yoki "bekor qilish".
   * Backendga fayl, `duration_ms` (va vebda to'lqin shakli) ketadi —
   * qayta ko'chirilgan `message.api.ts` buni `voice` maydoni orqali qiladi.
   */
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const secondsRef = useRef(0);

  useEffect(() => {
    if (!recording) return undefined;
    const timer = setInterval(() => {
      secondsRef.current += 1;
      setSeconds(secondsRef.current);
    }, 1000);
    return () => clearInterval(timer);
  }, [recording]);

  async function startRecording() {
    if (recording) return;
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      // Jim qolmaydi — vebdagi kabi foydalanuvchiga aytiladi.
      toast.error(tc("composer.micDenied"));
      return;
    }
    try {
      // iOS'da yozish uchun audio sessiya rejimi yoqilishi SHART.
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      // Hisoblagich shu yerda nolga qaytadi — effekt ichida emas.
      secondsRef.current = 0;
      setSeconds(0);
      setRecording(true);
    } catch {
      toast.error(tc("composer.micDenied"));
    }
  }

  async function stopRecording(cancel: boolean) {
    setRecording(false);
    try {
      await recorder.stop();
    } finally {
      await setAudioModeAsync({ allowsRecording: false }).catch(() => undefined);
    }
    const uri = recorder.uri;
    if (cancel || !uri) return;
    const file = toUploadFile({
      uri,
      name: `voice-${Date.now()}.m4a`,
      mimeType: "audio/mp4",
      size: 0,
    });
    onSend({
      text: "",
      // Vebdagi kabi kamida 1 soniya — juda qisqa yozuv ham yuboriladi.
      voice: { file, durationMs: Math.max(1000, secondsRef.current * 1000) },
    });
  }
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
      replyTo: replyTo ? { author: replyTo.senderName || "Xabar", text: replyTo.text } : undefined,
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
          <IconButton
            accessibilityLabel={t("message.javobni_bekor_qilish")}
            onPress={onCancelReply}
          >
            <X size={18} color={palette["muted-foreground"]} />
          </IconButton>
        </View>
      ) : null}

      {recording ? (
        /*
         * Yozish lentasi — veb: radius 24, chegara 1px, fon `--bg-canvas`,
         * bo'shliq 16/12, oraliq 12. Chapda bekor qilish (40), qizil
         * nuqta, vaqt, izoh, o'ngda yuborish (44).
         */
        <View
          style={[
            styles.recordBar,
            { backgroundColor: palette.background, borderColor: palette.border },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={tc("composer.recordCancel")}
            onPress={() => void stopRecording(true)}
            style={styles.recordCancel}
          >
            <Trash2 size={19} color={palette["destructive-strong"]} />
          </Pressable>
          <View style={[styles.recordDot, { backgroundColor: palette.destructive }]} />
          <Text variant="label" style={styles.recordTime}>
            {formatSeconds(seconds)}
          </Text>
          <Text variant="caption" tone="muted" numberOfLines={1} style={styles.recordHint}>
            {tc("composer.recordHint")}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={tc("composer.recordSend")}
            onPress={() => void stopRecording(false)}
            style={({ pressed }) => [
              styles.send,
              { backgroundColor: palette.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <SendHorizontal size={19} color={palette["primary-foreground"]} />
          </Pressable>
        </View>
      ) : (
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

          {/* Matn bo'lsa YUBORISH (44), bo'lmasa MIKROFON (48) — vebdagi kabi. */}
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
              onPress={() => void startRecording()}
              style={({ pressed }) => [
                styles.circle48,
                { backgroundColor: palette.primary, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Mic size={22} color={palette["primary-foreground"]} />
            </Pressable>
          )}
        </View>
      )}

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
  wrapper: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    paddingHorizontal: 10,
    gap: 8,
  },
  /* Veb: `items-end gap-3` — oraliq 12. */
  row: { flexDirection: "row", alignItems: "flex-end", gap: 12 },
  recordBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius["2xl"],
    borderWidth: 1,
  },
  recordCancel: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  recordDot: { width: 10, height: 10, borderRadius: radius.full },
  recordTime: { fontVariant: ["tabular-nums"] },
  recordHint: { flex: 1, textAlign: "center" },
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
  replyBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.sm,
    overflow: "hidden",
  },
  replyAccent: { width: 3, alignSelf: "stretch" },
  replyBody: { flex: 1, paddingHorizontal: 10, paddingVertical: 6, gap: 2 },
  blocked: { borderTopWidth: StyleSheet.hairlineWidth, padding: 16 },
  blockedText: { textAlign: "center" },
});
