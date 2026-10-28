import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { bodyFont, DsText, dsRadius, dsType, MobileAlertDialog, MobileRadio, useDs } from "@/shared/ui";

const PRESET_KEYS = ["wrongAnswer", "offTopic", "cleanup"] as const;

export interface EraseReasonDialogProps {
  open: boolean;
  pending: boolean;
  reason: string;
  onReasonChange: (reason: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Doskadan o'chirish sababi — veb `erase-reason-dialog.tsx` (tor ekran):
 * ogohlantirish oynasi, tayyor sabablar va "Boshqa" uchun maydon.
 */
export function EraseReasonDialog({ open, pending, reason, onReasonChange, onCancel, onConfirm }: EraseReasonDialogProps) {
  const { t } = useTranslation("board");
  const ds = useDs();
  const presets = PRESET_KEYS.map((key) => t(`eraseDialog.reasons.${key}`));
  const custom = Boolean(reason) && !presets.includes(reason);
  const options = [...presets.map((label) => ({ label, custom: false })), { label: t("eraseDialog.reasons.other"), custom: true }];

  return (
    <MobileAlertDialog
      open={open}
      onOpenChange={(next) => (next ? undefined : onCancel())}
      icon="delete-fill"
      tone="danger"
      title={t("eraseDialog.title")}
      titleVariant="title-lg"
      shift={24}
      description={t("eraseDialog.description")}
      cancelLabel={t("eraseDialog.cancel")}
      confirmLabel={t("eraseDialog.confirm")}
      confirmTone="danger"
      pending={pending || !reason.trim()}
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
      <DsText v="caption-strong" c="ink-secondary" style={styles.label}>
        {t("eraseDialog.reasonLabel").toUpperCase()}
      </DsText>
      <View accessibilityRole="radiogroup" style={styles.options}>
        {options.map((option) => {
          const active = option.custom ? custom : reason === option.label;
          return (
            <Pressable
              key={option.label}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              onPress={() => onReasonChange(option.custom ? (custom ? reason : " ") : option.label)}
              style={({ pressed }) => [styles.option, active ? { backgroundColor: ds.c["brand-subtle"] } : pressed && { backgroundColor: ds.c.subtle }]}
            >
              <MobileRadio checked={active} />
              <DsText v="label-lg" numberOfLines={1} style={styles.grow}>
                {option.label}
              </DsText>
            </Pressable>
          );
        })}
      </View>
      {custom ? (
        <TextInput
          autoFocus
          value={reason.trimStart()}
          placeholder={t("eraseDialog.reasonPlaceholder")}
          placeholderTextColor={ds.c["ink-tertiary"]}
          onChangeText={(value) => onReasonChange(value || " ")}
          style={[styles.input, { backgroundColor: ds.c.subtle, color: ds.c.ink }]}
        />
      ) : null}
    </MobileAlertDialog>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  label: { marginTop: 15 },
  /* `mt-[13px] mb-0.5 gap-1`, qator `h-16 gap-6 pr-6 pl-[23px] rounded-lg` */
  options: { marginTop: 13, marginBottom: 2, gap: 4 },
  option: { height: 64, flexDirection: "row", alignItems: "center", gap: 24, paddingLeft: 23, paddingRight: 24, borderRadius: dsRadius.lg },
  input: { height: 48, paddingHorizontal: 16, borderRadius: dsRadius.md, fontFamily: bodyFont("400"), fontSize: dsType.body.fontSize },
});
