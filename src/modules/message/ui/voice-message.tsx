import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useEventListener } from "expo";
import { useAudioPlayer, useAudioPlayerStatus, type AudioSource } from "expo-audio";
import { Pause, Play } from "lucide-react-native";
import { tokenStorage } from "@/shared/api";
import { env } from "@/shared/config";
import type { MessageAttachment } from "@/shared/types";
import { dsAlpha, DsText, toast, useDs } from "@/shared/ui";
import { messageEndpoints } from "../api/message.endpoints";

/** Vebdagi to'lqin shakli: 32 ustun, `6 + (i*5) % 16`; tor ekranda birinchi 24 tasi. */
const BARS = Array.from({ length: 32 }, (_, index) => 6 + ((index * 5) % 16));
const MOBILE_BARS = 24;

/** Backend bergan to'lqin (`waveform`) 32 ustunga keltiriladi — veb `barsFrom`. */
function barsFrom(waveform: number[] | undefined): number[] {
  if (!waveform?.length) return BARS;
  const peak = Math.max(...waveform, 1);
  return Array.from({ length: BARS.length }, (_, index) => {
    const value = waveform[Math.floor((index / BARS.length) * waveform.length)] ?? 0;
    return 6 + Math.round((value / peak) * 16);
  });
}

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
  const ds = useDs();
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const [loaded, setLoaded] = useState(false);

  /*
   * Ijro xatosi (masalan iOS: vebdagi Chrome yozgan WebM/Opus — AVFoundation
   * uni ocholmaydi, "Cannot Open"). Usiz tugma jim qolardi. Xato `status`
   * ga `error` bo'lib keladi (turida yo'q); manba qayta bosilganda yana beriladi.
   */
  useEventListener(player, "playbackStatusUpdate", (update) => {
    if (!(update as { error?: string }).error) return;
    toast.error(t("attachment.voiceFailed"));
    setLoaded(false);
  });

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
  const total = Math.round(status.currentTime || status.duration || (attachment.durationMs ?? 0) / 1000);
  const bars = barsFrom(attachment.waveform);
  const played = outgoing ? ds.c["on-action"] : ds.c.action;
  const rest = outgoing ? dsAlpha(ds.c["on-action"], 0.4) : dsAlpha(ds.c.action, 0.3);

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={status.playing ? t("attachment.voicePause") : t("attachment.voicePlay")}
        onPress={toggle}
        style={[styles.button, { backgroundColor: outgoing ? dsAlpha("#ffffff", 0.2) : ds.c.action }]}
      >
        {status.playing ? (
          <Pause size={16} color={ds.c["on-action"]} fill={ds.c["on-action"]} />
        ) : (
          <Play size={16} color={ds.c["on-action"]} fill={ds.c["on-action"]} />
        )}
      </Pressable>

      <View style={styles.bars} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {bars.slice(0, MOBILE_BARS).map((height, index) => (
          <View key={index} style={[styles.bar, { height, backgroundColor: index / bars.length <= progress ? played : rest }]} />
        ))}
      </View>

      <DsText v="label-strong" numeric style={{ color: outgoing ? dsAlpha(ds.c["on-action"], 0.8) : ds.c.ink }}>
        {formatDuration(total)}
      </DsText>
    </View>
  );
}

function formatDuration(total: number): string {
  const minutes = Math.floor(total / 60);
  const seconds = Math.round(total % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  /* `min-w-[220px] items-center gap-2.75 py-0.5` */
  row: { minWidth: 220, flexDirection: "row", alignItems: "center", gap: 11, paddingVertical: 2 },
  /* `size-8.5 rounded-full` */
  button: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  /* ustun `w-[3px]`, oraliq `gap-0.5` */
  bars: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 2, overflow: "hidden" },
  bar: { width: 3, borderRadius: 2 },
});
