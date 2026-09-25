import { useMemo, useState } from "react";
import { RefreshControl, StyleSheet, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { FileQuestion, History, Plus, Trash2 } from "lucide-react-native";
import { useCourses, useSubjects } from "@/modules/course";
import { useAuth } from "@/modules/auth";
import { ROLES } from "@/shared/constants";
import {
  AddQuizSheet,
  ImportResultSheet,
  useDeleteQuiz,
  usePublishQuiz,
  useQuizzes,
  type ImportedQuiz,
} from "@/modules/quiz";
import { formatDayTime } from "@/shared/lib";
import type { QuizSummary } from "@/shared/types";
import {
  Badge,
  Button,
  ConfirmSheet,
  IconButton,
  radius,
  Screen,
  ScreenEmpty,
  ScreenError,
  ScreenLoading,
  Text,
  toast,
  useTheme,
} from "@/shared/ui";

/**
 * Testlar ro'yxati — veb `student-quizzes-page.tsx` / `teacher-quizzes-page.tsx`
 * ning umumiy mobil varianti.
 *
 * Veb'da test DIALOGDA yechilardi. Mobilda dialog yaramaydi: savollar uzun,
 * klaviatura joy egallaydi va foydalanuvchi tasodifan tashqariga bosib
 * javoblarini yo'qotishi mumkin. Shuning uchun yechish — TO'LIQ EKRAN
 * marshruti (`quizzes/<id>`), orqaga qaytish esa aniq harakat.
 */
export function QuizzesPage({ basePath }: { basePath: string }) {
  const router = useRouter();
  const { palette } = useTheme();
  const { user } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const isTeacher = user?.role === ROLES.TEACHER;
  const quizzes = useQuizzes(null);
  const removeQuiz = useDeleteQuiz();
  const [deleteTarget, setDeleteTarget] = useState<QuizSummary | null>(null);
  const [imported, setImported] = useState<ImportedQuiz | null>(null);
  const publishQuiz = usePublishQuiz();
  const courses = useCourses();
  /*
   * Bu sahifada KURS konteksti yo'q — test FANGA biriktiriladi
   * (veb `teacher-quizzes-page.tsx:227` bilan bir xil).
   */
  const subjects = useSubjects(isTeacher);

  const courseTitleById = useMemo(
    () => new Map((courses.data ?? []).map((course) => [course.id, course.title])),
    [courses.data]
  );

  if (quizzes.isLoading) {
    return (
      <Screen>
        <ScreenLoading label="Testlar yuklanmoqda…" />
      </Screen>
    );
  }

  if (quizzes.isError) {
    return (
      <Screen>
        <ScreenError
          message={quizzes.error?.message ?? "Testlarni yuklab bo'lmadi"}
          onRetry={() => void quizzes.refetch()}
        />
      </Screen>
    );
  }

  const list = quizzes.data ?? [];

  return (
    <Screen padded={false}>
      <View style={[styles.head, { borderBottomColor: palette.border }]}>
        <Text variant="heading">Testlar</Text>
        <Text variant="caption" tone="muted">
          Vaqt chegarasi yo'q — cheklanmagan qayta urinish.
        </Text>
        {isTeacher ? (
          <Button
            title="Test yaratish"
            variant="secondary"
            icon={<Plus size={16} color={palette["secondary-foreground"]} />}
            onPress={() => setCreateOpen(true)}
          />
        ) : null}
      </View>

      {list.length === 0 ? (
        <ScreenEmpty
          title="Hali test yo'q"
          description="O'qituvchi test qo'shganda shu yerda ko'rinadi."
        />
      ) : (
        <FlashList
          data={list}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={quizzes.isRefetching}
              onRefresh={() => void quizzes.refetch()}
              tintColor={palette["muted-foreground"]}
            />
          }
          renderItem={({ item }) => (
            <QuizRow
              quiz={item}
              courseTitle={courseTitleById.get(item.courseId) ?? "Kurs"}
              onOpen={() => router.push(`${basePath}/${item.id}`)}
              onHistory={() => router.push(`${basePath}/${item.id}?tab=history`)}
              onDelete={isTeacher ? () => setDeleteTarget(item) : undefined}
              publishing={publishQuiz.isPending && publishQuiz.variables === item.id}
              onPublish={
                isTeacher && item.status === "draft"
                  ? () =>
                      /*
                       * `usePublishQuiz` da `onError` yo'q (veb bilan
                       * bayt-bayt bir xil). Xato shu yerda ushlanadi.
                       */
                      publishQuiz.mutate(item.id, {
                        onError: (error: Error) => toast.error(error.message),
                      })
                  : undefined
              }
            />
          )}
        />
      )}

      <ConfirmSheet
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Testni o'chirish"
        description={`"${deleteTarget?.title ?? ""}" va uning urinishlari o'chadi.`}
        loading={removeQuiz.isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          removeQuiz.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
        }}
      />

      <AddQuizSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        courses={[]}
        subjects={subjects.data ?? []}
        onImported={setImported}
      />

      <ImportResultSheet result={imported} onClose={() => setImported(null)} />
    </Screen>
  );
}

function QuizRow({
  quiz,
  courseTitle,
  onOpen,
  onHistory,
  onDelete,
  onPublish,
  publishing = false,
}: {
  quiz: QuizSummary;
  courseTitle: string;
  onOpen: () => void;
  onHistory: () => void;
  /** Faqat o'qituvchida — berilmasa tugma chizilmaydi. */
  onDelete?: () => void;
  /** Faqat o'qituvchida va faqat QORALAMA testda. */
  onPublish?: () => void;
  publishing?: boolean;
}) {
  const { palette } = useTheme();
  const overdue = quiz.dueAt ? new Date(quiz.dueAt) < new Date() : false;

  return (
    <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
      <View style={styles.cardHead}>
        <View style={[styles.icon, { backgroundColor: palette["primary-tint"] }]}>
          <FileQuestion size={20} color={palette["primary-text"]} />
        </View>
        <View style={styles.cardBody}>
          <Text variant="label" numberOfLines={2}>
            {quiz.title}
          </Text>
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {courseTitle} · {quiz.questionCount} ta savol
          </Text>
        </View>
        <IconButton accessibilityLabel="Urinishlar tarixi" onPress={onHistory}>
          <History size={18} color={palette["muted-foreground"]} />
        </IconButton>

        {onDelete ? (
          <IconButton accessibilityLabel={`${quiz.title} testini o'chirish`} onPress={onDelete}>
            <Trash2 size={18} color={palette.destructive} />
          </IconButton>
        ) : null}
      </View>

      <View style={styles.cardFoot}>
        {/*
          * Qoralama belgisi MUDDATDAN muhimroq: qoralama test o'quvchilarga
          * umuman ko'rinmaydi, shuning uchun o'qituvchi buni birinchi
          * ko'rishi kerak. Import qilingan testlar aynan shunday keladi.
          */}
        {quiz.status === "draft" ? <Badge label="Qoralama" tone="warning" /> : null}

        {quiz.dueAt ? (
          <Badge
            label={`Muddat: ${formatDayTime(quiz.dueAt)}`}
            tone={overdue ? "danger" : "neutral"}
          />
        ) : (
          <Badge label="Muddat yo'q" tone="neutral" />
        )}

        <Text
          accessibilityRole="button"
          onPress={onPublish ?? onOpen}
          variant="label"
          tone="brand"
          style={styles.solve}
        >
          {onPublish ? (publishing ? "E'lon qilinmoqda…" : "E'lon qilish") : "Yechish"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: {
    gap: 4,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  list: { padding: 16 },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: 14,
    gap: 12,
    marginBottom: 12,
  },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardBody: { flex: 1, gap: 3 },
  icon: { width: 40, height: 40, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
  cardFoot: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  solve: { paddingVertical: 8, paddingHorizontal: 4 },
});
