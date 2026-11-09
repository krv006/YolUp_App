import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import {
  useAuth,
  useChangePasswordMutation,
  useDeleteAccountMutation,
  useLogoutOtherSessionsMutation,
  useRevokeSessionMutation,
  useSessions,
  useUpdateLessonReminderMutation,
  useUpdateNotificationPrefsMutation,
  useUpdateSettingsMutation,
} from "@/modules/auth";
import { parentLogins, passwordStrength } from "@/modules/parent";
import { DeleteAccountDialog } from "@/pages/profile/profile-dialogs";
import { usePushPermission } from "@/pages/profile/system-settings-page";
import { AppError } from "@/shared/api";
import { ROUTES } from "@/shared/config";
import { formatRelativeShort } from "@/shared/lib";
import { SUPPORTED_LANGUAGES, useLanguageStore } from "@/shared/model";
import { useAppearanceStore, type ThemeMode } from "@/shared/model/theme.store";
import { ConfirmDialog, DsText, dsRadius, Icon, MobileButton, MobilePageHeader, Sheet, Switch, toast, useDs, type DsColor, type IconName } from "@/shared/ui";
import { ParentScreen, useParentBack } from "@/widgets/parent-shell";
import { ErrorsNote, SettingsCard, SettingsField, SettingsItem, SettingsLabel } from "./settings-parts";

const CHILD_ALERTS: Array<{ key: "notifyChildAbsent" | "notifyChildNewDevice" | "notifyHomeworkDue"; icon: IconName; bg: DsColor; fg: DsColor }> = [
  { key: "notifyChildAbsent", icon: "cancel", bg: "danger-bg", fg: "error-text" },
  { key: "notifyChildNewDevice", icon: "shield", bg: "accent-violet-bg", fg: "accent-violet-fg" },
  { key: "notifyHomeworkDue", icon: "hourglass-empty", bg: "accent-saffron-bg", fg: "accent-saffron-fg" },
];
const REMINDERS = [5, 10, 15, 30, 60, 0];
const THEMES: Array<{ id: ThemeMode; icon: IconName }> = [
  { id: "light", icon: "light-mode" },
  { id: "dark", icon: "dark-mode" },
  { id: "system", icon: "devices" },
];

/** Kichik segment — `flex gap-1 rounded-full bg-subtle p-1`, faoli `bg-surface text-brand shadow-sm`. */
function Pills<T extends string>({ items, value, onChange, render }: { items: readonly T[]; value: T; onChange: (value: T) => void; render: (item: T, active: boolean) => ReactNode }) {
  const ds = useDs();
  return (
    <View style={[styles.pills, { backgroundColor: ds.c.subtle }]}>
      {items.map((item) => {
        const active = value === item;
        return (
          <Pressable
            key={item}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(item)}
            style={[styles.pill, active && { backgroundColor: ds.c.surface, boxShadow: ds.shadow.sm }]}
          >
            {render(item, active)}
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * Sozlamalar — veb `settings-mobile-system.tsx` `SettingsMobile`: til va
 * mavzu, bildirishnomalar (push — OS ruxsati, e-pochta, dars eslatmasi),
 * farzand haqidagi ogohlantirishlar va o'chirilgan turlarni tiklash.
 */
export function SettingsMobile() {
  const { t } = useTranslation("parent");
  const { t: ta } = useTranslation("account");
  const ds = useDs();
  const back = useParentBack(ROUTES.parent.profile);
  const { user } = useAuth();
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const mode = useAppearanceStore((state) => state.mode);
  const setMode = useAppearanceStore((state) => state.setMode);
  const settings = useUpdateSettingsMutation();
  const push = usePushPermission();
  const prefs = useUpdateNotificationPrefsMutation();
  const reminder = useUpdateLessonReminderMutation();
  const [askPush, setAskPush] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const minutes = user?.lessonReminderMinutes ?? 0;
  const [draftMinutes, setDraftMinutes] = useState(minutes);
  const label = (value: number) =>
    !value ? t("settings.notifications.never") : value >= 60 ? t("settings.notifications.hours", { count: value / 60 }) : t("settings.notifications.minutes", { count: value });
  const muted = user?.mutedKinds.length ?? 0;

  return (
    <ParentScreen>
      <MobilePageHeader title={t("account.settings")} backLabel={t("account.profile")} onBack={back} />
      <SettingsLabel>{t("settings.interface.title")}</SettingsLabel>
      <SettingsCard>
        <SettingsItem icon="translate" tone={{ bg: "accent-blue-bg", fg: "accent-blue-fg" }} title={t("settings.interface.language")} last={false}>
          <Pills
            items={SUPPORTED_LANGUAGES}
            value={language}
            onChange={setLanguage}
            render={(code, active) => (
              <DsText v="caption-strong" c={active ? "brand" : "ink-secondary"}>
                {code.toUpperCase()}
              </DsText>
            )}
          />
        </SettingsItem>
        <SettingsItem icon="palette" tone={{ bg: "accent-violet-bg", fg: "accent-violet-fg" }} title={t("settings.interface.theme")} last>
          <Pills
            items={THEMES.map((item) => item.id)}
            value={mode}
            onChange={(next) => {
              setMode(next);
              settings.mutate({ theme: next });
            }}
            render={(id, active) => <Icon name={THEMES.find((item) => item.id === id)?.icon ?? "light-mode"} size={18} color={ds.c[active ? "brand" : "ink-secondary"]} />}
          />
        </SettingsItem>
      </SettingsCard>

      <SettingsLabel>{t("settings.notifications.title")}</SettingsLabel>
      <SettingsCard>
        <SettingsItem
          icon="notifications"
          tone={{ bg: "accent-saffron-bg", fg: "accent-saffron-fg" }}
          // Vebda "Brauzer bildirishnomalari" — mobilda OS push ruxsati (`account` lug'atidan).
          title={ta("page.pushTitle")}
          text={t("settings.notifications.pushText")}
          last={false}
        >
          <Switch size="lg" checked={push.granted} accessibilityLabel={ta("page.pushTitle")} onCheckedChange={(next) => (next ? setAskPush(true) : void push.toggle(false))} />
        </SettingsItem>
        <SettingsItem icon="mail" tone={{ bg: "accent-blue-bg", fg: "accent-blue-fg" }} title={t("settings.notifications.email")} text={t("settings.notifications.emailText")} last={false}>
          <Switch
            size="lg"
            checked={Boolean(user?.notifyEmail)}
            disabled={prefs.isPending}
            accessibilityLabel={t("settings.notifications.email")}
            onCheckedChange={(next) => prefs.mutate({ notifyEmail: next })}
          />
        </SettingsItem>
        <SettingsItem
          icon="schedule"
          tone={{ bg: "accent-green-bg", fg: "accent-green-fg" }}
          title={t("settings.notifications.reminder")}
          last
          chevron
          onPress={() => {
            setDraftMinutes(minutes);
            setReminderOpen(true);
          }}
        >
          <DsText v="body-sm" c="ink-secondary">
            {label(minutes)}
          </DsText>
        </SettingsItem>
      </SettingsCard>

      <SettingsLabel>{t("settings.alerts.title")}</SettingsLabel>
      <SettingsCard>
        {CHILD_ALERTS.map((alert, index) => (
          <SettingsItem
            key={alert.key}
            icon={alert.icon}
            tone={{ bg: alert.bg, fg: alert.fg }}
            title={t(`settings.alerts.${alert.key}.title`)}
            text={t(`settings.alerts.${alert.key}.text`)}
            last={index === CHILD_ALERTS.length - 1 && !muted}
          >
            <Switch
              size="lg"
              checked={Boolean(user?.[alert.key])}
              disabled={prefs.isPending}
              accessibilityLabel={t(`settings.alerts.${alert.key}.title`)}
              onCheckedChange={(next) => prefs.mutate({ [alert.key]: next })}
            />
          </SettingsItem>
        ))}
        {muted ? (
          <SettingsItem icon="notifications-off" tone={{ bg: "subtle", fg: "icon-secondary" }} title={t("settings.alerts.muted.title")} text={t("settings.alerts.muted.text", { count: muted })} last>
            <Pressable
              accessibilityRole="button"
              disabled={prefs.isPending}
              onPress={() => prefs.mutate({ mutedKinds: [] }, { onSuccess: () => toast.success(t("settings.alerts.muted.done")) })}
              style={({ pressed }) => [styles.reset, { backgroundColor: ds.c["brand-subtle"], opacity: prefs.isPending ? 0.5 : pressed ? 0.85 : 1 }]}
            >
              <DsText v="button" c="brand">
                {t("settings.alerts.muted.reset")}
              </DsText>
            </Pressable>
          </SettingsItem>
        ) : null}
      </SettingsCard>

      <Sheet
        variant="app"
        open={reminderOpen}
        onClose={() => setReminderOpen(false)}
        title={t("settings.notifications.reminder")}
        description={t("settings.notifications.reminderText")}
        footer={
          <MobileButton
            label={t("settings.profile.save")}
            disabled={reminder.isPending}
            onPress={() =>
              reminder.mutate(draftMinutes, {
                onSuccess: () => {
                  setReminderOpen(false);
                  toast.success(t("settings.notifications.reminderSaved"));
                },
                onError: (error: Error) => toast.error(error.message),
              })
            }
          />
        }
      >
        <View accessibilityRole="radiogroup">
          {REMINDERS.map((value) => {
            const active = draftMinutes === value;
            return (
              <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: active }} onPress={() => setDraftMinutes(value)} style={styles.option}>
                <DsText v="title-sm" c={active ? "brand" : "ink"}>
                  {label(value)}
                </DsText>
                <View style={[styles.radio, { borderColor: active ? ds.c.brand : ds.c["line-strong"] }]}>
                  {active ? <View style={[styles.radioDot, { backgroundColor: ds.c.brand }]} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </Sheet>
      <ConfirmDialog
        tone="brand"
        open={askPush}
        onOpenChange={setAskPush}
        icon="notifications"
        title={t("settings.notifications.askTitle")}
        description={t("settings.notifications.askText")}
        confirmLabel={t("settings.notifications.allow")}
        cancelLabel={t("settings.notifications.later")}
        onConfirm={() => {
          setAskPush(false);
          void push.toggle(true);
        }}
      />
    </ParentScreen>
  );
}

/** Xavfsizlik — veb `SecurityMobile`: parol, sessiyalar (alohida chiqarish), boshqalarini yopish. */
export function SecurityMobile() {
  const { t } = useTranslation("parent");
  const { t: ta } = useTranslation("account");
  const ds = useDs();
  const back = useParentBack(ROUTES.parent.profile);
  const { user, logout } = useAuth();
  const sessions = useSessions();
  const revoke = useRevokeSessionMutation();
  const logoutOthers = useLogoutOtherSessionsMutation();
  const deleteAccount = useDeleteAccountMutation();
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const list = sessions.data ?? [];
  const others = list.filter((item) => !item.isCurrent);
  const router = useRouter();

  return (
    <ParentScreen onRefresh={() => sessions.refetch()}>
      <MobilePageHeader title={t("settings.security.title")} backLabel={t("account.profile")} onBack={back} />
      <View style={[styles.protected, { backgroundColor: ds.c["success-bg"] }]}>
        <Icon name="check-circle" size={20} color={ds.c["success-text"]} />
        <DsText v="body-sm" w="500" c="success-text" style={styles.grow}>
          {t("mobile.settings.protected", { count: list.length || 1 })}
        </DsText>
      </View>
      <SettingsLabel>{t("mobile.settings.password")}</SettingsLabel>
      <SettingsCard>
        <SettingsItem
          icon="key"
          tone={{ bg: "brand-subtle", fg: "brand" }}
          title={t("settings.security.password")}
          text={user?.passwordChangedAt ? t("mobile.settings.changedAt", { when: formatRelativeShort(user.passwordChangedAt) }) : undefined}
          last
          onPress={() => router.push(ROUTES.parent.settings("password") as never)}
        />
      </SettingsCard>
      <SettingsLabel>{t("mobile.settings.sessions", { count: list.length })}</SettingsLabel>
      <SettingsCard style={sessions.isLoading ? styles.loading : undefined}>
        {list.map((session, index) => (
          <SettingsItem
            key={session.id}
            icon={parentLogins.deviceKind(session.device) === "computer" ? "laptop" : "smartphone"}
            tone={{ bg: "subtle", fg: "icon-secondary" }}
            title={session.device || t("settings.security.unknownDevice")}
            text={[session.city, session.isCurrent ? t("settings.security.now") : session.lastActive ? formatRelativeShort(session.lastActive) : ""].filter(Boolean).join(" · ")}
            last={index === list.length - 1}
          >
            {session.isCurrent ? (
              <View style={[styles.current, { backgroundColor: ds.c["success-bg"] }]}>
                <Icon name="check-circle" size={14} color={ds.c["success-text"]} />
                <DsText v="caption-strong" c="success-text">
                  {t("settings.security.current")}
                </DsText>
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                disabled={revoke.isPending}
                onPress={() => revoke.mutate(session.id, { onSuccess: () => toast.success(t("settings.security.ended")) })}
                style={({ pressed }) => [styles.signOut, { backgroundColor: ds.c["brand-subtle"], opacity: revoke.isPending ? 0.5 : pressed ? 0.85 : 1 }]}
              >
                <DsText v="caption-strong" c="brand">
                  {t("mobile.settings.signOut")}
                </DsText>
              </Pressable>
            )}
          </SettingsItem>
        ))}
      </SettingsCard>
      {others.length ? (
        <SettingsCard>
          <SettingsItem icon="logout" tone={{ bg: "danger-bg", fg: "error-text" }} title={t("settings.security.endOthers")} last chevron={false} onPress={() => setConfirm(true)} />
        </SettingsCard>
      ) : null}
      <DsText v="body-xs" c="ink-secondary" style={styles.tip}>
        {t("logins.tip.text")}
      </DsText>
      {/*
       * Mobilga xos: vebda ota-onada hisobni o'chirish yo'q, Play Market esa
       * ilova ichida ro'yxatdan o'tiladigan hisoblar uchun uni talab qiladi.
       * O'qituvchi/o'quvchidagi bilan bir xil oqim (`DeleteAccountDialog`).
       */}
      <SettingsLabel>{ta("page.dangerSectionTitle")}</SettingsLabel>
      <SettingsCard>
        <SettingsItem icon="logout" tone={{ bg: "danger-bg", fg: "error-text" }} title={ta("page.deleteAccount")} danger last onPress={() => setDeleting(true)} />
      </SettingsCard>
      <DeleteAccountDialog
        open={deleting}
        pending={deleteAccount.isPending}
        onOpenChange={setDeleting}
        onConfirm={() =>
          deleteAccount.mutate(undefined, {
            onSuccess: () => {
              setDeleting(false);
              void logout();
            },
            onError: (error: Error) => toast.error(error.message),
          })
        }
      />
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        icon="logout"
        title={t("mobile.settings.endOthersTitle")}
        description={t("mobile.settings.endOthersText", { count: others.length })}
        confirmLabel={t("mobile.settings.endOthersConfirm")}
        cancelLabel={t("account.cancel")}
        pending={logoutOthers.isPending}
        onConfirm={() =>
          logoutOthers.mutate(undefined, {
            onSuccess: () => {
              setConfirm(false);
              toast.success(t("settings.security.othersEnded"));
            },
          })
        }
      />
    </ParentScreen>
  );
}

/** Parolni almashtirish — veb `PasswordMobile`: joriy, yangi va takror, kuch ko'rsatkichi va qoidalar. */
export function PasswordMobile() {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const back = useParentBack(ROUTES.parent.settings("security"));
  const change = useChangePasswordMutation();
  const [values, setValues] = useState({ current: "", next: "", repeat: "" });
  const [errors, setErrors] = useState<Partial<Record<"current" | "next" | "repeat", string>>>({});
  const strength = passwordStrength(values.next);
  const errorCount = Object.values(errors).filter(Boolean).length;

  function submit() {
    const local: typeof errors = {};
    if (!strength.length || !strength.digit) local.next = t("settings.security.weak");
    if (values.repeat !== values.next) local.repeat = t("settings.security.mismatch");
    setErrors(local);
    if (Object.keys(local).length) return;
    change.mutate(
      { currentPassword: values.current, newPassword: values.next },
      {
        onSuccess: () => {
          toast.success(t("settings.security.changed"));
          back();
        },
        onError: (error) => {
          const fields = error instanceof AppError ? error.fields : null;
          const pick = (key: string) => {
            const value = fields?.[key];
            return Array.isArray(value) ? value.join(" ") : value ? String(value) : "";
          };
          const next = { current: pick("current_password") || (pick("new_password") ? "" : error.message), next: pick("new_password") };
          setErrors(Object.fromEntries(Object.entries(next).filter(([, value]) => value)));
        },
      }
    );
  }

  const field = (key: "current" | "next" | "repeat", label: string, hint?: string) => (
    <SettingsField
      label={label}
      hint={hint}
      error={errors[key]}
      value={values[key]}
      secureTextEntry
      autoCapitalize="none"
      autoCorrect={false}
      autoComplete={key === "current" ? "current-password" : "new-password"}
      textContentType={key === "current" ? "password" : "newPassword"}
      onChangeText={(value) => {
        setValues((current) => ({ ...current, [key]: value }));
        setErrors((current) => ({ ...current, [key]: "" }));
      }}
    />
  );
  const tone: DsColor = strength.level === "strong" ? "success" : strength.level === "medium" ? "saffron" : "danger";

  return (
    <ParentScreen keyboard>
      <MobilePageHeader title={t("settings.security.password")} backLabel={t("settings.security.title")} onBack={back} />
      {errorCount ? <ErrorsNote>{t("mobile.settings.fixFields", { count: errorCount })}</ErrorsNote> : null}
      {field("current", t("mobile.settings.currentPassword"))}
      {field("next", t("settings.security.next"), t("mobile.settings.secret"))}
      {field("repeat", t("settings.security.repeat"))}
      <View style={[styles.strength, { backgroundColor: ds.c.surface }]}>
        <View style={styles.strengthHead}>
          <DsText v="body-sm" w="600" c="ink-secondary">
            {t("mobile.settings.strength")}
          </DsText>
          <View style={[styles.level, { backgroundColor: ds.c.subtle }]}>
            <DsText v="caption-strong">{t(`mobile.settings.levels.${strength.level}`)}</DsText>
          </View>
        </View>
        <View style={[styles.track, { backgroundColor: ds.c.subtle }]}>
          <View style={[styles.fill, { width: `${(strength.score / 4) * 100}%`, backgroundColor: ds.c[tone] }]} />
        </View>
        {(["length", "digit", "cases"] as const).map((rule) => (
          <View key={rule} style={styles.rule}>
            <Icon name={strength[rule] ? "check-circle" : "radio-unchecked"} size={18} color={ds.c[strength[rule] ? "success" : "icon-tertiary"]} />
            <DsText v="body-xs">{t(`mobile.settings.rules.${rule}`)}</DsText>
          </View>
        ))}
      </View>
      <View style={styles.spacer} />
      <View style={styles.buttons}>
        <MobileButton variant="secondary" label={t("settings.profile.cancel")} onPress={back} />
        <MobileButton label={t("mobile.settings.update")} disabled={!values.current || !values.next || !values.repeat || change.isPending} onPress={submit} />
      </View>
    </ParentScreen>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  spacer: { flexGrow: 1 },
  loading: { opacity: 0.6 },
  pills: { flexShrink: 0, flexDirection: "row", gap: 4, padding: 4, borderRadius: dsRadius.full },
  /* `grid h-8 min-w-10 place-items-center rounded-full px-2.5 text-caption-strong` */
  pill: { height: 32, minWidth: 40, alignItems: "center", justifyContent: "center", paddingHorizontal: 10, borderRadius: 16 },
  reset: { flexShrink: 0, height: 36, justifyContent: "center", paddingHorizontal: 14, borderRadius: dsRadius.full },
  option: { height: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  radioDot: { width: 12, height: 12, borderRadius: 6 },
  protected: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderRadius: dsRadius["2xl"] },
  current: { flexShrink: 0, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: dsRadius.full },
  signOut: { flexShrink: 0, height: 36, justifyContent: "center", paddingHorizontal: 14, borderRadius: dsRadius.full },
  tip: { paddingHorizontal: 4 },
  strength: { gap: 12, padding: 16, borderRadius: 20 },
  strengthHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  level: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: dsRadius.full },
  track: { height: 6, overflow: "hidden", borderRadius: 3 },
  fill: { height: "100%", borderRadius: 3 },
  rule: { flexDirection: "row", alignItems: "center", gap: 8 },
  buttons: { flexDirection: "row", gap: 12 },
});
