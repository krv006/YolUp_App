import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Flag } from "lucide-react-native";
import {
  useSpamReport,
  useSpamReportAction,
  useSpamReports,
  type SpamReport,
  type SpamReportAction,
  type SpamReportStatus,
} from "@/modules/conversation";
import { ROUTES } from "@/shared/config";
import {
  Avatar,
  DsText,
  dsRadius,
  MobileButton,
  PortalButton,
  PortalCard,
  PortalHeading,
  portalPage,
  PullRefresh,
  RoleTag,
  Screen,
  Sheet,
  Text,
  toast,
  useDs,
  useLegacyColors,
  useTheme,
  type MobileButtonVariant,
} from "@/shared/ui";

const STATUSES: SpamReportStatus[] = ["open", "resolved", "dismissed"];

function formatDateTime(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Shikoyatlar — veb `admin/reports/admin-reports-page.tsx`: shaxsiy
 * chatlardagi spam va haqorat shikoyatlari holat bo'yicha (yangi,
 * tasdiqlangan, rad etilgan), sahifalab. "Ko'rish" — tafsilot oynasi
 * (suhbatning oxirgi xabarlari, tasdiqlash / rad etish / chatni qayta
 * ochish). `?report=<id>` bilan kelinsa (bildirishnomadan) shikoyat darhol
 * ochiladi; oyna holati `admin-support-page` dagidek URL parametrida.
 */
export function AdminReportsPage() {
  const { t } = useTranslation("admin");
  const router = useRouter();
  const ds = useDs();
  const { palette } = useTheme();
  const colors = useLegacyColors();
  const { report: openId } = useLocalSearchParams<{ report?: string }>();
  const [status, setStatus] = useState<SpamReportStatus>("open");
  const [page, setPage] = useState(1);
  const reports = useSpamReports(status, page);
  const items = reports.data?.items ?? [];
  const totalPages = reports.data?.totalPages ?? 1;

  const open = (id: string | null) => router.setParams({ report: id ?? undefined });

  return (
    <Screen padded={false}>
      <ScrollView
        style={{ backgroundColor: palette.background }}
        contentContainerStyle={portalPage}
        refreshControl={<PullRefresh onRefresh={() => reports.refetch()} />}
      >
        <PortalHeading
          eyebrowIcon={Flag}
          eyebrow={t("reports.eyebrow")}
          title={t("reports.title")}
          description={t("reports.subtitle")}
          actions={
            <PortalButton
              variant="primary"
              size="link"
              icon={ArrowLeft}
              label={t("teachers.backToDashboard")}
              onPress={() =>
                router.canGoBack() ? router.back() : router.replace(ROUTES.admin.dashboard)
              }
            />
          }
        />

        <PortalCard style={styles.panel}>
          {/* `flex flex-wrap gap-2` — `h-10 rounded-full px-4`, faoli `bg-brand`. */}
          <View
            accessibilityRole="tablist"
            accessibilityLabel={t("reports.filterLabel")}
            style={styles.statuses}
          >
            {STATUSES.map((item) => {
              const active = status === item;
              return (
                <Pressable
                  key={item}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  onPress={() => {
                    setStatus(item);
                    setPage(1);
                  }}
                  style={({ pressed }) => [
                    styles.status,
                    { backgroundColor: active ? ds.c.brand : pressed ? ds.c.muted : ds.c.subtle },
                  ]}
                >
                  <DsText v="button" c={active ? "on-action" : "ink"} numberOfLines={1}>
                    {t(`reports.status.${item}`)}
                  </DsText>
                </Pressable>
              );
            })}
          </View>

          {reports.isLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={palette.primary} />
              <Text variant="label" style={{ color: colors.muted }}>
                {t("reports.loading")}
              </Text>
            </View>
          ) : null}

          {/* `.admin-teacher-list` */}
          <View style={styles.list}>
            {items.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.row,
                  index < items.length - 1 && { borderBottomWidth: 1, borderColor: colors.border },
                  item.id === openId && { backgroundColor: palette["primary-tint"] },
                ]}
              >
                <Avatar name={item.reported.name} size="sm" />
                <View style={styles.identity}>
                  <View style={styles.name}>
                    <Text variant="label" numberOfLines={1} style={styles.shrink}>
                      {item.reported.name}
                    </Text>
                    <RoleTag role={item.reported.role} />
                    <View style={[styles.reason, { backgroundColor: ds.c["danger-bg"] }]}>
                      <DsText v="caption-strong" c="danger" numberOfLines={1}>
                        {t(`reports.reasons.${item.reason}`)}
                      </DsText>
                    </View>
                  </View>
                  <Text variant="caption" style={[styles.small, { color: colors.muted }]}>
                    {t("reports.reportedBy", { name: item.reporter.name })} ·{" "}
                    {formatDateTime(item.createdAt)}
                  </Text>
                  {item.comment ? (
                    <Text variant="caption" style={[styles.small, { color: colors.muted }]}>
                      «{item.comment}»
                    </Text>
                  ) : null}
                </View>
                <PortalButton size="sm" label={t("reports.view")} onPress={() => open(item.id)} />
              </View>
            ))}
            {!reports.isLoading && !items.length ? (
              <Text variant="body" style={{ color: colors.muted }}>
                {t(`reports.empty.${status}`)}
              </Text>
            ) : null}
          </View>

          {totalPages > 1 ? (
            <View style={styles.pager}>
              <PortalButton
                size="sm"
                label={t("reports.prev")}
                disabled={page <= 1}
                onPress={() => setPage((value) => value - 1)}
              />
              <Text variant="label" style={{ color: colors.muted }}>
                {page} / {totalPages}
              </Text>
              <PortalButton
                size="sm"
                label={t("reports.next")}
                disabled={page >= totalPages}
                onPress={() => setPage((value) => value + 1)}
              />
            </View>
          ) : null}
        </PortalCard>
      </ScrollView>

      <ReportDetailSheet reportId={openId ?? null} onClose={() => open(null)} />
    </Screen>
  );
}

/**
 * Shikoyat tafsiloti — veb `ReportDetailDialog` (`AppDialog adaptive`):
 * kim, kimga, sabab, izoh, sana, kim ko'rib chiqqani va oxirgi xabarlar.
 * Yangi shikoyatda "Rad etish" va "Tasdiqlash"; chat spam holatida qolgan
 * bo'lsa "Chatni qayta ochish".
 */
function ReportDetailSheet({
  reportId,
  onClose,
}: {
  reportId: string | null;
  onClose: () => void;
}) {
  const { t } = useTranslation("admin");
  // Yopilish animatsiyasida mazmun yo'qolmasligi uchun oxirgi shikoyat ko'rinib turadi.
  const [shownId, setShownId] = useState(reportId);
  if (reportId && reportId !== shownId) setShownId(reportId);
  const detail = useSpamReport(shownId);
  const act = useSpamReportAction();
  const report = detail.data ?? null;

  function run(action: SpamReportAction) {
    if (!report) return;
    act.mutate(
      { id: report.id, action },
      {
        onSuccess: () => {
          toast.success(t(`reports.done.${action}`));
          onClose();
        },
        onError: (error: Error) => toast.error(error.message),
      }
    );
  }

  const actions: Array<{ action: SpamReportAction; tone: MobileButtonVariant }> = !report
    ? []
    : report.status === "open"
      ? [
          { action: "dismiss", tone: "secondary" },
          { action: "resolve", tone: "danger" },
        ]
      : report.roomStatus === "spam"
        ? [{ action: "unblock", tone: "primary" }]
        : [];

  const rows: Array<{ label: string; value: string } | null> = report
    ? [
        {
          label: t("reports.reporter"),
          value: `${report.reporter.name} · @${report.reporter.username}`,
        },
        {
          label: t("reports.reported"),
          value: `${report.reported.name} · @${report.reported.username}`,
        },
        { label: t("reports.reason"), value: t(`reports.reasons.${report.reason}`) },
        report.comment ? { label: t("reports.comment"), value: report.comment } : null,
        { label: t("reports.date"), value: formatDateTime(report.createdAt) },
        report.handledBy
          ? {
              label: t("reports.handledBy"),
              value: `${report.handledBy.name} · ${formatDateTime(report.handledAt)}`,
            }
          : null,
      ]
    : [];

  return (
    <Sheet
      variant="app"
      open={Boolean(reportId)}
      onClose={onClose}
      title={t("reports.detailTitle")}
      description={report ? t(`reports.status.${report.status}`) : ""}
      footer={
        actions.length ? (
          <>
            {actions.map(({ action, tone }) => (
              <MobileButton
                key={action}
                variant={tone}
                label={t(`reports.actions.${action}`)}
                disabled={act.isPending}
                onPress={() => run(action)}
              />
            ))}
          </>
        ) : undefined
      }
    >
      {!report ? (
        <View style={styles.loading}>
          {detail.isError ? null : <ActivityIndicator />}
          <DsText v="body-sm" c="ink-secondary">
            {detail.isError ? detail.error.message : t("reports.loading")}
          </DsText>
        </View>
      ) : (
        <View style={styles.detail}>
          {/* `dl grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-body-sm` */}
          <View style={styles.facts}>
            {rows.map((row) =>
              row ? (
                <View key={row.label} style={styles.fact}>
                  <DsText v="body-sm" c="ink-secondary" style={styles.factLabel}>
                    {row.label}
                  </DsText>
                  <DsText v="body-sm" style={styles.grow}>
                    {row.value}
                  </DsText>
                </View>
              ) : null
            )}
          </View>

          <View style={styles.messagesSection}>
            <DsText v="title-sm">{t("reports.messages")}</DsText>
            <ReportMessages report={report} />
          </View>
        </View>
      )}
    </Sheet>
  );
}

/**
 * Suhbatning oxirgi xabarlari — shikoyat qilingan kishiniki chapda (qizg'ish),
 * shikoyatchiniki o'ngda. Vebda ro'yxat `max-h-72` ichida aylanardi; mobilda
 * oyna o'zi aylanadi (ichma-ich aylanish sudrab yopish bilan to'qnashardi).
 */
function ReportMessages({ report }: { report: SpamReport }) {
  const { t } = useTranslation("admin");
  const ds = useDs();
  if (!report.recentMessages.length) {
    return (
      <DsText v="body-sm" c="ink-secondary">
        {t("reports.noMessages")}
      </DsText>
    );
  }
  return (
    <View style={[styles.messages, { backgroundColor: ds.c.subtle }]}>
      {report.recentMessages.map((message, index) => {
        const fromReported = message.senderId === report.reported.id;
        return (
          <View
            key={`${message.createdAt}-${index}`}
            style={[
              styles.message,
              fromReported
                ? { alignSelf: "flex-start", backgroundColor: ds.c["danger-bg"] }
                : { alignSelf: "flex-end", backgroundColor: ds.c.surface },
            ]}
          >
            <DsText v="caption-strong" c="ink-secondary">
              {fromReported ? report.reported.name : report.reporter.name} ·{" "}
              {formatDateTime(message.createdAt)}
            </DsText>
            <DsText v="body-sm">{message.text || "—"}</DsText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  shrink: { flexShrink: 1 },
  panel: { padding: 20, gap: 14 },
  statuses: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  status: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: dsRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  loading: { alignItems: "center", gap: 10, paddingVertical: 16 },
  list: { gap: 4 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  identity: { flex: 1, minWidth: 0, gap: 2 },
  name: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  /* `rounded-full bg-danger-bg px-2 py-0.5` */
  reason: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: dsRadius.full },
  small: { fontSize: 11, lineHeight: 16.5 },
  /* `flex items-center justify-end gap-2` */
  pager: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 8 },
  detail: { gap: 16 },
  facts: { gap: 8 },
  fact: { flexDirection: "row", gap: 16 },
  factLabel: { width: 120, flexShrink: 0 },
  messagesSection: { gap: 8 },
  /* `flex flex-col gap-2 rounded-xl bg-subtle p-3` */
  messages: { gap: 8, padding: 12, borderRadius: dsRadius.xl },
  /* `max-w-[85%] rounded-xl px-3 py-2 gap-0.5` */
  message: {
    maxWidth: "85%",
    gap: 2,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: dsRadius.xl,
  },
});
