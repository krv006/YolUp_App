import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TextInput, View } from "react-native";
import { bodyFont, DsText, dsRadius, dsType, Icon, useDs } from "@/shared/ui";
import { googleFormUrlInvalid } from "../lib/google-form";

export interface GoogleFormFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** Tor ekran formasi: `h-13 rounded-lg border-[1.5px] bg-surface`, yorliq `text-body-sm text-ink`. */
  compact?: boolean;
}

/**
 * Google Form havolasi maydoni — veb `google-form-field.tsx`: zanjir
 * belgili havola maydoni va ostida izoh; noto'g'ri havolada qizil chegara
 * va xato matni.
 */
export function GoogleFormField({ value, onChange, compact = false }: GoogleFormFieldProps) {
  const { t } = useTranslation("homework");
  const ds = useDs();
  const [focused, setFocused] = useState(false);
  const invalid = googleFormUrlInvalid(value);

  return (
    <View style={styles.root}>
      <DsText v={compact ? "body-sm" : "body-xs"} c={compact ? "ink" : "ink-secondary"}>
        {t("form.googleForm")}
      </DsText>
      <View
        style={[
          styles.field,
          compact ? styles.compact : styles.regular,
          {
            backgroundColor: compact || focused ? ds.c.surface : ds.c.subtle,
            borderColor: invalid ? ds.c.danger : focused ? ds.c.focus : "transparent",
          },
        ]}
      >
        <Icon name="link" size={18} color={ds.c["ink-tertiary"]} />
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="https://forms.gle/…"
          placeholderTextColor={ds.c["ink-tertiary"]}
          selectionColor={ds.c.brand}
          keyboardType="url"
          inputMode="url"
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel={t("form.googleForm")}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.input, { color: ds.c.ink }]}
        />
      </View>
      <DsText v="body-xs" c={invalid ? "danger" : "ink-tertiary"}>
        {invalid ? t("form.googleFormInvalid") : t("form.googleFormHint")}
      </DsText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 8 },
  field: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16 },
  /* `h-13 rounded-lg border-[1.5px]` */
  compact: { height: 52, borderWidth: 1.5, borderRadius: dsRadius.lg },
  /* `h-12.5 rounded-md border` */
  regular: { height: 50, borderWidth: 1, borderRadius: dsRadius.md },
  input: {
    flex: 1,
    minWidth: 0,
    height: "100%",
    padding: 0,
    fontSize: dsType.body.fontSize,
    fontFamily: bodyFont("400"),
  },
});
