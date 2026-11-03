import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { AppError } from "@/shared/api";
import { CenterDialog, DsText, dsRadius, Icon, MobileFieldLabel, MobileInput, useDs } from "@/shared/ui";
import { useChangePasswordMutation } from "../model/auth.mutations";
import { useAuth } from "../model/use-auth";

const NOOP = () => undefined;

/**
 * Majburiy parol almashtirish — veb `modules/auth/ui/force-password-dialog.tsx`
 * (`AppDialog variant="confirm" layout="centered"`). Ota-ona yaratgan farzand
 * hisobi vaqtinchalik parol bilan keladi (`must_change_password`): yangi
 * parol o'rnatilmaguncha oyna yopilmaydi — fon, "orqaga" va yopish tugmasi yo'q.
 *
 * Vebda u har rol marshrutida (`role-route.tsx`) turadi; mobilda ildiz
 * layout'da bitta nusxa — rol sahifalari ustiga ochilgan doska va jonli dars
 * ekranlari ham yopiladi.
 */
export function ForcePasswordDialog() {
  const { t } = useTranslation("auth");
  const ds = useDs();
  const { user } = useAuth();
  const change = useChangePasswordMutation();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [error, setError] = useState("");
  const disabled = !current || !next || !repeat || change.isPending;

  function submit() {
    if (disabled) return;
    if (next.length < 8 || !/\d/.test(next)) return setError(t("forcePassword.weak"));
    if (next !== repeat) return setError(t("forcePassword.mismatch"));
    setError("");
    change.mutate(
      { currentPassword: current, newPassword: next },
      {
        onError: (cause: Error) => {
          const fields = cause instanceof AppError ? cause.fields : null;
          const value = fields?.current_password ?? fields?.new_password;
          setError(Array.isArray(value) ? value.join(" ") : value ? String(value) : cause.message);
        },
      }
    );
  }

  const inputs = [
    { key: "current", label: t("forcePassword.current"), value: current, set: setCurrent, auto: "current-password" as const },
    { key: "next", label: t("forcePassword.next"), value: next, set: setNext, auto: "new-password" as const },
    { key: "repeat", label: t("forcePassword.repeat"), value: repeat, set: setRepeat, auto: "new-password" as const },
  ];

  return (
    <CenterDialog open={Boolean(user?.mustChangePassword)} onClose={NOOP}>
      {/* `flex-col items-center gap-3 px-6 pt-6 text-center` */}
      <View style={styles.head}>
        <View style={[styles.icon, { backgroundColor: ds.c["brand-subtle"] }]}>
          <Icon name="key" size={26} color={ds.c.brand} />
        </View>
        <DsText v="h2" w="600" style={styles.center}>
          {t("forcePassword.title")}
        </DsText>
        <DsText v="body-sm" c="ink-secondary" style={styles.center}>
          {t("forcePassword.text")}
        </DsText>
      </View>

      {/* `flex flex-col gap-3 px-5 pt-4.5`, maydon `gap-1.5` */}
      <View style={styles.form}>
        {inputs.map((field, index) => (
          <MobileFieldLabel key={field.key} label={field.label} gap={6}>
            <MobileInput
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete={field.auto}
              textContentType={field.auto === "current-password" ? "password" : "newPassword"}
              returnKeyType={index === inputs.length - 1 ? "done" : "next"}
              value={field.value}
              invalid={Boolean(error)}
              onChangeText={(value) => {
                setError("");
                field.set(value);
              }}
              onSubmitEditing={index === inputs.length - 1 ? submit : undefined}
            />
          </MobileFieldLabel>
        ))}
        <DsText v="body-xs" c={error ? "error-text" : "ink-tertiary"}>
          {error || t("forcePassword.rule")}
        </DsText>
      </View>

      {/* Footer `flex-col px-6 pt-4 pb-6`; `dialogButton.primary` — `h-12 rounded-full bg-brand disabled:opacity-40` */}
      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled }}
          disabled={disabled}
          onPress={submit}
          style={({ pressed }) => [styles.submit, { backgroundColor: pressed ? ds.c["brand-strong"] : ds.c.brand }, disabled && styles.disabled]}
        >
          <DsText v="button" c="ink-inverse">
            {t("forcePassword.submit")}
          </DsText>
        </Pressable>
      </View>
    </CenterDialog>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: "center" },
  head: { alignItems: "center", gap: 12, paddingHorizontal: 24, paddingTop: 24 },
  icon: { width: 56, height: 56, borderRadius: dsRadius.full, alignItems: "center", justifyContent: "center" },
  form: { gap: 12, paddingHorizontal: 20, paddingTop: 18 },
  footer: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 },
  submit: { height: 48, alignItems: "center", justifyContent: "center", paddingHorizontal: 20, borderRadius: dsRadius.full },
  disabled: { opacity: 0.4 },
});
