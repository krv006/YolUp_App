import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { VideoView } from "@livekit/react-native";
import { createLocalVideoTrack, type LocalVideoTrack } from "livekit-client";
import type { Lesson } from "@/shared/types";
import { Avatar, dsAlpha, DsText, dsRadius, Icon, ThemeScope, useDs } from "@/shared/ui";

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

/**
 * Darsga kirishdan oldingi ekran — veb `lesson-pre-join.tsx` ning tor ekran
 * varianti (doim qorong'i): yopish va "Guruh · 18:00", kamera ko'rinishi va
 * ustida mikrofon/kamera tugmalari, dars nomi, qurilmalar holati, yozib
 * olinishi haqida izoh; pastda "Bekor qilish" va "Qo'shilish". Vebda
 * o'qituvchi kompyuterda ekran ulashishni ham shu yerda yoqadi — tor
 * ekranda bu shoxcha yo'q.
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
  const ds = useDs();
  const insets = useSafeAreaInsets();
  const [micOn, setMicOn] = useState(micAllowed);
  const [cameraOn, setCameraOn] = useState(true);
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

  const start = new Date(lesson.startsAt);
  const startClock = Number.isNaN(start.getTime())
    ? lesson.time
    : `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`;
  const devices = micOn
    ? cameraOn
      ? t("preJoin.mobileBothOn")
      : t("preJoin.mobileMicOnly")
    : cameraOn
      ? t("preJoin.mobileCameraOnly")
      : t("preJoin.mobileBothOff");

  return (
    <ScrollView
      style={{ backgroundColor: ds.c.canvas }}
      contentContainerStyle={[styles.page, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 36 }]}
    >
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel={t("preJoin.cancel")} onPress={onCancel} style={[styles.round, { backgroundColor: ds.c["surface-inverse"] }]}>
          <Icon name="close" size={22} color={ds.c["ink-inverse"]} />
        </Pressable>
        <DsText v="title" w="600" numberOfLines={1} style={styles.headerTitle}>
          {lesson.courseTitle} · {startClock}
        </DsText>
        <View style={styles.spacer} />
      </View>

      {/* `aspect-[358/421] rounded-2xl bg-subtle` */}
      <View style={[styles.preview, { backgroundColor: ds.c.subtle }]}>
        {cameraOn && videoTrack ? (
          <VideoView videoTrack={videoTrack} objectFit="cover" mirror style={styles.fill} />
        ) : (
          <View style={styles.placeholder}>
            <Avatar variant="legacy" name={userName || t("preJoin.you")} size="lg" />
            <DsText v="body-sm" c="ink-secondary">
              {t("preJoin.cameraOff")}
            </DsText>
          </View>
        )}
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
            style={[styles.toggle, { backgroundColor: micOn ? ds.c.subtle : ds.c.danger }, !micAllowed && styles.dim]}
          >
            <Icon name="mic" size={22} color={micOn ? ds.c.ink : ds.c["on-action"]} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: cameraOn }}
            accessibilityLabel={cameraOn ? t("preJoin.muteCameraAria") : t("preJoin.unmuteCameraAria")}
            onPress={() => {
              setDeviceError(null);
              setCameraOn((value) => !value);
            }}
            style={[styles.toggle, { backgroundColor: cameraOn ? ds.c.subtle : ds.c.danger }]}
          >
            <Icon name="videocam-fill" size={22} color={cameraOn ? ds.c.ink : ds.c["on-action"]} />
          </Pressable>
          <View style={[styles.toggle, { backgroundColor: ds.c.subtle }]}>
            <Icon name="settings" size={22} color={ds.c.ink} />
          </View>
        </View>
      </View>

      <DsText v="title-lg" heading style={[styles.center, styles.title]}>
        {lesson.title || lesson.courseTitle}
      </DsText>
      <DsText v="body-sm" c="ink-secondary" style={[styles.center, styles.devices]}>
        {devices} · {t("preJoin.mobileChangeLater")}
      </DsText>

      {deviceError ? (
        <View style={[styles.error, { backgroundColor: ds.c["danger-bg"] }]}>
          <DsText v="body-sm" c="error-text">
            {t("preJoin.deviceErrorMessage", { error: deviceError })}
          </DsText>
        </View>
      ) : null}

      <View style={[styles.note, { backgroundColor: dsAlpha(ds.c.subtle, 0.4) }]}>
        <View style={[styles.noteDot, { backgroundColor: ds.c.danger }]} />
        <DsText v="body-sm" style={styles.noteText}>
          {t("preJoin.mobileRecordingNote")}
        </DsText>
      </View>

      <View style={styles.flexSpace} />

      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={onCancel} style={({ pressed }) => [styles.action, { backgroundColor: ds.c["surface-inverse"], opacity: pressed ? 0.85 : 1 }]}>
          <DsText v="title" w="600" c="ink-inverse">
            {t("preJoin.mobileCancel")}
          </DsText>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={join} style={({ pressed }) => [styles.action, { backgroundColor: pressed ? ds.c["brand-strong"] : ds.c.brand }]}>
          <Icon name="videocam-fill" size={20} color={ds.c["on-action"]} />
          <DsText v="title" w="600" c="on-action">
            {t("preJoin.mobileJoin")}
          </DsText>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { textAlign: "center" },
  dim: { opacity: 0.6 },
  /* `px-4 pt-5 pb-9` */
  page: { flexGrow: 1, paddingHorizontal: 16 },
  header: { height: 44, flexDirection: "row", alignItems: "center", gap: 12 },
  headerTitle: { flex: 1, minWidth: 0, textAlign: "center" },
  round: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  spacer: { width: 44, height: 44 },
  preview: { marginTop: 16, width: "100%", aspectRatio: 358 / 421, overflow: "hidden", borderRadius: dsRadius["2xl"] },
  placeholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  /* `absolute inset-x-0 bottom-3.5 gap-3.5` */
  toggles: { position: "absolute", left: 0, right: 0, bottom: 14, flexDirection: "row", justifyContent: "center", gap: 14 },
  toggle: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  title: { marginTop: 14 },
  devices: { marginTop: 6, paddingHorizontal: 16 },
  error: { marginTop: 16, paddingHorizontal: 16, paddingVertical: 12, borderRadius: dsRadius.xl },
  note: { marginTop: 20, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 7, borderRadius: dsRadius.xl },
  noteDot: { width: 10, height: 10, borderRadius: 5 },
  noteText: { flex: 1, minWidth: 0, lineHeight: 18 },
  flexSpace: { flex: 1, minHeight: 24 },
  actions: { flexDirection: "row", gap: 12 },
  action: { flex: 1, minWidth: 0, height: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 26 },
});
