import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { useUnlinkChild, type ParentChild } from "@/modules/parent";
import { ROUTES } from "@/shared/config";
import { ConfirmDialog, toast } from "@/shared/ui";

/** Farzandni uzish — veb `unlink-child-dialog.tsx` (markaziy ogohlantirish). */
export function UnlinkChildDialog({ child, open, onOpenChange }: { child: ParentChild; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useTranslation("parent");
  const router = useRouter();
  const unlink = useUnlinkChild();
  const name = child.name.split(" ")[0] || child.name;

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      icon="link-off"
      title={t("profile.unlink.title", { name })}
      description={t("profile.unlink.description", { name })}
      confirmLabel={t("profile.unlink.confirm")}
      cancelLabel={t("profile.unlink.cancel")}
      pending={unlink.isPending}
      onConfirm={() =>
        unlink.mutate(child.linkId, {
          onSuccess: () => {
            onOpenChange(false);
            toast.success(t("profile.unlink.done", { name }));
            router.dismissTo(ROUTES.parent.children as never);
          },
          onError: () => toast.error(t("profile.unlink.failed")),
        })
      }
    />
  );
}
