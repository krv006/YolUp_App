import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";
import { MobileButton, MobileFieldLabel, MobileInput, Sheet } from "@/shared/ui";

export interface ResubmitDialogProps {
  open: boolean;
  student: string;
  pending?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (comment: string) => void;
}

/** Qayta topshirishga qaytarish — veb `resubmit-dialog.tsx` (pastki oyna, izoh majburiy). */
export function ResubmitDialog({ open, student, pending = false, onOpenChange, onConfirm }: ResubmitDialogProps) {
  const { t } = useTranslation("homework");
  const [comment, setComment] = useState("");

  function close() {
    setComment("");
    onOpenChange(false);
  }

  return (
    <Sheet
      variant="app"
      open={open}
      onClose={close}
      title={t("resubmitDialog.title")}
      description={t("resubmitDialog.description", { student })}
      footer={
        <>
          <MobileButton variant="secondary" label={t("resubmitDialog.cancel")} onPress={close} />
          <MobileButton label={t("resubmitDialog.submit")} disabled={pending || !comment.trim()} onPress={() => onConfirm(comment.trim())} />
        </>
      }
    >
      <MobileFieldLabel label={t("resubmitDialog.comment")} gap={8}>
        <MobileInput
          autoFocus
          multiline
          value={comment}
          onChangeText={setComment}
          placeholder={t("resubmitDialog.placeholder")}
          style={styles.area}
        />
      </MobileFieldLabel>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  area: { marginTop: -2 },
});
