import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronDown } from "lucide-react-native";
import { AuthButton } from "@/modules/auth/ui/auth-screen";
import { ROUTES } from "@/shared/config";
import { SUPPORTED_LANGUAGES, useLanguageStore, type AppLanguage } from "@/shared/model";
import { Logo, radius, Text, useTheme } from "@/shared/ui";

const FLAGS: Record<AppLanguage, string> = { uz: "🇺🇿", ru: "🇷🇺", en: "🇬🇧" };
const CODES: Record<AppLanguage, string> = { uz: "UZ", ru: "RU", en: "EN" };

/**
 * Boshlang'ich ekran — veb `pages/auth/welcome-page.tsx`: o'ngda til
 * tanlagichi, o'rtada logo, pastda "Kirish" va "Ro'yxatdan o'tish".
 */
export function WelcomePage() {
  const { t } = useTranslation("auth");
  const { t: common } = useTranslation("common");
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const [open, setOpen] = useState(false);

  return (
    <View style={[styles.root, { backgroundColor: palette.background, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 28 }]}>
      <View style={[styles.top, styles.raised]}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          onPress={() => setOpen((value) => !value)}
          style={[styles.language, { backgroundColor: palette["surface-subtle"] }]}
        >
          <Text variant="label">{FLAGS[language]}</Text>
          <Text variant="label">{CODES[language]}</Text>
          <ChevronDown size={16} color={palette["muted-foreground"]} />
        </Pressable>
        {open ? (
          <View style={[styles.menu, { borderColor: palette.border, backgroundColor: palette.surface }]}>
            {SUPPORTED_LANGUAGES.map((code) => {
              const active = language === code;
              return (
                <Pressable
                  key={code}
                  accessibilityRole="menuitem"
                  accessibilityState={{ selected: active }}
                  onPress={() => {
                    setLanguage(code);
                    setOpen(false);
                  }}
                  style={({ pressed }) => [
                    styles.option,
                    active ? { backgroundColor: palette["primary-soft"] } : pressed && { backgroundColor: palette["surface-subtle"] },
                  ]}
                >
                  <Text variant="label">{FLAGS[code]}</Text>
                  <Text variant="label" style={{ color: active ? palette.primary : palette.foreground }}>
                    {common(`language.${code}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>

      <View style={styles.center}>
        <Logo size={128} />
      </View>

      <View style={styles.actions}>
        <AuthButton onPress={() => router.push(ROUTES.auth.login)}>{t("form.submit")}</AuthButton>
        <AuthButton variant="secondary" onPress={() => router.push(ROUTES.auth.register)}>
          {t("mobile.login.registerLink")}
        </AuthButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /* `px-5 pt-4 pb-7` */
  root: { flex: 1, paddingHorizontal: 20 },
  raised: { zIndex: 10 },
  top: { flexDirection: "row", justifyContent: "flex-end" },
  language: { height: 40, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, borderRadius: radius.full },
  /* `top-12 w-[140px] rounded-2xl border p-1.5 shadow-xl` */
  menu: {
    position: "absolute",
    top: 48,
    right: 0,
    width: 140,
    gap: 2,
    padding: 6,
    borderWidth: 1,
    borderRadius: radius["2xl"],
    shadowColor: "#24264d",
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  option: { height: 44, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, borderRadius: radius.xl },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 40 },
  actions: { width: "100%", maxWidth: 420, alignSelf: "center", gap: 12 },
});
