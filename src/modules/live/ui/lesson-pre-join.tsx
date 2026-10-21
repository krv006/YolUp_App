import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { VideoView } from "@livekit/react-native";
import { createLocalVideoTrack, type LocalVideoTrack } from "livekit-client";
import { Mic, MicOff, Video, VideoOff, Volume2, X } from "lucide-react-native";
import type { Lesson } from "@/shared/types";
import { Avatar, radius, Text, ThemeScope, useTheme } from "@/shared/ui";

export interface LessonPreJoinChoices {
  micOn: boolean;
  cameraOn: boolean;
}

export interface LessonPreJoinProps {
  lesson: Lesson;
  userName?: string;
  micAllowed?: boolean;
  onJoin: (choices: LessonPreJoinChoices) => void;
  onCancel: () => void;
}

/** Veb `#d93a3a` — o'chiq mikrofon/kamera tugmasi. */
const OFF_RED = "#d93a3a";

/**
 * Darsga kirishdan oldingi ekran — veb `modules/live/ui/lesson-pre-join.tsx`
 * ning tor ekran (`isCompact`) ko'rinishi. Vebda o'qituvchi kompyuterda
 * ekran ulashishni ham shu yerda yoqadi; telefonda bu shoxcha yo'q (vebda
 * ham `isCompact` da o'tkazib yuboriladi).
 */
export function LessonPreJoin(props: LessonPreJoinProps) {
  return (
    <ThemeScope scheme="dark">
      <PreJoinBody {...props} />
    </ThemeScope>
  );
}

function PreJoinBody({ lesson, userName, micAllowed = true, onJoin, onCancel }: LessonPreJoinProps) {
  const { t } = useTranslation("live");
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const [micOn, setMicOn] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [deviceError, setDeviceError] = useState<string | null>(null);
  const [videoTrack, setVideoTrack] = useState<LocalVideoTrack | null>(null);

  /* Vebdagi `usePreviewTracks`: kamera yoqilganda oldindan ko'rinish. */
  useEffect(() => {
    if (!cameraOn) return undefined;
    let cancelled = false;
    let created: LocalVideoTrack | null = null;
    createLocalVideoTrack({ facingMode: "user" })
      .then((track) => {
        if (cancelled) {
          track.stop();
          return;
        }
        created = track;
        setVideoTrack(track);
      })
      .catch((error: Error) => setDeviceError(error.message || t("preJoin.deviceErrorFallback")));
    return () => {
      cancelled = true;
      created?.stop();
      setVideoTrack(null);
    };
  }, [cameraOn, t]);

  function join() {
    videoTrack?.stop();
    onJoin({ micOn, cameraOn });
  }

  const tone = (on: boolean) => ({ backgroundColor: on ? palette["surface-subtle"] : OFF_RED });

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: palette.background, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel={t("preJoin.cancel")} onPress={onCancel} style={styles.close}>
          <X size={22} color={palette.foreground} />
        </Pressable>
        <Text variant="body" style={styles.strong}>
          {t("preJoin.mobileTitle")}
        </Text>
      </View>

      <View style={[styles.preview, { backgroundColor: palette["surface-subtle"] }]}>
        {cameraOn && videoTrack ? (
          <VideoView videoTrack={videoTrack} objectFit="cover" mirror style={styles.video} />
        ) : (
          <View style={styles.placeholder}>
            <Avatar variant="legacy" name={userName || t("preJoin.you")} size="lg" />
            <Text variant="label" style={[styles.regular, { color: palette["subtle-foreground"] }]}>
              {t("preJoin.cameraOff")}
            </Text>
          </View>
        )}
        <View style={styles.you}>
          {micOn ? <Mic size={15} color="#ffffff" /> : <MicOff size={15} color="#ffffff" />}
          <Text variant="label" style={styles.white}>
            {t("preJoin.you")}
          </Text>
        </View>
      </View>

      <View style={styles.toggles}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: micOn, disabled: !micAllowed }}
          accessibilityLabel={micOn ? t("preJoin.muteMicAria") : t("preJoin.unmuteMicAria")}
          disabled={!micAllowed}
          onPress={() => {
            setDeviceError(null);
            setMicOn((value) => !value);
          }}
          style={[styles.toggle, tone(micOn), !micAllowed && styles.disabled]}
        >
          {micOn ? <Mic size={20} color={palette.foreground} /> : <MicOff size={20} color="#ffffff" />}
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: cameraOn }}
          accessibilityLabel={cameraOn ? t("preJoin.muteCameraAria") : t("preJoin.unmuteCameraAria")}
          onPress={() => {
            setDeviceError(null);
            setCameraOn((value) => !value);
          }}
          style={[styles.toggle, tone(cameraOn)]}
        >
          {cameraOn ? <Video size={20} color={palette.foreground} /> : <VideoOff size={20} color="#ffffff" />}
        </Pressable>
        <View style={[styles.toggle, { backgroundColor: palette["surface-subtle"] }]}>
          <Volume2 size={20} color={palette.foreground} />
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.info}>
          <Text variant="heading">{lesson.title}</Text>
          <Text variant="label" style={[styles.regular, { color: palette["subtle-foreground"] }]}>
            {lesson.courseTitle} · {lesson.date} · {lesson.time} · {lesson.durationMinutes} {t("preJoin.minutes")}
          </Text>
        </View>

        {deviceError ? (
          <Text
            variant="label"
            style={[styles.error, { backgroundColor: palette["destructive-soft"], color: palette["destructive-strong"] }]}
          >
            {t("preJoin.deviceErrorMessage", { error: deviceError })}
          </Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={join}
          style={({ pressed }) => [styles.join, { backgroundColor: pressed ? palette["primary-hover"] : palette.primary }]}
        >
          <Text variant="body" style={[styles.strong, { color: palette["primary-foreground"] }]}>
            {t("preJoin.join")}
          </Text>
        </Pressable>

        <Text variant="caption" style={[styles.note, { color: palette["subtle-foreground"] }]}>
          {t("preJoin.recordingNote")}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /* `px-4 pt-3 pb-6` */
  root: { flex: 1, paddingHorizontal: 16 },
  strong: { fontWeight: "600" },
  regular: { fontWeight: "400" },
  white: { color: "#ffffff" },
  header: { height: 44, flexDirection: "row", alignItems: "center", gap: 8 },
  close: { marginLeft: -8, width: 40, height: 40, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  /* `mt-2 flex-1 rounded-2xl bg-subtle` */
  preview: { marginTop: 8, flex: 1, overflow: "hidden", borderRadius: radius["2xl"] },
  video: { flex: 1 },
  placeholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  you: {
    position: "absolute",
    left: 12,
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  /* `justify-center gap-4 py-4` */
  toggles: { flexDirection: "row", justifyContent: "center", gap: 16, paddingVertical: 16 },
  toggle: { width: 48, height: 48, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  disabled: { opacity: 0.5 },
  footer: { gap: 12 },
  info: { gap: 4 },
  error: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: radius.xl, overflow: "hidden", fontWeight: "400" },
  join: { height: 56, alignItems: "center", justifyContent: "center", borderRadius: radius.full },
  note: { textAlign: "center", fontWeight: "500" },
});
