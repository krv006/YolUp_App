import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Check, Clock3, Megaphone, Plus, UserRound } from "lucide-react-native";
import { formatDateTime, htmlToPlainText } from "@/shared/lib";
import { PortalButton, PortalCard, Sheet, Text, useLegacyColors, useTheme } from "@/shared/ui";
import { useNotificationRecipients, useSentNotifications } from "../model/notification.queries";
import { SendNotificationSheet } from "./send-notification-sheet";

/**
 * Yuborilgan xabarlar — veb `sent-notifications-panel.tsx`: sarlavha va
 * "Yangi xabar", har xabarda qisqa matn, vaqt va o'qilganlar soni;
 * bosilsa kim o'qigani ochiladi. Matnlar vebdagidek shu faylda.
 *
 * Vebda bu bo'lim tor ekranda uslubsiz (`.portal-panel` klassi CSS'da
 * yo'q) chiqadi — bu yerda boshqa panellar kabi kartada.
 */
export function SentNotificationsPanel() {
  const { t } = useTranslation("notification");
  const { palette } = useTheme();
  const colors = useLegacyColors();
  const [composeOpen, setComposeOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const sent = useSentNotifications({ page_size: 30 });
  const recipients = useNotificationRecipients(detailId);
  const items = sent.data?.items ?? [];

  if (sent.isError) return null;

  return (
    <PortalCard style={styles.panel}>
      {/* Tor ekranda tugma sarlavha yonida "BILDIRISHNOMALAR" ni sindirardi — u pastda. */}
      <View style={styles.head}>
        <View>
          <Text variant="caption" style={[styles.eyebrow, { color: palette["primary-text"] }]}>
            {t("sentPanel.eyebrow")}
          </Text>
          <Text variant="body" style={styles.title}>
            {t("sentPanel.title")}
          </Text>
        </View>
        <PortalButton
          variant="primary"
          icon={Plus}
          label={t("sentPanel.compose")}
          onPress={() => setComposeOpen(true)}
          style={styles.compose}
        />
      </View>

      {sent.isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={palette.primary} />
          <Text variant="label" style={{ color: colors.muted }}>
            {t("sentPanel.loading")}
          </Text>
        </View>
      ) : null}

      {sent.isSuccess && !items.length ? (
        <Text variant="body" style={{ color: colors.muted }}>
          {t("sentPanel.empty")}
        </Text>
      ) : null}

      {items.length ? (
        <View style={styles.list}>
          {items.map((item) => {
            const rate = item.totalCount ? Math.round((item.readCount / item.totalCount) * 100) : 0;
            const Icon = item.targetType === "all" ? Megaphone : UserRound;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                onPress={() => setDetailId(item.id)}
                style={({ pressed }) => [
                  styles.row,
                  { borderColor: pressed ? palette["border-accent-strong"] : colors.border, backgroundColor: palette.surface },
                ]}
              >
                <View style={[styles.icon, { backgroundColor: palette["primary-tint"] }]}>
                  <Icon size={16} color={palette["primary-text"]} />
                </View>
                <View style={styles.body}>
                  {/* `.notification-html.is-preview` — 13px, ikki qator. */}
                  <Text variant="label" numberOfLines={2} style={styles.preview}>
                    {htmlToPlainText(item.html, 240)}
                  </Text>
                  <View style={styles.meta}>
                    <Clock3 size={12} color={colors.muted} />
                    <Text variant="caption" style={[styles.small, { color: colors.muted }]}>
                      {item.createdAt ? formatDateTime(item.createdAt) : "—"}
                    </Text>
                  </View>
                </View>
                <View style={styles.stat}>
                  <Text variant="body" style={styles.statValue}>
                    {item.readCount}/{item.totalCount}
                  </Text>
                  <Text variant="caption" style={[styles.small, { color: colors.muted }]}>
                    {t("sentPanel.readRate", { rate })}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <SendNotificationSheet open={composeOpen} onClose={() => setComposeOpen(false)} />

      <Sheet
        open={Boolean(detailId)}
        onClose={() => setDetailId(null)}
        title={t("sentPanel.readersTitle")}
        description={t("sentPanel.readersDescription")}
      >
        {recipients.isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={palette.primary} />
            <Text variant="label" style={{ color: colors.muted }}>
              {t("sentPanel.readersLoading")}
            </Text>
          </View>
        ) : null}
        {recipients.data?.length ? (
          // `.notification-recipients` — balandligi 360 bilan cheklangan.
          <ScrollView style={styles.recipients} contentContainerStyle={styles.recipientsBody} nestedScrollEnabled>
            {recipients.data.map((row) => (
              <View
                key={row.id}
                style={[
                  styles.recipient,
                  row.readAt
                    ? { borderColor: palette["success-soft"], backgroundColor: palette["success-soft"] }
                    : { borderColor: colors.border, backgroundColor: palette.surface },
                ]}
              >
                <View style={styles.grow}>
                  <Text variant="label" numberOfLines={1} style={styles.recipientName}>
                    {row.name}
                  </Text>
                  <Text variant="caption" numberOfLines={1} style={[styles.small, { color: colors.muted }]}>
                    @{row.username}
                  </Text>
                </View>
                {row.readAt ? (
                  <View style={styles.readAt}>
                    <Check size={13} color={palette["tone-emerald-fg"]} />
                    <Text variant="caption" style={[styles.flag, { color: palette["tone-emerald-fg"] }]}>
                      {formatDateTime(row.readAt)}
                    </Text>
                  </View>
                ) : (
                  <Text variant="caption" style={[styles.flag, { color: colors.muted }]}>
                    {t("sentPanel.unread")}
                  </Text>
                )}
              </View>
            ))}
          </ScrollView>
        ) : null}
        {recipients.isSuccess && !recipients.data.length ? (
          <Text variant="body" style={{ color: colors.muted }}>
            {t("sentPanel.noRecipients")}
          </Text>
        ) : null}
      </Sheet>
    </PortalCard>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  panel: { padding: 20, gap: 14 },
  head: { gap: 12 },
  compose: { alignSelf: "flex-start" },
  eyebrow: { fontSize: 12, lineHeight: 18, fontWeight: "700", letterSpacing: 1.56 },
  title: { marginTop: 4, fontSize: 19, lineHeight: 28.5, fontWeight: "400" },
  loading: { alignItems: "center", gap: 10, paddingVertical: 16 },
  /* `.sent-notification-list` — orasi 8 */
  list: { gap: 8 },
  /* `> button` — 12 14, radius 12, ustunlar orasi 12 */
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1, borderRadius: 12 },
  icon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  body: { flex: 1, minWidth: 0, gap: 4 },
  preview: { fontSize: 13, lineHeight: 20, fontWeight: "400" },
  meta: { flexDirection: "row", alignItems: "center", gap: 5 },
  small: { fontSize: 11, lineHeight: 16.5 },
  stat: { alignItems: "flex-end", gap: 2 },
  statValue: { fontSize: 15, lineHeight: 22, fontWeight: "700" },
  recipients: { maxHeight: 360 },
  recipientsBody: { gap: 6 },
  /* `li` — 9 11, radius 8 */
  recipient: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 9, paddingHorizontal: 11, borderWidth: 1, borderRadius: 8 },
  recipientName: { fontSize: 13 },
  readAt: { flexDirection: "row", alignItems: "center", gap: 4 },
  flag: { fontSize: 11, fontWeight: "700" },
});
