import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { Mic, Plus } from "lucide-react-native";
import type { VoiceRoom, VoiceToken } from "@/shared/types";
import {
  Badge,
  Button,
  Input,
  radius,
  SelectField,
  Sheet,
  Text,
  toast,
  useTheme,
} from "@/shared/ui";
import {
  useActiveVoiceRoom,
  useCreateVoiceRoom,
  useJoinVoiceRoom,
  useRequestVoiceJoin,
} from "../model/voice.queries";
import { VoiceRoomSheet } from "./voice-room-sheet";

/**
 * Guruh ichidagi ovozli suhbat chizig'i — veb `voice-room-bar.tsx` ning
 * mobil varianti.
 *
 * Xona ochiq bo'lsa qo'shilish tugmasi, o'qituvchida esa xona ochish
 * tugmasi chiqadi. "Taklif asosida" xonaga o'quvchi so'rov yuboradi va
 * o'qituvchi uni xona ichida tasdiqlaydi.
 */
export interface VoiceRoomBarProps {
  courseId: string | null;
  isTeacher: boolean;
}

export function VoiceRoomBar({ courseId, isTeacher }: VoiceRoomBarProps) {
  const { t } = useTranslation("mobile");
  const { palette } = useTheme();
  const { active } = useActiveVoiceRoom(courseId);
  const join = useJoinVoiceRoom();
  const requestJoin = useRequestVoiceJoin();
  const create = useCreateVoiceRoom();

  const [joined, setJoined] = useState<{ room: VoiceRoom; token: VoiceToken } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [accessMode, setAccessMode] = useState<"open" | "invite_only">("open");

  const room = active;
  const live = room?.status === "live";

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
        onSuccess: () => {
          setCreateOpen(false);
          setTitle("");
          setAccessMode("open");
        },
      }
    );
  }

  return (
    <View style={[styles.bar, { borderColor: palette.border, backgroundColor: palette.surface }]}>
      <View style={styles.head}>
        <Mic size={18} color={live ? palette["primary-text"] : palette["muted-foreground"]} />
        <View style={styles.headBody}>
          <Text variant="label">{room?.title || "Ovozli suhbat"}</Text>
          <Text variant="caption" tone="muted">
            {room
              ? `${live ? "Hozir jonli" : "Rejalashtirilgan"} · ${room.participantCount} ishtirokchi`
              : "Guruh a'zolari bilan mikrofon orqali gaplashing."}
          </Text>
        </View>
        {room?.accessMode === "invite_only" ? (
          <Badge label={t("voice.taklif_asosida")} tone="neutral" />
        ) : null}
      </View>

      {live && room ? (
        <View style={styles.actions}>
          <Button
            title={t("voice.qoshilish")}
            loading={join.isPending}
            style={styles.grow}
            onPress={() => enter(room)}
          />
          {room.accessMode === "invite_only" ? (
            <Button
              title={t("voice.kirish_sorovi")}
              variant="secondary"
              loading={requestJoin.isPending}
              style={styles.grow}
              onPress={() => requestJoin.mutate(room.id)}
            />
          ) : null}
        </View>
      ) : isTeacher ? (
        <Button
          title={t("voice.xona_ochish")}
          variant="secondary"
          icon={<Plus size={16} color={palette["secondary-foreground"]} />}
          onPress={() => setCreateOpen(true)}
        />
      ) : null}

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
            { value: "open", label: "Ochiq — guruh a'zolari kira oladi" },
            { value: "invite_only", label: "Taklif asosida" },
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
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    gap: 10,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
  },
  head: { flexDirection: "row", alignItems: "center", gap: 10 },
  headBody: { flex: 1 },
  actions: { flexDirection: "row", gap: 8 },
  grow: { flex: 1 },
});
