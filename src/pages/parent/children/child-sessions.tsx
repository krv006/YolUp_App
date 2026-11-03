import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useChildSessions, useEndAllChildSessions, useEndChildSession } from "@/modules/parent";
import { formatRelativeShort } from "@/shared/lib";
import { ConfirmDialog, DsText, dsRadius, Icon, toast, useDs } from "@/shared/ui";

/**
 * Faol sessiyalar — veb `child-sessions.tsx`: har qurilma alohida yopiladi,
 * pastda "Hammasini yopish" (tasdiqlash bilan). Faol sessiya yo'q bo'lsa
 * blok chiqmaydi.
 */
export function ChildSessions({ childId, childName, enabled }: { childId: string; childName: string; enabled: boolean }) {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const sessions = useChildSessions(childId, enabled);
  const endOne = useEndChildSession(childId);
  const endAll = useEndAllChildSessions(childId);
  const [confirming, setConfirming] = useState(false);
  const active = (sessions.data ?? []).filter((session) => session.active);
  const name = childName.split(" ")[0] || childName;
  if (!active.length) return null;

  return (
    <View style={[styles.card, { backgroundColor: ds.c.surface }]}>
      <View style={styles.head}>
        <DsText v="title">{t("logins.sessions.title", { count: active.length })}</DsText>
        <DsText v="body-xs" c="ink-secondary">
          {t("logins.sessions.text", { name })}
        </DsText>
      </View>
      <View>
        {active.map((session, index) => (
          <View key={session.id} style={[styles.row, index < active.length - 1 && { borderBottomWidth: 1, borderBottomColor: ds.c.line }]}>
            <View style={[styles.icon, { backgroundColor: ds.c.subtle }]}>
              <Icon name={session.device_type === "computer" ? "laptop" : "smartphone"} size={20} color={ds.c["icon-secondary"]} />
            </View>
            <View style={styles.grow}>
              <DsText v="title-sm" numberOfLines={1}>
                {session.device || [session.browser, session.os].filter(Boolean).join(" · ")}
              </DsText>
              <DsText v="body-xs" c="ink-secondary" numberOfLines={1}>
                {[session.city, formatRelativeShort(session.last_active)].filter(Boolean).join(" · ")}
              </DsText>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("logins.sessions.end")}
              disabled={endOne.isPending}
              onPress={() =>
                endOne.mutate(session.id, {
                  onSuccess: () => toast.success(t("logins.detail.ended")),
                  onError: () => toast.error(t("logins.detail.failed")),
                })
              }
              style={({ pressed }) => [styles.end, { backgroundColor: pressed ? ds.c["danger-bg"] : ds.c.subtle }, endOne.isPending && styles.faded]}
            >
              <Icon name="logout" size={18} color={ds.c["icon-secondary"]} />
            </Pressable>
          </View>
        ))}
      </View>
      <Pressable
        accessibilityRole="button"
        disabled={endAll.isPending}
        onPress={() => setConfirming(true)}
        style={({ pressed }) => [
          styles.endAll,
          { borderColor: ds.c["line-strong"], backgroundColor: pressed ? ds.c["danger-bg"] : ds.c.surface },
          endAll.isPending && styles.faded,
        ]}
      >
        <Icon name="logout" size={18} color={ds.c["error-text"]} />
        <DsText v="button" c="error-text">
          {t("logins.sessions.endAll")}
        </DsText>
      </Pressable>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        icon="logout"
        title={t("logins.sessions.confirmTitle")}
        description={t("logins.sessions.confirmText", { name })}
        confirmLabel={t("logins.sessions.confirm")}
        cancelLabel={t("logins.sessions.cancel")}
        pending={endAll.isPending}
        onConfirm={() =>
          endAll.mutate(undefined, {
            onSuccess: (result) => {
              setConfirming(false);
              toast.success(t("logins.sessions.endedAll", { count: result?.ended ?? active.length }));
            },
            onError: () => toast.error(t("logins.detail.failed")),
          })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  faded: { opacity: 0.5 },
  card: { gap: 12, padding: 20, borderRadius: 20 },
  head: { gap: 2 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  icon: { width: 40, height: 40, borderRadius: dsRadius.xl, alignItems: "center", justifyContent: "center" },
  end: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  endAll: { height: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderRadius: dsRadius.full },
});
