import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, RefreshControl, StyleSheet, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useFocusEffect, useRouter } from "expo-router";
import { ArrowLeft, FileQuestion, History } from "lucide-react-native";
import { useCourses } from "@/modules/course";
import { useQuizzes } from "@/modules/quiz";
import { formatDayTime } from "@/shared/lib";
import type { QuizSummary } from "@/shared/types";
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
 * Testlar ro'yxati — veb `student-quizzes-page.tsx` / `teacher-quizzes-page.tsx`
 * ning umumiy mobil varianti.
 *
 * Veb'da test DIALOGDA yechilardi. Mobilda dialog yaramaydi: savollar uzun,
 * klaviatura joy egallaydi va foydalanuvchi tasodifan tashqariga bosib
 * javoblarini yo'qotishi mumkin. Shuning uchun yechish — TO'LIQ EKRAN
 * marshruti (`quizzes/<id>`), orqaga qaytish esa aniq harakat.
 */
export function QuizzesPage({ basePath }: { basePath: string }) {
  /*
   * `basePath` — `/teacher/quizzes` yoki `/student/quizzes`. Ish maydoni
   * shu bo'limning yonida turadi, ya'ni oxirgi segmentni almashtirish
   * yetarli; rolni alohida tekshirish shart emas.
   */
  const workspacePath = basePath.replace(/\/quizzes$/, "/workspace");

  const { t } = useTranslation("mobile");
  const router = useRouter();
  const { palette } = useTheme();
  const quizzes = useQuizzes(null);

  /*
   * TIZIMNING "orqaga" tugmasi ham Ish maydoniga qaytaradi.
   *
   * Usiz u tab navigatorining standart xatti-harakatini bajarardi —
   * BIRINCHI tabga (Suhbatlar) o'tardi. Ilova yopilmasdi, lekin bitta
   * ekranda ikki xil "orqaga" ikki xil joyga olib borardi.
   *
   * `useFocusEffect` SHART: ishlovchi faqat shu ekran ochiq turganda
   * faol bo'lishi kerak, aks holda u boshqa ekranlarning "orqaga"sini
   * ham o'g'irlardi.
   */
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        router.replace(workspacePath);
        return true; // hodisa shu yerda tugaydi
      });
      return () => subscription.remove();
    }, [router, workspacePath])
  );

  const courses = useCourses();

  const courseTitleById = useMemo(
    () => new Map((courses.data ?? []).map((course) => [course.id, course.title])),
    [courses.data]
  );

  if (quizzes.isLoading) {
    return (
      <Screen>
        <ScreenLoading label={t("quizzes.testlar_yuklanmoqda")} />
      </Screen>
    );
  }

  if (quizzes.isError) {
    return (
      <Screen>
        <ScreenError
          message={quizzes.error?.message ?? "Testlarni yuklab bo'lmadi"}
          onRetry={() => void quizzes.refetch()}
        />
      </Screen>
    );
  }

  const list = quizzes.data ?? [];

  return (
    <Screen padded={false}>
      <View style={[styles.head, { borderBottomColor: palette.border }]}>
        {/*
          * Orqaga qaytish — ANIQ MANZILGA, `router.back()` bilan EMAS.
          *
          * ┌─ NIMA BUZILGAN EDI ─────────────────────────────────────────┐
          * │ Testlar marshruti tab navigatoridagi yashirin EKRAN         │
          * │ (`href: null`), Ish maydonidan unga o'tish esa stack'ga     │
          * │ yangi qatlam qo'ymaydi — u YONMA-YON ekranga almashish.     │
          * │                                                             │
          * │ Shuning uchun `router.back()` tab navigatoridan butunlay    │
          * │ chiqib ketardi va ILOVA YOPILARDI: foydalanuvchi Ish        │
          * │ maydoniga qaytish o'rniga bosh ekranga tashlanardi.         │
          * │                                                             │
          * │ Ish maydoni — bu sahifaning yagona kirish nuqtasi, shuning  │
          * │ uchun qayerga qaytishni taxmin qilish shart emas.           │
          * └─────────────────────────────────────────────────────────────┘
          */}
        <View style={styles.headTop}>
          <IconButton
            accessibilityLabel={t("shared.orqaga")}
            onPress={() => router.replace(workspacePath)}
          >
            <ArrowLeft size={20} color={palette["muted-foreground"]} />
          </IconButton>
          <Text variant="heading">Testlar</Text>
        </View>
        <Text variant="caption" tone="muted">
          {t("quizzes.vaqt_chegarasi_yoq_cheklanmagan_qayta_urinis")}
        </Text>
      </View>

      {list.length === 0 ? (
        <ScreenEmpty
          title={t("quizzes.hali_test_yoq")}
          description={t("quizzes.oqituvchi_test_qoshganda_shu_yerda_korinadi")}
        />
      ) : (
        <FlashList
          data={list}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={quizzes.isRefetching}
              onRefresh={() => void quizzes.refetch()}
              tintColor={palette["muted-foreground"]}
            />
          }
          renderItem={({ item }) => (
            <QuizRow
              quiz={item}
              courseTitle={courseTitleById.get(item.courseId) ?? "Kurs"}
              onOpen={() => router.push(`${basePath}/${item.id}`)}
              onHistory={() => router.push(`${basePath}/${item.id}?tab=history`)}
            />
          )}
        />
      )}

    </Screen>
  );
}

function QuizRow({
  quiz,
  courseTitle,
  onOpen,
  onHistory,
}: {
  quiz: QuizSummary;
  courseTitle: string;
  onOpen: () => void;
  onHistory: () => void;
}) {
  const { t } = useTranslation("mobile");
  const { palette } = useTheme();
  const overdue = quiz.dueAt ? new Date(quiz.dueAt) < new Date() : false;

  return (
    <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
      <View style={styles.cardHead}>
        <View style={[styles.icon, { backgroundColor: palette["primary-tint"] }]}>
          <FileQuestion size={20} color={palette["primary-text"]} />
        </View>
        <View style={styles.cardBody}>
          <Text variant="label" numberOfLines={2}>
            {quiz.title}
          </Text>
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {courseTitle} · {quiz.questionCount} ta savol
          </Text>
        </View>
        <IconButton accessibilityLabel={t("quizzes.urinishlar_tarixi")} onPress={onHistory}>
          <History size={18} color={palette["muted-foreground"]} />
        </IconButton>

      </View>

      <View style={styles.cardFoot}>
        {/*
          * Qoralama belgisi MUDDATDAN muhimroq: qoralama test o'quvchilarga
          * umuman ko'rinmaydi, shuning uchun o'qituvchi buni birinchi
          * ko'rishi kerak. Import qilingan testlar aynan shunday keladi.
          */}
        {quiz.status === "draft" ? <Badge label={t("quizzes.qoralama")} tone="warning" /> : null}

        {quiz.dueAt ? (
          <Badge
            label={`Muddat: ${formatDayTime(quiz.dueAt)}`}
            tone={overdue ? "danger" : "neutral"}
          />
        ) : (
          <Badge label={t("quizzes.muddat_yoq")} tone="neutral" />
        )}

        <Text
          accessibilityRole="button"
          onPress={onOpen}
          variant="label"
          tone="brand"
          style={styles.solve}
        >
          Yechish
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headTop: { flexDirection: "row", alignItems: "center", gap: 6, marginLeft: -8 },
  head: {
    gap: 4,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  list: { padding: 16 },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: 14,
    gap: 12,
    marginBottom: 12,
  },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardBody: { flex: 1, gap: 3 },
  icon: { width: 40, height: 40, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
  cardFoot: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  solve: { paddingVertical: 8, paddingHorizontal: 4 },
});
