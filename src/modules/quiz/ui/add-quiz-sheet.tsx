import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Plus } from "lucide-react-native";
import { useSubjects } from "@/modules/course";
import type { QuizFormValues } from "@/shared/types";
import {
  Button,
  DateField,
  Input,
  SelectField,
  Sheet,
  Text,
  toast,
  useTheme,
  type SelectOption,
} from "@/shared/ui";
import {
  createDraft,
  draftToFormValues,
  validateDraft,
  type QuestionDraft,
} from "../lib/question-draft";
import { useCreateQuiz } from "../model/quiz.queries";
import { draftErrorMessage, QuestionEditor } from "./question-editor";

/*
 * Qoralama kalitlari — MODUL darajasidagi hisoblagich.
 *
 * Avval u `useRef` da edi va `useState` ning dangasa boshlagichida
 * o'qilardi. Boshlagich RENDER paytida ishlaydi, ref'ga esa render paytida
 * tegib bo'lmaydi (React qoidasi, ESLint ushlaydi).
 *
 * Kalitlar faqat React ro'yxati uchun kerak, shuning uchun o'sib boruvchi
 * son yetarli — u hech qachon takrorlanmaydi.
 */
let keySequence = 0;
function newKey(): string {
  keySequence += 1;
  return `k${keySequence}`;
}

export interface AddQuizSheetProps {
  open: boolean;
  onClose: () => void;
  /** O'qituvchining o'z kurslari. */
  courses: readonly { id: string; title: string }[];
  /** Oldindan tanlangan kurs (guruh ichidan ochilganda). */
  defaultCourseId?: string;
}

/**
 * Test yaratish — veb `quiz-create-dialog.tsx` ning mobil varianti.
 *
 * Savol qoralamasi va uning tekshiruvi ko'chirilgan `lib/question-draft.ts`
 * da: sakkizta savol turi, ularning har biri uchun alohida qoidalar va
 * formaga o'tkazish. Bu fayl faqat oyna qobig'i — test darajasidagi
 * maydonlar (kurs, fan, mavzu, sana) va savollar ro'yxati.
 *
 * Tekshiruv YUBORISHDAN OLDIN qilinadi va sabab ko'rsatiladi: backend
 * xatosi "400 Bad Request" dan foydaliroq.
 */
export function AddQuizSheet({ open, onClose, courses, defaultCourseId }: AddQuizSheetProps) {
  const { palette } = useTheme();
  const create = useCreateQuiz();
  const subjects = useSubjects(open);

  const [courseId, setCourseId] = useState(defaultCourseId ?? courses[0]?.id ?? "");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [opensAt, setOpensAt] = useState("");
  const [questions, setQuestions] = useState<QuestionDraft[]>(() => [createDraft("single", newKey)]);

  const courseOptions: SelectOption[] = courses.map((course) => ({
    value: course.id,
    label: course.title,
  }));

  function updateQuestion(key: string, update: (draft: QuestionDraft) => QuestionDraft) {
    setQuestions((current) =>
      current.map((question) => (question.key === key ? update(question) : question))
    );
  }

  function reset() {
    setSubject("");
    setTopic("");
    setTitle("");
    setDescription("");
    setDueAt("");
    setOpensAt("");
    setQuestions([createDraft("single", newKey)]);
  }

  function close() {
    reset();
    onClose();
  }

  /** Yuborishdan oldingi tekshiruv — sabab aniq ko'rsatiladi. */
  function validate(): string | null {
    if (!courseId) return "Kursni tanlang";
    if (!subject.trim()) return "Fanni tanlang";
    if (!topic.trim()) return "Mavzuni kiriting";
    if (!title.trim()) return "Test nomini kiriting";
    if (!questions.length) return "Kamida bitta savol qo'shing";
    for (const [index, draft] of questions.entries()) {
      const error = validateDraft(draft);
      if (error) return `${index + 1}-savol: ${draftErrorMessage(error)}`;
    }
    return null;
  }

  async function submit() {
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    const values: QuizFormValues = {
      courseId,
      subject: subject.trim(),
      topic: topic.trim(),
      title: title.trim(),
      description: description.trim(),
      dueAt: dueAt ? `${dueAt}T23:59` : null,
      opensAt: opensAt ? `${opensAt}T00:00` : null,
      questions: questions.map(draftToFormValues),
    };

    try {
      await create.mutateAsync(values);
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
      title="Yangi test"
      description="Sakkiz xil savol turi: variantli, matnli, moslashtirish, tartiblash va boshqalar."
    >
      {courses.length > 1 ? (
        <SelectField label="Kurs" value={courseId} options={courseOptions} onChange={setCourseId} />
      ) : null}

      <SelectField
        label="Fan"
        placeholder="Fanni tanlang"
        value={subject}
        options={(subjects.data ?? []).map((item) => ({ value: item.value, label: item.label }))}
        onChange={setSubject}
      />

      <Input
        label="Mavzu"
        value={topic}
        onChangeText={setTopic}
        placeholder="Masalan: Kvadrat tenglamalar"
      />

      <Input
        label="Test nomi"
        value={title}
        onChangeText={setTitle}
        placeholder="Masalan: 1-bob nazorati"
      />
      <Input
        label="Tavsif — ixtiyoriy"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <View style={styles.row}>
        <View style={styles.half}>
          <DateField label="Ochilish" value={opensAt} onChange={setOpensAt} optional />
        </View>
        <View style={styles.half}>
          <DateField label="Muddat" value={dueAt} onChange={setDueAt} optional />
        </View>
      </View>

      <Text variant="label">Savollar</Text>

      {questions.map((draft, index) => (
        <QuestionEditor
          key={draft.key}
          draft={draft}
          index={index}
          canRemove={questions.length > 1}
          newKey={newKey}
          onChange={(update) => updateQuestion(draft.key, update)}
          onRemove={() =>
            setQuestions((current) => current.filter((item) => item.key !== draft.key))
          }
        />
      ))}

      <Button
        title="Savol qo'shish"
        variant="secondary"
        icon={<Plus size={16} color={palette["secondary-foreground"]} />}
        onPress={() => setQuestions((current) => [...current, createDraft("single", newKey)])}
      />

      {/*
        * Tugma ATAYLAB o'chirilmaydi.
        *
        * Avval u `!title.trim()` da o'chardi va bosilganda HECH NARSA
        * bo'lmasdi — foydalanuvchi nima yetishmayotganini bilmasdi.
        * Endi u har doim bosiladi va `validate()` aniq sababni aytadi
        * ("Fanni tanlang", "3-savol: to'g'ri javobni belgilang").
        *
        * Bu ayniqsa muhim, chunki oynada bir-biriga o'xshash ikkita matn
        * maydoni bor: "Mavzu" va "Test nomi".
        */}
      <Button
        title="Testni yaratish"
        size="lg"
        loading={create.isPending}
        onPress={() => void submit()}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 10 },
  half: { flex: 1 },
});
