import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  BookOpen,
  ChevronDown,
  Download,
  FileQuestion,
  History,
  ListFilter,
  Pencil,
  Send,
  Trash2,
} from "lucide-react-native";
import { useCourses, useSubjects } from "@/modules/course";
import {
  AddQuizDialog,
  AssignQuizSheet,
  QuizAttemptsSheet,
  QuizExportSheet,
  SubjectFilterSheet,
  quizDisplayTitle,
  quizErrorMessage,
  useAssignQuizToCourse,
  useCreateQuiz,
  useDeleteQuiz,
  useExportQuiz,
  usePublishQuiz,
  useQuiz,
  useQuizAttempts,
  useQuizzes,
  useRemoveGroupAudio,
  useUpdateQuiz,
  useUploadGroupAudio,
} from "@/modules/quiz";
import { toIntlLocale } from "@/shared/i18n/intl-locale";
import type { QuizImportWarning, QuizSummary } from "@/shared/types";
import {
  AppBar,
  AppBarAction,
  radius,
  Screen,
  ScreenError,
  ScreenLoading,
  Sheet,
  SheetButton,
  SheetFooter,
  Text,
  useTheme,
} from "@/shared/ui";

/**
 * O'qituvchining testlari — veb `pages/teacher/quizzes/teacher-quizzes-page.tsx`
 * va tepa panel (`conversation-topbar`, Ish maydonining ichki sahifasi) porti.
 *
 * Tuzilish (tor ekran):
 *   tepa panel   ← · "Workspace" · qidiruv · [+] · qo'ng'iroq
 *   izoh         "8 xil savol turi — baholash avtomatik va darhol."
 *   filtr        "Barcha fanlar" (fanlar 1 tadan ko'p bo'lsa)
 *   fanlar       yig'iladigan bo'limlar, ichida test kartalari va amallar
 *   pastda       "Test yaratish" (to'liq kenglikdagi tugma)
 */
export function TeacherQuizzesPage() {
  const { t, i18n } = useTranslation("quiz");
  const { t: tn } = useTranslation("nav");
  const { t: tw } = useTranslation("workspace");
  const { t: tm } = useTranslation("mobile");
  const router = useRouter();
  const { palette } = useTheme();
  const params = useLocalSearchParams<{ quiz?: string }>();
  const highlightId = params.quiz ?? null;

  const courses = useCourses();
  const subjects = useSubjects();
  const quizzes = useQuizzes(null);
  const remove = useDeleteQuiz();
  const assign = useAssignQuizToCourse();
  const exporter = useExportQuiz();

  const [createOpen, setCreateOpen] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [subjectSheet, setSubjectSheet] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<QuizSummary | null>(null);
  const [editTarget, setEditTarget] = useState<QuizSummary | null>(null);
  const [attemptsOf, setAttemptsOf] = useState<QuizSummary | null>(null);
  const [giveTarget, setGiveTarget] = useState<QuizSummary | null>(null);
  const [exportTarget, setExportTarget] = useState<QuizSummary | null>(null);
  const [openOnQuestions, setOpenOnQuestions] = useState(false);
  const [importedWarnings, setImportedWarnings] = useState<QuizImportWarning[]>([]);
  const [publishError, setPublishError] = useState<string | null>(null);
  const create = useCreateQuiz();
  const update = useUpdateQuiz();
  const publish = usePublishQuiz();

  const editDetail = useQuiz(editTarget?.id ?? null);
  const editAttempts = useQuizAttempts(editTarget?.id ?? null, Boolean(editTarget));
  const uploadAudio = useUploadGroupAudio(editTarget?.id ?? "");
  const removeAudio = useRemoveGroupAudio(editTarget?.id ?? "");

  const workspacePath = "/teacher/workspace";

  /** Kartochka bosilganda savollar to'g'ridan-to'g'ri ochiladi (qalamcha avval mavzu/nom oynasini ochadi). */
  function openQuestions(item: QuizSummary) {
    setOpenOnQuestions(true);
    setEditTarget(item);
  }

  function closeEditor() {
    setEditTarget(null);
    setOpenOnQuestions(false);
    setImportedWarnings([]);
    setPublishError(null);
  }

  /*
   * Tizimning "orqaga" tugmasi ham Ish maydoniga qaytaradi — Testlar
   * tab navigatoridagi yashirin ekran, usiz u birinchi tabga o'tib ketardi.
   */
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        router.replace(workspacePath);
        return true;
      });
      return () => subscription.remove();
    }, [router])
  );

  const courseTitleById = useMemo(
    () => new Map((courses.data ?? []).map((course) => [course.id, course.title])),
    [courses.data]
  );
  const subjectOptions = subjects.data ?? [];
  const canCreate = subjectOptions.length > 0;

  const appBar = (
    <AppBar
      title={tn("titles.workspace")}
      back={{ label: tw("searchBack"), onPress: () => router.replace(workspacePath) }}
    >
      <AppBarAction
        name="search"
        label={tw("searchAria")}
        onPress={() => router.push("/teacher/search")}
      />
      <AppBarAction
        name="add"
        variant="primary"
        label={t("teacherPage.createButton")}
        onPress={() => setCreateOpen(true)}
      />
      <AppBarAction
        name="bell"
        label={tm("chats.bildirishnomalar")}
        onPress={() => router.push("/notifications")}
      />
    </AppBar>
  );

  if (quizzes.isLoading) {
    return (
      <Screen padded={false}>
        {appBar}
        <ScreenLoading label={t("teacherPage.loading")} />
      </Screen>
    );
  }

  if (quizzes.isError) {
    return (
      <Screen padded={false}>
        {appBar}
        <ScreenError
          message={quizzes.error?.message ?? t("teacherPage.loadError")}
          onRetry={() => void quizzes.refetch()}
        />
      </Screen>
    );
  }

  const all = quizzes.data ?? [];
  const list = subjectFilter ? all.filter((item) => item.subject === subjectFilter) : all;
  const filterOptions = [
    { value: "", label: t("teacherPage.allSubjects") },
    ...subjectOptions
      .filter((item) => all.some((quiz) => quiz.subject === item.value))
      .map((item) => ({ value: item.value, label: item.label })),
  ];

  const groupMap = new Map<string, { key: string; label: string; items: QuizSummary[] }>();
  for (const item of list) {
    const key = item.subject || "other";
    const label = item.subjectLabel || item.subject || t("teacherPage.courseFallback");
    const group = groupMap.get(key) ?? { key, label, items: [] };
    group.items.push(item);
    groupMap.set(key, group);
  }
  const groups = [...groupMap.values()].sort((a, b) => a.label.localeCompare(b.label, i18n.language));

  const dueFormat = new Intl.DateTimeFormat(toIntlLocale(i18n.language), {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <Screen padded={false}>
      {appBar}

      <ScrollView
        style={{ backgroundColor: palette.background }}
        contentContainerStyle={styles.body}
      >
        <View style={styles.head}>
          <Text variant="label" style={[styles.bodySm, { color: palette["muted-foreground"] }]}>
            {t("teacherPage.subtitle")}
          </Text>
          {filterOptions.length > 1 ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setSubjectSheet(true)}
              style={({ pressed }) => [
                styles.filter,
                { backgroundColor: pressed ? palette.muted : palette["surface-subtle"] },
              ]}
            >
              <ListFilter size={18} color={palette["muted-foreground"]} />
              <Text variant="body" numberOfLines={1} style={[styles.title, styles.grow]}>
                {filterOptions.find((item) => item.value === subjectFilter)?.label ??
                  filterOptions[0]?.label}
              </Text>
              <ChevronDown size={18} color={palette["muted-foreground"]} />
            </Pressable>
          ) : null}
        </View>

        {groups.length ? (
          <View style={styles.groups}>
            {groups.map((group, index) => {
              const isOpen =
                expanded[group.key] ??
                (index === 0 || group.items.some((item) => item.id === highlightId));
              const drafts = group.items.filter((item) => item.status === "draft").length;
              return (
                <View
                  key={group.key}
                  style={[styles.section, { backgroundColor: palette.surface, borderColor: palette.border }]}
                >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ expanded: isOpen }}
                    accessibilityLabel={t("teacherPage.sectionToggleAria", { subject: group.label })}
                    onPress={() => setExpanded((prev) => ({ ...prev, [group.key]: !isOpen }))}
                    style={styles.sectionHead}
                  >
                    <View style={[styles.sectionIcon, { backgroundColor: palette.primary }]}>
                      <BookOpen size={20} color={palette["primary-foreground"]} />
                    </View>
                    <View style={styles.grow}>
                      <Text variant="body" numberOfLines={1} style={styles.title}>
                        {group.label}
                      </Text>
                      <Text variant="caption" numberOfLines={1} style={{ color: palette["subtle-foreground"] }}>
                        {t("teacherPage.sectionCount", { count: group.items.length })}
                        {drafts ? (
                          <Text variant="caption" style={{ color: palette["warning-strong"] }}>
                            {" · "}
                            {t("teacherPage.sectionDrafts", { count: drafts })}
                          </Text>
                        ) : null}
                      </Text>
                    </View>
                    <ChevronDown
                      size={20}
                      color={palette["subtle-foreground"]}
                      style={isOpen ? styles.flipped : undefined}
                    />
                  </Pressable>

                  {isOpen ? (
                    <View style={styles.items}>
                      {group.items.map((item) => (
                        <QuizCard
                          key={item.id}
                          quiz={item}
                          highlighted={item.id === highlightId}
                          meta={[
                            courseTitleById.get(item.courseId) ||
                              item.subjectLabel ||
                              t("teacherPage.courseFallback"),
                            item.dueAt
                              ? t("teacherPage.dueLabel", { date: dueFormat.format(new Date(item.dueAt)) })
                              : t("teacherPage.noDue"),
                            t("teacherPage.questionCount", { count: item.questionCount }),
                          ].join(" · ")}
                          onOpen={() => openQuestions(item)}
                          onGive={item.courseId ? undefined : () => setGiveTarget(item)}
                          onAttempts={() => setAttemptsOf(item)}
                          onExport={() => setExportTarget(item)}
                          onEdit={() => {
                            setOpenOnQuestions(false);
                            setEditTarget(item);
                          }}
                          onDelete={() => setDeleteTarget(item)}
                        />
                      ))}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : (
          <View style={[styles.empty, { borderColor: palette.border }]}>
            <View style={[styles.emptyIcon, { backgroundColor: palette.primary }]}>
              <FileQuestion size={28} color={palette["primary-foreground"]} />
            </View>
            <Text variant="subheading" style={styles.center}>
              {subjectFilter ? t("teacherPage.emptyForSubject") : t("teacherPage.emptyTitle")}
            </Text>
            {subjectFilter ? null : (
              <Text
                variant="label"
                style={[styles.bodySm, styles.center, styles.emptyText, { color: palette["muted-foreground"] }]}
              >
                {t("teacherPage.emptyDescription")}
              </Text>
            )}
            {subjectFilter ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setSubjectFilter("")}
                style={({ pressed }) => [
                  styles.clear,
                  {
                    backgroundColor: pressed ? palette["surface-subtle"] : palette.surface,
                    borderColor: palette.border,
                  },
                ]}
              >
                <Text variant="label">{t("teacherPage.clearFilter")}</Text>
              </Pressable>
            ) : null}
          </View>
        )}

        {canCreate ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setCreateOpen(true)}
            style={({ pressed }) => [
              styles.create,
              { backgroundColor: pressed ? palette["primary-hover"] : palette.primary },
            ]}
          >
            <Text variant="body" style={[styles.title, { color: palette["primary-foreground"] }]}>
              {t("teacherPage.createButton")}
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <SubjectFilterSheet
        open={subjectSheet}
        onClose={() => setSubjectSheet(false)}
        value={subjectFilter}
        options={filterOptions}
        onChange={setSubjectFilter}
      />

      {editTarget && editDetail.data && !editAttempts.isLoading ? (
        <AddQuizDialog
          key={editTarget.id}
          open
          onOpenChange={(next) => {
            if (!next) closeEditor();
          }}
          courses={[]}
          editQuiz={editDetail.data}
          initialWarnings={importedWarnings}
          uploadingAudio={uploadAudio.isPending}
          onUploadAudio={(groupId, file) => uploadAudio.mutate({ groupId, file })}
          onRemoveAudio={(groupId) => removeAudio.mutate(groupId)}
          startOnQuestions={importedWarnings.length > 0 || openOnQuestions}
          questionsLocked={(editAttempts.data ?? []).length > 0}
          saving={update.isPending}
          publishing={publish.isPending}
          publishError={publishError}
          showSchedule
          onCreate={() => undefined}
          onUpdate={(values) =>
            update
              .mutateAsync({ id: editTarget.id, values })
              .then(() => closeEditor())
              .catch((error: unknown) => setPublishError(quizErrorMessage(error)))
          }
          onPublish={() => {
            setPublishError(null);
            publish
              .mutateAsync(editTarget.id)
              .then(() => closeEditor())
              .catch((error: unknown) => setPublishError(quizErrorMessage(error)));
          }}
        />
      ) : null}

      <AddQuizDialog
        open={createOpen}
        onImported={(result) => {
          setImportedWarnings(result.warnings);
          setPublishError(null);
          setEditTarget({ ...result.quiz });
        }}
        onOpenChange={setCreateOpen}
        courses={[]}
        subjects={subjectOptions}
        onCreate={(form) => {
          void create.mutateAsync(form).then(() => setCreateOpen(false));
        }}
      />

      <Sheet
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={t("teacherPage.deleteDialogTitle")}
        description={t("teacherPage.deleteDialogDescription", { title: deleteTarget?.title ?? "" })}
      >
        <SheetFooter>
          <SheetButton title={t("teacherPage.cancel")} onPress={() => setDeleteTarget(null)} />
          <SheetButton
            variant="primary"
            title={t("teacherPage.delete")}
            loading={remove.isPending}
            onPress={() => {
              if (!deleteTarget) return;
              remove.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
            }}
          />
        </SheetFooter>
      </Sheet>

      <AssignQuizSheet
        open={Boolean(giveTarget)}
        onClose={() => setGiveTarget(null)}
        quizId={giveTarget?.id ?? null}
        courses={(courses.data ?? [])
          .slice()
          .sort(
            (a, b) => Number(b.subject === giveTarget?.subject) - Number(a.subject === giveTarget?.subject)
          )
          .map((course) => ({ id: course.id, label: course.title }))}
        pending={assign.isPending}
        onSubmit={(value) => assign.mutateAsync(value).then(() => setGiveTarget(null))}
      />

      <QuizExportSheet
        open={Boolean(exportTarget)}
        onClose={() => setExportTarget(null)}
        title={exportTarget ? quizDisplayTitle(exportTarget) : ""}
        pending={exporter.isPending ? `${exporter.variables?.mode}:${exporter.variables?.type}` : null}
        onExport={(type, mode) =>
          exportTarget &&
          exporter.mutate({ id: exportTarget.id, type, mode, name: quizDisplayTitle(exportTarget) })
        }
      />

      <QuizAttemptsSheet
        quizId={attemptsOf?.id ?? null}
        open={Boolean(attemptsOf)}
        onClose={() => setAttemptsOf(null)}
        title={attemptsOf ? t("teacherPage.attemptsOfTitle", { title: attemptsOf.title }) : undefined}
      />
    </Screen>
  );
}

/**
 * Test kartasi — `rounded-2xl p-4 gap-3 bg-subtle` (ajratilgani
 * `bg-action-subtle`), ostida 2 ustunli amallar to'ri.
 */
function QuizCard({
  quiz,
  highlighted,
  meta,
  onOpen,
  onGive,
  onAttempts,
  onExport,
  onEdit,
  onDelete,
}: {
  quiz: QuizSummary;
  highlighted: boolean;
  meta: string;
  onOpen: () => void;
  /** Faqat guruhsiz testda. */
  onGive?: () => void;
  onAttempts: () => void;
  onExport: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation("quiz");
  const { palette } = useTheme();
  const title = quizDisplayTitle(quiz);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: highlighted ? palette["primary-soft"] : palette["surface-subtle"] },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("teacherPage.openQuestionsAria", { title })}
        onPress={onOpen}
        style={styles.cardHead}
      >
        <View style={[styles.cardIcon, { backgroundColor: palette.primary }]}>
          <FileQuestion size={18} color={palette["primary-foreground"]} />
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardTitle}>
            <Text variant="label">{title}</Text>
            {quiz.status === "draft" ? (
              <View style={[styles.badge, { backgroundColor: palette["warning-soft"] }]}>
                <Text variant="caption" style={[styles.strong, { color: palette["warning-strong"] }]}>
                  {t("teacherPage.draftBadge")}
                </Text>
              </View>
            ) : null}
          </View>
          {quiz.description ? (
            <Text
              variant="label"
              numberOfLines={2}
              style={[styles.bodySm, { color: palette["muted-foreground"] }]}
            >
              {quiz.description}
            </Text>
          ) : null}
          <Text variant="caption" numberOfLines={1} style={{ color: palette["subtle-foreground"] }}>
            {meta}
          </Text>
        </View>
      </Pressable>

      <View style={styles.actions}>
        {onGive ? (
          <CardAction tone="accent" icon={Send} label={t("teacherPage.giveToGroup")} onPress={onGive} />
        ) : null}
        <CardAction icon={History} label={t("teacherPage.attemptsButton")} onPress={onAttempts} />
        <CardAction icon={Download} label={t("teacherPage.exportShort")} onPress={onExport} />
        <View style={styles.editCell}>
          <CardAction icon={Pencil} label={t("teacherPage.editShort")} onPress={onEdit} grow />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("teacherPage.deleteAria")}
            onPress={onDelete}
            style={({ pressed }) => [
              styles.delete,
              { backgroundColor: palette["destructive-soft"], opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Trash2 size={16} color={palette["destructive-strong"]} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/** `h-11 rounded-xl px-3 gap-2 text-label-strong` — to'rda yarim kenglik. */
function CardAction({
  icon: IconComponent,
  label,
  onPress,
  tone = "plain",
  grow = false,
}: {
  icon: typeof Send;
  label: string;
  onPress: () => void;
  tone?: "plain" | "accent";
  grow?: boolean;
}) {
  const { palette } = useTheme();
  const accent = tone === "accent";
  const color = accent ? palette.primary : palette.foreground;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        grow ? styles.editAction : styles.half,
        accent
          ? { backgroundColor: palette["primary-soft"] }
          : {
              backgroundColor: pressed ? palette["surface-subtle"] : palette.surface,
              borderColor: palette.border,
              borderWidth: 1,
            },
      ]}
    >
      <IconComponent size={16} color={color} />
      <Text
        variant="label"
        numberOfLines={grow ? 1 : 2}
        style={[grow ? null : styles.actionLabel, { color }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  center: { textAlign: "center" },
  /* text-title 16/24/600 */
  title: { fontSize: 16, lineHeight: 24, fontWeight: "600" },
  /* text-body-sm 14/20/400 */
  bodySm: { fontWeight: "400" },
  strong: { fontWeight: "600" },
  flipped: { transform: [{ rotate: "180deg" }] },

  /* `flex-col gap-4 bg-canvas p-4` */
  body: { gap: 16, padding: 16 },
  head: { gap: 12 },
  /* `h-12 w-full rounded-2xl bg-subtle px-4 gap-3 text-title` */
  filter: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    borderRadius: radius["2xl"],
  },

  groups: { gap: 12 },
  /* `rounded-2xl border bg-surface p-4 gap-3` */
  section: { gap: 12, padding: 16, borderWidth: 1, borderRadius: radius["2xl"] },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  sectionIcon: { width: 44, height: 44, borderRadius: radius.xl, alignItems: "center", justifyContent: "center" },
  items: { gap: 12 },

  card: { gap: 12, padding: 16, borderRadius: radius["2xl"] },
  cardHead: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  cardIcon: { width: 40, height: 40, borderRadius: radius.xl, alignItems: "center", justifyContent: "center" },
  cardBody: { flex: 1, minWidth: 0, gap: 2 },
  cardTitle: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  badge: { borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 2 },

  /* `grid grid-cols-2 gap-2` */
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  half: { width: "48.5%" },
  action: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: radius.xl,
  },
  actionLabel: { flexShrink: 1, textAlign: "center" },
  /*
   * Vebda "Tahrirlash" tugmasi siqilmaydi (`flex-1`, matn bir qatorda) va
   * yonidagi o'chirish tugmasi katakdan o'ngga chiqib turadi — telefonda
   * aynan shunday ko'rinadi, shuning uchun bu yerda ham siqilmaydi.
   */
  editAction: { flexGrow: 1, flexShrink: 0 },
  editCell: { width: "48.5%", flexDirection: "row", alignItems: "center", gap: 8 },
  delete: { width: 44, height: 44, borderRadius: radius.xl, alignItems: "center", justifyContent: "center" },

  /* Bo'sh holat — `rounded-2xl border border-dashed px-6 py-10 gap-3` */
  empty: {
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 40,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: radius["2xl"],
  },
  emptyIcon: { width: 64, height: 64, borderRadius: radius["2xl"], alignItems: "center", justifyContent: "center" },
  emptyText: { maxWidth: 320 },
  clear: {
    marginTop: 4,
    height: 48,
    justifyContent: "center",
    paddingHorizontal: 20,
    borderWidth: 1,
    borderRadius: radius.full,
  },
  /* `mt-2 h-14 w-full rounded-full bg-action text-title` */
  create: {
    marginTop: 8,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
  },
});
