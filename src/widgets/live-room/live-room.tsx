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
import { Hand, Info, MicOff, MonitorUp, UserRoundX, VideoOff, X } from "lucide-react-native";
import { useAuth } from "@/modules/auth";
import { AwayStudentsNotice, BoardPreview, BoardSurface } from "@/modules/board";
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
  useMuteAll,
  type AttentionCheck,
  type CameraRequest,
  type MicRequest,
} from "@/modules/live";
import type { Lesson } from "@/shared/types";
import {
  Avatar,
  ConfirmDialog,
  dsAlpha,
  DsText,
  dsRadius,
  Icon,
  MobileButton,
  Sheet,
  ThemeScope,
  toast,
  useDs,
} from "@/shared/ui";
import { LiveWatermark } from "./live-watermark";
import { formatElapsed, useElapsedSeconds } from "./use-elapsed-seconds";

const MAX_RECONNECT_ATTEMPTS = 5;
const MAX_TILES = 6;

function firstName(value: string): string {
  return value.trim().split(/\s+/)[0] ?? value;
}

export interface LiveRoomProps {
  lesson: Lesson;
  isTeacher: boolean;
  onLeave: () => void;
}

/**
 * Jonli dars xonasi — veb `live-room.tsx` + `mobile-live-room.tsx` (tor
 * ekran, qorong'i): sarlavhada orqaga, o'tgan vaqt va ishtirokchilar soni;
 * yorug' sahna kartasi (ekran ulashish yoki doska ko'rinishi), 3 ustunli
 * kamera plitkalari, pastda mikrofon, kamera, ulashish, doska, ishtirokchilar
 * va yakunlash/chiqish tugmalari.
 *
 * Vebdan farqi: o'qituvchining brauzerdagi audio/video yozuvi mobilda yo'q
 * (yozuv server tomonda), shuning uchun "REC" belgisi ko'rsatilmaydi.
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
  const ds = useDs();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [boardOpen, setBoardOpen] = useState(false);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [shareRequest, setShareRequest] = useState<{ identity: string; name: string } | null>(null);
  const [joinedAt] = useState(() => new Date());
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
  const cameraTracks = tracks.filter((track) => track.source === Track.Source.Camera);
  const activeShare = tracks.find((track) => track.source === Track.Source.ScreenShare) ?? null;
  const requests = mic.requests.length + camera.requests.length;

  const ordered = [...cameraTracks.filter((track) => track.participant.isLocal), ...cameraTracks.filter((track) => !track.participant.isLocal)];
  const visible = ordered.length > MAX_TILES ? ordered.slice(0, MAX_TILES - 1) : ordered;
  const overflow = ordered.length - visible.length;

  /* O'qituvchi chetlashtirganda sababi aytiladi (veb `onDisconnected`). */
  useEffect(() => {
    function onDisconnected(reason?: DisconnectReason) {
      if (reason === DisconnectReason.PARTICIPANT_REMOVED) toast.error("Siz darsdan chetlashtirildingiz");
    }
    room.on(RoomEvent.Disconnected, onDisconnected);
    return () => {
      room.off(RoomEvent.Disconnected, onDisconnected);
    };
  }, [room]);

  /* O'quvchining ekran ulashish so'rovi — tor ekranda tasdiqlash oynasi (veb `ShareRequestListener`). */
  useEffect(() => {
    if (!isTeacher) return undefined;
    function receive(payload: Uint8Array, participant?: Participant, _kind?: unknown, topic?: string) {
      const request = decodeScreenShareRequest(payload, topic);
      if (!request || !participant) return;
      setShareRequest({ identity: participant.identity, name: request.name || participant.name || participant.identity });
    }
    room.on(RoomEvent.DataReceived, receive);
    return () => {
      room.off(RoomEvent.DataReceived, receive);
    };
  }, [isTeacher, room]);

  return (
    <View style={[styles.root, { backgroundColor: ds.c.canvas, paddingTop: insets.top + 20 }]}>
      <ReconnectBanner />

      {/* `h-11 px-4 gap-3`: orqaga, o'tgan vaqt, ishtirokchilar */}
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel={t("room.leaveAria")} onPress={onLeave} style={[styles.back, { backgroundColor: ds.c["surface-inverse"] }]}>
          <Icon name="chevron-left" size={22} color={ds.c["ink-inverse"]} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Elapsed startedAt={joinedAt} />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("room.participants")}
          onPress={() => setPeopleOpen(true)}
          style={[styles.count, { backgroundColor: ds.c.subtle }]}
        >
          <Icon name="person" size={16} color={ds.c.ink} />
          <DsText v="title-sm" w="600" numeric>
            {participants.length}
          </DsText>
          {requests ? <View style={[styles.countDot, { backgroundColor: ds.c.danger, borderColor: ds.c.canvas }]} /> : null}
        </Pressable>
      </View>

      <ScrollView style={styles.fill} contentContainerStyle={styles.content}>
        {/* Sahna — `h-75.5 rounded-2xl bg-surface`, doim yorug' */}
        <ThemeScope scheme="light">
          <StageCard>
            {activeShare && "publication" in activeShare ? (
              <VideoTrack trackRef={activeShare as never} style={styles.fill} objectFit="contain" />
            ) : (
              <BoardPreview lessonId={lesson.id} currentUserId={room.localParticipant.identity} />
            )}
          </StageCard>
        </ThemeScope>

        {/* `grid grid-cols-3 gap-x-2 gap-y-1.5`, plitka `aspect-[114/86] rounded-xl` */}
        <View style={styles.tiles}>
          {visible.map((track) => (
            <CameraTile key={`${track.participant.identity}-${track.source}`} track={track} />
          ))}
          {overflow ? (
            <View style={[styles.tile, styles.overflow, { backgroundColor: ds.c.subtle }]}>
              <DsText v="title" w="600">
                +{overflow}
              </DsText>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* `rounded-t-2xl bg-subtle/40 px-4 pt-0.5 pb-6.5 justify-between` */}
      <View style={[styles.toolbar, { backgroundColor: dsAlpha(ds.c.subtle, 0.4), paddingBottom: Math.max(26, insets.bottom + 8) }]}>
        <MicButton isTeacher={isTeacher} requesting={mic.requesting} waiting={mic.waiting} onRequest={mic.requestMic} />
        <CameraButton isTeacher={isTeacher} requesting={camera.requesting} waiting={camera.waiting} onRequest={camera.requestCamera} />
        <ShareButton />
        <ToolbarButton icon={<Icon name="edit" size={22} color={boardOpen ? ds.c["on-action"] : ds.c.ink} />} label={t("room.board")} tone={boardOpen ? "active" : "default"} onPress={() => setBoardOpen(!boardOpen)} />
        <ToolbarButton
          icon={<Icon name="person" size={22} color={ds.c.ink} />}
          label={t("room.mobilePeople")}
          badge={isTeacher ? requests : undefined}
          onPress={() => setPeopleOpen(true)}
        />
        <ToolbarButton
          icon={<Icon name="logout" size={22} color={ds.c["on-action"]} />}
          label={isTeacher ? t("room.finish") : t("room.leave")}
          tone="danger"
          onPress={() => (isTeacher ? setFinishOpen(true) : void room.disconnect())}
        />
      </View>

      <LiveWatermark name={user?.name ?? user?.username ?? ""} id={user?.id ?? ""} />

      {boardOpen ? (
        <ThemeScope scheme="light">
          <BoardOverlay lesson={lesson} onBack={() => setBoardOpen(false)} />
        </ThemeScope>
      ) : null}

      <AwayStudentsNotice lessonId={lesson.id} enabled={isTeacher} />

      {/* Oynalar ilova mavzusida (vebda portal orqali). */}
      <ThemeScope scheme={null}>
        {isTeacher ? <LessonInviteSheet lessonId={lesson.id} courseId={lesson.courseId} open={inviteOpen} onClose={() => setInviteOpen(false)} /> : null}

        {isTeacher ? (
          <FinishLessonSheet lesson={finishOpen ? lesson : null} onClose={() => setFinishOpen(false)} onFinished={onLeave} onLeaveOnly={onLeave} />
        ) : null}

        <Sheet variant="app" open={peopleOpen} onClose={() => setPeopleOpen(false)} title={t("room.mobileParticipantsCount", { count: participants.length })}>
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
              setPeopleOpen(false);
              setInviteOpen(true);
            }}
          />
        </Sheet>

        <ConfirmDialog
          open={Boolean(shareRequest)}
          onOpenChange={(open) => !open && setShareRequest(null)}
          tone="brand"
          icon="laptop"
          title={t("share.requestNotifyTitle", { name: shareRequest?.name ?? "" })}
          description={t("share.requestNotifyDescription")}
          confirmLabel={t("share.grantAction")}
          cancelLabel={t("share.denyAction")}
          pending={allowShare.isPending}
          onConfirm={() => shareRequest && allowShare.mutate(shareRequest.identity, { onSettled: () => setShareRequest(null) })}
        />

        {!isTeacher ? <AttentionCheckSheet lessonId={lesson.id} check={attention.data} /> : null}
      </ThemeScope>
    </View>
  );
}

function Elapsed({ startedAt }: { startedAt: Date }) {
  const seconds = useElapsedSeconds(startedAt);
  return (
    <DsText v="title" w="600" numeric>
      {formatElapsed(seconds)}
    </DsText>
  );
}

function StageCard({ children }: { children: ReactNode }) {
  const ds = useDs();
  return <View style={[styles.stage, { backgroundColor: ds.c.surface }]}>{children}</View>;
}

/** Kamera plitkasi — `aspect-[114/86] rounded-xl bg-subtle`, gapirganda yashil hoshiya, pastda ism va mikrofon. */
function CameraTile({ track }: { track: TrackReferenceOrPlaceholder }) {
  const { t } = useTranslation("live");
  const ds = useDs();
  const publication = "publication" in track ? track.publication : undefined;
  const cameraOn = Boolean(publication && !publication.isMuted);
  const name = track.participant.name || track.participant.identity;
  const micOn = track.participant.isMicrophoneEnabled;

  return (
    <View style={[styles.tile, { backgroundColor: ds.c.subtle }]}>
      {cameraOn ? (
        <VideoTrack trackRef={track as never} style={StyleSheet.absoluteFill} objectFit="cover" mirror={track.participant.isLocal} />
      ) : (
        <View style={styles.tileAvatar} accessibilityLabel={t("room.cameraOffAria", { name })}>
          <Avatar variant="legacy" name={name} size="sm" box={40} />
        </View>
      )}
      {track.participant.isSpeaking ? <View pointerEvents="none" style={[styles.speaking, { borderColor: ds.c.success }]} /> : null}
      <View style={[styles.tileName, { backgroundColor: dsAlpha(ds.c.canvas, 0.7) }]}>
        <Icon name="mic" size={12} color={micOn ? ds.c.ink : ds.c["error-text"]} />
        <DsText v="caption-strong" numberOfLines={1} style={styles.shrink}>
          {track.participant.isLocal ? t("room.youLabel") : firstName(name)}
        </DsText>
      </View>
    </View>
  );
}

type ToolbarTone = "default" | "off" | "danger" | "active";

/** Pastki panel tugmasi — `size-13 rounded-full` va ostida 11px yorliq. */
function ToolbarButton({
  icon,
  label,
  tone = "default",
  disabled = false,
  badge,
  onPress,
}: {
  icon: ReactNode;
  label: string;
  tone?: ToolbarTone;
  disabled?: boolean;
  badge?: number;
  onPress?: () => void;
}) {
  const ds = useDs();
  const background: Record<ToolbarTone, string> = {
    default: ds.c.subtle,
    off: ds.c["danger-bg"],
    danger: dsAlpha(ds.c.danger, 0.85),
    active: ds.c.brand,
  };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected: tone === "active" }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.toolbarItem, disabled && styles.dim]}
    >
      <View style={[styles.toolbarCircle, { backgroundColor: background[tone] }]}>
        {icon}
        {badge ? (
          <View style={[styles.toolbarBadge, { backgroundColor: ds.c.danger }]}>
            <DsText v="micro" w="600" c="on-action">
              {badge}
            </DsText>
          </View>
        ) : null}
      </View>
      <DsText numberOfLines={1} style={styles.toolbarLabel}>
        {label}
      </DsText>
    </Pressable>
  );
}

interface RequestProps {
  isTeacher: boolean;
  requesting: boolean;
  waiting: boolean;
  onRequest: () => void;
}

function MicButton({ isTeacher, requesting, waiting, onRequest }: RequestProps) {
  const { t } = useTranslation("live");
  const ds = useDs();
  const permissions = useLocalParticipantPermissions();
  const { localParticipant } = useLocalParticipant();
  const allowed = canPublishSource(permissions, MICROPHONE_SOURCE);
  const on = localParticipant.isMicrophoneEnabled;

  if (allowed || isTeacher)
    return (
      <ToolbarButton
        icon={on ? <Icon name="mic" size={22} color={ds.c.ink} /> : <MicOff size={22} color={ds.c["error-text"]} />}
        label={t("mic.label")}
        tone={on ? "default" : "off"}
        onPress={() => (allowed ? void localParticipant.setMicrophoneEnabled(!on).catch(() => undefined) : toast.error(t("mic.disabledTitle")))}
      />
    );
  return (
    <ToolbarButton
      icon={<Hand size={22} color={waiting ? ds.c["on-action"] : ds.c.ink} />}
      label={t("mic.label")}
      tone={waiting ? "active" : "default"}
      disabled={requesting || waiting}
      onPress={onRequest}
    />
  );
}

function CameraButton({ isTeacher, requesting, waiting, onRequest }: RequestProps) {
  const { t } = useTranslation("live");
  const ds = useDs();
  const permissions = useLocalParticipantPermissions();
  const { localParticipant } = useLocalParticipant();
  const allowed = canPublishSource(permissions, CAMERA_SOURCE);
  const on = localParticipant.isCameraEnabled;

  if (allowed || isTeacher)
    return (
      <ToolbarButton
        icon={on ? <Icon name="videocam-fill" size={22} color={ds.c.ink} /> : <VideoOff size={22} color={ds.c["error-text"]} />}
        label={t("camera.label")}
        tone={on ? "default" : "off"}
        onPress={() => (allowed ? void localParticipant.setCameraEnabled(!on).catch(() => undefined) : toast.error(t("camera.disabledTitle")))}
      />
    );
  return (
    <ToolbarButton
      icon={<Hand size={22} color={waiting ? ds.c["on-action"] : ds.c.ink} />}
      label={t("camera.label")}
      tone={waiting ? "active" : "default"}
      disabled={requesting || waiting}
      onPress={onRequest}
    />
  );
}

/** Ekran ulashish: ruxsat bo'lsa yoqadi/o'chiradi (Android MediaProjection), bo'lmasa o'qituvchidan so'raydi. */
function ShareButton() {
  const { t } = useTranslation("live");
  const ds = useDs();
  const permissions = useLocalParticipantPermissions();
  const { localParticipant } = useLocalParticipant();
  const [requesting, setRequesting] = useState(false);
  const sharing = localParticipant.isScreenShareEnabled;

  if (canPublishSource(permissions, SCREEN_SHARE_SOURCE))
    return (
      <ToolbarButton
        icon={<Icon name="send" size={22} color={sharing ? ds.c["on-action"] : ds.c.ink} />}
        label={t("room.mobileShare")}
        tone={sharing ? "active" : "default"}
        onPress={() => void localParticipant.setScreenShareEnabled(!sharing).catch(() => toast.error(t("share.failedToast")))}
      />
    );

  async function request() {
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

  return <ToolbarButton icon={<Icon name="send" size={22} color={ds.c.ink} />} label={t("room.mobileShare")} disabled={requesting} onPress={() => void request()} />;
}

/** Doska to'liq ekranda — veb `fixed inset-0 bg-subtle px-3 pt-5 pb-[26px]` (yorug'). */
function BoardOverlay({ lesson, onBack }: { lesson: Lesson; onBack: () => void }) {
  const { t } = useTranslation("live");
  const ds = useDs();
  const insets = useSafeAreaInsets();
  return (
    <View style={[StyleSheet.absoluteFill, styles.board, { backgroundColor: ds.c.subtle, paddingTop: insets.top + 20, paddingBottom: Math.max(26, insets.bottom + 8) }]}>
      <View style={styles.boardHeader}>
        <Pressable accessibilityRole="button" accessibilityLabel={t("room.backToVideo")} onPress={onBack} style={[styles.back, { backgroundColor: ds.c.surface }]}>
          <Icon name="chevron-left" size={22} color={ds.c.ink} />
        </Pressable>
        <View style={styles.fill}>
          <DsText v="title" numberOfLines={1}>
            {t("room.board")}
          </DsText>
          <DsText v="body-xs" c="ink-secondary" numberOfLines={1}>
            {lesson.courseTitle} · {t("room.liveLesson")}
          </DsText>
        </View>
      </View>
      <View style={[styles.boardSurface, { backgroundColor: ds.c.surface }]}>
        <BoardSurface lessonId={lesson.id} courseId={lesson.courseId} />
      </View>
    </View>
  );
}

function ReconnectBanner() {
  const { t } = useTranslation("live");
  const ds = useDs();
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
      <View style={[styles.reconnectBody, { backgroundColor: ds.c["warning-bg"] }]}>
        <Info size={17} color={ds.c["warning-fg"]} />
        <DsText v="body-sm" c="warning-fg" style={styles.shrink}>
          {t("room.reconnecting", { attempt: Math.max(1, attempt), total: MAX_RECONNECT_ATTEMPTS })}
        </DsText>
      </View>
    </View>
  );
}

const ATTENTION_WINDOW_MS = 15_000;

/** Diqqat tekshiruvi — katta soat va bitta "Ha, shu yerdaman" tugmasi. */
function AttentionCheckSheet({ lessonId, check }: { lessonId: string; check: AttentionCheck | null | undefined }) {
  const { t } = useTranslation("live");
  const answer = useAnswerAttention(lessonId);
  const [seconds, setSeconds] = useState(ATTENTION_WINDOW_MS / 1000);

  useEffect(() => {
    if (!check) return undefined;
    const update = () => setSeconds(Math.max(0, Math.ceil((new Date(check.dueAt).getTime() + ATTENTION_WINDOW_MS - Date.now()) / 1000)));
    update();
    const id = setInterval(update, 250);
    return () => clearInterval(id);
  }, [check]);

  const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  return (
    <Sheet
      variant="app"
      open={Boolean(check)}
      onClose={() => undefined}
      title={t("attentionCheck.title")}
      description={t("attentionCheck.description", { time: clock })}
      footer={<MobileButton label={t("attentionCheck.respond")} disabled={seconds <= 0 || answer.isPending} onPress={() => check && answer.mutate(check.id)} />}
    >
      <DsText v="display" heading c="brand" style={styles.attentionClock}>
        {clock}
      </DsText>
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

/** So'rov qatori — `h-16 rounded-xl bg-accent-saffron-bg px-3 gap-3`. */
function RequestRow({ name, note, pending, secondary = false, onGrant, onDeny }: { name: string; note: string; pending: boolean; secondary?: boolean; onGrant: () => void; onDeny: () => void }) {
  const { t } = useTranslation("live");
  const ds = useDs();
  return (
    <View style={[styles.request, { backgroundColor: ds.c["accent-saffron-bg"] }]}>
      <Avatar variant="legacy" name={name} size="sm" box={36} />
      <View style={styles.fill}>
        <DsText v="title" w="600" numberOfLines={1}>
          {name}
        </DsText>
        <DsText v="body-xs" c="warning-fg" numberOfLines={1}>
          {note}
        </DsText>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("participantsPanel.denyAria", { name })}
        disabled={pending}
        onPress={onDeny}
        style={[styles.deny, { backgroundColor: ds.c.surface }, pending && styles.dim]}
      >
        <X size={16} color={ds.c.ink} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        disabled={pending}
        onPress={onGrant}
        style={[styles.grant, { backgroundColor: secondary ? ds.c["brand-subtle"] : ds.c.brand }, pending && styles.dim]}
      >
        <DsText v="button-sm" c={secondary ? "brand" : "on-action"}>
          {t("participantsPanel.grant")}
        </DsText>
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
  const ds = useDs();
  const participants = useParticipants();
  const allowShare = useAllowShare(lessonId);
  const ban = useBanFromLesson(lessonId);
  const muteAll = useMuteAll(lessonId);
  const raisedHands = new Set([...micRequests.map((request) => request.name), ...cameraRequests.map((request) => request.name)]);

  return (
    <View style={styles.panel}>
      {micRequests.map((request) => (
        <RequestRow
          key={`mic-${request.studentId}`}
          name={request.name}
          note={t("participantsPanel.mobileMicRequesting")}
          pending={micAnswerPending}
          onGrant={() => onGrantMic(request.studentId)}
          onDeny={() => onDenyMic(request.studentId)}
        />
      ))}
      {cameraRequests.map((request) => (
        <RequestRow
          key={`camera-${request.studentId}`}
          name={request.name}
          note={t("participantsPanel.mobileCameraRequesting")}
          secondary
          pending={cameraAnswerPending}
          onGrant={() => onGrantCamera(request.studentId)}
          onDeny={() => onDenyCamera(request.studentId)}
        />
      ))}

      <View>
        {participants.map((participant) => {
          const name = participant.name || participant.identity;
          const micOn = participant.isMicrophoneEnabled;
          const raisedHand = raisedHands.has(name);
          const note = participant.isSpeaking
            ? t("participantsPanel.speaking")
            : raisedHand
              ? t("participantsPanel.raisedHand")
              : micOn
                ? t("participantsPanel.online")
                : t("participantsPanel.micOff");
          return (
            <View key={participant.identity} style={styles.person}>
              <Avatar variant="legacy" name={name} size="sm" box={36} />
              <View style={styles.fill}>
                <DsText v="title" w="600" numberOfLines={1}>
                  {participant.isLocal ? (isTeacher ? t("participantsPanel.teacherYouMobile") : t("participantsPanel.studentYouMobile")) : name}
                </DsText>
                <DsText v="body-xs" c="ink-secondary" numberOfLines={1}>
                  {note}
                </DsText>
              </View>
              {raisedHand ? <Hand size={16} color={ds.c["warning-fg"]} /> : null}
              {/* Vebda bu tugmalar sichqoncha ustida chiqadi; telefonda doim ko'rinadi. */}
              {isTeacher && !participant.isLocal ? (
                <>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t("participantsPanel.allowShare")}
                    disabled={allowShare.isPending}
                    onPress={() => allowShare.mutate(participant.identity)}
                    style={styles.personAction}
                  >
                    <MonitorUp size={15} color={ds.c["ink-secondary"]} />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t("participantsPanel.banAria", { name })}
                    disabled={ban.isPending}
                    onPress={() => ban.mutate(participant.identity)}
                    style={styles.personAction}
                  >
                    <UserRoundX size={15} color={ds.c.danger} />
                  </Pressable>
                </>
              ) : null}
              <Icon name="mic" size={20} color={micOn ? ds.c.brand : ds.c["ink-disabled"]} />
            </View>
          );
        })}
        {!participants.length ? (
          <DsText v="body-sm" c="ink-tertiary" style={styles.emptyPeople}>
            {t("participantsPanel.empty")}
          </DsText>
        ) : null}
      </View>

      {isTeacher ? (
        <View style={styles.panelFooter}>
          <Pressable
            accessibilityRole="button"
            disabled={muteAll.isPending}
            onPress={() => muteAll.mutate([], { onSuccess: (count) => toast.success(t("participantsPanel.muteAllDone", { count })) })}
            style={({ pressed }) => [styles.panelButton, { borderWidth: 1, borderColor: ds.c["line-strong"], backgroundColor: pressed ? ds.c.subtle : ds.c.surface }, muteAll.isPending && styles.dim]}
          >
            <Icon name="notifications-off" size={18} color={ds.c.ink} />
            <DsText v="button" numberOfLines={1}>
              {t("participantsPanel.muteAll")}
            </DsText>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onInvite} style={({ pressed }) => [styles.panelButton, { backgroundColor: ds.c["brand-subtle"], opacity: pressed ? 0.85 : 1 }]}>
            <Icon name="person" size={18} color={ds.c.brand} />
            <DsText v="button" c="brand" numberOfLines={1}>
              {t("participantsPanel.invite")}
            </DsText>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1, minWidth: 0 },
  shrink: { flexShrink: 1 },
  dim: { opacity: 0.5 },
  header: { height: 44, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16 },
  back: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  /* `h-9 w-13 rounded-full bg-subtle gap-1.5` */
  count: { width: 52, height: 36, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 18 },
  countDot: { position: "absolute", top: -2, right: -2, width: 10, height: 10, borderRadius: 5, borderWidth: 2 },
  /* `gap-4 px-4 pt-4 pb-4` */
  content: { gap: 16, paddingHorizontal: 16, paddingVertical: 16 },
  stage: { height: 302, overflow: "hidden", borderRadius: dsRadius["2xl"] },
  tiles: { flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start", columnGap: 8, rowGap: 6 },
  tile: { width: "31.8%", aspectRatio: 114 / 86, overflow: "hidden", borderRadius: dsRadius.xl },
  overflow: { alignItems: "center", justifyContent: "center" },
  tileAvatar: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "center", paddingBottom: 12 },
  speaking: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, borderWidth: 3, borderRadius: dsRadius.xl },
  tileName: { position: "absolute", left: 6, bottom: 6, maxWidth: "88%", height: 22, flexDirection: "row", alignItems: "center", gap: 4, paddingLeft: 6, paddingRight: 8, borderRadius: 11 },
  toolbar: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 2, borderTopLeftRadius: dsRadius["2xl"], borderTopRightRadius: dsRadius["2xl"] },
  toolbarItem: { width: 52, alignItems: "center", gap: 4 },
  toolbarCircle: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  toolbarBadge: { position: "absolute", top: -2, right: -2, minWidth: 20, height: 20, paddingHorizontal: 4, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  toolbarLabel: { marginHorizontal: -8, fontSize: 11, lineHeight: 16 },
  board: { paddingHorizontal: 12, gap: 12 },
  boardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  boardSurface: { flex: 1, overflow: "hidden", borderRadius: dsRadius["2xl"] },
  reconnect: { position: "absolute", top: 72, left: 16, right: 16, zIndex: 20, alignItems: "center" },
  reconnectBody: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: dsRadius.xl },
  attentionClock: { textAlign: "center" },
  panel: { gap: 8 },
  request: { height: 64, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 12, borderRadius: dsRadius.xl },
  deny: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  grant: { height: 44, justifyContent: "center", paddingHorizontal: 12, borderRadius: 22 },
  person: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 7 },
  personAction: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  emptyPeople: { paddingVertical: 12 },
  panelFooter: { flexDirection: "row", gap: 10, paddingTop: 8 },
  panelButton: { flex: 1, minWidth: 0, height: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 24 },
});
