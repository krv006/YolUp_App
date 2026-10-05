import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { PartyPopper } from "lucide-react-native";
import { useAuth, useWelcomeStore } from "@/modules/auth";
import { ROLES } from "@/shared/constants";
import { Button, Sheet, Text, useTheme } from "@/shared/ui";

/**
 * Ro'yxatdan o'tgandan keyingi "Xush kelibsiz" oynasi.
 *
 * Ildizda turadi va belgi qo'yilgan bo'lsa oynani ochadi — belgini
 * ro'yxatdan o'tish qoldiradi (`auth/model/welcome.store.ts`, u yerda
 * nega aynan store ekani yozilgan).
 *
 * BIR MARTA: oyna yopilganda belgi o'chiriladi (MMKV dan ham), ya'ni
 * ilova qayta ishga tushsa yoki foydalanuvchi keyin yana kirsa u
 * qaytmaydi.
 */
export function WelcomeGate() {
  const { t } = useTranslation("mobile");
  const { palette } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const pending = useWelcomeStore((state) => state.pending);
  const clear = useWelcomeStore((state) => state.clear);

  /*
   * `isAuthenticated` SHART: ro'yxatdan o'tish ikki bosqichli (yaratish,
   * so'ng kirish). Belgi birinchisidan keyin qo'yiladi, oynani esa
   * foydalanuvchi ismi ma'lum bo'lgandagina ko'rsatish kerak.
   */
  const open = pending && isAuthenticated;

  const tips = useRoleTips(user?.role);

  return (
    <Sheet
      open={open}
      onClose={clear}
      title={t("welcome.title", { name: user?.firstName || user?.name || "" }).trim()}
      description={t("welcome.subtitle")}
    >
      <View style={styles.icon}>
        <View style={[styles.iconCircle, { backgroundColor: palette["primary-tint"] }]}>
          <PartyPopper size={28} color={palette["primary-text"]} />
        </View>
      </View>

      {tips.map((tip) => (
        <View key={tip} style={styles.tip}>
          <View style={[styles.dot, { backgroundColor: palette["primary-text"] }]} />
          <Text variant="caption" tone="muted" style={styles.tipText}>
            {tip}
          </Text>
        </View>
      ))}

      <Button title={t("welcome.start")} size="lg" onPress={clear} />
    </Sheet>
  );
}

/**
 * Rolga qarab ikkita qisqa yo'l-yo'riq.
 *
 * Yangi foydalanuvchining ekrani BO'SH bo'ladi: na guruh, na dars, na
 * vazifa. Keyingi qadam aytilmasa, u ilovani buzuq deb o'ylashi mumkin.
 */
function useRoleTips(role: string | undefined): string[] {
  const { t } = useTranslation("mobile");

  if (role === ROLES.TEACHER) {
    return [t("welcome.teacher.group"), t("welcome.teacher.lesson")];
  }
  if (role === ROLES.PARENT) {
    return [t("welcome.parent.link"), t("welcome.parent.follow")];
  }
  return [t("welcome.student.group"), t("welcome.student.parent")];
}

const styles = StyleSheet.create({
  icon: { alignItems: "center", paddingVertical: 4 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  tip: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  tipText: { flex: 1 },
});
