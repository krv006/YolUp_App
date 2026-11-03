import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { parentAttendance, type AttendanceEntry } from "@/modules/parent";
import { ROUTES } from "@/shared/config";
import { formatLocalized } from "@/shared/lib";
import { DsText, MobilePageHeader, useDs } from "@/shared/ui";
import { ParentScreen, useParentBack } from "@/widgets/parent-shell";
import { AttendanceDetail } from "./attendance-detail";
import { AttendanceList } from "./attendance-mobile";
import { STATUS_DOT } from "./attendance-styles";
import { MiniCalendar } from "./attendance-summary";
import { useAttendanceView } from "./use-attendance-view";

/** Davomat kalendari — veb `attendance-calendar-page.tsx` (faqat telefon): oy, belgilar, tanlangan kun darslari. */
export function AttendanceCalendarPage() {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const back = useParentBack(ROUTES.parent.attendance);
  const view = useAttendanceView();
  const [month, setMonth] = useState(() => {
    const today = new Date(view.now);
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selected, setSelected] = useState(() => parentAttendance.dayKey(view.now));
  const [opened, setOpened] = useState<AttendanceEntry | null>(null);

  const byDay = parentAttendance.entriesByDay(view.entries);
  const day = byDay.get(selected) ?? [];
  const [year, monthIndex, date] = selected.split("-").map(Number);

  return (
    <ParentScreen onRefresh={async () => view.retry()}>
      <MobilePageHeader title={t("attendanceView.calendar.calendar")} backLabel={t("attendanceView.title")} onBack={back} />
      <View style={styles.calendar}>
        <MiniCalendar
          month={month}
          byDay={byDay}
          now={view.now}
          selected={selected}
          onMonth={(step) => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + step, 1))}
          onPick={(value) => setSelected(parentAttendance.dayKey(value))}
        />
        <View style={styles.legend}>
          {(["attended", "late", "missed", "upcoming"] as const).map((status) => (
            <View key={status} style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: ds.c[STATUS_DOT[status]] }]} />
              <DsText v="caption" c="ink-secondary">
                {t(`attendanceView.legend.${status}`)}
              </DsText>
            </View>
          ))}
        </View>
      </View>
      <DsText v="title-lg" heading style={styles.dayTitle}>
        {formatLocalized(new Date(year, monthIndex, date), t("attendanceView.detail.datePattern"))}
      </DsText>
      {day.length ? (
        <AttendanceList entries={day} now={view.now} onOpen={setOpened} />
      ) : (
        <DsText v="body-sm" c="ink-tertiary" style={[styles.empty, { backgroundColor: ds.c.surface }]}>
          {t("attendanceView.calendar.noLessons")}
        </DsText>
      )}
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
  calendar: { gap: 12 },
  legend: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 16 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dayTitle: { paddingHorizontal: 4 },
  empty: { paddingHorizontal: 16, paddingVertical: 32, textAlign: "center", borderRadius: 20, overflow: "hidden" },
});
