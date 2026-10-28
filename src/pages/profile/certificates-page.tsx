import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Linking, Pressable, StyleSheet, View } from "react-native";
import { useAuth, useDeleteCertificate, useUploadCertificate } from "@/modules/auth";
import { pickDocument, toUploadFile, type PickedFile } from "@/shared/lib";
import type { Certificate } from "@/shared/types";
import {
  dsAlpha,
  DsText,
  dsRadius,
  Icon,
  MobileButton,
  MobileEmptyCard,
  MobileFieldLabel,
  MobileInput,
  PopoverMenu,
  PopoverMenuItem,
  Sheet,
  useDs,
  usePopoverAnchor,
} from "@/shared/ui";
import { ProfileSubPage } from "./profile-shell";

const MAX_CERTIFICATE_MB = 10;
const ACCEPT = ["application/pdf", "image/png", "image/jpeg"];

function fileSize(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function formatWhen(value: string, today: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toDateString() === new Date().toDateString() ? today : String(date.getFullYear());
}

/** Sertifikat yuklash — pastki oyna: fayl (tanlangani yoki tanlash maydoni) va nom. */
function CertificateUploadSheet({ open, pending, onOpenChange, onUpload }: { open: boolean; pending: boolean; onOpenChange: (open: boolean) => void; onUpload: (file: PickedFile, title: string) => void }) {
  const { t } = useTranslation("account");
  const ds = useDs();
  const [file, setFile] = useState<PickedFile | null>(null);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const extension = file?.name.split(".").pop()?.toUpperCase() ?? "";

  async function pick() {
    const next = await pickDocument(ACCEPT);
    if (!next) return;
    if (next.size > MAX_CERTIFICATE_MB * 1024 * 1024) {
      setError(t("page.mobile.fileTooBig", { size: MAX_CERTIFICATE_MB }));
      return;
    }
    setError(null);
    setFile(next);
    if (!title) setTitle(next.name.replace(/\.[^.]+$/, ""));
  }

  function close() {
    setFile(null);
    setTitle("");
    setError(null);
    onOpenChange(false);
  }

  return (
    <Sheet
      variant="app"
      open={open}
      onClose={close}
      title={t("page.uploadCertificate")}
      description={t("page.mobile.uploadHint")}
      footer={
        <>
          <MobileButton variant="secondary" label={t("page.cancel")} onPress={close} />
          <MobileButton icon="upload" label={t("page.mobile.upload")} disabled={pending || !file} onPress={() => file && onUpload(file, title.trim() || file.name)} />
        </>
      }
    >
      <View style={styles.form}>
        <MobileFieldLabel gap={7} label={t("page.mobile.file")}>
          {file ? (
            <View style={[styles.picked, { backgroundColor: ds.c.subtle }]}>
              <View style={[styles.fileIcon, { backgroundColor: ds.c["danger-bg"] }]}>
                <Icon name="description-fill" size={20} color={ds.c["error-text"]} />
              </View>
              <View style={styles.grow}>
                <DsText v="title-sm" numberOfLines={1}>
                  {file.name}
                </DsText>
                <DsText v="caption" w="400" c="ink-secondary" numberOfLines={1}>
                  {t("page.mobile.fileMeta", { type: extension, size: fileSize(file.size) })}
                </DsText>
              </View>
              <Icon name="check-circle" size={22} color={ds.c.success} />
              <Pressable accessibilityRole="button" accessibilityLabel={t("page.mobile.removeFile")} onPress={() => setFile(null)} style={styles.remove}>
                <Icon name="close" size={20} color={ds.c["icon-secondary"]} />
              </Pressable>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={() => void pick()}
              style={({ pressed }) => [styles.drop, { borderColor: dsAlpha(ds.c.brand, 0.4), backgroundColor: pressed ? dsAlpha(ds.c["brand-subtle"], 0.5) : ds.c.canvas }]}
            >
              <View style={[styles.dropIcon, { backgroundColor: ds.c["brand-subtle"] }]}>
                <Icon name="upload" size={20} color={ds.c.brand} />
              </View>
              <DsText v="title-sm" style={styles.mt8}>
                {t("page.mobile.pickFile")}
              </DsText>
              <DsText v="caption" w="400" c="ink-secondary" style={styles.mt4}>
                {t("page.mobile.fileTypes", { size: MAX_CERTIFICATE_MB })}
              </DsText>
            </Pressable>
          )}
        </MobileFieldLabel>
        {error ? (
          <DsText v="caption" w="400" c="error-text" style={styles.error}>
            {error}
          </DsText>
        ) : null}
        <MobileFieldLabel gap={7} label={t("page.mobile.certificateName")}>
          <MobileInput value={title} placeholder={t("page.mobile.certificatePlaceholder")} onChangeText={setTitle} />
        </MobileFieldLabel>
      </View>
    </Sheet>
  );
}

function StatusChip({ item }: { item: Certificate }) {
  const { t } = useTranslation("account");
  const ds = useDs();
  return item.verified ? (
    <View style={[styles.chip, { backgroundColor: ds.c["success-bg"] }]}>
      <Icon name="check-circle" size={14} color={ds.c["success-fg"]} />
      <DsText v="caption-strong" c="success-fg">
        {t("page.verified")}
      </DsText>
    </View>
  ) : (
    <View style={[styles.chip, { backgroundColor: ds.c["accent-teal-bg"] }]}>
      <Icon name="schedule" size={14} color={ds.c["accent-teal-fg"]} />
      <DsText v="caption-strong" c="accent-teal-fg">
        {t("page.certificatePending")}
      </DsText>
    </View>
  );
}

/** Sertifikat qatori — bosilganda menyu (faylni ochish, o'chirish). */
function CertificateRow({ item, divider, onRemove }: { item: Certificate; divider: boolean; onRemove: () => void }) {
  const { t } = useTranslation("account");
  const ds = useDs();
  const { anchorRef, rect, open, close } = usePopoverAnchor();
  return (
    <View ref={anchorRef} collapsable={false} style={divider ? { borderTopWidth: 1, borderTopColor: ds.c.line } : undefined}>
      <Pressable accessibilityRole="button" onPress={open} style={({ pressed }) => [styles.row, pressed && { backgroundColor: ds.c.subtle }]}>
        <View style={[styles.rowIcon, { backgroundColor: ds.c["accent-saffron-bg"] }]}>
          <Icon name="star" size={20} color={ds.c["accent-saffron-fg"]} />
        </View>
        <View style={styles.grow}>
          <DsText v="title" numberOfLines={1}>
            {item.title || "—"}
          </DsText>
          <DsText v="body-sm" c="ink-secondary" numberOfLines={1} style={styles.hint}>
            {[item.issuer, formatWhen(item.createdAt, t("page.mobile.today"))].filter(Boolean).join(" · ")}
          </DsText>
        </View>
        <StatusChip item={item} />
      </Pressable>
      <PopoverMenu rect={rect} onClose={close} height={(item.file ? 2 : 1) * 44 + 12}>
        {item.file ? (
          <PopoverMenuItem
            label={t("page.mobile.openFile")}
            onPress={() => {
              close();
              void Linking.openURL(item.file);
            }}
          />
        ) : null}
        <PopoverMenuItem
          danger
          label={t("page.delete")}
          onPress={() => {
            close();
            onRemove();
          }}
        />
      </PopoverMenu>
    </View>
  );
}

/**
 * Sertifikatlar — veb `certificates-page.tsx` (tor ekran): izoh, yuklanganlar
 * ro'yxati (holat belgisi, menyu) yoki bo'sh holat; pastda "Sertifikat
 * yuklash" va yuklash oynasi.
 */
export function CertificatesPage() {
  const { t } = useTranslation("account");
  const ds = useDs();
  const { user } = useAuth();
  const upload = useUploadCertificate();
  const remove = useDeleteCertificate();
  const [sheetOpen, setSheetOpen] = useState(false);
  const items = user?.certificates ?? [];

  return (
    <ProfileSubPage
      title={t("page.certificatesTitle")}
      description={t("page.mobile.certificatesDescription")}
      footer={<MobileButton icon="add" label={t("page.uploadCertificate")} onPress={() => setSheetOpen(true)} />}
    >
      {items.length ? (
        <View style={styles.list}>
          <View style={styles.listHead}>
            <DsText v="title" w="400" style={styles.listLabel}>
              {t("page.mobile.uploadedCount", { count: items.length })}
            </DsText>
            <DsText v="body-xs" w="600" c="brand" accessibilityRole="button" onPress={() => setSheetOpen(true)}>
              + {t("page.uploadCertificate")}
            </DsText>
          </View>
          <View style={[styles.card, { backgroundColor: ds.c.surface }]}>
            {items.map((item, index) => (
              <CertificateRow key={item.id} item={item} divider={index > 0} onRemove={() => remove.mutate(item.id)} />
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.empty}>
          <MobileEmptyCard icon="workspace-premium" title={t("page.mobile.noCertificatesTitle")} description={t("page.mobile.noCertificatesHint")} />
        </View>
      )}

      <CertificateUploadSheet
        open={sheetOpen}
        pending={upload.isPending}
        onOpenChange={setSheetOpen}
        onUpload={(file, title) => upload.mutate({ file: toUploadFile(file), title }, { onSuccess: () => setSheetOpen(false) })}
      />
    </ProfileSubPage>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  mt4: { marginTop: 4 },
  mt8: { marginTop: 8 },
  /* `-mt-1 gap-[15px]` */
  form: { marginTop: -4, gap: 15 },
  picked: { height: 68, flexDirection: "row", alignItems: "center", gap: 12, paddingLeft: 10, paddingRight: 8, borderRadius: dsRadius.lg },
  fileIcon: { width: 40, height: 40, borderRadius: dsRadius.md, alignItems: "center", justifyContent: "center" },
  remove: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  drop: { height: 143, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, borderWidth: 1.5, borderStyle: "dashed", borderRadius: dsRadius.lg },
  dropIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  error: { marginTop: -8 },
  chip: { height: 24, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, borderRadius: 12 },
  list: { marginTop: 7, gap: 12 },
  listHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  listLabel: { lineHeight: 20 },
  card: { overflow: "hidden", paddingVertical: 4, borderRadius: dsRadius.xl },
  row: { minHeight: 68, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  rowIcon: { width: 40, height: 40, borderRadius: dsRadius.md, alignItems: "center", justifyContent: "center" },
  hint: { lineHeight: 22 },
  empty: { marginTop: 6 },
});
