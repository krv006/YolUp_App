import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Check, Clock3, Megaphone } from "lucide-react-native";
import { formatDateTime } from "@/shared/lib";
import {
  Avatar,
  Badge,
  HtmlView,
  radius,
  ScreenEmpty,
  ScreenLoading,
  Separator,
  Sheet,
  Text,
  useTheme,
} from "@/shared/ui";
import { useNotificationRecipients, useSentNotifications } from "../model/notification.queries";

export interface SentNotificationsSheetProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Yuborilgan xabarlar va o'qilish statistikasi — veb
 * `sent-notifications-panel.tsx` ning mobil varianti
 * (docs/COMPLETED_WORK.md §2).
 *
 * Qatorni bosganda KIM o'qigani ochiladi.
 */
export function SentNotificationsSheet({ open, onClose }: SentNotificationsSheetProps) {
  const { palette } = useTheme();
  const [detailId, setDetailId] = useState<string | null>(null);

  const sent = useSentNotifications({ page_size: 30 }, open);
  const recipients = useNotificationRecipients(detailId);

  // Modul o'rnatilmagan muhitda (404) panel bo'sh emas, sabab bilan yopiladi.
  if (sent.isError) {
    return (
      <Sheet open={open} onClose={onClose} title="Yuborilgan xabarlar">
        <ScreenEmpty
          title="Ma'lumot yo'q"
          description="Bildirishnoma moduli bu muhitda mavjud emas."
        />
      </Sheet>
    );
  }

  const items = sent.data?.items ?? [];

  return (
    <Sheet
      open={open}
      onClose={() => {
        setDetailId(null);
        onClose();
      }}
      title="Yuborilgan xabarlar"
      description="Qatorni bosing — kim o'qigani ochiladi."
    >
      {sent.isLoading ? <ScreenLoading label="Yuklanmoqda…" /> : null}

      {!sent.isLoading && items.length === 0 ? (
        <ScreenEmpty title="Hali xabar yuborilmagan" />
      ) : null}

      {items.map((item, index) => {
        const open = detailId === item.id;
        return (
          <View key={item.id}>
            {index > 0 ? <Separator /> : null}

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: open }}
              onPress={() => setDetailId(open ? null : item.id)}
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}
            >
              <View style={[styles.icon, { backgroundColor: palette["primary-tint"] }]}>
                <Megaphone size={17} color={palette["primary-text"]} />
              </View>

              <View style={styles.body}>
                <HtmlView html={item.html} minHeight={40} />
                <View style={styles.meta}>
                  <Clock3 size={12} color={palette["muted-foreground"]} />
                  <Text variant="caption" tone="muted">
                    {formatDateTime(item.createdAt)}
                  </Text>
                </View>
              </View>

              <Badge
                label={`${item.readCount}/${item.totalCount}`}
                tone={item.readCount === item.totalCount ? "success" : "neutral"}
              />
            </Pressable>

            {open ? (
              <View style={styles.recipients}>
                {recipients.isLoading ? <ScreenLoading label="Yuklanmoqda…" /> : null}
                {(recipients.data ?? []).map((person) => (
                  <View key={person.id} style={styles.recipient}>
                    <Avatar name={person.name} size="sm" />
                    <Text variant="caption" style={styles.recipientName} numberOfLines={1}>
                      {person.name}
                    </Text>
                    {person.readAt ? (
                      <Check size={15} color={palette["success-strong"]} />
                    ) : (
                      <Text variant="caption" tone="muted">
                        o'qimagan
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        );
      })}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10 },
  icon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, gap: 4 },
  meta: { flexDirection: "row", alignItems: "center", gap: 5 },
  recipients: { gap: 6, paddingLeft: 44, paddingBottom: 10 },
  recipient: { flexDirection: "row", alignItems: "center", gap: 8 },
  recipientName: { flex: 1 },
});
