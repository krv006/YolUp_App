import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useEndChildSession, useRecognizeLogin, type LoginEntry } from "@/modules/parent";
import { formatDayTime } from "@/shared/lib";
import { DsGradient, DsText, dsRadius, Icon, Sheet, toast, useDs, type IconName } from "@/shared/ui";
import { kindIcon } from "./login-format";

function durationLabel(seconds: number, t: (key: string, options?: Record<string, unknown>) => string): string {
  const minutes = Math.max(1, Math.round(seconds / 60));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? t("home.recent.durationHours", { h, m }) : t("home.recent.durationMinutes", { m });
}

/**
 * Kirish tafsiloti — veb `child-logins.tsx` `LoginDetail` (`AppDialog
 * variant="panel"`, telefonda pastki oyna): joylashuv, qurilma, brauzer,
 * IP, vaqt va sessiya; notanish qurilmada ogohlantirish va "Bu {ism}"
 * (tanish deb belgilash), faol sessiyada "Sessiyani yopish".
 */
export function LoginDetail({ entry, childId, childName, onClose }: { entry: LoginEntry | null; childId: string; childName: string; onClose: () => void }) {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const recognize = useRecognizeLogin();
  const endSession = useEndChildSession(childId);
  const [browser, system] = (entry?.device ?? "").split(" · ");
  const first = childName.split(" ")[0] || childName;
  const rows = entry
    ? [
        { label: t("logins.detail.device"), value: entry.os || system || entry.device },
        { label: t("logins.detail.browser"), value: entry.browser || (system ? browser : "—") },
        { label: t("logins.detail.ip"), value: entry.ip || "—" },
        { label: t("logins.detail.location"), value: entry.location || "—" },
        { label: t("logins.detail.time"), value: formatDayTime(entry.at) },
        ...(entry.durationSeconds ? [{ label: t("logins.detail.duration"), value: durationLabel(entry.durationSeconds, t) }] : []),
        ...(entry.sessionActive !== null && entry.sessionActive !== undefined
          ? [{ label: t("logins.detail.session"), value: t(entry.sessionActive ? "logins.detail.sessionActive" : "logins.detail.sessionEnded") }]
          : []),
      ]
    : [];
  const canRecognize = Boolean(entry?.isNewDevice && entry.loginId);
  const canEnd = Boolean(entry?.sessionActive && entry.sessionId);
  const pending = recognize.isPending || endSession.isPending;

  return (
    <Sheet
      variant="app"
      open={Boolean(entry)}
      onClose={onClose}
      headingTitle="semibold"
      icon={
        <View style={[styles.tile, { backgroundColor: ds.c[entry?.isNewDevice ? "danger-bg" : "brand-subtle"] }]}>
          <Icon name={(entry ? kindIcon(entry) : "smartphone") as IconName} size={24} color={ds.c[entry?.isNewDevice ? "error-text" : "brand"]} />
        </View>
      }
      title={entry?.isNewDevice ? t("logins.detail.newTitle") : t("logins.detail.title")}
      description={entry ? t("logins.detail.subtitle", { name: first, when: formatDayTime(entry.at) }) : ""}
      footer={
        <View style={styles.footer}>
          {canEnd ? (
            <Pressable
              accessibilityRole="button"
              disabled={pending}
              onPress={() =>
                entry?.sessionId &&
                endSession.mutate(entry.sessionId, {
                  onSuccess: () => {
                    toast.success(t("logins.detail.ended"));
                    onClose();
                  },
                  onError: () => toast.error(t("logins.detail.failed")),
                })
              }
              style={({ pressed }) => [
                styles.button,
                { borderWidth: 1, borderColor: ds.c["line-strong"], backgroundColor: pressed ? ds.c["danger-bg"] : ds.c.surface },
                pending && styles.faded,
              ]}
            >
              <Icon name="logout" size={18} color={ds.c["error-text"]} />
              <DsText v="title-sm" c="error-text">
                {t("logins.detail.endSession")}
              </DsText>
            </Pressable>
          ) : null}
          {canRecognize ? (
            <Pressable
              accessibilityRole="button"
              disabled={pending}
              onPress={() =>
                entry?.loginId &&
                recognize.mutate(entry.loginId, {
                  onSuccess: () => {
                    toast.success(t("logins.detail.recognized"));
                    onClose();
                  },
                  onError: () => toast.error(t("logins.detail.failed")),
                })
              }
              style={({ pressed }) => [styles.button, { backgroundColor: pressed ? ds.c["brand-strong"] : ds.c.brand }, pending && styles.faded]}
            >
              <Icon name="check" size={18} color={ds.c["on-action"]} />
              <DsText v="title-sm" c="on-action">
                {t("logins.detail.recognize", { name: first })}
              </DsText>
            </Pressable>
          ) : null}
          {!canRecognize && !canEnd ? (
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={({ pressed }) => [styles.button, { borderWidth: 1, borderColor: ds.c["line-strong"], backgroundColor: pressed ? ds.c.subtle : ds.c.surface }]}
            >
              <DsText v="title-sm">{t("logins.detail.close")}</DsText>
            </Pressable>
          ) : null}
        </View>
      }
    >
      {entry ? (
        <View style={styles.body}>
          {/* `h-[140px] rounded-2xl bg-page-gradient`, markazda joylashuv belgisi */}
          <View style={styles.map}>
            <DsGradient name="page" />
            <View style={[styles.pin, { backgroundColor: ds.c.surface, boxShadow: ds.shadow.sm }]}>
              <Icon name="location-on" size={22} color={ds.c["error-text"]} />
            </View>
            <DsText v="caption" c="ink-secondary">
              {entry.location || t("logins.detail.unknownLocation")}
            </DsText>
          </View>
          <View style={[styles.rows, { backgroundColor: ds.c.subtle }]}>
            {rows.map((row) => (
              <View key={row.label} style={styles.detailRow}>
                <DsText v="body-sm" c="ink-secondary">
                  {row.label}
                </DsText>
                <DsText v="body-sm" w="500" numberOfLines={1} style={styles.value}>
                  {row.value}
                </DsText>
              </View>
            ))}
          </View>
          {entry.isNewDevice ? (
            <View style={[styles.warning, { backgroundColor: ds.c["danger-bg"] }]}>
              <Icon name="shield" size={20} color={ds.c["error-text"]} />
              <DsText v="body-sm" c="error-text" style={styles.grow}>
                {t("logins.detail.warning", { name: first })}
              </DsText>
            </View>
          ) : null}
        </View>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  faded: { opacity: 0.5 },
  tile: { width: 48, height: 48, borderRadius: dsRadius["2xl"], alignItems: "center", justifyContent: "center" },
  /* Pastki qator `flex-col-reverse` (vebdagi tartib: yopish, keyin tanish) — "Bu {ism}" tepada. */
  footer: { flex: 1, flexDirection: "column-reverse", gap: 12 },
  button: { height: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 16, borderRadius: dsRadius.full },
  body: { gap: 16, paddingBottom: 8 },
  map: { height: 140, overflow: "hidden", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: dsRadius["2xl"] },
  pin: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  rows: { gap: 12, padding: 16, borderRadius: dsRadius["2xl"] },
  detailRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 },
  value: { flexShrink: 1, textAlign: "right" },
  warning: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderRadius: dsRadius["2xl"] },
});
