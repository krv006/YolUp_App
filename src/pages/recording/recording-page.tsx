import { useState } from "react";
import { useEvent } from "expo";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useVideoPlayer, VideoView } from "expo-video";
import { useKeepAwake } from "expo-keep-awake";
import { ArrowLeft, CalendarDays, Clock3, PenLine, ShieldCheck, Trash2, TriangleAlert, Users, VideoOff } from "lucide-react-native";
import { useAuth } from "@/modules/auth";
import { LessonRatingForm, useDeleteRecording, useLesson, useLessonRecording } from "@/modules/lesson";
import { ROLES } from "@/shared/constants";
import { formatDateTime } from "@/shared/lib";
import type { Lesson } from "@/shared/types";
import {
  Badge,
  Button,
  ConfirmSheet,
  radius,
  Screen,
  ScreenEmpty,
  ScreenLoading,
  Text,
  ThemeScope,
  useTheme,
} from "@/shared/ui";
import { LiveRoomState } from "@/widgets/live-room/live-room-state";

/**
 * Dars yozuvi — veb `recording-page.tsx` porti.
 *
 * Dars tugagach backend kurs chatiga `.../recordings/<lesson_id>` havolasini
 * yuboradi (docs/PROJECT.md §10) va u AYNAN shu ekranga tushadi — mobil
 * marshrutlar veb bilan bir xil saqlangani uchun (MOBILE_PLAN §6.1).
 *
 * `stream_url` — 3 soatlik IMZOLANGAN havola, doimiy emas. Shuning uchun
 * `useLessonRecording` uni `staleTime: 0` bilan so'raydi va biz uni
 * keshlamaymiz: eskirgan URL bilan pleer ochilsa video umuman yuklanmaydi.
 */
export function RecordingPage() {
  const router = useRouter();
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const lesson = useLesson(lessonId ?? null);

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  if (lesson.isLoading || (!lesson.isError && !lesson.data))
    return (
      <ThemeScope scheme="dark">
        <Screen>
          <ScreenLoading label="Dars yuklanmoqda" />
        </Screen>
      </ThemeScope>
    );

  if (lesson.isError || !lesson.data)
    return (
      <LiveRoomState
        title="Darsni topib bo‘lmadi"
        description={lesson.error?.message}
        actionLabel="Qayta urinish"
        onAction={() => void lesson.refetch()}
        onBack={goBack}
      />
    );

  return (
    <ThemeScope scheme="dark">
      <RecordingBody lesson={lesson.data} onBack={goBack} />
    </ThemeScope>
  );
}

/**
 * Vebning tor ekran (`isCompact`) ko'rinishi: qorong'i fon, "Dars yozuvi"
 * sarlavhasi, ma'lumot chiplari, pleer va uning ostida nom, "Faqat
 * platformada ochiladi" va o'chirish; o'quvchiga baholash formasi.
 */
function RecordingBody({ lesson: data, onBack }: { lesson: Lesson; onBack: () => void }) {
  const { t } = useTranslation("lesson");
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const recording = useLessonRecording(data.id);
  const removeRecording = useDeleteRecording();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isStudent = user?.role === ROLES.STUDENT;
  const canDelete = user?.role === ROLES.TEACHER;
  const current = recording.data;
  const stamp = current?.endedAt ?? current?.createdAt ?? null;

  const chips: Array<{ icon: React.ReactNode; label: string }> = [
    { icon: <Users size={14} color={palette["muted-foreground"]} />, label: data.courseTitle },
    { icon: <CalendarDays size={14} color={palette["muted-foreground"]} />, label: data.date },
    { icon: <Clock3 size={14} color={palette["muted-foreground"]} />, label: `${data.time} · ${data.durationMinutes} daqiqa` },
  ];

  return (
    <ScrollView
      style={{ backgroundColor: palette.background }}
      contentContainerStyle={[styles.page, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}
    >
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Orqaga" onPress={onBack} style={styles.back}>
          <ArrowLeft size={22} color={palette.foreground} />
        </Pressable>
        <Text variant="body" style={styles.heading}>
          Dars yozuvi
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chips}>
        {chips.map((chip) => (
          <View key={chip.label} style={[styles.chip, { backgroundColor: palette["surface-subtle"] }]}>
            {chip.icon}
            <Text variant="caption" style={[styles.strong, { color: palette["muted-foreground"] }]}>
              {chip.label}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.content}>
        {recording.isLoading ? (
          <ScreenLoading label="Yozuv yuklanmoqda" />
        ) : recording.isError ? (
          <RecordingState tone="error" icon={<TriangleAlert size={28} color={palette["destructive-strong"]} />} text={recording.error?.message ?? t("recording.failed")} />
        ) : !current ? (
          <RecordingState icon={<VideoOff size={28} color={palette["primary-text"]} />} text={t("recording.none")} />
        ) : current.status === "failed" ? (
          <RecordingState tone="error" icon={<TriangleAlert size={28} color={palette["destructive-strong"]} />} text={current.error || t("recording.failed")} />
        ) : !current.ready || !current.streamUrl ? (
          <RecordingState
            icon={<ActivityIndicator size="small" color={palette["primary-text"]} />}
            text={
              current.status === "recording"
                ? t("recording.recording")
                : current.status === "merging"
                  ? t("recording.merging")
                  : t("recording.preparing")
            }
          />
        ) : (
          <View style={styles.player}>
            <Player streamUrl={current.streamUrl} />
            {/* Dars statistikasi — server bersa: ishtirokchilar, davomat, doska sahifalari. */}
            {current.participantsCount !== null || current.attendanceRate !== null || current.boardPages !== null ? (
              <View style={styles.stats}>
                {current.participantsCount !== null ? (
                  <StatChip icon={Users} label={t("recording.participants", { count: current.participantsCount })} />
                ) : null}
                {current.attendanceRate !== null ? (
                  <StatChip icon={ShieldCheck} label={t("recording.attendanceRate", { value: current.attendanceRate })} />
                ) : null}
                {current.boardPages !== null ? (
                  <StatChip icon={PenLine} label={t("recording.boardPages", { count: current.boardPages })} />
                ) : null}
              </View>
            ) : null}
            {/* `.recording-meta` */}
            <View style={styles.meta}>
              <View style={styles.metaText}>
                <Text variant="body" style={styles.metaTitle}>
                  {current.title}
                </Text>
                <View style={styles.metaNote}>
                  <ShieldCheck size={13} color={palette["muted-foreground"]} />
                  <Text variant="caption" style={{ color: palette["muted-foreground"] }}>
                    {t("recording.platformOnly")}
                    {stamp ? ` · ${formatDateTime(stamp)}` : ""}
                  </Text>
                </View>
              </View>
              {canDelete ? (
                <ThemeScope scheme="light">
                  <DeleteButton label={t("recording.delete")} onPress={() => setConfirmOpen(true)} />
                </ThemeScope>
              ) : null}
            </View>
          </View>
        )}

        {isStudent ? (
          <ThemeScope scheme={null}>
            <View style={[styles.ratingCard, { backgroundColor: palette.surface }]}>
              <LessonRatingForm lesson={data} currentUserId={user?.id} />
            </View>
          </ThemeScope>
        ) : null}
      </View>

      <ThemeScope scheme={null}>
        <ConfirmSheet
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          title={t("recording.deleteDialogTitle")}
          description={t("recording.deleteDialogDescription")}
          confirmLabel={t("recording.delete")}
          cancelLabel={t("recording.cancel")}
          loading={removeRecording.isPending}
          onConfirm={() => removeRecording.mutate(data.id, { onSuccess: () => setConfirmOpen(false) })}
        />
      </ThemeScope>
    </ScrollView>
  );
}

/** `.recording-state` — yozuv yo'q / tayyorlanmoqda / xato holati. */
function RecordingState({ icon, text, tone = "info" }: { icon: React.ReactNode; text: string; tone?: "info" | "error" }) {
  const { palette } = useTheme();
  const error = tone === "error";
  return (
    <View
      style={[
        styles.state,
        error
          ? { borderColor: palette["destructive-soft-border"], backgroundColor: palette["destructive-soft"] }
          : { borderColor: palette["border-accent"], backgroundColor: palette["surface-subtle"] },
      ]}
    >
      {icon}
      <Text variant="label" style={[styles.stateText, { color: palette["muted-foreground"] }]}>
        {text}
      </Text>
    </View>
  );
}

/** Veb `Button variant="secondary"`: oq, chegarali. */
function DeleteButton({ label, onPress }: { label: string; onPress: () => void }) {
  const { palette } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.delete,
        { borderColor: palette.border, backgroundColor: pressed ? palette["surface-subtle"] : palette.surface },
      ]}
    >
      <Trash2 size={16} color={palette.foreground} />
      <Text variant="label">{label}</Text>
    </Pressable>
  );
}

/**
 * Pleer alohida komponentda: `useVideoPlayer` manba bo'lmaganda ham
 * chaqirilishi kerak emas, hooklar esa shartli chaqirilmaydi.
 */
function Player({ streamUrl }: { streamUrl: string }) {
  // Video ko'rayotganda ekran o'chib qolmasin.
  useKeepAwake();

  const { t } = useTranslation("mobile");
  const { palette } = useTheme();

  const player = useVideoPlayer(streamUrl, (instance) => {
    // Avtomatik boshlanmaydi: mobil internetda foydalanuvchi o'zi qaror qilsin.
    instance.loop = false;
  });

  /*
   * IJRO XATOSI — ALOHIDA HOLAT.
   *
   * ┌─ NEGA KERAK ──────────────────────────────────────────────────────────┐
   * │ Backend dars yozuvini avval WebM sifatida beradi va MP4 nusxani       │
   * │ FONDA tayyorlaydi (`docs/BACKEND-IOS.md`). 45 daqiqalik dars uchun bu │
   * │ 15–30 daqiqa, eski yozuvlarda esa navbat bo'lgani uchun ko'proq ham   │
   * │ bo'lishi mumkin.                                                       │
   * │                                                                        │
   * │ iOS WebM'ni umuman ocholmaydi (AVFoundation'da dekoder yo'q). Usiz    │
   * │ foydalanuvchi QORA EKRAN ko'rardi va nima bo'layotganini bilmasdi.     │
   * │                                                                        │
   * │ Xato Android'da ham chiqishi mumkin — masalan internet uzilsa —       │
   * │ shuning uchun xabar platformaga bog'lanmagan va qayta urinish         │
   * │ tugmasi bor.                                                           │
   * └────────────────────────────────────────────────────────────────────────┘
   */
  const { status } = useEvent(player, "statusChange", { status: player.status });

  if (status === "error") {
    return (
      <View style={[styles.placeholder, { backgroundColor: palette.muted }]}>
        <Badge label={t("recording.tayyorlanmoqda")} tone="warning" />
        <Text variant="caption" tone="muted" style={styles.placeholderText}>
          {t("recording.yozuvni_ochib_bolmadi_hali_tayyorlanayotgan")}
        </Text>
        <Button
          title={t("recording.qayta_urinish")}
          variant="secondary"
          onPress={() => player.replace(streamUrl)}
        />
      </View>
    );
  }

  /*
   * PLEER QO'LDA TO'XTATILMAYDI.
   *
   * ┌─ NIMA BUZILGAN EDI ───────────────────────────────────────────────────┐
   * │ Bu yerda `useEffect(() => () => player.pause(), [player])` turardi —  │
   * │ "ekrandan chiqilganda ovoz davom etmasin" degan niyatda.              │
   * │                                                                       │
   * │ `useVideoPlayer` pleerni unmount'da O'ZI bo'shatadi. Tozalash esa     │
   * │ bo'shatishdan keyin ishga tushib, allaqachon yo'q obyektga murojaat   │
   * │ qilardi:                                                              │
   * │                                                                       │
   * │   Call to function 'VideoPlayer.pause' has been rejected.             │
   * │   → Cannot use shared object that was already released                │
   * │                                                                       │
   * │ Natijada YOZUVI BOR darsdan orqaga qaytilganda ilova yiqilardi.       │
   * │ Yozuvi yo'q darsda pleer umuman mount bo'lmagani uchun sezilmasdi —   │
   * │ shuning uchun xato uzoq vaqt ko'zga tashlanmadi.                      │
   * │                                                                       │
   * │ Pleer bo'shatilganda ovoz ham to'xtaydi, ya'ni qo'lda `pause()`       │
   * │ umuman kerak emas edi.                                                │
   * └───────────────────────────────────────────────────────────────────────┘
   */

  return (
    <VideoView
      style={styles.video}
      player={player}
      // expo-video 57: to'liq ekran `fullscreenOptions` orqali boshqariladi.
      fullscreenOptions={{ enable: true }}
      allowsPictureInPicture
      contentFit="contain"
    />
  );
}

/** Yozuv o'chirilgan bo'lsa ko'rsatiladi (o'qituvchi o'chirishi mumkin). */
export function RecordingMissing() {
  const { t } = useTranslation("mobile");
  return (
    <Screen>
      <ScreenEmpty title={t("recording.yozuv_topilmadi")} description={t("recording.bu_dars_uchun_yozuv_mavjud_emas")} />
    </Screen>
  );
}

function StatChip({ icon: IconComponent, label }: { icon: typeof Users; label: string }) {
  const { palette } = useTheme();
  return (
    <View style={[styles.chip, { backgroundColor: palette["surface-subtle"] }]}>
      <IconComponent size={14} color={palette["muted-foreground"]} />
      <Text variant="caption" style={[styles.strong, { color: palette["muted-foreground"] }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  strong: { fontWeight: "600" },
  /* `px-4 pt-3 pb-6` */
  page: { flexGrow: 1, paddingHorizontal: 16 },
  header: { height: 44, flexDirection: "row", alignItems: "center", gap: 8 },
  back: { marginLeft: -8, width: 40, height: 40, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  heading: { fontFamily: "Unbounded-SemiBold", fontWeight: "600" },
  chipsScroll: { marginRight: -16, flexGrow: 0 },
  /* `gap-2 py-3 pr-4` */
  chips: { gap: 8, paddingVertical: 12, paddingRight: 16 },
  chip: { height: 36, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, borderRadius: radius.full },
  content: { gap: 16 },
  /* `.recording-player` gap 14 */
  player: { gap: 14 },
  video: { width: "100%", aspectRatio: 16 / 9, borderRadius: radius.lg, backgroundColor: "#000" },
  placeholder: { width: "100%", aspectRatio: 16 / 9, borderRadius: radius.lg, alignItems: "center", justifyContent: "center", gap: 10, padding: 24 },
  placeholderText: { textAlign: "center" },
  /* `flex flex-wrap items-center gap-2 px-1` */
  stats: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8, paddingHorizontal: 4 },
  meta: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 14 },
  metaText: { gap: 3 },
  metaTitle: { fontWeight: "700" },
  metaNote: { flexDirection: "row", alignItems: "center", gap: 5 },
  delete: { height: 44, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 18, borderWidth: 1, borderRadius: 13 },
  /* `.recording-state` */
  state: { minHeight: 260, padding: 30, borderWidth: 1, borderStyle: "dashed", borderRadius: radius.lg, alignItems: "center", justifyContent: "center", gap: 10 },
  stateText: { maxWidth: 380, textAlign: "center", fontWeight: "400" },
  ratingCard: { padding: 16, borderRadius: radius["2xl"] },
});
