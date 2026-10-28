import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useNetInfo } from "@react-native-community/netinfo";
import { CloudOff } from "lucide-react-native";
import { createLoginSchema, resolveHomeRoute, useAuth, type TwoFactorChallenge } from "@/modules/auth";
import { AuthButton, AuthField, AuthFieldError, AuthPasswordField, AuthScreen } from "@/modules/auth/ui/auth-screen";
import { MobileTwoFactorForm } from "@/modules/auth/ui/two-factor-form";
import { applyApiFieldErrors, type AppError } from "@/shared/api";
import { ROUTES } from "@/shared/config";
import type { LoginCredentials } from "@/shared/types";
import { DsText, dsRadius, showErrorToast, useDs } from "@/shared/ui";

interface PendingChallenge {
  credentials: LoginCredentials;
  challenge: TwoFactorChallenge;
}

/**
 * Kirish (M2.1–2.6) — veb `modules/auth/ui/mobile-login-form.tsx` (veb tor
 * ekranda shuni ko'rsatadi): "Xush kelibsiz!", yorliqli login va parol
 * maydonlari, "Parolni unutdingizmi?", pastda "Kirish" va ro'yxatdan
 * o'tish havolasi; xato bo'lsa maydonlar qizil va xato toast'i.
 * Xulqi o'zgarmagan: `loginSchema`, `applyApiFieldErrors`, `resolveHomeRoute`.
 *
 * Hisobda ikki bosqichli himoya yoqilgan bo'lsa, server token o'rniga
 * `two_factor_required` qaytaradi — shunda SMS kodi ekrani ochiladi
 * (veb `login-page.tsx` dagi `pending` holati).
 */
export function LoginPage() {
  const { t } = useTranslation("auth");
  const ds = useDs();
  const router = useRouter();
  const { login, completeTwoFactorLogin } = useAuth();
  const net = useNetInfo();
  const online = net.isConnected !== false;
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState<PendingChallenge | null>(null);
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
      const result = await login(values);
      if (result.status === "twoFactor") {
        setPending({ credentials: values, challenge: result.challenge });
        return;
      }
      router.replace(resolveHomeRoute(result.user));
    } catch (error) {
      const appError = error as AppError;
      if (!applyApiFieldErrors(appError, setError, { username: "login" })) {
        setError("root", { type: "server", message: t("mobile.login.failed") });
      }
      showErrorToast({ title: t("mobile.login.errorToastTitle"), description: t("mobile.login.errorToastDescription") });
    }
  }

  async function resend() {
    if (!pending) return;
    const result = await login(pending.credentials);
    if (result.status === "twoFactor") {
      setPending({ credentials: pending.credentials, challenge: result.challenge });
      return;
    }
    router.replace(resolveHomeRoute(result.user));
  }

  async function submitCode(code: string) {
    if (!pending) return;
    const user = await completeTwoFactorLogin(
      pending.challenge.challengeToken,
      code,
      pending.credentials.remember !== false
    );
    router.replace(resolveHomeRoute(user));
  }

  if (pending) {
    return (
      <MobileTwoFactorForm
        challenge={pending.challenge}
        onSubmit={submitCode}
        onResend={resend}
        onCancel={() => setPending(null)}
      />
    );
  }

  return (
    <AuthScreen
      layout="spaced"
      onBack={() => (router.canGoBack() ? router.back() : router.replace(ROUTES.root))}
      title={t("mobile.login.title")}
      description={t("mobile.login.subtitle")}
      notice={
        online ? null : (
          <View style={[styles.offline, { backgroundColor: ds.c.subtle }]}>
            <View style={styles.offlineIcon}>
              <CloudOff size={18} color={ds.c["ink-secondary"]} />
            </View>
            <DsText v="body-sm" c="ink-secondary" style={styles.grow}>
              {t("mobile.login.offline")}
            </DsText>
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
          <DsText v="body-sm" c="brand-strong" onPress={() => router.push(ROUTES.auth.register)}>
            {t("mobile.login.registerLink")}
          </DsText>
        </>
      }
    >
      <View style={styles.form}>
        <View style={styles.group}>
          <Controller
            control={control}
            name="login"
            render={({ field: { onChange, onBlur, value } }) => (
              <AuthField
                autoComplete="username"
                textContentType="username"
                autoCapitalize="none"
                autoCorrect={false}
                label={t("form.loginLabel")}
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
        </View>

        <View style={styles.group}>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <AuthPasswordField
                autoComplete="current-password"
                textContentType="password"
                label={t("form.passwordLabel")}
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
        </View>

        <Pressable accessibilityRole="link" onPress={() => router.push(ROUTES.auth.forgotPassword)} style={styles.forgot}>
          <DsText v="body-sm" c="brand-strong">
            {t("mobile.login.forgotPassword")}
          </DsText>
        </Pressable>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1 },
  /* `flex-col gap-4`; har maydon guruhi `gap-1` */
  form: { gap: 16 },
  group: { gap: 4 },
  forgot: { alignSelf: "flex-end" },
  /* `items-start gap-2.5 rounded-2xl bg-subtle px-4 py-3.5` */
  offline: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingHorizontal: 16, paddingVertical: 14, borderRadius: dsRadius["2xl"] },
  offlineIcon: { marginTop: 2 },
});
