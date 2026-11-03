import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { parentFamily, useParentConsents, useSetParentConsent, type ConsentKind } from "@/modules/parent";
import { ConfirmDialog, DsText, dsRadius, Icon, Switch, toast, useDs, type DsColor, type IconName } from "@/shared/ui";

const CONSENTS: Array<{ kind: ConsentKind; icon: IconName; bg: DsColor; fg: DsColor }> = [
  { kind: "recording", icon: "videocam-fill", bg: "accent-blue-bg", fg: "accent-blue-fg" },
  { kind: "camera", icon: "photo-camera-fill", bg: "accent-violet-bg", fg: "accent-violet-fg" },
  { kind: "analytics", icon: "trending-up", bg: "accent-green-bg", fg: "accent-green-fg" },
];

/**
 * Farzand ruxsatlari — veb `consent-switches.tsx`: dars yozuvi, kamera va
 * faollik tahlili. Yoqish darhol, o'chirish tasdiqlash oynasidan keyin.
 */
export function ConsentSwitches({ childId, childName }: { childId: string; childName: string }) {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const consents = useParentConsents();
  const setConsent = useSetParentConsent({ notify: false });
  const [turningOff, setTurningOff] = useState<ConsentKind | null>(null);

  function apply(kind: ConsentKind, value: boolean) {
    const label = t(`children.consentKinds.${kind}.label`);
    setConsent.mutate(
      { studentId: childId, kind, granted: value },
      { onSuccess: () => toast.success(t(value ? "profile.consentOn" : "profile.consentOff", { label })) }
    );
  }

  return (
    <>
      <View style={[styles.list, { backgroundColor: ds.c.surface }]}>
        {CONSENTS.map((item, index) => (
          <View key={item.kind} style={[styles.row, index < CONSENTS.length - 1 && { borderBottomWidth: 1, borderBottomColor: ds.c.line }]}>
            <View style={[styles.icon, { backgroundColor: ds.c[item.bg] }]}>
              <Icon name={item.icon} size={22} color={ds.c[item.fg]} />
            </View>
            <View style={styles.text}>
              <DsText v="title-sm">{t(`children.consentKinds.${item.kind}.label`)}</DsText>
              <DsText v="body-xs" c="ink-secondary" numberOfLines={1}>
                {t(`children.consentKinds.${item.kind}.description`)}
              </DsText>
            </View>
            <Switch
              size="lg"
              checked={parentFamily.consentGranted(consents.data ?? [], childId, item.kind)}
              disabled={consents.isLoading || setConsent.isPending}
              accessibilityLabel={t(`children.consentKinds.${item.kind}.label`)}
              onCheckedChange={(next) => (next ? apply(item.kind, true) : setTurningOff(item.kind))}
            />
          </View>
        ))}
      </View>
      <ConfirmDialog
        open={Boolean(turningOff)}
        onOpenChange={(open) => {
          if (!open) setTurningOff(null);
        }}
        icon={CONSENTS.find((item) => item.kind === turningOff)?.icon ?? "lock"}
        title={turningOff ? t(`profile.consentOffDialog.${turningOff}.title`) : ""}
        description={turningOff ? t(`profile.consentOffDialog.${turningOff}.description`, { name: childName.split(" ")[0] || childName }) : ""}
        confirmLabel={t("profile.consentOffDialog.confirm")}
        cancelLabel={t("profile.consentOffDialog.cancel")}
        pending={setConsent.isPending}
        onConfirm={() => {
          if (turningOff) apply(turningOff, false);
          setTurningOff(null);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  list: { overflow: "hidden", borderRadius: 20 },
  /* `flex items-center gap-4 px-4 py-4` */
  row: { flexDirection: "row", alignItems: "center", gap: 16, padding: 16 },
  icon: { width: 44, height: 44, borderRadius: dsRadius.xl, alignItems: "center", justifyContent: "center" },
  text: { flex: 1, minWidth: 0, gap: 2 },
});
