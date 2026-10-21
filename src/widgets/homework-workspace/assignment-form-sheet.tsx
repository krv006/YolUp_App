import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { Bold, Italic, Link2, List, Underline } from "lucide-react-native";
import { useCourses } from "@/modules/course";
import { useCreateAssignment, useUpdateAssignment } from "@/modules/homework";
import { pickDocument, toUploadFile, type PickedFile } from "@/shared/lib";
import type { Assignment } from "@/shared/types";
import {
  DateField,
  Icon,
  Input,
  radius,
  SelectField,
  Sheet,
  SheetButton,
  SheetFooter,
  Switch,
  Text,
  TimeField,
  toast,
  useTheme,
  type IconName,
} from "@/shared/ui";

export interface AssignmentFormSheetProps {
  open: boolean;
  onClose: () => void;
  courseId?: string | null;
  assignment?: Assignment | null;
  submittedCount?: number;
  lessons?: Array<{ id: string; title: string; date: string }>;
  onDelete?: (assignment: Assignment) => void;
}

type Grading = "five" | "hundred" | "none";

/**
 * Vazifa berish va tahrirlash — veb `widgets/homework-workspace/assignment-form-dialog.tsx`
 * porti. Ikki ko'rinish vebdagidek: yaratish (guruh, nom, matn, muddat,
 * baholash, fayl, uchta kalit) va tahrirlash (nom, formatlash paneli,
 * fayl, muddat, dars, baholash izohi, o'chirish).
 */
export function AssignmentFormSheet({
  open,
  onClose,
  courseId = null,
  assignment = null,
  submittedCount = 0,
  lessons = [],
  onDelete,
}: AssignmentFormSheetProps) {
  const { t } = useTranslation("homework");
  const { palette } = useTheme();
  const courses = useCourses();
  const create = useCreateAssignment();
  const update = useUpdateAssignment();

  const [course, setCourse] = useState(courseId ?? "");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("18:00");
  const [grading, setGrading] = useState<Grading>("five");
  const [file, setFile] = useState<PickedFile | null>(null);
  const [lessonId, setLessonId] = useState("");
  const [grading2, setGrading2] = useState("");
  const selection = useRef({ start: 0, end: 0 });
  const [aiCheck, setAiCheck] = useState(true);
  const [announce] = useState(true);
  const [allowLate] = useState(false);
  // Vebdagi `window.prompt` o'rniga — Android'da `Alert.prompt` yo'q.
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const formKey = open ? `${assignment?.id ?? "new"}|${courseId ?? ""}` : "";
  const [syncedKey, setSyncedKey] = useState("");

  if (formKey && formKey !== syncedKey) {
    setSyncedKey(formKey);
    setCourse(assignment?.courseId ?? courseId ?? "");
    setTitle(assignment?.title ?? "");
    setBody(assignment?.description ?? "");
    setLessonId(assignment?.lessonId ?? "");
    setGrading2("");
    setFile(null);
    if (assignment?.dueAt) {
      const due = new Date(assignment.dueAt);
      setDate(
        `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, "0")}-${String(due.getDate()).padStart(2, "0")}`
      );
      setTime(`${String(due.getHours()).padStart(2, "0")}:${String(due.getMinutes()).padStart(2, "0")}`);
    } else {
      setDate("");
      setTime("18:00");
    }
  }
  if (!formKey && syncedKey) setSyncedKey("");

  const lessonChoices = useMemo(
    () => [
      { value: "", label: t("form.lessonNone") },
      ...lessons.map((lesson) => ({ value: lesson.id, label: `${lesson.title} · ${lesson.date}` })),
    ],
    [lessons, t]
  );

  /** Formatlash paneli — kursor turgan joyni teglar bilan o'raydi (vebdagi `wrapSelection`). */
  function wrapSelection(prefix: string, suffix: string) {
    const { start, end } = selection.current;
    setBody(`${body.slice(0, start)}${prefix}${body.slice(start, end)}${suffix}${body.slice(end)}`);
  }

  const options = (courses.data ?? []).map((item) => ({
    value: item.id,
    label: item.studentCount ? `${item.title} · ${t("form.studentCount", { count: item.studentCount })}` : item.title,
  }));

  async function chooseFile() {
    const picked = await pickDocument();
    if (picked) setFile(picked);
  }

  async function save() {
    if (!course || !title.trim()) {
      toast.error(t("form.required"));
      return;
    }
    const form = {
      courseId: course,
      title: title.trim(),
      description: body.trim(),
      body: body.trim(),
      dueAt: date ? new Date(`${date}T${time}`).toISOString() : undefined,
      file: file ? toUploadFile(file) : null,
      ...(assignment ? { lessonId: lessonId || null, extraInstructions: grading2 } : {}),
    };
    try {
      if (assignment) await update.mutateAsync({ id: assignment.id, form });
      else await create.mutateAsync(form);
      onClose();
    } catch {
      /* xatoni mutatsiya o'zi ko'rsatadi */
    }
  }

  const ext = (name: string) => name.split(".").pop()?.slice(0, 4).toUpperCase() ?? "FILE";
  const pending = create.isPending || update.isPending;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={assignment ? t("form.editTitle") : t("form.title")}
      description={assignment && submittedCount ? t("form.editSubtitle", { count: submittedCount }) : t("form.subtitle")}
    >
      {assignment ? (
        <View style={styles.body}>
          <Input label={t("form.nameLabel")} value={title} onChangeText={setTitle} />

          {/* Formatlash paneli + matn — `rounded-xl border` */}
          <View style={[styles.rich, { borderColor: palette.border }]}>
            <View style={[styles.toolbar, { borderBottomColor: palette.border, backgroundColor: palette["surface-subtle"] }]}>
              {(
                [
                  [Bold, "b", t("form.rich.bold")],
                  [Italic, "i", t("form.rich.italic")],
                  [Underline, "u", t("form.rich.underline")],
                ] as const
              ).map(([RichIcon, tag, label]) => (
                <Pressable key={tag} accessibilityRole="button" accessibilityLabel={label} onPress={() => wrapSelection(`<${tag}>`, `</${tag}>`)} style={styles.tool}>
                  <RichIcon size={15} color={palette["muted-foreground"]} />
                </Pressable>
              ))}
              <View style={[styles.divider, { backgroundColor: palette.border }]} />
              <Pressable accessibilityRole="button" accessibilityLabel={t("form.rich.list")} onPress={() => wrapSelection("• ", "")} style={styles.tool}>
                <List size={15} color={palette["muted-foreground"]} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("form.rich.link")}
                onPress={() => {
                  setLinkUrl("");
                  setLinkOpen(true);
                }}
                style={styles.tool}
              >
                <Link2 size={15} color={palette["muted-foreground"]} />
              </Pressable>
            </View>
            <TextInput
              multiline
              textAlignVertical="top"
              value={body}
              onChangeText={setBody}
              onSelectionChange={(event) => {
                selection.current = event.nativeEvent.selection;
              }}
              placeholder={t("form.bodyPlaceholder")}
              placeholderTextColor={palette["subtle-foreground"]}
              style={[styles.richInput, { backgroundColor: palette.surface, color: palette.foreground }]}
            />
          </View>

          <View style={styles.fileBlock}>
            <Pressable
              accessibilityRole="button"
              onPress={() => void chooseFile()}
              style={({ pressed }) => [styles.attach, { backgroundColor: palette["primary-soft"], opacity: pressed ? 0.8 : 1 }]}
            >
              <Icon name="assign" size={17} color={palette.primary} />
              <Text variant="label" style={{ color: palette.primary }}>
                {t("form.attachFile")}
              </Text>
            </Pressable>
            {file || assignment.hasAttachment ? (
              <View style={[styles.fileRow, { borderColor: palette.border, backgroundColor: palette.surface }]}>
                <View style={[styles.ext, { backgroundColor: palette["destructive-soft"] }]}>
                  <Text variant="caption" style={[styles.strong, { color: palette["destructive-strong"] }]}>
                    {ext(file?.name ?? assignment.attachmentName ?? "FILE")}
                  </Text>
                </View>
                <View style={styles.grow}>
                  <Text variant="label" numberOfLines={1}>
                    {file?.name ?? assignment.attachmentName ?? "—"}
                  </Text>
                  {file ? (
                    <Text variant="caption" style={{ color: palette["subtle-foreground"] }}>
                      {(file.size / 1024 / 1024).toFixed(1)} MB
                    </Text>
                  ) : null}
                </View>
                {file ? (
                  <Pressable accessibilityRole="button" accessibilityLabel={t("form.removeFile")} onPress={() => setFile(null)} style={styles.remove}>
                    <View style={styles.rotated}>
                      <Icon name="add" size={16} color={palette["subtle-foreground"]} />
                    </View>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </View>

          <DateField label={t("form.dueDate")} value={date} onChange={setDate} optional />
          <SelectField label={t("form.lessonLabel")} value={lessonId} onChange={setLessonId} options={lessonChoices} />
          <Input label={t("form.gradingNote")} value={grading2} onChangeText={setGrading2} placeholder={t("form.gradingNotePlaceholder")} />

          {onDelete ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                onClose();
                onDelete(assignment);
              }}
              style={({ pressed }) => [styles.delete, pressed && { backgroundColor: palette["destructive-soft"] }]}
            >
              <Icon name="trash" size={17} color={palette["destructive-strong"]} />
              <Text variant="label" style={{ color: palette["destructive-strong"] }}>
                {t("form.deleteAssignment")}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <View style={styles.body}>
          <SelectField label={t("form.group")} value={course} onChange={setCourse} options={options} />
          <Input label={t("form.titleLabel")} value={title} onChangeText={setTitle} placeholder={t("form.titlePlaceholder")} />
          <Input
            label={t("form.bodyLabel")}
            value={body}
            onChangeText={setBody}
            placeholder={t("form.bodyPlaceholder")}
            multiline
            numberOfLines={3}
          />
          <DateField label={t("form.dueDate")} value={date} onChange={setDate} optional />
          <TimeField label={t("form.dueTime")} value={time} onChange={setTime} />

          <View style={styles.gradingBlock}>
            <Text variant="label" style={{ color: palette["muted-foreground"] }}>
              {t("form.grading")}
            </Text>
            <View style={styles.chips}>
              {(
                [
                  ["five", t("form.gradingFive")],
                  ["hundred", t("form.gradingHundred")],
                  ["none", t("form.gradingNone")],
                ] as const
              ).map(([id, label]) => (
                <Pressable
                  key={id}
                  accessibilityRole="button"
                  onPress={() => {
                    setGrading(id);
                    if (id !== "five") toast.info(t("form.gradingUnavailable"));
                  }}
                  style={[
                    styles.chip,
                    grading === id
                      ? { backgroundColor: palette["primary-soft"] }
                      : { borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface },
                  ]}
                >
                  <Text variant="label" style={{ color: grading === id ? palette.primary : palette["muted-foreground"] }}>
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.gradingBlock}>
            <Text variant="label" style={{ color: palette["muted-foreground"] }}>
              {t("form.attachments")}
            </Text>
            <View style={styles.attachRow}>
              {file ? (
                <View style={[styles.newFile, { borderColor: palette.border, backgroundColor: palette.background }]}>
                  <View style={[styles.ext, { backgroundColor: palette["destructive-soft"] }]}>
                    <Text variant="caption" style={[styles.strong, { color: palette["destructive-strong"] }]}>
                      {ext(file.name)}
                    </Text>
                  </View>
                  <View style={styles.newFileText}>
                    <Text variant="caption" numberOfLines={1} style={styles.strong}>
                      {file.name}
                    </Text>
                    <Text variant="caption" style={{ color: palette["subtle-foreground"] }}>
                      {(file.size / 1024 / 1024).toFixed(1)} MB
                    </Text>
                  </View>
                  <Pressable accessibilityRole="button" accessibilityLabel={t("form.removeFile")} onPress={() => setFile(null)}>
                    <View style={styles.rotated}>
                      <Icon name="add" size={14} color={palette["subtle-foreground"]} />
                    </View>
                  </Pressable>
                </View>
              ) : null}
              <Pressable
                accessibilityRole="button"
                onPress={() => void chooseFile()}
                style={({ pressed }) => [
                  styles.addFile,
                  { borderColor: palette.border, backgroundColor: pressed ? palette["surface-subtle"] : "transparent" },
                ]}
              >
                <Icon name="add" size={18} color={palette["muted-foreground"]} />
                <Text variant="label" style={{ color: palette["muted-foreground"] }}>
                  {t("form.addFile")}
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={[styles.toggles, { borderColor: palette.border }]}>
            {(
              [
                ["ai", "check-circle", palette["saffron-strong"], aiCheck, setAiCheck, true],
                ["announce", "bell", palette.primary, announce, null, false],
                ["late", "clock", palette["subtle-foreground"], allowLate, null, false],
              ] as const
            ).map(([id, icon, tone, value, setValue, supported], index) => (
              <View key={id} style={[styles.toggle, index < 2 && { borderBottomWidth: 1, borderBottomColor: palette.border }]}>
                <View style={[styles.toggleIcon, { backgroundColor: tone }]}>
                  <Icon name={icon as IconName} size={17} color="#ffffff" />
                </View>
                <View style={styles.grow}>
                  <Text variant="label">{t(`form.toggle.${id}`)}</Text>
                  <Text variant="caption" style={{ color: palette["subtle-foreground"] }}>
                    {supported ? t(`form.toggle.${id}Hint`) : t("form.toggle.pending")}
                  </Text>
                </View>
                <Switch
                  checked={value}
                  accessibilityLabel={t(`form.toggle.${id}`)}
                  onCheckedChange={(next) => {
                    if (!supported || !setValue) {
                      toast.info(t("form.toggle.pending"));
                      return;
                    }
                    setValue(next);
                  }}
                />
              </View>
            ))}
          </View>
        </View>
      )}

      <Sheet open={linkOpen} onClose={() => setLinkOpen(false)} title={t("form.rich.linkPrompt")}>
        <Input value={linkUrl} onChangeText={setLinkUrl} autoFocus keyboardType="url" placeholder="https://" />
        <SheetFooter>
          <SheetButton title={t("form.cancel")} onPress={() => setLinkOpen(false)} />
          <SheetButton
            variant="primary"
            title={t("form.save")}
            disabled={!linkUrl.trim()}
            onPress={() => {
              wrapSelection(`<a href="${linkUrl.trim()}">`, "</a>");
              setLinkOpen(false);
            }}
          />
        </SheetFooter>
      </Sheet>

      <SheetFooter>
        <SheetButton
          title={assignment ? t("form.cancel") : t("form.draft")}
          onPress={() => (assignment ? onClose() : toast.info(t("form.draftUnavailable")))}
        />
        <SheetButton
          variant="primary"
          title={assignment ? t("form.save") : t("form.submit")}
          disabled={pending}
          loading={pending}
          onPress={() => void save()}
        />
      </SheetFooter>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  strong: { fontWeight: "600" },
  rotated: { transform: [{ rotate: "45deg" }] },
  body: { gap: 16 },
  rich: { overflow: "hidden", borderWidth: 1, borderRadius: radius.xl },
  toolbar: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 6, borderBottomWidth: 1 },
  tool: { width: 32, height: 32, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
  divider: { width: 1, height: 20, marginHorizontal: 4 },
  richInput: { minHeight: 120, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, fontFamily: "Onest-Regular" },
  fileBlock: { gap: 8 },
  attach: { alignSelf: "flex-start", height: 44, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, borderRadius: radius.xl },
  fileRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderRadius: radius.xl },
  ext: { width: 40, height: 40, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
  remove: { width: 32, height: 32, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  delete: { alignSelf: "center", height: 44, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, borderRadius: radius.full },
  gradingBlock: { gap: 6 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { height: 40, justifyContent: "center", paddingHorizontal: 12, borderRadius: radius.full },
  attachRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 12 },
  newFile: { height: 64, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 12, borderWidth: 1, borderRadius: radius.xl },
  newFileText: { maxWidth: 180 },
  addFile: {
    flex: 1,
    minWidth: 140,
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: radius.xl,
  },
  toggles: { overflow: "hidden", borderWidth: 1, borderRadius: radius["2xl"] },
  toggle: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  toggleIcon: { width: 36, height: 36, borderRadius: radius.xl, alignItems: "center", justifyContent: "center" },
});
