import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Check, CircleAlert, X } from "lucide-react-native";
import { useQuiz, useQuizAttempts, useSubmitQuizAttempt } from "@/modules/quiz";
import { formatDayTime } from "@/shared/lib";
import type { QuizAttemptResult, QuizQuestion } from "@/shared/types";
import {
  Badge,
  Button,
  IconButton,
  MIN_TOUCH_SIZE,
  radius,
  Screen,
  ScreenEmpty,
  ScreenError,
  ScreenLoading,
  Separator,
  Text,
  useTheme,
} from "@/shared/ui";

type Answers = Record<string, string | null>;

/**
 * Testni yechish va urinishlar tarixi — bitta to'liq ekran.
 *
 * Veb'da ikkita alohida DIALOG edi (`QuizAttemptDialog`, `QuizAttemptsDialog`).
 * Mobilda dialog yaramaydi: savollar uzun va tasodifan tashqariga bosish
 * javoblarni yo'qotardi. Tarix esa `?tab=history` bilan shu ekranning
 * o'zida ochiladi — alohida marshrut qo'shish ortiqcha bo'lardi.
 */
export function QuizAttemptPage() {
  const router = useRouter();
  const { palette } = useTheme();
  const { quizId, tab } = useLocalSearchParams<{ quizId: string; tab?: string }>();

  const [answers, setAnswers] = useState<Answers>({});
  const [result, setResult] = useState<QuizAttemptResult | null>(null);
  const [showHistory, setShowHistory] = useState(tab === "history");

  const quiz = useQuiz(quizId ?? null);
  const attempts = useQuizAttempts(quizId ?? null, showHistory);
  const submit = useSubmitQuizAttempt();

  const questions = useMemo(
    () => [...(quiz.data?.questions ?? [])].sort((a, b) => a.order - b.order),
    [quiz.data?.questions]
  );

  const answeredCount = questions.filter((question) => answers[question.id]).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  async function send() {
    if (!quizId) return;
    const payload = questions.map((question) => ({
      questionId: question.id,
      selectedOptionId: answers[question.id] ?? null,
    }));
    const attempt = await submit.mutateAsync({ quizId, answers: payload });
    setResult(attempt);
  }

  if (quiz.isLoading) {
    return (
      <Screen>
        <ScreenLoading label="Test yuklanmoqda…" />
      </Screen>
    );
  }

  if (quiz.isError || !quiz.data) {
    return (
      <Screen>
        <ScreenError message="Testni yuklab bo'lmadi" onRetry={() => void quiz.refetch()} />
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <View style={[styles.head, { borderBottomColor: palette.border }]}>
        <IconButton accessibilityLabel="Orqaga" onPress={goBack}>
          <ArrowLeft size={22} color={palette.foreground} />
        </IconButton>
        <View style={styles.headBody}>
          <Text variant="label" numberOfLines={1}>
            {quiz.data.title}
          </Text>
          <Text variant="caption" tone="muted">
            {result
              ? "Natija"
              : showHistory
                ? "Urinishlar tarixi"
                : `${answeredCount}/${questions.length} javob berildi`}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setShowHistory((value) => !value);
            setResult(null);
          }}
          hitSlop={8}
          style={styles.tabToggle}
        >
          <Text variant="caption" tone="brand">
            {showHistory ? "Yechish" : "Tarix"}
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {showHistory ? (
          <AttemptsHistory
            loading={attempts.isLoading}
            items={attempts.data ?? []}
          />
        ) : result ? (
          <AttemptResult result={result} onRetake={() => {
            setResult(null);
            setAnswers({});
          }} />
        ) : (
          <>
            {quiz.data.description ? (
              <Text tone="muted" style={styles.description}>
                {quiz.data.description}
              </Text>
            ) : null}

            {questions.length === 0 ? (
              <ScreenEmpty title="Bu testda savol yo'q" />
            ) : (
              questions.map((question, index) => (
                <QuestionCard
                  key={question.id}
                  index={index + 1}
                  question={question}
                  selected={answers[question.id] ?? null}
                  onSelect={(optionId) =>
                    setAnswers((current) => ({ ...current, [question.id]: optionId }))
                  }
                />
              ))
            )}

            {questions.length > 0 ? (
              <View style={styles.submit}>
                {!allAnswered ? (
                  <View style={styles.warning}>
                    <CircleAlert size={15} color={palette.warning} />
                    <Text variant="caption" tone="muted">
                      Javob berilmagan savollar xato deb hisoblanadi.
                    </Text>
                  </View>
                ) : null}
                <Button
                  title="Topshirish"
                  size="lg"
                  loading={submit.isPending}
                  onPress={() => void send()}
                />
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function QuestionCard({
  index,
  question,
  selected,
  onSelect,
}: {
  index: number;
  question: QuizQuestion;
  selected: string | null;
  onSelect: (optionId: string) => void;
}) {
  const { palette } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
      <View style={styles.questionHead}>
        <Text variant="caption" tone="brand">
          {index}-savol
        </Text>
        <Badge label={`${question.points} ball`} tone="neutral" />
      </View>
      <Text variant="label">{question.text}</Text>

      <View style={styles.options}>
        {question.options.map((option) => {
          const active = selected === option.id;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              onPress={() => onSelect(option.id)}
              style={({ pressed }) => [
                styles.option,
                {
                  borderColor: active ? palette.primary : palette.border,
                  backgroundColor: active ? palette["primary-tint"] : palette.surface,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <View
                style={[
                  styles.radio,
                  { borderColor: active ? palette.primary : palette["border-strong"] },
                ]}
              >
                {active ? (
                  <View style={[styles.radioDot, { backgroundColor: palette.primary }]} />
                ) : null}
              </View>
              <Text style={styles.optionText}>{option.text}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function AttemptResult({
  result,
  onRetake,
}: {
  result: QuizAttemptResult;
  onRetake: () => void;
}) {
  const { palette } = useTheme();
  const percent = result.maxScore > 0 ? Math.round((result.score / result.maxScore) * 100) : 0;

  return (
    <>
      <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <Text variant="caption" tone="muted">
          Natijangiz
        </Text>
        <Text variant="title">
          {result.score} / {result.maxScore}
        </Text>
        <Badge
          label={`${percent}%`}
          tone={percent >= 80 ? "success" : percent >= 50 ? "warning" : "danger"}
        />
      </View>

      {result.answers.map((answer, index) => (
        <View
          key={answer.questionId}
          style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}
        >
          <View style={styles.questionHead}>
            <Text variant="caption" tone="muted">
              {index + 1}-savol
            </Text>
            {answer.isCorrect ? (
              <Check size={18} color={palette.success} />
            ) : (
              <X size={18} color={palette.destructive} />
            )}
          </View>
          <Text variant="label">{answer.questionText}</Text>

          <Text variant="caption" tone="muted">
            Sizning javobingiz: {answer.selectedOptionText ?? "javob berilmagan"}
          </Text>

          {/* To'g'ri javob HAR DOIM ko'rsatiladi — o'quvchi xatosidan o'rgansin. */}
          {!answer.isCorrect && answer.correctOption ? (
            <Text variant="caption" style={{ color: palette["success-strong"] }}>
              To'g'ri javob: {answer.correctOption.text}
            </Text>
          ) : null}
        </View>
      ))}

      <Button title="Qayta yechish" variant="secondary" onPress={onRetake} />
    </>
  );
}

function AttemptsHistory({
  loading,
  items,
}: {
  loading: boolean;
  items: { id: string; score: number; maxScore: number; createdAt: string; studentName: string }[];
}) {
  const { palette } = useTheme();

  if (loading) return <ScreenLoading label="Tarix yuklanmoqda…" />;
  if (items.length === 0) {
    return <ScreenEmpty title="Urinishlar yo'q" description="Testni birinchi marta yeching." />;
  }

  return (
    <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
      {items.map((attempt, index) => (
        <View key={attempt.id}>
          {index > 0 ? <Separator /> : null}
          <View style={styles.attemptRow}>
            <View style={styles.attemptBody}>
              <Text variant="label">
                {attempt.score} / {attempt.maxScore}
              </Text>
              <Text variant="caption" tone="muted">
                {formatDayTime(attempt.createdAt)}
              </Text>
            </View>
            <Text variant="caption" tone="muted">
              {attempt.studentName}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headBody: { flex: 1, gap: 2 },
  tabToggle: { paddingHorizontal: 12, minHeight: MIN_TOUCH_SIZE, justifyContent: "center" },
  body: { padding: 16, gap: 12, paddingBottom: 40 },
  description: { paddingBottom: 4 },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: 14,
    gap: 8,
  },
  questionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  options: { gap: 8, paddingTop: 4 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: MIN_TOUCH_SIZE,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  optionText: { flex: 1 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  submit: { gap: 12, paddingTop: 8 },
  warning: { flexDirection: "row", alignItems: "center", gap: 8 },
  attemptRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10 },
  attemptBody: { gap: 2 },
});
