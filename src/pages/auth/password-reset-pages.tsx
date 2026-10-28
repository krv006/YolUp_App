import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { Check } from "lucide-react-native";
import {
  UZ_PHONE_LENGTH,
  describeResetError,
  usePasswordResetConfirmMutation,
  usePasswordResetRequestMutation,
  usePasswordResetVerifyMutation,
} from "@/modules/auth";
import {
  AuthButton,
  AuthFieldError,
  AuthPasswordField,
  AuthPhoneInput,
  AuthScreen,
} from "@/modules/auth/ui/auth-screen";
import { OtpInput } from "@/modules/auth/ui/otp-input";
import { AppError } from "@/shared/api";
import { ROUTES } from "@/shared/config";
import { DsText, dsRadius, showErrorToast, useDs } from "@/shared/ui";

/*
 * Parolni tiklash — veb `forgot-password-page.tsx` (M4.1–4.4),
 * `verify-code-page.tsx` (M4.5–4.9) va `new-password-page.tsx` (M4.10–4.13):
 * telefon -> SMS kodi -> yangi parol -> "Parol yangilandi".
 *
 * Vebda qadamlar orasidagi ma'lumot (telefon, taymerlar, `reset_token`)
 * `location.state` da yuradi; Expo Router'da uning o'rni — marshrut
 * parametrlari. Parametrsiz ochilsa, vebdagidek boshiga qaytariladi.
 */

const DEFAULT_EXPIRES_IN = 120;
const DEFAULT_RETRY_AFTER = 45;
const CODE_LENGTH = 5;

function toSeconds(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function useBack() {
  const router = useRouter();
  return () => (router.canGoBack() ? router.back() : router.replace(ROUTES.auth.login));
}

export function ForgotPasswordPage() {
  const { t } = useTranslation("auth");
  const router = useRouter();
  const back = useBack();
  const params = useLocalSearchParams<{ digits?: string }>();
  const requestCode = usePasswordResetRequestMutation();
  const [digits, setDigits] = useState(params.digits ?? "");

  async function sendCode() {
    const phone = `+998${digits}`;
    try {
      const response = await requestCode.mutateAsync(phone);
      router.push({
        pathname: ROUTES.auth.verifyCode,
        params: {
          phone,
          digits,
          expiresIn: String(response.expires_in ?? DEFAULT_EXPIRES_IN),
          retryAfter: String(response.retry_after ?? DEFAULT_RETRY_AFTER),
        },
      });
    } catch (caught) {
      showErrorToast({ title: t("mobile.login.errorToastTitle"), description: describeResetError(caught, t) });
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
          disabled={digits.length < UZ_PHONE_LENGTH}
          onPress={() => void sendCode()}
        >
          {t("mobile.reset.sendCode")}
        </AuthButton>
      }
      footer={<LoginLink prefix={t("mobile.reset.remembered")} />}
    >
      <AuthPhoneInput
        autoFocus
        label={t("mobile.reset.phoneLabel")}
        hint={t("mobile.reset.phoneHint")}
        placeholder={t("mobile.reset.phoneNationalPlaceholder")}
        value={digits}
        onChange={setDigits}
      />
    </AuthScreen>
  );
}

/** `+998 90 ••• •• 67` — kod yuborilgan raqam yashirib ko'rsatiladi. */
function maskPhone(digits: string): string {
  return `+998 ${digits.slice(0, 2)} ••• •• ${digits.slice(7, 9)}`;
}

/** `00:59` */
function formatClock(seconds: number): string {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

export function VerifyCodePage() {
  const { t } = useTranslation("auth");
  const router = useRouter();
  const back = useBack();
  const params = useLocalSearchParams<{ phone?: string; digits?: string; expiresIn?: string; retryAfter?: string }>();
  const phone = params.phone ?? "";
  const digits = params.digits ?? phone.replace(/^\+?998/, "");
  const verifyCode = usePasswordResetVerifyMutation();
  const requestCode = usePasswordResetRequestMutation();
  const [code, setCode] = useState("");
  const [invalid, setInvalid] = useState(false);
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

  const expired = expiresIn <= 0;

  async function confirm(value = code) {
    if (!phone || value.length < CODE_LENGTH || expired) return;
    try {
      const response = await verifyCode.mutateAsync({ phone, code: value });
      router.replace({ pathname: ROUTES.auth.newPassword, params: { resetToken: response.reset_token } });
    } catch (caught) {
      // Noto'g'ri kod — kataklar qizil; tarmoq yoki server xatosi — toast.
      if (caught instanceof AppError && caught.status >= 400 && caught.status < 500) {
        setInvalid(true);
        return;
      }
      showErrorToast({ title: t("mobile.code.errorToastTitle"), description: describeResetError(caught, t) });
    }
  }

  async function resend() {
    if (!phone) return;
    try {
      const response = await requestCode.mutateAsync(phone);
      setExpiresIn(response.expires_in ?? DEFAULT_EXPIRES_IN);
      setRetryIn(response.retry_after ?? DEFAULT_RETRY_AFTER);
      setCode("");
      setInvalid(false);
    } catch (caught) {
      showErrorToast({ title: t("mobile.code.errorToastTitle"), description: describeResetError(caught, t) });
    }
  }

  if (!phone) return <Redirect href={ROUTES.auth.forgotPassword} />;

  const error = expired ? t("mobile.code.expired") : invalid ? t("mobile.code.invalid") : null;

  return (
    <AuthScreen
      onBack={back}
      title={t("mobile.code.title")}
      description={t("mobile.code.descriptionPhone", { phone: maskPhone(digits), length: CODE_LENGTH })}
      action={
        <AuthButton
          loading={verifyCode.isPending}
          loadingLabel={t("mobile.code.submitting")}
          disabled={expired || code.length < CODE_LENGTH}
          onPress={() => void confirm()}
        >
          {t("mobile.code.submit")}
        </AuthButton>
      }
      footer={
        <>
          {t("mobile.code.wrongNumber")}{" "}
          <DsText
            v="body-sm"
            w="600"
            c="brand-strong"
            onPress={() => router.replace({ pathname: ROUTES.auth.forgotPassword, params: { digits } })}
          >
            {t("mobile.code.change")}
          </DsText>
        </>
      }
    >
      <View style={styles.code}>
        <OtpInput
          length={CODE_LENGTH}
          value={expired ? "" : code}
          tone={verifyCode.isPending ? "verifying" : invalid ? "invalid" : "idle"}
          onChange={(next) => {
            setInvalid(false);
            setCode(next);
            if (next.length === CODE_LENGTH) void confirm(next);
          }}
        />

        {error ? (
          <DsText v="caption" c="error-text" accessibilityRole="alert" style={styles.codeError}>
            {error}
          </DsText>
        ) : null}

        {retryIn > 0 && !expired ? (
          <View style={styles.resendRow}>
            <DsText v="body-sm">{t("mobile.code.resendIn")}</DsText>
            <DsText v="body-sm" w="600" numeric>
              {formatClock(retryIn)}
            </DsText>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            disabled={requestCode.isPending}
            onPress={() => void resend()}
            style={[styles.resendRow, requestCode.isPending && styles.dim]}
          >
            <DsText v="body-sm" w="600" c="brand-strong">
              {t("mobile.code.resend")}
            </DsText>
          </Pressable>
        )}
      </View>
    </AuthScreen>
  );
}

const RULES = [
  { id: "length", test: (value: string) => value.length >= 8 },
  { id: "digit", test: (value: string) => /\d/.test(value) },
  { id: "upper", test: (value: string) => /\p{Lu}/u.test(value) },
] as const;

export function NewPasswordPage() {
  const { t } = useTranslation("auth");
  const ds = useDs();
  const router = useRouter();
  const back = useBack();
  const { resetToken = "" } = useLocalSearchParams<{ resetToken?: string }>();
  const confirmReset = usePasswordResetConfirmMutation();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);

  const passed = RULES.map((rule) => rule.test(password));
  const strong = passed.every(Boolean);
  // Tasdiq yozilayotganda ham darhol: kiritilgani parol boshiga mos kelmasa — xato.
  const mismatch = confirm.length > 0 && !password.startsWith(confirm);

  async function submit() {
    if (!resetToken || !strong || password !== confirm) return;
    try {
      await confirmReset.mutateAsync({ resetToken, password });
      setDone(true);
    } catch (caught) {
      showErrorToast({ title: t("mobile.login.errorToastTitle"), description: describeResetError(caught, t) });
    }
  }

  if (!resetToken && !done) return <Redirect href={ROUTES.auth.forgotPassword} />;

  if (done)
    return (
      <AuthScreen
        layout="center"
        onBack={() => router.replace(ROUTES.auth.login)}
        hero={
          <View style={[styles.doneOuter, { backgroundColor: ds.c["success-bg"] }]}>
            <View style={[styles.doneInner, { backgroundColor: ds.c["success-fg"] }]}>
              <Check size={22} strokeWidth={3} color={ds.c["on-action"]} />
            </View>
          </View>
        }
        title={t("mobile.newPassword.doneTitle")}
        description={t("mobile.newPassword.doneDescription")}
        action={<AuthButton onPress={() => router.replace(ROUTES.auth.login)}>{t("form.submit")}</AuthButton>}
      />
    );

  return (
    <AuthScreen
      onBack={back}
      title={t("mobile.newPassword.title")}
      description={t("mobile.newPassword.description")}
      action={
        <AuthButton
          loading={confirmReset.isPending}
          loadingLabel={t("mobile.newPassword.submitting")}
          disabled={!strong || !confirm}
          onPress={() => void submit()}
        >
          {t("mobile.newPassword.submit")}
        </AuthButton>
      }
    >
      <View style={styles.fields}>
        <AuthPasswordField
          autoComplete="new-password"
          textContentType="newPassword"
          label={t("mobile.newPassword.passwordLabel")}
          placeholder={t("mobile.newPassword.passwordPlaceholder")}
          accessibilityLabel={t("mobile.newPassword.passwordLabel")}
          value={password}
          visible={showPassword}
          onToggle={() => setShowPassword((value) => !value)}
          onChangeText={setPassword}
        />

        <View style={styles.fields}>
          <AuthPasswordField
            autoComplete="new-password"
            textContentType="newPassword"
            label={t("mobile.newPassword.confirmLabel")}
            placeholder={t("mobile.newPassword.confirmPlaceholder")}
            accessibilityLabel={t("mobile.newPassword.confirmLabel")}
            value={confirm}
            invalid={mismatch}
            invalidStyle="border"
            visible={showConfirm}
            onToggle={() => setShowConfirm((value) => !value)}
            onChangeText={setConfirm}
          />
          {mismatch ? <AuthFieldError>{t("mobile.newPassword.mismatch")}</AuthFieldError> : null}
        </View>

        {/* `flex-col gap-1.5 pl-2`; belgi `size-4 rounded-full`, bajarilsa `bg-success` */}
        <View style={styles.rules}>
          {RULES.map((rule, index) => (
            <View key={rule.id} style={styles.rule}>
              <View style={[styles.ruleDot, { backgroundColor: passed[index] ? ds.c.success : ds.c["line-strong"] }]}>
                <Check size={10} strokeWidth={3.5} color={ds.c["on-action"]} />
              </View>
              <DsText v="body-sm" w={passed[index] ? "500" : undefined} c={passed[index] ? "ink" : "ink-secondary"}>
                {t(`mobile.newPassword.rules.${rule.id}`)}
              </DsText>
            </View>
          ))}
        </View>
      </View>
    </AuthScreen>
  );
}

function LoginLink({ prefix }: { prefix: string }) {
  const { t } = useTranslation("auth");
  const router = useRouter();
  return (
    <>
      {prefix}{" "}
      <DsText v="body-sm" w="600" c="brand-strong" onPress={() => router.replace(ROUTES.auth.login)}>
        {t("form.submit")}
      </DsText>
    </>
  );
}

const styles = StyleSheet.create({
  /* `flex-col items-center` */
  code: { alignItems: "center" },
  /* `mt-3 text-center` */
  codeError: { marginTop: 12, textAlign: "center" },
  /* `mt-5 gap-2` */
  resendRow: { marginTop: 20, flexDirection: "row", alignItems: "center", gap: 8 },
  dim: { opacity: 0.6 },
  /* `flex-col gap-3` */
  fields: { gap: 12 },
  rules: { gap: 6, paddingLeft: 8 },
  /* `items-center gap-2.5` */
  rule: { flexDirection: "row", alignItems: "center", gap: 10 },
  ruleDot: { width: 16, height: 16, borderRadius: dsRadius.full, alignItems: "center", justifyContent: "center" },
  /* `size-22 rounded-full bg-success-bg`, ichida `size-10 bg-success-fg` */
  doneOuter: { width: 88, height: 88, borderRadius: dsRadius.full, alignItems: "center", justifyContent: "center" },
  doneInner: { width: 40, height: 40, borderRadius: dsRadius.full, alignItems: "center", justifyContent: "center" },
});
