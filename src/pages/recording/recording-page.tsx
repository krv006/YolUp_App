import { useMemo, useRef, useState, type ReactNode } from "react";
import { useEvent, useEventListener } from "expo";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useVideoPlayer, VideoView, type VideoPlayer } from "expo-video";
import { useKeepAwake } from "expo-keep-awake";
import { Maximize2, Pause, Play, Volume2, VolumeX } from "lucide-react-native";
import { useAttendance } from "@/modules/attendance";
import { useAuth, useRoleRoutes } from "@/modules/auth";
import { boardApi } from "@/modules/board";
import { useConversations } from "@/modules/conversation";
import { useCourse } from "@/modules/course";
import { LessonRatingForm, useDeleteRecording, useLesson, useLessonRecording, useShareRecording } from "@/modules/lesson";
import { ROUTES } from "@/shared/config";
import { ROLES } from "@/shared/constants";
import { downloadBlob } from "@/shared/lib";
import type { Lesson, LessonRecording } from "@/shared/types";
import {
  ConfirmDialog,
  dsAlpha,
  DsGradient,
  DsText,
  dsRadius,
  Icon,
  MobileEmptyCard,
  MobileRoundButton,
  MobileScreen,
  PopoverMenu,
  PopoverMenuItem,
  toast,
  useDs,
  usePopoverAnchor,
  type IconName,
} from "@/shared/ui";

/**
 * Dars yozuvi — veb `recording-page.tsx` + `recording-mobile.tsx` (tor
 * ekran): sarlavha va menyu (chatga yuborish, PDF), pleer yoki "tayyorlanmoqda"
 * kartasi, dars nomi va vaqti; tayyor bo'lsa ishtirokchi/davomat chiplari,
 * doska sahifalari, davomat va o'chirish qatorlari; o'quvchiga baholash.
 *
 * Dars tugagach backend kurs chatiga `.../recordings/<lesson_id>` havolasini
 * yuboradi (docs/PROJECT.md §10) va u AYNAN shu ekranga tushadi.
 *
 * `stream_url` — 3 soatlik IMZOLANGAN havola, doimiy emas. Shuning uchun
 * `useLessonRecording` uni `staleTime: 0` bilan so'raydi va biz uni
 * keshlamaymiz: eskirgan URL bilan pleer ochilsa video umuman yuklanmaydi.
 */
export function RecordingPage() {
  const { t } = useTranslation("lesson");
  const router = useRouter();
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const { user } = useAuth();
  const lesson = useLesson(lessonId ?? null);
  const recording = useLessonRecording(lessonId ?? null);

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  if (lesson.isLoading || (!lesson.isError && !lesson.data) || recording.isLoading) return <RecordingSkeleton />;

  if (lesson.isError || !lesson.data)
    return (
      <MobileScreen title={t("recording.eyebrow")} closeLabel={t("recording.back")} closeIcon="chevron-left" onClose={goBack}>
        <View style={styles.errorCard}>
          <MobileEmptyCard
            icon="error"
            iconColor="error-text"
            title="Darsni topib bo‘lmadi"
            description={lesson.error?.message}
            action={{ label: "Qayta urinish", icon: "refresh", onPress: () => void lesson.refetch() }}
          />
        </View>
      </MobileScreen>
    );

  return (
    <RecordingMobile lesson={lesson.data} recording={recording.data} canManage={user?.role === ROLES.TEACHER} onBack={goBack}>
      {user?.role === ROLES.STUDENT ? (
        <View style={styles.rating}>
          <LessonRatingForm lesson={lesson.data} currentUserId={user?.id} />
        </View>
      ) : null}
    </RecordingMobile>
  );
}

interface RecordingMobileProps {
  lesson: Lesson;
  recording: LessonRecording | null | undefined;
  canManage: boolean;
  onBack: () => void;
  children?: ReactNode;
}

function RecordingMobile({ lesson, recording, canManage, onBack, children }: RecordingMobileProps) {
  const { t } = useTranslation("lesson");
  const ds = useDs();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const routes = useRoleRoutes();
  const months = t("list.months", { returnObjects: true }) as string[];
  const course = useCourse(canManage ? lesson.courseId : null);
  const attendance = useAttendance({ lesson: lesson.id }, canManage);
  const conversations = useConversations(canManage ? "teacher" : "student");
  const removeRecording = useDeleteRecording();
  const share = useShareRecording(lesson.id);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { anchorRef, rect, open: openMenu, close: closeMenu } = usePopoverAnchor();

  const ready = Boolean(recording?.ready && recording.streamUrl);
  const rows = useMemo(() => attendance.data ?? [], [attendance.data]);
  const studentCount = course.data?.studentCount ?? rows.length;
  const joined = recording?.participantsCount ?? rows.filter((row) => (row.minutes ?? 0) > 0).length;
  const boardPages = recording?.boardPreviews.length || recording?.boardPages || 0;

  const day = new Date(`${lesson.date}T00:00`);
  const dateLabel = Number.isNaN(day.getTime()) ? lesson.date : `${day.getDate()}-${(months[day.getMonth()] ?? "").toLowerCase()}`;
  const hours = Math.floor(lesson.durationMinutes / 60);
  const durationLabel = hours
    ? t("recording.durationHours", { hours, count: lesson.durationMinutes % 60 })
    : t("recording.durationValue", { count: lesson.durationMinutes });

  const pendingTitle =
    recording?.status === "recording"
      ? t("recording.recordingTitle")
      : recording?.status === "failed"
        ? t("recording.failedTitle")
        : recording
          ? t("recording.mergingTitle")
          : t("recording.noneTitle");
  const pendingNote =
    recording?.error ??
    (recording?.status === "recording"
      ? t("recording.recording")
      : recording?.status === "failed"
        ? t("recording.failed")
        : recording
          ? t("recording.mobileMerging")
          : t("recording.none"));
  const pendingIcon: IconName = recording?.status === "failed" ? "error" : recording ? "hourglass-empty" : "videocam";

  async function downloadPdf() {
    closeMenu();
    try {
      const blob = await boardApi.downloadPdf(lesson.id);
      await downloadBlob(blob as Blob, `${lesson.title || "doska"}.pdf`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("recording.pdfFailed"));
    }
  }

  /* Vebda `/teacher/attendance` sahifasi; mobilda — guruh chatining "Davomat" bo'limi. */
  function openAttendance() {
    const room = (conversations.data ?? []).find((item) => item.courseId === lesson.courseId);
    router.push((room ? `${routes.chat(room.id)}?tab=attendance` : routes.chats) as never);
  }

  const menu =
    canManage && ready ? (
      <View ref={anchorRef} collapsable={false}>
        <MobileRoundButton icon="more" label={t("recording.menu")} onPress={openMenu} />
        <PopoverMenu rect={rect} onClose={closeMenu} height={recording?.pdfUrl ? 112 : 56}>
          <PopoverMenuItem
            label={t("recording.sendToChat")}
            onPress={() => {
              closeMenu();
              if (share.isPending) return;
              share.mutate(undefined, {
                onSuccess: () => toast.success(t("recording.sharedToChat")),
                onError: (error: Error) => toast.error(error.message),
              });
            }}
          />
          {recording?.pdfUrl ? <PopoverMenuItem label={t("recording.downloadPdf")} onPress={() => void downloadPdf()} /> : null}
        </PopoverMenu>
      </View>
    ) : undefined;

  return (
    <MobileScreen title={t("recording.eyebrow")} closeLabel={t("recording.back")} closeIcon="chevron-left" onClose={onBack} action={menu}>
      <View style={styles.top}>
        {ready && recording?.streamUrl ? (
          <RecordingVideo src={recording.streamUrl} />
        ) : (
          <View style={[styles.frame, styles.pending, { backgroundColor: ds.c.surface }]}>
            <Icon name={pendingIcon} size={32} color={ds.c["ink-secondary"]} />
            <DsText v="title" w="600" c="ink-secondary" style={styles.center}>
              {pendingTitle}
            </DsText>
          </View>
        )}
      </View>

      <DsText v="title-lg" w="700" style={styles.title}>
        {lesson.title || t("list.missingTopic")}
      </DsText>
      <DsText v="body-sm" c="ink-secondary" style={styles.subtitle}>
        {lesson.courseTitle} · {dateLabel}, {lesson.time} · {durationLabel}
      </DsText>

      {ready ? (
        <>
          <View style={styles.chips}>
            {recording?.participantsCount != null ? (
              <Chip icon="quiz" bg="brand-subtle" fg="brand" label={t("recording.mobileParticipants", { count: recording.participantsCount })} />
            ) : null}
            {recording?.attendanceRate != null ? (
              <Chip
                icon="check-circle"
                bg="success-bg"
                fg="success-fg"
                label={t("recording.mobileAttendance", { value: Math.round(recording.attendanceRate) })}
              />
            ) : null}
          </View>

          <View style={[styles.card, { backgroundColor: ds.c.surface }]}>
            <LinkRow
              icon="edit"
              iconBg="accent-violet-bg"
              iconFg="accent-violet-fg"
              title={t("recording.boardPagesTitle")}
              subtitle={boardPages ? t("recording.mobileBoardPages", { count: boardPages }) : t("recording.noBoardPages")}
              divider={canManage}
              onPress={() => router.push(ROUTES.board(lesson.id) as never)}
            />
            {canManage ? (
              <LinkRow
                icon="check-circle"
                iconBg="success-bg"
                iconFg="success-fg"
                title={t("recording.mobileAttendanceTitle")}
                subtitle={t("recording.mobileJoined", { joined, total: studentCount })}
                divider
                onPress={openAttendance}
              />
            ) : null}
            {canManage ? (
              <Pressable accessibilityRole="button" onPress={() => setConfirmOpen(true)} style={styles.row}>
                <View style={[styles.rowIcon, { backgroundColor: ds.c["danger-bg"] }]}>
                  <Icon name="logout" size={20} color={ds.c["error-text"]} />
                </View>
                <DsText v="title" w="600" c="error-text" numberOfLines={1} style={styles.grow}>
                  {t("recording.mobileDelete")}
                </DsText>
              </Pressable>
            ) : null}
          </View>

          <DsText v="caption" c="ink-secondary" style={styles.note}>
            {t("recording.mobilePlatformOnly")}
          </DsText>
        </>
      ) : (
        <>
          <View style={[styles.pendingNote, { backgroundColor: ds.c["brand-subtle"] }]}>
            <Icon name="bolt" size={20} color={ds.c.brand} />
            <DsText v="body-sm" c="brand" style={[styles.grow, styles.pendingText]}>
              {pendingNote}
            </DsText>
          </View>
          {recording && recording.status !== "failed" ? (
            <DsText v="caption" c="ink-secondary" style={styles.readyNote}>
              {t("recording.mobileReadyNote")}
            </DsText>
          ) : null}
        </>
      )}

      {children}
      <View style={{ height: insets.bottom + 8 }} />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        icon="trash"
        title={t("recording.deleteDialogTitle")}
        description={t("recording.deleteDialogDescription")}
        confirmLabel={t("recording.delete")}
        cancelLabel={t("recording.cancel")}
        pending={removeRecording.isPending}
        onConfirm={() =>
          removeRecording.mutate(lesson.id, {
            onSuccess: () => {
              setConfirmOpen(false);
              onBack();
            },
          })
        }
      />
    </MobileScreen>
  );
}

function Chip({ icon, bg, fg, label }: { icon: IconName; bg: "brand-subtle" | "success-bg"; fg: "brand" | "success-fg"; label: string }) {
  const ds = useDs();
  return (
    <View style={[styles.chip, { backgroundColor: ds.c[bg] }]}>
      <Icon name={icon} size={14} color={ds.c[fg]} />
      <DsText v="caption-strong" c={fg}>
        {label}
      </DsText>
    </View>
  );
}

function LinkRow({
  icon,
  iconBg,
  iconFg,
  title,
  subtitle,
  divider,
  onPress,
}: {
  icon: IconName;
  iconBg: "accent-violet-bg" | "success-bg";
  iconFg: "accent-violet-fg" | "success-fg";
  title: string;
  subtitle: string;
  divider: boolean;
  onPress: () => void;
}) {
  const ds = useDs();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, divider && { borderBottomWidth: 1, borderBottomColor: ds.c.line }, pressed && { backgroundColor: ds.c.subtle }]}
    >
      <View style={[styles.rowIcon, { backgroundColor: ds.c[iconBg] }]}>
        <Icon name={icon} size={20} color={ds.c[iconFg]} />
      </View>
      <View style={styles.grow}>
        <DsText v="title" w="600" numberOfLines={1}>
          {title}
        </DsText>
        <DsText v="body-sm" c="ink-secondary" numberOfLines={1}>
          {subtitle}
        </DsText>
      </View>
      <Icon name="chevron-right" size={20} color={ds.c["ink-secondary"]} />
    </Pressable>
  );
}

function clock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = total % 60;
  const mm = hours ? String(minutes).padStart(2, "0") : String(minutes);
  return `${hours ? `${hours}:` : ""}${mm}:${String(rest).padStart(2, "0")}`;
}

/* Pleer — native obyekt; xususiyatlari shu yordamchilar orqali o'zgartiriladi. */
function seekTo(player: VideoPlayer, seconds: number) {
  player.currentTime = seconds;
}

function setMuted(player: VideoPlayer, muted: boolean) {
  player.muted = muted;
}

/**
 * Pleer — veb `recording-video.tsx` (`variant="mobile"`): `aspect-[358/211]`
 * qora karta, o'rtada oq doira ichida "Play", boshlangach pastda vaqt,
 * chiziq va ovoz tugmasi. Vebdan farqi: oxirida to'liq ekran tugmasi bor.
 */
function RecordingVideo({ src }: { src: string }) {
  // Video ko'rayotganda ekran o'chib qolmasin.
  useKeepAwake();

  const { t } = useTranslation("lesson");
  const { t: tm } = useTranslation("mobile");
  const ds = useDs();
  const viewRef = useRef<VideoView>(null);
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [trackWidth, setTrackWidth] = useState(0);

  const player = useVideoPlayer(src, (instance) => {
    // Avtomatik boshlanmaydi: mobil internetda foydalanuvchi o'zi qaror qilsin.
    instance.loop = false;
    instance.timeUpdateEventInterval = 0.25;
  });
  const { status } = useEvent(player, "statusChange", { status: player.status });
  const { isPlaying } = useEvent(player, "playingChange", { isPlaying: player.playing });
  const { muted } = useEvent(player, "mutedChange", { muted: player.muted });
  useEventListener(player, "timeUpdate", (payload) => setCurrent(payload.currentTime));
  useEventListener(player, "sourceLoad", (payload) => setDuration(payload.duration));
  useEventListener(player, "playingChange", (payload) => payload.isPlaying && setStarted(true));

  /*
   * IJRO XATOSI — ALOHIDA HOLAT. Backend yozuvni avval WebM sifatida beradi
   * va MP4 nusxani FONDA tayyorlaydi (`docs/BACKEND-IOS.md`); iOS WebM'ni
   * ocholmaydi, Androidda esa internet uzilishi mumkin. Usiz foydalanuvchi
   * qora ekran ko'rardi — shuning uchun izoh va qayta urinish tugmasi.
   *
   * Pleer qo'lda to'xtatilmaydi: `useVideoPlayer` uni unmount'da o'zi
   * bo'shatadi, tozalashdagi `pause()` esa bo'shatilgan obyektga murojaat
   * qilib ilovani yiqitardi.
   */
  if (status === "error")
    return (
      <View style={[styles.frame, styles.pending, { backgroundColor: ds.c.surface }]}>
        <Icon name="hourglass-empty" size={32} color={ds.c["ink-secondary"]} />
        <DsText v="title" w="600" c="ink-secondary" style={styles.center}>
          {tm("recording.tayyorlanmoqda")}
        </DsText>
        <DsText v="caption" c="ink-secondary" style={styles.center}>
          {tm("recording.yozuvni_ochib_bolmadi_hali_tayyorlanayotgan")}
        </DsText>
        <Pressable accessibilityRole="button" onPress={() => player.replace(src)} style={[styles.retry, { backgroundColor: ds.c["brand-subtle"] }]}>
          <Icon name="refresh" size={16} color={ds.c.brand} />
          <DsText v="button-sm" c="brand">
            {tm("recording.qayta_urinish")}
          </DsText>
        </Pressable>
      </View>
    );

  const progress = duration > 0 ? Math.min(current / duration, 1) : 0;
  function toggle() {
    if (isPlaying) {
      player.pause();
      return;
    }
    // Brauzerdagi kabi: oxiriga yetgan video boshidan qo'yiladi (ExoPlayer o'zi qaytarmaydi).
    if (duration > 0 && current >= duration - 0.5) seekTo(player, 0);
    player.play();
  }

  return (
    <View style={[styles.frame, { backgroundColor: ds.c["surface-inverse"] }]}>
      <VideoView
        ref={viewRef}
        style={StyleSheet.absoluteFill}
        player={player}
        nativeControls={false}
        fullscreenOptions={{ enable: true }}
        allowsPictureInPicture
        contentFit="cover"
      />

      {isPlaying ? (
        <Pressable accessibilityRole="button" accessibilityLabel={t("recording.pause")} onPress={toggle} style={StyleSheet.absoluteFill} />
      ) : (
        <Pressable accessibilityRole="button" accessibilityLabel={t("recording.play")} onPress={toggle} style={[StyleSheet.absoluteFill, styles.playOverlay]}>
          <View style={[styles.playCircle, { backgroundColor: ds.c.surface }]}>
            <Play size={26} color={ds.c.brand} fill={ds.c.brand} />
          </View>
        </Pressable>
      )}

      {/* `absolute inset-x-5 bottom-5 h-8.5 rounded-md bg-surface-inverse/55 px-3 gap-3` */}
      {started ? (
        <View style={[styles.controls, { backgroundColor: dsAlpha(ds.c["surface-inverse"], 0.55) }]}>
          <Pressable accessibilityRole="button" accessibilityLabel={isPlaying ? t("recording.pause") : t("recording.play")} onPress={toggle} hitSlop={8} style={styles.control}>
            {isPlaying ? <Pause size={14} color={ds.c["ink-inverse"]} fill={ds.c["ink-inverse"]} /> : <Play size={14} color={ds.c["ink-inverse"]} fill={ds.c["ink-inverse"]} />}
          </Pressable>
          <DsText v="body-xs" c="ink-inverse" numeric>
            {clock(current)}
          </DsText>
          <Pressable
            accessibilityRole="adjustable"
            onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
            onPress={(event) => trackWidth && duration && seekTo(player, Math.max(0, Math.min(event.nativeEvent.locationX / trackWidth, 1)) * duration)}
            style={styles.track}
          >
            <View style={[styles.trackBar, { backgroundColor: dsAlpha(ds.c["ink-inverse"], 0.3) }]}>
              <View style={[styles.trackFill, { width: `${progress * 100}%`, backgroundColor: ds.c["ink-inverse"] }]} />
            </View>
          </Pressable>
          <DsText v="body-xs" c="ink-inverse" numeric>
            {clock(duration)}
          </DsText>
          <Pressable accessibilityRole="button" accessibilityLabel={muted ? t("recording.unmute") : t("recording.mute")} onPress={() => setMuted(player, !muted)} hitSlop={8} style={styles.control}>
            {muted ? <VolumeX size={16} color={ds.c["ink-inverse"]} /> : <Volume2 size={16} color={ds.c["ink-inverse"]} />}
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={tm("recording.toliq_ekran")} onPress={() => void viewRef.current?.enterFullscreen()} hitSlop={8} style={styles.control}>
            <Maximize2 size={15} color={ds.c["ink-inverse"]} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

/** Veb `RecordingSkeleton` ning tor ekran qismi. */
function RecordingSkeleton() {
  const ds = useDs();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.fill, styles.skeleton, { backgroundColor: ds.c.canvas, paddingTop: insets.top + 20 }]} accessibilityState={{ busy: true }}>
      <DsGradient name="auth" />
      <View style={styles.skeletonHeader}>
        <View style={[styles.skeletonRound, { backgroundColor: ds.c.surface }]} />
        <View style={[styles.skeletonBar, { backgroundColor: ds.c.skeleton }]} />
      </View>
      <View style={[styles.frame, { backgroundColor: ds.c.skeleton }]} />
      <View style={styles.skeletonGrid}>
        {Array.from({ length: 4 }, (_, index) => (
          <View key={index} style={[styles.skeletonCell, { backgroundColor: ds.c.surface }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  center: { textAlign: "center" },
  errorCard: { marginTop: 16 },
  top: { marginTop: 16 },
  frame: { width: "100%", aspectRatio: 358 / 211, overflow: "hidden", borderRadius: dsRadius["2xl"] },
  /* `flex-col items-center justify-center gap-3 px-6` */
  pending: { alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 24 },
  title: { marginTop: 14 },
  subtitle: { marginTop: 2 },
  chips: { marginTop: 14, flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  chip: { height: 26, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 8, borderRadius: 13 },
  card: { marginTop: 14, overflow: "hidden", borderRadius: dsRadius["2xl"] },
  /* `gap-3 px-4 py-3.5` */
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  rowIcon: { width: 40, height: 40, borderRadius: dsRadius.xl, alignItems: "center", justifyContent: "center" },
  note: { marginTop: 20 },
  pendingNote: { marginTop: 16, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderRadius: dsRadius.xl },
  pendingText: { lineHeight: 18 },
  readyNote: { marginTop: 16 },
  rating: { marginTop: 20 },
  retry: { height: 36, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, borderRadius: 18 },
  playOverlay: { alignItems: "center", justifyContent: "center" },
  playCircle: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", paddingLeft: 3 },
  controls: { position: "absolute", left: 20, right: 20, bottom: 20, height: 34, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 12, borderRadius: dsRadius.md },
  control: { width: 20, height: 20, alignItems: "center", justifyContent: "center" },
  track: { flex: 1, minWidth: 0, height: 16, justifyContent: "center" },
  trackBar: { height: 4, overflow: "hidden", borderRadius: 2 },
  trackFill: { position: "absolute", top: 0, bottom: 0, left: 0, borderRadius: 2 },
  skeleton: { gap: 20, paddingHorizontal: 16 },
  skeletonHeader: { flexDirection: "row", alignItems: "center", gap: 16 },
  skeletonRound: { width: 44, height: 44, borderRadius: 22 },
  skeletonBar: { width: 160, height: 24, borderRadius: 12 },
  skeletonGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  skeletonCell: { width: "47.5%", height: 64, borderRadius: dsRadius.lg },
});
