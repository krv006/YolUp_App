import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, RefreshControl, StyleSheet, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useFocusEffect, useRouter } from "expo-router";
import { ArrowLeft, FileQuestion, History, Pencil, Plus, Trash2 } from "lucide-react-native";
import { useCourses, useSubjects } from "@/modules/course";
import { useAuth } from "@/modules/auth";
import { ROLES } from "@/shared/constants";
import {
  AddQuizSheet,
  ImportResultSheet,
  useDeleteQuiz,
  usePublishQuiz,
  useQuiz,
  useQuizAttempts,
  useQuizzes,
  type ImportedQuiz,
  useRemoveGroupAudio,
  useUploadGroupAudio,
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
  /*
   * `basePath` — `/teacher/quizzes` yoki `/student/quizzes`. Ish maydoni
   * shu bo'limning yonida turadi, ya'ni oxirgi segmentni almashtirish
   * yetarli; rolni alohida tekshirish shart emas.
   */
  const workspacePath = basePath.replace(/\/quizzes$/, "/workspace");

  const { t } = useTranslation("mobile");
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

  /*
   * TIZIMNING "orqaga" tugmasi ham Ish maydoniga qaytaradi.
   *
   * Usiz u tab navigatorining standart xatti-harakatini bajarardi —
   * BIRINCHI tabga (Suhbatlar) o'tardi. Ilova yopilmasdi, lekin bitta
   * ekranda ikki xil "orqaga" ikki xil joyga olib borardi.
   *
   * `useFocusEffect` SHART: ishlovchi faqat shu ekran ochiq turganda
   * faol bo'lishi kerak, aks holda u boshqa ekranlarning "orqaga"sini
   * ham o'g'irlardi.
   */
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        router.replace(workspacePath);
        return true; // hodisa shu yerda tugaydi
      });
      return () => subscription.remove();
    }, [router, workspacePath])
  );

  /*
   * TAHRIRLASH — ro'yxatda faqat qisqa ma'lumot bor (`QuizSummary`),
   * tahrirlash uchun esa savollar kerak. Shuning uchun avval batafsil
   * ma'lumot yuklanadi va oyna FAQAT SHUNDAN KEYIN chiziladi
   * (veb `teacher-quizzes-page.tsx:188` ham shunday qiladi).
   *
   * `key={editTarget}` ham shart: oyna maydonlari boshlang'ich qiymatini
   * `useState` dan oladi, u esa faqat mount paytida hisoblanadi.
   */
  const [editTarget, setEditTarget] = useState<string | null>(null);
  const editDetail = useQuiz(editTarget);
  const editAttempts = useQuizAttempts(editTarget);
  const uploadAudio = useUploadGroupAudio(editTarget ?? "");
  const removeAudio = useRemoveGroupAudio(editTarget ?? "");
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
        <ScreenLoading label={t("quizzes.testlar_yuklanmoqda")} />
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
        {/*
          * Orqaga qaytish — ANIQ MANZILGA, `router.back()` bilan EMAS.
          *
          * ┌─ NIMA BUZILGAN EDI ─────────────────────────────────────────┐
          * │ Testlar marshruti tab navigatoridagi yashirin EKRAN         │
          * │ (`href: null`), Ish maydonidan unga o'tish esa stack'ga     │
          * │ yangi qatlam qo'ymaydi — u YONMA-YON ekranga almashish.     │
          * │                                                             │
          * │ Shuning uchun `router.back()` tab navigatoridan butunlay    │
          * │ chiqib ketardi va ILOVA YOPILARDI: foydalanuvchi Ish        │
          * │ maydoniga qaytish o'rniga bosh ekranga tashlanardi.         │
          * │                                                             │
          * │ Ish maydoni — bu sahifaning yagona kirish nuqtasi, shuning  │
          * │ uchun qayerga qaytishni taxmin qilish shart emas.           │
          * └─────────────────────────────────────────────────────────────┘
          */}
        <View style={styles.headTop}>
          <IconButton
            accessibilityLabel={t("shared.orqaga")}
            onPress={() => router.replace(workspacePath)}
          >
            <ArrowLeft size={20} color={palette["muted-foreground"]} />
          </IconButton>
          <Text variant="heading">Testlar</Text>
        </View>
        <Text variant="caption" tone="muted">
          {t("quizzes.vaqt_chegarasi_yoq_cheklanmagan_qayta_urinis")}
        </Text>
        {isTeacher ? (
          <Button
            title={t("quizzes.test_yaratish")}
            variant="secondary"
            icon={<Plus size={16} color={palette["secondary-foreground"]} />}
            onPress={() => setCreateOpen(true)}
          />
        ) : null}
      </View>

      {list.length === 0 ? (
        <ScreenEmpty
          title={t("quizzes.hali_test_yoq")}
          description={t("quizzes.oqituvchi_test_qoshganda_shu_yerda_korinadi")}
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
              onEdit={isTeacher ? () => setEditTarget(item.id) : undefined}
              loadingEdit={editTarget === item.id}
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
        title={t("quizzes.testni_ochirish")}
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

      <ImportResultSheet
        result={imported}
        onClose={() => setImported(null)}
        onEdit={(quizId) => {
          setImported(null);
          setEditTarget(quizId);
        }}
      />

      {editTarget && editDetail.data && !editAttempts.isLoading ? (
        <AddQuizSheet
          key={editTarget}
          open
          onClose={() => setEditTarget(null)}
          courses={[]}
          editQuiz={editDetail.data}
          questionsLocked={(editAttempts.data ?? []).length > 0}
          uploadingAudio={uploadAudio.isPending}
          onUploadAudio={(groupId, file) => uploadAudio.mutate({ groupId, file })}
          onRemoveAudio={(groupId) => removeAudio.mutate(groupId)}
        />
      ) : null}
    </Screen>
  );
}

function QuizRow({
  quiz,
  courseTitle,
  onOpen,
  onHistory,
  onDelete,
  onEdit,
  loadingEdit = false,
  onPublish,
  publishing = false,
}: {
  quiz: QuizSummary;
  courseTitle: string;
  onOpen: () => void;
  onHistory: () => void;
  /** Faqat o'qituvchida — berilmasa tugma chizilmaydi. */
  onDelete?: () => void;
  /** Faqat o'qituvchida. */
  onEdit?: () => void;
  /** Batafsil ma'lumot yuklanmoqda — tugma ikki marta bosilmasin. */
  loadingEdit?: boolean;
  /** Faqat o'qituvchida va faqat QORALAMA testda. */
  onPublish?: () => void;
  publishing?: boolean;
}) {
  const { t } = useTranslation("mobile");
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
        <IconButton accessibilityLabel={t("quizzes.urinishlar_tarixi")} onPress={onHistory}>
          <History size={18} color={palette["muted-foreground"]} />
        </IconButton>

        {onEdit ? (
          <IconButton
            accessibilityLabel={`${quiz.title} testini tahrirlash`}
            disabled={loadingEdit}
            onPress={onEdit}
          >
            <Pencil size={18} color={palette["muted-foreground"]} />
          </IconButton>
        ) : null}

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
        {quiz.status === "draft" ? <Badge label={t("quizzes.qoralama")} tone="warning" /> : null}

        {quiz.dueAt ? (
          <Badge
            label={`Muddat: ${formatDayTime(quiz.dueAt)}`}
            tone={overdue ? "danger" : "neutral"}
          />
        ) : (
          <Badge label={t("quizzes.muddat_yoq")} tone="neutral" />
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
  headTop: { flexDirection: "row", alignItems: "center", gap: 6, marginLeft: -8 },
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
