import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import type { VoiceRoom, VoiceToken } from "@/shared/types";
import { formatDayTime } from "@/shared/lib";
import { DsText, dsRadius, Icon, useDs, type IconName } from "@/shared/ui";
import {
  useActiveVoiceRoom,
  useCloseVoiceRoom,
  useCreateVoiceRoom,
  useJoinVoiceRoom,
  useLeaveVoiceRoom,
  useRequestVoiceJoin,
} from "../model/voice.queries";
import { useVoiceUiStore } from "../model/voice-ui.store";
import { VoiceRoomCreateDialog } from "./voice-room-create-dialog";
import { VoiceRoomPanel } from "./voice-room-panel";

export interface VoiceRoomBarProps {
  courseId: string | null;
  courseTitle?: string;
  /** Xona ochilmagan bo'lsa chiziq ko'rinmaydi (guruh chati — xona sarlavhadagi tugmadan ochiladi). */
  hideIdle?: boolean;
}

/**
 * Guruhdagi ovozli xona chizig'i — veb `voice-room-bar.tsx`: `mx-4 mt-2 mb-1
 * rounded-lg bg-brand-subtle px-4 py-2.5 gap-3`, chapda `bg-brand` doirada
 * karnay, o'ngda "Qo'shilish" (taklif asosidagi xonada "So'rov yuborish").
 * Xona ochish oynasi `useVoiceUiStore` orqali — sarlavhadagi tugma ham shuni ochadi.
 * "Taklif asosida" xonaga o'quvchi so'rov yuboradi, o'qituvchi xona ichida tasdiqlaydi.
 */
export function VoiceRoomBar({ courseId, courseTitle, hideIdle = false }: VoiceRoomBarProps) {
  const { t } = useTranslation("voice");
  const ds = useDs();
  const { active } = useActiveVoiceRoom(courseId);
  const create = useCreateVoiceRoom();
  const join = useJoinVoiceRoom();
  const leave = useLeaveVoiceRoom();
  const close = useCloseVoiceRoom();
  const requestJoin = useRequestVoiceJoin();
  const createOpen = useVoiceUiStore((state) => state.createOpen);
  const setCreateOpen = useVoiceUiStore((state) => state.setCreateOpen);
  const [joined, setJoined] = useState<{ room: VoiceRoom; token: VoiceToken } | null>(null);
  // `onDisconnected` ham chiqishni chaqiradi — chiqish so'rovi ikki marta ketmasin.
  const leavingRef = useRef(false);

  function enterRoom(room: VoiceRoom) {
    leavingRef.current = false;
    join.mutate(room.id, { onSuccess: (token) => setJoined({ room, token }) });
  }

  function leaveRoom() {
    const current = joined;
    if (!current || leavingRef.current) return;
    leavingRef.current = true;
    setJoined(null);
    leave.mutate(current.room.id);
  }

  function closeRoom() {
    const current = joined;
    if (!current || leavingRef.current) return;
    leavingRef.current = true;
    setJoined(null);
    leave.mutate(current.room.id, { onSettled: () => close.mutate(current.room.id) });
  }

  if (!courseId) return null;
  const room = active;
  const scheduled = room?.status === "scheduled";

  return (
    <>
      {hideIdle && !room ? null : (
        <View style={[styles.bar, { backgroundColor: ds.c["brand-subtle"] }]}>
          <View style={[styles.iconWrap, { backgroundColor: ds.c.brand }]}>
            <Icon name="volume" size={18} color={ds.c["ink-inverse"]} />
          </View>
          {room ? (
            <>
              <View style={styles.headBody}>
                <DsText v="label-strong" numberOfLines={1}>
                  {room.title || t("room.defaultTitle")}
                </DsText>
                <DsText v="caption" c="ink-secondary" numberOfLines={1}>
                  {scheduled && room.scheduledAt ? t("bar.scheduledAt", { time: formatDayTime(room.scheduledAt) }) : t("bar.live")}
                  {" · "}
                  {t("bar.participants", { count: room.participantCount })}
                  {room.accessMode === "invite_only" ? ` · ${t("access.inviteOnly")}` : ""}
                </DsText>
              </View>
              <BarButton
                label={t("bar.join")}
                icon="groups"
                disabled={join.isPending || requestJoin.isPending}
                onPress={() => enterRoom(room)}
              />
              {room.accessMode === "invite_only" ? (
                <BarButton label={t("bar.requestJoin")} secondary disabled={requestJoin.isPending} onPress={() => requestJoin.mutate(room.id)} />
              ) : null}
            </>
          ) : (
            <>
              <View style={styles.headBody}>
                <DsText v="label-strong" numberOfLines={1}>
                  {t("bar.emptyTitle")}
                </DsText>
                <DsText v="caption" c="ink-secondary" numberOfLines={1}>
                  {t("bar.emptyHint")}
                </DsText>
              </View>
              <BarButton label={t("bar.create")} icon="volume" onPress={() => setCreateOpen(true)} />
            </>
          )}
        </View>
      )}

      <VoiceRoomCreateDialog
        courseId={courseId}
        open={createOpen}
        pending={create.isPending}
        onOpenChange={setCreateOpen}
        onCreate={(values) =>
          create.mutate(values, {
            onSuccess: (created) => {
              setCreateOpen(false);
              if (created.status === "live") enterRoom(created);
            },
          })
        }
      />

      {joined ? (
        <VoiceRoomPanel
          room={joined.room}
          token={joined.token}
          courseTitle={courseTitle}
          closing={close.isPending}
          onLeave={leaveRoom}
          onClose={closeRoom}
        />
      ) : null}
    </>
  );
}

/** `h-10 rounded-full px-4 gap-2 text-label-strong` — `bg-action` yoki chegarali oq tugma. */
function BarButton({
  label,
  icon,
  secondary = false,
  disabled = false,
  onPress,
}: {
  label: string;
  icon?: IconName;
  secondary?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const ds = useDs();
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary
          ? { borderWidth: 1, borderColor: ds.c.line, backgroundColor: ds.c.surface }
          : { backgroundColor: pressed ? ds.c["action-hover"] : ds.c.action },
        disabled && styles.dim,
      ]}
    >
      {icon ? <Icon name={icon} size={18} color={ds.c["on-action"]} /> : null}
      <DsText v="label-strong" c={secondary ? "ink" : "on-action"}>
        {label}
      </DsText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", alignItems: "center", gap: 12, marginHorizontal: 16, marginTop: 8, marginBottom: 4, paddingHorizontal: 16, paddingVertical: 10, borderRadius: dsRadius.lg },
  button: { height: 40, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, borderRadius: 20 },
  dim: { opacity: 0.6 },
  iconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  headBody: { flex: 1, minWidth: 0 },
});
