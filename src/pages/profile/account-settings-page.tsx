import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import {
  useAuth,
  useAuthStore,
  useChangePasswordMutation,
  useDeleteAccountMutation,
  useLogoutOtherSessionsMutation,
  useRevokeSessionMutation,
  useSessions,
} from "@/modules/auth";
import { useQuizColors } from "@/modules/quiz";
import { ROUTES } from "@/shared/config";
import {
  ConfirmSheet,
  Icon,
  Input,
  radius,
  Sheet,
  SheetButton,
  SheetFooter,
  Switch,
  Text,
  toast,
  useTheme,
} from "@/shared/ui";
import { ProfileSubPage, RowPill, SectionLabel, SettingsCard, SettingsRow, SettingsSection } from "./profile-shell";

type DialogId = "password" | "logoutOthers" | "delete" | null;

/** Akkaunt sozlamalari — veb `pages/profile/account-settings-page.tsx`. */
export function AccountSettingsPage() {
  const { t } = useTranslation("account");
  const { palette } = useTheme();
  const legacy = useQuizColors();
  const router = useRouter();
  const { user } = useAuth();
  const sessionList = useSessions();
  const changePassword = useChangePasswordMutation();
  const revokeSession = useRevokeSessionMutation();
  const logoutOthers = useLogoutOtherSessionsMutation();
  const deleteAccount = useDeleteAccountMutation();
  const logout = useAuthStore((state) => state.logout);
  const [dialog, setDialog] = useState<DialogId>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");

  const sessions = sessionList.data ?? [];

  function submitPassword() {
    if (!currentPassword || !newPassword) {
      toast.error(t("page.passwordRule"));
      return;
    }
    if (newPassword !== repeatPassword) {
      toast.error(t("page.passwordMismatch"));
      return;
    }
    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          toast.success(t("page.passwordChanged"));
          setCurrentPassword("");
          setNewPassword("");
          setRepeatPassword("");
          setDialog(null);
        },
        onError: (error: Error) => toast.error(error.message),
      }
    );
  }

  return (
    <ProfileSubPage title={t("page.accountTitle")}>
      <SettingsSection label={t("page.loginSection")}>
        <SettingsRow
          icon="person"
          title={user?.phone ?? "—"}
          hint={t("page.phoneLabel")}
          right={
            <RowPill
              icon="check-circle"
              label={t("page.verified")}
              color={palette["success-strong"]}
              background={palette["success-soft"]}
            />
          }
        />
        <SettingsRow
          icon="assign"
          title={user?.email ?? "—"}
          hint={t("page.emailLabel")}
          onPress={() => toast.info(t("page.notAvailable"))}
        />
        <SettingsRow
          icon="more"
          title={t("page.changePassword")}
          hint={user?.passwordChangedAt ?? "—"}
          onPress={() => setDialog("password")}
        />
      </SettingsSection>

      <SettingsSection label={t("page.securitySection")}>
        <SettingsRow
          icon="check-circle"
          tone={legacy.success}
          title={t("page.twoFactor")}
          hint={t("page.twoFactorHint")}
          right={
            <Switch
              checked={false}
              onCheckedChange={() => toast.info(t("page.notAvailable"))}
              accessibilityLabel={t("page.twoFactor")}
            />
          }
        />
      </SettingsSection>

      <SettingsSection label={t("page.sessionsSection")}>
        {sessionList.isLoading ? (
          <View style={styles.skeletons}>
            {Array.from({ length: 2 }, (_, index) => (
              <View key={index} style={[styles.skeleton, { backgroundColor: palette.muted }]} />
            ))}
          </View>
        ) : null}
        {sessions.map((item) => (
          <SettingsRow
            key={item.id}
            icon="eye"
            tone={palette["subtle-foreground"]}
            title={item.device || "—"}
            hint={[item.ip, item.city, item.lastActive].filter(Boolean).join(" · ")}
            right={
              item.isCurrent ? (
                <RowPill label={t("page.thisDevice")} color={palette.primary} background={palette["primary-soft"]} />
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("page.logoutOthers")}
                  onPress={() =>
                    revokeSession.mutate(item.id, {
                      onSuccess: () => toast.success(t("page.sessionClosed")),
                      onError: (error: Error) => toast.error(error.message),
                    })
                  }
                  style={styles.revoke}
                >
                  <View style={styles.flip}>
                    <Icon name="arrow-back" size={18} color={palette["subtle-foreground"]} />
                  </View>
                </Pressable>
              )
            }
          />
        ))}
        <SettingsRow
          icon="arrow-back"
          tone={palette.destructive}
          title={t("page.logoutOthers")}
          danger
          onPress={() => setDialog("logoutOthers")}
          right={null}
        />
      </SettingsSection>

      <View style={styles.section}>
        <SectionLabel>{t("page.dangerSection")}</SectionLabel>
        <SettingsCard danger>
          <SettingsRow
            icon="trash"
            tone={palette.destructive}
            title={t("page.deleteAccount")}
            hint={t("page.deleteAccountHint")}
            danger
            onPress={() => setDialog("delete")}
          />
        </SettingsCard>
      </View>

      <Sheet open={dialog === "password"} onClose={() => setDialog(null)} title={t("page.changePassword")}>
        <View style={styles.passwordForm}>
          <Input
            label={t("page.currentPassword")}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secure
            autoComplete="current-password"
          />
          <Input label={t("page.newPassword")} value={newPassword} onChangeText={setNewPassword} secure autoComplete="new-password" />
          <Input
            label={t("page.repeatPassword")}
            value={repeatPassword}
            onChangeText={setRepeatPassword}
            placeholder={t("page.repeatPlaceholder")}
            secure
            autoComplete="new-password"
          />
          <Text variant="caption" style={[styles.rule, { color: palette["subtle-foreground"] }]}>
            {t("page.passwordRule")}
          </Text>
        </View>
        <SheetFooter>
          <SheetButton title={t("page.cancel")} onPress={() => setDialog(null)} />
          <SheetButton
            variant="primary"
            title={t("page.updatePassword")}
            disabled={changePassword.isPending}
            onPress={submitPassword}
          />
        </SheetFooter>
      </Sheet>

      <ConfirmSheet
        open={dialog === "logoutOthers"}
        onClose={() => setDialog(null)}
        title={t("page.logoutOthersTitle")}
        description={t("page.logoutOthersDescription")}
        confirmLabel={t("page.logout")}
        cancelLabel={t("page.cancel")}
        loading={logoutOthers.isPending}
        onConfirm={() =>
          logoutOthers.mutate(undefined, {
            onSuccess: (count) => {
              toast.success(t("page.otherSessionsClosed", { count }));
              setDialog(null);
            },
            onError: (error: Error) => toast.error(error.message),
          })
        }
      />

      <ConfirmSheet
        open={dialog === "delete"}
        onClose={() => setDialog(null)}
        title={t("page.deleteAccountTitle")}
        description={t("page.deleteAccountDescription")}
        confirmLabel={t("page.delete")}
        cancelLabel={t("page.cancel")}
        loading={deleteAccount.isPending}
        onConfirm={() =>
          deleteAccount.mutate(undefined, {
            onSuccess: () => {
              setDialog(null);
              void Promise.resolve(logout()).then(() => router.replace(ROUTES.auth.login));
            },
            onError: (error: Error) => toast.error(error.message),
          })
        }
      />
    </ProfileSubPage>
  );
}

const styles = StyleSheet.create({
  section: { gap: 8 },
  skeletons: { gap: 8, padding: 16 },
  skeleton: { height: 48, borderRadius: radius.xl },
  revoke: { width: 36, height: 36, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  flip: { transform: [{ rotate: "180deg" }] },
  passwordForm: { gap: 12 },
  rule: { paddingHorizontal: 4, fontWeight: "500" },
});
