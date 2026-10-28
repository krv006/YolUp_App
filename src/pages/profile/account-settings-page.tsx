import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import {
  useAuth,
  useAuthStore,
  useChangePasswordMutation,
  useConfirmTwoFactorMutation,
  useDeleteAccountMutation,
  useDisableTwoFactorMutation,
  useEnableTwoFactorMutation,
  useRoleRoutes,
  useTwoFactorStatus,
} from "@/modules/auth";
import { OtpInput } from "@/modules/auth/ui/otp-input";
import { DsText, dsRadius, Icon, MobileButton, MobileFieldLabel, MobileInput, Sheet, toast, useDs } from "@/shared/ui";
import { DeleteAccountDialog } from "./profile-dialogs";
import { ProfileSubPage, SettingsRow, SettingsSection } from "./profile-shell";
import { SETTINGS_TONES } from "./settings-tones";

type DialogId = "password" | "delete" | "twoFactorEnable" | "twoFactorCode" | "twoFactorDisable" | null;

const TWO_FACTOR_CODE_LENGTH = 5;
const RESEND_SECONDS = 60;

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 9) return phone;
  const local = digits.slice(-9);
  return `+998 ${local.slice(0, 2)} *** ** ${local.slice(-2)}`;
}

function ResendTimer({ until, pending, onResend }: { until: number | null; pending: boolean; onResend: () => void }) {
  const { t } = useTranslation("account");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!until) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [until]);

  const left = until ? Math.max(0, Math.ceil((until - now) / 1000)) : 0;
  if (left > 0)
    return (
      <DsText v="body-sm" c="ink-secondary" numberOfLines={1} style={styles.grow}>
        {t("page.mobile.resendIn", { time: `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}` })}
      </DsText>
    );
  return (
    <DsText v="body-sm" w="500" c="brand" numberOfLines={1} accessibilityRole="button" onPress={pending ? undefined : onResend} style={[styles.grow, pending && styles.dim]}>
      {t("page.resendCode")}
    </DsText>
  );
}

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
 * va telefon; parolni almashtirish, ikki bosqichli tasdiqlash (yoqish — parol
 * va SMS kod, o'chirish — parol), kirishlar tarixi; akkauntni o'chirish.
 */
export function AccountSettingsPage() {
  const { t } = useTranslation("account");
  const ds = useDs();
  const router = useRouter();
  const routes = useRoleRoutes();
  const { user } = useAuth();
  const changePassword = useChangePasswordMutation();
  const deleteAccount = useDeleteAccountMutation();
  const twoFactor = useTwoFactorStatus();
  const enableTwoFactor = useEnableTwoFactorMutation();
  const confirmTwoFactor = useConfirmTwoFactorMutation();
  const disableTwoFactor = useDisableTwoFactorMutation();
  const logout = useAuthStore((state) => state.logout);
  const [dialog, setDialog] = useState<DialogId>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [twoFactorPassword, setTwoFactorPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [mismatch, setMismatch] = useState(false);
  const [resendAt, setResendAt] = useState<number | null>(null);

  const twoFactorEnabled = twoFactor.data?.enabled === true;

  function closeTwoFactor() {
    setDialog(null);
    setTwoFactorPassword("");
    setTwoFactorCode("");
    setResendAt(null);
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

  function sendCode(then?: () => void) {
    enableTwoFactor.mutate(twoFactorPassword, {
      onSuccess: () => {
        setResendAt(Date.now() + RESEND_SECONDS * 1000);
        then?.();
      },
      onError: (error: Error & { status?: number }) => toast.error(error.status === 503 ? t("page.twoFactorSmsUnavailable") : error.message),
    });
  }

  function startTwoFactor() {
    if (!twoFactorPassword) {
      toast.error(t("page.passwordRule"));
      return;
    }
    sendCode(() => setDialog("twoFactorCode"));
  }

  function finishTwoFactor() {
    if (twoFactorCode.length < TWO_FACTOR_CODE_LENGTH) {
      toast.error(t("page.twoFactorCodeRequired"));
      return;
    }
    confirmTwoFactor.mutate(twoFactorCode, {
      onSuccess: () => {
        toast.success(t("page.twoFactorEnabled"));
        closeTwoFactor();
      },
      onError: (error: Error) => toast.error(error.message),
    });
  }

  function stopTwoFactor() {
    if (!twoFactorPassword) {
      toast.error(t("page.passwordRule"));
      return;
    }
    disableTwoFactor.mutate(twoFactorPassword, {
      onSuccess: () => {
        toast.success(t("page.twoFactorDisabled"));
        closeTwoFactor();
      },
      onError: (error: Error) => toast.error(error.message),
    });
  }

  return (
    <ProfileSubPage title={t("page.accountTitle")}>
      <SettingsSection label={t("page.loginSectionTitle")}>
        <SettingsRow icon="person" tone={SETTINGS_TONES.brand} title={t("page.loginLabel")} value={user?.username ?? "—"} onPress={() => toast.info(t("page.notAvailable"))} />
        <SettingsRow
          icon="check-circle"
          tone={SETTINGS_TONES.success}
          title={t("page.mobile.phone")}
          value={user?.phone ? t("page.verified") : "—"}
          onPress={() => toast.info(t("page.notAvailable"))}
        />
      </SettingsSection>

      <SettingsSection label={t("page.securitySectionTitle")}>
        <SettingsRow
          icon="shield"
          tone={SETTINGS_TONES.warning}
          title={t("page.changePassword")}
          hint={user?.passwordChangedAt ? `${t("page.changePasswordHint")}${user.passwordChangedAt}` : undefined}
          onPress={() => setDialog("password")}
        />
        <SettingsRow
          icon="shield"
          tone={SETTINGS_TONES.violet}
          title={t("page.twoFactor")}
          value={twoFactorEnabled ? t("page.twoFactorOn") : t("page.twoFactorOff")}
          onPress={() => setDialog(twoFactorEnabled ? "twoFactorDisable" : "twoFactorEnable")}
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

      <Sheet
        variant="app"
        open={dialog === "twoFactorEnable"}
        onClose={closeTwoFactor}
        title={t("page.twoFactorEnableTitle")}
        description={t("page.twoFactorEnableDescription")}
        footer={
          <>
            <MobileButton variant="secondary" label={t("page.cancel")} onPress={closeTwoFactor} />
            <MobileButton label={t("page.enable")} disabled={enableTwoFactor.isPending} onPress={startTwoFactor} />
          </>
        }
      >
        <PasswordField label={t("page.currentPassword")} autoComplete="current-password" value={twoFactorPassword} onChange={setTwoFactorPassword} />
      </Sheet>

      <Sheet
        variant="app"
        open={dialog === "twoFactorCode"}
        onClose={closeTwoFactor}
        title={t("page.twoFactorCodeTitle")}
        description={user?.phone ? t("page.mobile.codeSentTo", { phone: maskPhone(user.phone) }) : t("page.twoFactorCodeDescription")}
        footer={<MobileButton label={t("page.confirmCode")} disabled={confirmTwoFactor.isPending} onPress={finishTwoFactor} />}
      >
        <View style={styles.code}>
          <OtpInput length={TWO_FACTOR_CODE_LENGTH} value={twoFactorCode} onChange={setTwoFactorCode} />
          <View style={styles.codeRow}>
            <ResendTimer until={resendAt} pending={enableTwoFactor.isPending} onResend={() => sendCode()} />
            <DsText
              v="body-sm"
              w="500"
              c="brand"
              accessibilityRole="button"
              onPress={() => {
                closeTwoFactor();
                router.push(`${routes.profile}/personal` as never);
              }}
            >
              {t("page.changeNumber")}
            </DsText>
          </View>
        </View>
      </Sheet>

      <Sheet
        variant="app"
        open={dialog === "twoFactorDisable"}
        onClose={closeTwoFactor}
        title={t("page.twoFactorDisableTitle")}
        description={t("page.twoFactorDisableDescription")}
        footer={
          <>
            <MobileButton variant="secondary" label={t("page.cancel")} onPress={closeTwoFactor} />
            <MobileButton variant="danger" label={t("page.delete")} disabled={disableTwoFactor.isPending} onPress={stopTwoFactor} />
          </>
        }
      >
        <PasswordField label={t("page.currentPassword")} autoComplete="current-password" value={twoFactorPassword} onChange={setTwoFactorPassword} />
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
    </ProfileSubPage>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  dim: { opacity: 0.5 },
  danger: { gap: 13 },
  dangerLabel: { lineHeight: 20 },
  deleteRow: { minHeight: 71, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 16, borderRadius: dsRadius.xl },
  deleteIcon: { width: 40, height: 40, borderRadius: dsRadius.md, alignItems: "center", justifyContent: "center" },
  /* `-mt-0.5 gap-[15px]` */
  fields: { marginTop: -2, gap: 15 },
  withIcon: { paddingRight: 48 },
  inputIcon: { position: "absolute", top: 0, bottom: 0, right: 16, justifyContent: "center" },
  code: { gap: 16 },
  codeRow: { flexDirection: "row", alignItems: "center", gap: 12 },
});
