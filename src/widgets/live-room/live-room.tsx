import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useConnectionState,
  useLocalParticipant,
  useLocalParticipantPermissions,
  useParticipants,
  useRoomContext,
  useTracks,
  VideoTrack,
  type TrackReferenceOrPlaceholder,
} from "@livekit/react-native";
import { ConnectionState, DisconnectReason, RoomEvent, Track, type Participant } from "livekit-client";
import {
  ArrowLeft,
  CircleStop,
  Hand,
  Info,
  LayoutDashboard,
  Mic,
  MicOff,
  MonitorUp,
  MoreHorizontal,
  PhoneOff,
  UserRoundPlus,
  UserRoundX,
  Users,
  Video,
  VideoOff,
  X,
} from "lucide-react-native";
import { useAuth } from "@/modules/auth";
import { AwayStudentsNotice, BoardSurface } from "@/modules/board";
import { FinishLessonSheet } from "@/modules/lesson";
import {
  CAMERA_SOURCE,
  canPublishSource,
  decodeScreenShareRequest,
  encodeScreenShareRequest,
  LessonInviteSheet,
  MICROPHONE_SOURCE,
  SCREEN_SHARE_SOURCE,
  useAllowShare,
  useAnswerAttention,
  useAttentionCheck,
  useBanFromLesson,
  useCameraSignals,
  useFocusTracker,
  useMicSignals,
  type AttentionCheck,
  type CameraRequest,
  type MicRequest,
} from "@/modules/live";
import type { Lesson } from "@/shared/types";
import {
  Avatar,
  radius,
  Sheet,
  SheetButton,
  SheetFooter,
  Text,
  ThemeScope,
  toast,
  useTheme,
} from "@/shared/ui";
import { LIVE_SUCCESS } from "./live-room-state";
import { LiveWatermark } from "./live-watermark";

type SidePanel = "board" | "people" | null;

const MAX_RECONNECT_ATTEMPTS = 5;
/** Veb `#d93a3a` — darsdan chiqish tugmasi. */
const LEAVE_RED = "#d93a3a";
/** "Boshqa amallar" menyusi foni (veb qorong'i `bg-surface` qatlami). */
const MENU_BG = "#161c23";

function firstName(value: string): string {
  return value.trim().split(/\s+/)[0] ?? value;
}

export interface LiveRoomProps {
  lesson: Lesson;
  isTeacher: boolean;
  onLeave: () => void;
}

/**
 * Jonli dars xonasi — veb `widgets/live-room/live-room.tsx` ning tor ekran
 * ko'rinishi: qorong'i sarlavha, 2 ustunli kamera setkasi, pastda dumaloq
 * boshqaruvlar, "Boshqa amallar" menyusi, ishtirokchilar oynasi va doska.
 *
 * Vebdan farqi: o'qituvchining brauzerdagi audio/video yozuvi mobilda yo'q
 * (yozuv server tomonda), shuning uchun "Audio yozilmoqda" belgisi ham yo'q.
 */
export function LiveRoom(props: LiveRoomProps) {
  return (
    <ThemeScope scheme="dark">
      <RoomBody {...props} />
    </ThemeScope>
  );
}

function RoomBody({ lesson, isTeacher, onLeave }: LiveRoomProps) {
  const { t } = useTranslation("live");
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [panel, setPanel] = useState<SidePanel>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const connectionState = useConnectionState();
  const participants = useParticipants();
  const room = useRoomContext();
  const attention = useAttentionCheck(lesson.id, !isTeacher);
  const mic = useMicSignals(lesson.id, isTeacher);
  const camera = useCameraSignals(lesson.id, isTeacher);
  const allowShare = useAllowShare(lesson.id);
  useFocusTracker(lesson.id, !isTeacher);

  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );
  const screenTracks = tracks.filter((track) => track.source === Track.Source.ScreenShare);
  const cameraTracks = tracks.filter((track) => track.source === Track.Source.Camera);
  const activeShare = screenTracks[0] ?? null;
  const pendingRequestsCount = mic.requests.length + camera.requests.length;

  const boardOpen = panel === "board";
  const peopleOpen = panel === "people";
  const [joinedAt] = useState(() => new Date());
  const joinedLabel = `${String(joinedAt.getHours()).padStart(2, "0")}:${String(joinedAt.getMinutes()).padStart(2, "0")}`;
  const connected = connectionState === ConnectionState.Connected;
  const connectionLabel =
    {
      [ConnectionState.Connecting]: t("connection.connecting"),
      [ConnectionState.Connected]: t("connection.connected"),
      [ConnectionState.Reconnecting]: t("connection.reconnecting"),
      [ConnectionState.Disconnected]: t("connection.disconnected"),
    }[connectionState as string] ?? connectionState;

  /* Veb `onDisconnected`: o'qituvchi chetlashtirganda sababi aytiladi. */
  useEffect(() => {
    function onDisconnected(reason?: DisconnectReason) {
      if (reason === DisconnectReason.PARTICIPANT_REMOVED) toast.error("Siz darsdan chetlashtirildingiz");
    }
    room.on(RoomEvent.Disconnected, onDisconnected);
    return () => {
      room.off(RoomEvent.Disconnected, onDisconnected);
    };
  }, [room]);

  /* Veb `ShareRequestListener`: o'quvchi ekran ulashish so'rovi. */
  useEffect(() => {
    if (!isTeacher) return undefined;
    function receive(payload: Uint8Array, participant?: Participant, _kind?: unknown, topic?: string) {
      const request = decodeScreenShareRequest(payload, topic);
      if (!request || !participant) return;
      const identity = participant.identity;
      const name = request.name || participant.name || identity;
      toast(t("share.requestNotifyTitle", { name }), {
        description: t("share.requestNotifyDescription"),
        duration: 12_000,
        action: { label: t("share.grantAction"), onClick: () => allowShare.mutate(identity) },
      });
    }
    room.on(RoomEvent.DataReceived, receive);
    return () => {
      room.off(RoomEvent.DataReceived, receive);
    };
  }, [allowShare, isTeacher, room, t]);

  return (
    <View style={[styles.root, { backgroundColor: palette.background, paddingTop: insets.top }]}>
      {/* `px-4 pt-3 pb-2.5 gap-2.5` */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable accessibilityRole="button" accessibilityLabel={t("room.leaveAria")} onPress={onLeave} style={styles.back}>
            <ArrowLeft size={20} color={palette["muted-foreground"]} />
          </Pressable>
          <View style={styles.grow}>
            <View style={styles.titleRow}>
              <View style={[styles.dot, { backgroundColor: connected ? LIVE_SUCCESS : palette["saffron-strong"] }]} />
              <Text variant="body" numberOfLines={1} style={[styles.grow, styles.heading]}>
                {lesson.title}
              </Text>
            </View>
            <Text variant="caption" numberOfLines={1} style={[styles.caption, { color: palette["subtle-foreground"] }]}>
              {lesson.courseTitle} · {connectionLabel}
              {connected ? ` · ${joinedLabel}` : ""}
            </Text>
          </View>
          <View style={[styles.count, { backgroundColor: palette["surface-subtle"] }]}>
            <Users size={15} color={palette.foreground} />
            <Text variant="label">{participants.length}</Text>
          </View>
          {isTeacher ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("room.inviteAria")}
              onPress={() => setInviteOpen(true)}
              style={[styles.invite, { backgroundColor: palette["surface-subtle"] }]}
            >
              <UserRoundPlus size={18} color={palette.foreground} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {boardOpen || peopleOpen ? (
        <View style={styles.switch}>
          {(["video", "board", "people"] as const).map((item) => {
            const active = item === "video" ? !boardOpen && !peopleOpen : item === "board" ? boardOpen : peopleOpen;
            return (
              <Pressable
                key={item}
                accessibilityRole="button"
                onPress={() => setPanel(item === "video" ? null : item)}
                style={[styles.switchItem, active && { backgroundColor: palette["surface-subtle"] }]}
              >
                <Text variant="label" style={{ color: active ? palette.foreground : palette["subtle-foreground"] }}>
                  {t(`room.switch.${item}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <ReconnectBanner />

      {/* `px-4 pb-24` — pastki boshqaruvlar ustiga chiqmasin. */}
      <View style={[styles.stage, { paddingBottom: 96 + insets.bottom }]}>
        {boardOpen ? (
          <BoardSurface lessonId={lesson.id} courseId={lesson.courseId} />
        ) : activeShare ? (
          <View style={styles.shareLayout}>
            <View style={[styles.shareMain, { backgroundColor: palette["surface-subtle"] }]}>
              <VideoTrack trackRef={activeShare as never} style={styles.fill} objectFit="contain" />
            </View>
            <ScrollView style={styles.filmstrip} contentContainerStyle={styles.filmstripContent}>
              {cameraTracks.map((track) => (
                <CameraTile key={`${track.participant.identity}-${track.source}`} track={track} compact />
              ))}
            </ScrollView>
          </View>
        ) : cameraTracks.length ? (
          <ScrollView contentContainerStyle={styles.grid}>
            {cameraTracks.map((track) => (
              <View key={`${track.participant.identity}-${track.source}`} style={styles.gridCell}>
                <CameraTile track={track} />
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.empty}>
            <Video size={30} color={palette["subtle-foreground"]} />
            <Text variant="label" style={[styles.regular, { color: palette["subtle-foreground"] }]}>
              {t("room.empty")}
            </Text>
          </View>
        )}
        {!boardOpen ? <LiveWatermark name={user?.name ?? user?.username ?? ""} id={user?.id ?? ""} /> : null}
      </View>

      {moreOpen ? (
        <Pressable accessibilityRole="button" onPress={() => setMoreOpen(false)} style={StyleSheet.absoluteFill} />
      ) : null}

      <View style={[styles.footer, { paddingBottom: 20 + insets.bottom }]} pointerEvents="box-none">
        <View style={styles.controls}>
          <MicControl
            isTeacher={isTeacher}
            onRequest={mic.requestMic}
            requesting={mic.requesting}
            waiting={mic.waiting}
          />
          <CameraControl
            isTeacher={isTeacher}
            onRequest={camera.requestCamera}
            requesting={camera.requesting}
            waiting={camera.waiting}
          />
          {!isTeacher ? <StudentShareControl /> : null}

          <ControlButton
            label={t("room.openBoardAria")}
            active={boardOpen}
            onPress={() => setPanel(boardOpen ? null : "board")}
          >
            <LayoutDashboard size={19} color={boardOpen ? palette["primary-foreground"] : palette.foreground} />
          </ControlButton>

          <View>
            <ControlButton label={t("room.moreAria")} active={moreOpen} onPress={() => setMoreOpen((current) => !current)}>
              <MoreHorizontal size={19} color={moreOpen ? palette["primary-foreground"] : palette.foreground} />
              {pendingRequestsCount ? (
                <View style={styles.badge}>
                  <Text variant="caption" style={styles.badgeText}>
                    {pendingRequestsCount}
                  </Text>
                </View>
              ) : null}
            </ControlButton>

            {moreOpen ? (
              <View style={[styles.menu, { backgroundColor: MENU_BG }]}>
                <MenuItem
                  icon={<Users size={17} color={palette.foreground} />}
                  label={t("room.participants")}
                  onPress={() => {
                    setMoreOpen(false);
                    setPanel(peopleOpen ? null : "people");
                  }}
                  trailing={
                    pendingRequestsCount ? (
                      <View style={[styles.menuBadge, { backgroundColor: palette.primary }]}>
                        <Text variant="caption" style={[styles.strong, { color: palette["primary-foreground"] }]}>
                          {pendingRequestsCount}
                        </Text>
                      </View>
                    ) : null
                  }
                />
                {isTeacher ? (
                  <MenuItem
                    icon={<CircleStop size={17} color={palette["destructive-strong"]} />}
                    label={t("room.finish")}
                    color={palette["destructive-strong"]}
                    onPress={() => {
                      setMoreOpen(false);
                      setFinishOpen(true);
                    }}
                  />
                ) : null}
              </View>
            ) : null}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("room.leave")}
            onPress={() => void room.disconnect()}
            style={({ pressed }) => [styles.leave, { opacity: pressed ? 0.9 : 1 }]}
          >
            <PhoneOff size={19} color="#ffffff" />
          </Pressable>
        </View>
      </View>

      <AwayStudentsNotice lessonId={lesson.id} enabled={isTeacher} />

      {/* Vebda quyidagi oynalar portal orqali ilova mavzusida chiqadi. */}
      <ThemeScope scheme={null}>
        {isTeacher ? (
          <LessonInviteSheet
            lessonId={lesson.id}
            courseId={lesson.courseId}
            open={inviteOpen}
            onClose={() => setInviteOpen(false)}
          />
        ) : null}

        {isTeacher ? (
          <FinishLessonSheet
            lesson={finishOpen ? lesson : null}
            onClose={() => setFinishOpen(false)}
            onFinished={onLeave}
            onLeaveOnly={onLeave}
          />
        ) : null}

        <Sheet
          open={peopleOpen}
          onClose={() => setPanel(null)}
          title={t("room.participantsCount", { count: participants.length })}
        >
          <ParticipantsPanel
            lessonId={lesson.id}
            isTeacher={isTeacher}
            micRequests={mic.requests}
            onGrantMic={mic.grant.mutate}
            onDenyMic={mic.deny.mutate}
            micAnswerPending={mic.grant.isPending || mic.deny.isPending}
            cameraRequests={camera.requests}
            onGrantCamera={camera.grant.mutate}
            onDenyCamera={camera.deny.mutate}
            cameraAnswerPending={camera.grant.isPending || camera.deny.isPending}
            onInvite={() => {
              setPanel(null);
              setInviteOpen(true);
            }}
          />
        </Sheet>

        {!isTeacher ? <AttentionCheckSheet lessonId={lesson.id} check={attention.data} /> : null}
      </ThemeScope>
    </View>
  );
}

function CameraTile({ track, compact = false }: { track: TrackReferenceOrPlaceholder; compact?: boolean }) {
  const { t } = useTranslation("live");
  const { palette } = useTheme();
  const publication = "publication" in track ? track.publication : undefined;
  const cameraOff = !publication || publication.isMuted;
  const name = track.participant.name || track.participant.identity;
  const speaking = track.participant.isSpeaking;
  const micOn = track.participant.isMicrophoneEnabled;

  return (
    <View
      style={[
        styles.tile,
        compact && styles.tileCompact,
        {
          backgroundColor: palette["surface-subtle"],
          borderColor: speaking ? LIVE_SUCCESS : palette.border,
          borderWidth: speaking ? 2 : 1,
        },
      ]}
    >
      {cameraOff ? (
        <View style={styles.placeholder} accessibilityLabel={t("room.cameraOffAria", { name })}>
          <Avatar variant="legacy" name={name} size={compact ? "sm" : "xl"} />
        </View>
      ) : (
        <VideoTrack trackRef={track as never} style={styles.fill} objectFit="cover" mirror={track.participant.isLocal} />
      )}
      <View style={styles.tileName}>
        {micOn ? <Mic size={15} color="#ffffff" /> : <MicOff size={15} color="rgba(255,255,255,0.7)" />}
        <Text variant="label" numberOfLines={1} style={styles.white}>
          {track.participant.isLocal ? t("room.youLabel") : firstName(name)}
        </Text>
      </View>
    </View>
  );
}

function ReconnectBanner() {
  const { t } = useTranslation("live");
  const { palette } = useTheme();
  const room = useRoomContext();
  const connectionState = useConnectionState();
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const onReconnecting = () => setAttempt((current) => Math.min(current + 1, MAX_RECONNECT_ATTEMPTS));
    const onReconnected = () => setAttempt(0);
    room.on(RoomEvent.Reconnecting, onReconnecting);
    room.on(RoomEvent.Reconnected, onReconnected);
    return () => {
      room.off(RoomEvent.Reconnecting, onReconnecting);
      room.off(RoomEvent.Reconnected, onReconnected);
    };
  }, [room]);

  if (connectionState !== ConnectionState.Reconnecting) return null;
  return (
    <View style={styles.reconnect} pointerEvents="none">
      <View style={[styles.reconnectBody, { backgroundColor: "#fdefcf" }]}>
        <Info size={17} color="#b87d14" />
        <Text variant="label" style={[styles.regular, styles.shrink, { color: palette.background }]}>
          {t("room.reconnecting", { attempt: Math.max(1, attempt), total: MAX_RECONNECT_ATTEMPTS })}
        </Text>
      </View>
    </View>
  );
}

/** `.live-control`: 48px doira; `is-active` — asosiy rang. */
function ControlButton({
  label,
  active = false,
  tone,
  disabled = false,
  onPress,
  children,
}: {
  label: string;
  active?: boolean;
  tone?: string;
  disabled?: boolean;
  onPress?: () => void;
  children: ReactNode;
}) {
  const { palette } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.control,
        { backgroundColor: tone ?? (active ? palette.primary : pressed ? palette.muted : palette.surface) },
        disabled && styles.dim,
      ]}
    >
      {children}
    </Pressable>
  );
}

/** `.live-control--mic-request`: saffron fon, burchakda qo'l. */
function RequestButton({
  label,
  waiting,
  disabled,
  onPress,
  icon,
}: {
  label: string;
  waiting: boolean;
  disabled: boolean;
  onPress: () => void;
  icon: ReactNode;
}) {
  const { palette } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, busy: waiting }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.control,
        { backgroundColor: palette["saffron-soft"] },
        waiting && { borderWidth: 1, borderColor: palette["saffron-strong"] },
        disabled && !waiting && styles.dim,
      ]}
    >
      {icon}
      <View style={styles.corner}>
        <Hand size={13} color={palette["saffron-strong"]} />
      </View>
    </Pressable>
  );
}

function MicControl({
  isTeacher,
  onRequest,
  requesting,
  waiting,
}: {
  isTeacher: boolean;
  onRequest: () => void;
  requesting: boolean;
  waiting: boolean;
}) {
  const { t } = useTranslation("live");
  const { palette } = useTheme();
  const permissions = useLocalParticipantPermissions();
  const { localParticipant } = useLocalParticipant();
  const on = localParticipant.isMicrophoneEnabled;

  if (canPublishSource(permissions, MICROPHONE_SOURCE))
    return (
      <ControlButton
        label={t("mic.label")}
        tone={on ? undefined : palette.destructive}
        onPress={() => void localParticipant.setMicrophoneEnabled(!on).catch(() => undefined)}
      >
        {on ? <Mic size={19} color={palette.foreground} /> : <MicOff size={19} color="#ffffff" />}
      </ControlButton>
    );
  if (isTeacher)
    return (
      <ControlButton label={t("mic.disabledAria")} disabled>
        <MicOff size={19} color={palette.foreground} />
      </ControlButton>
    );
  return (
    <RequestButton
      label={waiting ? t("mic.requestSentAria") : t("mic.requestAria")}
      waiting={waiting}
      disabled={requesting || waiting}
      onPress={onRequest}
      icon={<MicOff size={19} color={palette["saffron-strong"]} />}
    />
  );
}

function CameraControl({
  isTeacher,
  onRequest,
  requesting,
  waiting,
}: {
  isTeacher: boolean;
  onRequest: () => void;
  requesting: boolean;
  waiting: boolean;
}) {
  const { t } = useTranslation("live");
  const { palette } = useTheme();
  const permissions = useLocalParticipantPermissions();
  const { localParticipant } = useLocalParticipant();
  const on = localParticipant.isCameraEnabled;

  if (canPublishSource(permissions, CAMERA_SOURCE))
    return (
      <ControlButton
        label={t("camera.label")}
        tone={on ? undefined : palette.destructive}
        onPress={() => void localParticipant.setCameraEnabled(!on).catch(() => undefined)}
      >
        {on ? <Video size={19} color={palette.foreground} /> : <VideoOff size={19} color="#ffffff" />}
      </ControlButton>
    );
  if (isTeacher)
    return (
      <ControlButton label={t("camera.disabledAria")} disabled>
        <VideoOff size={19} color={palette.foreground} />
      </ControlButton>
    );
  return (
    <RequestButton
      label={waiting ? t("camera.requestSentAria") : t("camera.requestAria")}
      waiting={waiting}
      disabled={requesting || waiting}
      onPress={onRequest}
      icon={<VideoOff size={19} color={palette["saffron-strong"]} />}
    />
  );
}

/**
 * O'quvchi ekran ulashishi — veb `StudentShareControl`. Ruxsat bo'lsa
 * ulashadi (Android MediaProjection), bo'lmasa o'qituvchidan so'raydi.
 */
function StudentShareControl() {
  const { t } = useTranslation("live");
  const { palette } = useTheme();
  const permissions = useLocalParticipantPermissions();
  const { localParticipant } = useLocalParticipant();
  const [requesting, setRequesting] = useState(false);
  const sharing = localParticipant.isScreenShareEnabled;

  if (canPublishSource(permissions, SCREEN_SHARE_SOURCE))
    return (
      <ControlButton
        label={t("share.studentAria")}
        active={sharing}
        onPress={() => void localParticipant.setScreenShareEnabled(!sharing).catch(() => toast.error(t("share.failedToast")))}
      >
        <MonitorUp size={19} color={sharing ? palette["primary-foreground"] : palette.foreground} />
      </ControlButton>
    );

  async function requestShare() {
    if (requesting) return;
    setRequesting(true);
    try {
      const signal = encodeScreenShareRequest(localParticipant.name || localParticipant.identity);
      await localParticipant.publishData(signal.payload, { reliable: true, topic: signal.topic });
      toast.success(t("share.requestSentToast"));
    } catch {
      toast.error(t("share.requestFailedToast"));
    } finally {
      setRequesting(false);
    }
  }

  return (
    <ControlButton label={t("share.requestAria")} disabled={requesting} onPress={() => void requestShare()}>
      <MonitorUp size={19} color={palette.foreground} />
      <View style={styles.requestDot} />
    </ControlButton>
  );
}

function MenuItem({
  icon,
  label,
  color,
  trailing,
  onPress,
}: {
  icon: ReactNode;
  label: string;
  color?: string;
  trailing?: ReactNode;
  onPress: () => void;
}) {
  const { palette } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.menuItem, pressed && { backgroundColor: palette["surface-subtle"] }]}
    >
      {icon}
      <Text variant="label" style={[styles.grow, { color: color ?? palette.foreground }]}>
        {label}
      </Text>
      {trailing}
    </Pressable>
  );
}

const ATTENTION_WINDOW_MS = 15_000;

/** Veb `AttentionCheckDialog`: katta soat va bitta "Ha, shu yerdaman" tugmasi. */
function AttentionCheckSheet({ lessonId, check }: { lessonId: string; check: AttentionCheck | null | undefined }) {
  const { t } = useTranslation("live");
  const { palette } = useTheme();
  const answer = useAnswerAttention(lessonId);
  const [seconds, setSeconds] = useState(ATTENTION_WINDOW_MS / 1000);

  useEffect(() => {
    if (!check) return undefined;
    const update = () =>
      setSeconds(Math.max(0, Math.ceil((new Date(check.dueAt).getTime() + ATTENTION_WINDOW_MS - Date.now()) / 1000)));
    update();
    const id = setInterval(update, 250);
    return () => clearInterval(id);
  }, [check]);

  const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  return (
    <Sheet
      open={Boolean(check)}
      onClose={() => undefined}
      title={t("attentionCheck.title")}
      description={t("attentionCheck.description", { time: clock })}
    >
      <Text variant="title" style={[styles.clock, { color: palette.primary }]}>
        {clock}
      </Text>
      <SheetFooter>
        <SheetButton
          variant="primary"
          title={t("attentionCheck.respond")}
          disabled={seconds <= 0 || answer.isPending}
          onPress={() => check && answer.mutate(check.id)}
        />
      </SheetFooter>
    </Sheet>
  );
}

interface ParticipantsPanelProps {
  lessonId: string;
  isTeacher: boolean;
  micRequests: MicRequest[];
  onGrantMic: (studentId: string) => void;
  onDenyMic: (studentId: string) => void;
  micAnswerPending: boolean;
  cameraRequests: CameraRequest[];
  onGrantCamera: (studentId: string) => void;
  onDenyCamera: (studentId: string) => void;
  cameraAnswerPending: boolean;
  onInvite: () => void;
}

function RequestRow({
  name,
  index,
  note,
  pending,
  onGrant,
  onDeny,
}: {
  name: string;
  index: number;
  note: string;
  pending: boolean;
  onGrant: () => void;
  onDeny: () => void;
}) {
  const { t } = useTranslation("live");
  const { palette } = useTheme();
  return (
    <View style={[styles.requestRow, { backgroundColor: palette["surface-subtle"] }]}>
      <View style={[styles.requestIndex, { backgroundColor: palette.primary }]}>
        <Text variant="caption" style={[styles.strong, { color: palette["primary-foreground"] }]}>
          {index + 1}
        </Text>
      </View>
      <Avatar variant="legacy" name={name} size="sm" />
      <View style={styles.grow}>
        <Text variant="label" numberOfLines={1}>
          {name}
        </Text>
        <Text variant="caption" numberOfLines={1} style={[styles.caption, { color: palette["subtle-foreground"] }]}>
          {note}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        disabled={pending}
        onPress={onGrant}
        style={[styles.grant, { backgroundColor: palette.primary }, pending && styles.dim]}
      >
        <Text variant="label" style={{ color: palette["primary-foreground"] }}>
          {t("participantsPanel.grant")}
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("participantsPanel.denyAria", { name })}
        disabled={pending}
        onPress={onDeny}
        style={styles.deny}
      >
        <X size={16} color={palette["destructive-strong"]} />
      </Pressable>
    </View>
  );
}

function ParticipantsPanel({
  lessonId,
  isTeacher,
  micRequests,
  onGrantMic,
  onDenyMic,
  micAnswerPending,
  cameraRequests,
  onGrantCamera,
  onDenyCamera,
  cameraAnswerPending,
  onInvite,
}: ParticipantsPanelProps) {
  const { t } = useTranslation("live");
  const { palette } = useTheme();
  const participants = useParticipants();
  const allowShare = useAllowShare(lessonId);
  const ban = useBanFromLesson(lessonId);
  const raisedHands = new Set([...micRequests.map((request) => request.name), ...cameraRequests.map((request) => request.name)]);

  return (
    <View style={styles.panel}>
      {micRequests.length ? (
        <View style={styles.requestGroup}>
          <View style={styles.groupHead}>
            <Hand size={13} color={palette["subtle-foreground"]} />
            <Text variant="caption" style={[styles.overline, { color: palette["subtle-foreground"] }]}>
              {t("participantsPanel.wantsToSpeak", { count: micRequests.length })}
            </Text>
          </View>
          {micRequests.map((request, index) => (
            <RequestRow
              key={request.studentId}
              name={request.name}
              index={index}
              note={t("participantsPanel.micRequesting")}
              pending={micAnswerPending}
              onGrant={() => onGrantMic(request.studentId)}
              onDeny={() => onDenyMic(request.studentId)}
            />
          ))}
        </View>
      ) : null}

      {cameraRequests.length ? (
        <View style={styles.requestGroup}>
          <View style={styles.groupHead}>
            <Video size={13} color={palette["subtle-foreground"]} />
            <Text variant="caption" style={[styles.overline, { color: palette["subtle-foreground"] }]}>
              {t("participantsPanel.wantsCamera", { count: cameraRequests.length })}
            </Text>
          </View>
          {cameraRequests.map((request, index) => (
            <RequestRow
              key={request.studentId}
              name={request.name}
              index={index}
              note={t("participantsPanel.cameraRequesting")}
              pending={cameraAnswerPending}
              onGrant={() => onGrantCamera(request.studentId)}
              onDeny={() => onDenyCamera(request.studentId)}
            />
          ))}
        </View>
      ) : null}

      <View>
        {participants.map((participant) => {
          const name = participant.name || participant.identity;
          const speaking = participant.isSpeaking;
          const raisedHand = raisedHands.has(name);
          const note = participant.isLocal
            ? isTeacher
              ? t("participantsPanel.teacherYou")
              : t("participantsPanel.you")
            : speaking
              ? t("participantsPanel.speaking")
              : raisedHand
                ? t("participantsPanel.raisedHand")
                : t("participantsPanel.participant");
          return (
            <View key={participant.identity} style={styles.person}>
              <Avatar variant="legacy" name={name} size="sm" />
              <View style={styles.grow}>
                <Text variant="label" numberOfLines={1}>
                  {name}
                </Text>
                <Text
                  variant="caption"
                  numberOfLines={1}
                  style={[styles.caption, { color: speaking ? palette["success-strong"] : palette["subtle-foreground"] }]}
                >
                  {note}
                </Text>
              </View>
              {raisedHand ? <Hand size={16} color={palette["saffron-strong"]} /> : null}
              {participant.isMicrophoneEnabled ? (
                <Mic size={16} color={palette["muted-foreground"]} />
              ) : (
                <MicOff size={16} color={palette["destructive-strong"]} />
              )}
              {participant.isCameraEnabled ? (
                <Video size={16} color={palette["muted-foreground"]} />
              ) : (
                <VideoOff size={16} color={palette["destructive-strong"]} />
              )}
              {/* Vebda bu tugmalar sichqoncha ustida chiqadi; telefonda doim ko'rinadi. */}
              {isTeacher && !participant.isLocal ? (
                <View style={styles.personActions}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t("participantsPanel.allowShare")}
                    disabled={allowShare.isPending}
                    onPress={() => allowShare.mutate(participant.identity)}
                    style={styles.personAction}
                  >
                    <MonitorUp size={15} color={palette["muted-foreground"]} />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t("participantsPanel.banAria", { name })}
                    disabled={ban.isPending}
                    onPress={() => ban.mutate(participant.identity)}
                    style={styles.personAction}
                  >
                    <UserRoundX size={15} color={palette["destructive-strong"]} />
                  </Pressable>
                </View>
              ) : null}
            </View>
          );
        })}
        {!participants.length ? (
          <Text variant="label" style={[styles.regular, styles.emptyPeople, { color: palette["subtle-foreground"] }]}>
            {t("participantsPanel.empty")}
          </Text>
        ) : null}
      </View>

      {isTeacher ? (
        <View style={[styles.panelFooter, { borderTopColor: palette.border }]}>
          <Pressable
            accessibilityRole="button"
            onPress={() => toast.info(t("participantsPanel.muteAllUnavailable"))}
            style={[styles.panelButton, { borderWidth: 1, borderColor: palette.border }]}
          >
            <Text variant="label">{t("participantsPanel.muteAll")}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onInvite} style={[styles.panelButton, { backgroundColor: palette.primary }]}>
            <Text variant="label" style={{ color: palette["primary-foreground"] }}>
              {t("participantsPanel.invite")}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  shrink: { flexShrink: 1 },
  fill: { width: "100%", height: "100%" },
  regular: { fontWeight: "400" },
  strong: { fontWeight: "600" },
  caption: { fontWeight: "500" },
  white: { color: "#ffffff" },
  overline: { fontWeight: "600", letterSpacing: 0.3, textTransform: "uppercase" },
  header: { gap: 10, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  back: { width: 36, height: 36, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  heading: { fontFamily: "Unbounded-SemiBold", fontWeight: "600" },
  dot: { width: 8, height: 8, borderRadius: radius.full },
  count: { height: 36, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, borderRadius: radius.full },
  invite: { width: 36, height: 36, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  /* `px-4 pb-2 gap-1` */
  switch: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 16, paddingBottom: 8 },
  switchItem: { height: 36, justifyContent: "center", paddingHorizontal: 14, borderRadius: radius.full },
  stage: { flex: 1, paddingHorizontal: 16 },
  shareLayout: { flex: 1, flexDirection: "row", gap: 12 },
  shareMain: { flex: 1, overflow: "hidden", borderRadius: radius["2xl"] },
  filmstrip: { width: 180, flexGrow: 0 },
  filmstripContent: { gap: 12 },
  /* `grid-cols-2 gap-4` */
  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -8, rowGap: 16 },
  gridCell: { width: "50%", paddingHorizontal: 8 },
  tile: { aspectRatio: 4 / 3, overflow: "hidden", borderRadius: radius["2xl"] },
  tileCompact: { borderRadius: 12 },
  placeholder: { position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0, alignItems: "center", justifyContent: "center" },
  tileName: {
    position: "absolute",
    left: 12,
    bottom: 12,
    maxWidth: "80%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  reconnect: { position: "absolute", left: 0, right: 0, top: 12, zIndex: 30, alignItems: "center", paddingHorizontal: 16 },
  reconnectBody: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderRadius: radius.xl },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 20, alignItems: "center", paddingHorizontal: 16 },
  controls: { flexDirection: "row", alignItems: "center", gap: 12 },
  control: { width: 48, height: 48, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  dim: { opacity: 0.65 },
  corner: { position: "absolute", right: 6, bottom: 5 },
  requestDot: { position: "absolute", top: 5, right: 5, width: 7, height: 7, borderRadius: radius.full, backgroundColor: "#f0ac57" },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    backgroundColor: "#f0ac57",
  },
  badgeText: { color: "#241a08", fontWeight: "700", fontSize: 11, lineHeight: 14 },
  leave: { width: 52, height: 52, borderRadius: radius.full, alignItems: "center", justifyContent: "center", backgroundColor: LEAVE_RED },
  /* `bottom-[calc(100%+10px)] right-0 w-[230px] rounded-2xl p-2 gap-1` */
  menu: {
    position: "absolute",
    right: 0,
    bottom: 58,
    width: 230,
    gap: 4,
    padding: 8,
    borderRadius: radius["2xl"],
    shadowColor: "#000000",
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  menuItem: { height: 44, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, borderRadius: radius.xl },
  menuBadge: { width: 24, height: 24, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  finishIcon: { width: 44, height: 44, borderRadius: radius["2xl"], alignItems: "center", justifyContent: "center" },
  clock: { fontSize: 40, lineHeight: 48 },
  panel: { gap: 12 },
  requestGroup: { gap: 8 },
  groupHead: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 4 },
  requestRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderRadius: radius.xl },
  requestIndex: { width: 24, height: 24, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  grant: { height: 32, justifyContent: "center", paddingHorizontal: 12, borderRadius: radius.full },
  deny: { width: 32, height: 32, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  person: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 4, paddingVertical: 8 },
  personActions: { flexDirection: "row", alignItems: "center", gap: 4 },
  personAction: { width: 32, height: 32, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  emptyPeople: { paddingHorizontal: 4, paddingVertical: 12 },
  panelFooter: { flexDirection: "row", alignItems: "center", gap: 8, paddingTop: 12, borderTopWidth: 1 },
  panelButton: { flex: 1, height: 44, alignItems: "center", justifyContent: "center", borderRadius: radius.full },
});
