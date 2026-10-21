import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import {
  Icon,
  radius,
  SelectField,
  Sheet,
  SheetButton,
  SheetFooter,
  Switch,
  Text,
  toast,
  useTheme,
} from "@/shared/ui";
import { useCreateInviteLink, useDeleteInviteLink, useInviteLink } from "../model/course.queries";

export interface InviteLinkSheetProps {
  courseId: string | null;
  open: boolean;
  onClose: () => void;
}

const EXPIRY_DAYS = ["7", "30", "90", "365"];

/**
 * Guruhga taklif havolasi — veb `invite-link-dialog.tsx` porti
 * (`AppDialog` -> `Sheet`).
 *
 * Havola yo'q bo'lsa: muddat va "o'qituvchi tasdiqlaydi" tanlovi bilan
 * yaratiladi. Bor bo'lsa: nusxalash, yangilash (ikki bosqichli — eski
 * havola ishlamay qoladi) va bekor qilish.
 */
export function InviteLinkSheet({ courseId, open, onClose }: InviteLinkSheetProps) {
  const { t } = useTranslation("group");
  const { palette } = useTheme();
  const link = useInviteLink(courseId, open);
  const create = useCreateInviteLink();
  const remove = useDeleteInviteLink();
  const [requireApproval, setRequireApproval] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState("30");
  const [confirmRefresh, setConfirmRefresh] = useState(false);

  const current = link.data ?? null;
  const pending = create.isPending || remove.isPending;

  const expiryOptions = EXPIRY_DAYS.map((value) => ({
    value,
    label: t("invite.expiresInDays", { count: Number(value) }),
  }));

  function close() {
    setConfirmRefresh(false);
    onClose();
  }

  function generate() {
    if (!courseId) return;
    create.mutate(
      { courseId, input: { requireApproval, expiresInDays: Number(expiresInDays) } },
      {
        onSuccess: () => {
          setConfirmRefresh(false);
          toast.success(t("invite.created"));
        },
      }
    );
  }

  async function copy() {
    if (!current) return;
    try {
      await Clipboard.setStringAsync(current.url);
      toast.success(t("invite.copied"));
    } catch {
      toast.error(t("invite.copyFailed"));
    }
  }

  return (
    <Sheet open={open} onClose={close} title={t("invite.title")} description={t("invite.description")}>
      {link.isLoading ? (
        <View style={[styles.skeleton, { backgroundColor: palette.muted }]} />
      ) : current ? (
        <View style={styles.stack}>
          {/* `rounded-2xl border bg-subtle px-4 py-3` */}
          <View style={[styles.linkRow, { borderColor: palette.border, backgroundColor: palette["surface-subtle"] }]}>
            <Text variant="label" numberOfLines={1} style={[styles.grow, styles.regular]}>
              {current.url}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("invite.copy")}
              onPress={() => void copy()}
              style={({ pressed }) => [
                styles.copy,
                { backgroundColor: pressed ? palette.background : palette.surface },
              ]}
            >
              <Icon name="assign" size={17} color={palette.foreground} />
            </Pressable>
          </View>

          <Text variant="caption" style={[styles.note, { color: palette["subtle-foreground"] }]}>
            {current.expiresAt ? t("invite.expiresAt", { value: formatDate(current.expiresAt) }) : t("invite.noExpiry")}
            {current.requireApproval ? ` · ${t("invite.approvalOn")}` : ""}
          </Text>

          {confirmRefresh ? (
            <Text variant="caption" style={[styles.note, { color: palette["destructive-strong"] }]}>
              {t("invite.refreshWarning")}
            </Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={pending || !courseId}
            onPress={() =>
              courseId && remove.mutate(courseId, { onSuccess: () => toast.success(t("invite.revoked")) })
            }
            style={[styles.revoke, (pending || !courseId) && styles.disabled]}
          >
            <Icon name="trash" size={17} color={palette["destructive-strong"]} />
            <Text variant="label" style={{ color: palette["destructive-strong"] }}>
              {t("invite.revoke")}
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.form}>
          <Text variant="label" style={[styles.regular, { color: palette["muted-foreground"] }]}>
            {t("invite.empty")}
          </Text>

          <SelectField
            label={t("invite.expiryLabel")}
            value={expiresInDays}
            onChange={setExpiresInDays}
            options={expiryOptions}
          />

          {/* `rounded-2xl border px-4 py-3 gap-3` */}
          <View style={[styles.approval, { borderColor: palette.border }]}>
            <View style={[styles.approvalIcon, { backgroundColor: palette.primary }]}>
              <Icon name="check-circle" size={17} color={palette["primary-foreground"]} />
            </View>
            <View style={styles.grow}>
              <Text variant="label">{t("invite.approvalLabel")}</Text>
              <Text variant="caption" style={{ color: palette["subtle-foreground"] }}>
                {t("invite.approvalHint")}
              </Text>
            </View>
            <Switch
              checked={requireApproval}
              onCheckedChange={setRequireApproval}
              accessibilityLabel={t("invite.approvalLabel")}
            />
          </View>
        </View>
      )}

      <SheetFooter>
        <SheetButton title={t("invite.close")} onPress={close} />
        {current ? (
          <SheetButton
            variant="primary"
            title={confirmRefresh ? t("invite.refreshConfirm") : t("invite.refresh")}
            disabled={pending}
            onPress={() => (confirmRefresh ? generate() : setConfirmRefresh(true))}
          />
        ) : (
          <SheetButton variant="primary" title={t("invite.create")} disabled={pending || !courseId} onPress={generate} />
        )}
      </SheetFooter>
    </Sheet>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}.${date.getFullYear()}`;
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  regular: { fontWeight: "400" },
  /* `h-24 rounded-2xl` */
  skeleton: { height: 96, borderRadius: radius["2xl"] },
  /* `flex-col gap-3` */
  stack: { gap: 12 },
  /* `flex-col gap-4` */
  form: { gap: 16 },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderRadius: radius["2xl"] },
  /* `size-9 rounded-full` */
  copy: { width: 36, height: 36, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  note: { paddingHorizontal: 4 },
  revoke: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 4 },
  disabled: { opacity: 0.6 },
  approval: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderRadius: radius["2xl"] },
  /* `size-9 rounded-xl` */
  approvalIcon: { width: 36, height: 36, borderRadius: radius.xl, alignItems: "center", justifyContent: "center" },
});
