import { useEffect } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { useKeepAwake } from "expo-keep-awake";
import { ArrowLeft, BookOpen, CalendarDays, Clock3, Star } from "lucide-react-native";
import { useLesson, useLessonRecording } from "@/modules/lesson";
import { formatDateTime } from "@/shared/lib";
import {
  Badge,
  IconButton,
  radius,
  Screen,
  ScreenEmpty,
  ScreenError,
  ScreenLoading,
  Text,
  useTheme,
} from "@/shared/ui";

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
  const { palette } = useTheme();
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();

  const lesson = useLesson(lessonId ?? null);
  const recording = useLessonRecording(lessonId ?? null);

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  if (lesson.isLoading) {
    return (
      <Screen>
        <ScreenLoading label="Dars yuklanmoqda…" />
      </Screen>
    );
  }

  if (lesson.isError || !lesson.data) {
    return (
      <Screen>
        <ScreenError
          message={lesson.error?.message ?? "Darsni topib bo'lmadi"}
          onRetry={() => void lesson.refetch()}
        />
      </Screen>
    );
  }

  const data = lesson.data;

  return (
    <Screen padded={false}>
      <View style={[styles.head, { borderBottomColor: palette.border }]}>
        <IconButton accessibilityLabel="Orqaga" onPress={goBack}>
          <ArrowLeft size={22} color={palette.foreground} />
        </IconButton>
        <Text variant="subheading" numberOfLines={1} style={styles.title}>
          {data.title}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <RecordingPlayer
          status={recording.data?.status}
          ready={Boolean(recording.data?.ready)}
          streamUrl={recording.data?.streamUrl ?? null}
          error={recording.data?.error ?? null}
          loading={recording.isLoading}
        />

        <View style={styles.meta}>
          <MetaItem icon={<BookOpen size={14} color={palette["muted-foreground"]} />} label={data.courseTitle} />
          <MetaItem
            icon={<CalendarDays size={14} color={palette["muted-foreground"]} />}
            label={formatDateTime(data.startsAt)}
          />
          <MetaItem
            icon={<Clock3 size={14} color={palette["muted-foreground"]} />}
            label={`${data.durationMinutes} daqiqa`}
          />
          {data.avgRating !== null ? (
            <MetaItem
              icon={<Star size={14} color={palette.warning} fill={palette.warning} />}
              label={`${data.avgRating.toFixed(1)} (${data.ratingCount})`}
            />
          ) : null}
        </View>

        {data.topic ? (
          <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <Text variant="label">Mavzu</Text>
            <Text tone="muted">{data.topic}</Text>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function RecordingPlayer({
  status,
  ready,
  streamUrl,
  error,
  loading,
}: {
  status?: string;
  ready: boolean;
  streamUrl: string | null;
  error: string | null;
  loading: boolean;
}) {
  const { palette } = useTheme();

  if (loading) return <ScreenLoading label="Yozuv holati tekshirilmoqda…" />;

  if (error || status === "failed") {
    return (
      <View style={[styles.placeholder, { backgroundColor: palette["destructive-soft"] }]}>
        <Text variant="label" style={{ color: palette["destructive-strong"] }}>
          Yozuvni tayyorlab bo'lmadi
        </Text>
        <Text variant="caption" tone="muted" style={styles.placeholderText}>
          {error || "O'qituvchiga murojaat qiling."}
        </Text>
      </View>
    );
  }

  if (!ready || !streamUrl) {
    return (
      <View style={[styles.placeholder, { backgroundColor: palette.muted }]}>
        <Badge
          label={status === "recording" ? "Yozilmoqda" : status === "merging" ? "Tayyorlanmoqda" : "Kutilmoqda"}
          tone="warning"
        />
        <Text variant="caption" tone="muted" style={styles.placeholderText}>
          Dars yozuvi tayyor bo'lgach shu yerda ochiladi. Sahifani yopib
          turishingiz mumkin — holat o'zi yangilanadi.
        </Text>
      </View>
    );
  }

  return <Player streamUrl={streamUrl} />;
}

/**
 * Pleer alohida komponentda: `useVideoPlayer` manba bo'lmaganda ham
 * chaqirilishi kerak emas, hooklar esa shartli chaqirilmaydi.
 */
function Player({ streamUrl }: { streamUrl: string }) {
  // Video ko'rayotganda ekran o'chib qolmasin.
  useKeepAwake();

  const player = useVideoPlayer(streamUrl, (instance) => {
    // Avtomatik boshlanmaydi: mobil internetda foydalanuvchi o'zi qaror qilsin.
    instance.loop = false;
  });

  // Ekrandan chiqilganda ovoz davom etmasin.
  useEffect(() => () => player.pause(), [player]);

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

function MetaItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View style={styles.metaItem}>
      {icon}
      <Text variant="caption" tone="muted">
        {label}
      </Text>
    </View>
  );
}

/** Yozuv o'chirilgan bo'lsa ko'rsatiladi (o'qituvchi o'chirishi mumkin). */
export function RecordingMissing() {
  return (
    <Screen>
      <ScreenEmpty title="Yozuv topilmadi" description="Bu dars uchun yozuv mavjud emas." />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { flex: 1 },
  body: { padding: 16, gap: 16, paddingBottom: 40 },
  video: { width: "100%", aspectRatio: 16 / 9, borderRadius: radius.lg, backgroundColor: "#000" },
  placeholder: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 24,
  },
  placeholderText: { textAlign: "center" },
  meta: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: 14,
    gap: 6,
  },
});
