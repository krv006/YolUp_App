import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import {
  Bell,
  History,
  LogOut,
  Palette,
  Pencil,
  Smartphone,
  Star,
  UsersRound,
  type LucideIcon,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { describeUserAgent, useAuth, useLoginHistory } from "@/modules/auth";
import { ProfileEditSheet } from "@/modules/auth/ui/profile-edit-sheet";
import {
  AccountSwitchSheet,
  canSwitchAccounts,
} from "@/modules/auth/ui/account-switch-sheet";
import { useUnreadNotificationCount } from "@/modules/notification";
import { useAppearanceStore } from "@/shared/model/theme.store";
import { env, ROUTES } from "@/shared/config";
import { formatDayTime } from "@/shared/lib";
import {
  Avatar,
  Badge,
  Button,
  CountBadge,
  findAccent,
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
 *
 * KO'RINISH TELEGRAMDAN ILHOMLANGAN (buyurtmachi namunasi:
 * `docs/ChatExport_2026-09-08/photo_9`): yirik markazlashgan avatar, uning
 * ostida amallar qatori, so'ng "qiymat tepada — yorlig'i pastda" ko'rinishidagi
 * ma'lumot kartasi. Bu tanish naqsh: foydalanuvchi qayerga qarashni biladi.
 *
 * MUHIM: bu yerda TO'QIMA (mock) ma'lumot YO'Q. Faqat backend bergan
 * maydonlar chiziladi va qiymati bo'lmagan qator UMUMAN ko'rsatilmaydi —
 * bo'sh "—" belgilar qo'yish ekranni to'ldirgandek ko'rsatadi, aslida esa
 * foydalanuvchini chalg'itadi.
 */
export function ProfilePage({ roleKey }: { roleKey: string }) {
  const { t } = useTranslation("mobile");
  const router = useRouter();
  const { palette, scheme } = useTheme();
  const { user, logout } = useAuth();
  const unread = useUnreadNotificationCount();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);

  const appearanceMode = useAppearanceStore((state) => state.mode);
  const accentId = useAppearanceStore((state) => state.accent);

  // Qatorda hozirgi tanlov ko'rinib tursin — ekranga kirmasdan ham bilinadi.
  const appearanceSummary = [
    appearanceMode === "system"
      ? t("theme.system", {
          scheme: scheme === "dark" ? t("theme.darkLower") : t("theme.lightLower"),
        })
      : appearanceMode === "dark"
        ? t("theme.dark")
        : t("theme.light"),
    findAccent(accentId).label.toLowerCase(),
  ].join(" · ");

  async function signOut() {
    await logout();
    router.replace(ROUTES.auth.login);
  }

  /** Faqat qiymati BOR maydonlar. Bo'sh qator chizilmaydi. */
  const facts: { value: string; label: string }[] = [
    user?.phone ? { value: user.phone, label: t("profile.phone") } : null,
    user?.username ? { value: `@${user.username}`, label: t("profile.username") } : null,
    user?.email ? { value: user.email, label: "Email" } : null,
    user?.inviteCode
      ? { value: user.inviteCode, label: t("profile.inviteCode") }
      : null,
  ].filter((item): item is { value: string; label: string } => item !== null);

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* ── Bosh qism ── */}
        <View style={styles.hero}>
          <Avatar name={user?.name} src={user?.avatarUrl} size="2xl" />
          <Text variant="heading" style={styles.heroName} numberOfLines={2}>
            {user?.name || "Foydalanuvchi"}
          </Text>

          <View style={styles.heroMeta}>
            <Badge label={t(roleKey)} tone="brand" />
            {/* Reyting faqat o'qituvchida mazmunli va faqat baho bo'lsa. */}
            {user?.avgRating != null && (user.ratingCount ?? 0) > 0 ? (
              <View style={styles.rating}>
                <Star size={14} color={palette["warning-strong"]} fill={palette["warning-strong"]} />
                <Text variant="caption" tone="muted">
                  {user.avgRating.toFixed(1)} · {user.ratingCount} baho
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* ── Amallar qatori ── */}
        <View style={styles.actions}>
          <ActionButton
            icon={Pencil}
            label={t("profile.edit")}
            onPress={() => setEditOpen(true)}
          />
          <ActionButton
            icon={Palette}
            label={t("profile.appearance")}
            onPress={() => router.push("/appearance")}
          />
          <ActionButton
            icon={Bell}
            label={t("profile.notifications")}
            badge={unread.data ?? 0}
            onPress={() => router.push("/notifications")}
          />
        </View>

        {/*
          * TASDIQLASH OGOHLANTIRISHI OLIB TASHLANDI.
          *
          * Vebda bu yerda "hisobingiz hali administrator tomonidan
          * tasdiqlanmagan" degan chiziq turadi. Loyiha egasi bu bosqichda
          * tasdiqlash talabi kerak emas deb qaror qildi (2026-10-05).
          *
          * DIQQAT: talabning O'ZI backendda qoladi — u tasdiqlanmagan
          * o'qituvchiga 403 qaytaradi. Backend uni olib tashlamaguncha
          * o'qituvchi sababni ekranda ko'rmaydi, faqat xatoni ko'radi.
          * So'rov `docs/BACKEND-SOROVLAR.md` da.
          */}

        {/* ── Ma'lumot kartasi: qiymat tepada, yorlig'i pastda ── */}
        {facts.length > 0 ? (
          <View style={[styles.group, { backgroundColor: palette.card, borderColor: palette.border }]}>
            {facts.map((fact, index) => (
              <View key={fact.label}>
                {index > 0 ? <Separator inset={16} /> : null}
                <View style={styles.fact}>
                  <Text selectable>{fact.value}</Text>
                  <Text variant="caption" tone="muted">
                    {fact.label}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        <View style={[styles.group, { backgroundColor: palette.card, borderColor: palette.border }]}>
          {/*
            * Hisob almashtirish faqat IMKONI BOR foydalanuvchida ko'rinadi:
            * bog'langan hisobi bor yoki yangi rol ocha oladigan. Aks holda
            * qator bosilganda bo'sh oyna chiqardi.
            */}
          {canSwitchAccounts(user) ? (
            <>
              <ListItem
                title={t("profile.switchAccount")}
                subtitle={
                  user?.linkedAccounts.length
                    ? t("profile.linkedAccounts", { count: user.linkedAccounts.length })
                    : t("profile.newRole")
                }
                leading={<UsersRound size={20} color={palette["muted-foreground"]} />}
                chevron
                onPress={() => setSwitchOpen(true)}
              />
              <Separator inset={52} />
            </>
          ) : null}
          {/*
            * TAHLIL VA MOCK TEST BU YERDA YO'Q — ular "Ish maydoni"
            * bo'limida (`pages/workspace/workspace-page.tsx`).
            *
            * Ilgari mobilda Workspace yo'q edi va bu ikkisi boradigan joy
            * topilmay profilga qo'yilgandi. Workspace qo'shilgach ular
            * ikki joyda ko'rinib qoldi — vebda esa faqat Workspace'da.
            *
            * Profilda HISOBGA tegishli narsalar qoladi: hisob almashish,
            * kirishlar tarixi, ko'rinish, chiqish.
            */}
          <ListItem
            title={t("profile.loginHistory")}
            subtitle={t("profile.loginHistoryHint")}
            leading={<History size={20} color={palette["muted-foreground"]} />}
            chevron
            onPress={() => setHistoryOpen(true)}
          />
          <Separator inset={52} />
          <ListItem
            title={t("profile.appearance")}
            subtitle={appearanceSummary}
            leading={<Palette size={20} color={palette["muted-foreground"]} />}
            chevron
            onPress={() => router.push("/appearance")}
          />
          <Separator inset={52} />
          <ListItem
            title={t("profile.app")}
            subtitle={`${Constants.expoConfig?.version ?? "0.0.0"} · ${env.appEnv}`}
            leading={<Smartphone size={20} color={palette["muted-foreground"]} />}
          />
        </View>

        <Button
          title={t("profile.signOut")}
          variant="secondary"
          icon={<LogOut size={16} color={palette["secondary-foreground"]} />}
          onPress={() => void signOut()}
        />
      </ScrollView>

      <LoginHistorySheet open={historyOpen} onClose={() => setHistoryOpen(false)} />
      <ProfileEditSheet user={user} open={editOpen} onClose={() => setEditOpen(false)} />
      <AccountSwitchSheet user={user} open={switchOpen} onClose={() => setSwitchOpen(false)} />
    </Screen>
  );
}

/** Avatar ostidagi keng teginish maydonli amal tugmasi (Telegram naqshi). */
function ActionButton({
  icon: Icon,
  label,
  onPress,
  badge = 0,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  badge?: number;
}) {
  const { palette } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        { backgroundColor: palette.card, borderColor: palette.border },
        pressed && { opacity: 0.85 },
      ]}
    >
      <View>
        <Icon size={20} color={palette["primary-text"]} />
        {badge > 0 ? (
          <View style={styles.actionBadge}>
            <CountBadge count={badge} />
          </View>
        ) : null}
      </View>
      <Text variant="caption" numberOfLines={1} style={{ color: palette["primary-text"] }}>
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Kirishlar tarixi — veb `login-history-dialog.tsx` porti.
 *
 * `new_ip` / `new_device` bayroqlari ajratib ko'rsatiladi: begona kirishni
 * foydalanuvchi darhol sezishi kerak.
 */
function LoginHistorySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation("mobile");
  // `enabled: open` — tarix faqat oyna ochilganda so'raladi.
  const history = useLoginHistory(null, open);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t("profile.loginHistory")}
      description={t("profile.loginHistoryFull")}
    >
      {history.isLoading ? <ScreenLoading label={t("common.loading")} /> : null}

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
            {record.isNewDevice ? <Badge label={t("profile.newDevice")} tone="warning" /> : null}
            {record.isNewIp && !record.isNewDevice ? <Badge label={t("profile.newIp")} tone="warning" /> : null}
          </View>
        </View>
      ))}

      {!history.isLoading && (history.data ?? []).length === 0 ? (
        <Text variant="caption" tone="muted">
          {t("profile.noRecords")}
        </Text>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 14, paddingBottom: 40 },
  hero: { alignItems: "center", gap: 8, paddingTop: 12, paddingBottom: 4 },
  heroName: { textAlign: "center" },
  heroMeta: { flexDirection: "row", alignItems: "center", gap: 10 },
  rating: { flexDirection: "row", alignItems: "center", gap: 4 },
  actions: { flexDirection: "row", gap: 10 },
  action: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  actionBadge: { position: "absolute", top: -6, right: -12 },
  group: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  fact: { gap: 2, paddingHorizontal: 16, paddingVertical: 12 },
  record: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10 },
  recordBody: { flex: 1, gap: 2 },
});
