import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import {
  useConnectionState,
  useParticipants,
  useTracks,
  VideoTrack,
  type TrackReferenceOrPlaceholder,
} from "@livekit/react-native";
import { ConnectionState, Track } from "livekit-client";
import { MicOff, MonitorUp, UserRoundPlus } from "lucide-react-native";
import { useAuth } from "@/modules/auth";
import { BoardSurface } from "@/modules/board";
import { LessonInviteSheet, useCameraSignals, useMicSignals } from "@/modules/live";
import { Avatar, Badge, Chip, ChipRow, IconButton, radius, Text, useTheme } from "@/shared/ui";
import { LiveControls } from "./live-controls";
import { LiveWatermark } from "./live-watermark";

type LiveTab = "video" | "board" | "people";

const CONNECTION_LABELS: Partial<Record<ConnectionState, string>> = {
  [ConnectionState.Connecting]: "Ulanmoqda…",
  [ConnectionState.Connected]: "Ulandi",
  [ConnectionState.Reconnecting]: "Qayta ulanmoqda…",
  [ConnectionState.Disconnected]: "Uzildi",
};

export interface LiveRoomProps {
  lessonId: string;
  courseId: string | null;
  lessonTitle: string;
  isTeacher: boolean;
  onLeave: () => void;
}

/**
 * Jonli dars xonasi — veb `widgets/live-room/live-room.tsx` (825 qator) ning
 * mobil varianti.
 *
 * Veb'da doska YON PANEL sifatida video yonida turardi. Telefonda ikkalasiga
 * birdan joy yo'q, shuning uchun bo'limlar: Video · Doska · Ishtirokchilar.
 * Bu — ekran o'lchamiga majburiy moslashish, funksiya yo'qolmaydi.
 */
export function LiveRoom({
  lessonId,
  courseId,
  lessonTitle,
  isTeacher,
  onLeave,
}: LiveRoomProps) {
  const { palette } = useTheme();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const [tab, setTab] = useState<LiveTab>("video");
  const [inviteOpen, setInviteOpen] = useState(false);

  const connection = useConnectionState();
  const participants = useParticipants();

  /*
   * Mikrofon va kamera signallari (o'qituvchida so'rov toast'i, o'quvchida
   * javob) — ikkalasi ham 🟢 veb'dan ko'chirilgan hooklar. Ular toast orqali
   * ishlaydi, shuning uchun bu yerda faqat kutish holati o'qiladi.
   */
  const micSignals = useMicSignals(lessonId, isTeacher);
  const cameraSignals = useCameraSignals(lessonId, isTeacher);

  const cameraTracks = useTracks([Track.Source.Camera], { onlySubscribed: false });
  const screenTracks = useTracks([Track.Source.ScreenShare], { onlySubscribed: false });
  const screenTrack = screenTracks[0];

  /**
   * Setka ustunlari: 2 ta ishtirokchigacha — bitta katta oyna, keyin ikkita
   * ustun. Telefonda uchtadan ortiq ustun yuz tanib bo'lmaydigan darajada
   * kichik chiqadi.
   */
  const columns = cameraTracks.length <= 1 ? 1 : 2;
  const tileWidth = (width - 16 - (columns - 1) * 8) / columns;

  const label = CONNECTION_LABELS[connection] ?? "";
  const offline = connection !== ConnectionState.Connected;

  const speakingIds = useMemo(
    () => new Set(participants.filter((item) => item.isSpeaking).map((item) => item.identity)),
    [participants]
  );

  return (
    <View style={[styles.root, { backgroundColor: palette.background }]}>
      <View style={[styles.head, { borderBottomColor: palette.border }]}>
        <View style={styles.headBody}>
          <Text variant="label" numberOfLines={1}>
            {lessonTitle}
          </Text>
          <Text variant="caption" tone={offline ? "danger" : "muted"}>
            {label} · {participants.length} ishtirokchi
          </Text>
        </View>
        {screenTrack ? <Badge label="Ekran ulashilmoqda" tone="brand" /> : null}

        {isTeacher ? (
          <IconButton accessibilityLabel="Darsga taklif qilish" onPress={() => setInviteOpen(true)}>
            <UserRoundPlus size={20} color={palette.foreground} />
          </IconButton>
        ) : null}
      </View>

      <ChipRow>
        <Chip label="Video" selected={tab === "video"} onPress={() => setTab("video")} />
        <Chip label="Doska" selected={tab === "board"} onPress={() => setTab("board")} />
        <Chip
          label={`Ishtirokchilar (${participants.length})`}
          selected={tab === "people"}
          onPress={() => setTab("people")}
        />
      </ChipRow>

      {tab === "video" ? (
        <View style={styles.stage}>
          {screenTrack ? (
            <View style={styles.screenShare}>
              <VideoTrack trackRef={screenTrack} style={styles.screenVideo} objectFit="contain" />
              <View style={styles.screenLabel}>
                <MonitorUp size={13} color={palette["primary-foreground"]} />
                <Text variant="caption" tone="onPrimary">
                  {screenTrack.participant.name || screenTrack.participant.identity}
                </Text>
              </View>
            </View>
          ) : null}

          <ScrollView contentContainerStyle={styles.grid}>
            {cameraTracks.map((track) => (
              <CameraTile
                key={track.participant.identity + (track.publication?.trackSid ?? "")}
                track={track}
                width={tileWidth}
                speaking={speakingIds.has(track.participant.identity)}
              />
            ))}
          </ScrollView>

          {/*
           * Ism-watermark (PROJECT.md §11 #2). Skrinshot chiqsa ham kim
           * chiqarganini bilish uchun — iOS'da skrinshotni to'sib bo'lmaydi
           * (MOBILE_PLAN §10), shuning uchun bu himoya jiddiy.
           */}
          <LiveWatermark name={user?.name ?? user?.username ?? ""} id={user?.id ?? ""} />
        </View>
      ) : null}

      {tab === "board" && courseId !== null ? (
        <View style={styles.stage}>
          <BoardSurface lessonId={lessonId} embedded />
        </View>
      ) : null}

      {tab === "people" ? (
        <ScrollView contentContainerStyle={styles.people}>
          {participants.map((participant) => (
            <View key={participant.identity} style={styles.person}>
              <Avatar name={participant.name || participant.identity} size="md" />
              <View style={styles.personBody}>
                <Text variant="label" numberOfLines={1}>
                  {participant.name || participant.identity}
                  {participant.isLocal ? " (Siz)" : ""}
                </Text>
                <Text variant="caption" tone="muted">
                  {participant.isSpeaking ? "Gapiryapti" : "Jim"}
                </Text>
              </View>
              {!participant.isMicrophoneEnabled ? (
                <MicOff size={16} color={palette["muted-foreground"]} />
              ) : null}
            </View>
          ))}
        </ScrollView>
      ) : null}

      <LiveControls
        isTeacher={isTeacher}
        onLeave={onLeave}
        onRequestMic={micSignals.requestMic}
        micRequesting={micSignals.requesting}
        micWaiting={micSignals.waiting}
        onRequestCamera={cameraSignals.requestCamera}
        cameraRequesting={cameraSignals.requesting}
        cameraWaiting={cameraSignals.waiting}
      />

      <LessonInviteSheet
        lessonId={lessonId}
        courseId={courseId}
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
      />
    </View>
  );
}

function CameraTile({
  track,
  width,
  speaking,
}: {
  track: TrackReferenceOrPlaceholder;
  width: number;
  speaking: boolean;
}) {
  const { palette } = useTheme();
  const publication = "publication" in track ? track.publication : undefined;
  const cameraOff = !publication || publication.isMuted;
  const name = track.participant.name || track.participant.identity;

  return (
    <View
      style={[
        styles.tile,
        {
          width,
          backgroundColor: palette["surface-elevated"],
          // Gapirayotgan ishtirokchi ajralib tursin — mobilda ovoz manbasini
          // topish qiyin, chunki oynalar kichik.
          borderColor: speaking ? palette.success : palette.border,
          borderWidth: speaking ? 2 : StyleSheet.hairlineWidth,
        },
      ]}
    >
      {cameraOff ? (
        <View style={styles.tilePlaceholder}>
          <Avatar name={name} size="lg" />
        </View>
      ) : (
        <VideoTrack
          trackRef={track as never}
          style={styles.tileVideo}
          objectFit="cover"
          mirror={track.participant.isLocal}
        />
      )}

      <View style={styles.tileLabel}>
        <Text variant="caption" tone="onPrimary" numberOfLines={1}>
          {track.participant.isLocal ? `${name} (Siz)` : name}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  head: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headBody: { flex: 1, gap: 2 },
  stage: { flex: 1 },
  screenShare: { width: "100%", aspectRatio: 16 / 9, backgroundColor: "#000" },
  screenVideo: { width: "100%", height: "100%" },
  screenLabel: {
    position: "absolute",
    left: 8,
    bottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8, padding: 8 },
  tile: { aspectRatio: 3 / 4, borderRadius: radius.md, overflow: "hidden" },
  tileVideo: { width: "100%", height: "100%" },
  tilePlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  tileLabel: {
    position: "absolute",
    left: 6,
    bottom: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  people: { padding: 16, gap: 4 },
  person: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  personBody: { flex: 1, gap: 2 },
});
