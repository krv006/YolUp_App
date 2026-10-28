import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import {
  DsText,
  dsRadius,
  Icon,
  MobileButton,
  MobileFieldLabel,
  MobileInput,
  MobilePickerField,
  MobileScreenDialog,
  useDs,
  type IconName,
} from "@/shared/ui";

export interface NewTestDraft {
  courseId: string;
  title: string;
  subject: string;
  dueAt: string | null;
}

export interface NewTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses: ReadonlyArray<{ id: string; label: string; subject: string }>;
  subjects: ReadonlyArray<{ value: string; label: string }>;
  pending?: boolean;
  onContinue: (draft: NewTestDraft) => void;
  onImport: () => void;
}

const IMPORT_SOURCES: ReadonlyArray<{ id: string; icon: IconName }> = [
  { id: "docx", icon: "assignment-check-fill" },
  { id: "xlsx", icon: "bar-chart" },
  { id: "google", icon: "send" },
];

function today(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/**
 * Yangi test, 1-qadam — veb `new-test-dialog.tsx` ning tor ekran varianti
 * (to'liq ekran): guruh, nom, fan, muddat; import manbalari (Word, Excel,
 * Google — hammasi import oynasini ochadi); "Davom etish" savollar
 * muharririga (`?step=2`) olib o'tadi.
 */
export function NewTestDialog({ open, onOpenChange, courses, subjects, pending = false, onContinue, onImport }: NewTestDialogProps) {
  const { t } = useTranslation("quiz");
  const { t: tl } = useTranslation("lesson");
  const ds = useDs();
  const months = tl("list.months", { returnObjects: true }) as string[];
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [due, setDue] = useState(today);

  const course = courses.find((item) => item.id === courseId) ?? null;
  const finalSubject = subject || course?.subject || "";
  const subjectLabel = subjects.find((item) => item.value === finalSubject)?.label ?? "";
  const day = new Date(`${due}T00:00`);
  const dueLabel = Number.isNaN(day.getTime()) ? due : `${day.getDate()}-${(months[day.getMonth()] ?? "").slice(0, 3).toLowerCase()}`;

  function submit() {
    onContinue({ courseId, title: title.trim(), subject: finalSubject, dueAt: due ? `${due}T23:59` : null });
  }

  return (
    <MobileScreenDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("newTest.mobileTitle")}
      closeLabel={t("newTest.cancel")}
      footer={<MobileButton icon="chevron-right" label={t("newTest.continue")} disabled={pending || !courseId || !title.trim()} onPress={submit} />}
    >
      <View style={[styles.progress, { backgroundColor: ds.c.subtle }]}>
        <View style={[styles.progressFill, { backgroundColor: ds.c.brand }]} />
      </View>

      <View style={styles.fields}>
        <MobileFieldLabel gap={7} label={t("newTest.group")}>
          <MobilePickerField
            type="select"
            surface
            value={courseId}
            display={course ? course.label : t("assignDialog.pick")}
            placeholder={!course}
            ariaLabel={t("newTest.group")}
            options={[...(course ? [] : [{ value: "", label: t("assignDialog.pick") }]), ...courses.map((item) => ({ value: item.id, label: item.label }))]}
            onChange={setCourseId}
          />
        </MobileFieldLabel>

        <MobileFieldLabel gap={7} label={t("newTest.name")}>
          <MobileInput surface value={title} placeholder={t("newTest.namePlaceholder")} onChangeText={setTitle} />
        </MobileFieldLabel>

        <View style={styles.pair}>
          <View style={styles.grow}>
            <MobileFieldLabel gap={7} label={t("newTest.subject")}>
              <MobilePickerField
                type="select"
                surface
                value={finalSubject}
                display={subjectLabel || t("assignDialog.pick")}
                placeholder={!subjectLabel}
                ariaLabel={t("newTest.subject")}
                options={[...(subjectLabel ? [] : [{ value: "", label: t("assignDialog.pick") }]), ...subjects.map((item) => ({ value: item.value, label: item.label }))]}
                onChange={setSubject}
              />
            </MobileFieldLabel>
          </View>
          <View style={styles.grow}>
            <MobileFieldLabel gap={7} label={t("newTest.due")}>
              <MobilePickerField type="date" surface value={due} display={dueLabel} min={today()} ariaLabel={t("newTest.due")} onChange={setDue} />
            </MobileFieldLabel>
          </View>
        </View>
      </View>

      <DsText v="body-sm" c="ink-secondary" style={styles.importHint}>
        {t("newTest.importHint")}
      </DsText>

      {/* `mt-3.5 grid grid-cols-3 gap-2`, har biri `h-18.5 rounded-lg bg-surface` */}
      <View style={styles.sources}>
        {IMPORT_SOURCES.map((source) => (
          <View key={source.id} style={styles.sourceCell}>
            <Pressable
              accessibilityRole="button"
              onPress={onImport}
              style={({ pressed }) => [styles.source, { backgroundColor: pressed ? ds.c.subtle : ds.c.surface }]}
            >
              <Icon name={source.icon} size={20} color={ds.c.brand} />
              <DsText v="body-sm" w="500">
                {t(`newTest.sources.${source.id}`)}
              </DsText>
            </Pressable>
          </View>
        ))}
      </View>
    </MobileScreenDialog>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  progress: { marginTop: 16, height: 6, overflow: "hidden", borderRadius: 3 },
  progressFill: { width: "27.5%", height: "100%", borderRadius: 3 },
  fields: { marginTop: 15, gap: 15 },
  pair: { flexDirection: "row", gap: 12 },
  importHint: { marginTop: 16 },
  sources: { marginTop: 14, flexDirection: "row", gap: 8 },
  sourceCell: { flex: 1, flexBasis: 0 },
  source: { height: 74, alignItems: "center", justifyContent: "center", gap: 8, borderRadius: dsRadius.lg },
});
