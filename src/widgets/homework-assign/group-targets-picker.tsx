import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useCourses, useCourseStudents } from "@/modules/course";
import { StudentChecklist } from "@/modules/quiz/ui/student-checklist";
import { CheckboxMark, DsText, dsRadius, useDs } from "@/shared/ui";
import type { GroupPick, GroupPicks } from "./group-targets";

export interface GroupTargetsPickerProps {
  value: GroupPicks;
  onChange: (value: GroupPicks) => void;
}

const EMPTY_PICK: GroupPick = { excluded: new Set(), studentIds: [] };

/**
 * Bazadan berishda guruhlar — veb `group-targets-picker.tsx`: guruh
 * belgilansa ichida o'quvchilar ro'yxati ochiladi, keraksizini olib
 * tashlash mumkin. Checkbox o'rniga `CheckboxMark` belgili `Pressable`.
 */
export function GroupTargetsPicker({ value, onChange }: GroupTargetsPickerProps) {
  const { t } = useTranslation("homework");
  const ds = useDs();
  const courses = useCourses();
  const items = courses.data ?? [];

  function toggle(courseId: string) {
    const next = new Map(value);
    if (next.has(courseId)) next.delete(courseId);
    else next.set(courseId, EMPTY_PICK);
    onChange(next);
  }

  return (
    <View style={styles.root}>
      <View>
        <DsText v="body-xs" c="ink-secondary">
          {t("bank.groupsLabel")}
        </DsText>
        <DsText v="caption" c="ink-tertiary">
          {t("bank.groupsHint")}
        </DsText>
      </View>
      {/* `overflow-hidden rounded-xl border border-line` */}
      <View style={[styles.list, { borderColor: ds.c.line }]}>
        {items.map((course, index) => {
          const pick = value.get(course.id);
          return (
            <View
              key={course.id}
              style={
                index < items.length - 1 && { borderBottomWidth: 1, borderBottomColor: ds.c.line }
              }
            >
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: Boolean(pick) }}
                onPress={() => toggle(course.id)}
                style={[styles.row, pick && { backgroundColor: ds.c["brand-subtle"] }]}
              >
                <CheckboxMark checked={Boolean(pick)} />
                <DsText v="body" numberOfLines={1} style={styles.grow}>
                  {course.title}
                </DsText>
                <DsText v="caption" c="ink-secondary">
                  {t("bank.studentsCount", { count: course.studentCount || course.students })}
                </DsText>
              </Pressable>
              {pick ? (
                <GroupStudents
                  courseId={course.id}
                  pick={pick}
                  onChange={(next) => onChange(new Map(value).set(course.id, next))}
                />
              ) : null}
            </View>
          );
        })}
        {!items.length ? (
          <DsText v="body-sm" c="ink-secondary" style={styles.empty}>
            {courses.isLoading ? t("bank.loading") : t("bank.noGroups")}
          </DsText>
        ) : null}
      </View>
    </View>
  );
}

function GroupStudents({
  courseId,
  pick,
  onChange,
}: {
  courseId: string;
  pick: GroupPick;
  onChange: (pick: GroupPick) => void;
}) {
  const enrollments = useCourseStudents(courseId, { page_size: 100 });
  const students = useMemo(
    () =>
      (enrollments.data?.items ?? [])
        .filter((item) => item.status === "approved")
        .map((item) => ({
          id: item.student.id,
          name: item.student.name,
          avatarUrl: item.student.avatarUrl,
        })),
    [enrollments.data]
  );

  return (
    // `px-3 pt-1 pb-3`
    <View style={styles.students}>
      <StudentChecklist
        students={students}
        excluded={pick.excluded}
        loading={enrollments.isLoading}
        onChange={(excluded) =>
          onChange({ excluded, studentIds: students.map((student) => student.id) })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 8 },
  grow: { flex: 1, minWidth: 0 },
  list: { overflow: "hidden", borderWidth: 1, borderRadius: dsRadius.xl },
  /* `min-h-12 gap-3 px-4 py-2` */
  row: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  students: { paddingHorizontal: 12, paddingTop: 4, paddingBottom: 12 },
  empty: { paddingHorizontal: 16, paddingVertical: 16 },
});
