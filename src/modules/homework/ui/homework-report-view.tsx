import { StyleSheet, View } from "react-native";
import type { HomeworkReport, HomeworkReportSummary } from "@/shared/types";
import { Badge, radius, Text, useTheme, type BadgeTone } from "@/shared/ui";

/**
 * Veb `homework-report-view.tsx` ning mobil varianti.
 *
 * Grafik ATAYLAB yo'q: hisobotda ko'rsatkich uchta (topshirilgan, foiz,
 * o'rtacha baho) va ular raqam sifatida aniqroq o'qiladi. Grafik kutubxona
 * (victory-native/Skia) bundle'ga ~300KB qo'shardi — Faza 3 ning keyingi
 * qadamida, tendensiya grafigi kerak bo'lganda kiritiladi.
 */
export function HomeworkReportView({ report }: { report: HomeworkReport }) {
  return (
    <View style={styles.wrapper}>
      <SummaryCard title="Barcha fanlar" summary={report.overall} highlight />

      {report.courses.length > 0 ? (
        <>
          <Text variant="label" style={styles.sectionTitle}>
            Fanlar bo'yicha
          </Text>
          {report.courses.map((course) => (
            <SummaryCard key={course.courseId} title={course.courseTitle} summary={course} />
          ))}
        </>
      ) : null}
    </View>
  );
}

/** Baho ohangi: 80+ yaxshi, 50+ o'rtacha, pastrog'i e'tibor talab qiladi. */
function scoreTone(value: number | null): BadgeTone {
  if (value === null) return "neutral";
  if (value >= 80) return "success";
  if (value >= 50) return "warning";
  return "danger";
}

function SummaryCard({
  title,
  summary,
  highlight = false,
}: {
  title: string;
  summary: HomeworkReportSummary;
  highlight?: boolean;
}) {
  const { palette } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: highlight ? palette["primary-tint"] : palette.card,
          borderColor: highlight ? palette["border-accent"] : palette.border,
        },
      ]}
    >
      <View style={styles.cardHead}>
        <Text variant="label" numberOfLines={2} style={styles.cardTitle}>
          {title}
        </Text>
        <Badge
          label={summary.averageScore === null ? "Baho yo'q" : `${Math.round(summary.averageScore)} ball`}
          tone={scoreTone(summary.averageScore)}
        />
      </View>

      <View style={styles.metrics}>
        <Metric label="Berilgan" value={String(summary.assignedCount)} />
        <Metric label="Topshirilgan" value={String(summary.submittedCount)} />
        <Metric label="Topshirish" value={`${Math.round(summary.submissionRate)}%`} />
      </View>

      {/* Progress chizig'i — foizni bir qarashda ko'rsatadi. */}
      <View style={[styles.track, { backgroundColor: palette.muted }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${Math.min(100, Math.max(0, summary.submissionRate))}%`,
              backgroundColor: palette.primary,
            },
          ]}
        />
      </View>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text variant="subheading">{value}</Text>
      <Text variant="caption" tone="muted">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 12 },
  sectionTitle: { paddingTop: 8 },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: 16,
    gap: 12,
  },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardTitle: { flex: 1 },
  metrics: { flexDirection: "row", gap: 20 },
  metric: { gap: 2 },
  track: { height: 6, borderRadius: 3, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 3 },
});
