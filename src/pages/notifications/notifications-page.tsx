import { Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useState } from "react";
import { useRouter } from "expo-router";
import { ArrowLeft, BellRing } from "lucide-react-native";
import {
  useMarkNotificationRead,
  useNotificationInbox,
  type InboxNotification,
  type NotificationLink,
} from "@/modules/notification";
import { formatDayTime, htmlToPlainText } from "@/shared/lib";
import {
  Avatar,
  Button,
  HtmlView,
  IconButton,
  radius,
  Screen,
  ScreenEmpty,
  ScreenError,
  ScreenLoading,
  Separator,
  Sheet,
  Text,
  useTheme,
} from "@/shared/ui";

/**
 * Bildirishnomalar — veb `notification-inbox-dialog.tsx` ning mobil varianti.
 *
 * Veb'da bu qo'ng'iroq tugmasi ostidagi dialog edi. Mobilda alohida ekran:
 * ro'yxat uzun bo'lishi mumkin va dialog ichida skroll qilish noqulay.
 *
 * HTML matni `htmlToPlainText` bilan oddiy matnga aylantiriladi. WebView
 * ATAYLAB ishlatilmadi: ro'yxatdagi har element uchun alohida WebView ochish
 * xotirani tez yeydi va skrollni sekinlashtiradi. To'liq HTML kerak bo'lsa,
 * u kelajakda alohida tafsilot ekranida ko'rsatiladi.
 */
export function NotificationsPage() {
  const router = useRouter();
  const { palette } = useTheme();
  const inbox = useNotificationInbox();
  const markRead = useMarkNotificationRead();
  const [detail, setDetail] = useState<InboxNotification | null>(null);

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  /**
   * Havolani ochish. Vazifa va test bildirishnomalari o'z bo'limlariga
   * olib boradi; noma'lum tur bo'lsa faqat o'qilgan deb belgilanadi.
   */
  function openLink(link: NotificationLink | null) {
    if (!link) return;
    if (link.type === "quiz") router.push(`/student/quizzes/${link.id}`);
    // `assignment` uchun kurs kerak — u bildirishnomada yo'q. Vazifalar
    // guruh chatining "Vazifalar" bo'limida, shuning uchun hozircha
    // suhbatlar ro'yxatiga olib boramiz (veb ham vazifani avval so'raydi).
    else if (link.type === "assignment") router.push("/student/chats");
  }

  function openNotification(item: InboxNotification) {
    if (!item.isRead) markRead.mutate(item.notificationId);
    // Ro'yxatda faqat qisqa matn ko'rinadi (WebView xotira sababi) —
    // to'liq HTML tafsilot oynasida chiziladi.
    setDetail(item);
  }

  if (inbox.isLoading) {
    return (
      <Screen>
        <ScreenLoading label="Xabarlar yuklanmoqda…" />
      </Screen>
    );
  }

  if (inbox.isError) {
    return (
      <Screen>
        <ScreenError message="Xabarlarni yuklab bo'lmadi" onRetry={() => void inbox.refetch()} />
      </Screen>
    );
  }

  const items = inbox.data?.items ?? [];

  return (
    <Screen padded={false}>
      <View style={[styles.head, { borderBottomColor: palette.border }]}>
        <IconButton accessibilityLabel="Orqaga" onPress={goBack}>
          <ArrowLeft size={22} color={palette.foreground} />
        </IconButton>
        <Text variant="subheading" style={styles.title}>
          Bildirishnomalar
        </Text>
      </View>

      {items.length === 0 ? (
        <ScreenEmpty title="Xabar yo'q" description="Yangi xabarlar shu yerda ko'rinadi." />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <Separator inset={64} />}
          refreshControl={
            <RefreshControl
              refreshing={inbox.isRefetching}
              onRefresh={() => void inbox.refetch()}
              tintColor={palette["muted-foreground"]}
            />
          }
          renderItem={({ item }) => (
            <NotificationRow item={item} onPress={() => openNotification(item)} />
          )}
        />
      )}

      <Sheet
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail?.sender?.name ?? "YolUp"}
        description={detail ? formatDayTime(detail.createdAt) : undefined}
      >
        {detail ? <HtmlView html={detail.html} /> : null}

        {detail?.link ? (
          <Button
            title="Ochish"
            onPress={() => {
              openLink(detail.link);
              setDetail(null);
            }}
          />
        ) : null}
      </Sheet>
    </Screen>
  );
}

function NotificationRow({ item, onPress }: { item: InboxNotification; onPress: () => void }) {
  const { palette } = useTheme();
  const preview = htmlToPlainText(item.html, 160);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.sender?.name ?? "YolUp"}: ${preview}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !item.isRead && { backgroundColor: palette["primary-tint"] },
        pressed && { opacity: 0.85 },
      ]}
    >
      {item.sender ? (
        <Avatar name={item.sender.name} size="md" />
      ) : (
        <View style={[styles.systemIcon, { backgroundColor: palette["primary-soft"] }]}>
          <BellRing size={18} color={palette["primary-text"]} />
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.rowHead}>
          <Text variant="label" numberOfLines={1} style={styles.sender}>
            {item.sender?.name ?? "YolUp"}
          </Text>
          <Text variant="caption" tone="muted">
            {formatDayTime(item.createdAt)}
          </Text>
        </View>
        <Text variant="caption" tone={item.isRead ? "muted" : "default"} numberOfLines={3}>
          {preview || "Xabar"}
        </Text>
      </View>

      {!item.isRead ? <View style={[styles.dot, { backgroundColor: palette.primary }]} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { flex: 1 },
  row: { flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  systemIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, gap: 4 },
  rowHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  sender: { flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, alignSelf: "center" },
});
