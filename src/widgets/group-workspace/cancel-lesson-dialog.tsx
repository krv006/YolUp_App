import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import type { Lesson } from "@/shared/types";
import { DsText, dsRadius, MobileButton, Sheet, useDs } from "@/shared/ui";

export type CancelLessonScope = "single" | "following";

export interface CancelLessonDialogProps {
  lesson: Lesson | null;
  pending?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (lesson: Lesson, scope: CancelLessonScope) => void;
}

/**
 * Darsni bekor qilish — veb `cancel-lesson-dialog.tsx` (tor ekranda pastki
 * oyna): "faqat shu dars" yoki "shu va keyingilari", pastda "Yopish" va
 * qizil "Bekor qilish".
 */
export function CancelLessonDialog({ lesson, pending = false, onOpenChange, onConfirm }: CancelLessonDialogProps) {
  const { t } = useTranslation(["group", "lesson"]);
  const ds = useDs();
  const [scope, setScope] = useState<CancelLessonScope>("single");
  const months = t("lesson:list.months", { returnObjects: true }) as string[];

  const starts = lesson ? new Date(lesson.startsAt) : null;
  const when =
    starts && !Number.isNaN(starts.getTime())
      ? `${starts.getDate()}-${(months[starts.getMonth()] ?? "").toLowerCase()}, ${String(starts.getHours()).padStart(2, "0")}:${String(
          starts.getMinutes()
        ).padStart(2, "0")}`
      : "";

  const options: Array<{ id: CancelLessonScope; label: string }> = [
    { id: "single", label: t("group:cancelLesson.onlyThis", { when }) },
    { id: "following", label: t("group:cancelLesson.thisAndNext") },
  ];

  function close() {
    setScope("single");
    onOpenChange(false);
  }

  return (
    <Sheet
      variant="app"
      open={Boolean(lesson)}
      onClose={close}
      title={t("group:cancelLesson.title")}
      description={t("group:cancelLesson.description")}
      footer={
        <>
          <MobileButton variant="secondary" label={t("group:cancelLesson.close")} onPress={close} />
          <MobileButton variant="danger" label={t("group:cancelLesson.confirm")} disabled={pending} onPress={() => lesson && onConfirm(lesson, scope)} />
        </>
      }
    >
      <View style={styles.options}>
        {options.map((option) => {
          const active = scope === option.id;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              onPress={() => setScope(option.id)}
              style={[
                styles.option,
                active ? { borderColor: ds.c.brand, backgroundColor: ds.c["brand-subtle"] } : { borderColor: "transparent", backgroundColor: ds.c.subtle },
              ]}
            >
              <View
                style={[
                  styles.radio,
                  active ? { backgroundColor: ds.c.brand } : { borderWidth: 2, borderColor: ds.c["line-strong"], backgroundColor: ds.c.surface },
                ]}
              >
                {active ? <View style={[styles.dot, { backgroundColor: ds.c.surface }]} /> : null}
              </View>
              <DsText numberOfLines={1} style={styles.grow}>
                {option.label}
              </DsText>
            </Pressable>
          );
        })}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  options: { gap: 16 },
  /* `h-18 rounded-xl border-[1.5px] px-6 gap-3.5` */
  option: { height: 72, flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 24, borderWidth: 1.5, borderRadius: dsRadius.xl },
  radio: { width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
