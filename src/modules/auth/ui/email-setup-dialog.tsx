import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
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
 */
export function EmailSetupDialog() {
  const { t } = useTranslation("auth");
  const ds = useDs();
  const { user, logout } = useAuth();
  const [later, setLater] = useState(laterChosen);
  const deadline = user?.emailSetupDeadline ?? null;
  const overdue = emailSetupOverdue(deadline);
  const open = Boolean(user?.emailSetupRequired) && !user?.mustChangePassword && (overdue || !later);

  function postpone() {
    laterChosen = true;
    setLater(true);
  }

  return (
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
  );
}

const styles = StyleSheet.create({
  body: { alignItems: "center", gap: 12, padding: 24 },
  center: { textAlign: "center" },
  icon: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  form: { alignSelf: "stretch", marginTop: 4 },
  secondary: { alignSelf: "stretch", height: 48, alignItems: "center", justifyContent: "center", borderWidth: 1, borderRadius: dsRadius.full },
});
