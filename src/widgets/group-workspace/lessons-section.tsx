import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import {
  FinishLessonSheet,
  LessonCalendar,
  LessonList,
  LessonRatingsSheet,
  LessonViewSwitch,
  RateLessonSheet,
  useDeleteLesson,
  useLessons,
  useLessonView,
} from "@/modules/lesson";
import { ROUTES } from "@/shared/config";
import type { Lesson } from "@/shared/types";
import { ConfirmSheet, radius, Text, useTheme } from "@/shared/ui";
import { AddLessonDialog } from "./add-lesson-dialog";
import { PanelHeading } from "./panel-heading";

/**
 * Guruhning darslari — veb `group-workspace.tsx` dagi `LessonsPanel`
 * (o'qituvchi) va `student-group-workspace.tsx` dagi `StudentLessons`.
 * Ro'yxat yoki kalendar ko'rinishi (`LessonViewSwitch`), kunlarga
 * guruhlangan kartalar.
 */
export function LessonsSection({ courseId, isTeacher = false }: { courseId: string; isTeacher?: boolean }) {
  const { t } = useTranslation("group");
  const { t: ts } = useTranslation("student");
  const { palette } = useTheme();
  const router = useRouter();
  const { view, setView } = useLessonView();
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Lesson | null>(null);
  const [finishTarget, setFinishTarget] = useState<Lesson | null>(null);
  const [ratingsTarget, setRatingsTarget] = useState<Lesson | null>(null);
  const [rateTarget, setRateTarget] = useState<Lesson | null>(null);
  const lessons = useLessons({ course: courseId, page_size: 100 }, Boolean(courseId));
  const remove = useDeleteLesson();
  const items = lessons.data ?? [];

  const actions = isTeacher
    ? {
        onJoin: (lesson: Lesson) => router.push(ROUTES.live(lesson.id)),
        onFinish: setFinishTarget,
        onRatings: setRatingsTarget,
        onDelete: setDeleteTarget,
        onRecording: (lesson: Lesson) => router.push(ROUTES.recording(lesson.id)),
        onEdit: (lesson: Lesson) => {
          setEditing(lesson);
          setAddOpen(true);
        },
      }
    : {
        onJoin: (lesson: Lesson) => router.push(ROUTES.live(lesson.id)),
        onRecording: (lesson: Lesson) => router.push(ROUTES.recording(lesson.id)),
        onRate: setRateTarget,
      };

  return (
    <ScrollView style={{ backgroundColor: palette.background }} contentContainerStyle={styles.page}>
      {isTeacher ? (
        <View style={[styles.top, styles.raised]}>
          <PanelHeading eyebrow={t("lessons.eyebrow")} title={t("lessons.title")} subtitle={t("lessons.subtitle")} />
          <View style={[styles.tools, styles.raised]}>
            <LessonViewSwitch view={view} onChange={setView} />
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setEditing(null);
                setAddOpen(true);
              }}
              style={({ pressed }) => [styles.add, { backgroundColor: pressed ? palette["primary-hover"] : palette.primary }]}
            >
              <Plus size={17} color={palette["primary-foreground"]} />
              <Text variant="label" style={{ color: palette["primary-foreground"] }}>
                {t("lessons.addLesson")}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={[styles.studentHead, styles.raised]}>
          <PanelHeading eyebrow={ts("groupWorkspace.lessons.eyebrow")} title={ts("groupWorkspace.lessons.title")} />
          <LessonViewSwitch view={view} onChange={setView} />
        </View>
      )}

      {lessons.isLoading && !items.length ? (
        <View style={styles.skeletons}>
          {Array.from({ length: 3 }, (_, index) => (
            <View key={index} style={[styles.skeleton, { backgroundColor: palette.muted }]} />
          ))}
        </View>
      ) : view === "calendar" ? (
        <LessonCalendar lessons={items} {...actions} />
      ) : (
        <LessonList lessons={items} {...actions} />
      )}

      {isTeacher ? (
        <>
          {/* `key` — tahrirdan yaratishga o'tganda oyna qaytadan quriladi (veb ham shunday). */}
          <AddLessonDialog
            key={editing?.id ?? "new-lesson"}
            open={addOpen}
            onClose={() => {
              setAddOpen(false);
              setEditing(null);
            }}
            courseId={courseId}
            editing={editing}
            onDelete={editing ? () => setDeleteTarget(editing) : undefined}
          />
          <ConfirmSheet
            open={Boolean(deleteTarget)}
            onClose={() => setDeleteTarget(null)}
            title={t("lessons.deleteConfirmTitle", { title: deleteTarget?.title ?? "" })}
            description={t("lessons.deleteDialogDescription", { title: deleteTarget?.title ?? "" })}
            confirmLabel={t("lessons.delete")}
            cancelLabel={t("lessons.cancel")}
            loading={remove.isPending}
            onConfirm={() => {
              if (!deleteTarget) return;
              remove.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
            }}
          />
          <FinishLessonSheet lesson={finishTarget} onClose={() => setFinishTarget(null)} />
          <LessonRatingsSheet lesson={ratingsTarget} onClose={() => setRatingsTarget(null)} />
        </>
      ) : (
        <RateLessonSheet lesson={rateTarget} onClose={() => setRateTarget(null)} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  /* `gap-5 p-4` */
  page: { gap: 20, padding: 16 },
  raised: { zIndex: 10 },
  top: { gap: 16 },
  tools: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  /* `h-11 rounded-full px-4 gap-1.5` */
  add: { height: 44, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, borderRadius: radius.full },
  studentHead: { gap: 12 },
  skeletons: { gap: 12 },
  skeleton: { height: 128, borderRadius: radius["2xl"] },
});
