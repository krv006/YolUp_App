import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import {
  FinishLessonSheet,
  LessonRatingsSheet,
  useDeleteLesson,
  useLessons,
} from "@/modules/lesson";
import { LessonCard } from "@/modules/lesson/ui/lesson-card";
import { ROUTES } from "@/shared/config";
import type { Lesson } from "@/shared/types";
import { Button, ConfirmSheet, ScreenEmpty, ScreenLoading, useTheme } from "@/shared/ui";
import { AddLessonSheet } from "./add-lesson-sheet";

/**
 * Guruhning darslari — veb `group-workspace.tsx` ning "Darslar" bo'limi.
 *
 * O'qituvchida: dars yaratish (bitta yoki haftalik jadval), jonli darsni
 * yakunlash va qo'yilgan baholarni ko'rish. O'quvchida: kirish va yozuv.
 */
export function LessonsSection({
  courseId,
  isTeacher = false,
}: {
  courseId: string;
  isTeacher?: boolean;
}) {
  const router = useRouter();
  const { palette } = useTheme();
  const [addOpen, setAddOpen] = useState(false);
  const [finishTarget, setFinishTarget] = useState<Lesson | null>(null);
  const [ratingsTarget, setRatingsTarget] = useState<Lesson | null>(null);
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Lesson | null>(null);
  const lessons = useLessons({ course: courseId, page_size: 100 }, Boolean(courseId));
  const remove = useDeleteLesson();

  if (lessons.isLoading) return <ScreenLoading label="Darslar yuklanmoqda…" />;

  const items = lessons.data ?? [];

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.list}>
        {isTeacher ? (
          <Button
            title="Dars qo'shish"
            variant="secondary"
            icon={<Plus size={16} color={palette["secondary-foreground"]} />}
            onPress={() => setAddOpen(true)}
          />
        ) : null}

        {items.length === 0 ? (
          <ScreenEmpty title="Dars yo'q" description="Bu guruhda hali dars rejalashtirilmagan." />
        ) : (
          items.map((lesson: Lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              onJoin={(item) => router.push(ROUTES.live(item.id))}
              onRecording={(item) => router.push(ROUTES.recording(item.id))}
              onFinish={isTeacher ? setFinishTarget : undefined}
              onRatings={isTeacher ? setRatingsTarget : undefined}
              onEdit={
                isTeacher
                  ? (item) => {
                      setEditing(item);
                      setAddOpen(true);
                    }
                  : undefined
              }
              onDelete={isTeacher ? setDeleteTarget : undefined}
            />
          ))
        )}
      </ScrollView>

      {/*
       * `key` — tahrirdan yaratishga (va aksincha) o'tganda oyna qaytadan
       * quriladi, shuning uchun maydonlar to'g'ri boshlang'ich qiymat oladi.
       * Veb ham `AddLessonDialog` ga aynan shu `key` ni beradi.
       */}
      <AddLessonSheet
        key={editing?.id ?? "new-lesson"}
        open={addOpen}
        onClose={() => {
          setAddOpen(false);
          setEditing(null);
        }}
        courseId={courseId}
        existingLessons={items}
        editing={editing}
      />

      <ConfirmSheet
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Darsni o'chirish"
        description={`"${deleteTarget?.title ?? ""}" qayta tiklanmaydi.`}
        loading={remove.isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          remove.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
        }}
      />
      <FinishLessonSheet
        lesson={finishTarget}
        onClose={() => setFinishTarget(null)}
        onFinished={() => void lessons.refetch()}
      />
      <LessonRatingsSheet lesson={ratingsTarget} onClose={() => setRatingsTarget(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { padding: 16, gap: 12 },
});
