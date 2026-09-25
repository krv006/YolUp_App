import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { AttendanceList, useAttendance } from "@/modules/attendance";
import { useSelectedChild } from "@/modules/parent";
import { ChildSelector } from "@/modules/parent/ui/child-selector";
import { Screen, ScreenEmpty, ScreenError, ScreenLoading, Text, useTheme } from "@/shared/ui";

/**
 * Davomat va fokus jurnali — veb `parent-attendance-page.tsx` porti.
 *
 * Veb'da bu keng JADVAL edi (ustunlar: dars, kirish, chiqish, davomiylik,
 * diqqat, fokus). Telefonda jadval o'qilmaydi, shuning uchun har qator
 * kartochkaga aylandi va fokus tafsiloti bosilganda pastdan ochiladi.
 */
export function ParentAttendancePage() {
  const { palette } = useTheme();
  const { children, childrenQuery, selectedChildId } = useSelectedChild();

  const attendance = useAttendance(selectedChildId ? { student: selectedChildId } : {});

  /*
   * Farzand biriktirilmagan bo'lsa bu XATO emas.
   *
   * Avval so'rovlar baribir yuborilardi, backend esa o'quvchisiz so'rovni
   * rad etardi — natijada yangi ota-ona hisobi birinchi ochilishda
   * "Ma'lumotlarni yuklab bo'lmadi" degan qizil ekranni ko'rardi va nima
   * qilishni bilmasdi. Endi unga nima qilish kerakligi aytiladi.
   *
   * Xuddi shu naqsh `parent-grades-page` va `parent-homework-page` da ham.
   */
  if (!childrenQuery.isLoading && children.length === 0) {
    return (
      <Screen>
        <ScreenEmpty
          title="Farzand biriktirilmagan"
          description="'Farzand' bo'limiga o'ting va o'quvchining taklif kodi bilan uning hisobini ulang."
        />
      </Screen>
    );
  }

  if (childrenQuery.isLoading || attendance.isLoading) {
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
