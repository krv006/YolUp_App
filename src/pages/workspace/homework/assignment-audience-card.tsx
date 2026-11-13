import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useAssignmentAudience, useSetAssignmentAudience } from "@/modules/homework";
import { StudentChecklist } from "@/modules/quiz/ui/student-checklist";
import { Avatar, DsText, dsRadius, Icon, MobileButton, Sheet, useDs } from "@/shared/ui";

export interface AssignmentAudienceCardProps {
  assignmentId: string;
}

/**
 * "Kimlarga berilgan" — veb `assignment-audience-card.tsx` (`rounded-xl`):
 * butun guruhmi yoki tanlangan o'quvchilarmi, ro'yxat (topshirgan /
 * topshirmagan); "O'zgartirish" — o'quvchilarni belgilash oynasi
 * (`AppDialog` o'rniga `Sheet variant="app"`).
 */
export function AssignmentAudienceCard({ assignmentId }: AssignmentAudienceCardProps) {
  const { t } = useTranslation("homework");
  const ds = useDs();
  const audience = useAssignmentAudience(assignmentId);
  const save = useSetAssignmentAudience();
  const [editing, setEditing] = useState<Set<string> | null>(null);
  const data = audience.data;
  const students = data?.students ?? [];
  const shown = data?.restricted ? students.filter((student) => student.assigned) : students;

  function submit() {
    if (!editing) return;
    const chosen = students
      .filter((student) => !editing.has(student.id))
      .map((student) => student.id);
    save.mutate(
      { id: assignmentId, studentIds: editing.size ? chosen : [] },
      { onSuccess: () => setEditing(null) }
    );
  }

  return (
    // `gap-3 rounded-xl bg-surface p-5`
    <View style={[styles.card, { backgroundColor: ds.c.surface }]}>
      <View style={styles.head}>
        <DsText v="title" style={styles.grow}>
          {t("audience.title")}
        </DsText>
        {students.length ? (
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              setEditing(
                new Set(
                  students.filter((student) => !student.assigned).map((student) => student.id)
                )
              )
            }
            style={({ pressed }) => [
              styles.edit,
              { backgroundColor: pressed ? ds.c.tint : ds.c["brand-subtle"] },
            ]}
          >
            <Icon name="edit" size={14} color={ds.c.brand} />
            <DsText v="caption-strong" c="brand">
              {t("audience.edit")}
            </DsText>
          </Pressable>
        ) : null}
      </View>

      {audience.isLoading ? (
        <DsText v="body-sm" c="ink-secondary">
          {t("audience.loading")}
        </DsText>
      ) : (
        <>
          <DsText v="body-sm" c="ink-secondary">
            {data?.restricted
              ? t("audience.restricted", { count: data.assignedCount, total: data.total })
              : t("audience.everyone", { count: data?.total ?? 0 })}
          </DsText>
          {/* `max-h-72 overflow-y-auto` */}
          <ScrollView style={styles.list} nestedScrollEnabled>
            {shown.map((student) => (
              <View key={student.id} style={styles.row}>
                <Avatar variant="legacy" name={student.name} size="sm" box={32} />
                <DsText v="body-sm" numberOfLines={1} style={styles.grow}>
                  {student.name}
                </DsText>
                <View
                  style={[
                    styles.pill,
                    { backgroundColor: student.submitted ? ds.c["success-bg"] : ds.c.subtle },
                  ]}
                >
                  <DsText v="caption-strong" c={student.submitted ? "success-fg" : "ink-secondary"}>
                    {student.submitted ? t("audience.submitted") : t("audience.notSubmitted")}
                  </DsText>
                </View>
              </View>
            ))}
          </ScrollView>
        </>
      )}

      <Sheet
        variant="app"
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={t("audience.editTitle")}
        description={t("audience.editHint")}
        footer={
          <>
            <MobileButton
              variant="secondary"
              label={t("audience.cancel")}
              onPress={() => setEditing(null)}
            />
            <MobileButton
              label={t("audience.save")}
              disabled={save.isPending || (editing ? editing.size === students.length : true)}
              onPress={submit}
            />
          </>
        }
      >
        {editing ? (
          <StudentChecklist
            students={students.map((student) => ({
              id: student.id,
              name: student.name,
              note: student.submitted ? t("audience.submitted") : undefined,
            }))}
            excluded={editing}
            onChange={setEditing}
          />
        ) : null}
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12, padding: 20, borderRadius: dsRadius.xl },
  head: { flexDirection: "row", alignItems: "center", gap: 8 },
  grow: { flex: 1, minWidth: 0 },
  /* `h-8 gap-1.5 rounded-full px-3` */
  edit: {
    height: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  list: { maxHeight: 288 },
  /* `gap-2.5 py-1.5` */
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  /* `rounded-full px-2 py-0.5` */
  pill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: dsRadius.full },
});
