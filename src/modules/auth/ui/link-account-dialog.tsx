import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import type { LinkedAccount } from "@/shared/types";
import {
  DsText,
  dsRadius,
  Icon,
  MobileButton,
  MobileFieldLabel,
  MobileInput,
  Sheet,
  useDs,
} from "@/shared/ui";
import { linkErrorOf, type LinkError } from "../lib/account-link";
import { useLinkAccountMutation } from "../model/auth.mutations";
import type { LinkPrompt } from "../model/use-account-switch";

export interface LinkAccountDialogProps {
  prompt: LinkPrompt | null;
  onClose: () => void;
  onLinked: (account: LinkedAccount) => void;
}

/**
 * Boshqa akkauntni login va parol bilan bog'lash — veb
 * `link-account-dialog.tsx` (tor ekranda pastdan chiqadigan oyna).
 * `prompt.role` bo'lsa (rol ochishda server 409 `account_exists` qaytargan),
 * login o'sha akkauntniki bilan qulflanadi.
 */
export function LinkAccountDialog({ prompt, onClose, onLinked }: LinkAccountDialogProps) {
  const { t } = useTranslation("account");
  const { t: tn } = useTranslation("nav");
  const ds = useDs();
  const link = useLinkAccountMutation();
  const [seed, setSeed] = useState(prompt);
  const [username, setUsername] = useState(prompt?.username ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<LinkError | null>(null);

  if (seed !== prompt) {
    setSeed(prompt);
    setUsername(prompt?.username ?? "");
    setPassword("");
    setError(null);
  }

  const locked = Boolean(prompt?.role);
  const ready = Boolean(username.trim() && password) && !link.isPending;
  const message =
    error?.kind === "two_factor"
      ? t("roleSwitcher.link.twoFactor")
      : error?.kind === "throttled"
        ? error.retryMinutes
          ? t("roleSwitcher.link.throttled", { count: error.retryMinutes })
          : error.message
        : (error?.message ?? "");

  function submit() {
    if (!ready) return;
    setError(null);
    link.mutate(
      { username: username.trim(), password },
      { onSuccess: onLinked, onError: (cause) => setError(linkErrorOf(cause)) }
    );
  }

  return (
    <Sheet
      variant="app"
      open={Boolean(prompt)}
      onClose={onClose}
      title={t("roleSwitcher.link.title")}
      description={
        prompt?.role
          ? t("roleSwitcher.link.existingText", {
              username: prompt.username,
              role: tn(`roles.${prompt.role.toLowerCase()}`, { defaultValue: prompt.role }),
            })
          : t("roleSwitcher.link.text")
      }
      footer={
        <>
          <MobileButton
            variant="secondary"
            label={t("roleSwitcher.link.cancel")}
            onPress={onClose}
          />
          <MobileButton
            label={link.isPending ? t("roleSwitcher.link.linking") : t("roleSwitcher.link.submit")}
            disabled={!ready}
            onPress={submit}
          />
        </>
      }
    >
      <View style={styles.form}>
        <MobileFieldLabel label={t("roleSwitcher.link.username")}>
          <MobileInput
            value={username}
            editable={!locked}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            invalid={error?.field === "username"}
            onChangeText={setUsername}
            returnKeyType="next"
            style={locked ? styles.locked : undefined}
          />
          {error?.field === "username" ? (
            <DsText v="body-xs" c="error-text">
              {error.message}
            </DsText>
          ) : null}
        </MobileFieldLabel>
        <MobileFieldLabel label={t("roleSwitcher.link.password")}>
          <MobileInput
            value={password}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            autoFocus={locked}
            invalid={error?.field === "password"}
            onChangeText={setPassword}
            onSubmitEditing={submit}
            returnKeyType="done"
          />
          {error?.field === "password" ? (
            <DsText v="body-xs" c="error-text">
              {error.message}
            </DsText>
          ) : null}
        </MobileFieldLabel>
        {message && !error?.field ? (
          // `flex items-start gap-2 rounded-xl bg-danger-bg px-3.5 py-2.5 text-body-sm text-error-text`
          <View
            accessibilityRole="alert"
            style={[styles.alert, { backgroundColor: ds.c["error-bg"] }]}
          >
            <Icon name="warning" size={18} color={ds.c["error-text"]} />
            <DsText v="body-sm" c="error-text" style={styles.grow}>
              {message}
            </DsText>
          </View>
        ) : null}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  form: { gap: 12, paddingBottom: 4 },
  locked: { opacity: 0.7 },
  alert: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: dsRadius.xl,
  },
  grow: { flex: 1, minWidth: 0 },
});
