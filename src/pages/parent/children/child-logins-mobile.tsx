import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { Redirect } from "expo-router";
import Svg, { Circle } from "react-native-svg";
import { useLoginHistory } from "@/modules/auth";
import { isConsentRequired, parentLogins, useSelectedChild, type DeviceKind, type LoginEntry, type LoginPeriod, type LoginTab } from "@/modules/parent";
import { ROUTES } from "@/shared/config";
import { formatLocalized, formatMessageTime } from "@/shared/lib";
import { DsText, dsRadius, Icon, MobileButton, MobileChoiceChips, MobilePageHeader, MobileRoundButton, Sheet, useDs, type IconName } from "@/shared/ui";
import { ParentLockedCard, ParentScreen, useParentBack } from "@/widgets/parent-shell";
import { ChildSessions } from "./child-sessions";
import { LoginDetail } from "./login-detail";
import { kindIcon } from "./login-format";

type Device = "all" | "phone" | "computer";
type Status = "all" | "suspicious";
const RADIUS = 24;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const KINDS: Record<Device, DeviceKind[]> = { all: ["phone", "tablet", "computer"], phone: ["phone", "tablet"], computer: ["computer"] };

/**
 * Farzand kirishlari — veb `child-logins-mobile.tsx`: xulosa halqasi
 * (shubhali kirishlar soni), faol sessiyalar, kunlar bo'yicha kirishlar
 * (notanish qurilma qizil) va pastki oynadagi filtr (davr, qurilma, holat).
 */
export function ChildLoginsMobile({ childId }: { childId: string }) {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const back = useParentBack(ROUTES.parent.child(childId));
  const { children, childrenQuery } = useSelectedChild();
  const child = children.find((item) => item.id === childId) ?? null;
  const history = useLoginHistory(childId, Boolean(child));
  const [now] = useState(() => Date.now());
  const [filter, setFilter] = useState<{ period: LoginPeriod; device: Device; status: Status }>({ period: "week", device: "all", status: "all" });
  const [draft, setDraft] = useState(filter);
  const [filterOpen, setFilterOpen] = useState(false);
  const [opened, setOpened] = useState<LoginEntry | null>(null);
  if (!childrenQuery.isLoading && !child && !childrenQuery.isError) return <Redirect href={ROUTES.parent.children as never} />;

  const logins: LoginEntry[] = history.data ?? [];
  const locked = isConsentRequired(history.error);
  const tab: LoginTab = filter.status === "suspicious" ? "suspicious" : filter.device === "all" ? "all" : filter.device;
  const visible = parentLogins.filterLogins(logins, { period: filter.period, tab, kinds: new Set(KINDS[filter.device]) }, now);
  const summary = parentLogins.loginSummary(logins, filter.period, now);
  const ok = summary.suspicious === 0;
  const today = new Date(now).toDateString();
  const yesterday = new Date(now - 86_400_000).toDateString();
  const groups = new Map<string, LoginEntry[]>();
  for (const entry of visible) {
    const key = new Date(entry.at).toDateString();
    groups.set(key, [...(groups.get(key) ?? []), entry]);
  }

  return (
    <ParentScreen onRefresh={() => history.refetch()}>
      <MobilePageHeader
        title={t("logins.title")}
        backLabel={t("profile.title")}
        onBack={back}
        action={
          logins.length ? (
            <MobileRoundButton
              icon="filter-list"
              label={t("logins.filter.title")}
              onPress={() => {
                setDraft(filter);
                setFilterOpen(true);
              }}
            />
          ) : undefined
        }
      />

      {history.isLoading ? <View style={[styles.skeleton, { backgroundColor: ds.c.surface }]} /> : null}

      {locked && child ? <ParentLockedCard childId={child.id} childName={child.name} /> : null}

      {!history.isLoading && !logins.length && !locked ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: ds.c["brand-subtle"] }]}>
            <Icon name="devices" size={30} color={ds.c.brand} />
          </View>
          <DsText v="title-lg" heading style={styles.center}>
            {t("logins.empty.title")}
          </DsText>
          <DsText v="body-sm" c="ink-secondary" style={styles.center}>
            {t("logins.empty.text")}
          </DsText>
        </View>
      ) : null}

      {logins.length ? (
        <>
          {/* `flex items-center gap-4 rounded-[20px] bg-surface p-4`, halqa `size-14` */}
          <View style={[styles.summary, { backgroundColor: ds.c.surface }]}>
            <View style={styles.ring}>
              <Svg width={56} height={56} viewBox="0 0 56 56" style={styles.ringSvg}>
                <Circle cx={28} cy={28} r={RADIUS} fill="none" strokeWidth={5} stroke={ok ? ds.c.success : ds.c["warning-bg"]} />
                {ok ? null : (
                  <Circle
                    cx={28}
                    cy={28}
                    r={RADIUS}
                    fill="none"
                    strokeWidth={5}
                    strokeLinecap="round"
                    stroke={ds.c.saffron}
                    strokeDasharray={`${Math.min(1, summary.suspicious / Math.max(summary.count, 1)) * CIRCUMFERENCE + 18} ${CIRCUMFERENCE}`}
                  />
                )}
              </Svg>
              <DsText v="title" c={ok ? "success-text" : "warning-text"}>
                {summary.suspicious}
              </DsText>
            </View>
            <View style={styles.grow}>
              <DsText v="title">{ok ? t("logins.summary.ok") : t("logins.summary.suspicious", { count: summary.suspicious })}</DsText>
              <DsText v="body-xs" c="ink-secondary">
                {t("logins.summary.stats", { period: t(`logins.periods.${filter.period}`), count: summary.count, devices: summary.devices })}
              </DsText>
            </View>
          </View>

          {child ? <ChildSessions childId={child.id} childName={child.name} enabled={!locked} /> : null}

          {[...groups.entries()].map(([key, entries]) => (
            <View key={key} style={styles.group}>
              <DsText v="body-sm" c="ink-secondary" style={styles.groupTitle}>
                {key === today ? t("logins.mobile.today") : key === yesterday ? t("logins.mobile.yesterday") : formatLocalized(entries[0].at, t("family.datePattern"))}
              </DsText>
              <View style={[styles.list, { backgroundColor: ds.c.surface }]}>
                {entries.map((entry, index) => (
                  <Pressable
                    key={entry.id}
                    accessibilityRole="button"
                    onPress={() => setOpened(entry)}
                    style={({ pressed }) => [
                      styles.row,
                      index < entries.length - 1 && { borderBottomWidth: 1, borderBottomColor: ds.c.line },
                      entry.isNewDevice ? { backgroundColor: ds.c["danger-bg"] } : pressed && { backgroundColor: ds.c.subtle },
                    ]}
                  >
                    <View style={[styles.rowIcon, entry.isNewDevice ? null : { backgroundColor: ds.c.subtle }]}>
                      <Icon name={kindIcon(entry) as IconName} size={22} color={ds.c[entry.isNewDevice ? "error-text" : "icon-secondary"]} />
                    </View>
                    <View style={styles.grow}>
                      <DsText v="title-sm" numberOfLines={1}>
                        {entry.device}
                      </DsText>
                      <DsText v="body-xs" c="ink-secondary" numberOfLines={1}>
                        {[entry.ip, entry.location, formatMessageTime(entry.at)].filter(Boolean).join(" · ")}
                      </DsText>
                    </View>
                    {entry.isNewDevice ? (
                      <View style={styles.newDevice}>
                        <Icon name="warning-fill" size={14} color={ds.c["error-text"]} />
                        <DsText v="caption-strong" c="error-text">
                          {t("logins.status.newDevice")}
                        </DsText>
                      </View>
                    ) : (
                      <DsText v="caption" c="ink-tertiary">
                        {formatMessageTime(entry.at)}
                      </DsText>
                    )}
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
          {!visible.length ? (
            <DsText v="body-sm" c="ink-tertiary" style={[styles.filtered, { backgroundColor: ds.c.surface }]}>
              {t("logins.filtered.text")}
            </DsText>
          ) : null}
        </>
      ) : null}

      <Sheet
        variant="app"
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title={t("logins.filter.title")}
        description={t("logins.mobile.filterHint")}
        footer={
          <>
            <MobileButton variant="secondary" label={t("logins.filter.clear")} onPress={() => setDraft({ period: "week", device: "all", status: "all" })} />
            <MobileButton
              label={t("logins.filter.apply")}
              onPress={() => {
                setFilter(draft);
                setFilterOpen(false);
              }}
            />
          </>
        }
      >
        <View style={styles.filters}>
          <View style={styles.filter}>
            <DsText v="body-sm" w="500">
              {t("logins.filter.period")}
            </DsText>
            <MobileChoiceChips
              items={["today", "week", "month"] as const}
              render={(id) => t(`logins.filter.periodShort.${id}`)}
              value={draft.period}
              onChange={(period) => setDraft((current) => ({ ...current, period }))}
            />
          </View>
          <View style={styles.filter}>
            <DsText v="body-sm" w="500">
              {t("logins.filter.kinds")}
            </DsText>
            <MobileChoiceChips
              items={["all", "phone", "computer"] as const}
              render={(id) => (id === "all" ? t("logins.tabs.all") : t(`logins.filter.kind.${id}`))}
              value={draft.device}
              onChange={(device) => setDraft((current) => ({ ...current, device }))}
            />
          </View>
          <View style={styles.filter}>
            <DsText v="body-sm" w="500">
              {t("logins.columns.status")}
            </DsText>
            <MobileChoiceChips
              items={["all", "suspicious"] as const}
              render={(id) => t(`logins.tabs.${id}`)}
              value={draft.status}
              onChange={(status) => setDraft((current) => ({ ...current, status }))}
            />
          </View>
        </View>
      </Sheet>
      <LoginDetail entry={opened} childId={childId} childName={child?.name ?? ""} onClose={() => setOpened(null)} />
    </ParentScreen>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  center: { textAlign: "center" },
  skeleton: { height: 256, borderRadius: 20 },
  empty: { alignItems: "center", gap: 12, paddingHorizontal: 24, paddingTop: 96 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  summary: { flexDirection: "row", alignItems: "center", gap: 16, padding: 16, borderRadius: 20 },
  ring: { width: 56, height: 56, alignItems: "center", justifyContent: "center" },
  ringSvg: { position: "absolute", transform: [{ rotate: "-90deg" }] },
  group: { gap: 8 },
  groupTitle: { paddingHorizontal: 4 },
  list: { overflow: "hidden", borderRadius: 20 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  rowIcon: { width: 44, height: 44, borderRadius: dsRadius.xl, alignItems: "center", justifyContent: "center" },
  newDevice: { flexShrink: 0, flexDirection: "row", alignItems: "center", gap: 4 },
  filtered: { paddingHorizontal: 16, paddingVertical: 32, textAlign: "center", borderRadius: 20, overflow: "hidden" },
  filters: { gap: 16, paddingBottom: 8 },
  filter: { gap: 8 },
});
