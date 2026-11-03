import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { downloadFile, parentAttendance, parentFamily, printTable, type AttendanceEntry } from "@/modules/parent";
import { formatLocalized, formatMessageTime } from "@/shared/lib";
import { DsText, dsRadius, Icon, MobileFieldLabel, MobilePickerField, Sheet, Switch, toast, useDs, type DsColor, type IconName } from "@/shared/ui";
import { stayLabel } from "./attendance-format";

type Format = "pdf" | "excel";

/** Pastki oyna yopilish animatsiyasi. */
const SHEET_CLOSE_MS = 350;

const FORMATS: Array<{ id: Format; icon: IconName; bg: DsColor; fg: DsColor }> = [
  { id: "pdf", icon: "description", bg: "danger-bg", fg: "error-text" },
  { id: "excel", icon: "grid-view", bg: "accent-green-bg", fg: "accent-green-fg" },
];

/**
 * Oylik davomat hisoboti — veb `attendance-report.tsx` (telefonda pastki
 * oyna): oy, format (PDF yoki Excel/CSV) va fokus ustuni. Vebda PDF
 * brauzerning chop etish oynasida, CSV yuklab olinardi; mobilda ikkalasi
 * fayl bo'lib ulashish oynasida ochiladi.
 */
export function AttendanceReport({
  open,
  onOpenChange,
  childName,
  entries,
  teachers,
  now,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  childName: string;
  entries: AttendanceEntry[];
  teachers: Map<string, string>;
  now: number;
}) {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const months = parentAttendance.monthsWithLessons(entries, now);
  const [monthKey, setMonthKey] = useState<string | null>(null);
  const [format, setFormat] = useState<Format>("pdf");
  const [withFocus, setWithFocus] = useState(true);
  const [busy, setBusy] = useState(false);
  const selected = months.find((item) => `${item.year}-${item.month}` === monthKey) ?? months[0] ?? null;

  function monthLabel(year: number, month: number): string {
    return formatLocalized(new Date(year, month, 1), "LLLL yyyy");
  }

  async function generate() {
    if (!selected || busy) return;
    const rows = entries
      .filter((entry) => entry.status !== "upcoming" && parentAttendance.inMonth(entry, selected.year, selected.month))
      .sort((a, b) => a.lesson.startsAt.localeCompare(b.lesson.startsAt));
    const stats = parentAttendance.attendanceStats(rows);
    const columns = [
      t("attendanceView.report.columns.date"),
      t("attendanceView.columns.lesson"),
      t("attendanceView.report.columns.teacher"),
      t("attendanceView.columns.in"),
      t("attendanceView.columns.out"),
      t("attendanceView.columns.duration"),
      ...(withFocus ? [t("attendanceView.columns.focus")] : []),
      t("attendanceView.columns.status"),
    ];
    const table = rows.map((entry) => [
      formatLocalized(entry.lesson.startsAt, t("attendanceView.report.datePattern")),
      entry.lesson.courseTitle,
      teachers.get(entry.lesson.courseId) ?? "",
      entry.row?.joinedAt ? formatMessageTime(entry.row.joinedAt) : "—",
      entry.row?.leftAt ? formatMessageTime(entry.row.leftAt) : "—",
      stayLabel(entry, now, t),
      ...(withFocus ? [entry.focus === null ? "—" : `${entry.focus}%`] : []),
      entry.status === "late" ? t("attendanceView.status.late", { minutes: entry.lateMinutes }) : t(`attendanceView.status.${entry.status}`),
    ]);
    const month = formatLocalized(new Date(selected.year, selected.month, 1), "LLLL").toLowerCase();
    const base = `${t("attendanceView.report.filePrefix")}_${parentFamily.latinize(childName.split(" ")[0] ?? "")}_${parentFamily.latinize(month)}`;
    const label = monthLabel(selected.year, selected.month);

    setBusy(true);
    // Ulashish oynasi pastki oyna ustida ochilmasin — avval u yopilib bo'ladi.
    onOpenChange(false);
    await new Promise((resolve) => setTimeout(resolve, SHEET_CLOSE_MS));
    try {
      if (format === "excel") {
        const file = `${base}.csv`;
        if (await downloadFile(file, parentAttendance.toCsv([columns, ...table]), "text/csv;charset=utf-8")) {
          toast.success(t("attendanceView.report.done", { file }));
        }
      } else {
        await printTable({
          documentTitle: base,
          heading: t("attendanceView.report.heading", { name: childName }),
          subtitle: label,
          summary: [
            { label: t("attendanceView.calendar.lessons"), value: String(stats.attended + stats.late + stats.missed) },
            { label: t("attendanceView.legend.attended"), value: String(stats.attended) },
            { label: t("attendanceView.legend.late"), value: String(stats.late) },
            { label: t("attendanceView.legend.missed"), value: String(stats.missed) },
            { label: t("attendanceView.summary.label"), value: stats.percent === null ? "—" : `${stats.percent}%` },
          ],
          columns,
          rows: table,
        });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      variant="app"
      open={open}
      onClose={() => onOpenChange(false)}
      headingTitle="semibold"
      title={t("attendanceView.report.title")}
      description={t("attendanceView.report.subtitle", { name: childName })}
      footer={
        <Pressable
          accessibilityRole="button"
          disabled={!selected || busy}
          onPress={() => void generate()}
          style={({ pressed }) => [styles.download, { backgroundColor: pressed ? ds.c["brand-strong"] : ds.c.brand }, (!selected || busy) && styles.disabled]}
        >
          <Icon name="download" size={18} color={ds.c["on-action"]} />
          <DsText v="title-sm" c="on-action">
            {t("attendanceView.report.download")}
          </DsText>
        </Pressable>
      }
    >
      <View style={styles.body}>
        <MobileFieldLabel label={t("attendanceView.report.period")}>
          <MobilePickerField
            type="select"
            value={selected ? `${selected.year}-${selected.month}` : ""}
            display={selected ? t("attendanceView.report.periodOption", { month: monthLabel(selected.year, selected.month), count: selected.count }) : "—"}
            options={months.map((item) => ({
              value: `${item.year}-${item.month}`,
              label: t("attendanceView.report.periodOption", { month: monthLabel(item.year, item.month), count: item.count }),
            }))}
            ariaLabel={t("attendanceView.report.period")}
            onChange={setMonthKey}
          />
        </MobileFieldLabel>

        <View accessibilityRole="radiogroup" style={styles.formats}>
          {FORMATS.map((item) => {
            const active = format === item.id;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                onPress={() => setFormat(item.id)}
                style={[styles.format, active ? { borderColor: ds.c.brand, backgroundColor: ds.c["brand-subtle"] } : { borderColor: "transparent", backgroundColor: ds.c.subtle }]}
              >
                <View style={styles.formatHead}>
                  <View style={[styles.formatIcon, { backgroundColor: ds.c[item.bg] }]}>
                    <Icon name={item.icon} size={20} color={ds.c[item.fg]} />
                  </View>
                  <View style={[styles.radio, { borderColor: active ? ds.c.brand : ds.c["line-strong"] }]}>
                    {active ? <View style={[styles.radioDot, { backgroundColor: ds.c.brand }]} /> : null}
                  </View>
                </View>
                <View style={styles.formatText}>
                  <DsText v="title-sm">{t(`attendanceView.report.${item.id}`)}</DsText>
                  <DsText v="body-xs" c="ink-secondary">
                    {t(`attendanceView.report.${item.id}Text`)}
                  </DsText>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.focus, { borderTopColor: ds.c.line }]}>
          <View style={[styles.formatIcon, { backgroundColor: ds.c["accent-blue-bg"] }]}>
            <Icon name="visibility" size={20} color={ds.c["accent-blue-fg"]} />
          </View>
          <View style={styles.formatText}>
            <DsText v="title-sm">{t("attendanceView.report.focus")}</DsText>
            <DsText v="body-xs" c="ink-secondary">
              {t("attendanceView.report.focusText")}
            </DsText>
          </View>
          <Switch size="lg" checked={withFocus} onCheckedChange={setWithFocus} accessibilityLabel={t("attendanceView.report.focus")} />
        </View>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  disabled: { opacity: 0.4 },
  download: { flex: 1, height: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 20, borderRadius: dsRadius.full },
  body: { gap: 16, paddingHorizontal: 4, paddingBottom: 8 },
  formats: { flexDirection: "row", gap: 12 },
  format: { flex: 1, minWidth: 0, gap: 12, padding: 16, borderWidth: 2, borderRadius: dsRadius["2xl"] },
  formatHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  formatIcon: { width: 40, height: 40, borderRadius: dsRadius.xl, alignItems: "center", justifyContent: "center" },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  formatText: { flex: 1, minWidth: 0, gap: 2 },
  focus: { flexDirection: "row", alignItems: "center", gap: 16, paddingTop: 16, borderTopWidth: 1 },
});
