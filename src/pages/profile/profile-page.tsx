import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import {
  Bell,
  History,
  Pencil,
  LogOut,
  Moon,
  ShieldCheck,
  Smartphone,
} from "lucide-react-native";
import { describeUserAgent, useAuth, useLoginHistory } from "@/modules/auth";
import { ProfileEditSheet } from "@/modules/auth/ui/profile-edit-sheet";
import { useUnreadNotificationCount } from "@/modules/notification";
import { env, ROUTES } from "@/shared/config";
import { formatDayTime } from "@/shared/lib";
import {
  Avatar,
  Badge,
  Button,
  CountBadge,
  IconButton,
  ListItem,
  radius,
  Screen,
  ScreenLoading,
  Separator,
  Sheet,
  Text,
  useTheme,
} from "@/shared/ui";

/**
 * Profil — veb `account-menu.tsx` (439 qator) ning mobil varianti.
 *
 * Veb'da bu chap ustundagi ochiladigan menyu edi. Mobilda alohida tab:
 * hisob sozlamalari, xavfsizlik va chiqish bir joyda turgani tushunarliroq.
 */
export function ProfilePage({ roleLabel }: { roleLabel: string }) {
  const router = useRouter();
  const { palette, scheme } = useTheme();
  const { user, logout } = useAuth();
  const unread = useUnreadNotificationCount();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  async function signOut() {
    await logout();
    router.replace(ROUTES.auth.login);
  }

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Avatar name={user?.name} size="xl" />
          <View style={styles.identity}>
            <Text variant="subheading">{user?.name || "Foydalanuvchi"}</Text>
            <Text variant="caption" tone="muted">
              {user?.username}
            </Text>
            <Badge label={roleLabel} tone="brand" />
          </View>
          <IconButton accessibilityLabel="Profilni tahrirlash" onPress={() => setEditOpen(true)}>
            <Pencil size={20} color={palette["muted-foreground"]} />
          </IconButton>
        </View>

        {/* O'qituvchi tasdiqlanmagan bo'lsa — veb'dagi kabi ogohlantirish. */}
        {user?.isApproved === false ? (
          <View style={[styles.notice, { backgroundColor: palette["warning-soft"] }]}>
            <ShieldCheck size={18} color={palette["warning-strong"]} />
            <Text variant="caption" style={{ flex: 1, color: palette["warning-strong"] }}>
              Hisobingiz hali administrator tomonidan tasdiqlanmagan — kurs va dars
              yaratish vaqtincha yopiq.
            </Text>
          </View>
        ) : null}

        {/* Taklif kodi — ota-ona shu kod bilan farzandiga ulanadi. */}
        {user?.inviteCode ? (
          <View style={[styles.card, { backgroundColor: palette["primary-tint"], borderColor: palette["border-accent"] }]}>
            <View style={styles.inviteBody}>
              <Text variant="caption" tone="muted">
                Taklif kodi
              </Text>
              <Text variant="heading" tone="brand">
                {user.inviteCode}
              </Text>
              <Text variant="caption" tone="muted">
                Ota-onangiz shu kod bilan hisobingizga ulanadi.
              </Text>
            </View>
          </View>
        ) : null}

        <View style={[styles.group, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <ListItem
            title="Bildirishnomalar"
            leading={<Bell size={20} color={palette["muted-foreground"]} />}
            trailing={<CountBadge count={unread.data ?? 0} />}
            chevron
            onPress={() => router.push("/notifications")}
          />
          <Separator inset={52} />
          <ListItem
            title="Kirishlar tarixi"
            subtitle="Qaysi qurilma va IP'dan kirilgani"
            leading={<History size={20} color={palette["muted-foreground"]} />}
            chevron
            onPress={() => setHistoryOpen(true)}
          />
          <Separator inset={52} />
          <ListItem
            title="Mavzu"
            subtitle={scheme === "dark" ? "Qorong'i (tizim sozlamasi)" : "Yorug' (tizim sozlamasi)"}
            leading={<Moon size={20} color={palette["muted-foreground"]} />}
          />
        </View>

        <View style={[styles.group, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <ListItem
            title="Ilova"
            subtitle={`${Constants.expoConfig?.version ?? "0.0.0"} · ${env.appEnv}`}
            leading={<Smartphone size={20} color={palette["muted-foreground"]} />}
          />
        </View>

        <Button
          title="Chiqish"
          variant="secondary"
          icon={<LogOut size={16} color={palette["secondary-foreground"]} />}
          onPress={() => void signOut()}
        />
      </ScrollView>

      <LoginHistorySheet open={historyOpen} onClose={() => setHistoryOpen(false)} />
      <ProfileEditSheet user={user} open={editOpen} onClose={() => setEditOpen(false)} />
    </Screen>
  );
}

/**
 * Kirishlar tarixi — veb `login-history-dialog.tsx` porti.
 *
 * `new_ip` / `new_device` bayroqlari ajratib ko'rsatiladi: begona kirishni
 * foydalanuvchi darhol sezishi kerak.
 */
function LoginHistorySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  // `enabled: open` — tarix faqat oyna ochilganda so'raladi.
  const history = useLoginHistory(null, open);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Kirishlar tarixi"
      description="Hisobingizga qaysi qurilma va IP'dan kirilgani."
    >
      {history.isLoading ? <ScreenLoading label="Yuklanmoqda…" /> : null}

      {(history.data ?? []).map((record, index) => (
        <View key={record.id}>
          {index > 0 ? <Separator /> : null}
          <View style={styles.record}>
            <View style={styles.recordBody}>
              <Text variant="label">{record.device || describeUserAgent(record.userAgent)}</Text>
              <Text variant="caption" tone="muted">
                {record.ip} · {formatDayTime(record.at)}
              </Text>
            </View>
            {record.isNewDevice ? <Badge label="Yangi qurilma" tone="warning" /> : null}
            {record.isNewIp && !record.isNewDevice ? <Badge label="Yangi IP" tone="warning" /> : null}
          </View>
        </View>
      ))}

      {!history.isLoading && (history.data ?? []).length === 0 ? (
        <Text variant="caption" tone="muted">
          Yozuv topilmadi.
        </Text>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 14, paddingBottom: 40 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: 16,
  },
  identity: { flex: 1, gap: 4, alignItems: "flex-start" },
  inviteBody: { flex: 1, gap: 2 },
  notice: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: radius.sm },
  group: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  record: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10 },
  recordBody: { flex: 1, gap: 2 },
});
