import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useKeepAwake } from "expo-keep-awake";
import * as ScreenCapture from "expo-screen-capture";
import { LiveKitRoom, registerGlobals } from "@livekit/react-native";
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
import { Screen, ScreenLoading, ThemeScope, toast } from "@/shared/ui";
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

  if (lesson.isLoading || token.isLoading)
    return (
      <ThemeScope scheme="dark">
        <Screen>
          <ScreenLoading label={t("connection.connecting")} />
        </Screen>
      </ThemeScope>
    );

  if (lesson.isError || !lesson.data)
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

  return (
    <LiveKitRoom
      serverUrl={token.data.serverUrl}
      token={token.data.token}
      connect
      audio={choices.micOn}
      video={choices.cameraOn}
      onDisconnected={handleLeave}
      onError={(error) => toast.error(error.message)}
    >
      <LiveRoom lesson={lesson.data} isTeacher={token.data.isTeacher} onLeave={handleLeave} />
    </LiveKitRoom>
  );
}
