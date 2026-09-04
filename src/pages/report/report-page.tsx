import { RefreshControl, ScrollView, StyleSheet } from "react-native";
import { useHomeworkReport } from "@/modules/homework";
import { HomeworkReportView } from "@/modules/homework/ui/homework-report-view";
import { Screen, ScreenError, ScreenLoading, Text, useTheme } from "@/shared/ui";

/**
 * O'quvchining reytingi — veb `student-report-page.tsx` porti.
 *
 * `studentId` berilsa ota-ona farzandining hisobotini ko'radi (backend
 * `?student=` parametrini shunday qabul qiladi).
 */
export function ReportPage({ studentId }: { studentId?: string | null } = {}) {
  const { palette } = useTheme();
  const report = useHomeworkReport(studentId ?? undefined);

  if (report.isLoading) {
    return (
      <Screen>
        <ScreenLoading label="Reyting yuklanmoqda…" />
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
        <Text variant="heading">Mening natijalarim</Text>
        <Text variant="caption" tone="muted" style={styles.subtitle}>
          Har bir fan bo'yicha vazifalar va baholaringiz.
        </Text>
        <HomeworkReportView report={report.data} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20, paddingBottom: 40 },
  subtitle: { paddingBottom: 16 },
});
