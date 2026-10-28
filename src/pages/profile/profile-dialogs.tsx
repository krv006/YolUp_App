import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth, useRoleRoutes, useSwitchAccountMutation } from "@/modules/auth";
import { Avatar, ConfirmDialog, DsText, dsRadius, Icon, Sheet, toast, useDs } from "@/shared/ui";

/**
 * Akkaunt almashtirish — veb `profile-dialogs.tsx` dagi `SwitchAccountDialog`
 * (tor ekran, pastki oyna): joriy akkaunt (ko'k hoshiya, "Faol"), bog'langan
 * akkauntlar va "Akkaunt qo'shish".
 */
export function SwitchAccountDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useTranslation("account");
  const { t: tn } = useTranslation("nav");
  const ds = useDs();
  const router = useRouter();
  const routes = useRoleRoutes();
  const { user } = useAuth();
  const switchAccount = useSwitchAccountMutation();
  const linkedAccounts = user?.linkedAccounts ?? [];

  return (
    <Sheet variant="app" open={open} onClose={() => onOpenChange(false)} title={t("page.switchAccount")} description={t("page.switchAccountHint")}>
      <View style={styles.body}>
        <View style={[styles.current, { borderColor: ds.c.brand, backgroundColor: ds.c["brand-subtle"] }]}>
          <Avatar variant="legacy" name={user?.name ?? ""} src={user?.avatarUrl ?? undefined} size="sm" box={44} />
          <View style={styles.grow}>
            <DsText v="title" numberOfLines={1}>
              {user?.name}
            </DsText>
            <DsText v="body-sm" c="ink-secondary" numberOfLines={1}>
              {tn(`roles.${user?.role?.toLowerCase() ?? "teacher"}`, { defaultValue: user?.role ?? "" })}
            </DsText>
          </View>
          <View style={[styles.active, { backgroundColor: ds.c["success-bg"] }]}>
            <Icon name="check-circle" size={14} color={ds.c.success} />
            <DsText v="caption-strong" c="success-fg">
              {t("page.accountActive")}
            </DsText>
          </View>
        </View>

        {linkedAccounts.map((account) => (
          <Pressable
            key={account.id}
            accessibilityRole="button"
            disabled={switchAccount.isPending}
            onPress={() =>
              switchAccount.mutate(account.id, {
                onSuccess: () => onOpenChange(false),
                onError: (error: Error) => toast.error(error.message),
              })
            }
            style={({ pressed }) => [styles.account, { backgroundColor: pressed ? ds.c.muted : ds.c.subtle }, switchAccount.isPending && styles.dim]}
          >
            <Avatar variant="legacy" name={account.name || account.username} size="sm" box={44} />
            <View style={styles.grow}>
              <DsText v="title" numberOfLines={1}>
                {account.name || account.username}
              </DsText>
              <DsText v="body-sm" c="ink-secondary" numberOfLines={1}>
                {tn(`roles.${account.role?.toLowerCase() ?? "student"}`, { defaultValue: account.role })}
              </DsText>
            </View>
            <Icon name="chevron-right" size={20} color={ds.c["icon-secondary"]} />
          </Pressable>
        ))}

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            onOpenChange(false);
            router.push(`${routes.profile}/account` as never);
          }}
          style={styles.add}
        >
          <Icon name="add" size={20} color={ds.c.brand} />
          <DsText v="title" c="brand">
            {t("page.addAccount")}
          </DsText>
        </Pressable>
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
  account: { height: 68, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, borderRadius: dsRadius.lg },
  add: { marginTop: 15, height: 24, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
});
