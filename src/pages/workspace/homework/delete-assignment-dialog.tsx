import { useTranslation } from "react-i18next";
import { ConfirmDialog } from "@/shared/ui";

export interface DeleteAssignmentDialogProps {
  open: boolean;
  count: number;
  pending?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

/** Vazifani o'chirish — veb `delete-assignment-dialog.tsx` ning tor ekran varianti (`ConfirmDialog`). */
export function DeleteAssignmentDialog({ open, count, pending = false, onOpenChange, onConfirm }: DeleteAssignmentDialogProps) {
  const { t } = useTranslation("homework");
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      icon="logout"
      title={t("deleteDialog.title")}
      description={t("deleteDialog.description", { count })}
      confirmLabel={t("deleteDialog.confirm")}
      cancelLabel={t("deleteDialog.cancel")}
      pending={pending}
      onConfirm={onConfirm}
    />
  );
}
