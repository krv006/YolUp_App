import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useAudioPlayer, useAudioPlayerStatus, type AudioSource } from "expo-audio";
import { Pause, Play } from "lucide-react-native";
import { tokenStorage } from "@/shared/api";
import { env } from "@/shared/config";
import type { MessageAttachment } from "@/shared/types";
import { radius, Text, toast, useTheme } from "@/shared/ui";
import { messageEndpoints } from "../api/message.endpoints";

/** Vebdagi to'lqin shakli bilan bir xil: 32 ustun, `6 + (i*5) % 16`. */
const BARS = Array.from({ length: 32 }, (_, index) => 6 + ((index * 5) % 16));

/**
 * Ovozli xabar pleyeri — veb `voice-message.tsx` ning porti.
 *
 * ┌─ NEGA FAYL OLDINDAN YUKLANMAYDI ──────────────────────────────────────┐
 * │ Vebda audio `messageApi.downloadFile` bilan Blob qilib olinadi, keyin │
 * │ `new Audio(objectURL)` o'ynatadi — brauzerda boshqa yo'l yo'q, chunki │
 * │ `<audio>` so'rovga sarlavha qo'sha olmaydi. `expo-audio` esa manbaga  │
 * │ `headers` beradi, shuning uchun fayl token bilan to'g'ridan-to'g'ri   │
 * │ OQIM sifatida o'ynatiladi: xotiraga butunlay yuklanmaydi.             │
 * └───────────────────────────────────────────────────────────────────────┘
 *
 * Manba faqat BIRINCHI bosilganda beriladi: suhbatdagi har ovozli xabar
 * ekranga chiqishi bilan yuklana boshlamasligi uchun.
 */
export function VoiceMessage({
  attachment,
  outgoing = false,
}: {
  attachment: MessageAttachment;
  outgoing?: boolean;
}) {
  const { t } = useTranslation("chat");
  const { palette } = useTheme();
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const [loaded, setLoaded] = useState(false);

  function toggle() {
    try {
      if (!loaded) {
        const source: AudioSource = {
          uri: `${env.apiUrl}${messageEndpoints.file(attachment.messageId)}`,
          headers: { Authorization: `Bearer ${tokenStorage.getAccessToken() ?? ""}` },
        };
        player.replace(source);
        setLoaded(true);
        player.play();
        return;
      }
      if (status.playing) {
        player.pause();
      } else {
        // Oxirigacha eshitilgan bo'lsa — boshidan.
        if (status.duration > 0 && status.currentTime >= status.duration - 0.2) {
          void player.seekTo(0);
        }
        player.play();
      }
    } catch {
      toast.error(t("attachment.voiceFailed"));
    }
  }

  const progress = status.duration > 0 ? status.currentTime / status.duration : 0;
  const total = Math.round(status.currentTime || status.duration);

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={status.playing ? t("attachment.voicePause") : t("attachment.voicePlay")}
        onPress={toggle}
        style={[
          styles.button,
          { backgroundColor: outgoing ? "rgba(255, 255, 255, 0.2)" : palette.primary },
        ]}
      >
        {status.playing ? (
          <Pause size={18} color={palette["primary-foreground"]} />
        ) : (
          <Play size={18} color={palette["primary-foreground"]} />
        )}
      </Pressable>

      <View style={styles.bars} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {BARS.map((height, index) => {
          const played = index / BARS.length <= progress;
          const color = played
            ? outgoing
              ? palette["primary-foreground"]
              : palette.primary
            : outgoing
              ? "rgba(255, 255, 255, 0.4)"
              : palette.muted;
          return <View key={index} style={[styles.bar, { height, backgroundColor: color }]} />;
        })}
      </View>

      <Text
        variant="caption"
        style={[
          styles.duration,
          { color: outgoing ? "rgba(255, 255, 255, 0.8)" : palette["muted-foreground"] },
        ]}
      >
        {formatDuration(total)}
      </Text>
    </View>
  );
}

function formatDuration(total: number): string {
  const minutes = Math.floor(total / 60);
  const seconds = Math.round(total % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  /* Veb: `min-w-[220px] items-center gap-3`. */
  row: { minWidth: 220, flexDirection: "row", alignItems: "center", gap: 12 },
  button: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  /* Veb: ustunlar 3px eni, oraliq 3px. */
  bars: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 3, overflow: "hidden" },
  bar: { width: 3, borderRadius: radius.full },
  duration: { fontVariant: ["tabular-nums"] },
});
