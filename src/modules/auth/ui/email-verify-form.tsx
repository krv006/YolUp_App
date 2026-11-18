import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import type { AuthUser } from "@/shared/types";
import { DsText, MobileButton, MobileFieldLabel, MobileInput } from "@/shared/ui";
import { authApi } from "../api/auth.api";
import { mapUserDto } from "../lib/auth.mappers";
import { EMAIL_CODE_LENGTH, describeEmailCodeError, isValidEmail } from "../lib/email-code";
import { useAuthStore } from "../model/auth.store";
import { useEmailCode } from "../model/use-email-code";
import { OtpInput } from "./otp-input";

function clock(seconds: number): string {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export interface EmailVerifyFormProps {
  initialEmail: string;
  onVerified: (user: AuthUser) => void;
}

/**
 * Profil emailini tasdiqlash — veb #199 `email-verify-form.tsx`:
 * email -> "Kod yuborish" (`me/email/request`) -> 5 xonali kod
 * (`me/email/confirm`); javobdagi profil `setUser` bilan saqlanadi.
 */
export function EmailVerifyForm({ initialEmail, onVerified }: EmailVerifyFormProps) {
  const { t } = useTranslation("auth");
  const [email, setEmail] = useState(initialEmail);
  const flow = useEmailCode({
    request: async (address) => {
      const sent = await authApi.requestEmailChange(address);
      return { expiresIn: sent?.expires_in, retryAfter: sent?.retry_after };
    },
    verify: async (address, code) => {
      const user = mapUserDto(await authApi.confirmEmailChange(address, code));
      useAuthStore.getState().setUser(user);
      onVerified(user);
    },
    describe: (caught) => describeEmailCodeError(caught, t),
  });
  const valid = isValidEmail(email);

  if (flow.stage === "sent")
    return (
      <View style={styles.code}>
        <DsText v="body-sm" c="ink-secondary" style={styles.center}>
          {t("email.sentTo", { email: flow.sentTo, length: EMAIL_CODE_LENGTH })}{" "}
          <DsText v="body-sm" w="600" c="brand" onPress={flow.reset}>
            {t("email.change")}
          </DsText>
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
        {flow.error ? (
          <DsText v="caption" c="error-text" style={styles.center}>
            {flow.error}
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
            <DsText v="body-sm" w="600" c="brand">
              {t("email.resend")}
            </DsText>
          </Pressable>
        )}
      </View>
    );

  return (
    <View style={styles.form}>
      <MobileFieldLabel gap={8} label={t("emailVerify.label")}>
        <MobileInput
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="send"
          placeholder={t("mobile.reset.emailPlaceholder")}
          value={email}
          onChangeText={setEmail}
          onSubmitEditing={() => valid && void flow.send(email)}
        />
        <DsText v="caption" c="ink-secondary">
          {t("emailVerify.hint")}
        </DsText>
      </MobileFieldLabel>
      {flow.error ? (
        <DsText v="caption" c="error-text">
          {flow.error}
        </DsText>
      ) : null}
      <MobileButton label={flow.sending ? t("email.sending") : t("emailVerify.sendCode")} disabled={!valid || flow.sending} onPress={() => void flow.send(email)} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 12 },
  code: { alignItems: "center", gap: 12 },
  center: { textAlign: "center" },
  dim: { opacity: 0.5 },
});
