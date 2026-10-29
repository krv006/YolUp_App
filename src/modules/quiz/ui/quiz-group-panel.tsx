import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Pause, Play } from "lucide-react-native";
import type { QuizGroup } from "@/shared/types";
import { radius, Text, useTheme } from "@/shared/ui";
import { useQuizColors } from "./quiz-colors";

export interface QuizGroupPanelProps {
  group: QuizGroup;
}

/** Veb `QuizGroupPanel`: sarlavha, audio va matn parchasi. */
export function QuizGroupPanel({ group }: QuizGroupPanelProps) {
  const colors = useQuizColors();
  return (
    <View style={[styles.group, { backgroundColor: colors.surfaceTint, borderColor: colors.border }]}>
      {group.title ? (
        <Text variant="body" style={[styles.groupTitle, { color: colors.foreground }]}>
          {group.title}
        </Text>
      ) : null}
      {group.audioUrl ? <GroupAudio src={group.audioUrl} /> : null}
      {group.passage ? (
        <ScrollView nestedScrollEnabled style={styles.passageBox}>
          <Text variant="label" style={[styles.passage, { color: colors.foreground }]}>
            {group.passage}
          </Text>
        </ScrollView>
      ) : null}
    </View>
  );
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0:00";
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

/** Vebdagi `<audio controls>` o'rnida — o'ynatish, vaqt va jarayon chizig'i (balandligi 36). */
function GroupAudio({ src }: { src: string }) {
  const { t } = useTranslation("quiz");
  const { palette } = useTheme();
  const colors = useQuizColors();
  const player = useAudioPlayer({ uri: src });
  const status = useAudioPlayerStatus(player);
  const duration = status.duration || 0;
  const position = status.currentTime || 0;
  return (
    <View style={[styles.audio, { backgroundColor: palette.surface, borderColor: colors.border }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={status.playing ? t("groups.audioPause") : t("groups.audioPlay")}
        onPress={() => {
          if (status.playing) player.pause();
          else {
            if (status.didJustFinish) void player.seekTo(0);
            player.play();
          }
        }}
        style={styles.audioButton}
      >
        {status.playing ? (
          <Pause size={16} color={colors.foreground} />
        ) : (
          <Play size={16} color={colors.foreground} />
        )}
      </Pressable>
      <Text variant="caption" style={[styles.numeric, { color: colors.muted }]}>
        {formatTime(position)} / {formatTime(duration)}
      </Text>
      <View style={[styles.track, { backgroundColor: colors.mutedBg }]}>
        <View
          style={[
            styles.trackFill,
            { width: `${duration ? (position / duration) * 100 : 0}%`, backgroundColor: palette.primary },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 10, padding: 14, borderWidth: 1, borderRadius: 16 },
  groupTitle: { fontSize: 15, lineHeight: 22 },
  passageBox: { maxHeight: 320 },
  passage: { fontWeight: "400", fontSize: 14, lineHeight: 22 },
  audio: {
    height: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderRadius: radius.full,
  },
  audioButton: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  track: { flex: 1, height: 4, borderRadius: radius.full, overflow: "hidden", marginRight: 8 },
  trackFill: { height: "100%" },
  numeric: { fontVariant: ["tabular-nums"] },
});
