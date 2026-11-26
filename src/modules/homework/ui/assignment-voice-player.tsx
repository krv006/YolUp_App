import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useEventListener } from "expo";
import { useAudioPlayer, useAudioPlayerStatus, type AudioSource } from "expo-audio";
import { tokenStorage } from "@/shared/api";
import { env } from "@/shared/config";
import type { AssignmentVoice } from "@/shared/types";
import { DsText, dsRadius, Icon, useDs } from "@/shared/ui";

function clock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/**
 * Pleer — veb `VoiceAudio` (`<audio controls>`) o'rnida: ijro/pauza,
 * chiziqli progress va vaqt. Manba birinchi bosilganda yuklanadi.
 */
export function VoiceAudio({ source, durationMs, onFailed }: { source: () => AudioSource; durationMs: number | null; onFailed?: () => void }) {
  const { t } = useTranslation("homework");
  const ds = useDs();
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const [loaded, setLoaded] = useState(false);

  // iOS AVFoundation vebdagi WebM/Opus ni ocholmaydi — xato `status` ga keladi.
  useEventListener(player, "playbackStatusUpdate", (update) => {
    if (!(update as { error?: string }).error) return;
    setLoaded(false);
    onFailed?.();
  });

  function toggle() {
    try {
      if (!loaded) {
        player.replace(source());
        setLoaded(true);
        player.play();
        return;
      }
      if (status.playing) return player.pause();
      if (status.duration > 0 && status.currentTime >= status.duration - 0.2) void player.seekTo(0);
      player.play();
    } catch {
      onFailed?.();
    }
  }

  const total = status.duration > 0 ? status.duration : (durationMs ?? 0) / 1000;
  const progress = total > 0 ? Math.min(1, status.currentTime / total) : 0;

  return (
    <View style={styles.player}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("voice.title")}
        onPress={toggle}
        style={({ pressed }) => [styles.play, { backgroundColor: pressed ? ds.c["brand-strong"] : ds.c.brand }]}
      >
        <Icon name={status.playing ? "pause" : "play-arrow"} size={20} color={ds.c["on-action"]} />
      </Pressable>
      <View style={[styles.track, { backgroundColor: ds.c.line }]}>
        <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: ds.c.brand }]} />
      </View>
      <DsText v="caption-strong" c="ink-secondary" numeric>
        {clock(status.currentTime > 0 ? status.currentTime : total)}
      </DsText>
    </View>
  );
}

/**
 * O'qituvchining ovozli izohi — veb `assignment-voice-player.tsx`.
 *
 * 🟡 Vebda fayl `apiClient` bilan blob qilib yuklanadi (`useProtectedAudio`);
 * mobilda `expo-audio` manbasining o'zi `Authorization` sarlavhasini yuboradi
 * (chatdagi ovozli xabar ham shunday, `voice-message.tsx`).
 */
export function AssignmentVoicePlayer({ voice }: { voice: AssignmentVoice }) {
  const { t } = useTranslation("homework");
  const ds = useDs();
  const [failed, setFailed] = useState(false);
  const uri = /^https?:/i.test(voice.url) ? voice.url : `${env.apiUrl}${voice.url}`;

  return (
    // `flex-col gap-2 rounded-xl bg-subtle p-3`
    <View style={[styles.card, { backgroundColor: ds.c.subtle }]}>
      <View style={styles.head}>
        <Icon name="mic" size={18} color={ds.c.brand} />
        <DsText v="body-sm" w="500">
          {t("voice.title")}
        </DsText>
      </View>
      {failed ? (
        <DsText v="caption" c="error-text">
          {t("voice.loadFailed")}
        </DsText>
      ) : (
        <VoiceAudio
          durationMs={voice.durationMs}
          source={() => ({ uri, headers: { Authorization: `Bearer ${tokenStorage.getAccessToken() ?? ""}` } })}
          onFailed={() => setFailed(true)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 8, padding: 12, borderRadius: dsRadius.xl },
  head: { flexDirection: "row", alignItems: "center", gap: 8 },
  player: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 40 },
  play: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  track: { flex: 1, height: 4, overflow: "hidden", borderRadius: 2 },
  fill: { height: "100%", borderRadius: 2 },
});
