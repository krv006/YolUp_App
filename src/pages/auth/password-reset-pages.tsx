import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import {
  describeResetError,
  usePasswordResetConfirmMutation,
  usePasswordResetRequestMutation,
  usePasswordResetVerifyMutation,
} from "@/modules/auth";
import { AuthButton, AuthFieldError, AuthPasswordField, AuthPhoneField, AuthScreen } from "@/modules/auth/ui/auth-screen";
import { OtpInput } from "@/modules/auth/ui/otp-input";
import { ROUTES } from "@/shared/config";
import { Text, toast, useTheme } from "@/shared/ui";

/*
 * Parolni tiklash — veb `forgot-password-page.tsx`, `verify-code-page.tsx`,
 * `new-password-page.tsx`: telefon -> SMS kodi -> yangi parol.
 *
 * Vebda qadamlar orasidagi ma'lumot (telefon, taymerlar, `reset_token`)
 * `location.state` da yuradi; Expo Router'da uning o'rni — marshrut
 * parametrlari. Parametrsiz ochilsa, vebdagidek boshiga qaytariladi.
 */

const DEFAULT_EXPIRES_IN = 120;
const DEFAULT_RETRY_AFTER = 45;

function toSeconds(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function useBack() {
  const router = useRouter();
  return () => (router.canGoBack() ? router.back() : router.replace(ROUTES.auth.login));
}

function LoginLink({ prefix }: { prefix: string }) {
  const { t } = useTranslation("auth");
  const { palette } = useTheme();
  const router = useRouter();
  return (
    <>
      {prefix}{" "}
      <Text variant="label" style={{ color: palette.primary }} onPress={() => router.replace(ROUTES.auth.login)}>
        {t("form.submit")}
      </Text>
    </>
  );
}

export function ForgotPasswordPage() {
  const { t } = useTranslation("auth");
  const router = useRouter();
  const back = useBack();
  const requestCode = usePasswordResetRequestMutation();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function sendCode() {
    const value = phone.trim();
    setError(null);
    try {
      const response = await requestCode.mutateAsync(value);
      toast.success(t("mobile.reset.sent"));
      router.push({
        pathname: ROUTES.auth.verifyCode,
        params: {
          phone: value,
          expiresIn: String(response.expires_in ?? DEFAULT_EXPIRES_IN),
          retryAfter: String(response.retry_after ?? DEFAULT_RETRY_AFTER),
        },
      });
    } catch (caught) {
      const message = describeResetError(caught, t);
      setError(message);
      toast.error(message);
    }
  }

  return (
    <AuthScreen
      onBack={back}
      title={t("mobile.reset.title")}
      description={t("mobile.reset.description")}
      action={
        <AuthButton
          loading={requestCode.isPending}
          loadingLabel={t("mobile.reset.sending")}
          disabled={phone.trim().length < 9}
          onPress={() => void sendCode()}
        >
          {t("mobile.reset.sendCode")}
        </AuthButton>
      }
      footer={<LoginLink prefix={t("mobile.reset.remembered")} />}
    >
      <AuthPhoneField
        autoFocus
        value={phone}
        invalid={Boolean(error)}
        placeholder={t("mobile.reset.phonePlaceholder")}
        accessibilityLabel={t("register.form.phone")}
        hint={t("mobile.reset.phoneHint")}
        onChangeText={(value) => {
          setError(null);
          setPhone(value);
        }}
      />

      {error ? <AuthFieldError>{error}</AuthFieldError> : null}
    </AuthScreen>
  );
}

const CODE_LENGTH = 5;

export function VerifyCodePage() {
  const { t } = useTranslation("auth");
  const { palette } = useTheme();
  const router = useRouter();
  const back = useBack();
  const params = useLocalSearchParams<{ phone?: string; expiresIn?: string; retryAfter?: string }>();
  const phone = params.phone ?? "";
  const verifyCode = usePasswordResetVerifyMutation();
  const requestCode = usePasswordResetRequestMutation();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState(() => toSeconds(params.expiresIn, DEFAULT_EXPIRES_IN));
  const [retryIn, setRetryIn] = useState(() => toSeconds(params.retryAfter, DEFAULT_RETRY_AFTER));

  useEffect(() => {
    if (expiresIn <= 0 && retryIn <= 0) return undefined;
    const timer = setTimeout(() => {
      setExpiresIn((value) => (value > 0 ? value - 1 : 0));
      setRetryIn((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => clearTimeout(timer);
  }, [expiresIn, retryIn]);

  async function confirm() {
    if (!phone) return;
    if (code.length < CODE_LENGTH) {
      setError(t("mobile.code.invalid"));
      toast.error(t("mobile.code.errorToastTitle"), { description: t("mobile.code.errorToastDescription") });
      return;
    }
    try {
      const response = await verifyCode.mutateAsync({ phone, code });
      router.replace({ pathname: ROUTES.auth.newPassword, params: { resetToken: response.reset_token } });
    } catch (caught) {
      const message = describeResetError(caught, t);
      setError(message);
      setCode("");
      toast.error(message);
    }
  }

  async function resend() {
    if (!phone) return;
    try {
      const response = await requestCode.mutateAsync(phone);
      setExpiresIn(response.expires_in ?? DEFAULT_EXPIRES_IN);
      setRetryIn(response.retry_after ?? DEFAULT_RETRY_AFTER);
      setCode("");
      setError(null);
      toast.success(t("mobile.reset.sent"));
    } catch (caught) {
      toast.error(describeResetError(caught, t));
    }
  }

  if (!phone) return <Redirect href={ROUTES.auth.forgotPassword} />;

  const clock = `${Math.floor(retryIn / 60)}:${String(retryIn % 60).padStart(2, "0")}`;

  return (
    <AuthScreen
      onBack={back}
      title={t("mobile.code.title")}
      description={t("mobile.code.descriptionPhone", { phone })}
      action={
        <AuthButton loading={verifyCode.isPending} loadingLabel={t("mobile.code.submitting")} onPress={() => void confirm()}>
          {t("mobile.code.submit")}
        </AuthButton>
      }
      footer={<LoginLink prefix={t("mobile.reset.remembered")} />}
    >
      <OtpInput
        length={CODE_LENGTH}
        value={code}
        invalid={Boolean(error)}
        onChange={(next) => {
          setError(null);
          setCode(next);
        }}
      />
      {error ? <AuthFieldError>{error}</AuthFieldError> : null}
      {expiresIn <= 0 ? (
        <Text variant="label" style={[styles.resend, { color: palette["destructive-strong"] }]}>
          {t("mobile.code.expired")}
        </Text>
      ) : null}
      {retryIn > 0 ? (
        <Text variant="label" style={[styles.resend, { color: palette["muted-foreground"] }]}>
          {t("mobile.code.resendIn")}{" "}
          <Text variant="label" style={styles.clock}>
            {clock}
          </Text>
        </Text>
      ) : (
        <Pressable
          accessibilityRole="button"
          disabled={requestCode.isPending}
          onPress={() => void resend()}
          style={[styles.resendButton, requestCode.isPending && styles.disabled]}
        >
          <Text variant="label" style={{ color: palette.primary }}>
            {t("mobile.code.resend")}
          </Text>
        </Pressable>
      )}
    </AuthScreen>
  );
}

const MIN_LENGTH = 8;

export function NewPasswordPage() {
  const { t } = useTranslation("auth");
  const { palette } = useTheme();
  const router = useRouter();
  const back = useBack();
  const { resetToken = "" } = useLocalSearchParams<{ resetToken?: string }>();
  const confirmReset = usePasswordResetConfirmMutation();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!resetToken) return;
    if (password.length < MIN_LENGTH) {
      setError(t("validation.passwordMinLength"));
      return;
    }
    if (password !== confirm) {
      setError(t("mobile.newPassword.mismatch"));
      return;
    }
    setError(null);
    try {
      await confirmReset.mutateAsync({ resetToken, password });
      toast.success(t("mobile.newPassword.success"));
      router.replace(ROUTES.auth.login);
    } catch (caught) {
      const message = describeResetError(caught, t);
      setError(message);
      toast.error(message);
    }
  }

  if (!resetToken) return <Redirect href={ROUTES.auth.forgotPassword} />;

  return (
    <AuthScreen
      onBack={back}
      title={t("mobile.newPassword.title")}
      description={t("mobile.newPassword.description")}
      action={
        <AuthButton
          loading={confirmReset.isPending}
          loadingLabel={t("mobile.newPassword.submitting")}
          disabled={!password || !confirm}
          onPress={() => void submit()}
        >
          {t("mobile.newPassword.submit")}
        </AuthButton>
      }
      footer={
        <>
          {t("mobile.login.noAccount")}{" "}
          <Text variant="label" style={{ color: palette.primary }} onPress={() => router.replace(ROUTES.auth.register)}>
            {t("mobile.login.registerLink")}
          </Text>
        </>
      }
    >
      <View style={styles.fields}>
        <AuthPasswordField
          autoComplete="new-password"
          placeholder={t("mobile.newPassword.passwordPlaceholder")}
          accessibilityLabel={t("mobile.newPassword.passwordPlaceholder")}
          value={password}
          invalid={Boolean(error)}
          visible={showPassword}
          onToggle={() => setShowPassword((value) => !value)}
          onChangeText={(value) => {
            setError(null);
            setPassword(value);
          }}
        />
        <AuthPasswordField
          autoComplete="new-password"
          placeholder={t("mobile.newPassword.confirmPlaceholder")}
          accessibilityLabel={t("mobile.newPassword.confirmPlaceholder")}
          value={confirm}
          invalid={Boolean(error)}
          visible={showConfirm}
          onToggle={() => setShowConfirm((value) => !value)}
          onChangeText={(value) => {
            setError(null);
            setConfirm(value);
          }}
        />
        {error ? <AuthFieldError>{error}</AuthFieldError> : null}
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  fields: { gap: 12 },
  resend: { paddingHorizontal: 4, fontWeight: "400" },
  clock: { fontWeight: "700", fontVariant: ["tabular-nums"] },
  resendButton: { alignSelf: "flex-start", paddingHorizontal: 4 },
  disabled: { opacity: 0.6 },
});
