import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { Sheet, toast } from "@/shared/ui";
import { EmailVerifyForm } from "./email-verify-form";

export interface EmailVerifyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialEmail: string;
}

/** Veb #199 `email-verify-dialog.tsx` (`AppDialog variant="adaptive"`) — mobilda pastki oyna. */
export function EmailVerifyDialog({ open, onOpenChange, initialEmail }: EmailVerifyDialogProps) {
  const { t } = useTranslation("auth");
  return (
    <Sheet variant="app" open={open} onClose={() => onOpenChange(false)} title={t("emailVerify.title")} description={t("emailVerify.description")}>
      {open ? (
        <View style={styles.body}>
          <EmailVerifyForm
            initialEmail={initialEmail}
            onVerified={() => {
              toast.success(t("emailVerify.done"));
              onOpenChange(false);
            }}
          />
        </View>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { paddingBottom: 8 },
});
