import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import type { AppError } from "@/shared/api";
import { Text, toast, useTheme } from "@/shared/ui";
import type { TwoFactorChallenge } from "../api/auth.dto";
import { describeTwoFactorChallenge } from "../lib/describe-two-factor";
import { AuthButton, AuthFieldError, AuthScreen } from "./auth-screen";
import { OtpInput } from "./otp-input";

const CODE_LENGTH = 5;

export interface TwoFactorFormProps {
  challenge: TwoFactorChallenge;
  onSubmit: (code: string) => Promise<unknown>;
  onResend: () => Promise<unknown>;
  onCancel: () => void;
}

function formatClock(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/**
 * Ikki bosqichli kirishning SMS kodi — veb `two-factor-form.tsx` dagi
 * `MobileTwoFactorForm` (veb tor ekranda shuni ko'rsatadi). Kod amal qilish
 * va qayta yuborish taymerlari, xato va "Bekor qilish" vebdagidek.
 */
export function MobileTwoFactorForm({ challenge, onSubmit, onResend, onCancel }: TwoFactorFormProps) {
  const { t } = useTranslation("auth");
  const { palette } = useTheme();
  const [tracked, setTracked] = useState(challenge);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [expiresIn, setExpiresIn] = useState(challenge.expiresIn);
  const [retryIn, setRetryIn] = useState(challenge.retryAfter);

  // Qayta yuborilganda yangi `challenge` keladi — taymerlar va kod boshidan.
  if (tracked !== challenge) {
    setTracked(challenge);
    setCode("");
    setError(null);
    setExpiresIn(challenge.expiresIn);
    setRetryIn(challenge.retryAfter);
  }

  useEffect(() => {
    if (expiresIn <= 0 && retryIn <= 0) return undefined;
    const timer = setTimeout(() => {
      setExpiresIn((value) => (value > 0 ? value - 1 : 0));
      setRetryIn((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => clearTimeout(timer);
  }, [expiresIn, retryIn]);

  async function submit() {
    if (submitting) return;
    if (code.length < CODE_LENGTH) {
      setError(t("twoFactor.incomplete"));
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(code);
    } catch (caught) {
      const message = (caught as AppError).message || t("twoFactor.invalid");
      setError(message);
      setCode("");
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function resend() {
    setResending(true);
    try {
      await onResend();
      toast.success(t("twoFactor.resent"));
    } catch (caught) {
      toast.error((caught as AppError).message || t("twoFactor.resendFailed"));
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthScreen
      onBack={onCancel}
      title={t("twoFactor.title")}
      description={describeTwoFactorChallenge(challenge, t)}
      action={
        <AuthButton loading={submitting} loadingLabel={t("twoFactor.submitting")} onPress={() => void submit()}>
          {t("twoFactor.submit")}
        </AuthButton>
      }
      footer={
        <Text variant="label" style={{ color: palette.primary }} onPress={onCancel}>
          {t("twoFactor.cancel")}
        </Text>
      }
    >
      <View style={styles.fields}>
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
          <Text variant="label" style={[styles.note, { color: palette["destructive-strong"] }]}>
            {t("twoFactor.expired")}
          </Text>
        ) : (
          <Text variant="label" style={[styles.note, { color: palette["muted-foreground"] }]}>
            {t("twoFactor.validFor")}{" "}
            <Text variant="label" style={[styles.clock, { color: palette.foreground }]}>
              {formatClock(expiresIn)}
            </Text>
          </Text>
        )}

        {retryIn > 0 ? (
          <Text variant="label" style={[styles.note, { color: palette["muted-foreground"] }]}>
            {t("twoFactor.resendIn")}{" "}
            <Text variant="label" style={[styles.clock, { color: palette.foreground }]}>
              {formatClock(retryIn)}
            </Text>
          </Text>
        ) : (
          <Pressable
            accessibilityRole="button"
            disabled={resending}
            onPress={() => void resend()}
            style={[styles.resend, resending && styles.disabled]}
          >
            <Text variant="label" style={{ color: palette.primary }}>
              {t("twoFactor.resend")}
            </Text>
          </Pressable>
        )}
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  /* `flex flex-col gap-3` */
  fields: { gap: 12 },
  note: { paddingHorizontal: 4, fontWeight: "400" },
  clock: { fontWeight: "700", fontVariant: ["tabular-nums"] },
  resend: { alignSelf: "flex-start", paddingHorizontal: 4 },
  disabled: { opacity: 0.6 },
});
