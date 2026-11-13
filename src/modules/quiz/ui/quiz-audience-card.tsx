import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Avatar, DsText, dsRadius, Icon, MobileButton, Sheet, useDs } from "@/shared/ui";
import { useQuizAudience, useSetQuizAudience } from "../model/quiz.queries";
import { StudentChecklist } from "./student-checklist";

export interface QuizAudienceCardProps {
  quizId: string | null;
  hasCourse: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * "Kimlar ochishi mumkin" — veb `quiz-audience-card.tsx`: testni guruhdagi
 * hamma yoki tanlangan o'quvchilar ochadi; har birida "Topshirgan /
 * Topshirmagan". "O'zgartirish" pastki oynada o'quvchilar ro'yxatini ochadi
 * (`PUT /quizzes/{id}/audience/`).
 */
export function QuizAudienceCard({ quizId, hasCourse, style }: QuizAudienceCardProps) {
  const { t } = useTranslation("quiz");
  const ds = useDs();
  const audience = useQuizAudience(quizId, hasCourse);
  const save = useSetQuizAudience();
  const [editing, setEditing] = useState<Set<string> | null>(null);
  const data = audience.data;
  const students = data?.students ?? [];
  const assigned = students.filter((student) => student.assigned);

  function startEdit() {
    setEditing(
      new Set(students.filter((student) => !student.assigned).map((student) => student.id))
    );
  }

  function submit() {
    if (!quizId || !editing) return;
    const chosen = students
      .filter((student) => !editing.has(student.id))
      .map((student) => student.id);
    save.mutate(
      { quizId, studentIds: editing.size ? chosen : [] },
      { onSuccess: () => setEditing(null) }
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: ds.c.surface }, style]}>
      <View style={styles.head}>
        <DsText v="title" style={styles.grow}>
          {t("audience.title")}
        </DsText>
        {hasCourse && students.length ? (
          <Pressable
            accessibilityRole="button"
            onPress={startEdit}
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

      {!hasCourse ? (
        <DsText v="body-sm" c="ink-secondary">
          {t("audience.noGroup")}
        </DsText>
      ) : audience.isLoading ? (
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
            {(data?.restricted ? assigned : students).map((student) => (
              <View key={student.id} style={styles.row}>
                <Avatar
                  variant="legacy"
                  name={student.name}
                  src={student.avatarUrl ?? undefined}
                  size="sm"
                  box={32}
                />
                <DsText v="body-sm" numberOfLines={1} style={styles.grow}>
                  {student.name}
                </DsText>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: student.attempted ? ds.c["success-bg"] : ds.c.subtle },
                  ]}
                >
                  <DsText v="caption-strong" c={student.attempted ? "success-fg" : "ink-secondary"}>
                    {student.attempted ? t("audience.attempted") : t("audience.notAttempted")}
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
              avatarUrl: student.avatarUrl,
              note: student.attempted ? t("audience.attempted") : undefined,
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
  grow: { flex: 1, minWidth: 0 },
  /* `gap-3 rounded-xl bg-surface p-5` */
  card: { gap: 12, padding: 20, borderRadius: dsRadius.xl },
  head: { flexDirection: "row", alignItems: "center", gap: 8 },
  /* `h-8 gap-1.5 rounded-full px-3` */
  edit: {
    height: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: dsRadius.full,
  },
  list: { maxHeight: 288 },
  /* `gap-2.5 py-1.5` */
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  /* `rounded-full px-2 py-0.5` */
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: dsRadius.full },
});
