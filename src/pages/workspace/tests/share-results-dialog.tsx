import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useShareQuizResults } from "@/modules/quiz";
import { DsText, dsRadius, MobileButton, Sheet, Switch, toast, useDs } from "@/shared/ui";

export interface ShareResultsDialogProps {
  quizId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Natijalarni ulashish — veb `share-results-dialog.tsx` (`AppDialog adaptive`) ning pastki oyna varianti. */
export function ShareResultsDialog({ quizId, open, onOpenChange }: ShareResultsDialogProps) {
  const { t } = useTranslation("quiz");
  const ds = useDs();
  const share = useShareQuizResults();
  const [parents, setParents] = useState(false);

  function confirm() {
    share.mutate(
      { quizId, parents },
      {
        onSuccess: (result) => {
          toast.success(parents ? t("results.shareDoneParents", { count: result.parents_notified ?? 0 }) : t("results.shareDone"));
          onOpenChange(false);
        },
        onError: (error: Error) => toast.error(error.message),
      }
    );
  }

  return (
    <Sheet
      variant="app"
      open={open}
      onClose={() => onOpenChange(false)}
      title={t("results.shareTitle")}
      description={t("results.shareHint")}
      footer={
        <>
          <MobileButton variant="secondary" label={t("results.shareCancel")} onPress={() => onOpenChange(false)} />
          <MobileButton label={t("results.shareConfirm")} disabled={share.isPending} onPress={confirm} />
        </>
      }
    >
      {/* `flex items-center gap-3 rounded-xl border border-line px-4 py-3` */}
      <View style={[styles.row, { borderColor: ds.c.line }]}>
        <View style={styles.text}>
          <DsText v="label-strong">{t("results.shareParents")}</DsText>
          <DsText v="caption" c="ink-tertiary">
            {t("results.shareParentsHint")}
          </DsText>
        </View>
        <Switch checked={parents} onCheckedChange={setParents} accessibilityLabel={t("results.shareParents")} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderRadius: dsRadius.xl },
  text: { flex: 1, minWidth: 0 },
});
