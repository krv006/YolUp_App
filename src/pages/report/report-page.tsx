import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useHomeworkReport } from "@/modules/homework";
import { HomeworkReportView } from "@/modules/homework/ui/homework-report-view";
import { ArrowLeft } from "lucide-react-native";
import { IconButton, Screen, ScreenError, ScreenLoading, Text, useTheme } from "@/shared/ui";

/**
 * Vazifalar bo'yicha hisobot — veb `student-report-page.tsx` porti.
 *
 * MOBILDA FAQAT OTA-ONADA ishlatiladi: o'quvchida bu bo'lim kerak emas
 * deb qaror qilindi va marshruti olib tashlandi. `studentId` shuning
 * uchun amalda doim beriladi — u backendga `student_id` bo'lib ketadi
 * (`homework.api.ts` da nega aynan shu nom ekani yozilgan).
 */
export function ReportPage({
  studentId,
  onBack,
}: {
  studentId?: string | null;
  /*
   * Orqaga tugmasi SHU YERDA chiziladi, chaqiruvchida emas.
   *
   * Chaqiruvchi uni o'z o'ramiga qo'yganda u status paneli OSTIGA
   * tushardi: bu sahifa o'zining `Screen` ini yaratadi va xavfsiz
   * maydonni o'sha qo'llaydi, tashqaridagi oddiy `View` esa qo'llamaydi.
   */
  onBack?: () => void;
} = {}) {
  const { t } = useTranslation("mobile");
  const { palette } = useTheme();
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
        {/*
          * Sarlavha KIMNIKI ekaniga qarab. Ilgari ota-ona ham "Mening
          * natijalarim" degan sarlavhani ko'rardi — u veb'ning o'quvchi
          * sahifasidan ko'chirilgan va ota-onada noto'g'ri edi.
          */}
        <View style={styles.headRow}>
          {onBack ? (
            <IconButton accessibilityLabel={t("shared.orqaga")} onPress={onBack}>
              <ArrowLeft size={20} color={palette["muted-foreground"]} />
            </IconButton>
          ) : null}
          <Text variant="heading">
            {studentId ? "Farzandingiz natijalari" : "Mening natijalarim"}
          </Text>
        </View>
        <Text variant="caption" tone="muted" style={styles.subtitle}>
          {studentId
            ? t("report.har_bir_fan_boyicha_farzandingiz_vazifalari")
            : t("report.har_bir_fan_boyicha_vazifalar_va_baholaringi")}
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
