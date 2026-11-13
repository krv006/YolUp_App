import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { LinkAccountDialog, useAccountSwitch } from "@/modules/auth";
import { Avatar, DsText, dsRadius, Icon, Sheet, useDs, type IconName } from "@/shared/ui";

const ROLE_ICON: Record<string, IconName> = {
  teacher: "school",
  student: "person",
  parent: "groups",
};

export interface ParentAccountSwitchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Kuzatuvchi uchun akkaunt almashtirish — veb `parent-account-switch-dialog.tsx`
 * (tor ekranda pastdan chiqadigan oyna): joriy akkaunt, bog'langan akkauntlar
 * ("rol · @login"), hali yo'q rollar, "Boshqa akkauntni bog'lash" va pastda
 * izoh. Mantiq `useAccountSwitch` da.
 */
export function ParentAccountSwitchDialog({ open, onOpenChange }: ParentAccountSwitchDialogProps) {
  const { t } = useTranslation("account");
  const { t: tn } = useTranslation("nav");
  const ds = useDs();
  const accounts = useAccountSwitch();
  const roleLabel = (role?: string) =>
    tn(`roles.${role?.toLowerCase() ?? "parent"}`, { defaultValue: role ?? "" });
  const close = () => onOpenChange(false);
  const rowStyle = ({ pressed }: { pressed: boolean }) => [
    styles.row,
    { backgroundColor: pressed ? ds.c.muted : ds.c.subtle },
    accounts.pending && styles.dim,
  ];

  return (
    <Sheet
      variant="app"
      open={open}
      onClose={close}
      title={t("page.switchAccount")}
      description={t("page.switchAccountDescription")}
    >
      <View style={styles.body}>
        <View
          style={[
            styles.row,
            styles.current,
            { borderColor: ds.c.brand, backgroundColor: ds.c["brand-subtle"] },
          ]}
        >
          <Avatar
            variant="legacy"
            name={accounts.user?.name ?? ""}
            src={accounts.user?.avatarUrl ?? undefined}
            size="sm"
            box={44}
          />
          <View style={styles.grow}>
            <DsText v="title-sm" numberOfLines={1}>
              {accounts.user?.name}
            </DsText>
            <DsText v="body-xs" c="ink-secondary" numberOfLines={1}>
              {roleLabel(accounts.user?.role)}
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
              <DsText v="title-sm" numberOfLines={1}>
                {account.name || account.username}
              </DsText>
              <DsText v="body-xs" c="ink-secondary" numberOfLines={1}>
                {roleLabel(account.role)} · @{account.username}
              </DsText>
            </View>
            {accounts.pendingAccountId === account.id ? (
              <ActivityIndicator size="small" color={ds.c.brand} />
            ) : (
              <Icon name="chevron-right" size={20} color={ds.c["icon-tertiary"]} />
            )}
          </Pressable>
        ))}

        {accounts.missingRoles.length ? (
          <>
            <DsText v="caption-strong" c="ink-tertiary" style={styles.section}>
              {t("roleSwitcher.openRoles").toUpperCase()}
            </DsText>
            {accounts.missingRoles.map((role) => (
              <Pressable
                key={role}
                accessibilityRole="button"
                disabled={accounts.pending}
                onPress={() => accounts.toRole(role, close)}
                style={rowStyle}
              >
                <View style={[styles.roleIcon, { backgroundColor: ds.c.surface }]}>
                  <Icon
                    name={ROLE_ICON[role.toLowerCase()] ?? "person"}
                    size={22}
                    color={ds.c.brand}
                  />
                </View>
                <View style={styles.grow}>
                  <DsText v="title-sm" numberOfLines={1}>
                    {roleLabel(role)}
                  </DsText>
                  <DsText
                    v="body-xs"
                    c={accounts.needsPhone ? "warning-fg" : "ink-secondary"}
                    numberOfLines={accounts.needsPhone ? undefined : 1}
                  >
                    {accounts.needsPhone
                      ? t("roleSwitcher.needsPhone")
                      : t("roleSwitcher.openHint")}
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
          </>
        ) : null}

        <Pressable
          accessibilityRole="button"
          disabled={accounts.pending}
          onPress={accounts.openLink}
          style={(state) => [rowStyle(state), styles.linkRow]}
        >
          <View style={[styles.roleIcon, { backgroundColor: ds.c.surface }]}>
            <Icon name="link" size={22} color={ds.c.brand} />
          </View>
          <View style={styles.grow}>
            <DsText v="title-sm" numberOfLines={1}>
              {t("roleSwitcher.link.row")}
            </DsText>
            <DsText v="body-xs" c="ink-secondary" numberOfLines={1}>
              {t("roleSwitcher.link.rowHint")}
            </DsText>
          </View>
          <Icon name="chevron-right" size={20} color={ds.c["icon-tertiary"]} />
        </Pressable>

        <DsText v="body-xs" c="ink-tertiary" style={styles.hint}>
          {t("roleSwitcher.switchHint")}
        </DsText>
        {/* Ichma-ich: iOS ikkita yonma-yon Modal'ni bir vaqtda ko'rsatmaydi. */}
        <LinkAccountDialog
          prompt={accounts.linkPrompt}
          onClose={accounts.closeLink}
          onLinked={accounts.afterLink}
        />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  dim: { opacity: 0.6 },
  /* `flex-col gap-2.5 pb-2` */
  body: { gap: 10, paddingBottom: 8 },
  /* `min-h-16 gap-3 rounded-xl bg-subtle px-3.5 py-2.5` */
  row: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: dsRadius.xl,
  },
  current: { borderWidth: 1.5 },
  active: {
    height: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  roleIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  /* `mt-2 px-1 text-caption-strong uppercase` */
  section: { marginTop: 8, paddingHorizontal: 4 },
  linkRow: { marginTop: 4 },
  /* `px-1 pt-1 text-body-xs text-ink-tertiary` */
  hint: { paddingHorizontal: 4, paddingTop: 4 },
});
