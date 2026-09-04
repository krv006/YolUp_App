import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { AttendanceList, useAttendance } from "@/modules/attendance";
import { useSelectedChild } from "@/modules/parent";
import { ChildSelector } from "@/modules/parent/ui/child-selector";
import { Screen, ScreenError, ScreenLoading, Text, useTheme } from "@/shared/ui";

/**
 * Davomat va fokus jurnali — veb `parent-attendance-page.tsx` porti.
 *
 * Veb'da bu keng JADVAL edi (ustunlar: dars, kirish, chiqish, davomiylik,
 * diqqat, fokus). Telefonda jadval o'qilmaydi, shuning uchun har qator
 * kartochkaga aylandi va fokus tafsiloti bosilganda pastdan ochiladi.
 */
export function ParentAttendancePage() {
  const { palette } = useTheme();
  const { selectedChildId } = useSelectedChild();

  const attendance = useAttendance(selectedChildId ? { student: selectedChildId } : {});

  if (attendance.isLoading) {
    return (
      <Screen>
        <ScreenLoading label="Davomat yuklanmoqda…" />
      </Screen>
    );
  }

  if (attendance.isError) {
    return (
      <Screen>
        <ScreenError
          message="Davomatni yuklab bo'lmadi"
          onRetry={() => void attendance.refetch()}
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
            refreshing={attendance.isRefetching}
            onRefresh={() => void attendance.refetch()}
            tintColor={palette["muted-foreground"]}
          />
        }
      >
        <View style={styles.head}>
          <Text variant="heading">Davomat</Text>
          <Text variant="caption" tone="muted">
            Har bir darsdagi ishtirok, diqqat va fokus ko'rsatkichlari.
          </Text>
        </View>

        <ChildSelector />

        <AttendanceList
          rows={attendance.data ?? []}
          emptyLabel="Farzandingiz darsga kirgach ma'lumot shu yerda paydo bo'ladi"
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 12, paddingBottom: 40 },
  head: { gap: 4, paddingTop: 8 },
});
