import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { quizDisplayTitle, useStartQuiz } from "@/modules/quiz";
import { ROUTES } from "@/shared/config";
import type { QuizDetail } from "@/shared/types";
import {
  DsGradient,
  DsText,
  dsRadius,
  Icon,
  MobileActionBar,
  MobileButton,
  MobileEmptyCard,
  MobilePageHeader,
  useDs,
  type IconName,
} from "@/shared/ui";

/** Testlar ro'yxatiga qaytish (vebda `navigate(ROUTES.student.tests)`). */
function useBackToTests() {
  const router = useRouter();
  return () => (router.canGoBack() ? router.back() : router.replace(ROUTES.student.tests as never));
}

/**
 * Vaqtli test boshlash ekrani — veb `student-test-gate.tsx` `TestStartScreen`
 * (tor ekran): vaqt, qolgan urinishlar, shu urinishga tushadigan savollar soni
 * (`question_count`) va "vaqt to'xtamaydi" ogohlantirishi; "Boshlash"
 * `POST /quizzes/{id}/start/` ni chaqiradi — keyin test qayta yuklanadi.
 */
export function TestStartScreen({ quiz, meta }: { quiz: QuizDetail; meta: string }) {
  const { t } = useTranslation("student");
  const ds = useDs();
  const insets = useSafeAreaInsets();
  const start = useStartQuiz();
  const back = useBackToTests();
  const rows = [
    quiz.timeLimitMinutes
      ? {
          id: "time",
          icon: "timer" as IconName,
          text: t("workspace.player.start.time", { count: quiz.timeLimitMinutes }),
        }
      : null,
    quiz.maxAttempts
      ? {
          id: "attempts",
          icon: "refresh" as IconName,
          text: t("workspace.player.start.attempts", {
            left: quiz.attemptsLeft ?? quiz.maxAttempts,
            total: quiz.maxAttempts,
          }),
        }
      : null,
    quiz.questionCount
      ? {
          id: "questions",
          icon: "quiz" as IconName,
          text: t("workspace.player.start.questions", { count: quiz.questionCount }),
        }
      : null,
  ].filter((row) => row !== null);

  return (
    <View style={[styles.fill, { backgroundColor: ds.c.canvas }]}>
      <ScrollView
        style={styles.fill}
        contentContainerStyle={[styles.page, { paddingTop: insets.top + 20 }]}
      >
        <DsGradient name="auth" />
        <MobilePageHeader
          title={t("workspace.player.start.title")}
          backLabel={t("workspace.back")}
          onBack={back}
        />
        {/* `items-center gap-4 rounded-2xl bg-surface px-6 py-7 text-center` */}
        <View style={[styles.card, { backgroundColor: ds.c.surface }]}>
          <View style={[styles.badge, { backgroundColor: ds.c["accent-violet-bg"] }]}>
            <Icon name="quiz" size={28} color={ds.c["accent-violet-fg"]} />
          </View>
          <View style={styles.heading}>
            <DsText v="h3" heading style={styles.center}>
              {quizDisplayTitle(quiz)}
            </DsText>
            {meta ? (
              <DsText v="body-sm" c="ink-secondary" numberOfLines={1} style={styles.center}>
                {meta}
              </DsText>
            ) : null}
          </View>
          <View style={styles.rows}>
            {rows.map((row) => (
              <View key={row.id} style={[styles.row, { backgroundColor: ds.c.subtle }]}>
                <Icon name={row.icon} size={20} color={ds.c.brand} />
                <DsText style={styles.grow}>{row.text}</DsText>
              </View>
            ))}
          </View>
          {quiz.timeLimitMinutes ? (
            <View style={[styles.note, { backgroundColor: ds.c["warning-bg"] }]}>
              <View style={styles.noteIcon}>
                <Icon name="warning" size={18} color={ds.c["warning-fg"]} />
              </View>
              <DsText v="body-sm" c="warning-fg" style={styles.grow}>
                {t("workspace.player.start.note")}
              </DsText>
            </View>
          ) : null}
        </View>
      </ScrollView>
      <MobileActionBar>
        <MobileButton variant="secondary" label={t("workspace.back")} onPress={back} />
        <MobileButton
          label={
            start.isPending
              ? t("workspace.player.start.starting")
              : t("workspace.player.start.action")
          }
          disabled={start.isPending}
          onPress={() => start.mutate(quiz.id)}
        />
      </MobileActionBar>
    </View>
  );
}

/**
 * Urinishlar tugagan — veb `TestAttemptsOver`: qulf belgili karta,
 * "Natijani ko'rish" va ostida "Testlarga qaytish".
 */
export function TestAttemptsOver({ quiz }: { quiz: QuizDetail }) {
  const { t } = useTranslation("student");
  const ds = useDs();
  const router = useRouter();
  const back = useBackToTests();
  return (
    <View style={[styles.over, { backgroundColor: ds.c.canvas }]}>
      <MobileEmptyCard
        icon="lock"
        title={t("workspace.player.over.title")}
        description={t("workspace.player.over.text", {
          count: quiz.attemptsUsed ?? quiz.maxAttempts ?? 0,
        })}
        action={{
          label: t("workspace.player.over.results"),
          onPress: () => router.push(ROUTES.student.testResults(quiz.id) as never),
        }}
      />
      <Pressable
        accessibilityRole="button"
        onPress={back}
        style={({ pressed }) => [
          styles.overBack,
          pressed && { backgroundColor: ds.c["brand-subtle"] },
        ]}
      >
        <Icon name="arrow-back" size={18} color={ds.c.brand} />
        <DsText v="button" c="brand">
          {t("workspace.player.over.back")}
        </DsText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  center: { textAlign: "center" },
  /* `gap-5 px-4 pt-5 pb-6` */
  page: { gap: 20, paddingHorizontal: 16, paddingBottom: 24 },
  card: {
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 24,
    paddingVertical: 28,
    borderRadius: dsRadius["2xl"],
  },
  /* `size-16 rounded-full` */
  badge: {
    width: 64,
    height: 64,
    borderRadius: dsRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  heading: { maxWidth: "100%", gap: 4 },
  rows: { alignSelf: "stretch", gap: 8 },
  /* `min-h-12 gap-3 rounded-xl px-4 py-2.5` */
  row: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: dsRadius.xl,
  },
  /* `items-start gap-2 rounded-xl px-4 py-3` */
  note: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: dsRadius.xl,
  },
  noteIcon: { marginTop: 2 },
  /* `grid place-items-center p-6` */
  over: { flex: 1, justifyContent: "center", padding: 24 },
  /* `mx-auto mt-4 h-11 gap-2 rounded-full px-5` */
  overBack: {
    alignSelf: "center",
    marginTop: 16,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    borderRadius: dsRadius.full,
  },
});
