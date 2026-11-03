import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { parentAttendance, type AttendanceEntry, type AttendancePeriod, type AttendanceStatus } from "@/modules/parent";
import { ROUTES } from "@/shared/config";
import { formatLocalized, formatMessageTime } from "@/shared/lib";
import { useOnlineStatus } from "@/shared/model";
import {
  DsText,
  Icon,
  MobileButton,
  MobileChoiceChips,
  MobileEmptyCard,
  MobileFieldLabel,
  MobilePickerField,
  MobileRoundButton,
  MobileSegment,
  MobileTitleHeader,
  Sheet,
  useDs,
} from "@/shared/ui";
import { ParentErrorBanner, ParentLockedCard, ParentScreen } from "@/widgets/parent-shell";
import { lessonEnd } from "../dashboard/home-format";
import { MobileConnect } from "../dashboard/parent-home-mobile";
import { AttendanceDetail } from "./attendance-detail";
import { stayLabel } from "./attendance-format";
import { DateTile, StatusChip } from "./attendance-parts";
import { AttendanceReport } from "./attendance-report";
import { DEFAULT_STATUSES } from "./attendance-styles";
import { AttendanceDonut } from "./attendance-summary";
import { useAttendanceView } from "./use-attendance-view";

type StatusFilter = "all" | "attended" | "late" | "missed";

/** Dars qatori — sana katagi, kurs nomi, kirish-chiqish va holat chipi. */
export function AttendanceRowMobile({ entry, now, last, onOpen }: { entry: AttendanceEntry; now: number; last: boolean; onOpen: (entry: AttendanceEntry) => void }) {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const row = entry.row;
  const meta =
    entry.status === "live" && row?.joinedAt
      ? t("mobile.attendance.since", { time: formatMessageTime(row.joinedAt), duration: stayLabel(entry, now, t) })
      : row?.joinedAt
        ? `${formatMessageTime(row.joinedAt)} → ${row.leftAt ? formatMessageTime(row.leftAt) : "…"} · ${stayLabel(entry, now, t)}`
        : `${formatMessageTime(entry.lesson.startsAt)} – ${formatMessageTime(lessonEnd(entry.lesson))}${entry.status === "missed" ? ` · ${t("mobile.attendance.absent")}` : ""}`;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onOpen(entry)}
      style={({ pressed }) => [styles.row, !last && { borderBottomWidth: 1, borderBottomColor: ds.c.line }, pressed && { backgroundColor: ds.c.subtle }]}
    >
      <DateTile value={entry.lesson.startsAt} status={entry.status} />
      <View style={styles.grow}>
        <DsText v="title-sm" numberOfLines={1}>
          {entry.lesson.courseTitle}
        </DsText>
        <DsText v="body-xs" c="ink-secondary" numberOfLines={1}>
          {meta}
        </DsText>
      </View>
      <StatusChip status={entry.status} lateMinutes={entry.lateMinutes} />
    </Pressable>
  );
}

/** Darslar ro'yxati kartasi — `flex flex-col overflow-hidden rounded-[20px] bg-surface`. */
export function AttendanceList({ entries, now, onOpen }: { entries: AttendanceEntry[]; now: number; onOpen: (entry: AttendanceEntry) => void }) {
  const ds = useDs();
  return (
    <View style={[styles.list, { backgroundColor: ds.c.surface }]}>
      {entries.map((entry, index) => (
        <AttendanceRowMobile key={entry.lesson.id} entry={entry} now={now} last={index === entries.length - 1} onOpen={onOpen} />
      ))}
    </View>
  );
}

/**
 * Davomat — veb `attendance-mobile.tsx`: davr segmenti (hafta / oy / hammasi),
 * xulosa halqasi, oy sarlavhasi va kalendar havolasi, darslar ro'yxati;
 * sarlavhada qidiruv, filtr (davr, guruh, holat) va hisobot yuklash.
 */
export function AttendanceMobile() {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const router = useRouter();
  const online = useOnlineStatus();
  const view = useAttendanceView();
  const [period, setPeriod] = useState<AttendancePeriod>("month");
  const [courseId, setCourseId] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [draft, setDraft] = useState({ period, courseId, status });
  const [filterOpen, setFilterOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [opened, setOpened] = useState<AttendanceEntry | null>(null);

  const statuses = new Set<AttendanceStatus>(status === "all" ? DEFAULT_STATUSES : [status]);
  const filtered = parentAttendance.filterEntries(view.entries, { period, courseId, statuses, query: "" }, view.now);
  const stats = parentAttendance.attendanceStats(filtered);
  const filtersOn = courseId !== null || status !== "all";
  const groupOptions = [{ value: "", label: t("attendanceView.filter.allGroups") }, ...view.groups.map((group) => ({ value: group.id, label: group.title }))];

  return (
    <ParentScreen tabs onRefresh={async () => view.retry()}>
      <MobileTitleHeader
        eyebrow={t("attendanceView.eyebrow")}
        title={t("attendanceView.title")}
        action={
          <View style={styles.actions}>
            {view.locked ? null : (
              <MobileRoundButton icon="search" label={t("attendanceView.search")} background="surface" onPress={() => router.push(ROUTES.parent.attendanceSearch as never)} />
            )}
            {view.entries.length ? (
              <>
                <MobileRoundButton
                  icon="tune"
                  iconNode={<Icon name="tune" size={22} color={filtersOn ? ds.c.brand : ds.c.ink} />}
                  label={t("attendanceView.filter.title")}
                  background={filtersOn ? "brand-subtle" : "surface"}
                  onPress={() => {
                    setDraft({ period, courseId, status });
                    setFilterOpen(true);
                  }}
                />
                <MobileRoundButton icon="download" label={t("attendanceView.reportButton")} background="surface" onPress={() => setReportOpen(true)} />
              </>
            ) : null}
          </View>
        }
      />
      {view.locked ? null : (
        <MobileSegment
          items={(["week", "month", "all"] as const).map((id) => ({ id, label: t(`attendanceView.periods.${id}`) }))}
          value={period === "quarter" ? "all" : period}
          onChange={setPeriod}
        />
      )}
      {online && view.failed ? <ParentErrorBanner onRetry={view.retry} /> : null}

      {view.loading ? (
        <View style={styles.stack}>
          <View style={[styles.skeleton, { height: 150, backgroundColor: ds.c.surface }]} />
          <View style={[styles.skeleton, { height: 280, backgroundColor: ds.c.surface }]} />
        </View>
      ) : !view.child ? (
        <MobileConnect />
      ) : view.locked ? (
        <ParentLockedCard childId={view.child.id} childName={view.child.name} />
      ) : !view.entries.length ? (
        view.failed ? (
          <MobileEmptyCard
            icon="warning"
            title={t("mobile.attendance.failedTitle")}
            description={t("mobile.attendance.failedText")}
            action={{ label: t("mobile.attendance.reload"), icon: "refresh", onPress: view.retry }}
          />
        ) : (
          <MobileEmptyCard icon="event-repeat" title={t("attendanceView.empty.title")} description={t("attendanceView.empty.text")} />
        )
      ) : (
        <>
          <AttendanceDonut stats={stats} />
          <View style={styles.monthRow}>
            <DsText v="title-lg" heading style={styles.grow}>
              {formatLocalized(view.now, "LLLL, yyyy")}
            </DsText>
            <Pressable accessibilityRole="link" hitSlop={8} onPress={() => router.push(ROUTES.parent.attendanceCalendar as never)}>
              <DsText v="body-sm" w="500" c="brand">
                {t("attendanceView.calendar.calendar")}
              </DsText>
            </Pressable>
          </View>
          {filtered.length ? (
            <AttendanceList entries={filtered} now={view.now} onOpen={setOpened} />
          ) : (
            <MobileEmptyCard icon="filter-list" title={t("attendanceView.filtered.title")} description={t("attendanceView.filtered.text")} />
          )}
        </>
      )}

      <Sheet
        variant="app"
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title={t("attendanceView.filter.title")}
        description={t("mobile.attendance.filterHint")}
        footer={
          <>
            <MobileButton variant="secondary" label={t("attendanceView.filter.clear")} onPress={() => setDraft({ period: "month", courseId: null, status: "all" })} />
            <MobileButton
              label={t("attendanceView.filter.apply")}
              onPress={() => {
                setPeriod(draft.period);
                setCourseId(draft.courseId);
                setStatus(draft.status);
                setFilterOpen(false);
              }}
            />
          </>
        }
      >
        <View style={styles.filters}>
          <View style={styles.filter}>
            <DsText v="body-sm" w="500">
              {t("attendanceView.filter.period")}
            </DsText>
            <MobileChoiceChips
              items={["week", "month", "quarter"] as const}
              value={draft.period === "all" ? "quarter" : draft.period}
              render={(id) => t(`attendanceView.filter.periods.${id}`)}
              onChange={(value) => setDraft((current) => ({ ...current, period: value }))}
            />
          </View>
          <MobileFieldLabel label={t("attendanceView.filter.group")}>
            <MobilePickerField
              type="select"
              value={draft.courseId ?? ""}
              display={groupOptions.find((option) => option.value === (draft.courseId ?? ""))?.label ?? ""}
              options={groupOptions}
              ariaLabel={t("attendanceView.filter.group")}
              onChange={(value) => setDraft((current) => ({ ...current, courseId: value || null }))}
            />
          </MobileFieldLabel>
          <View style={styles.filter}>
            <DsText v="body-sm" w="500">
              {t("attendanceView.filter.status")}
            </DsText>
            {/* `grid grid-cols-2 gap-2`, tugma `h-11 rounded-full text-body-sm font-medium` */}
            <View style={styles.statusGrid}>
              {(["all", "attended", "late", "missed"] as const).map((id) => {
                const active = draft.status === id;
                return (
                  <Pressable
                    key={id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => setDraft((current) => ({ ...current, status: id }))}
                    style={[styles.statusButton, active ? { backgroundColor: ds.c.brand } : { borderWidth: 1, borderColor: ds.c["line-strong"], backgroundColor: ds.c.surface }]}
                  >
                    <DsText v="body-sm" w="500" c={active ? "on-action" : "ink"}>
                      {id === "all" ? t("attendanceView.periods.all") : t(`attendanceView.legend.${id}`)}
                    </DsText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Sheet>

      <AttendanceDetail
        entry={opened}
        teacher={opened ? (view.teachers.get(opened.lesson.courseId) ?? "") : ""}
        subject={opened ? (view.subjects.get(opened.lesson.courseId) ?? opened.lesson.courseTitle) : ""}
        now={view.now}
        onClose={() => setOpened(null)}
      />
      <AttendanceReport open={reportOpen} onOpenChange={setReportOpen} childName={view.child?.name ?? ""} entries={view.entries} teachers={view.teachers} now={view.now} />
    </ParentScreen>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  stack: { gap: 16 },
  skeleton: { borderRadius: 20 },
  actions: { flexDirection: "row", gap: 8 },
  monthRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 4 },
  list: { overflow: "hidden", borderRadius: 20 },
  /* `flex items-center gap-3 px-4 py-3.5` */
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  filters: { gap: 16, paddingBottom: 8 },
  filter: { gap: 8 },
  statusGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statusButton: { width: "48.5%", flexGrow: 1, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 999 },
});
