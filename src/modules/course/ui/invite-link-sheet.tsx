import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Share, StyleSheet, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { DsText, dsRadius, Icon, MobileButton, MobileFieldLabel, MobilePickerField, Sheet, Switch, toast, useDs } from "@/shared/ui";
import { useCreateInviteLink, useDeleteInviteLink, useInviteLink } from "../model/course.queries";

export interface InviteLinkSheetProps {
  courseId: string | null;
  open: boolean;
  onClose: () => void;
}

const EXPIRY_DAYS = ["7", "30", "90", "365"];

/**
 * Guruhga taklif havolasi — veb `invite-link-dialog.tsx` (`AppDialog
 * variant="adaptive"`, tor ekranda pastki oyna).
 *
 * Havola yo'q bo'lsa: muddat va "tasdiqlash bilan" tanlovi, pastda "Havola
 * yaratish". Bor bo'lsa: havola va "Nusxalash", o'sha sozlamalar, "Yangi
 * havola" (ikki bosqichli — eski havola ishlamay qoladi) va "Bekor qilish",
 * pastda "Havolani ulashish" (tizimning ulashish oynasi).
 */
export function InviteLinkSheet({ courseId, open, onClose }: InviteLinkSheetProps) {
  const { t } = useTranslation("group");
  const ds = useDs();
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

  async function share() {
    if (!current) return;
    try {
      await Share.share({ title: t("invite.title"), message: current.url });
    } catch {
      await copy();
    }
  }

  const settings = (
    <>
      <MobileFieldLabel label={t("invite.expiryLabel")}>
        <MobilePickerField
          type="select"
          value={expiresInDays}
          display={expiryOptions.find((option) => option.value === expiresInDays)?.label ?? ""}
          options={expiryOptions}
          ariaLabel={t("invite.expiryLabel")}
          onChange={setExpiresInDays}
        />
      </MobileFieldLabel>

      <View style={styles.approval}>
        {/* `size-9 rounded-md bg-accent-green-bg` */}
        <View style={[styles.approvalIcon, { backgroundColor: ds.c["accent-green-bg"] }]}>
          <Icon name="check-circle" size={18} color={ds.c["accent-green-fg"]} />
        </View>
        <View style={styles.grow}>
          <DsText v="title-sm">{t("invite.approvalLabel")}</DsText>
          <DsText v="body-xs" c="ink-tertiary" numberOfLines={1}>
            {t("invite.approvalHint")}
          </DsText>
        </View>
        <Switch checked={requireApproval} onCheckedChange={setRequireApproval} accessibilityLabel={t("invite.approvalLabel")} />
      </View>
    </>
  );

  return (
    <Sheet
      variant="app"
      open={open}
      onClose={close}
      title={t("invite.title")}
      description={t("invite.description")}
      footer={
        current ? (
          <MobileButton label={t("invite.share")} onPress={() => void share()} />
        ) : (
          <MobileButton label={t("invite.create")} disabled={pending || !courseId} onPress={generate} />
        )
      }
    >
      {link.isLoading ? (
        <View style={[styles.skeleton, { backgroundColor: ds.c.muted }]} />
      ) : current ? (
        <>
          <MobileFieldLabel label={t("invite.linkLabel")}>
            {/* `h-12.5 rounded-md bg-subtle pr-1.5 pl-4 gap-2` */}
            <View style={[styles.linkRow, { backgroundColor: ds.c.subtle }]}>
              <DsText numberOfLines={1} style={styles.grow}>
                {current.url}
              </DsText>
              <Pressable
                accessibilityRole="button"
                onPress={() => void copy()}
                style={({ pressed }) => [styles.copy, { backgroundColor: pressed ? ds.c["brand-strong"] : ds.c.brand }]}
              >
                <DsText v="button" c="ink-inverse">
                  {t("invite.copy")}
                </DsText>
              </Pressable>
            </View>
          </MobileFieldLabel>

          {settings}

          <View style={styles.pair}>
            <MobileButton
              variant="secondary"
              icon="refresh"
              label={confirmRefresh ? t("invite.refreshConfirm") : t("invite.refresh")}
              disabled={pending || !courseId}
              onPress={() => (confirmRefresh ? generate() : setConfirmRefresh(true))}
              style={styles.half}
            />
            <MobileButton
              variant="danger"
              icon="close"
              label={t("invite.cancelLink")}
              disabled={pending || !courseId}
              onPress={() => courseId && remove.mutate(courseId, { onSuccess: () => toast.success(t("invite.revoked")) })}
              style={styles.half}
            />
          </View>

          <DsText v="body-xs" c="ink-tertiary">
            {t("invite.refreshWarning")}
            {current.expiresAt ? ` · ${t("invite.expiresAt", { value: formatDate(current.expiresAt) })}` : ""}
          </DsText>
        </>
      ) : (
        <>
          <DsText v="body-sm" c="ink-secondary">
            {t("invite.empty")}
          </DsText>
          {settings}
        </>
      )}
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
  /* `h-25 rounded-md` */
  skeleton: { height: 100, borderRadius: dsRadius.md },
  linkRow: { height: 50, flexDirection: "row", alignItems: "center", gap: 8, paddingLeft: 16, paddingRight: 6, borderRadius: dsRadius.md },
  /* `h-9 rounded-full px-4` */
  copy: { height: 36, justifyContent: "center", paddingHorizontal: 16, borderRadius: dsRadius.full },
  approval: { flexDirection: "row", alignItems: "center", gap: 12 },
  approvalIcon: { width: 36, height: 36, borderRadius: dsRadius.md, alignItems: "center", justifyContent: "center" },
  /* `grid-cols-2 gap-3` */
  pair: { flexDirection: "row", gap: 12 },
  half: { flex: 1 },
});
