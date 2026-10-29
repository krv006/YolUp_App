import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Award, ExternalLink } from "lucide-react-native";
import { useAdminCertificates, useRejectCertificate, useVerifyCertificate } from "@/modules/auth";
import { ROUTES } from "@/shared/config";
import type { AdminCertificate, CertificateStatus } from "@/shared/types";
import {
  Avatar,
  MobileButton,
  MobileInput,
  PortalButton,
  PortalCard,
  PortalHeading,
  portalPage,
  PortalSectionHead,
  PullRefresh,
  Screen,
  SelectField,
  Sheet,
  Text,
  toast,
  useLegacyColors,
  useTheme,
} from "@/shared/ui";

const STATUSES: CertificateStatus[] = ["pending", "verified", "rejected"];

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}`;
}

/**
 * Sertifikatlar — veb `admin/certificates/admin-certificates-page.tsx`:
 * holat bo'yicha ro'yxat, faylni ochish, tasdiqlash yoki sababi bilan rad
 * etish. `?certificate=<id>` bilan kelinsa (bildirishnomadan) o'sha qatorga
 * aylanadi.
 */
export function AdminCertificatesPage() {
  const { t } = useTranslation("admin");
  const router = useRouter();
  const { palette } = useTheme();
  const colors = useLegacyColors();
  const { certificate: highlightId } = useLocalSearchParams<{ certificate?: string }>();
  const [status, setStatus] = useState<CertificateStatus>("pending");
  const certificates = useAdminCertificates(status);
  const verify = useVerifyCertificate();
  const reject = useRejectCertificate();
  const [rejecting, setRejecting] = useState<AdminCertificate | null>(null);
  const [reason, setReason] = useState("");
  const items = certificates.data ?? [];

  // Vebdagi `scrollIntoView({ block: "center" })`.
  const scrollRef = useRef<ScrollView>(null);
  const [listY, setListY] = useState(0);
  const [rowY, setRowY] = useState<number | null>(null);
  useEffect(() => {
    if (rowY == null) return;
    scrollRef.current?.scrollTo({ y: Math.max(listY + rowY - 200, 0), animated: true });
  }, [listY, rowY]);

  function confirmReject() {
    if (!rejecting || !reason.trim()) return;
    reject.mutate(
      { id: rejecting.id, reason: reason.trim() },
      {
        onSuccess: () => {
          toast.success(t("certificates.rejectedToast"));
          setRejecting(null);
          setReason("");
        },
      }
    );
  }

  return (
    <Screen padded={false}>
      <ScrollView
        ref={scrollRef}
        style={{ backgroundColor: palette.background }}
        contentContainerStyle={portalPage}
        refreshControl={<PullRefresh onRefresh={() => certificates.refetch()} />}
      >
        <PortalHeading
          eyebrowIcon={Award}
          eyebrow={t("certificates.eyebrow")}
          title={t("certificates.title")}
          description={t("certificates.subtitle")}
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
          <PortalSectionHead eyebrowIcon={Award} eyebrow={t(`certificates.status.${status}`)} title={t("certificates.listTitle")} />
          <SelectField
            hideLabel
            label={t("certificates.filterLabel")}
            icon={<Award size={17} color={colors.muted} />}
            value={status}
            onChange={(value) => setStatus(value as CertificateStatus)}
            options={STATUSES.map((item) => ({ value: item, label: t(`certificates.status.${item}`) }))}
          />

          {certificates.isLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={palette.primary} />
              <Text variant="label" style={{ color: colors.muted }}>
                {t("certificates.loading")}
              </Text>
            </View>
          ) : null}

          <View style={styles.list} onLayout={(event) => setListY(event.nativeEvent.layout.y)}>
            {items.map((item, index) => (
              <View
                key={item.id}
                onLayout={item.id === highlightId ? (event) => setRowY(event.nativeEvent.layout.y) : undefined}
                style={[
                  styles.row,
                  index < items.length - 1 && { borderBottomWidth: 1, borderColor: colors.border },
                  item.id === highlightId && { backgroundColor: palette["primary-tint"] },
                ]}
              >
                <View style={styles.head}>
                  <Avatar name={item.owner?.name ?? item.title} src={item.owner?.avatarUrl ?? undefined} size="sm" />
                  <View style={styles.identity}>
                    <Text variant="label" numberOfLines={1}>
                      {item.title || "—"}
                    </Text>
                    <Text variant="caption" numberOfLines={2} style={[styles.small, { color: colors.muted }]}>
                      {[
                        item.owner ? `${item.owner.name}${item.owner.username ? ` · @${item.owner.username}` : ""}` : "",
                        item.issuer,
                        item.issuedYear ? String(item.issuedYear) : "",
                        formatDate(item.createdAt),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </Text>
                    {item.status === "rejected" && item.rejectReason ? (
                      <Text variant="caption" style={[styles.small, { color: colors.muted }]}>
                        {t("certificates.reason", { reason: item.rejectReason })}
                      </Text>
                    ) : null}
                  </View>
                  {item.file ? (
                    <Pressable
                      accessibilityRole="link"
                      accessibilityLabel={t("certificates.openFile")}
                      onPress={() => void Linking.openURL(item.file)}
                      style={({ pressed }) => [
                        styles.iconButton,
                        { borderColor: colors.border, backgroundColor: pressed ? palette["surface-subtle"] : palette.surface },
                      ]}
                    >
                      <ExternalLink size={16} color={colors.foreground} />
                    </Pressable>
                  ) : null}
                </View>
                {/* Tor ekranda tugmalar qator ostida (vebda qator oxirida). */}
                {item.status === "pending" ? (
                  <View style={styles.actions}>
                    <PortalButton
                      size="sm"
                      label={t("certificates.reject")}
                      onPress={() => {
                        setReason("");
                        setRejecting(item);
                      }}
                    />
                    <PortalButton
                      size="sm"
                      variant="primary"
                      label={t("certificates.verify")}
                      loading={verify.isPending && verify.variables === item.id}
                      onPress={() => verify.mutate(item.id, { onSuccess: () => toast.success(t("certificates.verifiedToast")) })}
                    />
                  </View>
                ) : null}
              </View>
            ))}
            {!certificates.isLoading && !items.length ? (
              <Text variant="body" style={{ color: colors.muted }}>
                {t(`certificates.empty.${status}`)}
              </Text>
            ) : null}
          </View>
        </PortalCard>
      </ScrollView>

      <Sheet
        variant="app"
        open={Boolean(rejecting)}
        onClose={() => setRejecting(null)}
        title={t("certificates.rejectTitle")}
        description={rejecting?.title ?? ""}
        footer={
          <>
            <MobileButton variant="secondary" label={t("certificates.cancel")} onPress={() => setRejecting(null)} />
            <MobileButton variant="danger" label={t("certificates.reject")} disabled={!reason.trim() || reject.isPending} onPress={confirmReject} />
          </>
        }
      >
        <View style={styles.reasonField}>
          <Text variant="label">{t("certificates.reasonLabel")}</Text>
          <MobileInput multiline multilineHeight={96} autoFocus value={reason} placeholder={t("certificates.reasonPlaceholder")} onChangeText={setReason} />
        </View>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  panel: { padding: 20, gap: 14 },
  loading: { alignItems: "center", gap: 10, paddingVertical: 16 },
  list: { gap: 4 },
  row: { gap: 10, paddingVertical: 12, paddingHorizontal: 4, borderRadius: 8 },
  head: { flexDirection: "row", alignItems: "center", gap: 12 },
  identity: { flex: 1, minWidth: 0, gap: 2 },
  small: { fontSize: 11, lineHeight: 16.5 },
  /* `.icon-button` — 36x36, radius 10 */
  iconButton: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderWidth: 1, borderRadius: 10 },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  reasonField: { gap: 8 },
});
