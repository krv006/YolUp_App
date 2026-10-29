import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useIsStudent, useRoleRoutes } from "@/modules/auth";
import { useCourses } from "@/modules/course";
import { materialApi, useDeleteMaterial, useMaterials, useUploadMaterial } from "@/modules/material";
import { downloadBlob, formatFileSize, pickDocument, toUploadFile, type PickedFile } from "@/shared/lib";
import type { Material, MaterialKind } from "@/shared/types";
import {
  bodyFont,
  ConfirmDialog,
  DsGradient,
  DsText,
  dsRadius,
  dsType,
  FileViewer,
  Icon,
  MobileButton,
  MobileEmptyCard,
  MobileFieldLabel,
  MobileInput,
  MobilePageHeader,
  MobilePickerField,
  MobileSegment,
  SearchClear,
  Sheet,
  toast,
  toneColors,
  useDs,
  type IconName,
} from "@/shared/ui";

type KindFilter = "all" | MaterialKind;

const KINDS: KindFilter[] = ["all", "pdf", "doc", "video", "audio", "image", "other"];
const MAX_SIZE = 50 * 1024 * 1024;
/** Veb `ACCEPT` (`.pdf,.doc,…,.zip`) ning MIME ko'rinishi — hujjat tanlagich kengaytma emas, tur bilan ishlaydi. */
const ACCEPT = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.oasis.opendocument.text",
  "text/plain",
  "text/csv",
  "audio/*",
  "video/*",
  "image/*",
  "application/zip",
];

const KIND_LOOK: Record<MaterialKind, { icon: IconName; tone: string }> = {
  pdf: { icon: "description", tone: "bg-accent-red-bg text-accent-red-fg" },
  doc: { icon: "assign", tone: "bg-accent-blue-bg text-accent-blue-fg" },
  video: { icon: "videocam", tone: "bg-accent-violet-bg text-accent-violet-fg" },
  audio: { icon: "mic", tone: "bg-accent-saffron-bg text-accent-saffron-fg" },
  image: { icon: "image", tone: "bg-accent-green-bg text-accent-green-fg" },
  other: { icon: "folder", tone: "bg-subtle text-ink-secondary" },
};

const PREVIEWABLE: MaterialKind[] = ["pdf", "image", "video", "audio"];

function shortDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}`;
}

/**
 * Materiallar — veb `pages/workspace/materials-page.tsx` ning tor ekran
 * varianti: qidiruv, guruh tanlash, tur chiplari va fayllar ro'yxati.
 * O'qituvchi yuklaydi va o'chiradi; PDF, rasm, video va audio ilova ichida
 * ochiladi, qolganlari yuklab olinadi (mobilda — OS ulashish oynasi).
 */
export function MaterialsPage() {
  const { t } = useTranslation("workspace");
  const ds = useDs();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const routes = useRoleRoutes();
  const isStudent = useIsStudent();
  const courses = useCourses();
  const [course, setCourse] = useState("all");
  const [kind, setKind] = useState<KindFilter>("all");
  const [search, setSearch] = useState("");
  const [focused, setFocused] = useState(false);
  const materials = useMaterials({ course: course === "all" ? null : course, kind: kind === "all" ? null : kind, search });
  const remove = useDeleteMaterial();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [viewing, setViewing] = useState<Material | null>(null);
  const [deleting, setDeleting] = useState<Material | null>(null);
  const canManage = !isStudent;
  const items = materials.data ?? [];

  const courseOptions = [{ value: "all", label: t("materials.allGroups") }, ...(courses.data ?? []).map((item) => ({ value: item.id, label: item.title }))];
  const chips = KINDS.map((item) => ({ id: item, label: t(`materials.kinds.${item}`) }));

  async function download(item: Material) {
    try {
      await downloadBlob(await materialApi.download(item.id), item.name || item.title);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("materials.downloadFailed"));
    }
  }

  function open(item: Material) {
    if (PREVIEWABLE.includes(item.kind)) setViewing(item);
    else void download(item);
  }

  return (
    <View style={[styles.fill, { backgroundColor: ds.c.canvas }]}>
      <ScrollView
        style={styles.fill}
        contentContainerStyle={[styles.page, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        <DsGradient name="auth" />
        <MobilePageHeader
          title={t("materials.title")}
          backLabel={t("searchBack")}
          onBack={() => (router.canGoBack() ? router.back() : router.replace(routes.workspace as never))}
          action={
            canManage ? (
              // `size-11 rounded-full bg-brand text-on-action`
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("materials.upload")}
                onPress={() => setUploadOpen(true)}
                style={({ pressed }) => [styles.add, { backgroundColor: pressed ? ds.c["brand-strong"] : ds.c.brand }]}
              >
                <Icon name="add" size={22} color={ds.c["on-action"]} />
              </Pressable>
            ) : undefined
          }
        />

        {/* `h-12 rounded-full border-[1.5px] bg-surface px-4.5 gap-3` */}
        <View style={[styles.search, { backgroundColor: ds.c.surface, borderColor: focused ? ds.c.focus : "transparent" }]}>
          <Icon name="search" size={20} color={ds.c["ink-secondary"]} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t("materials.searchPlaceholder")}
            placeholderTextColor={ds.c["ink-secondary"]}
            accessibilityLabel={t("materials.searchPlaceholder")}
            selectionColor={ds.c.brand}
            autoCorrect={false}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={[styles.input, { color: ds.c.ink, fontFamily: bodyFont(search ? "500" : "400") }]}
          />
          {search ? <SearchClear label={t("materials.cancel")} onPress={() => setSearch("")} /> : null}
        </View>

        {courseOptions.length > 2 ? (
          <MobilePickerField
            type="select"
            value={course}
            display={courseOptions.find((option) => option.value === course)?.label ?? t("materials.allGroups")}
            options={courseOptions}
            ariaLabel={t("materials.group")}
            onChange={setCourse}
          />
        ) : null}

        <MobileSegment scroll="auto" items={chips} value={kind} onChange={setKind} />

        {materials.isLoading ? (
          <View style={styles.list}>
            {Array.from({ length: 4 }, (_, index) => (
              <View key={index} style={[styles.item, styles.itemPadding, { backgroundColor: ds.c.surface }]}>
                <View style={[styles.tile, { backgroundColor: ds.c.skeleton }]} />
                <View style={[styles.grow, styles.skeletonText]}>
                  <View style={[styles.skeletonLine, { width: 192, backgroundColor: ds.c.skeleton }]} />
                  <View style={[styles.skeletonLine, styles.skeletonShort, { backgroundColor: ds.c.skeleton }]} />
                </View>
              </View>
            ))}
          </View>
        ) : items.length ? (
          <View style={styles.list}>
            {items.map((item) => (
              <MaterialRow
                key={item.id}
                item={item}
                showUploader={isStudent}
                canManage={canManage}
                onOpen={() => open(item)}
                onDownload={() => void download(item)}
                onDelete={() => setDeleting(item)}
              />
            ))}
          </View>
        ) : (
          <MobileEmptyCard
            icon="folder"
            title={search || kind !== "all" || course !== "all" ? t("materials.emptyFiltered") : t("materials.emptyTitle")}
            description={canManage ? t("materials.emptyHintTeacher") : t("materials.emptyHintStudent")}
          />
        )}
      </ScrollView>

      {canManage ? (
        <UploadMaterialSheet
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          courses={(courses.data ?? []).map((item) => ({ value: item.id, label: item.title }))}
          defaultCourse={course === "all" ? "" : course}
        />
      ) : null}
      <FileViewer
        open={Boolean(viewing)}
        onOpenChange={(next) => !next && setViewing(null)}
        name={viewing?.name || viewing?.title || ""}
        mimeType={viewing?.mimeType}
        meta={viewing ? [viewing.courseTitle, viewing.size !== null ? formatFileSize(viewing.size) : ""].filter(Boolean).join(" · ") : ""}
        load={(signal) => materialApi.download(viewing?.id ?? "", { signal })}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(next) => !next && setDeleting(null)}
        icon="delete"
        tone="danger"
        title={t("materials.deleteTitle")}
        description={deleting?.title ?? ""}
        confirmLabel={t("materials.delete")}
        cancelLabel={t("materials.cancel")}
        pending={remove.isPending}
        onConfirm={() => {
          if (!deleting) return;
          remove.mutate(deleting.id, {
            onSuccess: () => toast.success(t("materials.deleted")),
            onError: (error: Error) => toast.error(error.message),
          });
          setDeleting(null);
        }}
      />
    </View>
  );
}

function MaterialRow({
  item,
  showUploader,
  canManage,
  onOpen,
  onDownload,
  onDelete,
}: {
  item: Material;
  showUploader: boolean;
  canManage: boolean;
  onOpen: () => void;
  onDownload: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation("workspace");
  const ds = useDs();
  const look = KIND_LOOK[item.kind];
  const colors = toneColors(look.tone, ds);
  return (
    // `flex items-center gap-3 rounded-2xl bg-surface p-3 pr-2`
    <View style={[styles.item, styles.itemRow, { backgroundColor: ds.c.surface }]}>
      <Pressable accessibilityRole="button" onPress={onOpen} style={styles.open}>
        <View style={[styles.tile, { backgroundColor: colors.bg }]}>
          <Icon name={look.icon} size={22} color={colors.fg ?? ds.c.ink} />
        </View>
        <View style={styles.grow}>
          <DsText v="title" numberOfLines={1}>
            {item.title}
          </DsText>
          <DsText v="body-xs" c="ink-secondary" numberOfLines={1}>
            {[item.courseTitle, item.size !== null ? formatFileSize(item.size) : "", shortDate(item.createdAt), showUploader ? item.uploadedBy?.name : ""]
              .filter(Boolean)
              .join(" · ")}
          </DsText>
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("materials.download")}
        onPress={onDownload}
        style={({ pressed }) => [styles.iconButton, pressed && { backgroundColor: ds.c.subtle }]}
      >
        <Icon name="download" size={20} color={ds.c["ink-secondary"]} />
      </Pressable>
      {canManage ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("materials.delete")}
          onPress={onDelete}
          style={({ pressed }) => [styles.iconButton, pressed && { backgroundColor: ds.c["danger-bg"] }]}
        >
          {({ pressed }) => <Icon name="delete" size={20} color={pressed ? ds.c["error-text"] : ds.c["ink-secondary"]} />}
        </Pressable>
      ) : null}
    </View>
  );
}

/** Material yuklash — veb `UploadMaterialDialog` (`AppDialog adaptive`) ning pastki oyna varianti. */
function UploadMaterialSheet({
  open,
  onOpenChange,
  courses,
  defaultCourse,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses: Array<{ value: string; label: string }>;
  defaultCourse: string;
}) {
  const { t } = useTranslation("workspace");
  const ds = useDs();
  const upload = useUploadMaterial();
  const [course, setCourse] = useState(defaultCourse || courses[0]?.value || "");
  const [file, setFile] = useState<PickedFile | null>(null);
  const [title, setTitle] = useState("");
  const [syncedOpen, setSyncedOpen] = useState(open);
  if (syncedOpen !== open) {
    setSyncedOpen(open);
    if (open) {
      setCourse(defaultCourse || courses[0]?.value || "");
      setFile(null);
      setTitle("");
    }
  }

  async function pick() {
    const next = await pickDocument(ACCEPT);
    if (!next) return;
    if (next.size > MAX_SIZE) {
      toast.error(t("materials.tooLarge"));
      return;
    }
    setFile(next);
    if (!title.trim()) setTitle(next.name.replace(/\.[^.]+$/, ""));
  }

  function submit() {
    if (!file || !course) return;
    upload.mutate(
      { course, file: toUploadFile(file), title },
      {
        onSuccess: () => {
          toast.success(t("materials.uploaded"));
          onOpenChange(false);
        },
        onError: (error: Error) => toast.error(error.message),
      }
    );
  }

  return (
    <Sheet
      variant="app"
      open={open}
      onClose={() => onOpenChange(false)}
      title={t("materials.uploadTitle")}
      description={t("materials.uploadHint")}
      footer={
        <>
          <MobileButton variant="secondary" label={t("materials.cancel")} onPress={() => onOpenChange(false)} />
          <MobileButton
            label={upload.isPending ? t("materials.uploading") : t("materials.upload")}
            disabled={!file || !course || upload.isPending}
            onPress={submit}
          />
        </>
      }
    >
      <View style={styles.form}>
        <MobileFieldLabel label={t("materials.group")}>
          <MobilePickerField
            type="select"
            value={course}
            display={courses.find((option) => option.value === course)?.label ?? ""}
            placeholder={!course}
            options={courses}
            ariaLabel={t("materials.group")}
            onChange={setCourse}
          />
        </MobileFieldLabel>
        {/* `min-h-24 rounded-xl border border-dashed border-line-strong bg-subtle` */}
        <Pressable
          accessibilityRole="button"
          onPress={() => void pick()}
          style={({ pressed }) => [styles.drop, { borderColor: pressed ? ds.c.brand : ds.c["line-strong"], backgroundColor: ds.c.subtle }]}
        >
          <Icon name={file ? "check-circle" : "upload"} size={24} color={file ? ds.c["success-fg"] : ds.c.brand} />
          <DsText v="label-strong" numberOfLines={1}>
            {file ? file.name : t("materials.pickFile")}
          </DsText>
          <DsText v="caption" c="ink-tertiary">
            {file ? formatFileSize(file.size) : t("materials.fileHint")}
          </DsText>
        </Pressable>
        <MobileFieldLabel label={t("materials.name")}>
          <MobileInput value={title} maxLength={200} placeholder={t("materials.namePlaceholder")} onChangeText={setTitle} />
        </MobileFieldLabel>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  /* `gap-4 px-4 pt-5` — ichki sahifada suzuvchi panel yo'q, shuning uchun `pb-32` o'rniga xavfsiz hudud */
  page: { paddingHorizontal: 16, gap: 16 },
  add: { width: 44, height: 44, borderRadius: dsRadius.full, alignItems: "center", justifyContent: "center" },
  search: { height: 48, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, borderWidth: 1.5, borderRadius: dsRadius.full },
  input: { flex: 1, minWidth: 0, height: "100%", paddingVertical: 0, fontSize: dsType.body.fontSize },
  list: { gap: 8 },
  item: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: dsRadius["2xl"] },
  itemPadding: { padding: 16 },
  itemRow: { padding: 12, paddingRight: 8 },
  open: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 12 },
  tile: { width: 44, height: 44, flexShrink: 0, borderRadius: dsRadius.xl, alignItems: "center", justifyContent: "center" },
  grow: { flex: 1, minWidth: 0 },
  skeletonText: { gap: 8 },
  skeletonLine: { height: 14, maxWidth: "100%", borderRadius: dsRadius.full },
  skeletonShort: { width: 128, height: 12 },
  iconButton: { width: 40, height: 40, flexShrink: 0, borderRadius: dsRadius.full, alignItems: "center", justifyContent: "center" },
  form: { gap: 16 },
  drop: { minHeight: 96, alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 16, borderWidth: 1, borderStyle: "dashed", borderRadius: dsRadius.xl },
});
