import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useKeepAwake } from "expo-keep-awake";
import * as ScreenCapture from "expo-screen-capture";
import { LiveKitRoom, registerGlobals } from "@livekit/react-native";
import { DisconnectReason, VideoPresets, type RoomOptions } from "livekit-client";
import { Info } from "lucide-react-native";
import { useAuth } from "@/modules/auth";
import { RateLessonSheet, useLesson } from "@/modules/lesson";
import {
  LessonPreJoin,
  liveApi,
  MIC_TRACK,
  tokenAllowsTrack,
  useLiveToken,
  type LessonPreJoinChoices,
} from "@/modules/live";
import { ROUTES } from "@/shared/config";
import { isOnline } from "@/shared/lib";
import { DsText, dsRadius, Screen, ScreenLoading, ThemeScope, toast, useDs } from "@/shared/ui";
import { LiveRoom } from "@/widgets/live-room/live-room";
import { LiveRoomState } from "@/widgets/live-room/live-room-state";

/**
 * LiveKit RN WebRTC global'larini o'rnatadi.
 *
 * Modul darajasida, komponentdan TASHQARIDA chaqirilishi shart: LiveKit
 * ichki kodi `RTCPeerConnection` kabi global'larni import paytida kutadi.
 * Render ichida chaqirilsa birinchi ulanish yiqiladi.
 */
registerGlobals();

/**
 * Veb a4a6a70: adaptiveStream — tomoshabin faqat ko'rinib turgan o'lchamga mos
 * qatlamni oladi; dynacast — hech kim ko'rmayotgan qatlam yuborilmaydi; kamera
 * 540p@24 + 180p (2 qatlam). Modul darajasida — Room qayta yaratilmasin.
 */
const ROOM_OPTIONS: RoomOptions = {
  adaptiveStream: true,
  dynacast: true,
  videoCaptureDefaults: { resolution: { ...VideoPresets.h540.resolution, frameRate: 24 } },
  publishDefaults: { videoSimulcastLayers: [VideoPresets.h180] },
};

/*
 * Veb bd11d31 — avtomatik qayta kirish: LiveKit o'zi qayta ulana olmay uzilsa
 * ham foydalanuvchi darsdan chiqarilmaydi, yangi token bilan xona qayta
 * yaratiladi. Kutish oraliqlari kengayib boradi (jami ~1,5 daqiqa).
 * CLIENT_INITIATED yakuniy sabab EMAS: kutubxona qayta ulanish bekor
 * bo'lganda ham shuni beradi; foydalanuvchining o'z chiqishi `leaving` bilan ajratiladi.
 */
const REJOIN_DELAYS_MS = [1_500, 3_000, 5_000, 8_000, 10_000, 15_000, 15_000, 20_000];
const REJOIN_CONNECT_TIMEOUT_MS = 20_000;
const FINAL_DISCONNECT_REASONS = new Set<DisconnectReason | undefined>([
  DisconnectReason.DUPLICATE_IDENTITY,
  DisconnectReason.PARTICIPANT_REMOVED,
  DisconnectReason.ROOM_DELETED,
  DisconnectReason.ROOM_CLOSED,
  DisconnectReason.USER_REJECTED,
  DisconnectReason.USER_UNAVAILABLE,
]);

type LiveToken = Awaited<ReturnType<typeof liveApi.getToken>>;

/**
 * Jonli dars — veb `pages/live/live-lesson-page.tsx` porti.
 *
 * Ketma-ketlik veb bilan bir xil: token -> kirishdan oldingi ekran ->
 * FIFO navbat kechikishi -> LiveKit ulanish; chiqishda o'quvchiga dars
 * tugagan bo'lsa baho so'raladi.
 */
export function LiveLessonPage() {
  const { t } = useTranslation("live");
  const router = useRouter();
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const { user } = useAuth();
  // Veb #161: yozuv holati (`recordingActive`) yangilanib turishi uchun.
  const lesson = useLesson(lessonId ?? null, 30_000);
  const token = useLiveToken(lessonId, true);
  const joined = useRef(false);
  const isTeacher = useRef(false);
  const [ratePrompt, setRatePrompt] = useState(false);
  const [choices, setChoices] = useState<LessonPreJoinChoices | null>(null);
  const [delayElapsed, setDelayElapsed] = useState(false);
  // Avtomatik qayta kirish: `session` o'zgarsa LiveKitRoom yangidan yaratiladi, `rejoinAttempt` > 0 bo'lsa banner ko'rinadi.
  const [session, setSession] = useState(0);
  const [freshToken, setFreshToken] = useState<LiveToken | null>(null);
  const [rejoinAttempt, setRejoinAttempt] = useState(0);
  const rejoining = useRef(false);
  const rejoinAttempts = useRef(0);
  const rejoinTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const rejoinStep = useRef<() => void>(() => undefined);
  // Foydalanuvchi chiqayotgan (yoki ekran yopilayotgan) paytda CLIENT_INITIATED uzilishi qayta kirishni boshlamasin.
  const leaving = useRef(false);
  useLayoutEffect(() => {
    leaving.current = false;
    return () => {
      leaving.current = true;
    };
  }, []);

  // Dars davomida ekran o'chmasin.
  useKeepAwake();

  /**
   * SKRINSHOT HIMOYASI (docs/PROJECT.md §10, MOBILE_PLAN §10).
   *
   * Androidda `preventScreenCaptureAsync()` FLAG_SECURE qo'yadi va skrinshot
   * ham, ekran yozuvi ham TO'LIQ bloklanadi. iOS'da OS buni taqiqlashga
   * ruxsat bermaydi — u yerda ism-watermark (`LiveWatermark`) ishlaydi.
   */
  useEffect(() => {
    void ScreenCapture.preventScreenCaptureAsync();
    return () => {
      void ScreenCapture.allowScreenCaptureAsync();
    };
  }, []);

  /**
   * FIFO navbat kechikishi: 20+ o'quvchi bir vaqtda ulansa LiveKit'da CPU
   * keskin portlaydi. Server har mijozga o'z kechikishini beradi; o'qituvchida 0.
   */
  const joinDelayMs = token.data?.joinDelayMs ?? 0;
  useEffect(() => {
    if (!choices || joinDelayMs <= 0) return undefined;
    const timer = setTimeout(() => setDelayElapsed(true), joinDelayMs);
    return () => clearTimeout(timer);
  }, [choices, joinDelayMs]);

  useEffect(() => {
    if (token.data) {
      joined.current = true;
      isTeacher.current = token.data.isTeacher;
    }
  }, [token.data]);

  // Chiqishda backendga "leave" — avtomatik davomat shunga tayanadi.
  useEffect(() => {
    const currentLessonId = lessonId;
    return () => {
      if (joined.current && currentLessonId) {
        joined.current = false;
        liveApi.leave(currentLessonId).catch(() => undefined);
      }
    };
  }, [lessonId]);

  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }, [router]);

  const refetchLesson = lesson.refetch;
  const handleLeave = useCallback(() => {
    leaving.current = true;
    if (isTeacher.current) {
      goBack();
      return;
    }
    refetchLesson()
      .then((result) => {
        if (result.data?.status === "finished") setRatePrompt(true);
        else goBack();
      })
      .catch(() => goBack());
  }, [goBack, refetchLesson]);

  const stopRejoin = useCallback(() => {
    clearTimeout(rejoinTimer.current);
    rejoining.current = false;
    rejoinAttempts.current = 0;
    setRejoinAttempt(0);
  }, []);

  // Har chaqiruvda keyingi urinish: kutadi -> dars tugamaganini tekshiradi -> yangi token -> xonani qayta yaratadi.
  // Ulanmasa (yoki yana uzilsa) qayta chaqiriladi; urinishlar tugasa avvalgidek darsdan chiqiladi.
  useEffect(() => {
    rejoinStep.current = () => {
      clearTimeout(rejoinTimer.current);
      const attempt = rejoinAttempts.current;
      if (attempt >= REJOIN_DELAYS_MS.length) {
        stopRejoin();
        toast.error("Aloqa tiklanmadi — darsga qaytadan kiring");
        handleLeave();
        return;
      }
      rejoinAttempts.current = attempt + 1;
      setRejoinAttempt(attempt + 1);
      rejoinTimer.current = setTimeout(() => {
        void (async () => {
          try {
            // Veb `navigator.onLine` o'rni — NetInfo'ning oxirgi ma'lum holati.
            if (!isOnline()) throw new Error("offline");
            const latest = await refetchLesson();
            if (latest.data?.status === "finished") {
              stopRejoin();
              handleLeave();
              return;
            }
            const next = await liveApi.getToken(lessonId as string);
            setFreshToken(next);
            setSession((current) => current + 1);
            // Yangi xona shu vaqt ichida ulanmasa — yana urinamiz (`handleConnected` taymerni to'xtatadi).
            rejoinTimer.current = setTimeout(() => rejoinStep.current(), REJOIN_CONNECT_TIMEOUT_MS);
          } catch {
            rejoinStep.current();
          }
        })();
      }, REJOIN_DELAYS_MS[attempt]);
    };
  }, [handleLeave, lessonId, refetchLesson, stopRejoin]);

  useEffect(() => () => clearTimeout(rejoinTimer.current), []);

  const handleDisconnected = useCallback(
    (reason?: DisconnectReason) => {
      if (reason === DisconnectReason.PARTICIPANT_REMOVED) {
        toast.error("Siz darsdan chetlashtirildingiz");
        stopRejoin();
        handleLeave();
        return;
      }
      // Foydalanuvchi o'zi chiqyapti yoki qayta kirishda eski xona yangisi bilan almashyapti.
      if (reason === DisconnectReason.CLIENT_INITIATED && (leaving.current || rejoining.current)) return;
      if (FINAL_DISCONNECT_REASONS.has(reason)) {
        stopRejoin();
        handleLeave();
        return;
      }
      rejoining.current = true;
      rejoinStep.current();
    },
    [handleLeave, stopRejoin]
  );

  const handleConnected = useCallback(() => {
    if (rejoining.current) stopRejoin();
  }, [stopRejoin]);

  if (lesson.isLoading || token.isLoading)
    return (
      <ThemeScope scheme="dark">
        <Screen>
          <ScreenLoading label={t("connection.connecting")} />
        </Screen>
      </ThemeScope>
    );

  // 🟡 Vebda `lesson.isError || !lesson.data`. RN'da TanStack onlineManager tarmoqni bilmaydi: aloqa
  // uzilganda 30 s'lik fon so'rovi xato bersa ham xonadan chiqarib yubormaslik uchun faqat ma'lumot yo'qligiga qaraladi.
  if (!lesson.data)
    return (
      <LiveRoomState
        title={t("state.notFoundTitle")}
        description={lesson.error?.message}
        actionLabel={t("state.back")}
        onAction={handleLeave}
        onBack={handleLeave}
      />
    );

  if (ratePrompt)
    return (
      <>
        <LiveRoomState
          tone="neutral"
          lessonTitle={lesson.data.title}
          subtitle={lesson.data.courseTitle}
          title={t("state.finishedTitle")}
          description={t("state.finishedDescription")}
          actionLabel={t("state.exit")}
          onAction={goBack}
        />
        <RateLessonSheet lesson={lesson.data} onClose={goBack} />
      </>
    );

  if (token.isError || !token.data) {
    const finished = lesson.data.status === "finished";
    const current = lesson.data;
    return (
      <LiveRoomState
        tone="offline"
        title={finished ? t("state.joinFailedTitle") : t("state.mobileJoinFailedTitle")}
        description={finished ? t("state.joinFailedFinished", { title: current.title, time: current.time }) : t("state.mobileJoinFailedDescription")}
        actionLabel={finished ? t("state.openRecording") : t("state.retry")}
        onAction={finished ? () => router.replace(ROUTES.recording(current.id) as never) : () => void token.refetch()}
        secondaryLabel={t("state.mobileBackToChat")}
        onSecondary={handleLeave}
      />
    );
  }

  if (!choices)
    return (
      <LessonPreJoin
        lesson={lesson.data}
        userName={user?.name}
        micAllowed={tokenAllowsTrack(token.data.token, MIC_TRACK)}
        onJoin={setChoices}
        onCancel={goBack}
      />
    );

  if (joinDelayMs > 0 && !delayElapsed)
    return (
      <ThemeScope scheme="dark">
        <Screen>
          <ScreenLoading label={t("connection.connecting")} />
        </Screen>
      </ThemeScope>
    );

  const liveToken = freshToken ?? token.data;
  return (
    <View style={styles.fill}>
      <LiveKitRoom
        key={session}
        serverUrl={liveToken.serverUrl}
        token={liveToken.token}
        options={ROOM_OPTIONS}
        connect
        audio={choices.micOn}
        video={choices.cameraOn}
        onConnected={handleConnected}
        onDisconnected={handleDisconnected}
        // Qayta kirish paytidagi ulanish xatolari ko'rsatilmaydi — keyingi urinish o'zi boshlanadi.
        onError={(error) => !rejoining.current && toast.error(error.message)}
      >
        <LiveRoom lesson={lesson.data} isTeacher={token.data.isTeacher} onLeave={handleLeave} />
      </LiveKitRoom>
      {rejoinAttempt > 0 ? <RejoinBanner /> : null}
    </View>
  );
}

/** Qayta kirish banneri — veb `room.reconnectingMobile` (`role="status"`). */
function RejoinBanner() {
  const { t } = useTranslation("live");
  const insets = useSafeAreaInsets();
  return (
    <ThemeScope scheme="dark">
      <RejoinBannerBody label={t("room.reconnectingMobile")} top={insets.top + 72} />
    </ThemeScope>
  );
}

function RejoinBannerBody({ label, top }: { label: string; top: number }) {
  const ds = useDs();
  return (
    <View accessibilityRole="alert" pointerEvents="none" style={[styles.rejoin, { top }]}>
      <View style={[styles.rejoinBody, { backgroundColor: ds.c["warning-bg"] }]}>
        <Info size={17} color={ds.c["warning-fg"]} />
        <DsText v="body-sm" c="warning-fg" style={styles.shrink}>
          {label}
        </DsText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  shrink: { flexShrink: 1 },
  rejoin: { position: "absolute", left: 16, right: 16, zIndex: 30, alignItems: "center" },
  rejoinBody: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: dsRadius.xl },
});
