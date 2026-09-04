import { useEffect, useRef, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useKeepAwake } from "expo-keep-awake";
import * as ScreenCapture from "expo-screen-capture";
import { LiveKitRoom, registerGlobals } from "@livekit/react-native";
import { Mic, MicOff, Video, VideoOff } from "lucide-react-native";
import { useLesson } from "@/modules/lesson";
import {
  liveApi,
  MIC_TRACK,
  tokenAllowsTrack,
  useAnswerAttention,
  useAttentionCheck,
  useFocusTracker,
  useLiveToken,
} from "@/modules/live";
import {
  Badge,
  Button,
  Screen,
  ScreenError,
  ScreenLoading,
  Text,
  toast,
  useTheme,
} from "@/shared/ui";
import { LiveRoom } from "@/widgets/live-room/live-room";

/**
 * LiveKit RN WebRTC global'larini o'rnatadi.
 *
 * Modul darajasida, komponentdan TASHQARIDA chaqirilishi shart: LiveKit
 * ichki kodi `RTCPeerConnection` kabi global'larni import paytida kutadi.
 * Render ichida chaqirilsa birinchi ulanish yiqiladi.
 */
registerGlobals();

interface PreJoinChoices {
  audio: boolean;
  video: boolean;
}

/**
 * Jonli dars — alohida to'liq ekran sahifasi (veb `live-lesson-page.tsx` porti).
 *
 * Ketma-ketlik veb bilan bir xil: token -> kirishdan oldingi ekran ->
 * FIFO navbat kechikishi -> LiveKit ulanish.
 */
export function LiveLessonPage() {
  const router = useRouter();
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();

  const lesson = useLesson(lessonId ?? null);
  const token = useLiveToken(lessonId, true);

  const [choices, setChoices] = useState<PreJoinChoices | null>(null);
  /** Navbat kechikishi o'tdimi. Kechikish 0 bo'lsa umuman kutilmaydi (pastda). */
  const [delayElapsed, setDelayElapsed] = useState(false);
  const joined = useRef(false);

  // Dars davomida ekran o'chmasin.
  useKeepAwake();

  /**
   * SKRINSHOT HIMOYASI (docs/PROJECT.md §10, MOBILE_PLAN §10).
   *
   * Androidda `preventScreenCaptureAsync()` FLAG_SECURE qo'yadi va skrinshot
   * ham, ekran yozuvi ham TO'LIQ bloklanadi.
   *
   * iOS'da OS buni taqiqlashga umuman ruxsat bermaydi — u yerda faqat
   * ANIQLASH mumkin. Shuning uchun himoya ikkinchi qatlam bilan
   * to'ldirilgan: video ustidagi ism-watermark (`LiveWatermark`).
   */
  useEffect(() => {
    void ScreenCapture.preventScreenCaptureAsync();
    return () => {
      void ScreenCapture.allowScreenCaptureAsync();
    };
  }, []);

  /**
   * FIFO navbat kechikishi. Bitta darsga 20+ o'quvchi bir vaqtda ulansa
   * LiveKit'da CPU keskin portlaydi ("thundering herd", production'da
   * o'lchangan). Server har mijozga o'z navbat kechikishini beradi;
   * o'qituvchida u har doim 0.
   */
  const joinDelayMs = token.data?.joinDelayMs ?? 0;

  useEffect(() => {
    // Kechikish yo'q bo'lsa taymer ham kerak emas — `readyToConnect` uni
    // hisoblab oladi. Bu yerda `setState` ni SHARTSIZ chaqirish React
    // Compiler ogohlantirishiga sabab bo'lardi (kaskadli render).
    if (!choices || joinDelayMs <= 0) return undefined;
    const timer = setTimeout(() => setDelayElapsed(true), joinDelayMs);
    return () => clearTimeout(timer);
  }, [choices, joinDelayMs]);

  // Xonaga kirganimizni belgilaymiz — chiqishda backendga "leave" yuboriladi
  // (avtomatik davomat shunga tayanadi).
  useEffect(() => {
    if (token.data) joined.current = true;
  }, [token.data]);

  useEffect(() => {
    const currentLessonId = lessonId;
    return () => {
      if (joined.current && currentLessonId) {
        joined.current = false;
        liveApi.leave(currentLessonId).catch(() => undefined);
      }
    };
  }, [lessonId]);

  // Fokus jurnali — o'quvchi darsdan chiqib-kirganini yozadi (anti-cheat).
  useFocusTracker(lessonId, Boolean(token.data) && !token.data?.isTeacher);

  function leave() {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  if (token.isLoading || lesson.isLoading) {
    return (
      <Screen>
        <ScreenLoading label="Darsga ulanmoqda…" />
      </Screen>
    );
  }

  if (token.isError || !token.data) {
    return (
      <Screen>
        <ScreenError
          message={token.error?.message ?? "Darsga kirib bo'lmadi"}
          onRetry={() => void token.refetch()}
        />
      </Screen>
    );
  }

  const roomToken = token.data;
  const micAllowed = tokenAllowsTrack(roomToken.token, MIC_TRACK);

  if (!choices) {
    return (
      <PreJoin
        title={lesson.data?.title ?? "Jonli dars"}
        micAllowed={micAllowed}
        onJoin={setChoices}
        onCancel={leave}
      />
    );
  }

  // Kechikish 0 bo'lsa darhol; aks holda taymer tugashini kutamiz.
  const readyToConnect = joinDelayMs <= 0 || delayElapsed;

  if (!readyToConnect) {
    return (
      <Screen>
        <ScreenLoading label="Navbat kutilmoqda…" />
      </Screen>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={roomToken.serverUrl}
      token={roomToken.token}
      connect
      audio={choices.audio && micAllowed}
      video={choices.video}
      onDisconnected={() => leave()}
      onError={(error) => toast.error(error.message)}
    >
      <LiveRoom
        lessonId={lessonId ?? ""}
        courseId={lesson.data?.courseId ?? null}
        lessonTitle={lesson.data?.title ?? "Jonli dars"}
        isTeacher={roomToken.isTeacher}
        onLeave={leave}
      />
      <AttentionCheckDialog lessonId={lessonId ?? ""} enabled={!roomToken.isTeacher} />
    </LiveKitRoom>
  );
}

/** Kirishdan oldingi ekran — veb `lesson-pre-join.tsx` ning mobil varianti. */
function PreJoin({
  title,
  micAllowed,
  onJoin,
  onCancel,
}: {
  title: string;
  micAllowed: boolean;
  onJoin: (choices: PreJoinChoices) => void;
  onCancel: () => void;
}) {
  const { palette } = useTheme();
  const [audio, setAudio] = useState(false);
  const [video, setVideo] = useState(false);

  return (
    <Screen scroll>
      <View style={styles.preJoin}>
        <Text variant="heading">{title}</Text>
        <Text tone="muted">Darsga kirishdan oldin mikrofon va kamerani tanlang.</Text>

        {!micAllowed ? (
          <Badge label="Mikrofon o'qituvchi ruxsatidan keyin ochiladi" tone="warning" />
        ) : null}

        <View style={styles.toggles}>
          <Toggle
            label="Mikrofon"
            enabled={audio}
            disabled={!micAllowed}
            onToggle={() => setAudio((value) => !value)}
            onIcon={<Mic size={22} color={palette["primary-foreground"]} />}
            offIcon={<MicOff size={22} color={palette["muted-foreground"]} />}
          />
          <Toggle
            label="Kamera"
            enabled={video}
            onToggle={() => setVideo((value) => !value)}
            onIcon={<Video size={22} color={palette["primary-foreground"]} />}
            offIcon={<VideoOff size={22} color={palette["muted-foreground"]} />}
          />
        </View>

        <Button title="Darsga kirish" size="lg" onPress={() => onJoin({ audio, video })} />
        <Button title="Bekor qilish" variant="secondary" onPress={onCancel} />
      </View>
    </Screen>
  );
}

function Toggle({
  label,
  enabled,
  disabled = false,
  onToggle,
  onIcon,
  offIcon,
}: {
  label: string;
  enabled: boolean;
  disabled?: boolean;
  onToggle: () => void;
  onIcon: React.ReactNode;
  offIcon: React.ReactNode;
}) {
  const { palette } = useTheme();
  return (
    <View style={styles.toggle}>
      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: enabled, disabled }}
        accessibilityLabel={label}
        disabled={disabled}
        onPress={onToggle}
        style={({ pressed }) => [
          styles.toggleButton,
          {
            backgroundColor: enabled ? palette.primary : palette.secondary,
            opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
          },
        ]}
      >
        {enabled ? onIcon : offIcon}
      </Pressable>
      <Text variant="caption" tone="muted">
        {label}
      </Text>
    </View>
  );
}

/**
 * Diqqat tekshiruvi — dars davomida tasodifiy paytda chiqadi va 15 soniyada
 * javob berilishi kerak (docs/PROJECT.md §3).
 *
 * Mobilda ilova fon rejimida bo'lsa foydalanuvchi buni ko'rmaydi — lekin bu
 * TO'G'RI xulq: javob bermaslikning o'zi "darsda emas" degan signal va u
 * fokus jurnaliga tushadi.
 */
function AttentionCheckDialog({ lessonId, enabled }: { lessonId: string; enabled: boolean }) {
  const { palette } = useTheme();
  const check = useAttentionCheck(lessonId, enabled);
  const answer = useAnswerAttention(lessonId);

  const active = check.data;

  return (
    <Modal visible={Boolean(active)} transparent animationType="fade" statusBarTranslucent>
      <View style={[styles.attentionBackdrop, { backgroundColor: palette.overlay }]}>
        <View
          style={[
            styles.attentionCard,
            { backgroundColor: palette["surface-elevated"], borderColor: palette.border },
          ]}
        >
          <Text variant="subheading">Siz shu yerdamisiz?</Text>
          <Text tone="muted">
            Darsda ekaningizni tasdiqlang. Javob bermasangiz bu davomat hisobotiga tushadi.
          </Text>
          <Button
            title="Ha, shu yerdaman"
            size="lg"
            loading={answer.isPending}
            onPress={() => {
              if (active) answer.mutate(active.id);
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  preJoin: { gap: 16, paddingTop: 32 },
  toggles: { flexDirection: "row", gap: 24, paddingVertical: 16 },
  toggle: { alignItems: "center", gap: 8 },
  toggleButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  attentionBackdrop: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  attentionCard: {
    width: "100%",
    gap: 14,
    padding: 24,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
