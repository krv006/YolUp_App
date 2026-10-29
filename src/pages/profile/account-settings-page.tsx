import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth, useAuthStore, useChangePasswordMutation, useDeleteAccountMutation, useRoleRoutes, useUpdateSettingsMutation } from "@/modules/auth";
import { AppError } from "@/shared/api";
import { DsText, dsRadius, Icon, MobileButton, MobileFieldLabel, MobileInput, Sheet, toast, useDs } from "@/shared/ui";
import { DeleteAccountDialog } from "./profile-dialogs";
import { ProfileSubPage, SettingsRow, SettingsSection } from "./profile-shell";
import { SETTINGS_TONES } from "./settings-tones";

type DialogId = "password" | "delete" | null;

function PasswordField({ label, value, invalid = false, autoComplete, onChange, children }: { label: string; value: string; invalid?: boolean; autoComplete: "current-password" | "new-password"; onChange: (value: string) => void; children?: ReactNode }) {
  const ds = useDs();
  return (
    <MobileFieldLabel gap={7} label={label}>
      <View>
        <MobileInput secureTextEntry autoComplete={autoComplete} autoCapitalize="none" value={value} invalid={invalid} onChangeText={onChange} style={invalid ? styles.withIcon : undefined} />
        {invalid ? (
          <View pointerEvents="none" style={styles.inputIcon}>
            <Icon name="warning-fill" size={20} color={ds.c.danger} />
          </View>
        ) : null}
      </View>
      {children}
    </MobileFieldLabel>
  );
}

/**
 * Akkaunt va xavfsizlik — veb `account-settings-page.tsx` (tor ekran): login
 * (bosilganda o'zgartirish oynasi) va telefon; parolni almashtirish,
 * kirishlar tarixi; akkauntni o'chirish. Ikki bosqichli tasdiqlash vebda
 * ham olib tashlangan (#160).
 */
export function AccountSettingsPage() {
  const { t } = useTranslation("account");
  const ds = useDs();
  const router = useRouter();
  const routes = useRoleRoutes();
  const { user } = useAuth();
  const changePassword = useChangePasswordMutation();
  const deleteAccount = useDeleteAccountMutation();
  const updateSettings = useUpdateSettingsMutation();
  const logout = useAuthStore((state) => state.logout);
  const [dialog, setDialog] = useState<DialogId>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [mismatch, setMismatch] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  function saveUsername() {
    const value = username?.trim() ?? "";
    if (!value || value === user?.username) {
      setUsername(null);
      return;
    }
    setUsernameError(null);
    updateSettings.mutate(
      { username: value },
      {
        onSuccess: () => {
          toast.success(t("page.usernameSaved"));
          setUsername(null);
        },
        onError: (error: Error) => {
          const field = error instanceof AppError ? error.fields?.username : undefined;
          setUsernameError((Array.isArray(field) ? field[0] : field) ?? error.message);
        },
      }
    );
  }

  function closePassword() {
    setDialog(null);
    setCurrentPassword("");
    setNewPassword("");
    setRepeatPassword("");
    setMismatch(false);
  }

  function savePassword() {
    if (!currentPassword || !newPassword) {
      toast.error(t("page.passwordRule"));
      return;
    }
    if (newPassword !== repeatPassword) {
      setMismatch(true);
      return;
    }
    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          toast.success(t("page.passwordChanged"));
          closePassword();
        },
        onError: (error: Error) => toast.error(error.message),
      }
    );
  }

  return (
    <ProfileSubPage title={t("page.accountTitle")}>
      <SettingsSection label={t("page.loginSectionTitle")}>
        <SettingsRow
          icon="person"
          tone={SETTINGS_TONES.brand}
          title={t("page.loginLabel")}
          value={user?.username ?? "—"}
          onPress={() => {
            setUsernameError(null);
            setUsername(user?.username ?? "");
          }}
        />
        <SettingsRow icon="call" tone={SETTINGS_TONES.success} title={t("page.mobile.phone")} value={user?.phone || "—"} />
      </SettingsSection>

      <SettingsSection label={t("page.securitySectionTitle")}>
        <SettingsRow
          icon="shield"
          tone={SETTINGS_TONES.warning}
          title={t("page.changePassword")}
          hint={user?.passwordChangedAt ? `${t("page.changePasswordHint")}${user.passwordChangedAt}` : undefined}
          onPress={() => setDialog("password")}
        />
        <SettingsRow icon="clock" tone={SETTINGS_TONES.brand} title={t("page.loginsTitle")} hint={t("page.loginsRowHint")} onPress={() => router.push(`${routes.profile}/logins` as never)} />
      </SettingsSection>

      <View style={styles.danger}>
        <DsText v="title" w="400" style={styles.dangerLabel}>
          {t("page.dangerSectionTitle")}
        </DsText>
        <Pressable accessibilityRole="button" onPress={() => setDialog("delete")} style={({ pressed }) => [styles.deleteRow, { backgroundColor: ds.c.surface, opacity: pressed ? 0.85 : 1 }]}>
          <View style={[styles.deleteIcon, { backgroundColor: ds.c["danger-bg"] }]}>
            <Icon name="logout" size={20} color={ds.c["error-text"]} />
          </View>
          <DsText v="title" c="error-text" numberOfLines={1} style={styles.grow}>
            {t("page.deleteAccount")}
          </DsText>
        </Pressable>
      </View>

      <Sheet
        variant="app"
        open={dialog === "password"}
        onClose={closePassword}
        title={t("page.changePassword")}
        footer={<MobileButton label={t("page.updatePassword")} disabled={changePassword.isPending} onPress={savePassword} />}
      >
        <View style={styles.fields}>
          <PasswordField label={t("page.currentPassword")} autoComplete="current-password" value={currentPassword} onChange={setCurrentPassword} />
          <PasswordField label={t("page.newPassword")} autoComplete="new-password" value={newPassword} onChange={setNewPassword}>
            <DsText v="body-xs" c="ink-tertiary">
              {t("page.passwordRule")}
            </DsText>
          </PasswordField>
          <PasswordField
            label={t("page.repeatPassword")}
            autoComplete="new-password"
            value={repeatPassword}
            invalid={mismatch}
            onChange={(value) => {
              setRepeatPassword(value);
              setMismatch(false);
            }}
          >
            {mismatch ? (
              <DsText v="body-xs" c="danger">
                {t("page.passwordMismatch")}
              </DsText>
            ) : null}
          </PasswordField>
        </View>
      </Sheet>

      <DeleteAccountDialog
        open={dialog === "delete"}
        pending={deleteAccount.isPending}
        onOpenChange={(open) => !open && setDialog(null)}
        onConfirm={() =>
          deleteAccount.mutate(undefined, {
            onSuccess: () => {
              setDialog(null);
              void logout();
            },
            onError: (error: Error) => toast.error(error.message),
          })
        }
      />

      <Sheet
        variant="app"
        open={username !== null}
        onClose={() => setUsername(null)}
        title={t("page.usernameTitle")}
        description={t("page.usernameHint")}
        footer={
          <>
            <MobileButton variant="secondary" label={t("page.cancel")} onPress={() => setUsername(null)} />
            <MobileButton label={t("page.save")} disabled={updateSettings.isPending || !username?.trim()} onPress={saveUsername} />
          </>
        }
      >
        <MobileFieldLabel label={t("page.loginLabel")}>
          <MobileInput
            value={username ?? ""}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            invalid={Boolean(usernameError)}
            onChangeText={(value) => {
              setUsernameError(null);
              setUsername(value);
            }}
            onSubmitEditing={saveUsername}
            returnKeyType="done"
          />
          {usernameError ? (
            <DsText v="body-xs" c="error-text">
              {usernameError}
            </DsText>
          ) : null}
        </MobileFieldLabel>
      </Sheet>
    </ProfileSubPage>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  danger: { gap: 13 },
  dangerLabel: { lineHeight: 20 },
  deleteRow: { minHeight: 71, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 16, borderRadius: dsRadius.xl },
  deleteIcon: { width: 40, height: 40, borderRadius: dsRadius.md, alignItems: "center", justifyContent: "center" },
  /* `-mt-0.5 gap-[15px]` */
  fields: { marginTop: -2, gap: 15 },
  withIcon: { paddingRight: 48 },
  inputIcon: { position: "absolute", top: 0, bottom: 0, right: 16, justifyContent: "center" },
});
