import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useMyAnalytics } from "@/modules/analytics";
import { formatDateTime } from "@/shared/lib";
import type { StudentAnalytics, TeacherAnalytics } from "@/shared/types";
import {
  IconButton,
  radius,
  Screen,
  ScreenError,
  ScreenHeader,
  ScreenLoading,
  Text,
  useTheme,
} from "@/shared/ui";

/**
 * Shaxsiy tahlil — veb `pages/workspace/analytics-page.tsx` porti.
 *
 * Backend rolga qarab IKKI XIL javob qaytaradi va uni `mapMyAnalytics`
 * ajratadi (`kind: "student" | "teacher"`), shuning uchun bu sahifa
 * ikkalasiga ham xizmat qiladi — veb ham shunday qiladi.
 *
 * 🟡 MOSLASH: vebda o'qituvchi ma'lumoti JADVALDA (`analytics-table`)
 * ko'rsatiladi — olti ustun. Telefonda jadval o'qilmaydi (gorizontal
 * aylantirish kerak bo'lardi), shuning uchun har kurs KARTOCHKAGA
 * aylandi va ko'rsatkichlar ikki ustunli to'rda turadi.
 */

/** `—` bo'sh qiymat uchun: veb `percent()` bilan bir xil. */
function percent(value: number | null): string {
  return value === null ? "—" : `${value.toFixed(1)}%`;
}

function rating(value: number | null): string {
  return value === null ? "—" : value.toFixed(1);
}

function StatCard({ value, label }: { value: string; label: string }) {
  const { palette } = useTheme();
  return (
    <View style={[styles.stat, { backgroundColor: palette.card, borderColor: palette.border }]}>
      <Text variant="title" numberOfLines={1}>
        {value}
      </Text>
      <Text variant="caption" tone="muted">
        {label}
      </Text>
    </View>
  );
}

function StudentView({ data }: { data: StudentAnalytics }) {
  const { t } = useTranslation("mobile");
  const { palette } = useTheme();

  return (
    <>
      <View style={styles.statGrid}>
        <StatCard value={String(data.attemptCount)} label={t("analytics.urinishlar")} />
        <StatCard value={percent(data.avgPercentage)} label={t("analytics.ortacha_natija")} />
      </View>

      <Text variant="label">So&apos;nggi urinishlar</Text>

      {data.recentAttempts.length === 0 ? (
        <Text variant="caption" tone="muted">
          {t("analytics.hali_test_yechilmagan")}
        </Text>
      ) : (
        data.recentAttempts.map((item) => (
          <View
            key={`${item.quizId}-${item.takenAt}`}
            style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}
          >
            <View style={styles.cardHead}>
              <View style={styles.cardTitle}>
                <Text variant="label" numberOfLines={2}>
                  {item.quizTitle}
                </Text>
                <Text variant="caption" tone="muted" numberOfLines={1}>
                  {item.courseTitle}
                </Text>
              </View>
              <Text variant="label" tone="brand">
                {percent(item.percentage)}
              </Text>
            </View>

            <View style={styles.cardFoot}>
              <Text variant="caption" tone="muted">
                {item.score}/{item.maxScore} ball
              </Text>
              {item.takenAt ? (
                <Text variant="caption" tone="muted">
                  {formatDateTime(item.takenAt)}
                </Text>
              ) : null}
            </View>
          </View>
        ))
      )}
    </>
  );
}

function TeacherView({ data }: { data: TeacherAnalytics }) {
  const { t } = useTranslation("mobile");
  const { palette } = useTheme();
  const { overall } = data;

  return (
    <>
      <View style={styles.statGrid}>
        <StatCard value={rating(overall.avgRating)} label={t("analytics.ortacha_baho")} />
        <StatCard value={String(overall.ratingCount)} label={t("analytics.baholar_soni")} />
        <StatCard value={String(overall.courseCount)} label={t("analytics.kurslar")} />
        <StatCard value={String(overall.studentCount)} label={t("analytics.oquvchilar")} />
        <StatCard value={String(overall.lessonsFinished)} label={t("analytics.otilgan_darslar")} />
        <StatCard value={percent(overall.reliability)} label={t("analytics.ishonchlilik")} />
      </View>

      <Text variant="label">Kurslar bo&apos;yicha</Text>

      {data.courses.length === 0 ? (
        <Text variant="caption" tone="muted">
          {t("analytics.kurs_topilmadi")}
        </Text>
      ) : (
        data.courses.map((course) => (
          <View
            key={course.courseId}
            style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}
          >
            <Text variant="label" numberOfLines={2}>
              {course.courseTitle}
            </Text>

            {/*
              * Vebda bular jadval ustunlari. Telefonda jadval o'qilmaydi,
              * shuning uchun "nom — qiymat" juftliklari ikki ustunda.
              */}
            <View style={styles.metrics}>
              <Metric label={t("analytics.oquvchilar")} value={course.studentCount?.toString() ?? "—"} />
              <Metric label={t("analytics.ortacha_baho")} value={rating(course.avgRating)} />
              <Metric label={t("analytics.test_ortachasi")} value={percent(course.quizAvgPercentage)} />
              <Metric label={t("analytics.davomat")} value={percent(course.attendanceRate)} />
              <Metric label={t("analytics.ishonchlilik")} value={percent(course.reliability)} />
            </View>
          </View>
        ))
      )}
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text variant="caption" tone="muted">
        {label}
      </Text>
      <Text variant="label">{value}</Text>
    </View>
  );
}

export function AnalyticsPage() {
  const { t } = useTranslation("mobile");
  const { palette } = useTheme();
  const router = useRouter();
  const analytics = useMyAnalytics();

  /*
   * Orqaga tugmasi ATAYLAB bor: sahifa profil ichidan ochiladi va
   * tab qatoriga kirmaydi, ya'ni tizim tugmasidan boshqa chiqish yo'li
   * yo'q edi.
   */
  const back = (
    <IconButton accessibilityLabel={t("analytics.orqaga")} onPress={() => router.back()}>
      <ArrowLeft size={20} color={palette["muted-foreground"]} />
    </IconButton>
  );

  if (analytics.isLoading) {
    return (
      <Screen>
        <ScreenHeader title={t("analytics.tahlil")} leading={back} />
        <ScreenLoading label={t("analytics.tahlil_yuklanmoqda")} />
      </Screen>
    );
  }

  if (analytics.isError || !analytics.data) {
    return (
      <Screen>
        <ScreenHeader title={t("analytics.tahlil")} leading={back} />
        <ScreenError
          message={analytics.error?.message ?? "Tahlilni yuklab bo'lmadi"}
          onRetry={() => void analytics.refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={
          <RefreshControl
            refreshing={analytics.isRefetching}
            onRefresh={() => void analytics.refetch()}
            tintColor={palette["muted-foreground"]}
          />
        }
      >
        <ScreenHeader
          title={t("analytics.tahlil")}
          subtitle={t("analytics.natijalaringiz_va_korsatkichlaringiz")}
          leading={back}
        />

        {analytics.data.kind === "student" ? (
          <StudentView data={analytics.data} />
        ) : (
          <TeacherView data={analytics.data} />
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { gap: 12, padding: 20 },
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  stat: {
    /*
     * Ikki ustun, uch emas: "100.0%" kabi qiymat uch ustunda sig'masdan
     * ikki qatorga bo'linib ketardi va kartochkalar turli balandlikda
     * chiqardi.
     */
    flexGrow: 1,
    flexBasis: "45%",
    gap: 2,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  card: {
    gap: 8,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardHead: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  cardTitle: { flex: 1, gap: 2 },
  cardFoot: { flexDirection: "row", justifyContent: "space-between" },
  metrics: { flexDirection: "row", flexWrap: "wrap", rowGap: 8 },
  metric: { width: "50%", gap: 2 },
});
