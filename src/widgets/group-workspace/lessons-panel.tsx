import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { LessonRatingsSheet, useCancelLesson, useDeleteLesson, useLessons } from "@/modules/lesson";
import { useLessonPresence } from "@/modules/live";
import { ROUTES } from "@/shared/config";
import type { Lesson } from "@/shared/types";
import { ConfirmDialog, DsText, dsRadius, Icon, useDs } from "@/shared/ui";
import { AddLessonDialog } from "./add-lesson-dialog";
import { CancelLessonDialog } from "./cancel-lesson-dialog";
import { LessonBoard } from "./lesson-board";
import { PanelHeading } from "./panel-heading";

/**
 * O'qituvchining "Darslar" bo'limi — veb `group-workspace.tsx` dagi
 * `LessonsPanel` ning tor ekran varianti: sarlavha va "Dars qo'shish",
 * kunlar bo'yicha darslar (`LessonBoard`), yangi/tahrir oynasi, bekor
 * qilish va o'chirish tasdig'i.
 */
export function LessonsPanel({ courseId, studentCount }: { courseId: string; studentCount: number }) {
  const { t } = useTranslation("group");
  const ds = useDs();
  const router = useRouter();
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Lesson | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Lesson | null>(null);
  const [ratingsTarget, setRatingsTarget] = useState<Lesson | null>(null);
  const lessons = useLessons({ course: courseId, page_size: 100 }, Boolean(courseId));
  const remove = useDeleteLesson();
  const cancelLesson = useCancelLesson();
  const items = lessons.data ?? [];
  const loading = lessons.isLoading;

  const liveLesson = items.find((lesson) => lesson.status === "live") ?? null;
  const presence = useLessonPresence(liveLesson?.id, Boolean(liveLesson));

  function openNew() {
    setEditing(null);
    setDialog(true);
  }

  return (
    <ScrollView style={styles.fill} contentContainerStyle={styles.page}>
      <View style={styles.head}>
        <PanelHeading eyebrow={t("lessons.eyebrow")} title={t("lessons.title")} subtitle={t("lessons.subtitle")} />
        {items.length || loading ? (
          <Pressable
            accessibilityRole="button"
            onPress={openNew}
            style={({ pressed }) => [styles.add, { backgroundColor: pressed ? ds.c.tint : ds.c["brand-subtle"] }]}
          >
            <Icon name="add" size={16} color={ds.c.brand} />
            <DsText v="button" c="brand">
              {t("lessons.addLesson")}
            </DsText>
          </Pressable>
        ) : null}
      </View>

      {loading && !items.length ? (
        <View style={styles.skeletons}>
          <View style={[styles.skeletonLine, { width: 90, backgroundColor: ds.c.skeleton }]} />
          {Array.from({ length: 3 }, (_, index) => (
            <View key={index} style={[styles.skeletonCard, { backgroundColor: ds.c.surface }]}>
              <View style={styles.skeletonHead}>
                <View style={[styles.skeletonBlock, { backgroundColor: ds.c.skeleton }]} />
                <View style={styles.skeletonLines}>
                  <View style={[styles.skeletonLine, { width: 90, height: 14, backgroundColor: ds.c.skeleton }]} />
                  <View style={[styles.skeletonLine, { width: 170, height: 16, backgroundColor: ds.c.skeleton }]} />
                  <View style={[styles.skeletonLine, { width: 120, backgroundColor: ds.c.skeleton }]} />
                </View>
              </View>
              <View style={styles.skeletonButtons}>
                <View style={[styles.skeletonButton, { backgroundColor: ds.c.skeleton }]} />
                <View style={[styles.skeletonButton, { backgroundColor: ds.c.skeleton }]} />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <LessonBoard
          lessons={items}
          studentCount={studentCount}
          joinedCount={liveLesson ? (liveLesson.joinedCount ?? presence.data?.count ?? null) : null}
          onAdd={openNew}
          onJoin={(lesson) => router.push(ROUTES.live(lesson.id) as never)}
          onEdit={(lesson) => {
            setEditing(lesson);
            setDialog(true);
          }}
          onCancel={setCancelTarget}
          onRecording={(lesson) => router.push(ROUTES.recording(lesson.id) as never)}
          onRatings={setRatingsTarget}
        />
      )}

      <AddLessonDialog
        key={editing?.id ?? "new-lesson"}
        open={dialog}
        onClose={() => {
          setDialog(false);
          setEditing(null);
        }}
        courseId={courseId}
        editing={editing}
        onDelete={editing ? () => setDeleteTarget(editing) : undefined}
      />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        icon="trash"
        title={t("lessons.deleteConfirmTitle", { title: deleteTarget?.title ?? "" })}
        description={t("lessons.deleteDialogDescription", { title: deleteTarget?.title ?? "" })}
        confirmLabel={t("lessons.delete")}
        cancelLabel={t("lessons.cancel")}
        pending={remove.isPending}
        onConfirm={() => deleteTarget && remove.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) })}
      />
      <CancelLessonDialog
        lesson={cancelTarget}
        pending={cancelLesson.isPending}
        onOpenChange={(open) => !open && setCancelTarget(null)}
        onConfirm={(lesson, scope) =>
          cancelLesson.mutate({ id: lesson.id, scope: scope === "following" ? "series" : "one" }, { onSuccess: () => setCancelTarget(null) })
        }
      />
      <LessonRatingsSheet lesson={ratingsTarget} onClose={() => setRatingsTarget(null)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  /* `gap-5 px-4 pt-5 pb-8` */
  page: { gap: 20, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 32 },
  head: { flexDirection: "row", alignItems: "flex-end", gap: 4 },
  /* `h-11 rounded-full bg-brand-subtle px-[15px] gap-1.5` */
  add: { height: 44, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 15, borderRadius: 22 },
  skeletons: { gap: 12 },
  skeletonCard: { gap: 20, padding: 16, borderRadius: dsRadius.xl },
  skeletonHead: { height: 56, flexDirection: "row", alignItems: "flex-start", gap: 12 },
  skeletonBlock: { width: 56, height: 56, borderRadius: 14 },
  skeletonLines: { gap: 10 },
  skeletonLine: { height: 12, borderRadius: 6 },
  skeletonButtons: { flexDirection: "row", gap: 8 },
  skeletonButton: { flex: 1, height: 44, borderRadius: 22 },
});
