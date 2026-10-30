import { useTranslation } from "react-i18next";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { Globe, MonitorSmartphone, ShieldAlert } from "lucide-react-native";
import { formatDateTime } from "@/shared/lib";
import { Button, Sheet, Text, useTheme } from "@/shared/ui";
import { useLoginHistory } from "../model/auth.queries";

export interface LoginHistorySheetProps {
  open: boolean;
  onClose: () => void;
  studentId?: string | null;
  title?: string;
  description?: string;
}

/**
 * Kirishlar tarixi — veb `login-history-dialog.tsx`: qurilma, IP va vaqt,
 * yangi qurilma/IP belgilari. Matnlar `account:loginHistory.*` (veb 30-okt).
 */
export function LoginHistorySheet({
  open,
  onClose,
  studentId = null,
  title,
  description,
}: LoginHistorySheetProps) {
  const { t } = useTranslation("account");
  const { palette } = useTheme();
  const query = useLoginHistory(studentId, open);
  const records = query.data ?? [];

  return (
    <Sheet open={open} onClose={onClose} title={title ?? t("loginHistory.title")} description={description ?? t("loginHistory.description")}>
      {query.isLoading ? (
        <View style={styles.state}>
          <ActivityIndicator color={palette.primary} />
          <Text variant="label" tone="muted">
            {t("loginHistory.loading")}
          </Text>
        </View>
      ) : null}

      {query.isError ? (
        <View style={styles.state}>
          <Text variant="label">{t("loginHistory.loadError")}</Text>
          <Button title={t("loginHistory.retry")} variant="secondary" fullWidth={false} onPress={() => void query.refetch()} />
        </View>
      ) : null}

      {query.isSuccess && !records.length ? (
        <Text variant="body" tone="muted">
          {t("loginHistory.empty")}
        </Text>
      ) : null}

      {records.length ? (
        // `.login-history` — balandligi 380 bilan cheklangan, ichida aylanadi.
        <ScrollView style={styles.list} contentContainerStyle={styles.listBody} nestedScrollEnabled>
          {records.map((record) => {
            const alert = record.isNewDevice;
            const Icon = record.isNewDevice || record.isNewIp ? ShieldAlert : MonitorSmartphone;
            return (
              <View
                key={record.id}
                style={[
                  styles.row,
                  alert
                    ? { borderColor: palette["destructive-soft-border"], backgroundColor: palette["destructive-soft"] }
                    : { borderColor: palette.border, backgroundColor: palette.surface },
                ]}
              >
                <View
                  style={[styles.icon, { backgroundColor: alert ? palette.surface : palette["primary-tint"] }]}
                >
                  <Icon size={17} color={alert ? palette["destructive-strong"] : palette["primary-text"]} />
                </View>
                <View style={styles.body}>
                  <Text variant="label" numberOfLines={1} style={styles.device}>
                    {record.device}
                  </Text>
                  <View style={styles.meta}>
                    <Globe size={12} color={palette["muted-foreground"]} />
                    <Text variant="caption" tone="muted" numberOfLines={1} style={styles.metaText}>
                      {record.ip} · {formatDateTime(record.at)}
                    </Text>
                  </View>
                </View>
                {record.isNewDevice || record.isNewIp ? (
                  <View style={styles.flags}>
                    {record.isNewDevice ? <Flag label={t("loginHistory.newDevice")} /> : null}
                    {record.isNewIp ? <Flag label={t("loginHistory.newIp")} /> : null}
                  </View>
                ) : null}
              </View>
            );
          })}
        </ScrollView>
      ) : null}
    </Sheet>
  );
}

function Flag({ label }: { label: string }) {
  const { palette } = useTheme();
  return (
    <Text
      variant="caption"
      style={[styles.flag, { color: palette["tone-amber-fg"], backgroundColor: palette["tone-amber-bg"] }]}
    >
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  state: { alignItems: "center", gap: 12, paddingVertical: 20 },
  list: { maxHeight: 380 },
  listBody: { gap: 8 },
  /* `.login-history li` — 11 13, radius 12, ustunlar orasi 11 */
  row: { flexDirection: "row", alignItems: "center", gap: 11, paddingVertical: 11, paddingHorizontal: 13, borderWidth: 1, borderRadius: 12 },
  icon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  body: { flex: 1, minWidth: 0, gap: 3 },
  device: { fontSize: 13 },
  meta: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { flexShrink: 1, fontSize: 11 },
  flags: { alignItems: "flex-end", gap: 4 },
  flag: { overflow: "hidden", paddingVertical: 3, paddingHorizontal: 7, borderRadius: 999, fontSize: 11, fontWeight: "700" },
});
