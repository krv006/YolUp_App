import { useEffect, useEffectEvent, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCourse } from "@/modules/course";
import {
  emptyAnswer,
  formatCountdown,
  MathText,
  optionLetter,
  QuestionAnswerInput,
  quizApi,
  quizDisplayTitle,
  QuizGroupPanel,
  useQuiz,
  useQuizCountdown,
  useQuizDraft,
  useSubmitQuizAttempt,
} from "@/modules/quiz";
import { ROUTES } from "@/shared/config";
import { storage } from "@/shared/lib";
import type { QuizAnswerValue, QuizDetail, QuizQuestion } from "@/shared/types";
import { ConfirmDialog, DsGradient, DsText, dsRadius, Icon, MobileActionBar, MobileButton, MobileEmptyCard, MobileRoundButton, toast, useDs } from "@/shared/ui";
import { rememberFreshResult } from "./fresh-results";
import { TestAttemptsOver, TestStartScreen } from "./student-test-gate";

interface Draft {
  answers: Record<string, QuizAnswerValue>;
  index: number;
  startedAt: number;
  /** Vaqtli testda seans boshlangan payt (`started_at`) — qoralama shu seansga tegishli. */
  session?: string;
}

const draftKey = (quizId: string) => `yolup.quiz-draft.${quizId}`;
const RAIL_STEP = 48;
const SERVER_SAVE_DELAY = 4000;

function toServerAnswers(answers: Record<string, QuizAnswerValue>) {
  return Object.entries(answers).map(([questionId, answer]) => ({ question_id: questionId, answer }));
}

function fromServerAnswers(items: unknown[], questions: QuizQuestion[]): Record<string, QuizAnswerValue> {
  const known = new Set(questions.map((question) => question.id));
  const restored: Record<string, QuizAnswerValue> = {};
  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const { question_id: questionId, answer } = item as { question_id?: unknown; answer?: unknown };
    if (typeof questionId !== "string" || !known.has(questionId)) continue;
    if (!answer || typeof answer !== "object" || !("type" in answer)) continue;
    restored[questionId] = answer as QuizAnswerValue;
  }
  return restored;
}

function answered(value: QuizAnswerValue | undefined): boolean {
  if (!value) return false;
  switch (value.type) {
    case "single":
      return value.optionId !== null;
    case "multiple":
      return value.optionIds.length > 0;
    case "true_false":
      return value.value !== null;
    case "matching":
      return Object.keys(value.pairs).length > 0;
    case "ordering":
      return true;
    case "fill_blank":
      return value.values.some((item) => item.trim());
    default:
      return Boolean(value.value.trim());
  }
}

/**
 * Test yechish — veb `student-test-page.tsx` (tor ekran): sarlavha
 * ("keyinroq" va "Tugatish"), savol raqamlari qatori, savol kartasi; pastda
 * "Oldingi" / "Keyingi". Javoblar qoralama sifatida saqlanadi (vebda
 * `localStorage`, mobilda `storage`). Vaqtli testda avval boshlash ekrani,
 * urinishlar tugaganda alohida ekran (`student-test-gate.tsx`); boshlangan
 * seansda sarlavha o'rnida server vaqti bo'yicha taymer, vaqt tugasa test
 * o'zi topshiriladi.
 */
export function StudentTestPage() {
  const { quizId = "" } = useLocalSearchParams<{ quizId: string }>();
  const quiz = useQuiz(quizId || null);
  const course = useCourse(quiz.data?.courseId || null);
  const { t } = useTranslation("student");
  const ds = useDs();
  const insets = useSafeAreaInsets();

  if (quiz.isError)
    return (
      <View style={[styles.state, { backgroundColor: ds.c.canvas }]}>
        <MobileEmptyCard icon="quiz" title={t("workspace.player.loadError")} action={{ label: t("workspace.player.retry"), onPress: () => void quiz.refetch() }} />
      </View>
    );
  if (!quiz.data)
    return (
      <View style={[styles.loading, { backgroundColor: ds.c.canvas, paddingTop: insets.top + 40 }]}>
        <View style={[styles.loadingLine, { backgroundColor: ds.c.skeleton }]} />
        <View style={[styles.loadingCard, { backgroundColor: ds.c.surface }]} />
      </View>
    );
  if (quiz.data.attemptsLeft === 0 && !quiz.data.questions.length) return <TestAttemptsOver quiz={quiz.data} />;
  if (quiz.data.needsStart)
    return <TestStartScreen quiz={quiz.data} meta={[quiz.data.subjectLabel, course.data?.title, course.data?.teacher].filter(Boolean).join(" · ")} />;
  return <TestPlayer key={`${quiz.data.id}:${quiz.data.startedAt ?? ""}`} quiz={quiz.data} />;
}

/** Qolgan vaqt — `h-9 rounded-full px-3`; oxirgi daqiqada qizil va `animate-pulse`. */
function TimerPill({ seconds }: { seconds: number }) {
  const { t } = useTranslation("student");
  const ds = useDs();
  const urgent = seconds <= 60;
  const opacity = useSharedValue(1);
  useEffect(() => {
    if (urgent) opacity.set(withRepeat(withTiming(0.5, { duration: 1000 }), -1, true));
    else {
      cancelAnimation(opacity);
      opacity.set(1);
    }
  }, [urgent, opacity]);
  const pulse = useAnimatedStyle(() => ({ opacity: opacity.get() }));
  const color = urgent ? ds.c["error-text"] : ds.c.brand;
  return (
    <Animated.View
      accessible
      accessibilityRole="timer"
      accessibilityLabel={t("workspace.player.timeLeft", { time: formatCountdown(seconds) })}
      style={[styles.timer, { backgroundColor: urgent ? ds.c["danger-bg"] : ds.c["brand-subtle"] }, pulse]}
    >
      <Icon name="timer" size={16} color={color} />
      <DsText v="body-sm" w="600" c={urgent ? "error-text" : "brand"} style={styles.tabular}>
        {formatCountdown(seconds)}
      </DsText>
    </Animated.View>
  );
}

function TestPlayer({ quiz }: { quiz: QuizDetail }) {
  const { t } = useTranslation("student");
  const ds = useDs();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const submit = useSubmitQuizAttempt();
  const questions = quiz.questions;
  const session = quiz.startedAt ?? "";
  const [draft, setDraft] = useState<Draft>(() => {
    const stored = storage.getJson<Draft>(draftKey(quiz.id));
    return stored && (stored.session ?? "") === session
      ? stored
      : { answers: {}, index: 0, startedAt: quiz.startedAt ? Date.parse(quiz.startedAt) : Date.now(), session };
  });
  const remaining = useQuizCountdown(quiz.endsAt);
  const timeUpHandled = useRef(false);
  // Veb #162: javoblar serverga ham qoralama sifatida yoziladi — boshqa qurilmada davom ettirish uchun.
  const serverDraft = useQuizDraft(quiz.id);
  const [hydrated, setHydrated] = useState(false);
  if (!hydrated && serverDraft.data) {
    setHydrated(true);
    const restored = fromServerAnswers(serverDraft.data.answers, questions);
    if (Object.keys(restored).length && !Object.keys(draft.answers).length)
      setDraft({ answers: restored, index: 0, startedAt: draft.startedAt - serverDraft.data.elapsedSeconds * 1000 });
  }
  const [confirmOpen, setConfirmOpen] = useState(false);
  const railRef = useRef<ScrollView>(null);
  const index = Math.min(draft.index, Math.max(questions.length - 1, 0));
  const question = questions[index];
  const group = question?.groupId ? quiz.groups.find((item) => item.id === question.groupId) : undefined;
  const missing = questions.filter((item) => !answered(draft.answers[item.id])).length;

  useEffect(() => {
    storage.setJson(draftKey(quiz.id), draft);
  }, [quiz.id, draft]);

  useEffect(() => {
    if (!hydrated || !Object.keys(draft.answers).length) return;
    const id = globalThis.setTimeout(() => {
      void quizApi.saveDraft(quiz.id, toServerAnswers(draft.answers), (Date.now() - draft.startedAt) / 1000).catch(() => undefined);
    }, SERVER_SAVE_DELAY);
    return () => globalThis.clearTimeout(id);
  }, [hydrated, quiz.id, draft.answers, draft.startedAt]);

  useEffect(() => {
    railRef.current?.scrollTo({ x: Math.max(0, index * RAIL_STEP - RAIL_STEP * 2), animated: true });
  }, [index]);

  const go = (next: number) => setDraft((current) => ({ ...current, index: Math.max(0, Math.min(next, questions.length - 1)) }));
  const setAnswer = (value: QuizAnswerValue) => setDraft((current) => (question ? { ...current, answers: { ...current.answers, [question.id]: value } } : current));

  function later() {
    if (Object.keys(draft.answers).length)
      void quizApi.saveDraft(quiz.id, toServerAnswers(draft.answers), (Date.now() - draft.startedAt) / 1000).catch(() => undefined);
    toast.success(t("workspace.player.savedLater"));
    if (router.canGoBack()) router.back();
    else router.replace(ROUTES.student.tests as never);
  }

  function finish() {
    submit.mutate(
      {
        quizId: quiz.id,
        answers: questions.map((item) => ({ questionId: item.id, answer: draft.answers[item.id] ?? emptyAnswer(item) })),
        durationSeconds: Math.round((Date.now() - (quiz.startedAt ? Date.parse(quiz.startedAt) : draft.startedAt)) / 1000),
      },
      {
        onSuccess: (result) => {
          storage.remove(draftKey(quiz.id));
          void quizApi.deleteDraft(quiz.id).catch(() => undefined);
          setConfirmOpen(false);
          toast.success(t("workspace.player.submitted"));
          rememberFreshResult(quiz.id, result);
          router.replace(ROUTES.student.testResults(quiz.id) as never);
        },
      }
    );
  }

  const requestFinish = () => (missing ? setConfirmOpen(true) : finish());

  const onTimeUp = useEffectEvent(() => {
    setConfirmOpen(false);
    toast.info(t("workspace.player.timeUp"));
    if (!submit.isPending) finish();
  });

  useEffect(() => {
    if (remaining !== 0 || timeUpHandled.current) return;
    timeUpHandled.current = true;
    onTimeUp();
  }, [remaining]);
  const last = index === questions.length - 1;

  return (
    <View style={[styles.fill, { backgroundColor: ds.c.canvas }]}>
      <ScrollView style={styles.fill} contentContainerStyle={[styles.page, { paddingTop: insets.top + 20 }]} keyboardShouldPersistTaps="handled">
        <DsGradient name="auth" />
        <View style={styles.header}>
          <MobileRoundButton icon="chevron-left" label={t("workspace.player.later")} onPress={later} />
          {remaining === null ? (
            <DsText v="title-lg" w="600" numberOfLines={1} style={styles.title}>
              {quizDisplayTitle(quiz)}
            </DsText>
          ) : (
            <View style={styles.timerSlot}>
              <TimerPill seconds={remaining} />
            </View>
          )}
          <Pressable
            accessibilityRole="button"
            disabled={submit.isPending}
            onPress={requestFinish}
            style={({ pressed }) => [styles.finish, { backgroundColor: pressed ? ds.c["brand-strong"] : ds.c.brand }, submit.isPending && styles.faded]}
          >
            <DsText v="button" c="on-action">
              {submit.isPending ? t("workspace.player.submitting") : t("workspace.player.finishShort")}
            </DsText>
          </Pressable>
        </View>

        <ScrollView ref={railRef} horizontal showsHorizontalScrollIndicator={false} style={styles.railScroller} contentContainerStyle={styles.rail}>
          {questions.map((item, position) => {
            const active = position === index;
            const done = answered(draft.answers[item.id]);
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => go(position)}
                style={[styles.railItem, { backgroundColor: active ? ds.c.brand : done ? ds.c["brand-subtle"] : ds.c.surface }]}
              >
                <DsText v="body-sm" w="600" c={active ? "on-action" : done ? "brand" : "ink"}>
                  {position + 1}
                </DsText>
              </Pressable>
            );
          })}
        </ScrollView>

        {question ? (
          <View style={[styles.card, { backgroundColor: ds.c.surface }]}>
            <QuestionBody
              question={question}
              index={index}
              total={questions.length}
              group={group ? <QuizGroupPanel group={group} /> : null}
              value={draft.answers[question.id]}
              onChange={setAnswer}
            />
          </View>
        ) : null}
      </ScrollView>

      <MobileActionBar>
        <MobileButton variant="secondary" label={t("workspace.player.prev")} disabled={index === 0} onPress={() => go(index - 1)} />
        <MobileButton label={last ? t("workspace.player.finishShort") : t("workspace.player.next")} disabled={submit.isPending} onPress={() => (last ? requestFinish() : go(index + 1))} />
      </MobileActionBar>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        icon="quiz"
        tone="brand"
        title={t("workspace.player.finish")}
        description={t("workspace.player.unanswered", { count: missing })}
        confirmLabel={t("workspace.player.finish")}
        cancelLabel={t("workspace.back")}
        pending={submit.isPending}
        onConfirm={finish}
      />
    </View>
  );
}

function QuestionBody({
  question,
  index,
  total,
  group,
  value,
  onChange,
}: {
  question: QuizQuestion;
  index: number;
  total: number;
  group: ReactNode;
  value: QuizAnswerValue | undefined;
  onChange: (value: QuizAnswerValue) => void;
}) {
  const { t } = useTranslation("student");
  const ds = useDs();
  const current = value && value.type === question.type ? value : emptyAnswer(question);
  const choices =
    question.type === "true_false"
      ? [
          { id: "true", text: t("workspace.player.trueLabel") },
          { id: "false", text: t("workspace.player.falseLabel") },
        ]
      : question.type === "single" || question.type === "multiple"
        ? question.options.map((option) => ({ id: option.id, text: option.text }))
        : null;

  function selected(id: string): boolean {
    if (current.type === "single") return current.optionId === id;
    if (current.type === "multiple") return current.optionIds.includes(id);
    if (current.type === "true_false") return current.value === (id === "true");
    return false;
  }

  function pick(id: string) {
    if (current.type === "single") onChange({ type: "single", optionId: id });
    else if (current.type === "multiple")
      onChange({ type: "multiple", optionIds: current.optionIds.includes(id) ? current.optionIds.filter((item) => item !== id) : [...current.optionIds, id] });
    else if (current.type === "true_false") onChange({ type: "true_false", value: id === "true" });
  }

  return (
    <>
      <DsText v="caption-strong" c="ink-secondary" style={styles.upper}>
        {t("workspace.player.overline", { n: index + 1, type: t(`workspace.player.types.${question.type}`) })}
      </DsText>
      <DsText v="body-xs" c="ink-secondary" style={styles.mt12}>
        {t(`workspace.player.hints.${question.type}`)}
      </DsText>
      <View style={[styles.progressRow, styles.mt12]}>
        <DsText v="body-xs" w="600">
          {index + 1} / {total}
        </DsText>
        <View style={[styles.progressTrack, { backgroundColor: ds.c.subtle }]}>
          <View style={[styles.progressFill, { width: `${((index + 1) / total) * 100}%`, backgroundColor: ds.c.brand }]} />
        </View>
      </View>
      {group ? <View style={styles.mt16}>{group}</View> : null}
      {question.type === "fill_blank" ? null : (
        <View style={styles.mt16}>
          <MathText text={question.text} w="600" style={styles.questionText} />
        </View>
      )}
      {choices ? (
        <View accessibilityRole={question.type === "multiple" ? undefined : "radiogroup"} style={[styles.choices, styles.mt12]}>
          {choices.map((choice, position) => {
            const active = selected(choice.id);
            return (
              <Pressable
                key={choice.id}
                accessibilityRole={question.type === "multiple" ? "checkbox" : "radio"}
                accessibilityState={{ checked: active }}
                onPress={() => pick(choice.id)}
                style={({ pressed }) => [
                  styles.choice,
                  active ? { borderWidth: 2, borderColor: ds.c.brand, backgroundColor: ds.c["brand-subtle"] } : { borderColor: ds.c["line-strong"], backgroundColor: pressed ? ds.c.subtle : ds.c.surface },
                ]}
              >
                <View style={[styles.letter, { backgroundColor: active ? ds.c.brand : ds.c.subtle }]}>
                  <DsText v="body-xs" w="600" c={active ? "ink-inverse" : "ink-secondary"}>
                    {optionLetter(position)}
                  </DsText>
                </View>
                <View style={styles.grow}>
                  <MathText text={choice.text} v="title" w="500" />
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View style={styles.mt12}>
          <QuestionAnswerInput question={question} number={index + 1} value={current} onChange={onChange} />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  faded: { opacity: 0.5 },
  upper: { textTransform: "uppercase" },
  mt12: { marginTop: 12 },
  mt16: { marginTop: 16 },
  state: { flex: 1, justifyContent: "center", padding: 24 },
  loading: { flex: 1, alignItems: "center", gap: 16, paddingHorizontal: 16 },
  loadingLine: { width: 320, maxWidth: "100%", height: 32, borderRadius: 16 },
  loadingCard: { width: "100%", height: 384, borderRadius: dsRadius["2xl"] },
  /* `gap-4 px-4 pt-5 pb-6` */
  page: { gap: 16, paddingHorizontal: 16, paddingBottom: 24 },
  header: { height: 44, flexDirection: "row", alignItems: "center", gap: 12 },
  title: { flex: 1, minWidth: 0, textAlign: "center" },
  timerSlot: { flex: 1, minWidth: 0, alignItems: "center" },
  /* `h-9 gap-1.5 rounded-full px-3` */
  timer: { height: 36, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, borderRadius: dsRadius.full },
  tabular: { fontVariant: ["tabular-nums"] },
  finish: { height: 44, justifyContent: "center", paddingHorizontal: 16, borderRadius: 22 },
  railScroller: { marginHorizontal: -16, flexGrow: 0 },
  rail: { gap: 8, paddingHorizontal: 16 },
  railItem: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  card: { padding: 16, borderRadius: dsRadius["2xl"] },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  progressTrack: { flex: 1, minWidth: 0, height: 6, overflow: "hidden", borderRadius: 3 },
  progressFill: { height: "100%", borderRadius: 3 },
  /* `text-[17px]/6 font-semibold` */
  questionText: { fontSize: 17, lineHeight: 24 },
  choices: { gap: 12 },
  /* `min-h-[52px] rounded-xl border px-3.5 py-2 gap-3` */
  choice: { minHeight: 52, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderRadius: dsRadius.xl },
  letter: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
});
