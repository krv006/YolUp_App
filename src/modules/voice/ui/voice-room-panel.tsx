import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LiveKitRoom, useConnectionState, useLocalParticipant, useParticipants } from "@livekit/react-native";
import { ConnectionState } from "livekit-client";
import type { VoiceRoom, VoiceToken } from "@/shared/types";
import { Avatar, dsAlpha, DsText, dsRadius, Icon, ThemeScope, toast, useDs } from "@/shared/ui";
import { useAnswerVoiceHand, useAnswerVoiceJoinRequest, useToggleVoiceHand, useVoiceHands, useVoiceJoinRequests } from "../model/voice.queries";

export interface VoiceRoomPanelProps {
  room: VoiceRoom;
  token: VoiceToken;
  courseTitle?: string;
  onLeave: () => void;
  onClose: () => void;
  closing?: boolean;
}

/**
 * Ovozli xona — veb `voice-room-panel.tsx` ning tor ekran varianti (to'liq
 * ekran, qorong'i): sarlavhada pastga o'q, xona nomi va ishtirokchilar soni;
 * 3 ustunli katta avatarlar (gapirayotgan yoki xona egasi yashil halqada),
 * moderatorga kirish so'rovlari, boshqalarga "qo'l ko'tarish" kartasi; pastda
 * mikrofon, "Chiqish" va moderatorda "Xonani yopish".
 *
 * Faqat mikrofon: kamera ham, ekran ulashish ham yo'q (`video={false}`).
 * `registerGlobals()` bu yerda chaqirilmaydi — `live-lesson-page` uni modul
 * darajasida bajaradi.
 */
export function VoiceRoomPanel({ room, token, courseTitle, onLeave, onClose, closing }: VoiceRoomPanelProps) {
  const { t } = useTranslation("voice");
  return (
    <Modal visible animationType="slide" statusBarTranslucent navigationBarTranslucent onRequestClose={onLeave}>
      <ThemeScope scheme="dark">
        <LiveKitRoom
          serverUrl={token.serverUrl}
          token={token.token}
          connect
          audio
          video={false}
          onDisconnected={onLeave}
          onError={(error) => {
            toast.error(error.message || t("room.connectFailed"));
            onLeave();
          }}
        >
          <VoiceRoomBody room={room} courseTitle={courseTitle} isModerator={token.isModerator} closing={closing} onLeave={onLeave} onClose={onClose} />
        </LiveKitRoom>
      </ThemeScope>
    </Modal>
  );
}

interface VoiceMember {
  id: string;
  name: string;
  isLocal: boolean;
  micOn: boolean;
  speaking: boolean;
  owner: boolean;
}

function VoiceRoomBody({
  room,
  courseTitle,
  isModerator,
  closing,
  onLeave,
  onClose,
}: {
  room: VoiceRoom;
  courseTitle?: string;
  isModerator: boolean;
  closing?: boolean;
  onLeave: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation("voice");
  const participants = useParticipants();
  const connection = useConnectionState();
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant();
  const hostIdentity = room.hostIdentity ?? `user-${room.createdById}`;
  // Veb #161: qo'l ko'tarish — moderator ruxsat bersa gapirish mumkin.
  const hand = useToggleVoiceHand(room.id);
  const [handRaised, setHandRaised] = useState(false);

  function toggleHand() {
    const next = !handRaised;
    hand.mutate(next, {
      onSuccess: () => {
        setHandRaised(next);
        if (next) toast.success(t("room.handSent"));
      },
    });
  }

  return (
    <VoiceRoomView
      title={room.title || t("room.defaultTitle")}
      subtitle={[courseTitle, t("room.participants", { count: participants.length })].filter(Boolean).join(" · ")}
      members={participants.map((participant) => ({
        id: participant.sid || participant.identity,
        name: participant.name || participant.identity,
        isLocal: participant.isLocal,
        micOn: participant.isMicrophoneEnabled,
        speaking: participant.isSpeaking,
        owner: participant.identity === hostIdentity,
      }))}
      connecting={connection !== ConnectionState.Connected}
      requests={
        isModerator ? (
          <>
            <VoiceHands roomId={room.id} />
            <VoiceJoinRequests roomId={room.id} />
          </>
        ) : null
      }
      micOn={isMicrophoneEnabled}
      isModerator={isModerator}
      closing={closing}
      handRaised={handRaised}
      handPending={hand.isPending}
      onToggleHand={toggleHand}
      onToggleMic={() =>
        void localParticipant
          .setMicrophoneEnabled(!isMicrophoneEnabled)
          .catch((error: unknown) => toast.error(error instanceof Error ? error.message : t("room.connectFailed")))
      }
      onLeave={onLeave}
      onClose={onClose}
    />
  );
}

function VoiceRoomView({
  title,
  subtitle,
  members,
  connecting,
  requests,
  micOn,
  isModerator,
  closing,
  handRaised = false,
  handPending = false,
  onToggleHand,
  onToggleMic,
  onLeave,
  onClose,
}: {
  title: string;
  subtitle: string;
  members: VoiceMember[];
  connecting: boolean;
  requests?: ReactNode;
  micOn: boolean;
  isModerator: boolean;
  closing?: boolean;
  handRaised?: boolean;
  handPending?: boolean;
  onToggleHand?: () => void;
  onToggleMic: () => void;
  onLeave: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation("voice");
  const ds = useDs();
  const insets = useSafeAreaInsets();
  const self = members.find((member) => member.isLocal);

  return (
    <View style={[styles.root, { backgroundColor: ds.c.canvas, paddingTop: insets.top }]}>
      {/* `mt-5 h-11 px-4 gap-3` */}
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel={t("room.leave")} onPress={onLeave} style={[styles.round, { backgroundColor: ds.c["surface-inverse"] }]}>
          <Icon name="chevron-down" size={22} color={ds.c["ink-inverse"]} />
        </Pressable>
        <View style={styles.headerText}>
          <DsText v="title" w="600" numberOfLines={1}>
            {title}
          </DsText>
          <DsText v="caption" c="ink-secondary" numberOfLines={1}>
            {subtitle}
          </DsText>
        </View>
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.round, { backgroundColor: ds.c["surface-inverse"] }]}>
          <Icon name="person" size={22} color={ds.c["ink-inverse"]} />
        </View>
      </View>

      {/* `px-4 pt-10 pb-5` */}
      <ScrollView style={styles.fill} contentContainerStyle={styles.content}>
        {connecting ? (
          <DsText v="body-sm" c="ink-secondary" style={styles.center}>
            {t("room.connecting")}
          </DsText>
        ) : (
          <View style={styles.members}>
            {members.map((member) => {
              const highlighted = member.speaking || member.owner;
              return (
                <View key={member.id} style={styles.member}>
                  <View style={[styles.ring, highlighted && { backgroundColor: ds.c.success }]}>
                    <Avatar variant="legacy" name={member.name} size="xl" box={highlighted ? 74 : 80} />
                  </View>
                  <DsText v="title-sm" w="600" numberOfLines={1} style={styles.memberName}>
                    {member.isLocal ? t("room.you") : (member.name.trim().split(/\s+/)[0] ?? member.name)}
                  </DsText>
                  <DsText v="caption" c={highlighted ? "success" : "ink-secondary"} numberOfLines={1} style={styles.memberNote}>
                    {member.owner ? t("room.owner") : member.speaking ? t("room.speaking") : member.micOn ? t("room.micOn") : t("room.micOff")}
                  </DsText>
                </View>
              );
            })}
          </View>
        )}

        {requests}

        {isModerator || connecting ? null : (
          <View style={[styles.raise, { backgroundColor: dsAlpha(ds.c.subtle, 0.4) }]}>
            <Avatar variant="legacy" name={self?.name ?? ""} size="sm" />
            <View style={styles.grow}>
              <DsText v="title-sm" w="600" numberOfLines={1}>
                {t("room.raiseTitle")}
              </DsText>
              <DsText v="caption" c="ink-secondary" numberOfLines={1}>
                {t("room.raiseHint")}
              </DsText>
            </View>
            {/* Ko'tarilgan qo'l — `bg-surface-inverse text-ink-inverse` */}
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: handRaised }}
              disabled={handPending || !onToggleHand}
              onPress={onToggleHand}
              style={[
                styles.raiseButton,
                { backgroundColor: handRaised ? ds.c["surface-inverse"] : ds.c.brand },
                (handPending || !onToggleHand) && styles.faded,
              ]}
            >
              <DsText v="button" c={handRaised ? "ink-inverse" : "on-action"}>
                ✋ {handRaised ? t("room.lowerHand") : t("room.raiseHand")}
              </DsText>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* `px-4 pb-8.5 gap-2.5` */}
      <View style={[styles.footer, { paddingBottom: Math.max(34, insets.bottom + 12) }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("room.micLabel")}
          accessibilityState={{ selected: micOn }}
          onPress={onToggleMic}
          style={[styles.mic, { backgroundColor: micOn ? ds.c.subtle : ds.c["danger-bg"] }]}
        >
          <Icon name="mic" size={22} color={micOn ? ds.c.ink : ds.c["error-text"]} />
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onLeave} style={({ pressed }) => [styles.action, { backgroundColor: ds.c["surface-inverse"], opacity: pressed ? 0.85 : 1 }]}>
          <DsText v="title" w="600" c="ink-inverse" numberOfLines={1}>
            {t("room.leave")}
          </DsText>
        </Pressable>
        {isModerator ? (
          <ThemeScope scheme="light">
            <CloseButton label={t("room.mobileClose")} disabled={closing} onPress={onClose} />
          </ThemeScope>
        ) : null}
      </View>
    </View>
  );
}

/** Vebda `data-theme="light"` ichida: yorug' `bg-danger-bg text-error-text`. */
function CloseButton({ label, disabled, onPress }: { label: string; disabled?: boolean; onPress: () => void }) {
  const ds = useDs();
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.action, { backgroundColor: ds.c["danger-bg"] }, disabled && styles.dim]}>
      <DsText v="title" w="600" c="error-text" numberOfLines={1}>
        {label}
      </DsText>
    </Pressable>
  );
}

/** Ko'tarilgan qo'llar — veb `MobileVoiceHands`: ruxsat berish yoki rad etish. */
function VoiceHands({ roomId }: { roomId: string }) {
  const { t } = useTranslation("voice");
  const ds = useDs();
  const hands = useVoiceHands(roomId);
  const answer = useAnswerVoiceHand(roomId);
  const items = hands.data ?? [];

  if (!items.length) return null;

  return (
    <View style={styles.requests}>
      <DsText v="title-sm" w="600" style={styles.handsTitle}>
        {t("room.handsTitle", { count: items.length })}
      </DsText>
      {items.map((item) => (
        <View key={item.userId} style={[styles.request, { backgroundColor: dsAlpha(ds.c.subtle, 0.4) }]}>
          <Avatar variant="legacy" name={item.name} size="sm" />
          <View style={styles.grow}>
            <DsText v="title-sm" w="600" numberOfLines={1}>
              ✋ {item.name}
            </DsText>
            <DsText v="caption" c={item.status === "allowed" ? "success" : "ink-secondary"} numberOfLines={1}>
              {item.status === "allowed" ? t("room.handAllowed") : t("room.handWaiting")}
            </DsText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("room.handDismiss")}
            disabled={answer.isPending}
            onPress={() => answer.mutate({ userId: item.userId, allow: false })}
            style={[styles.deny, answer.isPending && styles.dim]}
          >
            <Icon name="close" size={18} color={ds.c["ink-secondary"]} />
          </Pressable>
          {item.status === "raised" ? (
            <Pressable
              accessibilityRole="button"
              disabled={answer.isPending}
              onPress={() => answer.mutate({ userId: item.userId, allow: true })}
              style={[styles.approve, { backgroundColor: ds.c.brand }, answer.isPending && styles.dim]}
            >
              <DsText v="button" c="on-action">
                {t("room.handAllow")}
              </DsText>
            </Pressable>
          ) : null}
        </View>
      ))}
    </View>
  );
}

/** Kirish so'rovlari — `h-16.5 rounded-xl bg-subtle/40 px-4 gap-3`. */
function VoiceJoinRequests({ roomId }: { roomId: string }) {
  const { t } = useTranslation("voice");
  const ds = useDs();
  const requests = useVoiceJoinRequests(roomId);
  const answer = useAnswerVoiceJoinRequest(roomId);
  const pending = (requests.data ?? []).filter((request) => request.status === "pending");

  if (!pending.length) return null;

  return (
    <View style={styles.requests}>
      {pending.map((request) => (
        <View key={request.id} style={[styles.request, { backgroundColor: dsAlpha(ds.c.subtle, 0.4) }]}>
          <Avatar variant="legacy" name={request.userName} size="sm" />
          <View style={styles.grow}>
            <DsText v="title-sm" w="600" numberOfLines={1}>
              {t("room.wantsToJoin", { name: request.userName.trim().split(/\s+/)[0] ?? request.userName })}
            </DsText>
            <DsText v="caption" c="ink-secondary" numberOfLines={1}>
              {t("room.requestNote")}
            </DsText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("room.deny")}
            disabled={answer.isPending}
            onPress={() => answer.mutate({ requestId: request.id, approve: false })}
            style={[styles.deny, answer.isPending && styles.dim]}
          >
            <Icon name="close" size={18} color={ds.c["ink-secondary"]} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={answer.isPending}
            onPress={() => answer.mutate({ requestId: request.id, approve: true })}
            style={[styles.approve, { backgroundColor: ds.c.brand }, answer.isPending && styles.dim]}
          >
            <DsText v="button" c="on-action">
              {t("room.approve")}
            </DsText>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  center: { textAlign: "center" },
  dim: { opacity: 0.5 },
  faded: { opacity: 0.6 },
  handsTitle: { paddingHorizontal: 4 },
  header: { marginTop: 20, height: 44, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16 },
  round: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  headerText: { flex: 1, minWidth: 0, alignItems: "center" },
  content: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 40, paddingBottom: 20 },
  /* `flex flex-wrap justify-center gap-y-5`, har biri `w-1/3` */
  members: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", rowGap: 20 },
  member: { width: "33.333%", alignItems: "center" },
  ring: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  memberName: { marginTop: 8, maxWidth: "100%", paddingHorizontal: 4 },
  memberNote: { marginTop: 8, maxWidth: "100%", paddingHorizontal: 4 },
  requests: { marginTop: 42, gap: 10 },
  request: { height: 66, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, borderRadius: dsRadius.xl },
  deny: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  approve: { height: 44, justifyContent: "center", paddingHorizontal: 14, borderRadius: 22 },
  raise: { marginTop: 40, height: 60, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, borderRadius: dsRadius.xl },
  raiseButton: { height: 36, justifyContent: "center", paddingHorizontal: 14, borderRadius: 18 },
  footer: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16 },
  mic: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  action: { flex: 1, minWidth: 0, height: 52, alignItems: "center", justifyContent: "center", borderRadius: 26 },
});
