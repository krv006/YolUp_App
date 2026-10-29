import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, LifeBuoy, MessageSquare } from "lucide-react-native";
import { SupportDialog, useSupportTickets, type SupportTicketStatus } from "@/modules/support";
import { ROUTES } from "@/shared/config";
import {
  Avatar,
  PortalButton,
  PortalCard,
  PortalHeading,
  portalPage,
  PortalSectionHead,
  PullRefresh,
  Screen,
  SelectField,
  Text,
  useLegacyColors,
  useTheme,
} from "@/shared/ui";

type StatusFilter = "all" | SupportTicketStatus;

const STATUSES: StatusFilter[] = ["open", "answered", "closed", "all"];

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()} ${String(
    date.getHours()
  ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

/**
 * Murojaatlar — veb `admin/support/admin-support-page.tsx`: holat bo'yicha
 * ro'yxat, bosilganda yozishma (xodim ko'rinishi). `?ticket=<id>` bilan
 * kelinsa (bildirishnomadan) yozishma darhol ochiladi.
 */
export function AdminSupportPage() {
  const { t } = useTranslation("admin");
  const router = useRouter();
  const { palette } = useTheme();
  const colors = useLegacyColors();
  const { ticket: openId } = useLocalSearchParams<{ ticket?: string }>();
  const [status, setStatus] = useState<StatusFilter>("open");
  const tickets = useSupportTickets({ all: true, status: status === "all" ? null : status });
  const items = tickets.data ?? [];

  const open = (id: string | null) => router.setParams({ ticket: id ?? undefined });

  return (
    <Screen padded={false}>
      <ScrollView
        style={{ backgroundColor: palette.background }}
        contentContainerStyle={portalPage}
        refreshControl={<PullRefresh onRefresh={() => tickets.refetch()} />}
      >
        <PortalHeading
          eyebrowIcon={LifeBuoy}
          eyebrow={t("support.eyebrow")}
          title={t("support.title")}
          description={t("support.subtitle")}
          actions={
            <PortalButton
              variant="primary"
              size="link"
              icon={ArrowLeft}
              label={t("teachers.backToDashboard")}
              onPress={() => (router.canGoBack() ? router.back() : router.replace(ROUTES.admin.dashboard))}
            />
          }
        />

        <PortalCard style={styles.panel}>
          <PortalSectionHead eyebrowIcon={MessageSquare} eyebrow={t(`support.status.${status}`)} title={t("support.listTitle")} />
          <SelectField
            hideLabel
            label={t("support.filterLabel")}
            icon={<MessageSquare size={17} color={colors.muted} />}
            value={status}
            onChange={(value) => setStatus(value as StatusFilter)}
            options={STATUSES.map((item) => ({ value: item, label: t(`support.status.${item}`) }))}
          />

          {tickets.isLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={palette.primary} />
              <Text variant="label" style={{ color: colors.muted }}>
                {t("support.loading")}
              </Text>
            </View>
          ) : null}

          {/* `.admin-teacher-list` */}
          <View style={styles.list}>
            {items.map((item, index) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                onPress={() => open(item.id)}
                style={({ pressed }) => [
                  styles.row,
                  index < items.length - 1 && { borderBottomWidth: 1, borderColor: colors.border },
                  (item.id === openId || pressed) && { backgroundColor: palette["primary-tint"] },
                ]}
              >
                <Avatar name={item.subject} size="sm" />
                <View style={styles.identity}>
                  <Text variant="label" numberOfLines={1}>
                    {item.subject || "—"}
                  </Text>
                  <Text variant="caption" numberOfLines={1} style={[styles.small, { color: colors.muted }]}>
                    {[item.lastMessage, formatDate(item.updatedAt)].filter(Boolean).join(" · ")}
                  </Text>
                </View>
                <Text variant="caption" style={{ color: colors.muted }}>
                  {t(`support.status.${item.status}`)}
                </Text>
              </Pressable>
            ))}
            {!tickets.isLoading && !items.length ? (
              <Text variant="body" style={{ color: colors.muted }}>
                {t("support.empty")}
              </Text>
            ) : null}
          </View>
        </PortalCard>
      </ScrollView>

      <SupportDialog open={Boolean(openId)} onOpenChange={(next) => !next && open(null)} ticketId={openId ?? null} staffView title={t("support.threadTitle")} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  panel: { padding: 20, gap: 14 },
  loading: { alignItems: "center", gap: 10, paddingVertical: 16 },
  list: { gap: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 4, borderRadius: 8 },
  identity: { flex: 1, minWidth: 0, gap: 2 },
  small: { fontSize: 11, lineHeight: 16.5 },
});
