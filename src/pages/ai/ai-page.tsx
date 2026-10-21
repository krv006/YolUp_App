import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Sparkles } from "lucide-react-native";
import { useCourses, useSubjects } from "@/modules/course";
import { NotificationBell } from "@/modules/notification";
import { AiQuizCreator, quizDisplayTitle, useQuizzes } from "@/modules/quiz";
import { AppBar, AppBarAction, Icon, radius, Screen, Text, useTheme } from "@/shared/ui";

const WORKSPACE_PATH = "/teacher/workspace";

/**
 * AI — veb `pages/ai/ai-page.tsx` porti: izoh, AI test yaratish formasi va
 * "Mening testlarim" (oxirgi 6 ta qoralama). Telefonda ustun bo'lib keladi.
 */
export function AiPage() {
  const { t } = useTranslation("quiz");
  const { t: tn } = useTranslation("nav");
  const { t: tw } = useTranslation("workspace");
  const router = useRouter();
  const { palette } = useTheme();
  const params = useLocalSearchParams<{ exam?: string }>();
  const subjects = useSubjects();
  const courses = useCourses();
  const quizzes = useQuizzes(null);
  const drafts = (quizzes.data ?? []).filter((quiz) => quiz.status === "draft").slice(0, 6);
  const openQuiz = (quizId: string) => router.push(`/teacher/quizzes?quiz=${quizId}`);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        router.replace(WORKSPACE_PATH);
        return true;
      });
      return () => subscription.remove();
    }, [router])
  );

  return (
    <Screen padded={false}>
      <AppBar title={tn("titles.workspace")} back={{ label: tw("searchBack"), onPress: () => router.replace(WORKSPACE_PATH) }}>
        <AppBarAction name="search" label={tw("searchAria")} onPress={() => router.push("/teacher/search")} />
        <NotificationBell />
      </AppBar>
      <ScrollView style={{ backgroundColor: palette.background }} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <Text variant="label" style={[styles.bodySm, { color: palette["muted-foreground"] }]}>
          {t("aiPage.description")}
        </Text>
        <AiQuizCreator
          subjects={subjects.data ?? []}
          courses={(courses.data ?? []).map((course) => ({ id: course.id, title: course.title }))}
          initialExam={params.exam ?? null}
          onOpenQuiz={openQuiz}
        />

        <View style={styles.aside}>
          <Text variant="body" style={styles.title}>
            {t("aiPage.myTestsTitle")}
          </Text>
          {drafts.length ? (
            drafts.map((quiz) => (
              <View key={quiz.id} style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                <View style={styles.cardHead}>
                  <View style={[styles.cardIcon, { backgroundColor: palette.primary }]}>
                    <Icon name="assign" size={18} color={palette["primary-foreground"]} />
                  </View>
                  <View style={styles.grow}>
                    <Text variant="label" numberOfLines={1}>
                      {quizDisplayTitle(quiz)}
                    </Text>
                    <Text variant="caption" numberOfLines={1} style={{ color: palette["subtle-foreground"] }}>
                      {[quiz.subjectLabel, t("teacherPage.questionCount", { count: quiz.questionCount })].filter(Boolean).join(" · ")}
                    </Text>
                  </View>
                  <View style={[styles.ready, { backgroundColor: palette["success-soft"] }]}>
                    <Text variant="caption" style={[styles.strong, { color: palette["success-strong"] }]}>
                      {t("aiPage.readyBadge")}
                    </Text>
                  </View>
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => openQuiz(quiz.id)}
                  style={({ pressed }) => [styles.open, { backgroundColor: palette["primary-soft"], opacity: pressed ? 0.8 : 1 }]}
                >
                  <Icon name="eye" size={17} color={palette.primary} />
                  <Text variant="label" style={{ color: palette.primary }}>
                    {t("aiPage.openTest")}
                  </Text>
                </Pressable>
              </View>
            ))
          ) : (
            <View style={[styles.empty, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <View style={[styles.emptyIcon, { backgroundColor: palette["saffron-strong"] }]}>
                <Sparkles size={22} color="#ffffff" />
              </View>
              <Text variant="label">{t("aiPage.emptyTitle")}</Text>
              <Text variant="caption" style={[styles.center, { color: palette["subtle-foreground"] }]}>
                {t("aiPage.emptyHint")}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  center: { textAlign: "center", maxWidth: 260 },
  bodySm: { fontWeight: "400" },
  strong: { fontWeight: "600" },
  title: { fontSize: 16, lineHeight: 24, fontWeight: "600" },
  page: { gap: 16, padding: 16 },
  aside: { gap: 12 },
  card: { gap: 12, padding: 16, borderWidth: 1, borderRadius: radius["2xl"] },
  cardHead: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  cardIcon: { width: 40, height: 40, borderRadius: radius.xl, alignItems: "center", justifyContent: "center" },
  ready: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  open: { height: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: radius.xl },
  empty: { alignItems: "center", gap: 8, paddingHorizontal: 24, paddingVertical: 40, borderWidth: 1, borderStyle: "dashed", borderRadius: radius["2xl"] },
  emptyIcon: { width: 48, height: 48, borderRadius: radius.xl, alignItems: "center", justifyContent: "center" },
});
