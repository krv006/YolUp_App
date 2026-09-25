import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Download, FileUp, Link2, Plus } from "lucide-react-native";
import { pickDocument, toUploadFile } from "@/shared/lib";
import type { QuizDetail, QuizEditValues, QuizFormValues } from "@/shared/types";
import {
  Button,
  DateField,
  Input,
  Separator,
  radius,
  SelectField,
  Sheet,
  Text,
  toast,
  useTheme,
  type SelectOption,
} from "@/shared/ui";
import type { ImportedQuiz } from "../api/quiz.api";
import { detectGoogleSource } from "../lib/google-import";
import {
  createDraft,
  draftToFormValues,
  questionToDraft,
  validateDraft,
  type QuestionDraft,
} from "../lib/question-draft";
import {
  useCreateQuiz,
  useDownloadQuizTemplate,
  useImportGoogleLink,
  useImportQuizDocx,
  usePublishQuiz,
  useUpdateQuiz,
} from "../model/quiz.queries";
import { draftErrorMessage, QuestionEditor } from "./question-editor";

/** Shablondagi namuna savollar soni — veb `quiz-create-dialog.tsx:32`. */
const TEMPLATE_QUESTION_COUNT = 10;

/**
 * Hujjat tanlash uchun MIME turlari.
 *
 * Android fayl tanlagichi kengaytmani emas, MIME ni tushunadi. `.docx` va
 * `.xlsx` — bu ikki uzun Office turi; qisqartirib bo'lmaydi, aks holda
 * tanlagich hamma faylni ko'rsatadi va foydalanuvchi backend qabul
 * qilmaydigan narsani tanlaydi.
 */
/**
 * ISO sanani `DateField` kutadigan `YYYY-MM-DD` ga keltiradi.
 *
 * Backend `due_at` ni vaqt bilan qaytaradi ("2026-09-30T23:59:00Z"),
 * maydon esa faqat kunni ko'rsatadi. Vaqt qismini yuborishda qayta
 * qo'shamiz (`T23:59`), shuning uchun bu yerda kesib tashlash xavfsiz.
 */
function toDateValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

const IMPORT_MIME_TYPES = [
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

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
  /** O'qituvchining o'z kurslari — KURS rejimida ishlatiladi. */
  courses: readonly { id: string; title: string }[];
  /**
   * Fanlar ro'yxati. Berilsa — oyna FAN rejimiga o'tadi (veb `subjectMode`).
   * Berilmasa — KURS rejimi.
   */
  subjects?: readonly { value: string; label: string }[];
  /** Oldindan tanlangan kurs (guruh ichidan ochilganda). */
  defaultCourseId?: string;
  /**
   * Fayldan yoki Google havoladan import muvaffaqiyatli tugaganda.
   *
   * Import testni SERVERDA yaratadi (qoralama holatida) va to'liq
   * ma'lumotini qaytaradi — shuning uchun oyna yopiladi va natijani
   * sahifa ko'rsatadi.
   */
  onImported?: (result: ImportedQuiz) => void;
  /**
   * Berilsa — oyna TAHRIRLASH rejimida ochiladi (veb `editQuiz`).
   *
   * MUHIM: bu holatda oynani `key={quiz.id}` bilan va FAQAT ma'lumot
   * kelgandan keyin chizish kerak (veb `teacher-quizzes-page.tsx:189`
   * ham shunday qiladi). Maydonlarning boshlang'ich qiymati `useState`
   * da, u esa faqat mount paytida hisoblanadi — oldindan chizilgan oyna
   * bo'sh qolib ketadi.
   */
  editQuiz?: QuizDetail | null;
  /**
   * Testda urinishlar bor — savollar o'zgartirilmaydi.
   * Ball va savollar o'zgarsa, topshirgan o'quvchilarning natijasi
   * ma'nosini yo'qotadi.
   */
  questionsLocked?: boolean;
}

/**
 * Test yaratish — veb `quiz-create-dialog.tsx` ning mobil varianti.
 *
 * IKKI REJIM, veb bilan bir xil (`quiz-create-dialog.tsx:88-89`):
 *
 *   · FAN rejimi (`subjects` berilgan) — test KURSGA emas, FANGA
 *     biriktiriladi. Testlar sahifasidan ochilganda shu rejim ishlaydi:
 *     u yerda kurs konteksti umuman yo'q. Backendga `course: null` ketadi.
 *   · KURS rejimi (`subjects` berilmagan) — test aniq bir guruhga
 *     biriktiriladi, fan so'ralmaydi.
 *
 * Ikkalasi bir vaqtda talab qilinmaydi.
 *
 * Savol qoralamasi va uning tekshiruvi ko'chirilgan `lib/question-draft.ts`
 * da: sakkizta savol turi, ularning har biri uchun alohida qoidalar va
 * formaga o'tkazish. Bu fayl faqat oyna qobig'i — test darajasidagi
 * maydonlar va savollar ro'yxati.
 *
 * Tekshiruv YUBORISHDAN OLDIN qilinadi va sabab ko'rsatiladi: backend
 * xatosi "400 Bad Request" dan foydaliroq.
 */
export function AddQuizSheet({
  open,
  onClose,
  courses,
  subjects,
  defaultCourseId,
  onImported,
  editQuiz = null,
  questionsLocked = false,
}: AddQuizSheetProps) {
  const { palette } = useTheme();
  const create = useCreateQuiz();
  const update = useUpdateQuiz();
  const publish = usePublishQuiz();
  const importFile = useImportQuizDocx();
  const importGoogle = useImportGoogleLink();
  const downloadTemplate = useDownloadQuizTemplate();

  const subjectMode = Boolean(subjects);
  const editing = Boolean(editQuiz);
  const isDraft = editQuiz?.status === "draft";

  /*
   * Kurs HISOBLANADI, holatda saqlanmaydi (veb `quiz-create-dialog.tsx:89`).
   *
   * Avval u `useState(courses[0]?.id ?? "")` edi va shu sababli buzilgan edi:
   * oyna sahifa bilan birga, `open={false}` holatida mount bo'ladi — o'shanda
   * kurslar hali yuklanmagan va ro'yxat bo'sh. `useState` ning boshlang'ich
   * qiymati faqat BIR MARTA hisoblanadi, shuning uchun kurslar kelganda ham
   * qiymat "" bo'lib qolardi va "Kursni tanlang" xatosi chiqaverardi.
   */
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const courseId = subjectMode
    ? ""
    : selectedCourseId || defaultCourseId || courses[0]?.id || "";

  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState(editQuiz?.topic ?? "");
  const [title, setTitle] = useState(editQuiz?.title ?? "");
  const [description, setDescription] = useState(editQuiz?.description ?? "");
  const [dueAt, setDueAt] = useState(toDateValue(editQuiz?.dueAt));
  const [opensAt, setOpensAt] = useState(toDateValue(editQuiz?.opensAt));
  const [questions, setQuestions] = useState<QuestionDraft[]>(() =>
    editQuiz
      ? editQuiz.questions.map((question) => questionToDraft(question, newKey))
      : [createDraft("single", newKey)]
  );
  const [googleOpen, setGoogleOpen] = useState(false);
  const [googleUrl, setGoogleUrl] = useState("");

  const importing = importFile.isPending || importGoogle.isPending;

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
    setSelectedCourseId("");
    setSubject("");
    setTopic("");
    setTitle("");
    setDescription("");
    setDueAt("");
    setOpensAt("");
    setQuestions([createDraft("single", newKey)]);
    setGoogleOpen(false);
    setGoogleUrl("");
  }

  function close() {
    reset();
    onClose();
  }

  /**
   * Testning "manzili" — veb `targetError()` (quiz-create-dialog.tsx:230).
   * Rejimga qarab FAN yoki KURS talab qilinadi, ikkalasi emas.
   */
  function targetError(): string | null {
    // Tahrirlashda fan/kurs o'zgarmaydi — faqat mavzu tekshiriladi.
    if (!editing && subjectMode && !subject.trim()) return "Fanni tanlang";
    if (!editing && !subjectMode && !courseId) return "Kursni tanlang";
    return topic.trim() ? null : "Mavzuni kiriting";
  }

  /**
   * Yuborishdan oldingi tekshiruv — sabab aniq ko'rsatiladi.
   *
   * "Test nomi" ATAYLAB tekshirilmaydi: veb ham uni talab qilmaydi
   * (`quizDisplayTitle` bo'sh nomni mavzu bilan almashtiradi).
   */
  function validate(): string | null {
    const missingTarget = targetError();
    if (missingTarget) return missingTarget;
    // Savollar qulflangan bo'lsa ular yuborilmaydi — tekshiruv ham keraksiz.
    if (questionsLocked) return null;
    if (!questions.length) return "Kamida bitta savol qo'shing";
    for (const [index, draft] of questions.entries()) {
      const error = validateDraft(draft);
      if (error) return `${index + 1}-savol: ${draftErrorMessage(error)}`;
    }
    return null;
  }

  /**
   * Import so'rovining "manzil" qismi — veb `importRequest()`
   * (quiz-create-dialog.tsx:163). Savollar fayldan keladi, lekin test
   * qaysi fan/kursga tegishli ekanini baribir biz aytamiz.
   */
  function importRequest() {
    return {
      topic: topic.trim(),
      courseId: subjectMode ? null : courseId,
      subject: subjectMode ? subject : undefined,
      title: title.trim(),
    };
  }

  function applyImported(result: ImportedQuiz) {
    onImported?.(result);
    close();
  }

  async function importFromFile() {
    const missingTarget = targetError();
    if (missingTarget) {
      toast.error(missingTarget);
      return;
    }

    const picked = await pickDocument(IMPORT_MIME_TYPES);
    if (!picked) return;

    importFile.mutate(
      { file: toUploadFile(picked), request: importRequest() },
      { onSuccess: applyImported }
    );
  }

  function importFromGoogle() {
    const missingTarget = targetError();
    if (missingTarget) {
      toast.error(missingTarget);
      return;
    }

    const source = detectGoogleSource(googleUrl);
    if (!source) {
      toast.error("Havola Google Hujjat yoki Google Forma havolasi bo'lishi kerak");
      return;
    }

    importGoogle.mutate(
      { source, url: googleUrl.trim(), request: importRequest() },
      { onSuccess: applyImported }
    );
  }

  async function submit() {
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    if (editing) {
      /*
       * Tahrirlashda FAQAT o'zgarishi mumkin bo'lgan maydonlar ketadi
       * (veb `quiz-create-dialog.tsx:292`). Fan va kurs yuborilmaydi —
       * ular testning "manzili" va o'zgartirilmaydi.
       */
      const patch: QuizEditValues = {
        topic: topic.trim(),
        title: title.trim(),
        description: description.trim(),
        dueAt: dueAt ? `${dueAt}T23:59` : null,
        opensAt: opensAt ? `${opensAt}T00:00` : null,
        ...(questionsLocked ? {} : { questions: questions.map(draftToFormValues) }),
      };

      try {
        await update.mutateAsync({ id: editQuiz!.id, values: patch });
        close();
      } catch {
        // Xatoni mutatsiyaning `onError` i chiqaradi (izoh quyida).
      }
      return;
    }

    const values: QuizFormValues = {
      // FAN rejimida `courseId` bo'sh — `mapQuizRequest` uni `null` ga aylantiradi.
      courseId,
      subject: subjectMode ? subject.trim() : undefined,
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
      title={editing ? "Testni tahrirlash" : "Yangi test"}
      description={
        editing
          ? "Mavzu, nom va savollarni o'zgartirishingiz mumkin."
          : "Sakkiz xil savol turi: variantli, matnli, moslashtirish, tartiblash va boshqalar."
      }
    >
      {isDraft ? (
        <View
          style={[
            styles.notice,
            { backgroundColor: palette["primary-tint"], borderColor: palette["border-accent"] },
          ]}
        >
          <Text variant="caption">
            Bu test qoralama — o&apos;quvchilarga ko&apos;rinmaydi. To&apos;g&apos;ri javoblarni
            to&apos;ldirib, &quot;E&apos;lon qilish&quot;ni bosing.
          </Text>
        </View>
      ) : null}

      {questionsLocked ? (
        <View
          style={[
            styles.notice,
            { backgroundColor: palette.muted, borderColor: palette.border },
          ]}
        >
          <Text variant="caption">
            Bu testda urinishlar bor — savollar o&apos;zgartirilmaydi. Faqat mavzu, nom va muddat
            saqlanadi.
          </Text>
        </View>
      ) : null}

      {/* Fan va kurs testning "manzili" — tahrirlashda o'zgartirilmaydi. */}
      {editing ? null : subjectMode ? (
        <SelectField
          label="Fan"
          placeholder="Fanni tanlang"
          value={subject}
          options={(subjects ?? []).map((item) => ({ value: item.value, label: item.label }))}
          onChange={setSubject}
        />
      ) : courses.length > 1 ? (
        <SelectField
          label="Kurs"
          value={courseId}
          options={courseOptions}
          onChange={setSelectedCourseId}
        />
      ) : null}

      <Input
        label="Mavzu"
        value={topic}
        onChangeText={setTopic}
        placeholder="Masalan: Kvadrat tenglamalar"
      />

      {/*
        * "Mavzu" va "Test nomi" bir-biriga o'xshaydi va chalkashtiriladi.
        * Shuning uchun nom maydoni ochiq-oydin IXTIYORIY deb belgilangan —
        * veb ham uni talab qilmaydi, bo'sh qolsa mavzu nom bo'lib ishlaydi.
        */}
      <Input
        label="Test nomi — ixtiyoriy"
        value={title}
        onChangeText={setTitle}
        placeholder="Bo'sh qolsa mavzu nom bo'ladi"
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

      {/* Import faqat YANGI test uchun — mavjud testni fayl bilan almashtirmaymiz. */}
      {editing ? null : (
        <>
        <Separator />

        {/*
          * TAYYOR FAYLDAN — veb `quiz-import-row` ning mobil varianti.
          *
          * Vebda bu yashirin `<input type="file">` va uni bosadigan tugma
          * edi; mobilda fayl tanlagich tizim oynasi, shuning uchun tugmaning
          * o'zi yetarli.
          *
          * Blok savollardan OLDIN turadi: import savollarni o'zi yasaydi,
          * shuning uchun foydalanuvchi qo'lda yozishni boshlashidan oldin
          * uni ko'rishi kerak.
          */}
        <Text variant="label">Tayyor fayldan</Text>
        <Text variant="caption" tone="muted">
          Savollar fayldan o'qiladi. Fan va mavzu baribir yuqorida to'ldirilishi kerak.
        </Text>

        <View style={styles.row}>
          <View style={styles.half}>
            <Button
              title="Word / Excel"
              variant="secondary"
              loading={importFile.isPending}
              disabled={importing}
              icon={<FileUp size={16} color={palette["secondary-foreground"]} />}
              onPress={() => void importFromFile()}
            />
          </View>
          <View style={styles.half}>
            <Button
              title="Google havola"
              variant="secondary"
              disabled={importing}
              icon={<Link2 size={16} color={palette["secondary-foreground"]} />}
              onPress={() => setGoogleOpen((current) => !current)}
            />
          </View>
        </View>

        {googleOpen ? (
          <>
            <Input
              label="Google Hujjat yoki Forma havolasi"
              value={googleUrl}
              onChangeText={setGoogleUrl}
              placeholder="https://docs.google.com/document/..."
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <Text variant="caption" tone="muted">
              Havola &quot;havolaga ega har kim ko'ra oladi&quot; qilib ochilgan bo'lsin.
            </Text>
            <Button
              title="Havoladan import qilish"
              loading={importGoogle.isPending}
              disabled={importing || !googleUrl.trim()}
              onPress={importFromGoogle}
            />
          </>
        ) : null}

        <Text variant="caption" tone="muted">
          Shablon yuklab olish — to'ldirib, yuqoridagi tugma orqali qaytaring:
        </Text>
        <View style={styles.row}>
          <View style={styles.half}>
            <Button
              title="Word shabloni"
              variant="ghost"
              disabled={downloadTemplate.isPending}
              icon={<Download size={16} color={palette["primary-text"]} />}
              onPress={() =>
                downloadTemplate.mutate({ type: "docx", count: TEMPLATE_QUESTION_COUNT })
              }
            />
          </View>
          <View style={styles.half}>
            <Button
              title="Excel shabloni"
              variant="ghost"
              disabled={downloadTemplate.isPending}
              icon={<Download size={16} color={palette["primary-text"]} />}
              onPress={() =>
                downloadTemplate.mutate({ type: "xlsx", count: TEMPLATE_QUESTION_COUNT })
              }
            />
          </View>
        </View>

        <Separator />
        </>
      )}

      {/*
        * Qulflangan holatda savollar CHIZILMAYDI ham (veb ham shunday
        * qiladi). Faqat o'chirib qo'yish yetarli emas: o'qituvchi
        * o'zgartirmoqchi bo'lib urinib ko'radi va nima uchun ishlamayotganini
        * tushunmaydi. Yuqoridagi izoh sababni aytadi.
        */}
      {questionsLocked ? null : (
        <>
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
        </>
      )}

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
        title={editing ? "Saqlash" : "Testni yaratish"}
        size="lg"
        variant={isDraft ? "secondary" : "primary"}
        loading={create.isPending || update.isPending}
        onPress={() => void submit()}
      />

      {/*
        * E'lon qilish faqat qoralamada. Tugma SAQLASHDAN keyin turadi,
        * chunki tartib shunday: avval to'g'ri javoblarni to'ldirasiz,
        * keyin e'lon qilasiz.
        */}
      {isDraft ? (
        <Button
          title="E'lon qilish"
          size="lg"
          loading={publish.isPending}
          onPress={() => {
            if (!editQuiz) return;
            /*
             * `usePublishQuiz` da `onError` yo'q (veb bilan bayt-bayt bir
             * xil, o'zgartirilmaydi) — xato shu yerda ushlanadi.
             */
            publish.mutate(editQuiz.id, {
              onSuccess: close,
              onError: (error: Error) => toast.error(error.message),
            });
          }}
        />
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 10 },
  half: { flex: 1 },
  notice: {
    padding: 12,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
