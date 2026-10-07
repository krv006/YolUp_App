import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useVideoPlayer } from "expo-video";
import { Headphones, Play } from "lucide-react-native";
import { Button, Text, radius, useTheme } from "@/shared/ui";

export type ExamAudioState = "idle" | "playing" | "done";

export interface ExamPassageProps {
  title: string;
  passage: string;
  audioUrl: string | null;
  /** Imtihonda audio bir marta eshittiriladi; oddiy testda cheklov yo'q. */
  playOnce?: boolean;
  audioState?: ExamAudioState;
  onAudioState?: (state: ExamAudioState) => void;
}

/**
 * Guruh materiali: matn parchasi (Reading) va audio (Listening).
 *
 * Audio uchun alohida kutubxona qo'shilmadi — `expo-video` pleeri audio
 * faylni ham o'ynatadi, ko'rinish esa kerak emas (`VideoView` qo'yilmaydi).
 */
export function ExamPassage({
  title,
  passage,
  audioUrl,
  playOnce = false,
  audioState = "idle",
  onAudioState,
}: ExamPassageProps) {
  const { t } = useTranslation("exam");
  const { palette } = useTheme();
  const [playing, setPlaying] = useState(false);
  const player = useVideoPlayer(audioUrl ?? null, (instance) => {
    instance.loop = false;
  });

  useEffect(() => {
    if (!audioUrl) return undefined;
    const subscription = player.addListener("playToEnd", () => {
      setPlaying(false);
      onAudioState?.("done");
    });
    return () => subscription.remove();
  }, [audioUrl, onAudioState, player]);

  const done = playOnce && audioState === "done";

  return (
    <View style={[styles.root, { borderColor: palette.border, backgroundColor: palette["surface-tint"] }]}>
      {title ? <Text variant="label">{title}</Text> : null}

      {audioUrl ? (
        <View style={styles.audio}>
          {done ? (
            <View style={styles.audioState}>
              <Headphones size={15} color={palette["muted-foreground"]} />
              <Text variant="caption" tone="muted">
                {t("runner.audioPlayed")}
              </Text>
            </View>
          ) : playing ? (
            <View style={styles.audioState}>
              <Headphones size={15} color={palette["primary-text"]} />
              <Text variant="caption" tone="brand">
                {t("runner.audioPlaying")}
              </Text>
              {playOnce ? null : (
                <Button
                  variant="ghost"
                  title={t("runner.audioPause")}
                  onPress={() => {
                    player.pause();
                    setPlaying(false);
                  }}
                />
              )}
            </View>
          ) : (
            <Button
              variant="secondary"
              title={t("runner.audioStart")}
              icon={<Play size={14} color={palette.foreground} />}
              onPress={() => {
                player.play();
                setPlaying(true);
                onAudioState?.("playing");
              }}
            />
          )}
          {playOnce ? (
            <Text variant="caption" tone="muted">
              {t("runner.audioOnce")}
            </Text>
          ) : null}
        </View>
      ) : null}

      {passage ? (
        <ScrollView style={styles.passage} nestedScrollEnabled>
          <Text style={styles.passageText}>{passage}</Text>
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 10, padding: 14, borderWidth: 1, borderRadius: radius.lg },
  audio: { gap: 6 },
  audioState: { flexDirection: "row", alignItems: "center", gap: 7 },
  passage: { maxHeight: 260 },
  passageText: { lineHeight: 22 },
});
