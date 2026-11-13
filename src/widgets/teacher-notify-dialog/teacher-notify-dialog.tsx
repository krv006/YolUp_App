import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useCourseStudents, useCourses } from "@/modules/course";
import { notificationApi, notificationKeys } from "@/modules/notification";
import {
  Avatar,
  CheckboxMark,
  DsText,
  dsRadius,
  MobileButton,
  MobileInput,
  MobilePickerField,
  Sheet,
  toast,
  useDs,
} from "@/shared/ui";

export interface TeacherNotifyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId?: string | null;
}

type Audience = "all" | "selected";

const MAX_LENGTH = 1000;

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function toHtml(text: string): string {
  return text
    .trim()
    .split(/\n{2,}/)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

/**
 * O'qituvchi o'quvchilarga (va kuzatuvchilarga) xabar yuboradi — veb
 * `teacher-notify-dialog.tsx` (tor ekranda pastki oyna): guruh (berilmasa
 * tanlanadi), "Butun guruh" yoki tanlangan o'quvchilar, kuzatuvchilarga
 * ham yuborish va matn. Butun guruhga bitta `course` so'rovi ketadi.
 */
export function TeacherNotifyDialog({
  open,
  onOpenChange,
  courseId = null,
}: TeacherNotifyDialogProps) {
  const { t } = useTranslation("notification");
  const ds = useDs();
  const client = useQueryClient();
  const courses = useCourses();
  const [pickedCourse, setPickedCourse] = useState<string | null>(null);
  const [audience, setAudience] = useState<Audience>("all");
  const [picked, setPicked] = useState<Set<string>>(() => new Set());
  const [parents, setParents] = useState(false);
  const [text, setText] = useState("");

  const activeCourse = courseId ?? pickedCourse;
  const enrollments = useCourseStudents(open ? activeCourse : null, { page_size: 100 });
  const students = useMemo(
    () =>
      (enrollments.data?.items ?? [])
        .filter((item) => item.status === "approved")
        .map((item) => item.student),
    [enrollments.data]
  );
  const recipients = audience === "all" ? students.map((student) => student.id) : [...picked];
  const courseOptions = (courses.data ?? []).map((course) => ({
    value: course.id,
    label: course.title,
  }));

  const send = useMutation({
    mutationFn: async () => {
      const description = toHtml(text);
      if (audience === "all" && activeCourse) {
        await notificationApi.send({
          description,
          targetType: "course",
          courseId: activeCourse,
          includeParents: parents,
        });
        return;
      }
      await notificationApi.send({ description, targetType: "users", userIds: recipients });
      if (parents)
        await notificationApi.send({ description, targetType: "parents_of", userIds: recipients });
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: notificationKeys.all });
      toast.success(t("teacherSend.sent", { count: recipients.length }));
      close();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function reset() {
    setPickedCourse(null);
    setAudience("all");
    setPicked(new Set());
    setParents(false);
    setText("");
  }

  function close() {
    reset();
    onOpenChange(false);
  }

  function toggle(id: string) {
    setPicked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const canSend = Boolean(activeCourse && text.trim() && recipients.length && !send.isPending);

  function submit() {
    if (canSend) send.mutate();
  }

  return (
    <Sheet
      variant="app"
      open={open}
      onClose={close}
      title={t("teacherSend.title")}
      description={t("teacherSend.description")}
      footer={
        <>
          <MobileButton variant="secondary" label={t("teacherSend.cancel")} onPress={close} />
          <MobileButton label={t("teacherSend.submit")} disabled={!canSend} onPress={submit} />
        </>
      }
    >
      {/* `flex flex-col gap-4 pb-1` */}
      <View style={styles.form}>
        {courseId ? null : (
          <View style={styles.field}>
            <DsText v="body-xs" c="ink-secondary">
              {t("teacherSend.group")}
            </DsText>
            {/* Vebdagi `<select>` — variantlar shu oynaning ichida ochiladi (iOS yonma-yon Modal'ni ko'rsatmaydi). */}
            <MobilePickerField
              type="select"
              value={pickedCourse ?? ""}
              display={
                courseOptions.find((option) => option.value === pickedCourse)?.label ??
                t("teacherSend.groupPlaceholder")
              }
              placeholder={!pickedCourse}
              options={courseOptions}
              ariaLabel={t("teacherSend.group")}
              sheetTitle={t("teacherSend.groupPlaceholder")}
              onChange={(value) => {
                setPickedCourse(value || null);
                setPicked(new Set());
              }}
            />
          </View>
        )}

        {activeCourse ? (
          <View style={styles.field}>
            <DsText v="body-xs" c="ink-secondary">
              {t("teacherSend.audience")}
            </DsText>
            {/* `grid grid-cols-2 gap-2`; `h-11 rounded-full text-body-sm font-medium` */}
            <View
              accessibilityRole="radiogroup"
              accessibilityLabel={t("teacherSend.audience")}
              style={styles.audience}
            >
              {(["all", "selected"] as const).map((item) => {
                const active = audience === item;
                return (
                  <Pressable
                    key={item}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: active }}
                    onPress={() => setAudience(item)}
                    style={({ pressed }) => [
                      styles.audienceItem,
                      {
                        backgroundColor: active ? ds.c.brand : pressed ? ds.c.muted : ds.c.subtle,
                      },
                    ]}
                  >
                    <DsText
                      v="body-sm"
                      w="500"
                      c={active ? "on-action" : "ink"}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.85}
                    >
                      {item === "all"
                        ? t("teacherSend.audienceAll", { count: students.length })
                        : t("teacherSend.audienceSelected")}
                    </DsText>
                  </Pressable>
                );
              })}
            </View>

            {enrollments.isSuccess && !students.length ? (
              <View style={[styles.note, { backgroundColor: ds.c.subtle }]}>
                <DsText v="body-sm" c="ink-secondary">
                  {t("teacherSend.noStudents")}
                </DsText>
              </View>
            ) : null}

            {audience === "selected" && students.length ? (
              // `max-h-56 overflow-y-auto rounded-md border border-line`
              <ScrollView
                style={[styles.list, { borderColor: ds.c.line }]}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
              >
                {students.map((student, index) => {
                  const checked = picked.has(student.id);
                  return (
                    <Pressable
                      key={student.id}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked }}
                      onPress={() => toggle(student.id)}
                      style={({ pressed }) => [
                        styles.student,
                        index < students.length - 1 && {
                          borderBottomWidth: 1,
                          borderBottomColor: ds.c.line,
                        },
                        pressed && { backgroundColor: ds.c.subtle },
                      ]}
                    >
                      <CheckboxMark checked={checked} />
                      <Avatar variant="legacy" name={student.name} size="sm" box={32} />
                      <DsText v="body-sm" numberOfLines={1} style={styles.grow}>
                        {student.name}
                      </DsText>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : null}
            {audience === "selected" && students.length ? (
              <DsText v="caption" c="ink-secondary">
                {t("teacherSend.selectedCount", { count: picked.size })}
              </DsText>
            ) : null}
          </View>
        ) : null}

        {/* `items-start gap-3 rounded-md bg-subtle px-4 py-3` */}
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: parents }}
          onPress={() => setParents((value) => !value)}
          style={[styles.parents, { backgroundColor: ds.c.subtle }]}
        >
          <CheckboxMark checked={parents} />
          <View style={styles.grow}>
            <DsText v="body-sm" w="500">
              {t("teacherSend.parents")}
            </DsText>
            <DsText v="caption" c="ink-secondary">
              {t("teacherSend.parentsHint")}
            </DsText>
          </View>
        </Pressable>

        <View style={styles.field}>
          <DsText v="body-xs" c="ink-secondary">
            {t("teacherSend.text")}
          </DsText>
          <MobileInput
            multiline
            multilineHeight={120}
            maxLength={MAX_LENGTH}
            accessibilityLabel={t("teacherSend.text")}
            value={text}
            placeholder={t("teacherSend.textPlaceholder")}
            onChangeText={setText}
          />
        </View>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  form: { gap: 16, paddingBottom: 4 },
  field: { gap: 8 },
  audience: { flexDirection: "row", gap: 8 },
  audienceItem: {
    flex: 1,
    minWidth: 0,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    borderRadius: dsRadius.full,
  },
  /* `rounded-md bg-subtle px-4 py-3` */
  note: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: dsRadius.md },
  list: { maxHeight: 224, borderWidth: 1, borderRadius: dsRadius.md },
  /* `gap-3 px-3 py-2.5` */
  student: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  parents: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: dsRadius.md,
  },
  grow: { flex: 1, minWidth: 0 },
});
