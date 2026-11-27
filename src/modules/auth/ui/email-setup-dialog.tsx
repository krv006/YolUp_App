import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePathname } from "expo-router";
import { CenterDialog, DsText, dsRadius, Icon, toast, useDs } from "@/shared/ui";
import { emailSetupOverdue, formatDeadline } from "../lib/email-setup";
import { useAuth } from "../model/use-auth";
import { EmailVerifyForm } from "./email-verify-form";

/*
 * Vebda "Keyinroq" `sessionStorage` da saqlanadi (brauzer oynasi yopilguncha).
 * Mobilda uning o'rni — ilova jarayoni: qayta ishga tushirilganda eslatma
 * yana chiqadi.
 */
let laterChosen = false;

/**
 * Email eslatmasi — veb #199 `email-setup-dialog.tsx`: backend
 * `email_setup_required` bo'lsa chiqadi (parolni majburiy almashtirish
 * oynasi ochiq bo'lsa — yo'q). Muddatgacha "Keyinroq" bilan yopiladi,
 * muddatdan keyin yopib bo'lmaydi: tasdiqlash yoki "Chiqish".
 *
 * Veb #214: "Keyinroq" dan keyin pastki menyu ustida doimiy banner —
 * "Emailingizni {sana} gacha qo'shing · Qo'shish" (bosilsa oyna qaytadan).
 */
export function EmailSetupDialog() {
  const { t } = useTranslation("auth");
  const ds = useDs();
  const { user, logout } = useAuth();
  const [later, setLater] = useState(laterChosen);
  const deadline = user?.emailSetupDeadline ?? null;
  const overdue = emailSetupOverdue(deadline);
  const required = Boolean(user?.emailSetupRequired) && !user?.mustChangePassword;
  const open = required && (overdue || !later);
  /*
   * 🟡 Banner faqat pastki menyusi bor bo'lim ekranlarida (`/{rol}/{bo'lim}`).
   * Vebda u `fixed` — telefonda doska, chat yoki forma ekranida asboblar va
   * yozish maydonini yopib qo'yardi.
   */
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  // Faqat rol tablari (`/teacher/schedule` kabi) — `/recordings/<id>` ham 2 bo'lakli, lekin tab emas.
  const onTabScreen =
    segments.length === 2 &&
    ["teacher", "student", "parent"].includes(segments[0] ?? "") &&
    !["notifications", "search"].includes(segments[1] ?? "");
  const showBanner = required && !overdue && later && onTabScreen;
  // Pastki suzuvchi menyu ustida (`providers/role-tabs.tsx` `useFloatingTabInset`: 30 + 68 + 14).
  // Import qilinmaydi — auth -> providers -> conversation -> course -> auth aylanma bog'liqlik.
  const insets = useSafeAreaInsets();
  const bannerBottom = Math.max(30, insets.bottom) + 68 + 14;

  function postpone() {
    laterChosen = true;
    setLater(true);
  }

  function reopen() {
    laterChosen = false;
    setLater(false);
  }

  return (
    <>
      {showBanner ? (
        // `fixed inset-x-4 bottom-28 rounded-2xl bg-warning-bg py-1.5 pr-1.5 pl-4 shadow-lg ring-1 ring-warning/30`
        <View pointerEvents="box-none" style={[styles.bannerWrap, { bottom: bannerBottom }]}>
          <View accessibilityRole="alert" style={[styles.banner, { backgroundColor: ds.c["warning-bg"], borderColor: ds.c.line }]}>
            <Icon name="mail" size={18} color={ds.c["warning-fg"]} />
            <DsText v="body-sm" c="warning-fg" style={styles.grow}>
              {deadline ? t("emailSetup.banner", { date: formatDeadline(deadline) }) : t("emailSetup.bannerNoDate")}
            </DsText>
            <Pressable
              accessibilityRole="button"
              onPress={reopen}
              style={({ pressed }) => [styles.bannerAction, { backgroundColor: pressed ? ds.c.subtle : ds.c.surface }]}
            >
              <DsText v="button">{t("emailSetup.bannerAction")}</DsText>
            </Pressable>
          </View>
        </View>
      ) : null}
    <CenterDialog open={open} onClose={() => (overdue ? undefined : postpone())} maxWidth={480}>
      <View style={styles.body}>
        <View style={[styles.icon, { backgroundColor: ds.c["brand-subtle"] }]}>
          <Icon name="mail" size={26} color={ds.c.brand} />
        </View>
        <DsText v="title-lg" w="600" style={styles.center}>
          {t("emailSetup.title")}
        </DsText>
        <DsText v="body-sm" c="ink-secondary" style={styles.center}>
          {overdue ? t("emailSetup.overdue") : deadline ? t("emailSetup.deadline", { date: formatDeadline(deadline) }) : t("emailSetup.text")}
        </DsText>
        {open ? (
          <View style={styles.form}>
            <EmailVerifyForm initialEmail={user?.email ?? ""} onVerified={() => toast.success(t("emailVerify.done"))} />
          </View>
        ) : null}
        <Pressable
          accessibilityRole="button"
          onPress={overdue ? () => void logout() : postpone}
          style={({ pressed }) => [styles.secondary, { borderColor: ds.c["line-strong"], backgroundColor: pressed ? ds.c.subtle : ds.c.surface }]}
        >
          <DsText v="button">{overdue ? t("emailSetup.logout") : t("emailSetup.later")}</DsText>
        </Pressable>
      </View>
    </CenterDialog>
    </>
  );
}

const styles = StyleSheet.create({
  body: { alignItems: "center", gap: 12, padding: 24 },
  grow: { flex: 1, minWidth: 0 },
  bannerWrap: { position: "absolute", left: 16, right: 16, zIndex: 30 },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 6,
    paddingRight: 6,
    paddingLeft: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: dsRadius["2xl"],
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  bannerAction: { height: 32, justifyContent: "center", paddingHorizontal: 14, borderRadius: dsRadius.full },
  center: { textAlign: "center" },
  icon: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  form: { alignSelf: "stretch", marginTop: 4 },
  secondary: { alignSelf: "stretch", height: 48, alignItems: "center", justifyContent: "center", borderWidth: 1, borderRadius: dsRadius.full },
});
