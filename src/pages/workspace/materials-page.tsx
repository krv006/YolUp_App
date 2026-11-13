import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useIsStudent, useRoleRoutes } from "@/modules/auth";
import {
  materialApi,
  useDeleteMaterial,
  useLessonFolder,
  useMaterialCourses,
  useMaterialLessons,
  useMaterials,
  useUploadMaterial,
} from "@/modules/material";
import { ROUTES } from "@/shared/config";
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
  SearchClear,
  Sheet,
  toast,
  toneColors,
  useDs,
  type IconName,
} from "@/shared/ui";

/** "Umumiy" papka — darsga bog'lanmagan fayllar (`lesson=general`). */
const GENERAL = "general";
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

/** Ko'ruvchida ochiladigan fayl — material yoki dars doskasining PDF'i. */
interface Viewer {
  name: string;
  mimeType?: string;
  meta: string;
  load: (signal: AbortSignal) => Promise<Blob>;
}

function shortDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}`;
}

function dayMonth(value: string): { day: string; month: string } {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { day: "", month: "" };
  return { day: String(date.getDate()).padStart(2, "0"), month: String(date.getMonth() + 1).padStart(2, "0") };
}

/**
 * Materiallar — veb `pages/workspace/materials-page.tsx` ning tor ekran
 * varianti: papkalar Guruh → "Umumiy" va darslar → fayllar. Bosh sahifada
 * qidiruv; dars papkasida darsning video yozuvi (konvertatsiya holati bilan)
 * va doska PDF'i. O'qituvchi guruh va papkani tanlab yuklaydi va o'chiradi,
 * o'quvchi faqat ko'radi. PDF, rasm, video va audio ilova ichida ochiladi,
 * qolganlari yuklab olinadi (mobilda — OS ulashish oynasi).
 *
 * Vebda papka manzili `?course=&lesson=` da; mobilda sahifa holatida —
 * "orqaga" (sarlavha va Android tugmasi) bir papka yuqoriga chiqadi.
 */
export function MaterialsPage() {
  const { t } = useTranslation("workspace");
  const ds = useDs();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const routes = useRoleRoutes();
  const isStudent = useIsStudent();
  const scrollRef = useRef<ScrollView>(null);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [lessonId, setLessonId] = useState<string | null>(null);
  const level = lessonId ? "lesson" : courseId ? "course" : "root";
  const [search, setSearch] = useState("");
  const [focused, setFocused] = useState(false);
  const query = search.trim();
  const canManage = !isStudent;

  const folders = useMaterialCourses(level === "root");
  const searchResults = useMaterials({ search: query }, level === "root" && query.length > 0);
  const lessons = useMaterialLessons(courseId);
  const general = useMaterials({ course: courseId, lesson: GENERAL }, lessonId === GENERAL);
  const lessonFolder = useLessonFolder(lessonId && lessonId !== GENERAL ? lessonId : null);
  const remove = useDeleteMaterial();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [deleting, setDeleting] = useState<Material | null>(null);

  const courseTitle = lessons.data?.course.title ?? "";
  const currentLesson = lessonId && lessonId !== GENERAL ? lessons.data?.lessons.find((item) => item.id === lessonId) : null;
  const lessonTitle = lessonId === GENERAL ? t("materials.general") : lessonFolder.data?.lesson.title || currentLesson?.title || "";
  const title = level === "lesson" ? lessonTitle : level === "course" ? courseTitle : t("materials.title");

  function go(next: { course?: string | null; lesson?: string | null }) {
    setCourseId(next.course ?? null);
    setLessonId(next.course && next.lesson ? next.lesson : null);
  }

  function back() {
    if (level === "lesson") go({ course: courseId });
    else if (level === "course") go({});
    else if (router.canGoBack()) router.back();
    else router.replace(routes.workspace as never);
  }

  // Papka almashganda ro'yxat boshidan ko'rinadi.
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [courseId, lessonId]);

  // Android "orqaga" ichki papkada bir daraja yuqoriga chiqadi (vebda brauzer tarixi).
  useFocusEffect(
    useCallback(() => {
      if (level === "root") return undefined;
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        if (level === "lesson") setLessonId(null);
        else setCourseId(null);
        return true;
      });
      return () => subscription.remove();
    }, [level])
  );

  async function download(item: Material) {
    try {
      await downloadBlob(await materialApi.download(item.id), item.name || item.title);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("materials.downloadFailed"));
    }
  }

  function open(item: Material) {
    if (!PREVIEWABLE.includes(item.kind)) {
      void download(item);
      return;
    }
    setViewer({
      name: item.name || item.title,
      mimeType: item.mimeType,
      meta: [item.courseTitle, item.size !== null ? formatFileSize(item.size) : ""].filter(Boolean).join(" · "),
      load: (signal) => materialApi.download(item.id, { signal }),
    });
  }

  function fileRows(items: Material[], showCourse: boolean) {
    return items.map((item) => (
      <MaterialRow
        key={item.id}
        item={item}
        showCourse={showCourse}
        showUploader={isStudent}
        canManage={canManage}
        onOpen={() => open(item)}
        onDownload={() => void download(item)}
        onDelete={() => setDeleting(item)}
      />
    ));
  }

  const emptyHint = canManage ? t("materials.emptyHintTeacher") : t("materials.emptyHintStudent");
  const folderIcon = <Icon name="folder" size={22} color={ds.c.brand} />;

  let body: ReactNode;
  if (level === "root" && query) {
    const items = searchResults.data ?? [];
    body = searchResults.isLoading ? (
      <RowsSkeleton />
    ) : items.length ? (
      <View style={styles.list}>{fileRows(items, true)}</View>
    ) : (
      <MobileEmptyCard icon="search" title={t("materials.emptyFiltered")} description={t("materials.searchHint")} />
    );
  } else if (level === "root") {
    const items = folders.data ?? [];
    body = folders.isLoading ? (
      <RowsSkeleton />
    ) : items.length ? (
      <View style={styles.list}>
        {items.map((item) => (
          <FolderRow
            key={item.id}
            icon={folderIcon}
            tone="bg-brand-subtle"
            title={item.title}
            meta={t("materials.filesCount", { count: item.fileCount })}
            badge={
              item.kind === "club" ? (
                // `h-5 rounded-full bg-accent-saffron-bg px-2 text-caption-strong`
                <View style={[styles.badge, { backgroundColor: ds.c["accent-saffron-bg"] }]}>
                  <DsText v="caption-strong" c="accent-saffron-fg">
                    {t("materials.club")}
                  </DsText>
                </View>
              ) : null
            }
            onPress={() => go({ course: item.id })}
          />
        ))}
      </View>
    ) : (
      <MobileEmptyCard icon="folder" title={t("materials.noGroups")} description={emptyHint} />
    );
  } else if (level === "course") {
    const data = lessons.data;
    body =
      lessons.isLoading || !data ? (
        <RowsSkeleton />
      ) : (
        <View style={styles.list}>
          <FolderRow
            icon={folderIcon}
            tone="bg-brand-subtle"
            title={t("materials.general")}
            meta={t("materials.filesCount", { count: data.generalCount })}
            onPress={() => go({ course: courseId, lesson: GENERAL })}
          />
          {data.lessons.length ? (
            <DsText v="label-strong" c="ink-secondary" style={styles.sectionLabel}>
              {t("materials.lessonsTitle")}
            </DsText>
          ) : null}
          {data.lessons.map((lesson) => {
            const date = dayMonth(lesson.startsAt);
            const meta = [
              t("materials.filesCount", { count: lesson.fileCount }),
              lesson.hasRecording ? t("materials.videoTag") : "",
              lesson.hasBoard ? t("materials.boardTag") : "",
            ]
              .filter(Boolean)
              .join(" · ");
            return (
              <FolderRow
                key={lesson.id}
                icon={
                  // `flex-col items-center leading-none`: kun va oy
                  <View style={styles.dateTile}>
                    <DsText v="title-sm" numeric style={styles.dayText}>
                      {date.day}
                    </DsText>
                    <DsText v="caption" style={styles.monthText}>
                      {date.month}
                    </DsText>
                  </View>
                }
                tone="bg-subtle"
                title={lesson.title}
                meta={meta}
                onPress={() => go({ course: courseId, lesson: lesson.id })}
              />
            );
          })}
          {!data.lessons.length && !data.generalCount ? <MobileEmptyCard icon="folder" title={t("materials.emptyTitle")} description={emptyHint} /> : null}
        </View>
      );
  } else if (lessonId === GENERAL) {
    const items = general.data ?? [];
    body = general.isLoading ? (
      <RowsSkeleton />
    ) : items.length ? (
      <View style={styles.list}>{fileRows(items, false)}</View>
    ) : (
      <MobileEmptyCard icon="folder" title={t("materials.emptyTitle")} description={emptyHint} />
    );
  } else {
    const data = lessonFolder.data;
    const recording = data?.recordingStatus ?? null;
    body =
      lessonFolder.isLoading || !data ? (
        <RowsSkeleton />
      ) : (
        <View style={styles.list}>
          {recording ? (
            <FolderRow
              icon={<Icon name="videocam" size={22} color={ds.c["accent-violet-fg"]} />}
              tone="bg-accent-violet-bg"
              title={t("materials.recording")}
              meta={recording === "converting" ? t("materials.recordingConverting") : t("materials.recordingOpen")}
              onPress={() => router.push(ROUTES.recording(data.lesson.id) as never)}
            />
          ) : null}
          {data.hasBoard ? (
            <FolderRow
              icon={<Icon name="board-pen" size={22} color={ds.c["accent-green-fg"]} />}
              tone="bg-accent-green-bg"
              title={t("materials.board")}
              meta={t("materials.boardHint")}
              onPress={() =>
                setViewer({
                  name: `${data.lesson.title || t("materials.board")}.pdf`,
                  mimeType: "application/pdf",
                  meta: t("materials.board"),
                  load: (signal) => materialApi.boardPdf(data.lesson.id, { signal }),
                })
              }
            />
          ) : null}
          {data.files.length ? fileRows(data.files, false) : null}
          {!recording && !data.hasBoard && !data.files.length ? <MobileEmptyCard icon="folder" title={t("materials.emptyTitle")} description={emptyHint} /> : null}
        </View>
      );
  }

  return (
    <View style={[styles.fill, { backgroundColor: ds.c.canvas }]}>
      <ScrollView
        ref={scrollRef}
        style={styles.fill}
        contentContainerStyle={[styles.page, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        <DsGradient name="auth" />
        <MobilePageHeader
          title={title}
          backLabel={t("searchBack")}
          onBack={back}
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

        {level === "root" ? (
          // `h-12 rounded-full border-[1.5px] bg-surface px-4.5 gap-3`
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
        ) : (
          // `flex flex-wrap items-center gap-1 text-body-sm text-ink-secondary`
          <View accessibilityLabel={t("materials.breadcrumb")} style={styles.breadcrumb}>
            <DsText v="body-sm" c="ink-secondary" accessibilityRole="link" onPress={() => go({})}>
              {t("materials.title")}
            </DsText>
            <Icon name="chevron-right" size={16} color={ds.c["ink-secondary"]} />
            {level === "lesson" ? (
              <>
                <DsText v="body-sm" c="ink-secondary" numberOfLines={1} accessibilityRole="link" onPress={() => go({ course: courseId })} style={styles.crumb}>
                  {courseTitle}
                </DsText>
                <Icon name="chevron-right" size={16} color={ds.c["ink-secondary"]} />
                <DsText v="body-sm" numberOfLines={1} style={styles.crumb}>
                  {lessonTitle}
                </DsText>
              </>
            ) : (
              <DsText v="body-sm" numberOfLines={1} style={styles.crumb}>
                {courseTitle}
              </DsText>
            )}
          </View>
        )}

        {body}
      </ScrollView>

      {canManage ? (
        <UploadMaterialSheet open={uploadOpen} onOpenChange={setUploadOpen} defaultCourse={courseId ?? ""} defaultLesson={lessonId ?? GENERAL} />
      ) : null}
      <FileViewer
        open={Boolean(viewer)}
        onOpenChange={(next) => !next && setViewer(null)}
        name={viewer?.name ?? ""}
        mimeType={viewer?.mimeType}
        meta={viewer?.meta ?? ""}
        load={(signal) => (viewer ? viewer.load(signal) : Promise.reject(new Error("no file")))}
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

/** Yuklanish skeleti — `rounded-2xl bg-surface p-4`, `size-11` plitka va ikki chiziq. */
function RowsSkeleton() {
  const ds = useDs();
  return (
    <View style={styles.list} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
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
  );
}

/** Papka qatori — `rounded-2xl bg-surface p-3`, chapda `size-11` plitka, o'ngda `chevron-right`. */
function FolderRow({
  icon,
  tone,
  title,
  meta,
  badge,
  onPress,
}: {
  icon: ReactNode;
  /** Plitka foni (`bg-*`); ikonka rangi `icon` ning o'zida. */
  tone: string;
  title: string;
  meta: string;
  badge?: ReactNode;
  onPress: () => void;
}) {
  const ds = useDs();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.item, styles.folder, { backgroundColor: pressed ? ds.c.subtle : ds.c.surface }]}
    >
      <View style={[styles.tile, { backgroundColor: toneColors(tone, ds).bg }]}>{icon}</View>
      <View style={styles.grow}>
        <View style={styles.titleRow}>
          <DsText v="title" numberOfLines={1} style={styles.shrink}>
            {title}
          </DsText>
          {badge}
        </View>
        <DsText v="body-xs" c="ink-secondary" numberOfLines={1}>
          {meta}
        </DsText>
      </View>
      <Icon name="chevron-right" size={20} color={ds.c["icon-secondary"]} />
    </Pressable>
  );
}

function MaterialRow({
  item,
  showCourse,
  showUploader,
  canManage,
  onOpen,
  onDownload,
  onDelete,
}: {
  item: Material;
  showCourse: boolean;
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
            {[
              showCourse ? item.courseTitle : "",
              item.size !== null ? formatFileSize(item.size) : "",
              shortDate(item.createdAt),
              showUploader ? item.uploadedBy?.name : "",
            ]
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

/**
 * Material yuklash — veb `UploadMaterialDialog` (`AppDialog adaptive`) ning
 * pastki oyna varianti: guruh, papka ("Umumiy" yoki dars), fayl va nomi.
 * Ochilganda joriy papka tanlangan bo'ladi.
 */
function UploadMaterialSheet({
  open,
  onOpenChange,
  defaultCourse,
  defaultLesson,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCourse: string;
  defaultLesson: string;
}) {
  const { t } = useTranslation("workspace");
  const ds = useDs();
  const upload = useUploadMaterial();
  const folders = useMaterialCourses(open);
  const [course, setCourse] = useState(defaultCourse);
  const [lesson, setLesson] = useState(defaultLesson);
  const [file, setFile] = useState<PickedFile | null>(null);
  const [title, setTitle] = useState("");
  const [syncedOpen, setSyncedOpen] = useState(open);
  if (syncedOpen !== open) {
    setSyncedOpen(open);
    if (open) {
      setCourse(defaultCourse);
      setLesson(defaultLesson);
      setFile(null);
      setTitle("");
    }
  }
  const courseOptions = (folders.data ?? []).map((item) => ({ value: item.id, label: item.title }));
  const activeCourse = course || courseOptions[0]?.value || "";
  const lessons = useMaterialLessons(open ? activeCourse || null : null);
  const lessonOptions = [
    { value: GENERAL, label: t("materials.general") },
    ...(lessons.data?.lessons ?? []).map((item) => ({ value: item.id, label: `${shortDate(item.startsAt)} · ${item.title}` })),
  ];

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
    if (!file || !activeCourse) return;
    upload.mutate(
      { course: activeCourse, lesson: lesson === GENERAL ? null : lesson, file: toUploadFile(file), title },
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
            disabled={!file || !activeCourse || upload.isPending}
            onPress={submit}
          />
        </>
      }
    >
      <View style={styles.form}>
        <MobileFieldLabel label={t("materials.group")}>
          <MobilePickerField
            type="select"
            value={activeCourse}
            display={courseOptions.find((option) => option.value === activeCourse)?.label ?? ""}
            placeholder={!activeCourse}
            options={courseOptions}
            ariaLabel={t("materials.group")}
            onChange={(value) => {
              setCourse(value);
              setLesson(GENERAL);
            }}
          />
        </MobileFieldLabel>
        <MobileFieldLabel label={t("materials.folder")}>
          <MobilePickerField
            type="select"
            value={lesson}
            display={lessonOptions.find((option) => option.value === lesson)?.label ?? t("materials.general")}
            options={lessonOptions}
            ariaLabel={t("materials.folder")}
            onChange={setLesson}
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
  breadcrumb: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 4 },
  crumb: { flexShrink: 1 },
  list: { gap: 8 },
  sectionLabel: { marginTop: 12, paddingHorizontal: 4 },
  item: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: dsRadius["2xl"] },
  itemPadding: { padding: 16 },
  itemRow: { padding: 12, paddingRight: 8 },
  folder: { padding: 12 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, minWidth: 0 },
  shrink: { flexShrink: 1 },
  badge: { height: 20, flexShrink: 0, justifyContent: "center", paddingHorizontal: 8, borderRadius: dsRadius.full },
  dateTile: { alignItems: "center" },
  /* `leading-none` */
  dayText: { lineHeight: dsType["title-sm"].fontSize },
  monthText: { lineHeight: dsType.caption.fontSize },
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
