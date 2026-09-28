import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { FileUp, Paperclip } from "lucide-react-native";
import { useCreateAssignment, useUpdateAssignment } from "@/modules/homework";
import type { Assignment, Lesson } from "@/shared/types";
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
  assignment = null,
}: AddAssignmentSheetProps) {
  const { t } = useTranslation("mobile");
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
  const [dueDate, setDueDate] = useState(assignment?.dueAt ? assignment.dueAt.slice(0, 10) : "");
  const [dueTime, setDueTime] = useState(
    assignment?.dueAt ? assignment.dueAt.slice(11, 16) : "23:59"
  );
  const [skillKey, setSkillKey] = useState(assignment?.skillKey ?? "");
  const [lessonId, setLessonId] = useState(assignment?.lessonId ?? "");
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

    const values = {
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
      title={editing ? t("groupworkspace.vazifani_tahrirlash") : t("groupworkspace.yangi_vazifa")}
      description={t("groupworkspace.topshiriq_muddat_va_kerakli_fayllarni_bir_jo")}
    >
      <Input
        label={t("groupworkspace.vazifa_nomi")}
        placeholder={t("groupworkspace.masalan_kvadrat_tenglamalar_5_ta_misol")}
        value={title}
        onChangeText={setTitle}
      />

      <Input
        label={t("groupworkspace.vazifa_matni")}
        placeholder={t("groupworkspace.misollar_savollar_korsatmalar")}
        value={description}
        onChangeText={setDescription}
        multiline
        inputStyle={styles.textarea}
      />

      <View style={styles.attachRow}>
        <IconButton accessibilityLabel={t("groupworkspace.fayl_biriktirish")} onPress={() => void attach()}>
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
              {t("groupworkspace.ochirish")}
            </Text>
          </View>
        ) : (
          <Text variant="caption" tone="muted">
            {t("groupworkspace.pdf_docx_yoki_rasm_biriktirish_ixtiyoriy")}
          </Text>
        )}
      </View>

      <View style={styles.row}>
        <View style={styles.half}>
          <DateField label={t("groupworkspace.muddat")} value={dueDate} onChange={setDueDate} optional />
        </View>
        <View style={styles.half}>
          <TimeField label={t("groupworkspace.vaqt")} value={dueTime} onChange={setDueTime} />
        </View>
      </View>

      {/* Tekshiruv turi faqat til fanida ma'noli. */}
      {isLanguageSubject ? (
        <SelectField
          label={t("groupworkspace.tekshiruv_turi")}
          value={skillKey}
          options={SKILL_OPTIONS}
          onChange={setSkillKey}
        />
      ) : null}

      <SelectField
        label={t("groupworkspace.qaysi_dars_uchun")}
        value={lessonId}
        options={lessonOptions}
        onChange={setLessonId}
      />

      <Input
        label={t("groupworkspace.baholash_izohi_ixtiyoriy")}
        placeholder={t("groupworkspace.masalan_har_bir_misol_2_balldan")}
        value={grading}
        onChangeText={setGrading}
      />

      <Button
        title={editing ? t("groupworkspace.saqlash") : t("groupworkspace.vazifani_yuborish")}
        size="lg"
        loading={create.isPending || update.isPending}
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
