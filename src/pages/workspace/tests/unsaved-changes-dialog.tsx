import { useTranslation } from "react-i18next";
import { MobileAlertDialog } from "@/shared/ui";

export interface UnsavedChangesDialogProps {
  open: boolean;
  count: number;
  onOpenChange: (open: boolean) => void;
  onLeave: () => void;
}

/** Saqlanmagan o'zgarishlar — veb `unsaved-changes-dialog.tsx` ning tor ekran varianti (`MobileAlertDialog`). */
export function UnsavedChangesDialog({ open, count, onOpenChange, onLeave }: UnsavedChangesDialogProps) {
  const { t } = useTranslation("quiz");
  return (
    <MobileAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      icon="edit-note"
      title={t("unsaved.title")}
      description={t("unsaved.description", { count })}
      cancelLabel={t("unsaved.leave")}
      confirmLabel={t("unsaved.stay")}
      onCancel={() => {
        onOpenChange(false);
        onLeave();
      }}
      onConfirm={() => onOpenChange(false)}
    />
  );
}
