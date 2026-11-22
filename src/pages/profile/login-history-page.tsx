import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useLoginDevicesPage, useLogoutOtherSessionsMutation, type LoginDevice, type LoginDeviceType } from "@/modules/auth";
import { ConfirmDialog, DsText, dsRadius, Icon, toast, useDs } from "@/shared/ui";
import { ProfileSubPage, SettingsRow, SettingsSection } from "./profile-shell";
import { SETTINGS_TONES } from "./settings-tones";

type GroupKey = "todayGroup" | "yesterdayGroup" | "earlierGroup";

const PAGE_SIZE = 10;
const GROUPS: GroupKey[] = ["todayGroup", "yesterdayGroup", "earlierGroup"];

function groupOf(value: string): GroupKey {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "earlierGroup";
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (date.getTime() >= start.getTime()) return "todayGroup";
  if (date.getTime() >= start.getTime() - 86_400_000) return "yesterdayGroup";
  return "earlierGroup";
}

function clock(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function dayLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}`;
}

function lastSeen(value: string, group: GroupKey): string {
  return group === "earlierGroup" ? `${dayLabel(value)} ${clock(value)}` : clock(value);
}

function isPhone(row: LoginDevice): boolean {
  return row.deviceType ? row.deviceType !== "computer" : /iphone|android|ios|mobile|yolup/i.test(row.device);
}

function deviceHint(row: LoginDevice, count: string): string {
  return [count, row.location, row.lastIp].filter(Boolean).join(" · ");
}

const KINDS: Array<LoginDeviceType | null> = [null, "phone", "tablet", "computer"];

/** Qurilma turi filtri — veb `DeviceFilter` (gorizontal aylanuvchi tugmalar). */
function DeviceFilter({ value, onChange }: { value: LoginDeviceType | null; onChange: (value: LoginDeviceType | null) => void }) {
  const { t } = useTranslation("account");
  const ds = useDs();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityLabel={t("page.deviceFilter")}
      style={styles.kindsScroll}
      contentContainerStyle={styles.kinds}
    >
      {KINDS.map((kind) => {
        const active = value === kind;
        return (
          <Pressable
            key={kind ?? "all"}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(kind)}
            style={({ pressed }) => [
              styles.kind,
              active
                ? { backgroundColor: ds.c.brand, borderColor: ds.c.brand }
                : { backgroundColor: pressed ? ds.c.subtle : ds.c.surface, borderColor: ds.c["line-strong"] },
            ]}
          >
            <DsText v="button" c={active ? "on-action" : "ink"}>
              {t(`page.deviceKinds.${kind ?? "all"}`)}
            </DsText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function pageList(page: number, pages: number): Array<number | "gap"> {
  const wanted = new Set([1, pages, page - 1, page, page + 1].filter((value) => value >= 1 && value <= pages));
  const sorted = [...wanted].sort((a, b) => a - b);
  return sorted.flatMap((value, index) => (index && value - sorted[index - 1]! > 1 ? ["gap" as const, value] : [value]));
}

function Pager({ page, pages, onChange }: { page: number; pages: number; onChange: (page: number) => void }) {
  const { t } = useTranslation("account");
  const ds = useDs();
  if (pages <= 1) return null;
  return (
    <View accessibilityLabel={t("page.pagination")} style={styles.pager}>
      <Pressable accessibilityRole="button" accessibilityLabel={t("page.prevPage")} disabled={page <= 1} onPress={() => onChange(page - 1)} style={[styles.step, { backgroundColor: ds.c.surface }, page <= 1 && styles.faded]}>
        <Icon name="chevron-left" size={20} color={ds.c.ink} />
      </Pressable>
      {pageList(page, pages).map((value, index) =>
        value === "gap" ? (
          <DsText key={`gap-${index}`} v="body-sm" c="ink-secondary" style={styles.gap}>
            …
          </DsText>
        ) : (
          <Pressable
            key={value}
            accessibilityRole="button"
            accessibilityState={{ selected: value === page }}
            onPress={() => onChange(value)}
            style={[styles.step, { backgroundColor: value === page ? ds.c.brand : ds.c.surface }]}
          >
            <DsText v="body-sm" w="600" c={value === page ? "ink-inverse" : "ink"}>
              {value}
            </DsText>
          </Pressable>
        )
      )}
      <Pressable accessibilityRole="button" accessibilityLabel={t("page.nextPage")} disabled={page >= pages} onPress={() => onChange(page + 1)} style={[styles.step, { backgroundColor: ds.c.surface }, page >= pages && styles.faded]}>
        <Icon name="chevron-right" size={20} color={ds.c.ink} />
      </Pressable>
    </View>
  );
}

/**
 * Kirishlar tarixi — veb `login-history-page.tsx` (tor ekran): qurilma turi
 * filtri, bugun, kecha va avvalroq bo'limlari (har qurilma bitta qator —
 * `?group=device`: kirishlar soni, joy, IP, oxirgi kirish, "Faol seans";
 * joriy qurilma "Shu qurilma"), sahifalash va "Boshqa qurilmalardan chiqish".
 */
export function LoginHistoryPage() {
  const { t } = useTranslation("account");
  const ds = useDs();
  // Veb #157/#159: sahifalash serverda; joriy qurilma `isCurrent` bilan keladi.
  const [page, setPage] = useState(1);
  const [kind, setKind] = useState<LoginDeviceType | null>(null);
  const logins = useLoginDevicesPage(page, PAGE_SIZE, kind);
  const logoutOthers = useLogoutOtherSessionsMutation();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const items = logins.data?.items ?? [];
  const pages = Math.max(1, logins.data?.totalPages ?? 1);
  const current = Math.min(page, pages);
  const rows = items.length > PAGE_SIZE ? items.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE) : items;
  const anyCurrent = items.some((row) => row.isCurrent);

  function changeKind(next: LoginDeviceType | null) {
    setKind(next);
    setPage(1);
  }

  function closeOthers() {
    logoutOthers.mutate(undefined, {
      onSuccess: (count) => {
        toast.success(t("page.otherSessionsClosed", { count }));
        setConfirmOpen(false);
      },
      onError: (error: Error) => toast.error(error.message),
    });
  }

  return (
    <ProfileSubPage title={t("page.loginsTitle")}>
      <DeviceFilter value={kind} onChange={changeKind} />

      {logins.isLoading ? (
        <View style={styles.skeletons}>
          {Array.from({ length: 4 }, (_, index) => (
            <View key={index} style={[styles.skeleton, { backgroundColor: ds.c.surface }]} />
          ))}
        </View>
      ) : null}

      {GROUPS.map((group) => {
        const items = rows.filter((row) => groupOf(row.lastLoginAt) === group);
        if (!items.length) return null;
        return (
          <SettingsSection key={group} label={t(`page.${group}`)}>
            {items.map((row, index) => {
              const thisDevice = anyCurrent ? row.isCurrent : !kind && current === 1 && group === "todayGroup" && index === 0;
              const phone = isPhone(row);
              return (
                <SettingsRow
                  key={row.id}
                  icon={phone ? "smartphone" : "laptop"}
                  tone={thisDevice ? "bg-success-bg text-ink" : phone ? "bg-brand-subtle text-ink" : SETTINGS_TONES.brand}
                  title={row.device || "—"}
                  hint={deviceHint(row, t("page.loginCount", { count: row.loginCount }))}
                  right={
                    thisDevice ? (
                      <DsText v="caption-strong" c="success-fg">
                        {t("page.thisDevice")}
                      </DsText>
                    ) : (
                      <View style={styles.seen}>
                        <DsText v="caption-strong">{lastSeen(row.lastLoginAt, group)}</DsText>
                        {row.sessionActive ? (
                          <DsText v="caption" c="success-fg">
                            {t("page.activeSession")}
                          </DsText>
                        ) : null}
                      </View>
                    )
                  }
                />
              );
            })}
          </SettingsSection>
        );
      })}

      <Pager page={current} pages={pages} onChange={setPage} />

      {!logins.isLoading && !rows.length ? (
        <View style={[styles.empty, { backgroundColor: ds.c.surface }]}>
          <DsText v="body-sm" c="ink-secondary" style={styles.center}>
            {t("page.noLogins")}
          </DsText>
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={() => setConfirmOpen(true)}
        style={({ pressed }) => [styles.logoutOthers, { borderColor: ds.c["line-strong"], backgroundColor: pressed ? ds.c.subtle : ds.c.surface }]}
      >
        <Icon name="logout" size={20} color={ds.c.ink} />
        <DsText v="title" w="600">
          {t("page.logoutOthers")}
        </DsText>
      </Pressable>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        icon="devices"
        title={t("page.logoutOthersTitle")}
        description={t("page.logoutOthersDescription")}
        confirmLabel={t("page.logout")}
        cancelLabel={t("page.cancel")}
        pending={logoutOthers.isPending}
        onConfirm={closeOthers}
      />
    </ProfileSubPage>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: "center" },
  faded: { opacity: 0.4 },
  /* `-mx-4 flex gap-2 overflow-x-auto px-4` */
  kindsScroll: { flexGrow: 0, marginHorizontal: -16 },
  kinds: { gap: 8, paddingHorizontal: 16 },
  /* `h-10 rounded-full border px-4 text-button` */
  kind: { height: 40, justifyContent: "center", paddingHorizontal: 16, borderWidth: 1, borderRadius: dsRadius.full },
  seen: { alignItems: "flex-end", gap: 2 },
  skeletons: { gap: 8 },
  skeleton: { height: 70, borderRadius: dsRadius.xl },
  pager: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  step: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  gap: { width: 24, textAlign: "center" },
  empty: { paddingHorizontal: 20, paddingVertical: 32, borderRadius: dsRadius.xl },
  logoutOthers: { height: 50, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 20, borderWidth: 1, borderRadius: 25 },
});
