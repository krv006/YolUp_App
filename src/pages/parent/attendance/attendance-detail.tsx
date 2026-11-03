import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { parentAttendance, type AttendanceEntry } from "@/modules/parent";
import { formatLocalized, formatMessageTime } from "@/shared/lib";
import { DsText, dsRadius, Icon, MobileButton, Sheet, useDs, type DsColor, type IconName } from "@/shared/ui";
import { stayLabel } from "./attendance-format";
import { subjectLook } from "./attendance-styles";

/** Kechikish / kelmaslik sababi va o'qituvchi izohi. */
function LessonNotes({ entry, teacher }: { entry: AttendanceEntry; teacher: string }) {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const reason = entry.row?.lateReason ?? "";
  const note = entry.row?.teacherNote ?? "";
  if (!reason && !note) return null;
  return (
    <>
      {reason ? (
        <View style={[styles.reason, { backgroundColor: ds.c["warning-bg"] }]}>
          <Icon name={entry.status === "missed" ? "cancel" : "schedule"} size={20} color={ds.c["warning-text"]} />
          <View style={styles.grow}>
            <DsText v="caption-strong" c="warning-text">
              {t(entry.status === "missed" ? "attendanceView.detail.missedReason" : "attendanceView.detail.lateReason")}
            </DsText>
            <DsText v="body-sm" c="warning-text">
              {reason}
            </DsText>
          </View>
        </View>
      ) : null}
      {note ? (
        <View style={[styles.note, { borderColor: ds.c.line }]}>
          <View style={styles.noteHead}>
            <Icon name="chat-outline" size={16} color={ds.c["ink-secondary"]} />
            <DsText v="caption-strong" c="ink-secondary">
              {teacher ? t("attendanceView.detail.teacherNoteBy", { teacher }) : t("attendanceView.detail.teacherNote")}
            </DsText>
          </View>
          <DsText v="body-sm">{note}</DsText>
        </View>
      ) : null}
    </>
  );
}

/**
 * Dars davomati tafsiloti — veb `attendance-detail.tsx` (`AppDialog
 * variant="panel"`, telefonda pastki oyna): kirish, davomiylik, chiqish,
 * fokus / chalg'ish chizig'i, fokus, diqqat tekshiruvi va chiqishlar soni,
 * sabab va o'qituvchi izohi.
 */
export function AttendanceDetail({
  entry,
  teacher,
  subject,
  now,
  onClose,
}: {
  entry: AttendanceEntry | null;
  teacher: string;
  subject: string;
  now: number;
  onClose: () => void;
}) {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const look = subjectLook(subject);
  const row = entry?.row ?? null;
  const segments = entry ? parentAttendance.exitSegments(entry) : [];
  const when = entry ? formatLocalized(entry.lesson.startsAt, t("attendanceView.detail.datePattern")) : "";

  const cards: Array<{ icon: IconName; bg: DsColor; fg: DsColor; value: string; label: string }> = row
    ? [
        { icon: "visibility", bg: "accent-blue-bg", fg: "accent-blue-fg", value: entry?.focus == null ? "—" : `${entry.focus}%`, label: t("attendanceView.detail.focus") },
        {
          icon: "fact-check",
          bg: "accent-green-bg",
          fg: "accent-green-fg",
          value: row.attentionTotal ? `${row.attentionAnswered}/${row.attentionTotal}` : "—",
          label: t("attendanceView.detail.attention"),
        },
        { icon: "warning", bg: "accent-saffron-bg", fg: "accent-saffron-fg", value: String(row.focus.exits), label: t("attendanceView.detail.exits") },
      ]
    : [];

  return (
    <Sheet
      variant="app"
      open={Boolean(entry)}
      onClose={onClose}
      headingTitle="semibold"
      icon={
        <View style={[styles.tile, { backgroundColor: ds.c[look.bg] }]}>
          <Icon name={look.icon} size={24} color={ds.c[look.fg]} />
        </View>
      }
      title={entry?.lesson.courseTitle ?? ""}
      description={[when, teacher].filter(Boolean).join(" · ")}
      footer={<MobileButton variant="secondary" label={t("attendanceView.detail.close")} onPress={onClose} />}
    >
      {entry ? (
        row?.joinedAt ? (
          <View style={styles.body}>
            <View style={[styles.timeline, { backgroundColor: ds.c.subtle }]}>
              <View style={styles.times}>
                <View style={styles.time}>
                  <DsText v="caption" c="ink-secondary">
                    {t("attendanceView.detail.in")}
                  </DsText>
                  <DsText v="title">{formatMessageTime(row.joinedAt)}</DsText>
                </View>
                <View style={[styles.time, styles.timeCenter]}>
                  <DsText v="caption" c="ink-secondary">
                    {t("attendanceView.detail.duration")}
                  </DsText>
                  <DsText v="title">{stayLabel(entry, now, t)}</DsText>
                </View>
                <View style={[styles.time, styles.timeEnd]}>
                  <DsText v="caption" c="ink-secondary">
                    {t("attendanceView.detail.out")}
                  </DsText>
                  <DsText v="title">{row.leftAt ? formatMessageTime(row.leftAt) : "—"}</DsText>
                </View>
              </View>
              {/* `flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full` */}
              <View style={styles.bar}>
                {segments.map((segment) => (
                  <View
                    key={`${segment.from}-${segment.to}`}
                    style={[styles.segment, { width: `${(segment.to - segment.from) * 100}%`, backgroundColor: ds.c[segment.away ? "danger" : "success"] }]}
                  />
                ))}
              </View>
              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: ds.c.success }]} />
                  <DsText v="caption" c="ink-secondary">
                    {t("attendanceView.detail.focused")}
                  </DsText>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: ds.c.danger }]} />
                  <DsText v="caption" c="ink-secondary">
                    {t("attendanceView.detail.away")}
                  </DsText>
                </View>
              </View>
            </View>

            <View style={styles.cards}>
              {cards.map((card) => (
                <View key={card.label} style={[styles.card, { borderColor: ds.c.line }]}>
                  <View style={[styles.cardIcon, { backgroundColor: ds.c[card.bg] }]}>
                    <Icon name={card.icon} size={18} color={ds.c[card.fg]} />
                  </View>
                  <DsText v="h2" heading w="600" style={styles.cardValue}>
                    {card.value}
                  </DsText>
                  <DsText v="caption" c="ink-secondary" numberOfLines={1}>
                    {card.label}
                  </DsText>
                </View>
              ))}
            </View>
            <LessonNotes entry={entry} teacher={teacher} />
          </View>
        ) : (
          <View style={styles.body}>
            <View style={[styles.absent, { backgroundColor: ds.c.subtle }]}>
              <Icon name={entry.status === "upcoming" ? "schedule" : "cancel"} size={20} color={ds.c["ink-secondary"]} />
              <DsText v="body-sm" c="ink-secondary" style={styles.grow}>
                {entry.status === "upcoming"
                  ? t("attendanceView.detail.upcoming", { time: formatMessageTime(entry.lesson.startsAt) })
                  : t("attendanceView.detail.notJoined")}
              </DsText>
            </View>
            <LessonNotes entry={entry} teacher={teacher} />
          </View>
        )
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  tile: { width: 48, height: 48, borderRadius: dsRadius["2xl"], alignItems: "center", justifyContent: "center" },
  body: { gap: 16, paddingBottom: 8 },
  timeline: { gap: 12, padding: 16, borderRadius: dsRadius["2xl"] },
  times: { flexDirection: "row", gap: 8 },
  time: { flex: 1 },
  timeCenter: { alignItems: "center" },
  timeEnd: { alignItems: "flex-end" },
  bar: { height: 10, flexDirection: "row", gap: 2, overflow: "hidden", borderRadius: 5 },
  segment: { height: "100%", borderRadius: 5 },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  cards: { flexDirection: "row", gap: 12 },
  card: { flex: 1, minWidth: 0, gap: 8, padding: 14, borderWidth: 1, borderRadius: dsRadius["2xl"] },
  cardIcon: { width: 32, height: 32, borderRadius: dsRadius.lg, alignItems: "center", justifyContent: "center" },
  cardValue: { lineHeight: 28 },
  absent: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: dsRadius["2xl"] },
  reason: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderRadius: dsRadius["2xl"] },
  note: { gap: 8, padding: 16, borderWidth: 1, borderRadius: dsRadius["2xl"] },
  noteHead: { flexDirection: "row", alignItems: "center", gap: 8 },
});
