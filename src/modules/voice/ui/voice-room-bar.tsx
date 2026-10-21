import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import type { VoiceRoom, VoiceToken } from "@/shared/types";
import { formatDayTime } from "@/shared/lib";
import {
  Button,
  Icon,
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
 * Xona ochiq bo'lsa qo'shilish tugmasi, aks holda (vebdagidek hamma
 * uchun) xona ochish tugmasi chiqadi. "Taklif asosida" xonaga o'quvchi so'rov yuboradi va
 * o'qituvchi uni xona ichida tasdiqlaydi.
 */
export interface VoiceRoomBarProps {
  courseId: string | null;
}

export function VoiceRoomBar({ courseId }: VoiceRoomBarProps) {
  const { t } = useTranslation("mobile");
  const { t: tv } = useTranslation("voice");
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

  const scheduled = room?.status === "scheduled";

  return (
    <View style={[styles.bar, { borderBottomColor: palette.border }]}>
      {/* `size-9 rounded-full`: jonli xonada ko'k, aks holda oq doira. */}
      <View style={[styles.iconWrap, { backgroundColor: live ? palette.primary : palette.surface }]}>
        <Icon name="volume" size={18} color={live ? palette["primary-foreground"] : palette.primary} />
      </View>
      {room ? (
        <>
          <View style={styles.headBody}>
            <Text variant="label" numberOfLines={1}>
              {room.title || tv("room.defaultTitle")}
            </Text>
            <Text variant="caption" numberOfLines={1} style={[styles.subtitle, { color: palette["muted-foreground"] }]}>
              {scheduled && room.scheduledAt ? tv("bar.scheduledAt", { time: formatDayTime(room.scheduledAt) }) : tv("bar.live")}
              {" · "}
              {tv("bar.participants", { count: room.participantCount })}
              {room.accessMode === "invite_only" ? ` · ${tv("access.inviteOnly")}` : ""}
            </Text>
          </View>
          <BarButton
            label={tv("bar.join")}
            icon={<Icon name="groups" size={18} color={palette["primary-foreground"]} />}
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
            <Text variant="label" numberOfLines={1}>
              {tv("bar.emptyTitle")}
            </Text>
            <Text variant="caption" numberOfLines={1} style={[styles.subtitle, { color: palette["muted-foreground"] }]}>
              {tv("bar.emptyHint")}
            </Text>
          </View>
          <BarButton
            label={tv("bar.create")}
            icon={<Icon name="volume" size={18} color={palette["primary-foreground"]} />}
            onPress={() => setCreateOpen(true)}
          />
        </>
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
    </View>
  );
}

/** `h-10 rounded-full px-4 gap-2` — asosiy (ko'k) yoki chegarali oq tugma. */
function BarButton({
  label,
  icon,
  secondary = false,
  disabled = false,
  onPress,
}: {
  label: string;
  icon?: React.ReactNode;
  secondary?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const { palette } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary
          ? { borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface }
          : { backgroundColor: pressed ? palette["primary-hover"] : palette.primary },
        disabled && styles.dim,
      ]}
    >
      {icon}
      <Text variant="label" style={{ color: secondary ? palette.foreground : palette["primary-foreground"] }}>
        {label}
      </Text>
    </Pressable>
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(238, 242, 255, 0.5)",
    borderBottomWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  button: { height: 40, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, borderRadius: radius.full },
  dim: { opacity: 0.6 },
  head: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  headBody: { flex: 1, minWidth: 0 },
  subtitle: { fontWeight: "500" },
  actions: { flexDirection: "row", gap: 8 },
  grow: { flex: 1 },
});
