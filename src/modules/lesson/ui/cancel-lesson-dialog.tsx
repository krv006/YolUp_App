import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import type { Lesson } from "@/shared/types";
import { ConfirmDialog, DsText, dsRadius, toast, useDs } from "@/shared/ui";
import { useCancelLesson } from "../model/lesson.queries";

/**
 * Darsni bekor qilish tasdig'i — veb `cancel-lesson-dialog.tsx` (#217):
 * avval jadvalda "Bekor qilish" darhol bekor qilardi. Takrorlanuvchi darsda
 * "Faqat shu dars" / "Shu va keyingi barcha darslar" tanlanadi.
 */
export function CancelLessonDialog({
  lesson,
  onOpenChange,
  onCancelled,
}: {
  lesson: Lesson | null;
  onOpenChange: (open: boolean) => void;
  onCancelled?: () => void;
}) {
  const { t } = useTranslation("lesson");
  const ds = useDs();
  const cancelLesson = useCancelLesson();
  const [scope, setScope] = useState<"one" | "series">("one");

  function close(open: boolean) {
    if (!open) setScope("one");
    onOpenChange(open);
  }

  return (
    <ConfirmDialog
      open={Boolean(lesson)}
      onOpenChange={close}
      icon="trash"
      title={t("schedule.cancelTitle")}
      description={t("schedule.cancelDescription")}
      confirmLabel={t("schedule.cancelConfirm")}
      cancelLabel={t("schedule.keep")}
      pending={cancelLesson.isPending}
      onConfirm={() => {
        if (!lesson) return;
        cancelLesson.mutate(
          { id: lesson.id, scope: lesson.recurrenceId ? scope : "one" },
          {
            onSuccess: (count) => {
              toast.success(t("schedule.cancelled", { count: Number(count) || 1 }));
              close(false);
              onCancelled?.();
            },
          }
        );
      }}
    >
      {lesson?.recurrenceId ? (
        <View accessibilityRole="radiogroup" style={styles.scopes}>
          {(["one", "series"] as const).map((item) => {
            const active = scope === item;
            return (
              <Pressable
                key={item}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                onPress={() => setScope(item)}
                style={[
                  styles.scope,
                  { borderColor: active ? ds.c.brand : ds.c.line, backgroundColor: active ? ds.c["brand-subtle"] : ds.c.surface },
                ]}
              >
                <View style={[styles.radio, { borderColor: active ? ds.c.brand : ds.c.line }]}>
                  {active ? <View style={[styles.dot, { backgroundColor: ds.c.brand }]} /> : null}
                </View>
                <DsText v="body-sm" w="600">
                  {t(`schedule.cancelScope.${item}`)}
                </DsText>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </ConfirmDialog>
  );
}

const styles = StyleSheet.create({
  scopes: { alignSelf: "stretch", gap: 8 },
  /* `gap-3 rounded-xl border px-3.5 py-3` */
  scope: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderRadius: dsRadius.xl },
  radio: { width: 20, height: 20, alignItems: "center", justifyContent: "center", borderWidth: 2, borderRadius: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
