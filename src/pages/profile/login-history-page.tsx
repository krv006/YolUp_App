import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useLoginHistory, useLogoutOtherSessionsMutation } from "@/modules/auth";
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

function isPhone(device: string): boolean {
  return /iphone|android|ios|mobile|yolup/i.test(device);
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
 * Kirishlar tarixi — veb `login-history-page.tsx` (tor ekran): bugun, kecha
 * va avvalroq bo'limlari (qurilma, IP, vaqt; birinchisi "Shu qurilma"),
 * sahifalash va "Boshqa qurilmalardan chiqish".
 */
export function LoginHistoryPage() {
  const { t } = useTranslation("account");
  const ds = useDs();
  const logins = useLoginHistory(null, true);
  const logoutOthers = useLogoutOtherSessionsMutation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [page, setPage] = useState(1);

  const all = logins.data ?? [];
  const pages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const rows = all.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

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
      {logins.isLoading ? (
        <View style={styles.skeletons}>
          {Array.from({ length: 4 }, (_, index) => (
            <View key={index} style={[styles.skeleton, { backgroundColor: ds.c.surface }]} />
          ))}
        </View>
      ) : null}

      {GROUPS.map((group) => {
        const items = rows.filter((row) => groupOf(row.at) === group);
        if (!items.length) return null;
        return (
          <SettingsSection key={group} label={t(`page.${group}`)}>
            {items.map((row, index) => {
              const thisDevice = current === 1 && group === "todayGroup" && index === 0;
              const phone = isPhone(row.device);
              return (
                <SettingsRow
                  key={row.id}
                  icon={phone ? "person" : "settings"}
                  tone={thisDevice ? "bg-success-bg text-ink" : phone ? "bg-brand-subtle text-ink" : SETTINGS_TONES.brand}
                  title={row.device || "—"}
                  hint={row.ip}
                  right={
                    <DsText v="caption-strong" c={thisDevice ? "success-fg" : "ink"}>
                      {thisDevice ? t("page.thisDevice") : clock(row.at)}
                    </DsText>
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
  skeletons: { gap: 8 },
  skeleton: { height: 70, borderRadius: dsRadius.xl },
  pager: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  step: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  gap: { width: 24, textAlign: "center" },
  empty: { paddingHorizontal: 20, paddingVertical: 32, borderRadius: dsRadius.xl },
  logoutOthers: { height: 50, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 20, borderWidth: 1, borderRadius: 25 },
});
