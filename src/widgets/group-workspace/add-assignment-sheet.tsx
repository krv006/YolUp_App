import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { CalendarDays, FileUp, GraduationCap, Paperclip } from "lucide-react-native";
import { useCreateAssignment, useUpdateAssignment } from "@/modules/homework";
import type { Assignment, Lesson } from "@/shared/types";
import { pickDocument, toUploadFile, type PickedFile } from "@/shared/lib";
import {
  DateTimeField,
  Input,
  SelectField,
  Sheet,
  SheetButton,
  Text,
  useTheme,
  type SelectOption,
} from "@/shared/ui";

export interface AddAssignmentSheetProps {
  open: boolean;
  onClose: () => void;
  courseId: string;
  lessons: Lesson[];
  /** Til fanida "tekshiruv turi" (writing/reading/…) tanlovi ochiladi. */
  isLanguageSubject?: boolean;
  /**
   * Berilsa — oyna TAHRIRLASH rejimida ochiladi.
   *
   * Oynani `key={assignment.id}` bilan va faqat shu qiymat tayyor
   * bo'lgandan keyin chizish kerak: maydonlar boshlang'ich qiymatini
   * `useState` dan oladi, u esa faqat mount paytida hisoblanadi.
   */
  assignment?: Assignment | null;
}

/** Veb `useSkillOptions` bilan bir xil tartib (docs/STAFF_API.md §2). */
const SKILLS = ["", "writing", "reading", "listening", "speaking"] as const;

/**
 * Vazifa yaratish — veb `group-action-dialogs.tsx` dagi `AddAssignmentDialog`:
 * nom, matn, fayl, topshirish muddati (sana va vaqt), qaysi dars uchun,
 * til fanida tekshiruv turi, baholash izohi; pastda "Bekor qilish" va
 * "Vazifani yuborish".
 *
 * Veb'da matn maydoni ustida rich-text asboblar qatori bor edi (qalin, qiya,
 * ro'yxat). Mobilda u ATAYLAB olib tashlandi: veb'da ham u faqat ko'rinish
 * uchun edi (tugmalar `onClick` siz), backend esa matnni `nh3` bilan
 * tozalaydi. Ishlamaydigan asboblar qatorini ko'chirish foydalanuvchini
 * aldash bo'lardi.
 */
export function AddAssignmentSheet({
  open,
  onClose,
  courseId,
  lessons,
  isLanguageSubject = false,
  assignment = null,
}: AddAssignmentSheetProps) {
  const { t } = useTranslation("group");

  const skillOptions: readonly SelectOption[] = useMemo(
    () => SKILLS.map((skill) => ({ value: skill, label: t(`dialogs.assignment.skillOptions.${skill || "general"}`) })),
    [t]
  );
  const { palette } = useTheme();
  const create = useCreateAssignment();
  const update = useUpdateAssignment();
  const editing = Boolean(assignment);

  const [title, setTitle] = useState(assignment?.title ?? "");
  const [description, setDescription] = useState(assignment?.description ?? "");
  /*
   * Baholash izohi TAHRIRLASHDA bo'sh boshlanadi: backend uni
   * `Assignment` javobida qaytarmaydi, ya'ni eski qiymatni bilib
   * bo'lmaydi. Bo'sh qoldirilsa o'zgarmaydi — yozilsa almashadi.
   */
  const [grading, setGrading] = useState("");
  const [dueAt, setDueAt] = useState(assignment?.dueAt ?? "");
  const [skillKey, setSkillKey] = useState(assignment?.skillKey ?? "");
  const [lessonId, setLessonId] = useState(assignment?.lessonId ?? "");
  const [file, setFile] = useState<PickedFile | null>(null);

  /** Backend faqat TUGAGAN darsni qabul qiladi — eng yangisi tepada. */
  const lessonOptions = useMemo<SelectOption[]>(() => {
    const finished = lessons
      .filter((lesson) => lesson.status === "finished")
      .sort((a, b) => b.startsAt.localeCompare(a.startsAt))
      .map((lesson) => ({ value: lesson.id, label: `${lesson.title} · ${lesson.date}` }));
    return [{ value: "", label: t("dialogs.assignment.notLinkedToLesson") }, ...finished];
  }, [lessons, t]);

  function reset() {
    setTitle("");
    setDescription("");
    setGrading("");
    setDueAt("");
    setSkillKey("");
    setLessonId("");
    setFile(null);
  }

  function close() {
    reset();
    onClose();
  }

  async function attach() {
    const picked = await pickDocument();
    if (picked) setFile(picked);
  }

  async function submit() {
    if (!title.trim() || !description.trim()) return;

    const values = {
      courseId,
      title: title.trim(),
      description: description.trim(),
      body: description.trim(),
      // Muddat ixtiyoriy — tanlanmagan bo'lsa umuman yuborilmaydi.
      dueAt: dueAt || undefined,
      // Til fani bo'lmasa tanlov ko'rsatilmagan — eskirgan qiymat ketmasin.
      skillKey: isLanguageSubject ? skillKey : "",
      lessonId: lessonId || null,
      extraInstructions: grading.trim(),
      file: file ? toUploadFile(file) : null,
    };

    try {
      if (assignment) await update.mutateAsync({ id: assignment.id, form: values });
      else await create.mutateAsync(values);
      close();
    } catch {
      /*
       * XATO BU YERDA KO'RSATILMAYDI — uni mutatsiyaning `onError` i
       * chiqaradi. Ilgari ikkalasi ham chiqarardi va toast EKRANDA IKKI
       * MARTA ko'rinardi.
       *
       * `catch` o'zi kerak: `mutateAsync` rad javob bersa, quyidagi
       * `close()` bajarilmasligi va rad javob e'tiborsiz qolmasligi shart.
       */
    }
  }

  return (
    <Sheet
      open={open}
      onClose={close}
      title={editing ? t("dialogs.assignment.editTitle") : t("dialogs.assignment.newTitle")}
      description={t("dialogs.assignment.description")}
    >
      <View style={styles.form}>
        <Input
          label={t("dialogs.assignment.titleLabel")}
          placeholder={t("dialogs.assignment.titlePlaceholder")}
          value={title}
          onChangeText={setTitle}
          autoFocus={!editing}
        />

        {/* Vebdagi formatlash qatori yo'q — sababi yuqoridagi izohda. */}
        <Input
          accessibilityLabel={t("dialogs.assignment.descriptionPlaceholder")}
          placeholder={t("dialogs.assignment.descriptionPlaceholder")}
          value={description}
          onChangeText={setDescription}
          multiline
          inputStyle={styles.textarea}
        />

        {/* `.assignment-upload-row` */}
        <View style={styles.upload}>
          <Pressable
            accessibilityRole="button"
            onPress={() => void attach()}
            style={({ pressed }) => [
              styles.uploadButton,
              { borderColor: palette.primary, backgroundColor: pressed ? palette["primary-tint"] : palette["primary-soft"] },
            ]}
          >
            <FileUp size={16} color={palette["primary-text"]} />
            <Text variant="caption" style={[styles.uploadText, { color: palette["primary-text"] }]}>
              {assignment?.hasAttachment ? t("dialogs.assignment.replaceFile") : t("dialogs.assignment.attachFile")}
            </Text>
          </Pressable>
          {file ? (
            <View style={styles.fileName}>
              <Paperclip size={14} color={palette["muted-foreground"]} />
              <Text variant="caption" numberOfLines={1} style={styles.grow}>
                {file.name}
              </Text>
            </View>
          ) : assignment?.hasAttachment ? (
            <View style={styles.fileName}>
              <Paperclip size={14} color={palette["muted-foreground"]} />
              <Text variant="caption" numberOfLines={1} style={styles.grow}>
                {t("dialogs.assignment.currentFilePrefix")}{" "}
                {assignment.attachmentName || t("dialogs.assignment.fileAttachedFallback")}
              </Text>
            </View>
          ) : null}
        </View>

        <DateTimeField label={t("dialogs.assignment.dueLabel")} value={dueAt} onChange={setDueAt} optional />

        {/* Tekshiruv turi faqat til fanida ma'noli. */}
        {isLanguageSubject ? (
          <SelectField
            label={t("dialogs.assignment.checkTypeLabel")}
            icon={<GraduationCap size={17} color={palette["muted-foreground"]} />}
            value={skillKey}
            options={skillOptions}
            onChange={setSkillKey}
          />
        ) : null}

        <SelectField
          label={t("dialogs.assignment.lessonLabel")}
          icon={<CalendarDays size={17} color={palette["muted-foreground"]} />}
          value={lessonId}
          options={lessonOptions}
          onChange={setLessonId}
        />

        <Input
          label={t("dialogs.assignment.gradingLabel")}
          placeholder={t("dialogs.assignment.gradingPlaceholder")}
          value={grading}
          onChangeText={setGrading}
        />

        {/* `.dialog-actions` — o'ngda, "Bekor qilish" shaffof. */}
        <View style={styles.actions}>
          <SheetButton fill={false} variant="ghost" title={t("dialogs.assignment.cancel")} onPress={close} />
          <SheetButton
            fill={false}
            variant="primary"
            title={editing ? t("dialogs.assignment.saveChanges") : t("dialogs.assignment.submit")}
            loading={create.isPending || update.isPending}
            disabled={!title.trim() || !description.trim()}
            onPress={() => void submit()}
          />
        </View>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  /* `.group-action-form` — bloklar orasi 11 */
  form: { gap: 11 },
  textarea: { minHeight: 150, textAlignVertical: "top" },
  upload: { flexDirection: "row", alignItems: "center", gap: 10 },
  /* `> button` — 35 balandlik, 0 11, radius 10, 11/800 */
  uploadButton: { minHeight: 35, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 11, borderWidth: 1, borderRadius: 10 },
  uploadText: { fontSize: 11, lineHeight: 16.5, fontWeight: "700" },
  fileName: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 6 },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 4 },
});
