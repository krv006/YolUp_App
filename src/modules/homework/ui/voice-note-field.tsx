import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder } from "expo-audio";
import { toUploadFile } from "@/shared/lib";
import type { AssignmentVoice } from "@/shared/types";
import { DsText, dsRadius, Icon, toast, useDs } from "@/shared/ui";
import type { AssignmentVoiceInput } from "../api/homework.dto";
import { AssignmentVoicePlayer, VoiceAudio } from "./assignment-voice-player";

const VOICE_MAX_MS = 10 * 60_000;

export interface VoiceNoteFieldProps {
  /** Vazifada saqlangan ovoz (tahrirda). */
  existing: AssignmentVoice | null;
  /** `undefined` — o'zgarmagan, `null` — o'chirish (`remove_voice`), qiymat — yangi yozuv. */
  value: AssignmentVoiceInput | null | undefined;
  onChange: (value: AssignmentVoiceInput | null | undefined) => void;
  disabled?: boolean;
}

/** Yangi yozuv: yuklash uchun fayl + qurilmadagi nusxa (oldindan eshitish). */
type Recorded = AssignmentVoiceInput & { uri: string };

function clock(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/**
 * O'qituvchining ovozli izohi — veb `voice-note-field.tsx` (#219): yozish
 * (10 daqiqagacha), to'xtatish, oldindan eshitish, o'chirish; tahrirda
 * saqlangan ovoz pleer bilan.
 *
 * 🟡 `MediaRecorder` o'rniga `expo-audio` (`.m4a`, `audio/mp4` — backend
 * qabul qiladi); chat kompozeridagi ovoz yozish bilan bir xil sozlama.
 */
export function VoiceNoteField({ existing, value, onChange, disabled = false }: VoiceNoteFieldProps) {
  const { t } = useTranslation("homework");
  const ds = useDs();
  const [recording, setRecording] = useState(false);
  const recorded = value && "uri" in value ? (value as Recorded) : null;

  async function start() {
    const permission = await requestRecordingPermissionsAsync().catch(() => null);
    if (!permission?.granted) {
      toast.error(t("voice.denied"));
      return;
    }
    setRecording(true);
  }

  function remove() {
    onChange(existing && value ? undefined : existing ? null : undefined);
  }

  const removeButton = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("voice.remove")}
      disabled={disabled}
      onPress={remove}
      style={[styles.remove, { backgroundColor: ds.c["danger-bg"] }, disabled && styles.faded]}
    >
      <Icon name="trash" size={18} color={ds.c.danger} />
    </Pressable>
  );

  if (recording)
    return (
      <RecordingPanel
        onDone={(result) => {
          setRecording(false);
          if (result) onChange(result);
        }}
      />
    );

  if (recorded)
    return (
      <View style={[styles.card, { backgroundColor: ds.c.subtle }]}>
        <View style={styles.head}>
          <Icon name="mic" size={18} color={ds.c.brand} />
          <DsText v="body-sm" w="500">
            {t("voice.title")} · {clock(recorded.durationMs)}
          </DsText>
        </View>
        <View style={styles.row}>
          <View style={styles.grow}>
            <VoiceAudio source={() => ({ uri: recorded.uri })} durationMs={recorded.durationMs} onFailed={() => toast.error(t("voice.loadFailed"))} />
          </View>
          {removeButton}
        </View>
      </View>
    );

  if (existing && value !== null)
    return (
      <View style={styles.row}>
        <View style={styles.grow}>
          <AssignmentVoicePlayer voice={existing} />
        </View>
        {removeButton}
      </View>
    );

  return (
    // `h-11 rounded-full border border-dashed border-line-strong bg-surface`
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => void start()}
      style={({ pressed }) => [
        styles.start,
        { borderColor: ds.c["line-strong"], backgroundColor: pressed ? ds.c.subtle : ds.c.surface },
        disabled && styles.faded,
      ]}
    >
      <Icon name="mic" size={18} color={ds.c.brand} />
      <DsText v="button">{existing ? t("voice.recordAgain") : t("voice.record")}</DsText>
    </Pressable>
  );
}

/**
 * Yozish paneli. Yozgich shu panel bilan birga yaratiladi — chat
 * kompozeridagi sabab bilan (Android faoliyati almashganda nativ konstruktor
 * rad etilishi).
 */
function RecordingPanel({ onDone }: { onDone: (result: Recorded | null) => void }) {
  const { t } = useTranslation("homework");
  const ds = useDs();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [elapsed, setElapsed] = useState(0);
  const startedRef = useRef(0);
  const stoppedRef = useRef(false);
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  });

  async function stop() {
    if (stoppedRef.current) return;
    stoppedRef.current = true;
    const durationMs = Math.min(Date.now() - startedRef.current, VOICE_MAX_MS);
    try {
      await recorder.stop();
    } catch {
      // Yozuv boshlanmagan bo'lsa ham panel yopiladi.
    }
    const uri = recorder.uri;
    if (!uri || durationMs < 500) return doneRef.current(null);
    doneRef.current({
      uri,
      durationMs,
      file: toUploadFile({ uri, name: `voice-${Date.now()}.m4a`, mimeType: "audio/mp4", size: 0 }),
    });
  }
  const stopRef = useRef(stop);
  useEffect(() => {
    stopRef.current = stop;
  });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        // iOS'da yozish uchun audio sessiya rejimi yoqilishi shart.
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        await recorder.prepareToRecordAsync();
        if (cancelled) return;
        recorder.record();
        startedRef.current = Date.now();
      } catch {
        toast.error(t("voice.denied"));
        doneRef.current(null);
      }
    })();
    const timer = setInterval(() => {
      if (!startedRef.current) return;
      const passed = Date.now() - startedRef.current;
      setElapsed(passed);
      if (passed >= VOICE_MAX_MS) void stopRef.current();
    }, 250);
    return () => {
      cancelled = true;
      clearInterval(timer);
      if (!stoppedRef.current) void recorder.stop().catch(() => undefined);
      void setAudioModeAsync({ allowsRecording: false }).catch(() => undefined);
    };
  }, [recorder, t]);

  return (
    // `rounded-xl bg-danger-bg px-3 py-2.5`: qizil nuqta, "Yozilmoqda", vaqt, "To'xtatish"
    <View style={[styles.recording, { backgroundColor: ds.c["danger-bg"] }]}>
      <View style={[styles.dot, { backgroundColor: ds.c.danger }]} />
      <View style={styles.grow}>
        <DsText v="body-sm" w="600">
          {t("voice.recording")}
        </DsText>
        <DsText v="caption" c="ink-secondary" numeric>
          {clock(elapsed)} / {clock(VOICE_MAX_MS)}
        </DsText>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => void stop()}
        style={({ pressed }) => [styles.stop, { backgroundColor: ds.c.danger, opacity: pressed ? 0.85 : 1 }]}
      >
        <Icon name="stop-circle" size={18} color={ds.c["on-action"]} />
        <DsText v="button" c="on-action">
          {t("voice.stop")}
        </DsText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  faded: { opacity: 0.5 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  card: { gap: 8, padding: 12, borderRadius: dsRadius.xl },
  head: { flexDirection: "row", alignItems: "center", gap: 8 },
  remove: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  start: { height: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 16, borderWidth: 1, borderStyle: "dashed", borderRadius: dsRadius.full },
  recording: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 12, paddingVertical: 10, borderRadius: dsRadius.xl },
  dot: { width: 10, height: 10, borderRadius: 5 },
  stop: { height: 40, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, borderRadius: dsRadius.full },
});
