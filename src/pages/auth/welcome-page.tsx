import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronDown } from "lucide-react-native";
import { AuthButton } from "@/modules/auth/ui/auth-screen";
import { ROUTES } from "@/shared/config";
import { SUPPORTED_LANGUAGES, useLanguageStore, type AppLanguage } from "@/shared/model";
import { DsGradient, DsText, dsRadius, Logo, Text, useDs } from "@/shared/ui";

const FLAGS: Record<AppLanguage, string> = { uz: "🇺🇿", ru: "🇷🇺", en: "🇬🇧" };
const CODES: Record<AppLanguage, string> = { uz: "UZ", ru: "RU", en: "EN" };

/**
 * Xush kelibsiz (M1.5/1.6) — veb `pages/auth/welcome-page.tsx`: auth
 * gradienti, o'ng tepada til tugmasi, logotip ekranning aynan markazida,
 * pastda "Kirish" va "Ro'yxatdan o'tish".
 */
export function WelcomePage() {
  const { t } = useTranslation("auth");
  const { t: common } = useTranslation("common");
  const ds = useDs();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const [open, setOpen] = useState(false);

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: ds.c.canvas,
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 24,
        },
      ]}
    >
      <DsGradient name="auth" />
      {/* Logotip ekranning o'rtasida — tugmalar va til tanlagichdan qat'i nazar (`absolute inset-0`). */}
      <View pointerEvents="none" style={styles.logo}>
        <Logo size={136} />
      </View>

      <View style={[styles.top, styles.raised]}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          onPress={() => setOpen((value) => !value)}
          style={[styles.language, { backgroundColor: ds.c.surface, boxShadow: ds.shadow.xs }]}
        >
          <Text style={styles.flag}>{FLAGS[language]}</Text>
          <DsText v="label-sm">{CODES[language]}</DsText>
          <ChevronDown size={14} color={ds.c["ink-secondary"]} />
        </Pressable>
        {open ? (
          <View style={[styles.menu, { borderColor: ds.c.line, backgroundColor: ds.c.surface, boxShadow: ds.shadow.xl }]}>
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
                    active ? { backgroundColor: ds.c["action-subtle"] } : pressed && { backgroundColor: ds.c.subtle },
                  ]}
                >
                  <Text style={styles.flag}>{FLAGS[code]}</Text>
                  <DsText v="label-strong" c={active ? "action" : "ink"}>
                    {common(`language.${code}`)}
                  </DsText>
                </Pressable>
              );
            })}
          </View>
        ) : null}
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
  /* `px-4 pt-2 pb-6` */
  root: { flex: 1, paddingHorizontal: 16 },
  logo: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "center" },
  raised: { zIndex: 10 },
  /* `justify-end pt-6` */
  top: { flexDirection: "row", justifyContent: "flex-end", paddingTop: 24 },
  /* `h-9 rounded-full px-2.5 gap-1 text-label-sm shadow-xs` */
  // Radius 18 (999 emas) — Android `boxShadow` ni 999 bilan pill shakliga kesmaydi.
  language: { height: 36, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, borderRadius: 18 },
  flag: { fontSize: 14, lineHeight: 18 },
  /* `top-12 w-[140px] rounded-2xl border p-1.5 gap-0.5 shadow-xl` */
  menu: { position: "absolute", top: 72, right: 0, width: 140, gap: 2, padding: 6, borderWidth: 1, borderRadius: dsRadius["2xl"] },
  /* `h-11 rounded-xl px-3 gap-2` */
  option: { height: 44, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, borderRadius: dsRadius.xl },
  /* `mt-auto max-w-[420px] gap-3 pb-10` */
  actions: { marginTop: "auto", width: "100%", maxWidth: 420, alignSelf: "center", gap: 12, paddingBottom: 40 },
});
