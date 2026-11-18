import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { Activity, Gauge, HardDrive } from "lucide-react-native";
import {
  shortUserAgent,
  TrendLineChart,
  useClientHealth,
  useMonitoringCurrent,
  useMonitoringHistory,
  useTeacherVideoStats,
} from "@/modules/analytics";
import { formatDateTime } from "@/shared/lib";
import type { MonitoringSample } from "@/shared/types";
import { PortalCard, PortalSectionHead, Text, useLegacyColors, useTheme } from "@/shared/ui";
import { AdminTable } from "./admin-table";

const HOUR_OPTIONS = [6, 24, 72, 168];
const CLIENT_HOUR_OPTIONS = [24, 72, 168, 336];
const MAX_POINTS = 48;

/** Vebdagi bilan bir xil: har bo'lakdan eng band (CPU) o'lchov olinadi. */
function downsample(samples: MonitoringSample[]): MonitoringSample[] {
  if (samples.length <= MAX_POINTS) return samples;
  const bucket = Math.ceil(samples.length / MAX_POINTS);
  const out: MonitoringSample[] = [];
  for (let i = 0; i < samples.length; i += bucket) {
    const slice = samples.slice(i, i + bucket);
    const busiest = slice.reduce((top, item) => (item.cpuPercent > top.cpuPercent ? item : top), slice[0]!);
    out.push(busiest);
  }
  return out;
}

function Loading({ label }: { label: string }) {
  const { palette } = useTheme();
  const colors = useLegacyColors();
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={palette.primary} />
      <Text variant="label" style={{ color: colors.muted }}>
        {label}
      </Text>
    </View>
  );
}

/** Video yozuvlar — veb `StoragePanel`: o'qituvchilar bo'yicha videolar soni. */
export function StoragePanel() {
  const { t } = useTranslation("admin");
  const { palette } = useTheme();
  const colors = useLegacyColors();
  const query = useTeacherVideoStats();
  const teachers = query.data?.teachers ?? [];

  return (
    <PortalCard style={styles.panel}>
      <PortalSectionHead
        eyebrowIcon={HardDrive}
        eyebrow={t("storage.eyebrow")}
        title={t("storage.title")}
        action={
          <Text variant="label" style={[styles.total, { color: palette["primary-text"] }]}>
            {t("storage.totalVideos", { count: query.data?.totalVideos ?? 0 })}
          </Text>
        }
      />

      {query.isLoading ? <Loading label={t("storage.loading")} /> : null}

      {teachers.length ? (
        <AdminTable
          variant="analytics"
          rows={teachers.length}
          columns={[
            { key: "teacher", header: t("storage.teacher"), strong: true, cell: (row) => teachers[row]!.teacherName },
            { key: "count", header: t("storage.videoCount"), cell: (row) => teachers[row]!.videoCount },
          ]}
        />
      ) : !query.isLoading ? (
        <Text variant="body" style={{ color: colors.muted }}>
          {t("storage.empty")}
        </Text>
      ) : null}
    </PortalCard>
  );
}

/**
 * Server holati — veb `ServerMonitoringPanel`: davr tugmalari, joriy CPU va
 * xotira, grafik va eng band vaqt.
 *
 * Vebda tor ekranda davr tugmalari sarlavha yonida ustun bo'lib tiziladi
 * va izohni siqadi — bu yerda ular sarlavha ostida bir qatorda.
 */
export function ServerMonitoringPanel() {
  const { t } = useTranslation("admin");
  const { palette } = useTheme();
  const colors = useLegacyColors();
  const [hours, setHours] = useState(24);
  const current = useMonitoringCurrent();
  const history = useMonitoringHistory(hours);
  const samples = useMemo(() => downsample(history.data?.samples ?? []), [history.data]);
  const cpuColor = palette.primary;
  const memoryColor = palette["tone-amber-fg"];

  return (
    <PortalCard style={styles.panel}>
      <PortalSectionHead
        eyebrowIcon={Activity}
        eyebrow={t("monitoring.eyebrow")}
        title={t("monitoring.title")}
        note={t("monitoring.scopeNote")}
      />

      <View style={styles.range}>
        {HOUR_OPTIONS.map((value) => {
          const active = value === hours;
          return (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setHours(value)}
              style={[
                styles.rangeButton,
                active
                  ? { borderColor: palette["border-accent-strong"], backgroundColor: palette["primary-soft"] }
                  : { borderColor: colors.border, backgroundColor: palette.surface },
              ]}
            >
              <Text variant="caption" style={[styles.rangeText, { color: active ? palette["primary-text"] : colors.muted }]}>
                {t("monitoring.hours", { count: value })}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {current.isLoading ? <Loading label={t("monitoring.loading")} /> : null}

      {current.data ? (
        // `.teacher-stats-grid.monitoring-now` — 2 ustun, orasi 10.
        <View style={styles.now}>
          <NowCard value={`${current.data.cpuPercent.toFixed(1)}%`} label={t("monitoring.cpu")} />
          <NowCard value={`${current.data.memoryPercent.toFixed(1)}%`} label={t("monitoring.memory")} />
          <NowCard
            value={`${current.data.memoryUsedMb} / ${current.data.memoryTotalMb} MB`}
            label={t("monitoring.memoryUsed")}
          />
          <NowCard
            value={current.data.createdAt ? formatDateTime(current.data.createdAt) : "—"}
            label={t("monitoring.measuredAt")}
          />
        </View>
      ) : !current.isLoading ? (
        <Text variant="body" style={{ color: colors.muted }}>
          {t("monitoring.noSamples")}
        </Text>
      ) : null}

      {samples.length ? (
        <>
          <View style={styles.legend}>
            <LegendLine color={cpuColor} label={t("monitoring.cpu")} />
            <LegendLine color={memoryColor} label={t("monitoring.memory")} />
            <Text variant="caption" style={[styles.legendNote, { color: colors.muted }]}>
              {t("monitoring.pointNote", { count: samples.length })}
            </Text>
          </View>

          <TrendLineChart
            zeroBase
            unit="%"
            labels={samples.map((item) => item.createdAt.slice(11, 16))}
            series={[
              { key: "cpu", name: t("monitoring.cpu"), color: cpuColor, values: samples.map((item) => item.cpuPercent) },
              { key: "memory", name: t("monitoring.memory"), color: memoryColor, values: samples.map((item) => item.memoryPercent) },
            ]}
          />

          {history.data?.peak ? (
            <View style={[styles.peak, { borderColor: colors.border, backgroundColor: palette["surface-subtle"] }]}>
              <Text variant="label" style={[styles.peakText, { color: colors.muted }]}>
                {t("monitoring.peakLabel")}
              </Text>
              <Text variant="label" style={[styles.peakText, styles.peakStrong]}>
                {formatDateTime(history.data.peak.createdAt)}
              </Text>
              <Text
                variant="caption"
                style={[styles.peakBadge, { color: palette["primary-text"], backgroundColor: palette["primary-soft"] }]}
              >
                CPU {history.data.peak.cpuPercent.toFixed(1)}%
              </Text>
            </View>
          ) : null}
        </>
      ) : null}
    </PortalCard>
  );
}

/**
 * Mijoz salomatligi — veb #197 `ClientHealthPanel`
 * (`GET /monitoring/client-health/?hours=`): 24 soat – 14 kun filtrlari,
 * 4 ta ko'rsatkich va foydalanuvchilar jadvali (avval CPU cheklovi
 * ko'plar, keyin eng past FPS). Muammoli qiymatlar qizil. Davr tugmalari
 * server panelidagidek sarlavha ostida.
 */
export function ClientHealthPanel() {
  const { t } = useTranslation("admin");
  const { palette } = useTheme();
  const colors = useLegacyColors();
  const [hours, setHours] = useState(24);
  const health = useClientHealth(hours);
  const data = health.data;
  const users = data?.users ?? [];
  const limitedShare = data?.total ? Math.round((data.cpuLimitedTotal / data.total) * 100) : 0;
  const alert = (value: string | number, bad: boolean) => (
    <Text variant="label" style={bad ? [styles.alert, { color: palette["destructive-strong"] }] : undefined}>
      {value}
    </Text>
  );

  return (
    <PortalCard style={styles.panel}>
      <PortalSectionHead eyebrowIcon={Gauge} eyebrow={t("clientHealth.eyebrow")} title={t("clientHealth.title")} note={t("clientHealth.note")} />

      <View style={styles.range}>
        {CLIENT_HOUR_OPTIONS.map((value) => {
          const active = value === hours;
          return (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setHours(value)}
              style={[
                styles.rangeButton,
                active
                  ? { borderColor: palette["border-accent-strong"], backgroundColor: palette["primary-soft"] }
                  : { borderColor: colors.border, backgroundColor: palette.surface },
              ]}
            >
              <Text variant="caption" style={[styles.rangeText, { color: active ? palette["primary-text"] : colors.muted }]}>
                {value < 48 ? t("monitoring.hours", { count: value }) : t("clientHealth.days", { count: value / 24 })}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {health.isLoading ? <Loading label={t("clientHealth.loading")} /> : null}
      {health.isError ? (
        <Text variant="body" style={{ color: colors.muted }}>
          {health.error.message}
        </Text>
      ) : null}

      {data ? (
        <>
          <View style={styles.now}>
            <NowCard value={String(data.total)} label={t("clientHealth.reports")} />
            <NowCard value={`${data.cpuLimitedTotal} · ${limitedShare}%`} label={t("clientHealth.cpuLimited")} />
            <NowCard value={String(users.length)} label={t("clientHealth.users")} />
            <NowCard value={String(users.filter((user) => user.cpuLimitedReports > 0).length)} label={t("clientHealth.slowUsers")} />
          </View>

          {users.length ? (
            <AdminTable
              rows={users.length}
              columns={[
                {
                  key: "user",
                  header: t("clientHealth.columns.user"),
                  strong: true,
                  cell: (row) => `@${users[row]!.username || "—"} · ${t(`clientHealth.roles.${users[row]!.role}`, { defaultValue: users[row]!.role })}`,
                },
                { key: "reports", header: t("clientHealth.columns.reports"), cell: (row) => users[row]!.reports },
                { key: "cpu", header: t("clientHealth.columns.cpu"), cell: (row) => alert(users[row]!.cpuLimitedReports, users[row]!.cpuLimitedReports > 0) },
                { key: "network", header: t("clientHealth.columns.network"), cell: (row) => users[row]!.bandwidthLimitedReports },
                {
                  key: "fps",
                  header: t("clientHealth.columns.minFps"),
                  cell: (row) => {
                    const fps = users[row]!.minFps;
                    return alert(fps ?? "—", fps !== null && fps < 10);
                  },
                },
                {
                  key: "device",
                  header: t("clientHealth.columns.device"),
                  cell: (row) => {
                    const user = users[row]!;
                    return (
                      [
                        user.cores ? t("clientHealth.cores", { count: user.cores }) : "",
                        user.memoryGb ? t("clientHealth.memory", { value: user.memoryGb }) : "",
                        shortUserAgent(user.userAgent),
                      ]
                        .filter(Boolean)
                        .join(" · ") || "—"
                    );
                  },
                },
                { key: "last", header: t("clientHealth.columns.lastAt"), cell: (row) => (users[row]!.lastAt ? formatDateTime(users[row]!.lastAt!) : "—") },
              ]}
            />
          ) : (
            <Text variant="body" style={{ color: colors.muted }}>
              {t("clientHealth.empty")}
            </Text>
          )}
        </>
      ) : null}
    </PortalCard>
  );
}

function NowCard({ value, label }: { value: string; label: string }) {
  const { palette } = useTheme();
  const colors = useLegacyColors();
  return (
    <View style={[styles.nowCard, { borderColor: colors.border, backgroundColor: palette.surface }]}>
      <Text variant="body" style={styles.nowValue}>
        {value}
      </Text>
      <Text variant="caption" style={[styles.small, { color: colors.muted }]}>
        {label}
      </Text>
    </View>
  );
}

function LegendLine({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendLine, { backgroundColor: color }]} />
      <Text variant="label" style={styles.legendText}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  /* `.admin-teacher-panel` — 20 bo'shliq */
  panel: { padding: 20, gap: 14 },
  loading: { alignItems: "center", gap: 10, paddingVertical: 16 },
  total: { fontSize: 14, fontWeight: "700" },
  /* `.monitoring-range button` — 30 balandlik, 0 11, 11/800 */
  range: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  rangeButton: { minHeight: 30, justifyContent: "center", paddingHorizontal: 11, borderWidth: 1, borderRadius: 999 },
  rangeText: { fontSize: 11, lineHeight: 16.5, fontWeight: "700" },
  /* `font-semibold text-error-text` */
  alert: { fontWeight: "600" },
  now: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  /* `.teacher-stats-grid article` — 12 bo'shliq, radius 13 */
  nowCard: { flexGrow: 1, flexBasis: "40%", gap: 3, padding: 12, borderWidth: 1, borderRadius: 13 },
  nowValue: { fontSize: 19, lineHeight: 21, fontWeight: "700" },
  small: { fontSize: 11, lineHeight: 16.5 },
  /* `.monitoring-legend` — orasi 16 */
  legend: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 16, marginTop: 4 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 7 },
  legendLine: { width: 12, height: 3, borderRadius: 2 },
  legendText: { fontSize: 13 },
  legendNote: { marginLeft: "auto", fontSize: 11 },
  /* `.monitoring-peak` — 11 14, radius 13 */
  peak: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 10, paddingVertical: 11, paddingHorizontal: 14, borderWidth: 1, borderRadius: 13 },
  peakText: { fontSize: 13, fontWeight: "400" },
  peakStrong: { fontWeight: "700" },
  peakBadge: { marginLeft: "auto", overflow: "hidden", paddingVertical: 3, paddingHorizontal: 10, borderRadius: 999, fontSize: 11, fontWeight: "700" },
});
