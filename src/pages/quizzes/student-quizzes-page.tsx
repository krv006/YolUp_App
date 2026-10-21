import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, FileQuestion, History, ListFilter } from "lucide-react-native";
import { useCourses, useSubjects } from "@/modules/course";
import { QuizAttemptSheet, QuizAttemptsSheet, quizDisplayTitle, useQuizzes } from "@/modules/quiz";
import { toIntlLocale } from "@/shared/i18n/intl-locale";
import type { QuizSummary } from "@/shared/types";
import { AppBar, AppBarAction, Screen, ScreenError, ScreenLoading, SelectField, Text, useTheme } from "@/shared/ui";
import { NotificationBell } from "@/modules/notification";

const WORKSPACE_PATH = "/student/workspace";

/*
 * Eski ("portal") uslub o'zgaruvchilari — vebning ishlash paytidagi
 * qiymatlari: `--border` #e2e7ef, `--muted-foreground` #5a6672,
 * `--r-md` 13, `--r-sm` 10, `--primary-soft` #eef2ff.
 */
const LEGACY = { border: "#e2e7ef", muted: "#5a6672" } as const;

/**
 * O'quvchining testlari — veb `pages/student/quizzes/student-quizzes-page.tsx`
 * porti. Vebda bu sahifa hali eski "portal" uslubida (`.portal-page`,
 * `.student-workspace-list`) va telefonda ham aynan shunday ko'rinadi:
 *
 *   "← Orqaga" tugmasi, "BARCHA KURSLAR", katta "Testlar" sarlavhasi,
 *   izoh, fan filtri, ostida kartalar ro'yxati.
 *
 * Kartada to'rt element bir qatorda turadi (ikonka, matn, tarix, "Yechish")
 * va vebda matn ustuni juda tor bo'lib qoladi — bu yerda ham shunday,
 * chunki o'lchamlar aynan vebdagidek.
 *
 * Yechish va tarix — vebdagidek oynalarda (`QuizAttemptSheet`,
 * `QuizAttemptsSheet`), alohida sahifa emas.
 */
export function StudentQuizzesPage() {
  const { t, i18n } = useTranslation("quiz");
  const { t: tn } = useTranslation("nav");
  const { t: tw } = useTranslation("workspace");
  const router = useRouter();
  const { palette } = useTheme();
  const params = useLocalSearchParams<{ quiz?: string }>();
  const highlightId = params.quiz ?? null;

  const courses = useCourses();
  const quizzes = useQuizzes(null);
  const subjects = useSubjects();
  const [subjectFilter, setSubjectFilter] = useState("");
  const [attemptOf, setAttemptOf] = useState<QuizSummary | null>(null);
  const [historyOf, setHistoryOf] = useState<QuizSummary | null>(null);

  // Tizimning "orqaga" tugmasi ham Ish maydoniga qaytaradi (yashirin tab ekrani).
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        router.replace(WORKSPACE_PATH);
        return true;
      });
      return () => subscription.remove();
    }, [router])
  );

  const courseTitleById = useMemo(
    () => new Map((courses.data ?? []).map((course) => [course.id, course.title])),
    [courses.data]
  );

  const appBar = (
    <AppBar
      title={tn("titles.workspace")}
      back={{ label: tw("searchBack"), onPress: () => router.replace(WORKSPACE_PATH) }}
    >
      <AppBarAction name="search" label={tw("searchAria")} onPress={() => router.push("/student/search")} />
      <NotificationBell />
    </AppBar>
  );

  if (quizzes.isLoading) {
    return (
      <Screen padded={false}>
        {appBar}
        <ScreenLoading label={t("studentPage.loading")} />
      </Screen>
    );
  }
  if (quizzes.isError) {
    return (
      <Screen padded={false}>
        {appBar}
        <ScreenError
          message={quizzes.error?.message ?? t("studentPage.loadError")}
          onRetry={() => void quizzes.refetch()}
        />
      </Screen>
    );
  }

  const all = quizzes.data ?? [];
  const list = subjectFilter ? all.filter((item) => item.subject === subjectFilter) : all;
  const filterOptions = [
    { value: "", label: t("teacherPage.allSubjects") },
    ...(subjects.data ?? [])
      .filter((item) => all.some((quiz) => quiz.subject === item.value))
      .map((item) => ({ value: item.value, label: item.label })),
  ];
  const dueFormat = new Intl.DateTimeFormat(toIntlLocale(i18n.language), {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <Screen padded={false}>
      {appBar}

      <ScrollView style={{ backgroundColor: palette.background }} contentContainerStyle={styles.page}>
        {/* `.portal-page-heading` — telefonda ustun, oraliq 20 */}
        <View style={styles.heading}>
          <View>
            <Pressable
              accessibilityRole="link"
              onPress={() => router.replace(WORKSPACE_PATH)}
              style={({ pressed }) => [
                styles.back,
                pressed
                  ? { borderColor: palette.primary, backgroundColor: palette["primary-tint"] }
                  : { borderColor: LEGACY.border },
              ]}
            >
              {({ pressed }) => (
                <>
                  <ArrowLeft size={16} color={pressed ? palette["primary-text"] : LEGACY.muted} />
                  <Text
                    variant="caption"
                    style={[styles.backText, { color: pressed ? palette["primary-text"] : LEGACY.muted }]}
                  >
                    {tw("searchBack")}
                  </Text>
                </>
              )}
            </Pressable>
            <Text variant="caption" style={[styles.eyebrow, { color: palette["primary-text"] }]}>
              {t("studentPage.allCourses")}
            </Text>
            <Text variant="body" style={styles.title}>
              {t("studentPage.title")}
            </Text>
            <Text variant="label" style={[styles.subtitle, { color: LEGACY.muted }]}>
              {t("studentPage.subtitle")}
            </Text>
          </View>
          {filterOptions.length > 1 ? (
            <SelectField
              label={t("teacherPage.subjectFilterLabel")}
              hideLabel
              searchable
              icon={<ListFilter size={17} color={palette["subtle-foreground"]} />}
              value={subjectFilter}
              onChange={setSubjectFilter}
              options={filterOptions}
              style={styles.filter}
            />
          ) : null}
        </View>

        {/* `.student-workspace-list` — bo'shliq 15, oraliq 9 */}
        <View style={styles.list}>
          {list.map((item) => {
            const highlighted = item.id === highlightId;
            return (
              <View
                key={item.id}
                style={[
                  styles.card,
                  highlighted
                    ? { borderColor: palette.primary, boxShadow: `0 0 0 3px ${palette["primary-soft"]}` }
                    : { borderColor: LEGACY.border },
                ]}
              >
                <View style={[styles.icon, { backgroundColor: palette["primary-soft"] }]}>
                  <FileQuestion size={20} color={palette["primary-text"]} />
                </View>
                <View style={styles.text}>
                  <Text variant="label" style={styles.cardTitle}>
                    {quizDisplayTitle(item)}
                  </Text>
                  <Text variant="caption" style={[styles.meta, { color: LEGACY.muted }]}>
                    {courseTitleById.get(item.courseId) ?? t("studentPage.courseFallback")} ·{" "}
                    {item.dueAt
                      ? t("studentPage.dueLabel", { date: dueFormat.format(new Date(item.dueAt)) })
                      : t("studentPage.noDue")}{" "}
                    · {t("studentPage.questionCount", { count: item.questionCount })}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("studentPage.historyAria")}
                  onPress={() => setHistoryOf(item)}
                  style={({ pressed }) => [
                    styles.iconButton,
                    { borderColor: LEGACY.border, backgroundColor: pressed ? palette["primary-soft"] : palette.surface },
                  ]}
                >
                  <History size={16} color={palette.foreground} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setAttemptOf(item)}
                  style={({ pressed }) => [
                    styles.solve,
                    { backgroundColor: pressed ? palette["primary-hover"] : palette.primary },
                  ]}
                >
                  <Text variant="body" style={[styles.solveText, { color: palette["primary-foreground"] }]}>
                    {t("studentPage.solveButton")}
                  </Text>
                </Pressable>
              </View>
            );
          })}
          {!list.length ? (
            <Text variant="label" style={[styles.subtitle, { color: LEGACY.muted }]}>
              {t("studentPage.empty")}
            </Text>
          ) : null}
        </View>
      </ScrollView>

      <QuizAttemptSheet quizId={attemptOf?.id ?? null} open={Boolean(attemptOf)} onClose={() => setAttemptOf(null)} />
      <QuizAttemptsSheet
        quizId={historyOf?.id ?? null}
        open={Boolean(historyOf)}
        onClose={() => setHistoryOf(null)}
        title={historyOf ? t("studentPage.attemptsOfTitle", { title: historyOf.title }) : undefined}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  /* `.portal-page` — telefonda bo'shliq 20 12 38 */
  page: { paddingTop: 20, paddingHorizontal: 12, paddingBottom: 38 },
  heading: { gap: 20, marginBottom: 22, paddingHorizontal: 12 },
  /* `.portal-back-link` — min-h 30, bo'shliq 0 10 0 6, 13/700 */
  back: {
    alignSelf: "flex-start",
    minHeight: 30,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 10,
    paddingLeft: 6,
    paddingRight: 10,
    borderWidth: 1,
    borderRadius: 999,
  },
  backText: { fontSize: 13, lineHeight: 20, fontWeight: "700" },
  /* `.portal-eyebrow` — 12/18/900, oraliq .13em */
  eyebrow: { fontSize: 12, lineHeight: 18, fontWeight: "700", letterSpacing: 1.56 },
  /* `h1` — 28/42, -0.035em, 6 0 chekka */
  title: { marginVertical: 6, fontSize: 28, lineHeight: 42, fontWeight: "400", letterSpacing: -0.98 },
  subtitle: { fontSize: 14, lineHeight: 21, fontWeight: "400" },
  /* `.quiz-subject-filter` — min(260px, 52vw) */
  filter: { width: "56%" },
  list: { gap: 9, padding: 15 },
  /* `article` — bo'shliq 14, chegara 1, radius 13, oraliq 12; telefonda yuqoridan tekislanadi */
  card: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderRadius: 13,
  },
  icon: { width: 41, height: 41, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  text: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: 14, lineHeight: 21, fontWeight: "700" },
  meta: { marginTop: 4, fontSize: 11, lineHeight: 16 },
  iconButton: { width: 44, height: 44, borderWidth: 1, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  /* `.button--primary.button--sm` — min-h 38, 0 13, 15/700, ko'k soya; telefonda chapdan 53 */
  solve: {
    minHeight: 38,
    justifyContent: "center",
    marginLeft: 53,
    paddingHorizontal: 13,
    borderRadius: 10,
    boxShadow: "0 8px 20px rgba(69, 103, 245, 0.2)",
  },
  solveText: { fontSize: 15, lineHeight: 22, fontWeight: "700" },
});
