import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useHomeworkReport } from "@/modules/homework";
import { useBackTo } from "@/shared/lib";
import { HomeworkReportView } from "@/modules/homework/ui/homework-report-view";
import { IconButton, Screen, ScreenError, ScreenLoading, Text, useTheme } from "@/shared/ui";

/**
 * O'quvchining reytingi — veb `student-report-page.tsx` porti.
 *
 * `studentId` berilsa ota-ona farzandining hisobotini ko'radi (backend
 * `?student=` parametrini shunday qabul qiladi).
 */
export function ReportPage({ studentId }: { studentId?: string | null } = {}) {
  const { t } = useTranslation("mobile");
  const { palette } = useTheme();
  const router = useRouter();

  /*
   * ORQAGA tugmasi faqat O'QUVCHIDA.
   *
   * O'quvchida bu sahifa endi tab emas — u Ish maydonidan ochiladi va
   * qaytish yo'li ko'rinib turishi kerak. Ota-onada esa u hali ham o'z
   * tabining ichida (`parent-grades-page.tsx`), ya'ni qaytadigan joy yo'q
   * va tugma faqat chalg'itardi. Shu sababli `studentId` ga qarab
   * ajratiladi: u faqat ota-ona ko'rinishida beriladi.
   */
  const ownReport = !studentId;

  useBackTo("/student/workspace", ownReport);

  const report = useHomeworkReport(studentId ?? undefined);

  if (report.isLoading) {
    return (
      <Screen>
        <ScreenLoading label={t("report.reyting_yuklanmoqda")} />
      </Screen>
    );
  }

  if (report.isError || !report.data) {
    return (
      <Screen>
        <ScreenError
          message={report.error?.message ?? "Reytingni yuklab bo'lmadi"}
          onRetry={() => void report.refetch()}
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
            refreshing={report.isRefetching}
            onRefresh={() => void report.refetch()}
            tintColor={palette["muted-foreground"]}
          />
        }
      >
        {ownReport ? (
          <View style={styles.headRow}>
            <IconButton
              accessibilityLabel={t("shared.orqaga")}
              onPress={() => router.replace("/student/workspace")}
            >
              <ArrowLeft size={20} color={palette["muted-foreground"]} />
            </IconButton>
            <Text variant="heading">Mening natijalarim</Text>
          </View>
        ) : (
          <Text variant="heading">Mening natijalarim</Text>
        )}
        <Text variant="caption" tone="muted" style={styles.subtitle}>
          {t("report.har_bir_fan_boyicha_vazifalar_va_baholaringi")}
        </Text>
        <HomeworkReportView report={report.data} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20, paddingBottom: 40 },
  headRow: { flexDirection: "row", alignItems: "center", gap: 6, marginLeft: -8 },
  subtitle: { paddingBottom: 16 },
});
