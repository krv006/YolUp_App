import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { UserRoundPlus } from "lucide-react-native";
import { ROLES, type Role } from "@/shared/constants";
import type { AuthUser, LinkedAccount } from "@/shared/types";
import { Avatar, ListItem, Separator, Sheet, Text, toast, useTheme } from "@/shared/ui";
import { useSwitchAccountMutation, useSwitchRoleMutation } from "../model/auth.mutations";
import { resolveHomeRoute } from "../lib/resolve-home-route";

/**
 * Hisob va rol almashtirish — veb `widgets/account-menu` dagi rol menyusining
 * mobil varianti.
 *
 * IKKI XIL AMAL, ular oson chalkashtiriladi:
 *
 *   1. BOG'LANGAN HISOBGA O'TISH (`switchAccount`) — allaqachon mavjud
 *      hisob. Masalan ota-ona o'z farzandining hisobiga o'tadi.
 *   2. YANGI ROL OCHISH (`switchRole`) — bunday hisob hali YO'Q, server uni
 *      shu paytda yaratadi va bog'laydi. Shuning uchun ro'yxatda alohida
 *      bo'limda va boshqa ikonka bilan turadi: bu qaytarib bo'lmaydigan
 *      amal emas, lekin foydalanuvchi nima bo'layotganini bilishi kerak.
 *
 * O'QUVCHIGA ko'rsatilmaydi (veb bilan bir xil qoida): o'quvchi o'ziga
 * o'qituvchi yoki ota-ona hisobi ocha olmaydi.
 */

/** Foydalanuvchi o'ziga o'zi ocha oladigan rollar. */
const SELF_SERVICE_ROLES: readonly Role[] = [ROLES.TEACHER, ROLES.PARENT, ROLES.STUDENT];

const ROLE_LABELS: Record<string, string> = {
  [ROLES.TEACHER]: "O'qituvchi",
  [ROLES.PARENT]: "Ota-ona",
  [ROLES.STUDENT]: "O'quvchi",
  [ROLES.ADMIN]: "Administrator",
  [ROLES.SUPER_ADMIN]: "Bosh administrator",
};

export function roleLabelOf(role: string | undefined): string {
  return (role && ROLE_LABELS[role]) || "Foydalanuvchi";
}

/**
 * Almashtirish qatori umuman ko'rsatilsinmi.
 *
 * Profil sahifasi shu bilan qaror qiladi — bo'sh oynani ochadigan qator
 * chizilmasligi kerak.
 */
export function canSwitchAccounts(user: AuthUser | null): boolean {
  return switchableRoles(user).length > 0 || (user?.linkedAccounts.length ?? 0) > 0;
}

function switchableRoles(user: AuthUser | null): readonly Role[] {
  if (!user || user.role === ROLES.STUDENT) return [];
  return SELF_SERVICE_ROLES.filter(
    (role) => role !== user.role && !user.linkedAccounts.some((account) => account.role === role)
  );
}

export function AccountSwitchSheet({
  user,
  open,
  onClose,
}: {
  user: AuthUser | null;
  open: boolean;
  onClose: () => void;
}) {
  const { palette } = useTheme();
  const router = useRouter();
  const switchAccount = useSwitchAccountMutation();
  const switchRole = useSwitchRoleMutation();

  const linkedAccounts = user?.linkedAccounts ?? [];
  const missingRoles = switchableRoles(user);
  const busy = switchAccount.isPending || switchRole.isPending;

  async function finishSwitch(request: Promise<AuthUser>) {
    try {
      const nextUser = await request;
      onClose();
      // `replace` — orqaga tugmasi eski hisobning ekraniga qaytarmasligi uchun.
      router.replace(resolveHomeRoute(nextUser));
      toast.success(`${nextUser.name} hisobiga o'tildi`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Hisobni almashtirib bo'lmadi");
    }
  }

  function switchToAccount(account: LinkedAccount) {
    if (busy) return;
    void finishSwitch(switchAccount.mutateAsync(account.id));
  }

  function switchToRole(role: Role) {
    if (busy) return;
    // Backend rolni kichik harfda kutadi (veb bilan bir xil).
    void finishSwitch(switchRole.mutateAsync(role.toLowerCase()));
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Hisobni almashtirish"
      description="Qayta login qilish shart emas — parol so'ralmaydi."
    >
      {linkedAccounts.length > 0 ? (
        <View style={[styles.group, { backgroundColor: palette.card, borderColor: palette.border }]}>
          {linkedAccounts.map((account, index) => (
            <View key={account.id}>
              {index > 0 ? <Separator inset={52} /> : null}
              <ListItem
                title={account.name || account.username}
                subtitle={
                  switchAccount.isPending && switchAccount.variables === account.id
                    ? "O'tilmoqda…"
                    : roleLabelOf(account.role)
                }
                leading={<Avatar name={account.name || account.username} size="md" />}
                chevron
                disabled={busy}
                onPress={() => switchToAccount(account)}
              />
            </View>
          ))}
        </View>
      ) : null}

      {missingRoles.length > 0 ? (
        <>
          <Text variant="caption" tone="muted" style={styles.caption}>
            Yangi hisob ochish — u joriy hisobingizga bog'lanadi
          </Text>
          <View
            style={[styles.group, { backgroundColor: palette.card, borderColor: palette.border }]}
          >
            {missingRoles.map((role, index) => (
              <View key={role}>
                {index > 0 ? <Separator inset={52} /> : null}
                <ListItem
                  title={roleLabelOf(role)}
                  subtitle={
                    switchRole.isPending && switchRole.variables === role.toLowerCase()
                      ? "Ochilmoqda…"
                      : "Hisob yaratiladi va bog'lanadi"
                  }
                  leading={<UserRoundPlus size={20} color={palette["muted-foreground"]} />}
                  chevron
                  disabled={busy}
                  onPress={() => switchToRole(role)}
                />
              </View>
            ))}
          </View>
        </>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  group: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
  caption: { marginTop: 16, marginBottom: 8 },
});
