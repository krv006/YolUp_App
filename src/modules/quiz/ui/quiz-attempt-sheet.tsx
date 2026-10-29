import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { CheckCircle2, CircleDot, Clock3, XCircle } from "lucide-react-native";
import type { QuizAnswerValue, QuizAttemptAnswer, QuizAttemptResult, QuizDetail } from "@/shared/types";
import { Sheet, SheetButton, Text, useTheme } from "@/shared/ui";
import { blankTextForDisplay, emptyAnswer } from "../lib/answer-value";
import { groupQuestions } from "../lib/group-questions";
import { useQuiz, useSubmitQuizAttempt } from "../model/quiz.queries";
import { QuestionAnswerInput, QuestionPrompt } from "./question-answer-input";
import { QuizGroupPanel } from "./quiz-group-panel";
import { useQuizColors } from "./quiz-colors";

export interface QuizAttemptSheetProps {
  quizId: string | null;
  open: boolean;
  onClose: () => void;
}

/**
 * Testni yechish — veb `modules/quiz/ui/quiz-attempt-dialog.tsx` porti.
 *
 * Vebda telefonda bu deyarli butun ekranli pastki oyna; bu yerda ham
 * `Sheet`. Tuzilish va uslublar `legacy.css` dan:
 *   guruh paneli  fon #f6faff, chegara 1, radius 16, bo'shliq 14, oraliq 10;
 *                 matn 14/22.4, balandligi ko'pi bilan 320 (ichida suriladi)
 *   savol         oq, chegara 1, radius 16, bo'shliq 14, oraliq 8;
 *                 bosh qator 12/800 KATTA HARF
 *   natija        ball qutisi (action-tint) va har savol qatori
 *                 (to'g'ri — yashil, xato — qizil, qisman/insho — sariq)
 */
export function QuizAttemptSheet({ quizId, open, onClose }: QuizAttemptSheetProps) {
  const { t } = useTranslation("quiz");
  const quiz = useQuiz(open ? quizId : null);
  const submit = useSubmitQuizAttempt();
  const [answers, setAnswers] = useState<Record<string, QuizAnswerValue>>({});
  const [result, setResult] = useState<QuizAttemptResult | null>(null);

  function close() {
    setAnswers({});
    setResult(null);
    onClose();
  }

  function submitAttempt(quizData: QuizDetail) {
    const payload = quizData.questions.map((question) => ({
      questionId: question.id,
      answer: answers[question.id] ?? emptyAnswer(question),
    }));
    submit.mutate({ quizId: quizData.id, answers: payload }, { onSuccess: setResult });
  }

  return (
    <Sheet
      open={open}
      onClose={close}
      title={quiz.data?.title ?? t("attemptDialog.defaultTitle")}
      description={quiz.data?.description || t("attemptDialog.defaultDescription")}
    >
      {!quiz.data ? (
        <LoadingState label={t("attemptDialog.loading")} />
      ) : result ? (
        <QuizResultView
          result={result}
          onRetry={() => {
            setAnswers({});
            setResult(null);
          }}
          onClose={close}
        />
      ) : (
        <View style={styles.form}>
          {groupQuestions(quiz.data.questions, quiz.data.groups).map((block) => (
            <View key={block.group?.id ?? "plain"} style={styles.block}>
              {block.group ? <QuizGroupPanel group={block.group} /> : null}
              {block.questions.map((question) => (
                <QuestionCard key={question.id} number={question.order + 1} points={question.points}>
                  <QuestionPrompt question={question} />
                  <QuestionAnswerInput
                    question={question}
                    number={question.order + 1}
                    value={answers[question.id]}
                    onChange={(value) => setAnswers((current) => ({ ...current, [question.id]: value }))}
                  />
                </QuestionCard>
              ))}
            </View>
          ))}
          <Actions>
            <SheetButton fill={false} title={t("attemptDialog.close")} onPress={close} />
            <SheetButton
              fill={false}
              variant="primary"
              title={t("attemptDialog.submit")}
              loading={submit.isPending}
              onPress={() => submitAttempt(quiz.data as QuizDetail)}
            />
          </Actions>
        </View>
      )}
    </Sheet>
  );
}

/** `.hw-result-state` — uzuq chiziqli quti, markazda soat va matn. */
function LoadingState({ label }: { label: string }) {
  const colors = useQuizColors();
  return (
    <View style={[styles.loading, { borderColor: colors.border }]}>
      <Clock3 size={26} color={colors.muted} />
      <Text variant="label" style={[styles.regular, { color: colors.muted }]}>
        {label}
      </Text>
    </View>
  );
}

function QuestionCard({
  number,
  points,
  children,
}: {
  number: number;
  points: number;
  children: React.ReactNode;
}) {
  const { t } = useTranslation("quiz");
  const { palette } = useTheme();
  const colors = useQuizColors();
  return (
    <View style={[styles.question, { backgroundColor: palette.surface, borderColor: colors.border }]}>
      <View style={styles.questionHead}>
        <Text variant="caption" style={[styles.headText, { color: colors.muted }]}>
          {t("attemptDialog.questionNumber", { number })}
        </Text>
        <Text variant="caption" style={[styles.headText, { color: colors.muted }]}>
          {t("attemptDialog.pointsSuffix", { count: points })}
        </Text>
      </View>
      {children}
    </View>
  );
}

/** `.dialog-actions` — o'ngga tekislangan, oraliq 12. */
function Actions({ children }: { children: React.ReactNode }) {
  return <View style={styles.actions}>{children}</View>;
}

function QuizResultView({
  result,
  onRetry,
  onClose,
}: {
  result: QuizAttemptResult;
  onRetry: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation("quiz");
  const { palette } = useTheme();
  const colors = useQuizColors();
  return (
    <View style={styles.result}>
      <View style={[styles.score, { backgroundColor: palette["primary-tint"] }]}>
        <Text variant="body" style={[styles.scoreValue, { color: palette["primary-text"] }]}>
          {result.score}
          <Text variant="body" style={[styles.scoreMax, { color: colors.muted }]}>
            /{result.maxScore}
          </Text>
        </Text>
        <Text variant="caption" style={[styles.scoreLabel, { color: colors.muted }]}>
          {t("attemptDialog.result")}
        </Text>
      </View>
      <View style={styles.rows}>
        {result.answers.map((answer, index) => (
          <QuizResultRow key={answer.questionId} answer={answer} number={index + 1} />
        ))}
      </View>
      <Actions>
        <SheetButton fill={false} title={t("attemptDialog.retry")} onPress={onRetry} />
        <SheetButton fill={false} variant="primary" title={t("attemptDialog.close")} onPress={onClose} />
      </Actions>
    </View>
  );
}

/* Natija qatorlari ranglari — eski `legacy.css` o'zgaruvchilari (ishlash paytidagi qiymatlar). */
const TONES = {
  correct: { bg: "#e8f8f2", border: null, icon: "#0f7a59" },
  wrong: { bg: "#fff0f2", border: "#f4dadd", icon: "#b73f56" },
  partial: { bg: "#fff5d9", border: "#e99a3d", icon: "#7a5100" },
} as const;

function QuizResultRow({ answer, number }: { answer: QuizAttemptAnswer; number: number }) {
  const { t } = useTranslation("quiz");
  const colors = useQuizColors();
  const earned = answer.earnedPoints ?? (answer.isCorrect ? answer.points : 0);
  const partial = !answer.isCorrect && earned !== null && earned > 0;
  const given = answer.givenDisplay ?? answer.selectedOptionText;
  const correct = answer.correctDisplay ?? answer.correctOption?.text ?? null;
  // Insho avtomatik baholanmaydi — o'qituvchi ko'radi.
  const review = answer.questionType === "essay";
  const tone = review ? TONES.partial : answer.isCorrect ? TONES.correct : partial ? TONES.partial : TONES.wrong;
  const Icon = answer.isCorrect ? CheckCircle2 : review || partial ? CircleDot : XCircle;

  return (
    <View style={[styles.row, { backgroundColor: tone.bg, borderColor: tone.border ?? colors.border }]}>
      <View style={styles.rowHead}>
        <Icon size={16} color={tone.icon} style={styles.rowIcon} />
        <Text variant="body" style={[styles.rowText, { color: colors.foreground }]}>
          {number}. {blankTextForDisplay(answer.questionText)}
        </Text>
        {review ? (
          <Text variant="caption" style={[styles.points, { color: colors.muted }]}>
            {t("attemptDialog.essayReview")}
          </Text>
        ) : answer.points !== null ? (
          <Text variant="caption" style={[styles.points, { color: colors.muted }]}>
            {t("attemptDialog.earnedPoints", { earned: earned ?? 0, total: answer.points })}
          </Text>
        ) : null}
      </View>
      <Text variant="caption" style={[styles.small, { color: colors.muted }]}>
        {t("attemptDialog.yourAnswerLabel")} {given || t("attemptDialog.notAnswered")}
      </Text>
      {!answer.isCorrect && !review && correct ? (
        <Text variant="caption" style={[styles.small, styles.correct, { color: TONES.correct.icon }]}>
          {t("attemptDialog.correctAnswerLabel")} {correct}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  regular: { fontWeight: "400" },
  /* `.quiz-attempt-form` — gap 16 */
  form: { gap: 16 },
  /* `.quiz-attempt-block` — gap 12 */
  block: { gap: 12 },
  loading: {
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 26,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 16,
  },
  question: { gap: 8, padding: 14, borderWidth: 1, borderRadius: 16 },
  questionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headText: { fontSize: 12, lineHeight: 18, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase" },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 12 },

  /* `.quiz-result` — gap 14 */
  result: { gap: 14 },
  score: { alignItems: "center", gap: 4, padding: 18, borderRadius: 16 },
  scoreValue: { fontSize: 28, lineHeight: 36, fontWeight: "700" },
  scoreMax: { fontSize: 16, fontWeight: "600" },
  scoreLabel: { fontSize: 12, fontWeight: "700", letterSpacing: 0.72, textTransform: "uppercase" },
  rows: { gap: 8 },
  row: { gap: 4, padding: 12, borderWidth: 1, borderRadius: 13 },
  rowHead: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  rowIcon: { marginTop: 3 },
  rowText: { flex: 1, minWidth: 0, fontWeight: "600" },
  points: { flexShrink: 0 },
  small: { fontSize: 13, lineHeight: 19 },
  correct: { fontWeight: "700" },
});
