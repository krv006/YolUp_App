import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { LiveKitRoom, useRoomContext } from "@livekit/react-native";
import { RoomEvent, type Participant } from "livekit-client";
import { Check, Mic, MicOff, X } from "lucide-react-native";
import type { VoiceRoom, VoiceToken } from "@/shared/types";
import { Badge, Button, ListItem, Separator, Sheet, Text, toast, useTheme } from "@/shared/ui";
import {
  useAnswerVoiceJoinRequest,
  useCloseVoiceRoom,
  useLeaveVoiceRoom,
  useVoiceJoinRequests,
} from "../model/voice.queries";

/**
 * Ovozli xona — faqat mikrofon.
 *
 * Veb `voice-room-dialog.tsx` ning mobil varianti. Jonli darsdan farqi:
 * kamera ham, ekran ulashish ham YO'Q — shuning uchun `LiveKitRoom` ga
 * `video={false}` beriladi va ishtirokchilar ro'yxati oddiy matn qatorlari
 * bo'lib chiqadi, video plitkalari emas.
 *
 * `registerGlobals()` bu yerda CHAQIRILMAYDI — uni `live-lesson-page`
 * allaqachon modul darajasida bajaradi va ikki marta chaqirish shart emas.
 */
export interface VoiceRoomSheetProps {
  open: boolean;
  room: VoiceRoom;
  token: VoiceToken;
  onClose: () => void;
}

export function VoiceRoomSheet({ open, room, token, onClose }: VoiceRoomSheetProps) {
  const leave = useLeaveVoiceRoom();

  function close() {
    leave.mutate(room.id);
    onClose();
  }

  return (
    <Sheet
      open={open}
      onClose={close}
      title={room.title || "Ovozli suhbat"}
      description="Faqat mikrofon. Chiqsangiz, xona ro'yxatdan yo'qolmaydi."
    >
      <LiveKitRoom
        serverUrl={token.serverUrl}
        token={token.token}
        connect
        audio
        video={false}
        onDisconnected={onClose}
        onError={(error) => toast.error(error.message || "Ovozli xonaga ulanib bo'lmadi")}
      >
        <RoomBody room={room} isModerator={token.isModerator} onLeave={close} />
      </LiveKitRoom>
    </Sheet>
  );
}

function RoomBody({
  room,
  isModerator,
  onLeave,
}: {
  room: VoiceRoom;
  isModerator: boolean;
  onLeave: () => void;
}) {
  const { palette } = useTheme();
  const livekit = useRoomContext();
  const [micOn, setMicOn] = useState(true);
  const [participants, setParticipants] = useState<Participant[]>([]);

  const requests = useVoiceJoinRequests(isModerator ? room.id : null, isModerator);
  const answer = useAnswerVoiceJoinRequest(room.id);
  const closeRoom = useCloseVoiceRoom();

  useEffect(() => {
    function sync() {
      setParticipants([livekit.localParticipant, ...Array.from(livekit.remoteParticipants.values())]);
    }
    sync();
    livekit.on(RoomEvent.ParticipantConnected, sync);
    livekit.on(RoomEvent.ParticipantDisconnected, sync);
    return () => {
      livekit.off(RoomEvent.ParticipantConnected, sync);
      livekit.off(RoomEvent.ParticipantDisconnected, sync);
    };
  }, [livekit]);

  async function toggleMic() {
    const next = !micOn;
    setMicOn(next);
    try {
      await livekit.localParticipant.setMicrophoneEnabled(next);
    } catch (error) {
      // Holatni ORQAGA qaytaramiz: aks holda tugma yoqilgandek ko'rinib,
      // mikrofon aslida o'chiq qolardi.
      setMicOn(!next);
      toast.error(error instanceof Error ? error.message : "Mikrofonni o'zgartirib bo'lmadi");
    }
  }

  const pending = requests.data ?? [];

  return (
    <View style={styles.body}>
      <Text variant="caption" tone="muted">
        {participants.length} ishtirokchi
      </Text>

      <View style={[styles.group, { borderColor: palette.border }]}>
        {participants.map((participant, index) => (
          <View key={participant.sid}>
            {index > 0 ? <Separator inset={16} /> : null}
            <ListItem
              title={participant.name || participant.identity}
              subtitle={participant.isSpeaking ? "Gapiryapti" : undefined}
              trailing={
                participant.isMicrophoneEnabled ? (
                  <Mic size={16} color={palette["muted-foreground"]} />
                ) : (
                  <MicOff size={16} color={palette["muted-foreground"]} />
                )
              }
            />
          </View>
        ))}
      </View>

      {isModerator && pending.length > 0 ? (
        <>
          <Text variant="label">Kirish so'rovlari ({pending.length})</Text>
          <View style={[styles.group, { borderColor: palette.border }]}>
            {pending.map((request, index) => (
              <View key={request.id}>
                {index > 0 ? <Separator inset={16} /> : null}
                <ListItem
                  title={request.userName}
                  trailing={
                    <View style={styles.row}>
                      <Button
                        title="Tasdiqlash"
                        icon={<Check size={14} color={palette["primary-foreground"]} />}
                        onPress={() => answer.mutate({ requestId: request.id, approve: true })}
                      />
                      <Button
                        title="Rad etish"
                        variant="secondary"
                        icon={<X size={14} color={palette["secondary-foreground"]} />}
                        onPress={() => answer.mutate({ requestId: request.id, approve: false })}
                      />
                    </View>
                  }
                />
              </View>
            ))}
          </View>
        </>
      ) : null}

      <Button
        title={micOn ? "Mikrofonni o'chirish" : "Mikrofonni yoqish"}
        variant="secondary"
        icon={
          micOn ? (
            <MicOff size={16} color={palette["secondary-foreground"]} />
          ) : (
            <Mic size={16} color={palette["secondary-foreground"]} />
          )
        }
        onPress={() => void toggleMic()}
      />

      {isModerator ? (
        <Button
          title="Xonani yopish"
          variant="danger"
          loading={closeRoom.isPending}
          onPress={() => closeRoom.mutate(room.id, { onSuccess: onLeave })}
        />
      ) : null}

      <Button title="Chiqish" variant="secondary" onPress={onLeave} />

      {room.accessMode === "invite_only" ? (
        <Badge label="Taklif asosida" tone="neutral" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: 10 },
  row: { flexDirection: "row", gap: 6 },
  group: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, overflow: "hidden" },
});
