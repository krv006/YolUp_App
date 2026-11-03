import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { parentFamily, retryMinutes, useCancelLink, useRemindLink, type ParentLink } from "@/modules/parent";
import { formatLocalized } from "@/shared/lib";
import { ConfirmDialog, DsText, dsRadius, Icon, toast, useDs } from "@/shared/ui";

/**
 * Kutilayotgan bog'lanish so'rovi amallari — veb `pending-link-actions.tsx`:
 * eslatma yuborish (yaqinda yuborilgan bo'lsa "Eslatildi") va so'rovni bekor
 * qilish (tasdiqlash oynasi bilan). `block` — muddati va yonma-yon ikki
 * tugma, `inline` — kichik tugmalar.
 */
export function PendingLinkActions({ link, layout = "block" }: { link: ParentLink; layout?: "block" | "inline" }) {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const [now] = useState(() => Date.now());
  const [cancelling, setCancelling] = useState(false);
  const remind = useRemindLink();
  const cancel = useCancelLink();
  const name = link.student.name.split(" ")[0] || link.student.name;
  const reminded = remind.isSuccess || parentFamily.remindedRecently(link.remindedAt, now);
  const block = layout === "block";

  function sendReminder() {
    remind.mutate(link.id, {
      onSuccess: () => toast.success(t("pendingActions.remindDone", { name })),
      onError: (error) => {
        const minutes = retryMinutes(error);
        if (minutes === null) {
          toast.error(t("pendingActions.failed"));
          return;
        }
        const time =
          minutes >= 60 ? t("pendingActions.retryHours", { count: Math.ceil(minutes / 60) }) : t("pendingActions.retryMinutes", { count: minutes });
        toast.info(t("pendingActions.remindLimit", { time }));
      },
    });
  }

  const remindDisabled = reminded || remind.isPending;
  const remindButton = (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: remindDisabled }}
      disabled={remindDisabled}
      onPress={sendReminder}
      style={({ pressed }) => [
        block ? styles.blockButton : styles.inlineButton,
        { backgroundColor: ds.c["brand-subtle"], opacity: remindDisabled ? 0.6 : pressed ? 0.85 : 1 },
      ]}
    >
      <Icon name={reminded ? "check" : "notifications-active"} size={block ? 20 : 16} color={ds.c.brand} />
      <DsText v={block ? "button" : "caption-strong"} c="brand" numberOfLines={1}>
        {t(reminded ? "pendingActions.reminded" : "pendingActions.remind")}
      </DsText>
    </Pressable>
  );

  const cancelButton = (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: cancel.isPending }}
      disabled={cancel.isPending}
      onPress={() => setCancelling(true)}
      style={({ pressed }) => [
        block ? [styles.blockButton, { borderWidth: 1, borderColor: ds.c["line-strong"], backgroundColor: pressed ? ds.c["danger-bg"] : ds.c.surface }] : [styles.inlineButton, pressed && { backgroundColor: ds.c["danger-bg"] }],
        cancel.isPending && styles.faded,
      ]}
    >
      <Icon name="close" size={block ? 20 : 16} color={ds.c["error-text"]} />
      <DsText v={block ? "button" : "caption-strong"} c="error-text" numberOfLines={1}>
        {t("pendingActions.cancel")}
      </DsText>
    </Pressable>
  );

  return (
    <>
      {block ? (
        <View style={styles.block}>
          {link.expiresAt ? (
            <View style={styles.expires}>
              <Icon name="hourglass-empty" size={16} color={ds.c["icon-tertiary"]} />
              <DsText v="body-xs" c="ink-secondary" style={styles.grow}>
                {t("pendingActions.expires", { date: formatLocalized(link.expiresAt, "d MMMM") })}
              </DsText>
            </View>
          ) : null}
          <View style={styles.row}>
            {remindButton}
            {cancelButton}
          </View>
        </View>
      ) : (
        <View style={styles.inline}>
          {remindButton}
          {cancelButton}
        </View>
      )}
      <ConfirmDialog
        open={cancelling}
        onOpenChange={setCancelling}
        icon="link-off"
        title={t("pendingActions.cancelTitle")}
        description={t("pendingActions.cancelText", { name })}
        confirmLabel={t("pendingActions.cancelConfirm")}
        cancelLabel={t("pendingActions.cancelKeep")}
        pending={cancel.isPending}
        onConfirm={() =>
          cancel.mutate(link.id, {
            onSuccess: () => {
              setCancelling(false);
              toast.success(t("pendingActions.cancelDone"));
            },
            onError: () => toast.error(t("pendingActions.failed")),
          })
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  faded: { opacity: 0.6 },
  block: { alignSelf: "stretch", gap: 12 },
  expires: { flexDirection: "row", alignItems: "center", gap: 8 },
  row: { flexDirection: "row", gap: 8 },
  /* `h-11 min-w-0 flex-1 rounded-full px-3 text-button gap-2` */
  blockButton: { flex: 1, minWidth: 0, height: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 12, borderRadius: dsRadius.full },
  inline: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 4 },
  /* `h-9 rounded-full px-3 text-caption-strong gap-1.5` */
  inlineButton: { height: 36, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, borderRadius: dsRadius.full },
});
