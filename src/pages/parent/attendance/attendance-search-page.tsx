import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { parentAttendance, type AttendanceEntry, type AttendanceStatus } from "@/modules/parent";
import { ROUTES } from "@/shared/config";
import { DsText, Icon, MobilePageHeader, MobileSearchField, useDs } from "@/shared/ui";
import { ParentScreen, useParentBack } from "@/widgets/parent-shell";
import { AttendanceDetail } from "./attendance-detail";
import { AttendanceList } from "./attendance-mobile";
import { useAttendanceView } from "./use-attendance-view";

const ALL = new Set<AttendanceStatus>(["attended", "late", "missed", "upcoming"]);

/** Davomatdan qidirish — veb `attendance-search-page.tsx` (faqat telefon): kurs nomi bo'yicha. */
export function AttendanceSearchPage() {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const back = useParentBack(ROUTES.parent.attendance);
  const view = useAttendanceView();
  const [query, setQuery] = useState("");
  const [opened, setOpened] = useState<AttendanceEntry | null>(null);

  const needle = query.trim();
  const results = needle ? parentAttendance.filterEntries(view.entries, { period: "all", courseId: null, statuses: ALL, query: needle }, view.now) : [];

  return (
    <ParentScreen>
      <MobilePageHeader title={t("mobile.attendance.searchTitle")} backLabel={t("attendanceView.title")} onBack={back} />
      <MobileSearchField value={query} onChange={setQuery} placeholder={t("attendanceView.search")} clearLabel={t("attendanceView.clearSearch")} autoFocus />
      {needle && !results.length ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: ds.c["brand-subtle"] }]}>
            <Icon name="search" size={30} color={ds.c.brand} />
          </View>
          <DsText v="title-lg" heading style={styles.center}>
            {t("attendanceView.notFound.title")}
          </DsText>
          <DsText v="body-sm" c="ink-secondary" style={styles.center}>
            {t("attendanceView.notFound.text", { query: needle })}
          </DsText>
        </View>
      ) : null}
      {results.length ? <AttendanceList entries={results} now={view.now} onOpen={setOpened} /> : null}
      <AttendanceDetail
        entry={opened}
        teacher={opened ? (view.teachers.get(opened.lesson.courseId) ?? "") : ""}
        subject={opened ? (view.subjects.get(opened.lesson.courseId) ?? opened.lesson.courseTitle) : ""}
        now={view.now}
        onClose={() => setOpened(null)}
      />
    </ParentScreen>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: "center" },
  empty: { alignItems: "center", gap: 12, paddingHorizontal: 24, paddingTop: 80 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
});
