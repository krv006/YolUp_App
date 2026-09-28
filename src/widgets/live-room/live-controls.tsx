import { Platform, Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useLocalParticipant, useLocalParticipantPermissions } from "@livekit/react-native";
import {
  Hand,
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  Video,
  VideoOff,
} from "lucide-react-native";
import {
  CAMERA_SOURCE,
  canPublishSource,
  MICROPHONE_SOURCE,
  SCREEN_SHARE_SOURCE,
} from "@/modules/live";
import { MIN_TOUCH_SIZE, radius, Text, toast, useTheme } from "@/shared/ui";

/**
 * Jonli dars boshqaruvlari — veb `live-room.tsx` dagi `StudentMicControl`,
 * `TeacherMicControl` va `StudentCameraControl` ning mobil varianti.
 *
 * Mantiq AYNAN bir xil: o'quvchi darsga mikrofon/kamerasi O'CHIQ holda
 * kiradi va yoqish uchun o'qituvchidan ruxsat so'raydi. Ruxsat berilgach
 * LiveKit huquqlari yangilanadi va tugma odatdagi holatga o'tadi
 * (`canPublishSource` 🟢 veb'dan ko'chirilgan).
 */

export interface LiveControlsProps {
  /** Tizim navigatsiya paneli balandligi — tugmalar uning tagida qolmasin. */
  bottomInset?: number;
  isTeacher: boolean;
  onLeave: () => void;
  /** O'quvchi mikrofon so'rovi. */
  onRequestMic: () => void;
  micRequesting: boolean;
  micWaiting: boolean;
  /** O'quvchi kamera so'rovi. */
  onRequestCamera: () => void;
  cameraRequesting: boolean;
  cameraWaiting: boolean;
  /** O'quvchi ekran ulashish so'rovi. */
  onRequestShare: () => void;
  shareRequesting: boolean;
}

export function LiveControls({
  bottomInset = 0,
  isTeacher,
  onLeave,
  onRequestMic,
  micRequesting,
  micWaiting,
  onRequestCamera,
  cameraRequesting,
  cameraWaiting,
  onRequestShare,
  shareRequesting,
}: LiveControlsProps) {
  const { t } = useTranslation("mobile");
  const { palette } = useTheme();
  const permissions = useLocalParticipantPermissions();
  const { localParticipant } = useLocalParticipant();

  const canSpeak = canPublishSource(permissions, MICROPHONE_SOURCE);
  const canShowCamera = canPublishSource(permissions, CAMERA_SOURCE);
  const canShare = canPublishSource(permissions, SCREEN_SHARE_SOURCE);

  const micOn = localParticipant.isMicrophoneEnabled;
  const cameraOn = localParticipant.isCameraEnabled;
  const shareOn = localParticipant.isScreenShareEnabled;

  async function toggleMic() {
    await localParticipant.setMicrophoneEnabled(!micOn);
  }

  async function toggleCamera() {
    await localParticipant.setCameraEnabled(!cameraOn);
  }

  /**
   * Ekranni ulashish. Android'da MediaProjection ishlaydi (manifestda
   * `FOREGROUND_SERVICE_MEDIA_PROJECTION` bor). iOS'da esa ReplayKit
   * Broadcast Extension kerak — u v1.1 ga qoldirilgan (DECISIONS §15),
   * shuning uchun bu yerda sababi aytiladi, tugma jim qolmaydi.
   */
  async function toggleShare() {
    if (Platform.OS === "ios") {
      toast.info(t("liveroom.ekran_ulashish_iosda_hali_mavjud_emas"));
      return;
    }
    try {
      await localParticipant.setScreenShareEnabled(!shareOn);
    } catch {
      toast.error(t("liveroom.ekranni_ulashib_bolmadi"));
    }
  }

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: palette.surface,
          borderTopColor: palette.border,
          /*
           * Tizim paneli tagiga qo'shimcha bo'shliq.
           *
           * Ekran `edgeToEdgeEnabled` rejimida chiziladi, ya'ni bu chiziq
           * navigatsiya paneli OSTIGA tushardi va "chiqish" tugmasi
           * tasodifan "orqaga" bilan birga bosilardi.
           */
          paddingBottom: 10 + bottomInset,
        },
      ]}
    >
      {canSpeak ? (
        <ControlButton
          label={micOn ? "Mikrofonni o'chirish" : "Mikrofonni yoqish"}
          active={micOn}
          onPress={() => void toggleMic()}
          icon={
            micOn ? (
              <Mic size={20} color={palette["primary-foreground"]} />
            ) : (
              <MicOff size={20} color={palette["muted-foreground"]} />
            )
          }
        />
      ) : (
        <RequestButton
          label={
            micWaiting ? "So'rov yuborildi, javob kutilmoqda" : "Gapirish uchun ruxsat so'rash"
          }
          waiting={micWaiting}
          disabled={micRequesting || micWaiting || isTeacher}
          onPress={onRequestMic}
          icon={<MicOff size={20} color={palette["muted-foreground"]} />}
        />
      )}

      {canShowCamera ? (
        <ControlButton
          label={cameraOn ? "Kamerani o'chirish" : "Kamerani yoqish"}
          active={cameraOn}
          onPress={() => void toggleCamera()}
          icon={
            cameraOn ? (
              <Video size={20} color={palette["primary-foreground"]} />
            ) : (
              <VideoOff size={20} color={palette["muted-foreground"]} />
            )
          }
        />
      ) : (
        <RequestButton
          label={
            cameraWaiting ? "So'rov yuborildi, javob kutilmoqda" : "Kamera uchun ruxsat so'rash"
          }
          waiting={cameraWaiting}
          disabled={cameraRequesting || cameraWaiting || isTeacher}
          onPress={onRequestCamera}
          icon={<VideoOff size={20} color={palette["muted-foreground"]} />}
        />
      )}

      {canShare ? (
        <ControlButton
          label={shareOn ? "Ulashishni to'xtatish" : "Ekranni ulashish"}
          active={shareOn}
          onPress={() => void toggleShare()}
          icon={
            <MonitorUp
              size={20}
              color={shareOn ? palette["primary-foreground"] : palette["muted-foreground"]}
            />
          }
        />
      ) : (
        <RequestButton
          label={t("liveroom.ekran_ulashish_uchun_ruxsat_sorash")}
          waiting={false}
          disabled={shareRequesting || isTeacher}
          onPress={onRequestShare}
          icon={<MonitorUp size={20} color={palette["muted-foreground"]} />}
        />
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("liveroom.darsdan_chiqish")}
        onPress={onLeave}
        style={({ pressed }) => [
          styles.control,
          styles.leave,
          {
            backgroundColor: palette.destructive,
            borderColor: palette.destructive,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <PhoneOff size={20} color={palette["destructive-foreground"]} />
      </Pressable>
    </View>
  );
}

function ControlButton({
  label,
  active,
  onPress,
  icon,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  icon: React.ReactNode;
}) {
  const { palette } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.control,
        {
          backgroundColor: active ? palette.primary : palette.secondary,
          borderColor: active ? palette.primary : palette["border-strong"],
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      {icon}
    </Pressable>
  );
}

/**
 * Navbatda turgan so'rov BITTA bo'ladi: javob (ruxsat yoki rad) kelmaguncha
 * qayta so'rab bo'lmaydi — shuning uchun tugma kutish holatiga o'tadi
 * (veb bilan bir xil qoida).
 */
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
  icon: React.ReactNode;
}) {
  const { palette } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, busy: waiting }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.control,
        {
          backgroundColor: waiting ? palette["warning-soft"] : palette.secondary,
          borderColor: waiting ? palette["warning-strong"] : palette["border-strong"],
          opacity: disabled && !waiting ? 0.45 : pressed ? 0.85 : 1,
        },
      ]}
    >
      {icon}
      {/* Kichik qo'l belgisi — bu tugma "so'rov" ekanini bildiradi. */}
      <View style={styles.corner}>
        <Hand
          size={12}
          color={waiting ? palette["warning-strong"] : palette["muted-foreground"]}
        />
      </View>
    </Pressable>
  );
}

/** Token mikrofonni umuman taqiqlagan holat — sababi ko'rinsin (veb bilan bir xil). */
export function MicBlockedNotice() {
  const { t } = useTranslation("mobile");
  return (
    <Text variant="caption" tone="muted" style={styles.notice}>
      {t("liveroom.server_tokenida_mikrofon_ruxsati_yoq_texnik_")}
    </Text>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  control: {
    width: MIN_TOUCH_SIZE + 8,
    height: MIN_TOUCH_SIZE + 8,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    /*
     * Chegara: qorong'i mavzuda `secondary` fon chiziqning O'Z foni bilan
     * deyarli bir xil chiqadi va o'chiq tugmalar umuman tugmaga
     * o'xshamasdi — ekranda faqat yoqilganlari ko'rinardi.
     */
    borderWidth: StyleSheet.hairlineWidth,
  },
  leave: { marginLeft: 8 },
  corner: { position: "absolute", right: 8, bottom: 8 },
  notice: { textAlign: "center", paddingHorizontal: 24, paddingBottom: 8 },
});
