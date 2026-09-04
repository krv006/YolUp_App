import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ChevronDown, ChevronRight, Clock3, ShieldAlert, UsersRound } from "lucide-react-native";
import { formatDateTime, formatDuration } from "@/shared/lib";
import type { AttendanceRow, FocusJournal } from "@/shared/types";
import {
  Avatar,
  Badge,
  radius,
  ScreenEmpty,
  Separator,
  Sheet,
  Text,
  useTheme,
  type BadgeTone,
} from "@/shared/ui";
import { groupAttendanceByLesson } from "../lib/group-by-lesson";

export interface AttendanceListProps {
  rows: AttendanceRow[];
  emptyLabel?: string;
}

/** Diqqat tekshiruviga javob ulushi; tekshiruv bo'lmasa foiz ko'rsatilmaydi. */
function attentionRate(answered: number, total: number): number | null {
  return total > 0 ? Math.round((answered / total) * 100) : null;
}

function rateTone(rate: number | null): BadgeTone {
  if (rate === null) return "neutral";
  if (rate >= 80) return "success";
  if (rate >= 50) return "warning";
  return "danger";
}

/**
 * Davomat — veb `attendance-accordion.tsx` ning mobil varianti.
 *
 * Dars bo'yicha yig'iladi: sarlavhada yig'ma ko'rsatkichlar, ichida o'sha
 * darsdagi o'quvchilar. Yassi jadvalda o'nlab qator aralashib ketardi;
 * guruhlash "shu darsda kim qanday qatnashdi" savoliga to'g'ridan-to'g'ri
 * javob beradi (veb'dagi bilan bir xil sabab).
 *
 * Birinchi (eng so'nggi) dars ochiq turadi — o'qituvchi odatda aynan uni
 * ko'rmoqchi bo'ladi.
 */
export function AttendanceList({ rows, emptyLabel }: AttendanceListProps) {
  const { palette } = useTheme();
  const groups = useMemo(() => groupAttendanceByLesson(rows), [rows]);
  const [openId, setOpenId] = useState<string | null>(() => groups[0]?.lessonId ?? null);
  const [focusTarget, setFocusTarget] = useState<AttendanceRow | null>(null);

  if (groups.length === 0) {
    return <ScreenEmpty title={emptyLabel ?? "Davomat yozuvi topilmadi"} />;
  }

  return (
    <>
      {groups.map((group) => {
        const open = openId === group.lessonId;
        const rate = attentionRate(group.attentionAnswered, group.attentionTotal);

        return (
          <View
            key={group.lessonId}
            style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: open }}
              onPress={() => setOpenId(open ? null : group.lessonId)}
              style={styles.head}
            >
              {open ? (
                <ChevronDown size={18} color={palette["muted-foreground"]} />
              ) : (
                <ChevronRight size={18} color={palette["muted-foreground"]} />
              )}

              <View style={styles.headBody}>
                <Text variant="label" numberOfLines={2}>
                  {group.lesson}
                </Text>
                <View style={styles.headMeta}>
                  <UsersRound size={13} color={palette["muted-foreground"]} />
                  <Text variant="caption" tone="muted">
                    {group.studentsCount}
                  </Text>
                  {group.startedAt ? (
                    <Text variant="caption" tone="muted">
                      · {formatDateTime(group.startedAt)}
                    </Text>
                  ) : null}
                </View>
              </View>

              {/* Chegaradan oshgan chiqishlar — o'qituvchi darhol ko'rsin. */}
              {group.hasAlert ? <ShieldAlert size={17} color={palette.destructive} /> : null}
              {rate !== null ? <Badge label={`${rate}%`} tone={rateTone(rate)} /> : null}
            </Pressable>

            {open
              ? group.rows.map((row, index) => (
                  <View key={row.id}>
                    {index === 0 ? <Separator /> : <Separator inset={48} />}
                    <StudentRow row={row} onOpenFocus={() => setFocusTarget(row)} />
                  </View>
                ))
              : null}
          </View>
        );
      })}

      <Sheet
        open={Boolean(focusTarget)}
        onClose={() => setFocusTarget(null)}
        title="Fokus jurnali"
        description={focusTarget ? `${focusTarget.child} · ${focusTarget.lesson}` : undefined}
      >
        {focusTarget ? <FocusDetail focus={focusTarget.focus} /> : null}
      </Sheet>
    </>
  );
}

function StudentRow({ row, onOpenFocus }: { row: AttendanceRow; onOpenFocus: () => void }) {
  const { palette } = useTheme();
  const rate = attentionRate(row.attentionAnswered, row.attentionTotal);

  return (
    <View style={styles.student}>
      <Avatar name={row.child} tone={row.student.avatarTone} size="md" />

      <View style={styles.studentBody}>
        <Text variant="label" numberOfLines={1}>
          {row.child}
        </Text>
        <View style={styles.studentMeta}>
          <Clock3 size={12} color={palette["muted-foreground"]} />
          <Text variant="caption" tone="muted">
            {row.entered} – {row.exited} · {row.duration}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fokus jurnalini ochish"
          disabled={row.focus.exits === 0}
          onPress={onOpenFocus}
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
          <Text
            variant="caption"
            style={{
              color: row.focus.alert
                ? palette["destructive-strong"]
                : row.focus.exits === 0
                  ? palette["success-strong"]
                  : palette["warning-strong"],
            }}
          >
            {row.focus.exits === 0
              ? "Chiqmagan"
              : `${row.focus.exits} chiqish · ${formatDuration(row.focus.awaySeconds)}`}
          </Text>
        </Pressable>
      </View>

      {rate !== null ? <Badge label={`${rate}%`} tone={rateTone(rate)} /> : null}
    </View>
  );
}

/** Fokus tafsiloti — ota-ona ekranidagi bilan bir xil ko'rinish. */
function FocusDetail({ focus }: { focus: FocusJournal }) {
  const { palette } = useTheme();

  return (
    <View style={styles.focusDetail}>
      {focus.alert ? (
        <View style={[styles.alert, { backgroundColor: palette["destructive-soft"] }]}>
          <ShieldAlert size={16} color={palette["destructive-strong"]} />
          <Text variant="caption" style={{ flex: 1, color: palette["destructive-strong"] }}>
            Chiqishlar soni chegaradan oshgan — ota-onaga xabar yuborilgan.
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
          <Text variant="caption">Chiqdi: {formatDateTime(exit.leftAt)}</Text>
          <Text variant="caption" tone="muted">
            {exit.returnedAt
              ? `Qaytdi: ${formatDateTime(exit.returnedAt)} · ${formatDuration(exit.seconds)}`
              : "Qaytmagan"}
          </Text>
        </View>
      ))}
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text variant="label">{value}</Text>
      <Text variant="caption" tone="muted">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    overflow: "hidden",
    marginBottom: 12,
  },
  head: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14 },
  headBody: { flex: 1, gap: 3 },
  headMeta: { flexDirection: "row", alignItems: "center", gap: 5 },
  student: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  studentBody: { flex: 1, gap: 5 },
  studentMeta: { flexDirection: "row", alignItems: "center", gap: 5 },
  focus: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.full },
  focusDetail: { gap: 14 },
  alert: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: radius.sm },
  focusStats: { flexDirection: "row", gap: 24, flexWrap: "wrap" },
  metric: { gap: 2 },
  timelineRow: { gap: 2, paddingVertical: 4 },
});
