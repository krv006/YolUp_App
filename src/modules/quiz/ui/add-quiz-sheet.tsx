import { useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Check, Plus, Trash2 } from "lucide-react-native";
import type { QuizFormValues } from "@/shared/types";
import {
  Button,
  DateField,
  IconButton,
  Input,
  MIN_TOUCH_SIZE,
  radius,
  SelectField,
  Sheet,
  Text,
  toast,
  useTheme,
  type SelectOption,
} from "@/shared/ui";
import { useCreateQuiz } from "../model/quiz.queries";

interface OptionDraft {
  key: string;
  text: string;
}

interface QuestionDraft {
  key: string;
  text: string;
  points: string;
  options: OptionDraft[];
  /** Bitta savolda faqat BITTA to'g'ri javob (veb bilan bir xil qoida). */
  correctKey: string | null;
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
 * Test yaratish — veb `quiz-create-dialog.tsx` (349 qator) ning mobil
 * varianti.
 *
 * Savollar ro'yxati o'suvchi: har savolga kamida ikkita variant va bitta
 * to'g'ri javob kerak. Tekshiruv YUBORISHDAN OLDIN qilinadi va sabab
 * ko'rsatiladi — backend xatosi "400 Bad Request" dan foydaliroq.
 */
export function AddQuizSheet({ open, onClose, courses, defaultCourseId }: AddQuizSheetProps) {
  const { palette } = useTheme();
  const create = useCreateQuiz();

  const nextKey = useRef(0);
  function newKey() {
    nextKey.current += 1;
    return `k${nextKey.current}`;
  }

  const [courseId, setCourseId] = useState(defaultCourseId ?? courses[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [opensAt, setOpensAt] = useState("");
  const [questions, setQuestions] = useState<QuestionDraft[]>(() => [
    { key: "q0", text: "", points: "1", options: [{ key: "o0", text: "" }, { key: "o1", text: "" }], correctKey: null },
  ]);

  const courseOptions: SelectOption[] = courses.map((course) => ({
    value: course.id,
    label: course.title,
  }));

  function updateQuestion(key: string, patch: Partial<QuestionDraft>) {
    setQuestions((current) =>
      current.map((question) => (question.key === key ? { ...question, ...patch } : question))
    );
  }

  function updateOption(questionKey: string, optionKey: string, text: string) {
    setQuestions((current) =>
      current.map((question) =>
        question.key === questionKey
          ? {
              ...question,
              options: question.options.map((option) =>
                option.key === optionKey ? { ...option, text } : option
              ),
            }
          : question
      )
    );
  }

  function addQuestion() {
    setQuestions((current) => [
      ...current,
      {
        key: newKey(),
        text: "",
        points: "1",
        options: [{ key: newKey(), text: "" }, { key: newKey(), text: "" }],
        correctKey: null,
      },
    ]);
  }

  function removeQuestion(key: string) {
    setQuestions((current) => (current.length > 1 ? current.filter((q) => q.key !== key) : current));
  }

  function addOption(questionKey: string) {
    setQuestions((current) =>
      current.map((question) =>
        question.key === questionKey
          ? { ...question, options: [...question.options, { key: newKey(), text: "" }] }
          : question
      )
    );
  }

  function removeOption(questionKey: string, optionKey: string) {
    setQuestions((current) =>
      current.map((question) => {
        if (question.key !== questionKey || question.options.length <= 2) return question;
        return {
          ...question,
          options: question.options.filter((option) => option.key !== optionKey),
          // To'g'ri javob o'chirilsa tanlov bekor bo'ladi.
          correctKey: question.correctKey === optionKey ? null : question.correctKey,
        };
      })
    );
  }

  function reset() {
    setTitle("");
    setDescription("");
    setDueAt("");
    setOpensAt("");
    setQuestions([
      { key: "q0", text: "", points: "1", options: [{ key: "o0", text: "" }, { key: "o1", text: "" }], correctKey: null },
    ]);
  }

  function close() {
    reset();
    onClose();
  }

  /** Yuborishdan oldingi tekshiruv — sabab aniq ko'rsatiladi. */
  function validate(): string | null {
    if (!courseId) return "Kursni tanlang";
    if (!title.trim()) return "Test nomini kiriting";
    for (const [index, question] of questions.entries()) {
      if (!question.text.trim()) return `${index + 1}-savol matni bo'sh`;
      const filled = question.options.filter((option) => option.text.trim());
      if (filled.length < 2) return `${index + 1}-savolda kamida 2 ta variant bo'lsin`;
      if (!question.correctKey) return `${index + 1}-savolda to'g'ri javobni belgilang`;
      const correct = question.options.find((option) => option.key === question.correctKey);
      if (!correct?.text.trim()) return `${index + 1}-savolda to'g'ri javob bo'sh`;
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
      title: title.trim(),
      description: description.trim(),
      dueAt: dueAt ? `${dueAt}T23:59` : null,
      opensAt: opensAt ? `${opensAt}T00:00` : null,
      questions: questions.map((question) => ({
        text: question.text.trim(),
        points: Number(question.points) || 1,
        options: question.options
          .filter((option) => option.text.trim())
          .map((option) => ({
            text: option.text.trim(),
            isCorrect: option.key === question.correctKey,
          })),
      })),
    };

    try {
      await create.mutateAsync(values);
      close();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Testni yaratib bo'lmadi");
    }
  }

  return (
    <Sheet
      open={open}
      onClose={close}
      title="Yangi test"
      description="Savollar va variantlarni qo'shing, to'g'ri javobni belgilang."
    >
      {courses.length > 1 ? (
        <SelectField label="Kurs" value={courseId} options={courseOptions} onChange={setCourseId} />
      ) : null}

      <Input label="Test nomi" value={title} onChangeText={setTitle} placeholder="Masalan: 1-bob nazorati" />
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

      {questions.map((question, index) => (
        <View
          key={question.key}
          style={[styles.question, { backgroundColor: palette.card, borderColor: palette.border }]}
        >
          <View style={styles.questionHead}>
            <Text variant="label" style={styles.questionTitle}>
              {index + 1}-savol
            </Text>
            <Input
              value={question.points}
              onChangeText={(value) => updateQuestion(question.key, { points: value })}
              keyboardType="number-pad"
              containerStyle={styles.pointsBox}
              inputStyle={styles.points}
            />
            {questions.length > 1 ? (
              <IconButton
                accessibilityLabel={`${index + 1}-savolni o'chirish`}
                onPress={() => removeQuestion(question.key)}
              >
                <Trash2 size={18} color={palette.destructive} />
              </IconButton>
            ) : null}
          </View>

          <Input
            placeholder="Savol matni"
            value={question.text}
            onChangeText={(value) => updateQuestion(question.key, { text: value })}
            multiline
          />

          {question.options.map((option, optionIndex) => {
            const correct = question.correctKey === option.key;
            return (
              <View key={option.key} style={styles.optionRow}>
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ selected: correct }}
                  accessibilityLabel={`${optionIndex + 1}-variantni to'g'ri deb belgilash`}
                  onPress={() => updateQuestion(question.key, { correctKey: option.key })}
                  style={[
                    styles.correctToggle,
                    {
                      backgroundColor: correct ? palette.success : palette.secondary,
                      borderColor: correct ? palette.success : palette["border-strong"],
                    },
                  ]}
                >
                  <Check
                    size={16}
                    color={correct ? palette["primary-foreground"] : palette["muted-foreground"]}
                  />
                </Pressable>

                <View style={styles.optionInput}>
                  <Input
                    placeholder={`${optionIndex + 1}-variant`}
                    value={option.text}
                    onChangeText={(value) => updateOption(question.key, option.key, value)}
                  />
                </View>

                {question.options.length > 2 ? (
                  <IconButton
                    accessibilityLabel="Variantni o'chirish"
                    onPress={() => removeOption(question.key, option.key)}
                  >
                    <Trash2 size={16} color={palette["muted-foreground"]} />
                  </IconButton>
                ) : null}
              </View>
            );
          })}

          <Button
            title="Variant qo'shish"
            variant="ghost"
            fullWidth={false}
            icon={<Plus size={15} color={palette["primary-text"]} />}
            onPress={() => addOption(question.key)}
          />
        </View>
      ))}

      <Button
        title="Savol qo'shish"
        variant="secondary"
        icon={<Plus size={16} color={palette["secondary-foreground"]} />}
        onPress={addQuestion}
      />

      <Button title="Testni yaratish" size="lg" loading={create.isPending} onPress={() => void submit()} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 12 },
  half: { flex: 1 },
  question: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: 12,
    gap: 10,
  },
  questionHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  questionTitle: { flex: 1 },
  pointsBox: { width: 64 },
  points: { textAlign: "center" },
  optionRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  correctToggle: {
    width: MIN_TOUCH_SIZE,
    height: MIN_TOUCH_SIZE,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  optionInput: { flex: 1 },
});
