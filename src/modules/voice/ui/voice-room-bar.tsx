import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import type { VoiceRoom, VoiceToken } from "@/shared/types";
import { formatDayTime } from "@/shared/lib";
import {
  Button,
  DsText,
  dsRadius,
  Icon,
  Input,
  SelectField,
  Sheet,
  Text,
  toast,
  useDs,
  type IconName,
} from "@/shared/ui";
import {
  useActiveVoiceRoom,
  useCreateVoiceRoom,
  useJoinVoiceRoom,
  useRequestVoiceJoin,
} from "../model/voice.queries";
import { useVoiceUiStore } from "../model/voice-ui.store";
import { VoiceRoomSheet } from "./voice-room-sheet";

export interface VoiceRoomBarProps {
  courseId: string | null;
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
export function VoiceRoomBar({ courseId, hideIdle = false }: VoiceRoomBarProps) {
  const { t } = useTranslation("mobile");
  const { t: tv } = useTranslation("voice");
  const ds = useDs();
  const { active } = useActiveVoiceRoom(courseId);
  const join = useJoinVoiceRoom();
  const requestJoin = useRequestVoiceJoin();
  const create = useCreateVoiceRoom();
  const createOpen = useVoiceUiStore((state) => state.createOpen);
  const setCreateOpen = useVoiceUiStore((state) => state.setCreateOpen);

  const [joined, setJoined] = useState<{ room: VoiceRoom; token: VoiceToken } | null>(null);
  const [title, setTitle] = useState("");
  const [accessMode, setAccessMode] = useState<"open" | "invite_only">("open");

  const room = active;

  function enter(target: VoiceRoom) {
    join.mutate(target.id, { onSuccess: (token) => setJoined({ room: target, token }) });
  }

  function submitCreate() {
    if (!courseId) return;
    if (!title.trim()) {
      toast.error(t("voice.xona_nomini_kiriting"));
      return;
    }
    create.mutate(
      { courseId, title: title.trim(), accessMode, scheduledAt: null },
      {
        onSuccess: (created) => {
          setCreateOpen(false);
          setTitle("");
          setAccessMode("open");
          if (created.status === "live") enter(created);
        },
      }
    );
  }

  if (!courseId) return null;
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
                  {room.title || tv("room.defaultTitle")}
                </DsText>
                <DsText v="caption" c="ink-secondary" numberOfLines={1}>
                  {scheduled && room.scheduledAt ? tv("bar.scheduledAt", { time: formatDayTime(room.scheduledAt) }) : tv("bar.live")}
                  {" · "}
                  {tv("bar.participants", { count: room.participantCount })}
                  {room.accessMode === "invite_only" ? ` · ${tv("access.inviteOnly")}` : ""}
                </DsText>
              </View>
              <BarButton
                label={tv("bar.join")}
                icon="groups"
                disabled={join.isPending || requestJoin.isPending}
                onPress={() => enter(room)}
              />
              {room.accessMode === "invite_only" ? (
                <BarButton label={tv("bar.requestJoin")} secondary disabled={requestJoin.isPending} onPress={() => requestJoin.mutate(room.id)} />
              ) : null}
            </>
          ) : (
            <>
              <View style={styles.headBody}>
                <DsText v="label-strong" numberOfLines={1}>
                  {tv("bar.emptyTitle")}
                </DsText>
                <DsText v="caption" c="ink-secondary" numberOfLines={1}>
                  {tv("bar.emptyHint")}
                </DsText>
              </View>
              <BarButton label={tv("bar.create")} icon="volume" onPress={() => setCreateOpen(true)} />
            </>
          )}
        </View>
      )}

      <Sheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={t("voice.ovozli_xona")}
        description={t("voice.faqat_mikrofon_kamera_va_ekran_ulashish_yoq")}
      >
        <Input
          label={t("voice.xona_nomi")}
          placeholder={t("voice.masalan_kechqurungi_muhokama")}
          value={title}
          onChangeText={setTitle}
        />
        <SelectField
          label={t("voice.kirish")}
          value={accessMode}
          options={[
            { value: "open", label: t("voice.ochiq_guruh_azolari_kira_oladi") },
            { value: "invite_only", label: t("voice.taklif_asosida") },
          ]}
          onChange={(value) => setAccessMode(value === "invite_only" ? "invite_only" : "open")}
        />
        <Text variant="caption" tone="muted">
          {accessMode === "open"
            ? "Guruhning istalgan a'zosi to'g'ridan-to'g'ri kira oladi."
            : "O'quvchilar so'rov yuboradi, siz tasdiqlaysiz."}
        </Text>
        <Button title={t("voice.ochish")} size="lg" loading={create.isPending} onPress={submitCreate} />
      </Sheet>

      {joined ? (
        <VoiceRoomSheet
          open
          room={joined.room}
          token={joined.token}
          onClose={() => setJoined(null)}
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
