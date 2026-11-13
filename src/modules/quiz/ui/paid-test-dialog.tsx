import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { ROUTES } from "@/shared/config";
import { ConfirmDialog } from "@/shared/ui";

export interface PaidTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * "Test yaratish — pullik xizmat" — veb `paid-test-dialog.tsx`: xizmat
 * yoqilmagan o'qituvchiga izoh; "Yordam markazi" profil yordamiga olib o'tadi.
 */
export function PaidTestDialog({ open, onOpenChange }: PaidTestDialogProps) {
  const { t } = useTranslation("quiz");
  const router = useRouter();
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      tone="brand"
      icon="lock"
      title={t("paid.title")}
      description={t("paid.description")}
      confirmLabel={t("paid.contact")}
      cancelLabel={t("paid.close")}
      onConfirm={() => {
        onOpenChange(false);
        router.push(`${ROUTES.teacher.profile}/help` as never);
      }}
    />
  );
}
