import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { useAuth } from "@/modules/auth";
import { env, ROUTES } from "@/shared/config";
import { Button, Screen, Text, useTheme } from "@/shared/ui";

/**
 * Faza 0 ning vaqtinchalik bosh sahifasi.
 *
 * Maqsadi — chiqish mezonini KO'RSATIB berish: login ishladi, `/auth/me/`
 * javob qaytardi, token qayta ishga tushirishdan keyin ham saqlanib qoldi.
 * Faza 1–3 da har rol o'z haqiqiy ekranlarini oladi va bu sahifa o'chadi.
 */
export function HomePlaceholderPage({ area }: { area: string }) {
  const { t } = useTranslation("mobile");
  const router = useRouter();
  const { user, logout } = useAuth();
  const { palette } = useTheme();

  async function signOut() {
    await logout();
    router.replace(ROUTES.auth.login);
  }

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text variant="heading">Xush kelibsiz, {user?.firstName || user?.name || "foydalanuvchi"}</Text>
        <Text tone="muted">{area}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <Row label={t("homeplaceholderpage.tsx.login")} value={user?.username ?? "—"} />
        <Row label={t("homeplaceholderpage.tsx.rol")} value={user?.role ?? "—"} />
        <Row label={t("homeplaceholderpage.tsx.id")} value={user?.id ?? "—"} />
        <Row label={t("homeplaceholderpage.tsx.muhit")} value={env.appEnv} />
        <Row label={t("homeplaceholderpage.tsx.api")} value={env.apiUrl} />
      </View>

      <View style={styles.note}>
        <Text variant="caption" tone="muted">
          Bu — Faza 0 ning tekshiruv ekrani. Ilovani yopib qayta oching: sessiya
          saqlanib qolsa, tokenni xavfsiz saqlash to'g'ri ishlayapti.
        </Text>
      </View>

      <Button title={t("homeplaceholderpage.tsx.chiqish")} variant="secondary" onPress={() => void signOut()} />
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text variant="caption" tone="muted">
        {label}
      </Text>
      <Text variant="label" numberOfLines={1} style={styles.value}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: 4, paddingTop: 24, paddingBottom: 20 },
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, padding: 16, gap: 12 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 },
  value: { flexShrink: 1, textAlign: "right" },
  note: { paddingVertical: 20 },
});
