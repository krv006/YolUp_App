import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useNetInfo } from "@react-native-community/netinfo";
import { CloudOff } from "lucide-react-native";
import { createLoginSchema, resolveHomeRoute, useAuth } from "@/modules/auth";
import { AuthButton, AuthField, AuthFieldError, AuthPasswordField, AuthScreen } from "@/modules/auth/ui/auth-screen";
import { applyApiFieldErrors, type AppError } from "@/shared/api";
import { ROUTES } from "@/shared/config";
import type { LoginCredentials } from "@/shared/types";
import { radius, Text, toast, useTheme } from "@/shared/ui";

/**
 * Kirish — veb `modules/auth/ui/mobile-login-form.tsx` (veb tor ekranda
 * shuni ko'rsatadi): "Xush kelibsiz!", login va parol, "Parolni
 * unutdingizmi?", pastda "Kirish" va ro'yxatdan o'tish havolasi.
 * Xulqi o'zgarmagan: `loginSchema`, `applyApiFieldErrors`, `resolveHomeRoute`.
 */
export function LoginPage() {
  const { t } = useTranslation("auth");
  const { palette } = useTheme();
  const router = useRouter();
  const { login } = useAuth();
  const net = useNetInfo();
  const online = net.isConnected !== false;
  const [showPassword, setShowPassword] = useState(false);
  const schema = useMemo(() => createLoginSchema(t), [t]);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginCredentials>({
    resolver: zodResolver(schema),
    defaultValues: { login: "", password: "", remember: true },
  });
  const failed = Boolean(errors.root);

  async function submit(values: LoginCredentials) {
    try {
      const user = await login(values);
      router.replace(resolveHomeRoute(user));
    } catch (error) {
      const appError = error as AppError;
      if (!applyApiFieldErrors(appError, setError, { username: "login" })) {
        setError("root", { type: "server", message: t("mobile.login.failed") });
      }
      toast.error(t("mobile.login.errorToastTitle"), { description: t("mobile.login.errorToastDescription") });
    }
  }

  return (
    <AuthScreen
      onBack={() => (router.canGoBack() ? router.back() : router.replace(ROUTES.root))}
      title={t("mobile.login.title")}
      description={t("mobile.login.subtitle")}
      notice={
        online ? null : (
          <View style={[styles.offline, { backgroundColor: palette["surface-subtle"] }]}>
            <CloudOff size={18} color={palette["muted-foreground"]} />
            <Text variant="label" style={[styles.offlineText, { color: palette["muted-foreground"] }]}>
              {t("mobile.login.offline")}
            </Text>
          </View>
        )
      }
      action={
        <AuthButton loading={isSubmitting} loadingLabel={t("mobile.login.submitting")} disabled={!online} onPress={handleSubmit(submit)}>
          {t("form.submit")}
        </AuthButton>
      }
      footer={
        <>
          {t("mobile.login.noAccount")}{" "}
          <Text variant="label" style={{ color: palette.primary }} onPress={() => router.push(ROUTES.auth.register)}>
            {t("mobile.login.registerLink")}
          </Text>
        </>
      }
    >
      <View style={styles.form}>
        <Controller
          control={control}
          name="login"
          render={({ field: { onChange, onBlur, value } }) => (
            <AuthField
              autoComplete="username"
              textContentType="username"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={t("form.loginPlaceholder")}
              accessibilityLabel={t("form.loginLabel")}
              invalid={Boolean(errors.login) || failed}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              returnKeyType="next"
            />
          )}
        />
        {errors.login ? <AuthFieldError>{errors.login.message}</AuthFieldError> : null}

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <AuthPasswordField
              autoComplete="current-password"
              textContentType="password"
              placeholder={t("form.passwordPlaceholder")}
              accessibilityLabel={t("form.passwordLabel")}
              invalid={Boolean(errors.password) || failed}
              visible={showPassword}
              onToggle={() => setShowPassword((current) => !current)}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              returnKeyType="go"
              onSubmitEditing={handleSubmit(submit)}
            />
          )}
        />
        {errors.password ? <AuthFieldError>{errors.password.message}</AuthFieldError> : null}
        {failed ? <AuthFieldError>{errors.root?.message}</AuthFieldError> : null}

        <Pressable accessibilityRole="link" onPress={() => router.push(ROUTES.auth.forgotPassword)} style={styles.forgot}>
          <Text variant="label" style={{ color: palette.primary }}>
            {t("mobile.login.forgotPassword")}
          </Text>
        </Pressable>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  form: { gap: 12 },
  forgot: { alignSelf: "flex-end", paddingHorizontal: 8 },
  offline: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingHorizontal: 16, paddingVertical: 14, borderRadius: radius["2xl"] },
  offlineText: { flex: 1, fontWeight: "400" },
});
