import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { Check } from "lucide-react-native";
import { DsText, dsRadius, useDs } from "@/shared/ui";
import { authApi } from "../api/auth.api";
import { EMAIL_CODE_LENGTH, describeEmailCodeError, isValidEmail } from "../lib/email-code";
import { useEmailCode } from "../model/use-email-code";
import { AuthField, AuthFieldError } from "./auth-screen";
import { OtpInput } from "./otp-input";

export interface RegisterEmail {
  email: string;
  token: string | null;
}

export interface RegisterEmailFieldProps {
  required: boolean;
  value: RegisterEmail;
  onChange: (value: RegisterEmail) => void;
  error?: string | null;
}

function clock(seconds: number): string {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

/**
 * Ro'yxatdan o'tishdagi email — veb #199 `register-email-field.tsx`:
 * email -> "Kod olish" -> 5 xonali kod -> "Tasdiqlandi" (`email_token`).
 * Maydon o'ngidagi kichik tugmalar `rounded-full px-3 py-1.5
 * text-caption-strong text-brand`.
 */
export function RegisterEmailField({ required, value, onChange, error }: RegisterEmailFieldProps) {
  const { t } = useTranslation("auth");
  const ds = useDs();
  const flow = useEmailCode({
    request: async (email) => {
      const sent = await authApi.requestRegisterEmailCode(email);
      return { expiresIn: sent?.expires_in, retryAfter: sent?.retry_after };
    },
    verify: async (email, code) => {
      const result = await authApi.verifyRegisterEmailCode(email, code);
      onChange({ email, token: result.email_token });
    },
    describe: (caught) => describeEmailCodeError(caught, t),
  });
  const valid = isValidEmail(value.email);
  const shownError = flow.error ?? error ?? null;

  function change() {
    flow.reset();
    onChange({ email: value.email, token: null });
  }

  const small = (label: string, onPress: () => void, disabled = false) => (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.small, pressed && { backgroundColor: ds.c["brand-subtle"] }, disabled && styles.dim]}
    >
      <DsText v="caption-strong" c="brand">
        {label}
      </DsText>
    </Pressable>
  );

  return (
    <View style={styles.root}>
      <AuthField
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        autoCapitalize="none"
        autoCorrect={false}
        placeholder={required ? t("email.placeholderRequired") : t("email.placeholderOptional")}
        accessibilityLabel={required ? t("email.placeholderRequired") : t("email.placeholderOptional")}
        value={value.email}
        editable={flow.stage === "idle"}
        invalid={Boolean(shownError) && flow.stage === "idle"}
        onChangeText={(email) => onChange({ email, token: null })}
        trailing={
          flow.stage === "verified" ? (
            <View style={styles.verified}>
              <Check size={15} color={ds.c["success-fg"]} />
              <DsText v="caption-strong" c="success-fg">
                {t("email.verified")}
              </DsText>
              {small(t("email.change"), change)}
            </View>
          ) : flow.stage === "sent" ? (
            small(t("email.change"), change)
          ) : (
            small(
              flow.sending ? t("email.sending") : t("email.getCode"),
              () => {
                onChange({ email: value.email, token: null });
                void flow.send(value.email);
              },
              !valid || flow.sending
            )
          )
        }
      />

      {flow.stage === "idle" && !shownError ? (
        <DsText v="caption" c="ink-secondary" style={styles.hint}>
          {required ? t("email.hintRequired") : t("email.hintOptional")}
        </DsText>
      ) : null}

      {flow.stage === "sent" ? (
        /* `items-center gap-2 rounded-2xl bg-subtle/60 px-3 py-3` */
        <View style={[styles.codeBox, { backgroundColor: ds.c.subtle }]}>
          <DsText v="caption" c="ink-secondary" style={styles.center}>
            {t("email.sentTo", { email: flow.sentTo, length: EMAIL_CODE_LENGTH })}
          </DsText>
          <OtpInput
            length={EMAIL_CODE_LENGTH}
            value={flow.expired ? "" : flow.code}
            tone={flow.verifying ? "verifying" : flow.invalid ? "invalid" : "idle"}
            onChange={flow.setCode}
          />
          {flow.expired ? (
            <DsText v="caption" c="error-text">
              {t("email.expired")}
            </DsText>
          ) : flow.invalid ? (
            <DsText v="caption" c="error-text">
              {t("email.invalidCode")}
            </DsText>
          ) : null}
          {flow.retryIn > 0 && !flow.expired ? (
            <DsText v="caption" c="ink-secondary">
              {t("email.resendIn")}{" "}
              <DsText v="caption" w="700" numeric>
                {clock(flow.retryIn)}
              </DsText>
            </DsText>
          ) : (
            <Pressable accessibilityRole="button" disabled={flow.sending} onPress={() => void flow.resend()} style={flow.sending ? styles.dim : undefined}>
              <DsText v="caption-strong" c="brand">
                {t("email.resend")}
              </DsText>
            </Pressable>
          )}
        </View>
      ) : null}

      {shownError ? <AuthFieldError>{shownError}</AuthFieldError> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 8 },
  center: { textAlign: "center" },
  hint: { paddingHorizontal: 4 },
  small: { flexShrink: 0, paddingHorizontal: 12, paddingVertical: 6, borderRadius: dsRadius.full },
  dim: { opacity: 0.4 },
  verified: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 0 },
  codeBox: { alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 12, borderRadius: dsRadius["2xl"] },
});
