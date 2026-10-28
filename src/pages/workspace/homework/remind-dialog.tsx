import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { DsText, dsRadius, Icon, MobileButton, MobileFieldLabel, MobileInput, Sheet, Switch, useDs } from "@/shared/ui";

export interface RemindDialogProps {
  open: boolean;
  count: number;
  title: string;
  due: string;
  pending?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (input: { message: string; notifyParents: boolean }) => void;
}

/**
 * Eslatma yuborish — veb `remind-dialog.tsx` (tor ekranda pastki oyna):
 * tayyor matnli xabar, "ota-onalarga ham" kaliti va yuborish chegarasi izohi.
 */
export function RemindDialog({ open, count, title, due, pending = false, onOpenChange, onConfirm }: RemindDialogProps) {
  const { t } = useTranslation("homework");
  const ds = useDs();
  const [withParents, setWithParents] = useState(true);
  const [message, setMessage] = useState("");
  const text = message || t("remindDialog.defaultMessage", { title, due });

  return (
    <Sheet
      variant="app"
      open={open}
      onClose={() => onOpenChange(false)}
      title={t("remindDialog.title")}
      description={t("remindDialog.description", { count })}
      footer={
        <>
          <MobileButton variant="secondary" label={t("remindDialog.cancel")} onPress={() => onOpenChange(false)} />
          <MobileButton label={t("remindDialog.submit")} disabled={pending} onPress={() => onConfirm({ message: text, notifyParents: withParents })} />
        </>
      }
    >
      <MobileFieldLabel label={t("remindDialog.message")} gap={8}>
        <MobileInput multiline value={text} onChangeText={setMessage} style={styles.area} />
      </MobileFieldLabel>

      {/* `gap-3 px-4 pt-3 pb-4` */}
      <View style={styles.parents}>
        <View style={[styles.parentsIcon, { backgroundColor: ds.c["accent-violet-bg"] }]}>
          <Icon name="person" size={18} color={ds.c.ink} />
        </View>
        <View style={styles.grow}>
          <DsText v="title" numberOfLines={1}>
            {t("remindDialog.parents")}
          </DsText>
          <DsText v="body-sm" c="ink-secondary" numberOfLines={1}>
            {t("remindDialog.parentsHint")}
          </DsText>
        </View>
        <Switch size="lg" checked={withParents} onCheckedChange={setWithParents} accessibilityLabel={t("remindDialog.parents")} />
      </View>

      <DsText v="caption" c="ink-tertiary">
        {t("remindDialog.rate")}
      </DsText>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  area: { marginTop: -2, paddingHorizontal: 18 },
  parents: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 },
  parentsIcon: { width: 40, height: 40, borderRadius: dsRadius.lg, alignItems: "center", justifyContent: "center" },
});
