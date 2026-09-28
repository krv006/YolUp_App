import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { Search, UserMinus, UserPlus } from "lucide-react-native";
import type { DomainUser } from "@/shared/types";
import {
  Avatar,
  Button,
  ConfirmSheet,
  IconButton,
  Input,
  Separator,
  Skeleton,
  Text,
  useTheme,
} from "@/shared/ui";
import { useCourseStudents, useUnenrollStudent } from "../model/course.queries";
import { AddStudentSheet } from "./add-student-sheet";

export interface CourseMembersSectionProps {
  courseId: string | null;
  canManage: boolean;
}

/** Shu sondan ko'p o'quvchi bo'lsa filtr maydoni chiqadi (🟢 veb bilan bir xil). */
const SEARCH_THRESHOLD = 8;

/**
 * Kurs o'quvchilari — veb `course-members-section.tsx` ning mobil varianti.
 *
 * ┌─ NEGA MA'LUMOT OYNASIDA, ALOHIDA BO'LIM EMAS ────────────────────────┐
 * │ Ilgari mobilda bu "O'quvchilar" degan ALOHIDA tab edi — veb'da       │
 * │ bunday tab yo'q. Veb'da guruh tablari faqat to'rtta: suhbat,         │
 * │ darslar, vazifalar, davomat; o'quvchilar esa guruh nomi bosilganda   │
 * │ ochiladigan ma'lumot panelida turadi                                  │
 * │ (`conversation-info-panel.tsx:186`). Telefonda tab qatori tor va     │
 * │ beshinchi tab boshqalarini ekrandan chiqarib yuborardi.              │
 * └───────────────────────────────────────────────────────────────────────┘
 *
 * Filtrlash MAHALLIY: ro'yxat baribir bitta sahifada (`page_size: 100`)
 * keladi, shuning uchun har harfda so'rov yuborishning ma'nosi yo'q.
 */
export function CourseMembersSection({ courseId, canManage }: CourseMembersSectionProps) {
  const { t } = useTranslation("group");
  const { palette } = useTheme();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<DomainUser | null>(null);

  const studentsQuery = useCourseStudents(courseId, { page_size: 100 });
  const unenroll = useUnenrollStudent();

  // `getStudents` sahifalangan javob qaytaradi (`Page<Enrollment>`),
  // o'quvchining o'zi har bir yozuvning `student` maydonida.
  const all = useMemo(
    () => (studentsQuery.data?.items ?? []).map((item) => item.student),
    [studentsQuery.data]
  );

  const students = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return all;
    return all.filter((item) => `${item.name} ${item.username}`.toLowerCase().includes(query));
  }, [all, search]);

  function confirmRemove() {
    if (!removeTarget || !courseId) return;
    unenroll.mutate(
      { courseId, studentId: removeTarget.id },
      { onSuccess: () => setRemoveTarget(null) }
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.head}>
        <Text variant="caption" tone="muted">
          {t("students.title")}
        </Text>
        <Text variant="caption" tone="muted">
          {t("students.countSuffix", { count: studentsQuery.data?.total ?? all.length })}
        </Text>
      </View>

      {canManage ? (
        <Button
          title={t("students.addStudent")}
          variant="secondary"
          icon={<UserPlus size={16} color={palette["secondary-foreground"]} />}
          onPress={() => setAddOpen(true)}
        />
      ) : null}

      {all.length > SEARCH_THRESHOLD ? (
        <Input
          placeholder={t("students.searchPlaceholder")}
          icon={<Search size={18} color={palette["muted-foreground"]} />}
          value={search}
          onChangeText={setSearch}
        />
      ) : null}

      {studentsQuery.isLoading ? (
        <View style={styles.loading}>
          <Skeleton height={44} />
          <Skeleton height={44} />
          <Skeleton height={44} />
        </View>
      ) : (
        students.map((student, index) => (
          <View key={student.id}>
            {index > 0 ? <Separator inset={48} /> : null}
            <View style={styles.row}>
              <Avatar name={student.name} tone={student.avatarTone} size="sm" />
              <View style={styles.body}>
                <Text variant="label" numberOfLines={1}>
                  {student.name}
                </Text>
                <Text variant="caption" tone="muted" numberOfLines={1}>
                  @{student.username}
                </Text>
              </View>
              {canManage ? (
                <IconButton
                  accessibilityLabel={t("students.removeAria", { name: student.name })}
                  onPress={() => setRemoveTarget(student)}
                >
                  <UserMinus size={18} color={palette["muted-foreground"]} />
                </IconButton>
              ) : null}
            </View>
          </View>
        ))
      )}

      {!studentsQuery.isLoading && students.length === 0 ? (
        <Text variant="caption" tone="muted">
          {t("students.empty")}
        </Text>
      ) : null}

      {canManage && courseId ? (
        <AddStudentSheet open={addOpen} onClose={() => setAddOpen(false)} courseId={courseId} />
      ) : null}

      <ConfirmSheet
        open={Boolean(removeTarget)}
        onClose={() => setRemoveTarget(null)}
        title={t("students.removeDialogTitle")}
        description={
          removeTarget
            ? t("students.removeDialogDescription", { name: removeTarget.name })
            : undefined
        }
        confirmLabel={t("students.remove")}
        loading={unenroll.isPending}
        onConfirm={confirmRemove}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 10 },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  loading: { gap: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  body: { flex: 1, gap: 2 },
});
