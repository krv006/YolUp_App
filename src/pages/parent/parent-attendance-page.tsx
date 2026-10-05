import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { useBackTo } from "@/shared/lib";
import { ArrowLeft } from "lucide-react-native";
import { AttendanceList, useAttendance } from "@/modules/attendance";
import { useSelectedChild } from "@/modules/parent";
import { ChildSelector } from "@/modules/parent/ui/child-selector";
import { IconButton, Screen, ScreenEmpty, ScreenError, ScreenLoading, Text, useTheme } from "@/shared/ui";

/**
 * Davomat va fokus jurnali — veb `parent-attendance-page.tsx` porti.
 *
 * Veb'da bu keng JADVAL edi (ustunlar: dars, kirish, chiqish, davomiylik,
 * diqqat, fokus). Telefonda jadval o'qilmaydi, shuning uchun har qator
 * kartochkaga aylandi va fokus tafsiloti bosilganda pastdan ochiladi.
 */
export function ParentAttendancePage() {
  const { t } = useTranslation("mobile");
  const { palette } = useTheme();
  const router = useRouter();
  useBackTo("/parent/workspace");
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
          title={t("parent.farzand_biriktirilmagan")}
          description={t("parent.farzand_bolimiga_oting_va_oquvchining_taklif")}
        />
      </Screen>
    );
  }

  if (childrenQuery.isLoading || attendance.isLoading) {
    return (
      <Screen>
        <ScreenLoading label={t("parent.davomat_yuklanmoqda")} />
      </Screen>
    );
  }

  if (attendance.isError) {
    return (
      <Screen>
        <ScreenError
          message={t("parent.davomatni_yuklab_bolmadi")}
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
          {/*
            * Ish maydoniga qaytish — bu sahifa endi TAB EMAS.
            * Sabab `app/parent/_layout.tsx` da.
            */}
          <View style={styles.headRow}>
            <IconButton
              accessibilityLabel={t("shared.orqaga")}
              onPress={() => router.replace("/parent/workspace")}
            >
              <ArrowLeft size={20} color={palette["muted-foreground"]} />
            </IconButton>
            <Text variant="heading">Davomat</Text>
          </View>
          <Text variant="caption" tone="muted">
            {t("parent.har_bir_darsdagi_ishtirok_diqqat_va_fokus_ko")}
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
  headRow: { flexDirection: "row", alignItems: "center", gap: 6, marginLeft: -8 },
  head: { gap: 4, paddingTop: 8 },
});
