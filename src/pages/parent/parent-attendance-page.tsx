import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { CalendarCheck2, Search } from "lucide-react-native";
import { AttendanceList, useAttendance } from "@/modules/attendance";
import { useSelectedChild } from "@/modules/parent";
import { ParentAppBar } from "@/modules/parent/ui/parent-app-bar";
import { formatDuration, useBackTo } from "@/shared/lib";
import {
  PortalHeading,
  portalPage,
  PullRefresh,
  Screen,
  ScreenError,
  ScreenLoading,
  Text,
  useLegacyColors,
  useTheme,
} from "@/shared/ui";

const WORKSPACE_PATH = "/parent/workspace";

/**
 * Davomat tarixi — veb `parent-attendance-page.tsx`: sarlavha, qidiruv,
 * yozuvlar soni (va chalg'igan vaqt) hamda darslar ro'yxati.
 *
 * Vebdagi "Hisobot" tugmasi YO'Q: u brauzerning chop etish oynasini
 * (`window.print()`) ochadi, ilovada esa chop etish moduli yo'q.
 * Jadval o'rniga `AttendanceList` kartochkalari — sababi o'sha faylda.
 */
export function ParentAttendancePage() {
  const { t } = useTranslation("parent");
  const { t: tn } = useTranslation("nav");
  const { t: ts } = useTranslation("mobile");
  const { palette } = useTheme();
  const colors = useLegacyColors();
  const router = useRouter();
  useBackTo(WORKSPACE_PATH);
  const { selectedChildId, selectedChild } = useSelectedChild();
  const attendance = useAttendance(selectedChildId ? { student: selectedChildId } : {});
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const items = attendance.data ?? [];
    if (!needle) return items;
    return items.filter((item) => `${item.child} ${item.lesson}`.toLowerCase().includes(needle));
  }, [attendance.data, search]);

  const totalAway = useMemo(() => rows.reduce((sum, item) => sum + item.focus.awaySeconds, 0), [rows]);

  const appBar = (
    <ParentAppBar
      a11yTitle={tn("parent.attendance")}
      back={{ label: ts("shared.orqaga"), onPress: () => router.replace(WORKSPACE_PATH) }}
    />
  );

  if (attendance.isLoading) {
    return (
      <Screen padded={false}>
        {appBar}
        <ScreenLoading label={t("attendance.loading")} />
      </Screen>
    );
  }

  if (attendance.isError) {
    return (
      <Screen padded={false}>
        {appBar}
        <ScreenError message={t("attendance.loadError")} onRetry={() => void attendance.refetch()} />
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      {appBar}
      <ScrollView
        style={{ backgroundColor: palette.background }}
        contentContainerStyle={portalPage}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <PullRefresh onRefresh={() => attendance.refetch()} />
        }
      >
        <PortalHeading
          eyebrow={t("attendance.eyebrow")}
          title={t("attendance.title")}
          description={
            selectedChild
              ? t("attendance.subtitleWithChild", { name: selectedChild.name })
              : t("attendance.subtitleNoChild")
          }
        />

        {/* `.attendance-toolbar` — qidiruv va yozuvlar soni. */}
        <View style={styles.toolbar}>
          <View style={[styles.search, { borderColor: colors.border, backgroundColor: palette.surface }]}>
            <Search size={18} color={colors.muted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={t("attendance.searchPlaceholder")}
              placeholderTextColor={colors.muted}
              selectionColor={palette.primary}
              returnKeyType="search"
              style={[styles.searchInput, { color: colors.foreground }]}
            />
          </View>
          <View style={styles.count}>
            <CalendarCheck2 size={17} color={colors.muted} />
            <Text variant="caption" style={{ color: colors.muted }}>
              {t("attendance.recordsCount", { count: rows.length })}
              {totalAway ? t("attendance.awaySuffix", { duration: formatDuration(totalAway) }) : ""}
            </Text>
          </View>
        </View>

        {/* Vebdagi `AttendanceAccordion`: bo'sh bo'lsa oddiy kulrang matn. */}
        {rows.length ? (
          <AttendanceList rows={rows} />
        ) : (
          <Text variant="body" style={{ color: colors.muted }}>
            {ts("attendance.davomat_yozuvi_topilmadi")}.
          </Text>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  toolbar: { gap: 15 },
  /* `.portal-search` — 44 balandlik, 0 14, radius 13 */
  search: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 14, borderWidth: 1, borderRadius: 13 },
  searchInput: { flex: 1, minWidth: 0, paddingVertical: 10, fontSize: 14, fontFamily: "Onest-Regular" },
  count: { flexDirection: "row", alignItems: "center", gap: 6 },
});
