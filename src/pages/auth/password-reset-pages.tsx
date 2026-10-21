import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { AuthButton, AuthFieldError, AuthPasswordField, AuthPhoneField, AuthScreen } from "@/modules/auth/ui/auth-screen";
import { OtpInput } from "@/modules/auth/ui/otp-input";
import { ROUTES } from "@/shared/config";
import { Text, toast, useTheme } from "@/shared/ui";

/*
 * Parolni tiklash — veb `forgot-password-page.tsx`, `verify-code-page.tsx`,
 * `new-password-page.tsx`. Backendda bu oqim hali yo'q: vebdagidek har
 * qadamda "backend hali tayyor emas" xabari chiqadi va keyingi ekranga o'tiladi.
 */

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
  const [phone, setPhone] = useState("");

  return (
    <AuthScreen
      onBack={back}
      title={t("mobile.reset.title")}
      description={t("mobile.reset.description")}
      action={
        <AuthButton
          disabled={phone.trim().length < 9}
          onPress={() => {
            toast.info(t("mobile.reset.backendMissing"));
            router.push(ROUTES.auth.verifyCode);
          }}
        >
          {t("mobile.reset.sendCode")}
        </AuthButton>
      }
      footer={<LoginLink prefix={t("mobile.reset.remembered")} />}
    >
      <AuthPhoneField
        autoFocus
        value={phone}
        placeholder={t("mobile.reset.phonePlaceholder")}
        accessibilityLabel={t("register.form.phone")}
        hint={t("mobile.reset.phoneHint")}
        onChangeText={setPhone}
      />
    </AuthScreen>
  );
}

const CODE_LENGTH = 5;
const RESEND_SECONDS = 45;

export function VerifyCodePage() {
  const { t } = useTranslation("auth");
  const { palette } = useTheme();
  const router = useRouter();
  const back = useBack();
  const [code, setCode] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (seconds <= 0) return undefined;
    const timer = setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  function confirm() {
    if (code.length < CODE_LENGTH) {
      setInvalid(true);
      toast.error(t("mobile.code.errorToastTitle"), { description: t("mobile.code.errorToastDescription") });
      return;
    }
    toast.info(t("mobile.reset.backendMissing"));
    router.push(ROUTES.auth.newPassword);
  }

  const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <AuthScreen
      onBack={back}
      title={t("mobile.code.title")}
      description={t("mobile.code.description")}
      action={<AuthButton onPress={confirm}>{t("mobile.code.submit")}</AuthButton>}
      footer={<LoginLink prefix={t("mobile.reset.remembered")} />}
    >
      <OtpInput
        length={CODE_LENGTH}
        value={code}
        invalid={invalid}
        onChange={(next) => {
          setInvalid(false);
          setCode(next);
        }}
      />
      {invalid ? <AuthFieldError>{t("mobile.code.invalid")}</AuthFieldError> : null}
      {seconds > 0 ? (
        <Text variant="label" style={[styles.resend, { color: palette["muted-foreground"] }]}>
          {t("mobile.code.resendIn")}{" "}
          <Text variant="label" style={styles.clock}>
            {clock}
          </Text>
        </Text>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setSeconds(RESEND_SECONDS);
            toast.info(t("mobile.reset.backendMissing"));
          }}
          style={styles.resendButton}
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
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (password.length < MIN_LENGTH) {
      setError(t("validation.passwordMinLength"));
      return;
    }
    if (password !== confirm) {
      setError(t("mobile.newPassword.mismatch"));
      return;
    }
    setError(null);
    toast.info(t("mobile.reset.backendMissing"));
    router.replace(ROUTES.auth.login);
  }

  return (
    <AuthScreen
      onBack={back}
      title={t("mobile.newPassword.title")}
      description={t("mobile.newPassword.description")}
      action={
        <AuthButton disabled={!password || !confirm} onPress={submit}>
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
});
