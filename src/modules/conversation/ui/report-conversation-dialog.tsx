import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { DsText, dsRadius, MobileButton, MobileFieldLabel, MobileInput, Sheet, toast, useDs } from "@/shared/ui";
import type { SpamReason } from "../api/conversation.dto";
import { useReportConversation } from "../model/use-conversations";

const REASONS: SpamReason[] = ["insult", "harassment", "advertising", "other"];
const MAX_COMMENT = 500;

export interface ReportConversationDialogProps {
  roomId: string;
  name: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReported?: () => void;
}

/**
 * Suhbatdosh ustidan shikoyat — veb `report-conversation-dialog.tsx`
 * (tor ekranda pastki oyna): sabab (radio ro'yxat), izoh (500 belgi) va
 * ogohlantirish. Yuborilgach chat spam holatiga o'tadi.
 */
export function ReportConversationDialog({ roomId, name, open, onOpenChange, onReported }: ReportConversationDialogProps) {
  const { t } = useTranslation("chat");
  const ds = useDs();
  const report = useReportConversation();
  const [reason, setReason] = useState<SpamReason>("insult");
  const [comment, setComment] = useState("");

  function close() {
    setReason("insult");
    setComment("");
    onOpenChange(false);
  }

  function submit() {
    report.mutate(
      { roomId, reason, comment },
      {
        onSuccess: () => {
          toast.success(t("report.sent"));
          close();
          onReported?.();
        },
        onError: (error: Error) => toast.error(error.message),
      }
    );
  }

  return (
    <Sheet
      variant="app"
      open={open}
      onClose={close}
      title={t("report.title")}
      description={t("report.description", { name })}
      footer={
        <>
          <MobileButton variant="secondary" label={t("report.cancel")} onPress={close} />
          <MobileButton variant="danger" label={t("report.submit")} disabled={report.isPending} onPress={submit} />
        </>
      }
    >
      <View style={styles.body}>
        {/* `rounded-xl border border-line`, tanlangan qator `bg-brand-subtle` */}
        <View accessibilityRole="radiogroup" accessibilityLabel={t("report.reasonLabel")} style={[styles.reasons, { borderColor: ds.c.line }]}>
          {REASONS.map((item, index) => {
            const checked = reason === item;
            return (
              <Pressable
                key={item}
                accessibilityRole="radio"
                accessibilityState={{ checked }}
                onPress={() => setReason(item)}
                style={[
                  styles.reason,
                  index < REASONS.length - 1 && { borderBottomWidth: 1, borderBottomColor: ds.c.line },
                  checked && { backgroundColor: ds.c["brand-subtle"] },
                ]}
              >
                <View style={[styles.radio, { borderColor: checked ? ds.c.brand : ds.c["line-strong"] }]}>
                  {checked ? <View style={[styles.dot, { backgroundColor: ds.c.brand }]} /> : null}
                </View>
                <DsText v="body">{t(`report.reasons.${item}`)}</DsText>
              </Pressable>
            );
          })}
        </View>
        <MobileFieldLabel label={t("report.commentLabel")}>
          <MobileInput
            multiline
            multilineHeight={96}
            maxLength={MAX_COMMENT}
            placeholder={t("report.commentPlaceholder")}
            value={comment}
            onChangeText={setComment}
          />
        </MobileFieldLabel>
        <View style={[styles.warning, { backgroundColor: ds.c["error-bg"] }]}>
          <DsText v="body-sm" c="error-text">
            {t("report.warning")}
          </DsText>
        </View>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: 16 },
  reasons: { overflow: "hidden", borderWidth: 1, borderRadius: dsRadius.xl },
  reason: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 10 },
  radio: { width: 18, height: 18, alignItems: "center", justifyContent: "center", borderWidth: 2, borderRadius: 9 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  warning: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: dsRadius.md },
});
