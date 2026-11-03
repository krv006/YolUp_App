import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { useAuth, useRemoveAvatarMutation, useSessions, useUpdateAvatarMutation, useUpdateProfileMutation } from "@/modules/auth";
import { useParentLinks, useSelectedChild } from "@/modules/parent";
import { AppError } from "@/shared/api";
import { ROUTES } from "@/shared/config";
import { pickImage, toUploadFile } from "@/shared/lib";
import { Avatar, ConfirmDialog, DsText, dsRadius, Icon, MobileButton, MobilePageHeader, MobileRoundButton, Sheet, toast, useDs, type IconName } from "@/shared/ui";
import { ParentScreen, useParentBack } from "@/widgets/parent-shell";
import { ErrorsNote, SettingsCard, SettingsField, SettingsItem } from "./settings-parts";

const PHONE = /^\+998\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/;
type Field = "firstName" | "lastName" | "username" | "phone";
type PhotoAction = "camera" | "upload" | "remove";

const PHOTO_ACTIONS: Array<{ key: PhotoAction; icon: IconName }> = [
  { key: "camera", icon: "photo-camera-fill" },
  { key: "upload", icon: "image" },
  { key: "remove", icon: "delete-fill" },
];

/** Pastki oyna yopilib bo'lgach kamera / galereya ochiladi. */
const SHEET_CLOSE_MS = 350;

/**
 * Profil — veb `settings-mobile-profile.tsx` `ProfileHubMobile`: avatar va
 * ism (ma'lumotlar), xavfsizlik kartasi, menyu (ma'lumotlar, farzandlar,
 * kirishlar, bildirishnomalar, sozlamalar, yordam) va chiqish.
 */
export function ProfileHubMobile() {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const router = useRouter();
  const back = useParentBack(ROUTES.parent.dashboard);
  const { user, logout } = useAuth();
  const { children, selectedChildId } = useSelectedChild();
  const links = useParentLinks();
  const sessions = useSessions();
  const [confirm, setConfirm] = useState(false);
  const pending = (links.data ?? []).filter((link) => link.status === "pending").length;
  const go = (href: string) => router.push(href as never);

  const rows = [
    { icon: "person" as const, tone: { bg: "brand-subtle", fg: "brand" } as const, title: t("mobile.settings.info"), text: t("mobile.settings.infoText"), to: ROUTES.parent.settings("profile") },
    {
      icon: "group" as const,
      tone: { bg: "accent-green-bg", fg: "accent-green-fg" } as const,
      title: t("family.title"),
      text: pending ? t("mobile.settings.childrenPending", { linked: children.length, pending }) : t("mobile.settings.children", { count: children.length }),
      to: ROUTES.parent.children,
    },
    ...(selectedChildId
      ? [{ icon: "history" as const, tone: { bg: "accent-violet-bg", fg: "accent-violet-fg" } as const, title: t("profile.logins"), text: t("mobile.settings.loginsText"), to: ROUTES.parent.childLogins(selectedChildId) }]
      : []),
    { icon: "notifications" as const, tone: { bg: "accent-saffron-bg", fg: "accent-saffron-fg" } as const, title: t("settings.nav.notifications"), text: t("mobile.settings.notificationsText"), to: ROUTES.parent.notifications },
    { icon: "settings" as const, tone: { bg: "accent-blue-bg", fg: "accent-blue-fg" } as const, title: t("account.settings"), text: t("mobile.settings.settingsText"), to: ROUTES.parent.settings() },
    { icon: "help" as const, tone: { bg: "subtle", fg: "icon" } as const, title: t("account.help"), text: undefined, to: ROUTES.parent.help },
  ];

  return (
    <ParentScreen>
      <MobilePageHeader
        title={t("account.profile")}
        backLabel={t("mobile.tabs.home")}
        onBack={back}
        action={<MobileRoundButton icon="settings" label={t("account.settings")} onPress={() => go(ROUTES.parent.settings())} />}
      />
      <Pressable
        accessibilityRole="button"
        onPress={() => go(ROUTES.parent.settings("profile"))}
        style={({ pressed }) => [styles.me, { backgroundColor: pressed ? ds.c.subtle : ds.c.surface }]}
      >
        <Avatar variant="legacy" name={user?.name} src={user?.avatarUrl ?? undefined} size="lg" box={64} />
        <View style={styles.grow}>
          <DsText v="title-lg" heading numberOfLines={1}>
            {user?.name}
          </DsText>
          <DsText v="body-xs" c="ink-secondary">
            {t("mobile.settings.role", { count: children.length })}
          </DsText>
        </View>
        <Icon name="chevron-right" size={20} color={ds.c["icon-tertiary"]} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => go(ROUTES.parent.settings("security"))}
        style={({ pressed }) => [styles.security, { backgroundColor: ds.c["success-bg"] }, pressed && styles.pressed]}
      >
        <View style={[styles.securityIcon, { backgroundColor: ds.c.surface }]}>
          <Icon name="shield" size={22} color={ds.c["success-text"]} />
        </View>
        <View style={styles.grow}>
          <DsText v="title-sm" c="success-text">
            {t("mobile.settings.securityTitle")}
          </DsText>
          <DsText v="body-xs" c="ink-secondary">
            {t("mobile.settings.securityText", { count: sessions.data?.length ?? 1 })}
          </DsText>
        </View>
        <Icon name="chevron-right" size={20} color={ds.c["success-text"]} />
      </Pressable>
      <SettingsCard>
        {rows.map((row, index) => (
          <SettingsItem key={row.to} icon={row.icon} tone={row.tone} title={row.title} text={row.text} last={index === rows.length - 1} onPress={() => go(row.to)} />
        ))}
      </SettingsCard>
      <SettingsCard>
        <SettingsItem icon="logout" tone={{ bg: "danger-bg", fg: "error-text" }} title={t("account.logout")} danger last onPress={() => setConfirm(true)} />
      </SettingsCard>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        icon="logout"
        title={t("account.logoutTitle")}
        description={t("account.logoutText")}
        confirmLabel={t("account.logoutConfirm")}
        cancelLabel={t("account.cancel")}
        onConfirm={() => {
          setConfirm(false);
          void logout();
        }}
      />
    </ParentScreen>
  );
}

/**
 * Shaxsiy ma'lumotlar — veb `ProfileInfoMobile`: katta avatar (kamera,
 * galereya, o'chirish), login (nusxa olish), telefon, rol; pastda "Tahrirlash".
 */
export function ProfileInfoMobile() {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const router = useRouter();
  const back = useParentBack(ROUTES.parent.profile);
  const { user } = useAuth();
  const { children } = useSelectedChild();
  const upload = useUpdateAvatarMutation();
  const remove = useRemoveAvatarMutation();
  const [photoOpen, setPhotoOpen] = useState(false);
  if (!user) return null;

  async function pick(source: "camera" | "library") {
    const picked = await pickImage(source);
    if (!picked) return;
    upload.mutate(toUploadFile(picked), {
      onSuccess: () => toast.success(t("settings.profile.photoSaved")),
      onError: (error: Error) => toast.error(error.message),
    });
  }

  function photoAction(key: PhotoAction) {
    if (key === "remove") {
      remove.mutate(undefined, { onSuccess: () => toast.success(t("settings.profile.photoRemoved")) });
      return;
    }
    setTimeout(() => void pick(key === "camera" ? "camera" : "library"), SHEET_CLOSE_MS);
  }

  async function copy(value: string) {
    try {
      await Clipboard.setStringAsync(value);
      toast.success(t("createChild.copied"));
    } catch {
      toast.error(t("children.genericError"));
    }
  }

  const rows: Array<{ icon: IconName; label: string; value: string; copy?: string }> = [
    { icon: "alternate-email", label: t("mobile.settings.username"), value: `@${user.username}`, copy: user.username },
    { icon: "call", label: t("settings.profile.phone"), value: user.phone || "—" },
    { icon: "group", label: t("mobile.settings.roleLabel"), value: t("mobile.settings.role", { count: children.length }) },
  ];

  return (
    <ParentScreen>
      <MobilePageHeader title={t("mobile.settings.info")} backLabel={t("account.profile")} onBack={back} />
      <View style={styles.photo}>
        <View>
          <Avatar variant="legacy" name={user.name} src={user.avatarUrl ?? undefined} size="xl" box={96} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("settings.profile.photo")}
            disabled={upload.isPending || remove.isPending}
            onPress={() => setPhotoOpen(true)}
            style={[styles.camera, { backgroundColor: ds.c.brand, borderColor: ds.c.canvas }]}
          >
            <Icon name="photo-camera-fill" size={16} color={ds.c["on-action"]} />
          </Pressable>
        </View>
        <DsText v="h2" heading w="600" style={styles.name}>
          {user.name}
        </DsText>
      </View>
      <SettingsCard>
        {rows.map((row, index) => (
          <View key={row.label} style={[styles.infoRow, index < rows.length - 1 && { borderBottomWidth: 1, borderBottomColor: ds.c.line }]}>
            <View style={[styles.infoIcon, { backgroundColor: ds.c.subtle }]}>
              <Icon name={row.icon} size={22} color={ds.c["icon-secondary"]} />
            </View>
            <View style={styles.grow}>
              <DsText v="caption" c="ink-secondary">
                {row.label}
              </DsText>
              <DsText v="title-sm" numberOfLines={1}>
                {row.value}
              </DsText>
            </View>
            {row.copy ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("createChild.copy")}
                onPress={() => void copy(row.copy ?? "")}
                style={({ pressed }) => [styles.copy, { backgroundColor: pressed ? ds.c.muted : ds.c.subtle }]}
              >
                <Icon name="content-copy" size={18} color={ds.c.icon} />
              </Pressable>
            ) : null}
          </View>
        ))}
      </SettingsCard>
      <View style={styles.spacer} />
      <MobileButton icon="edit" label={t("mobile.settings.edit")} onPress={() => router.push(ROUTES.parent.settings("edit") as never)} style={styles.full} />
      <Sheet variant="app" open={photoOpen} onClose={() => setPhotoOpen(false)} title={t("mobile.settings.photoTitle")} description={t("mobile.settings.photoHint")}>
        <View style={styles.actions}>
          {PHOTO_ACTIONS.filter((item) => item.key !== "remove" || user.avatarUrl).map((item) => (
            <Pressable
              key={item.key}
              accessibilityRole="button"
              onPress={() => {
                setPhotoOpen(false);
                photoAction(item.key);
              }}
              style={({ pressed }) => [styles.action, pressed && styles.pressed]}
            >
              <Icon name={item.icon} size={22} color={ds.c[item.key === "remove" ? "error-text" : "ink"]} />
              <DsText v="title-sm" c={item.key === "remove" ? "error-text" : "ink"}>
                {item.key === "upload" ? t("mobile.settings.gallery") : t(`settings.profile.photoMenu.${item.key}`)}
              </DsText>
            </Pressable>
          ))}
        </View>
      </Sheet>
    </ParentScreen>
  );
}

function fieldError(error: unknown, key: string): string {
  const value = error instanceof AppError ? error.fields?.[key] : undefined;
  return Array.isArray(value) ? value.join(" ") : value ? String(value) : "";
}

/** Ma'lumotlarni tahrirlash — veb `ProfileEditMobile`: ism, familiya, login va telefon (server xatolari maydonlarda). */
export function ProfileEditMobile() {
  const { t } = useTranslation("parent");
  const back = useParentBack(ROUTES.parent.settings("profile"));
  const { user } = useAuth();
  const update = useUpdateProfileMutation();
  const [draft, setDraft] = useState<Record<Field, string>>(() => ({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    username: user?.username ?? "",
    phone: user?.phone ?? "",
  }));
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const errorCount = Object.values(errors).filter(Boolean).length;

  function submit() {
    const local: Partial<Record<Field, string>> = {};
    if (!draft.firstName.trim()) local.firstName = t("settings.profile.required");
    if (!draft.username.trim()) local.username = t("settings.profile.required");
    if (draft.phone.trim() && !PHONE.test(draft.phone.trim())) local.phone = t("settings.profile.phoneInvalid");
    setErrors(local);
    if (Object.keys(local).length) return;
    update.mutate(
      { firstName: draft.firstName, lastName: draft.lastName, username: draft.username, phone: draft.phone },
      {
        onSuccess: () => {
          toast.success(t("settings.profile.saved"));
          back();
        },
        onError: (error) => {
          const next = Object.fromEntries(
            (["firstName", "lastName", "username", "phone"] as const)
              .map((key) => [key, fieldError(error, { firstName: "first_name", lastName: "last_name", username: "username", phone: "phone" }[key])])
              .filter(([, value]) => value)
          ) as Partial<Record<Field, string>>;
          setErrors(next);
          if (!Object.keys(next).length) toast.error(error.message);
        },
      }
    );
  }

  const field = (key: Field, label: string, hint?: string) => (
    <SettingsField
      containerStyle={key === "firstName" || key === "lastName" ? styles.grow : undefined}
      label={label}
      hint={hint}
      error={errors[key]}
      value={draft[key]}
      keyboardType={key === "phone" ? "phone-pad" : "default"}
      autoCapitalize={key === "username" ? "none" : "words"}
      autoCorrect={false}
      onChangeText={(value) => {
        setDraft((current) => ({ ...current, [key]: value }));
        setErrors((current) => ({ ...current, [key]: "" }));
      }}
    />
  );

  return (
    <ParentScreen keyboard>
      <MobilePageHeader title={t("mobile.settings.editTitle")} backLabel={t("mobile.settings.info")} onBack={back} />
      <View style={styles.names}>
        {field("firstName", t("settings.profile.firstName"))}
        {field("lastName", t("settings.profile.lastName"))}
      </View>
      {field("username", t("settings.profile.username"), t("settings.profile.usernameHint"))}
      {field("phone", t("settings.profile.phone"))}
      {errorCount ? <ErrorsNote>{t("settings.profile.errors", { count: errorCount })}</ErrorsNote> : null}
      <View style={styles.spacer} />
      <View style={styles.buttons}>
        <MobileButton variant="secondary" label={t("settings.profile.cancel")} onPress={back} />
        <MobileButton label={t("settings.profile.save")} disabled={update.isPending} onPress={submit} />
      </View>
    </ParentScreen>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.85 },
  spacer: { flexGrow: 1 },
  full: { flex: 0 },
  me: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 20 },
  security: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 20 },
  securityIcon: { width: 44, height: 44, borderRadius: dsRadius.xl, alignItems: "center", justifyContent: "center" },
  photo: { alignItems: "center", gap: 8, paddingTop: 8 },
  /* `absolute right-0 bottom-0 size-9 border-[3px] border-canvas bg-brand` */
  camera: { position: "absolute", right: 0, bottom: 0, width: 36, height: 36, borderRadius: 18, borderWidth: 3, alignItems: "center", justifyContent: "center" },
  name: { lineHeight: 28 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  infoIcon: { width: 44, height: 44, borderRadius: dsRadius.xl, alignItems: "center", justifyContent: "center" },
  copy: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  actions: { paddingBottom: 16 },
  action: { height: 52, flexDirection: "row", alignItems: "center", gap: 12 },
  names: { flexDirection: "row", gap: 12 },
  buttons: { flexDirection: "row", gap: 12 },
});
