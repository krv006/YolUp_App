import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import type { AttendanceStatus } from "@/modules/parent";
import { formatLocalized } from "@/shared/lib";
import { DsText, dsRadius, Icon, useDs, type DsColor, type IconName } from "@/shared/ui";
import { STATUS_TILE } from "./attendance-styles";

const CHIP: Record<AttendanceStatus, { bg: DsColor; fg: DsColor; icon: IconName | null }> = {
  live: { bg: "danger-bg", fg: "error-text", icon: null },
  attended: { bg: "success-bg", fg: "success-text", icon: "check-circle" },
  late: { bg: "warning-bg", fg: "warning-text", icon: "schedule" },
  missed: { bg: "danger-bg", fg: "error-text", icon: "cancel" },
  upcoming: { bg: "accent-teal-bg", fg: "accent-teal-fg", icon: "schedule" },
};

/** Davomat holati chipi — veb `attendance-parts.tsx` `StatusChip`. */
export function StatusChip({ status, lateMinutes = 0 }: { status: AttendanceStatus; lateMinutes?: number }) {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const chip = CHIP[status];
  return (
    <View style={[styles.chip, { backgroundColor: ds.c[chip.bg] }]}>
      {chip.icon ? <Icon name={chip.icon} size={14} color={ds.c[chip.fg]} /> : <View style={[styles.dot, { backgroundColor: ds.c.danger }]} />}
      <DsText v="caption-strong" c={chip.fg} numberOfLines={1}>
        {status === "late" ? t("attendanceView.status.late", { minutes: lateMinutes }) : t(`attendanceView.status.${status}`)}
      </DsText>
    </View>
  );
}

/** Sana katagi — `size-12 rounded-xl`, kun `font-heading text-[18px]/5`, oy `text-[10px]/3 uppercase`. */
export function DateTile({ value, status, size = "md" }: { value: string; status: AttendanceStatus; size?: "md" | "sm" }) {
  const ds = useDs();
  const date = new Date(value);
  const tone = STATUS_TILE[status];
  const box = size === "md" ? 48 : 44;
  return (
    <View style={[styles.tile, { width: box, height: box, backgroundColor: ds.c[tone.bg] }]}>
      <DsText v="title-lg" heading c={tone.fg} style={styles.day}>
        {date.getDate()}
      </DsText>
      <DsText v="micro" c={tone.fg} style={styles.month}>
        {formatLocalized(date, "LLL").replace(".", "").toUpperCase()}
      </DsText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { flexShrink: 0, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: dsRadius.full },
  dot: { width: 6, height: 6, borderRadius: 3 },
  tile: { flexShrink: 0, alignItems: "center", justifyContent: "center", borderRadius: dsRadius.xl },
  day: { lineHeight: 20 },
  month: { fontSize: 10, lineHeight: 12, letterSpacing: 0 },
});
