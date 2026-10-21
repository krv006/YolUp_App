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
    <View style={[styles.bar, { borderBottomColor: palette.border }]}>
      <View style={styles.head}>
        {/* Ikonka OQ doirada — vebda ham shunday (36x36). */}
        <View style={[styles.iconWrap, { backgroundColor: palette.surface }]}>
          <Mic size={20} color={palette.primary} />
        </View>
        <View style={styles.headBody}>
          <Text variant="label">{room?.title || "Ovozli suhbat"}</Text>
          <Text variant="caption" tone="muted" style={styles.subtitle}>
            {room
              ? `${live ? "Hozir jonli" : "Rejalashtirilgan"} · ${room.participantCount} ishtirokchi`
              : "Guruh a'zolari bilan mikrofon orqali gaplashing."}
          </Text>
        </View>
        {room?.accessMode === "invite_only" ? (
          <Badge label={t("voice.taklif_asosida")} tone="neutral" />
        ) : null}

        {/*
          * Bitta tugmali holatda u SHU QATORDA, o'ngda — vebdagi kabi.
          * Ikkita tugma bo'lganda (taklif asosidagi xonaga qo'shilish)
          * ular matn bilan bitta qatorga sig'maydi, shuning uchun pastda
          * qoladi.
          */}
        {!live && isTeacher ? (
          <Button
            title={t("voice.xona_ochish")}
            icon={<Plus size={16} color={palette["primary-foreground"]} />}
            onPress={() => setCreateOpen(true)}
          />
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
    </View>
  );
}

const styles = StyleSheet.create({
  /*
   * O'lchamlar veb DOM'idan (390px): banner 65 balandlik, ko'kimtir fon
   * (`--action-primary-subtle` yarim shaffof), pastki chegara 1px,
   * bo'shliq 12/16, oraliq 12; ikonka oq doirada 36x36; sarlavha
   * 14/20/600, ostki matn 12/16/500; tugma 40 balandlik, radius 999.
   *
   * ILGARI bu KARTOCHKA edi (chegarali, yumaloq, oq fonda) va tugma
   * pastda alohida qatorda turardi. Vebda u ekran kengligidagi tasma va
   * tugma O'SHA QATORNING o'ng tomonida.
   */
  bar: {
    backgroundColor: "rgba(238, 242, 255, 0.5)",
    borderBottomWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  head: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  headBody: { flex: 1 },
  subtitle: { fontWeight: "500" },
  actions: { flexDirection: "row", gap: 8 },
  grow: { flex: 1 },
});
