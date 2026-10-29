import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Conversation } from "@/shared/types";
import { DsText, dsRadius, Icon, MobileButton, toast, useDs } from "@/shared/ui";
import type { DirectAction } from "../api/conversation.dto";
import { DIRECT_STATUS } from "../constants/direct-status";
import { useRequestDirect, useRespondDirect } from "../model/use-conversations";

export interface DirectRequestBarProps {
  conversation: Conversation;
  role: "teacher" | "student";
}

/**
 * Kutilayotgan yoki bloklangan shaxsiy chat — veb `direct-request-bar.tsx`
 * ning tor ekran varianti: yozish maydoni o'rnida holat paneli. O'qituvchida
 * "Bloklash" va "Qabul qilish" (bloklanganda "Blokdan chiqarish"), o'quvchida
 * bloklanganda "Qayta yuborish".
 */
export function DirectRequestBar({ conversation, role }: DirectRequestBarProps) {
  const { t } = useTranslation("chat");
  const ds = useDs();
  const insets = useSafeAreaInsets();
  const respond = useRespondDirect();
  const request = useRequestDirect();
  const blocked = conversation.directStatus === DIRECT_STATUS.BLOCKED;
  const teacher = role === "teacher";

  function answer(action: DirectAction) {
    respond.mutate(
      { roomId: conversation.id, action },
      {
        onSuccess: () => toast.success(action === "accept" ? t("info.conversationAccepted") : t("info.conversationBlocked")),
        onError: (error: Error) => toast.error(error.message),
      }
    );
  }

  function resend() {
    if (!conversation.participantId) return;
    request.mutate(conversation.participantId, {
      onSuccess: () => toast.success(t("panel.directRequestSent")),
      onError: (error: Error) => toast.error(error.message),
    });
  }

  const title = teacher
    ? blocked
      ? t("directGate.teacherBlockedTitle")
      : t("directGate.teacherPendingTitle", { name: conversation.title })
    : blocked
      ? t("directGate.studentBlockedTitle")
      : t("directGate.studentPendingTitle");
  const hint = teacher
    ? blocked
      ? t("directGate.teacherBlockedHint")
      : t("directGate.teacherPendingHint")
    : blocked
      ? t("directGate.studentBlockedHint")
      : t("directGate.studentPendingHint");

  return (
    // `shrink-0 bg-surface px-4 pt-2.5 pb-6`
    <View style={[styles.bar, { backgroundColor: ds.c.surface, paddingBottom: Math.max(24, insets.bottom + 8) }]}>
      {/* `flex-col gap-3 rounded-xl bg-subtle p-4` */}
      <View style={[styles.card, { backgroundColor: ds.c.subtle }]}>
        <View style={styles.head}>
          <View style={[styles.icon, { backgroundColor: blocked ? ds.c["error-bg"] : ds.c.surface }]}>
            <Icon name={blocked ? "lock" : teacher ? "person-add" : "hourglass-empty"} size={20} color={blocked ? ds.c["error-text"] : ds.c.brand} />
          </View>
          <View style={styles.text}>
            <DsText v="title-sm">{title}</DsText>
            <DsText v="body-sm" c="ink-secondary">
              {hint}
            </DsText>
          </View>
        </View>

        {teacher ? (
          <View style={styles.actions}>
            {blocked ? null : <MobileButton variant="danger" label={t("directGate.block")} disabled={respond.isPending} onPress={() => answer("block")} />}
            <MobileButton label={blocked ? t("directGate.unblock") : t("directGate.accept")} disabled={respond.isPending} onPress={() => answer("accept")} />
          </View>
        ) : blocked && conversation.participantId ? (
          <View style={styles.actions}>
            <MobileButton label={t("directGate.resend")} disabled={request.isPending} onPress={resend} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { paddingHorizontal: 16, paddingTop: 10 },
  card: { gap: 12, padding: 16, borderRadius: dsRadius.xl },
  head: { flexDirection: "row", alignItems: "center", gap: 12 },
  icon: { width: 40, height: 40, borderRadius: dsRadius.full, alignItems: "center", justifyContent: "center" },
  text: { flex: 1, minWidth: 0, gap: 2 },
  /* `grid-cols-2 gap-2` */
  actions: { flexDirection: "row", gap: 8 },
});
