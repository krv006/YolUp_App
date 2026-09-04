import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { FileUp, Paperclip } from "lucide-react-native";
import { useCreateAssignment } from "@/modules/homework";
import type { Lesson } from "@/shared/types";
import { pickDocument, toUploadFile, type PickedFile } from "@/shared/lib";
import {
  Button,
  DateField,
  IconButton,
  Input,
  radius,
  SelectField,
  Sheet,
  Text,
  TimeField,
  toast,
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
}

/** Veb `SKILL_OPTIONS` bilan bir xil (docs/STAFF_API.md §2). */
const SKILL_OPTIONS: readonly SelectOption[] = [
  { value: "", label: "Tanlanmagan" },
  { value: "writing", label: "Writing" },
  { value: "reading", label: "Reading" },
  { value: "listening", label: "Listening" },
  { value: "speaking", label: "Speaking" },
];

/**
 * Vazifa yaratish — veb `AddAssignmentDialog` ning mobil varianti.
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
}: AddAssignmentSheetProps) {
  const { palette } = useTheme();
  const create = useCreateAssignment();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [grading, setGrading] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("23:59");
  const [skillKey, setSkillKey] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [file, setFile] = useState<PickedFile | null>(null);

  /** Backend faqat TUGAGAN darsni qabul qiladi — eng yangisi tepada. */
  const lessonOptions = useMemo<SelectOption[]>(() => {
    const finished = lessons
      .filter((lesson) => lesson.status === "finished")
      .sort((a, b) => b.startsAt.localeCompare(a.startsAt))
      .map((lesson) => ({ value: lesson.id, label: `${lesson.title} · ${lesson.date}` }));
    return [{ value: "", label: "Darsga bog'lanmagan" }, ...finished];
  }, [lessons]);

  function reset() {
    setTitle("");
    setDescription("");
    setGrading("");
    setDueDate("");
    setDueTime("23:59");
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
    try {
      await create.mutateAsync({
        courseId,
        title: title.trim(),
        description: description.trim(),
        body: description.trim(),
        // Muddat sana + vaqtdan yig'iladi; sana yo'q bo'lsa umuman yuborilmaydi.
        dueAt: dueDate ? `${dueDate}T${dueTime || "23:59"}` : undefined,
        // Til fani bo'lmasa tanlov ko'rsatilmagan — eskirgan qiymat ketmasin.
        skillKey: isLanguageSubject ? skillKey : "",
        lessonId: lessonId || null,
        extraInstructions: grading.trim(),
        file: file ? toUploadFile(file) : null,
      });
      close();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Vazifani yaratib bo'lmadi");
    }
  }

  return (
    <Sheet
      open={open}
      onClose={close}
      title="Yangi vazifa"
      description="Topshiriq, muddat va kerakli fayllarni bir joyda yuboring."
    >
      <Input
        label="Vazifa nomi"
        placeholder="Masalan: Kvadrat tenglamalar — 5 ta misol"
        value={title}
        onChangeText={setTitle}
      />

      <Input
        label="Vazifa matni"
        placeholder="Misollar, savollar, ko'rsatmalar…"
        value={description}
        onChangeText={setDescription}
        multiline
        inputStyle={styles.textarea}
      />

      <View style={styles.attachRow}>
        <IconButton accessibilityLabel="Fayl biriktirish" onPress={() => void attach()}>
          <FileUp size={22} color={palette["primary-text"]} />
        </IconButton>
        {file ? (
          <View style={[styles.file, { backgroundColor: palette["primary-tint"] }]}>
            <Paperclip size={14} color={palette["primary-text"]} />
            <Text variant="caption" numberOfLines={1} style={styles.fileName}>
              {file.name}
            </Text>
            <Text
              accessibilityRole="button"
              onPress={() => setFile(null)}
              variant="caption"
              tone="danger"
            >
              O'chirish
            </Text>
          </View>
        ) : (
          <Text variant="caption" tone="muted">
            PDF, DOCX yoki rasm biriktirish (ixtiyoriy)
          </Text>
        )}
      </View>

      <View style={styles.row}>
        <View style={styles.half}>
          <DateField label="Muddat" value={dueDate} onChange={setDueDate} optional />
        </View>
        <View style={styles.half}>
          <TimeField label="Vaqt" value={dueTime} onChange={setDueTime} />
        </View>
      </View>

      {/* Tekshiruv turi faqat til fanida ma'noli. */}
      {isLanguageSubject ? (
        <SelectField
          label="Tekshiruv turi"
          value={skillKey}
          options={SKILL_OPTIONS}
          onChange={setSkillKey}
        />
      ) : null}

      <SelectField
        label="Qaysi dars uchun"
        value={lessonId}
        options={lessonOptions}
        onChange={setLessonId}
      />

      <Input
        label="Baholash izohi — ixtiyoriy"
        placeholder="Masalan: har bir misol 2 balldan"
        value={grading}
        onChangeText={setGrading}
      />

      <Button
        title="Vazifani yuborish"
        size="lg"
        loading={create.isPending}
        disabled={!title.trim() || !description.trim()}
        onPress={() => void submit()}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  textarea: { minHeight: 110, textAlignVertical: "top" },
  row: { flexDirection: "row", gap: 12 },
  half: { flex: 1 },
  attachRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  file: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: radius.sm,
  },
  fileName: { flex: 1 },
});
