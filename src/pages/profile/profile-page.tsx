import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import {
  resolveHomeRoute,
  useAuth,
  useSwitchAccountMutation,
  useUpdateAvatarMutation,
} from "@/modules/auth";
import { useCourses } from "@/modules/course";
import { NotificationBell } from "@/modules/notification";
import { useQuizColors } from "@/modules/quiz";
import { ROUTES } from "@/shared/config";
import { ROLES } from "@/shared/constants";
import { pickImage, toUploadFile } from "@/shared/lib";
import {
  AppBar,
  ConfirmSheet,
  Icon,
  radius,
  Screen,
  Sheet,
  SheetButton,
  SheetFooter,
  Text,
  toast,
  useTheme,
} from "@/shared/ui";
import { initialsOf, SettingsCard, SettingsRow, useProfileLink } from "./profile-shell";

/**
 * Profil — veb `pages/profile/profile-page.tsx` ning tor ekran ko'rinishi:
 * avatar kartasi (statistika, tahrirlash), "Sozlamalar", "Aloqa
 * ma'lumotlari", akkaunt almashtirish va chiqish.
 */
export function ProfilePage() {
  const { t } = useTranslation("account");
  const { t: tn } = useTranslation("nav");
  const router = useRouter();
  const open = useProfileLink();
  const { palette } = useTheme();
  const legacy = useQuizColors();
  const { user, logout } = useAuth();
  const courses = useCourses();
  const updateAvatar = useUpdateAvatarMutation();
  const switchAccount = useSwitchAccountMutation();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const linkedAccounts = user?.linkedAccounts ?? [];

  const isTeacher = user?.role === ROLES.TEACHER;
  const groups = courses.data ?? [];
  const students = groups.reduce((sum, course) => sum + (course.studentCount || 0), 0);

  const links = [
    { id: "personal", icon: "edit", tone: palette.primary, to: "personal" },
    { id: "account", icon: "check-circle", tone: legacy.success, to: "account" },
    { id: "system", icon: "more", tone: palette["saffron-strong"], to: "system" },
    { id: "help", icon: "error", tone: palette.primary, to: "system" },
  ] as const;

  async function changeAvatar() {
    const picked = await pickImage("library");
    if (picked) updateAvatar.mutate(toUploadFile(picked), { onError: (error: Error) => toast.error(error.message) });
  }

  return (
    <Screen padded={false}>
      <AppBar title={tn("titles.profile")}>
        <NotificationBell />
      </AppBar>
      <ScrollView style={{ backgroundColor: palette.background }} contentContainerStyle={styles.page}>
        <View style={[styles.hero, { borderColor: palette.border, backgroundColor: palette.surface }]}>
          <View>
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: palette["primary-soft"] }]}>
                <Text variant="heading" style={{ color: palette.primary }}>
                  {initialsOf(user?.name)}
                </Text>
              </View>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("page.avatarTitle")}
              onPress={() => void changeAvatar()}
              style={[styles.camera, { borderColor: palette.surface, backgroundColor: palette.primary }]}
            >
              <Icon name="camera" size={16} color={palette["primary-foreground"]} />
            </Pressable>
          </View>

          <Text variant="subheading" style={[styles.center, styles.name]}>
            {user?.name}
          </Text>
          <Text variant="label" style={[styles.bodySm, { color: palette["subtle-foreground"] }]}>
            {isTeacher ? tn("roles.teacher") : tn("roles.student")}
          </Text>

          <View style={[styles.stats, { backgroundColor: palette["surface-subtle"] }]}>
            {[
              { value: String(groups.length), label: t("page.statGroups") },
              { value: String(students), label: t("page.statStudents") },
              { value: "—", label: t("page.statYears") },
            ].map((stat, index) => (
              <View key={stat.label} style={[styles.stat, index > 0 && { borderLeftWidth: 1, borderLeftColor: palette.border }]}>
                <Text variant="subheading" style={styles.statValue}>
                  {stat.value}
                </Text>
                <Text variant="caption" style={[styles.caption, { color: palette["subtle-foreground"] }]}>
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => open("personal")}
            style={({ pressed }) => [
              styles.edit,
              { borderColor: palette.border, backgroundColor: pressed ? palette["surface-subtle"] : palette.surface },
            ]}
          >
            <Icon name="edit" size={18} color={palette.foreground} />
            <Text variant="label">{t("page.editProfile")}</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text variant="body" style={styles.sectionTitle}>
            {t("page.settings")}
          </Text>
          <SettingsCard>
            {links.map((link) => (
              <SettingsRow
                key={link.id}
                icon={link.icon}
                tone={link.tone}
                title={t(`page.${link.id}Title`)}
                hint={t(`page.${link.id}Hint`)}
                onPress={() => open(link.to)}
              />
            ))}
          </SettingsCard>
        </View>

        <View style={styles.section}>
          <Text variant="body" style={styles.sectionTitle}>
            {t("page.contact")}
          </Text>
          <SettingsCard>
            <SettingsRow icon="person" tone={palette["subtle-foreground"]} title={user?.phone ?? "—"} hint={t("page.phoneLabel")} />
            <SettingsRow icon="assign" tone={palette["subtle-foreground"]} title={user?.email ?? "—"} hint={t("page.emailLabel")} />
            <SettingsRow icon="school" tone={palette["subtle-foreground"]} title="—" hint={t("page.cityLabel")} />
          </SettingsCard>

          <SettingsCard>
            <SettingsRow
              icon="person"
              title={t("page.switchAccount")}
              hint={t("page.switchAccountHint")}
              onPress={() => setSwitchOpen(true)}
            />
          </SettingsCard>

          <SettingsCard>
            <SettingsRow
              icon="trash"
              tone={palette.destructive}
              title={t("page.logout")}
              danger
              onPress={() => setLogoutOpen(true)}
              right={null}
            />
          </SettingsCard>
        </View>
      </ScrollView>

      <Sheet
        open={switchOpen}
        onClose={() => setSwitchOpen(false)}
        title={t("page.switchAccount")}
        description={t("page.switchAccountDescription")}
      >
        <View style={styles.switchList}>
          <SettingsCard>
            <View style={styles.account}>
              <View style={[styles.accountAvatar, { backgroundColor: palette["primary-soft"] }]}>
                <Text variant="label" style={{ color: palette.primary }}>
                  {initialsOf(user?.name)}
                </Text>
              </View>
              <View style={styles.grow}>
                <Text variant="label" numberOfLines={1}>
                  {user?.name}
                </Text>
                <Text variant="caption" numberOfLines={1} style={[styles.caption, { color: palette["success-strong"] }]}>
                  {`${tn(`roles.${user?.role?.toLowerCase() ?? "teacher"}`, { defaultValue: user?.role ?? "" })} · ${t("page.accountActive")}`}
                </Text>
              </View>
              <Icon name="check-circle" size={20} color={palette.primary} />
            </View>
            {linkedAccounts.map((account) => (
              <Pressable
                key={account.id}
                accessibilityRole="button"
                disabled={switchAccount.isPending}
                onPress={() =>
                  switchAccount.mutate(account.id, {
                    onSuccess: (next) => {
                      setSwitchOpen(false);
                      router.replace(resolveHomeRoute(next) as never);
                    },
                    onError: (error: Error) => toast.error(error.message),
                  })
                }
                style={({ pressed }) => [
                  styles.account,
                  pressed && { backgroundColor: palette["surface-subtle"] },
                  switchAccount.isPending && { opacity: 0.6 },
                ]}
              >
                <View style={[styles.accountAvatar, { backgroundColor: palette["surface-subtle"] }]}>
                  <Text variant="label" style={{ color: palette["muted-foreground"] }}>
                    {initialsOf(account.name ?? account.username)}
                  </Text>
                </View>
                <View style={styles.grow}>
                  <Text variant="label" numberOfLines={1}>
                    {account.name || account.username}
                  </Text>
                  <Text variant="caption" numberOfLines={1} style={[styles.caption, { color: palette["subtle-foreground"] }]}>
                    {tn(`roles.${account.role?.toLowerCase() ?? "student"}`, { defaultValue: account.role })}
                  </Text>
                </View>
                <Icon name="chevron-right" size={18} color={palette["subtle-foreground"]} />
              </Pressable>
            ))}
          </SettingsCard>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setSwitchOpen(false);
              open("account");
            }}
            style={({ pressed }) => [styles.addAccount, pressed && { backgroundColor: palette["primary-soft"] }]}
          >
            <Icon name="add" size={18} color={palette.primary} />
            <Text variant="label" style={{ color: palette.primary }}>
              {t("page.addAccount")}
            </Text>
          </Pressable>
        </View>
        <SheetFooter>
          <SheetButton variant="primary" title={t("page.close")} onPress={() => setSwitchOpen(false)} />
        </SheetFooter>
      </Sheet>

      <ConfirmSheet
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        title={t("page.logoutTitle")}
        description={t("page.logoutDescription")}
        confirmLabel={t("page.logout")}
        cancelLabel={t("page.cancel")}
        onConfirm={() => {
          setLogoutOpen(false);
          void logout().then(() => {
            toast.success(t("toast.loggedOut", { defaultValue: "" }));
            router.replace(ROUTES.auth.login);
          });
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  center: { textAlign: "center" },
  bodySm: { fontWeight: "400" },
  caption: { fontWeight: "500" },
  /* `p-4 gap-5` */
  page: { gap: 20, padding: 16 },
  /* `items-center gap-1 rounded-2xl border p-5` */
  hero: { alignItems: "center", gap: 4, padding: 20, borderWidth: 1, borderRadius: radius["2xl"] },
  avatar: { width: 96, height: 96, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  camera: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderRadius: radius.full,
  },
  name: { marginTop: 12 },
  /* `mt-4 grid-cols-3 divide-x rounded-xl bg-subtle py-3` */
  stats: { marginTop: 16, alignSelf: "stretch", flexDirection: "row", paddingVertical: 12, borderRadius: radius.xl },
  stat: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 16, lineHeight: 24, fontWeight: "600" },
  edit: {
    marginTop: 16,
    alignSelf: "stretch",
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: radius.full,
  },
  section: { gap: 8 },
  sectionTitle: { paddingHorizontal: 4, fontWeight: "600" },
  switchList: { gap: 8 },
  account: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  accountAvatar: { width: 40, height: 40, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  addAccount: { alignSelf: "flex-start", height: 44, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, borderRadius: radius.full },
});
