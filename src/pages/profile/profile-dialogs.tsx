import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { LinkAccountDialog, useAccountSwitch, useAuth } from "@/modules/auth";
import { Avatar, ConfirmDialog, DsText, dsRadius, Icon, Sheet, useDs, type IconName } from "@/shared/ui";

const ROLE_ICON: Record<string, IconName> = { teacher: "school", parent: "groups", student: "person" };

/**
 * Akkaunt almashtirish — veb `profile-dialogs.tsx` dagi `SwitchAccountDialog`
 * (tor ekran, pastki oyna). Tartibi vebdagidek:
 * - joriy akkaunt (ko'k hoshiya, "Faol");
 * - bog'langan akkauntlar;
 * - "Boshqa rolga o'tish": hali yo'q rollar (`available_roles`). Telefon
 *   yo'q bo'lsa "Avval profilga telefon qo'shing" — bosilsa profil tahriri;
 *   o'zi o'quvchi bo'lib kirganda rol qatorlari o'rniga izoh;
 * - "Boshqa akkauntni bog'lash" (login va parol).
 * Hamma mantiq `useAccountSwitch` da (veb bilan bir xil).
 */
export function SwitchAccountDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useTranslation("account");
  const { t: tn } = useTranslation("nav");
  const ds = useDs();
  const accounts = useAccountSwitch();
  const user = accounts.user;
  const close = () => onOpenChange(false);
  const roleLabel = (role?: string) => tn(`roles.${role?.toLowerCase() ?? "student"}`, { defaultValue: role ?? "" });
  const rowStyle = ({ pressed }: { pressed: boolean }) => [
    styles.account,
    { backgroundColor: pressed ? ds.c.muted : ds.c.subtle },
    accounts.pending && styles.dim,
  ];

  return (
    <Sheet variant="app" open={open} onClose={close} title={t("page.switchAccount")} description={t("page.switchAccountHint")}>
      <View style={styles.body}>
        <View style={[styles.current, { borderColor: ds.c.brand, backgroundColor: ds.c["brand-subtle"] }]}>
          <Avatar variant="legacy" name={user?.name ?? ""} src={user?.avatarUrl ?? undefined} size="sm" box={44} />
          <View style={styles.grow}>
            <DsText v="title" numberOfLines={1}>
              {user?.name}
            </DsText>
            <DsText v="body-sm" c="ink-secondary" numberOfLines={1}>
              {roleLabel(user?.role)}
            </DsText>
          </View>
          <View style={[styles.active, { backgroundColor: ds.c["success-bg"] }]}>
            <Icon name="check-circle" size={14} color={ds.c.success} />
            <DsText v="caption-strong" c="success-fg">
              {t("page.accountActive")}
            </DsText>
          </View>
        </View>

        {accounts.linkedAccounts.map((account) => (
          <Pressable
            key={account.id}
            accessibilityRole="button"
            disabled={accounts.pending}
            onPress={() => accounts.toAccount(account.id, close)}
            style={rowStyle}
          >
            <Avatar variant="legacy" name={account.name || account.username} size="sm" box={44} />
            <View style={styles.grow}>
              <DsText v="title" numberOfLines={1}>
                {account.name || account.username}
              </DsText>
              <DsText v="body-sm" c="ink-secondary" numberOfLines={1}>
                {roleLabel(account.role)}
              </DsText>
            </View>
            {accounts.pendingAccountId === account.id ? (
              <ActivityIndicator size="small" color={ds.c.brand} />
            ) : (
              <Icon name="chevron-right" size={20} color={ds.c["icon-tertiary"]} />
            )}
          </Pressable>
        ))}

        {accounts.blocked === "student_not_allowed" ? (
          <DsText v="body-sm" c="ink-secondary" style={styles.note}>
            {t("roleSwitcher.studentBlocked")}
          </DsText>
        ) : null}
        {accounts.missingRoles.length ? (
          <DsText v="caption-strong" c="ink-tertiary" style={styles.section}>
            {t("roleSwitcher.openRoles").toUpperCase()}
          </DsText>
        ) : null}
        {accounts.missingRoles.map((role) => (
          <Pressable key={role} accessibilityRole="button" disabled={accounts.pending} onPress={() => accounts.toRole(role, close)} style={rowStyle}>
            <View style={[styles.roleIcon, { backgroundColor: ds.c.surface }]}>
              <Icon name={ROLE_ICON[role.toLowerCase()] ?? "person"} size={22} color={ds.c.brand} />
            </View>
            <View style={styles.grow}>
              <DsText v="title" numberOfLines={1}>
                {roleLabel(role)}
              </DsText>
              {/* Izoh kesilmaydi — ikki qatorga o'tadi (veb #186). */}
              <DsText v="body-sm" c={accounts.needsPhone ? "warning-fg" : "ink-secondary"}>
                {accounts.needsPhone ? t("roleSwitcher.needsPhone") : t("roleSwitcher.openHint")}
              </DsText>
            </View>
            {accounts.pendingRole === role.toLowerCase() ? (
              <ActivityIndicator size="small" color={ds.c.brand} />
            ) : (
              <Icon
                name={accounts.needsPhone ? "chevron-right" : "add"}
                size={20}
                color={accounts.needsPhone ? ds.c["icon-tertiary"] : ds.c.brand}
              />
            )}
          </Pressable>
        ))}

        <Pressable accessibilityRole="button" disabled={accounts.pending} onPress={accounts.openLink} style={(state) => [rowStyle(state), styles.linkRow]}>
          <View style={[styles.roleIcon, { backgroundColor: ds.c.surface }]}>
            <Icon name="link" size={22} color={ds.c.brand} />
          </View>
          <View style={styles.grow}>
            <DsText v="title" numberOfLines={1}>
              {t("roleSwitcher.link.row")}
            </DsText>
            <DsText v="body-sm" c="ink-secondary" numberOfLines={1}>
              {t("roleSwitcher.link.rowHint")}
            </DsText>
          </View>
          <Icon name="chevron-right" size={20} color={ds.c["icon-tertiary"]} />
        </Pressable>
        {/* Ichma-ich: iOS ikkita yonma-yon Modal'ni bir vaqtda ko'rsatmaydi. */}
        <LinkAccountDialog prompt={accounts.linkPrompt} onClose={accounts.closeLink} onLinked={accounts.afterLink} />
      </View>
    </Sheet>
  );
}

/** Chiqish — `ConfirmDialog` (brand). */
export function LogoutDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useTranslation("account");
  const { logout } = useAuth();
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      tone="brand"
      icon="logout"
      title={t("page.logoutTitle")}
      description={t("page.logoutDescription")}
      confirmLabel={t("page.logout")}
      cancelLabel={t("page.cancel")}
      onConfirm={() => {
        onOpenChange(false);
        void logout();
      }}
    />
  );
}

/** Akkauntni o'chirish — `ConfirmDialog` (xavfli). */
export function DeleteAccountDialog({ open, pending, onOpenChange, onConfirm }: { open: boolean; pending?: boolean; onOpenChange: (open: boolean) => void; onConfirm: () => void }) {
  const { t } = useTranslation("account");
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      icon="logout"
      title={t("page.deleteAccountTitle")}
      description={t("page.deleteAccountDescription")}
      confirmLabel={t("page.delete")}
      cancelLabel={t("page.cancel")}
      pending={pending}
      onConfirm={onConfirm}
    />
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  dim: { opacity: 0.6 },
  /* `-mt-0.5 gap-[11px]`, pastda `pb-[43px]` */
  body: { marginTop: -2, gap: 11, paddingBottom: 20 },
  current: { height: 70, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, borderWidth: 1.5, borderRadius: dsRadius.lg },
  active: { height: 24, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, borderRadius: 12 },
  /* `min-h-[68px] gap-3 rounded-lg bg-subtle px-3.5 py-2.5` */
  account: { minHeight: 68, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 10, borderRadius: dsRadius.lg },
  /* `size-11 rounded-full bg-surface text-brand` */
  roleIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  /* `mt-1.5 px-1 text-caption-strong uppercase` */
  section: { marginTop: 6, paddingHorizontal: 4 },
  note: { paddingHorizontal: 4 },
  linkRow: { marginTop: 4 },
});
