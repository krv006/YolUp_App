import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { ArrowLeft, ClipboardCheck } from "lucide-react-native";
import { ExamCountdown, useExams } from "@/modules/exam";
import { NotificationBell } from "@/modules/notification";
import { useQuizColors } from "@/modules/quiz";
import { toIntlLocale } from "@/shared/i18n/intl-locale";
import type { ExamSummary } from "@/shared/types";
import { AppBar, AppBarAction, Screen, ScreenError, ScreenLoading, Text, useTheme } from "@/shared/ui";

const WORKSPACE_PATH = "/student/workspace";

/**
 * O'quvchining Mock testlari — veb `pages/student/exams/student-exams-page.tsx`
 * porti. Vebda bu sahifa eski "portal" uslubida (Testlar sahifasidagi
 * kabi): Orqaga, MOCK TEST, sarlavha, izoh va kartalar ro'yxati.
 */
export function StudentExamsPage() {
  const { t, i18n } = useTranslation("exam");
  const { t: tn } = useTranslation("nav");
  const { t: tw } = useTranslation("workspace");
  const router = useRouter();
  const { palette } = useTheme();
  const colors = useQuizColors();
  const exams = useExams(null);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        router.replace(WORKSPACE_PATH);
        return true;
      });
      return () => subscription.remove();
    }, [router])
  );

  const appBar = (
    <AppBar title={tn("titles.workspace")} back={{ label: tw("searchBack"), onPress: () => router.replace(WORKSPACE_PATH) }}>
      <AppBarAction name="search" label={tw("searchAria")} onPress={() => router.push("/student/search")} />
      <NotificationBell />
    </AppBar>
  );

  if (exams.isLoading) {
    return (
      <Screen padded={false}>
        {appBar}
        <ScreenLoading label={t("list.loading")} />
      </Screen>
    );
  }
  if (exams.isError) {
    return (
      <Screen padded={false}>
        {appBar}
        <ScreenError message={exams.error?.message ?? t("list.loadError")} onRetry={() => void exams.refetch()} />
      </Screen>
    );
  }

  const list = exams.data ?? [];
  const format = new Intl.DateTimeFormat(toIntlLocale(i18n.language), { dateStyle: "medium", timeStyle: "short" });

  function badgeTone(exam: ExamSummary) {
    if (exam.state === "upcoming") return { bg: palette["primary-tint"], fg: palette["primary-text"] };
    if (exam.state === "running") return { bg: "#e8f8f2", fg: "#0f7a59" };
    return { bg: colors.mutedBg, fg: colors.muted };
  }

  return (
    <Screen padded={false}>
      {appBar}
      <ScrollView style={{ backgroundColor: palette.background }} contentContainerStyle={styles.page}>
        <View style={styles.heading}>
          <Pressable
            accessibilityRole="link"
            onPress={() => router.replace(WORKSPACE_PATH)}
            style={({ pressed }) => [
              styles.back,
              pressed
                ? { borderColor: palette.primary, backgroundColor: palette["primary-tint"] }
                : { borderColor: colors.border },
            ]}
          >
            {({ pressed }) => (
              <>
                <ArrowLeft size={16} color={pressed ? palette["primary-text"] : colors.muted} />
                <Text variant="caption" style={[styles.backText, { color: pressed ? palette["primary-text"] : colors.muted }]}>
                  {tw("searchBack")}
                </Text>
              </>
            )}
          </Pressable>
          <Text variant="caption" style={[styles.eyebrow, { color: palette["primary-text"] }]}>
            {t("list.eyebrow")}
          </Text>
          <Text variant="body" style={styles.title}>
            {t("list.title")}
          </Text>
          <Text variant="label" style={[styles.subtitle, { color: colors.muted }]}>
            {t("list.subtitle")}
          </Text>
        </View>

        {list.length ? (
          <View style={styles.list}>
            {list.map((exam) => {
              const tone = badgeTone(exam);
              const running = exam.state === "running";
              const disabled = exam.state === "upcoming";
              return (
                <View key={exam.id} style={[styles.card, { borderColor: colors.border }]}>
                  <View style={[styles.icon, { backgroundColor: palette["primary-soft"] }]}>
                    <ClipboardCheck size={20} color={palette["primary-text"]} />
                  </View>
                  <View style={styles.text}>
                    <Text variant="label" style={styles.cardTitle}>
                      {exam.title}{" "}
                      {/*
                       * Belgi ichidagi bo'shliqlar uzilmaydigan (U+00A0): oddiy probelda
                       * iOS qatorni belgi ICHIDA bo'lib, fonning bir bo'lagini yuqori
                       * qatorda qoldirardi. Endi belgi butunligicha keyingi qatorga o'tadi.
                       */}
                      <Text variant="caption" style={[styles.badge, { backgroundColor: tone.bg, color: tone.fg }]}>
                        {` ${t(`state.${exam.state}`)} `}
                      </Text>
                    </Text>
                    <Text variant="caption" style={{ color: colors.foreground }}>
                      {exam.courseTitle ? `${exam.courseTitle} · ` : ""}
                      {format.format(new Date(exam.startsAt))} · {t("list.minutes", { count: exam.totalMinutes })}
                    </Text>
                  </View>
                  {exam.state === "upcoming" ? <ExamCountdown startsAt={exam.startsAt} /> : null}
                  {/* To'liq kenglikdagi qator — tugma sarlavhani siqmaydi, pastga tushadi. */}
                  <View style={styles.footer}>
                    <Pressable
                      accessibilityRole="button"
                      disabled={disabled}
                      onPress={() => router.push(`/student/exams/${exam.id}`)}
                      style={({ pressed }) => [
                        styles.button,
                        running
                          ? {
                              backgroundColor: pressed ? palette["primary-hover"] : palette.primary,
                              boxShadow: "0 8px 20px rgba(69, 103, 245, 0.2)",
                            }
                          : {
                              borderWidth: 1,
                              borderColor: colors.border,
                              backgroundColor: pressed ? palette["primary-soft"] : palette.surface,
                            },
                        disabled && styles.disabled,
                      ]}
                    >
                      <Text
                        variant="body"
                        style={[styles.buttonText, { color: running ? palette["primary-foreground"] : colors.foreground }]}
                      >
                        {exam.state === "finished" ? t("list.openResult") : t("list.enter")}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.empty}>
            <ClipboardCheck size={30} color={colors.muted} />
            <Text variant="subheading">{t("list.empty")}</Text>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { paddingTop: 20, paddingHorizontal: 12, paddingBottom: 38 },
  heading: { marginBottom: 22, paddingHorizontal: 12 },
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
  eyebrow: { fontSize: 12, lineHeight: 18, fontWeight: "700", letterSpacing: 1.56 },
  title: { marginVertical: 6, fontSize: 28, lineHeight: 42, fontWeight: "400", letterSpacing: -0.98 },
  subtitle: { fontSize: 14, lineHeight: 21, fontWeight: "400" },
  list: { gap: 9, padding: 15 },
  card: { flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start", gap: 12, padding: 14, borderWidth: 1, borderRadius: 13 },
  icon: { width: 41, height: 41, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  text: { flex: 1, minWidth: 0, gap: 2 },
  cardTitle: { fontSize: 14, lineHeight: 21, fontWeight: "700" },
  /* `.exam-state-badge` — 11/800 KATTA HARF */
  badge: { fontSize: 11, fontWeight: "700", letterSpacing: 0.44, textTransform: "uppercase", borderRadius: 999 },
  // Ikonka (41) + oraliq (12) ichkarida — tugma matn bilan bir chiziqdan boshlanadi.
  footer: { width: "100%", flexDirection: "row", paddingLeft: 53 },
  button: { minHeight: 38, justifyContent: "center", paddingHorizontal: 13, borderRadius: 10 },
  buttonText: { fontSize: 15, lineHeight: 22, fontWeight: "700" },
  disabled: { opacity: 0.5 },
  empty: { alignItems: "center", gap: 10, paddingVertical: 40 },
});
