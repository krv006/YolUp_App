import { useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { ChevronDown, ChevronRight, Clock3, ShieldAlert } from "lucide-react-native";
import { groupAttendanceByLesson, useAttendance } from "@/modules/attendance";
import { useSelectedChild } from "@/modules/parent";
import { ChildSelector } from "@/modules/parent/ui/child-selector";
import { formatDateTime, formatDuration } from "@/shared/lib";
import type { AttendanceRow, FocusJournal } from "@/shared/types";
import {
  Badge,
  radius,
  Screen,
  ScreenEmpty,
  ScreenError,
  ScreenLoading,
  Separator,
  Sheet,
  Text,
  useTheme,
} from "@/shared/ui";

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
  const [focusTarget, setFocusTarget] = useState<AttendanceRow | null>(null);

  const attendance = useAttendance(selectedChildId ? { student: selectedChildId } : {});
  const groups = useMemo(
    () => groupAttendanceByLesson(attendance.data ?? []),
    [attendance.data]
  );

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
            Har bir darsdagi ishtirok va diqqat ko'rsatkichlari.
          </Text>
        </View>

        <ChildSelector />

        {groups.length === 0 ? (
          <ScreenEmpty
            title="Davomat topilmadi"
            description="Farzandingiz darsga kirgach ma'lumot shu yerda paydo bo'ladi."
          />
        ) : (
          groups.map((group) => (
            <View
              key={group.lessonId}
              style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}
            >
              <Text variant="label" numberOfLines={2}>
                {group.lesson}
              </Text>

              {group.rows.map((row, index) => (
                <View key={row.id}>
                  {index > 0 ? <Separator /> : null}
                  <AttendanceRowView row={row} onOpenFocus={() => setFocusTarget(row)} />
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      <Sheet
        open={Boolean(focusTarget)}
        onClose={() => setFocusTarget(null)}
        title="Fokus jurnali"
        description={focusTarget ? `${focusTarget.child} · ${focusTarget.lesson}` : undefined}
      >
        {focusTarget ? <FocusDetail focus={focusTarget.focus} /> : null}
      </Sheet>
    </Screen>
  );
}

function AttendanceRowView({
  row,
  onOpenFocus,
}: {
  row: AttendanceRow;
  onOpenFocus: () => void;
}) {
  const { palette } = useTheme();

  return (
    <View style={styles.row}>
      <View style={styles.rowHead}>
        <Text variant="caption" tone="muted" style={styles.rowChild}>
          {row.child}
        </Text>
        <Badge
          label={row.status === "active" ? "Darsda" : "Tugagan"}
          tone={row.status === "active" ? "success" : "neutral"}
        />
      </View>

      <View style={styles.metrics}>
        <Metric label="Kirish" value={row.entered} />
        <Metric label="Chiqish" value={row.exited} />
        <Metric
          label="Davomiylik"
          value={row.duration}
          icon={<Clock3 size={13} color={palette["muted-foreground"]} />}
        />
      </View>

      <View style={styles.metrics}>
        <Metric
          label="Diqqat tekshiruvi"
          value={`${row.attentionAnswered}/${row.attentionTotal}`}
        />
      </View>

      {/* Fokus jurnali — `EduTech.docx` ning asosiy ota-ona talabi. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Fokus jurnalini ochish"
        onPress={onOpenFocus}
        disabled={row.focus.exits === 0}
        style={({ pressed }) => [
          styles.focus,
          {
            backgroundColor: row.focus.alert
              ? palette["destructive-soft"]
              : row.focus.exits === 0
                ? palette["success-soft"]
                : palette["warning-soft"],
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        {row.focus.alert ? <ShieldAlert size={14} color={palette["destructive-strong"]} /> : null}
        <Text
          variant="caption"
          style={{
            flex: 1,
            color: row.focus.alert
              ? palette["destructive-strong"]
              : row.focus.exits === 0
                ? palette["success-strong"]
                : palette["warning-strong"],
          }}
        >
          {row.focus.exits === 0
            ? "Darsdan chiqmagan"
            : `${row.focus.exits} marta chiqqan · ${formatDuration(row.focus.awaySeconds)}`}
        </Text>
        {row.focus.exits > 0 ? (
          <ChevronRight size={15} color={palette["muted-foreground"]} />
        ) : null}
      </Pressable>
    </View>
  );
}

function FocusDetail({ focus }: { focus: FocusJournal }) {
  const { palette } = useTheme();

  return (
    <View style={styles.focusDetail}>
      {focus.alert ? (
        <View style={[styles.alert, { backgroundColor: palette["destructive-soft"] }]}>
          <ShieldAlert size={16} color={palette["destructive-strong"]} />
          <Text variant="caption" style={{ flex: 1, color: palette["destructive-strong"] }}>
            Chiqishlar soni chegaradan oshgan — sizga xabar yuborilgan.
          </Text>
        </View>
      ) : null}

      <View style={styles.focusStats}>
        <Metric label="Chiqishlar" value={String(focus.exits)} />
        <Metric label="Jami yo'qlik" value={formatDuration(focus.awaySeconds)} />
        <Metric label="Eng uzun" value={formatDuration(focus.longestSeconds)} />
      </View>

      <Text variant="label">Tafsilot</Text>
      {focus.timeline.map((exit, index) => (
        <View key={`${exit.leftAt}-${index}`} style={styles.timelineRow}>
          <ChevronDown size={14} color={palette["muted-foreground"]} />
          <View style={styles.timelineBody}>
            <Text variant="caption">
              Chiqdi: {formatDateTime(exit.leftAt)}
            </Text>
            <Text variant="caption" tone="muted">
              {exit.returnedAt
                ? `Qaytdi: ${formatDateTime(exit.returnedAt)} · ${formatDuration(exit.seconds)}`
                : "Qaytmagan"}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <View style={styles.metric}>
      <View style={styles.metricValue}>
        {icon}
        <Text variant="label">{value}</Text>
      </View>
      <Text variant="caption" tone="muted">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 12, paddingBottom: 40 },
  head: { gap: 4, paddingTop: 8 },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: 14,
    gap: 10,
  },
  row: { gap: 10, paddingVertical: 8 },
  rowHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowChild: { flex: 1 },
  metrics: { flexDirection: "row", gap: 20, flexWrap: "wrap" },
  metric: { gap: 2 },
  metricValue: { flexDirection: "row", alignItems: "center", gap: 5 },
  focus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: radius.sm,
  },
  focusDetail: { gap: 14 },
  alert: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: radius.sm },
  focusStats: { flexDirection: "row", gap: 24, flexWrap: "wrap" },
  timelineRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  timelineBody: { flex: 1, gap: 2 },
});
