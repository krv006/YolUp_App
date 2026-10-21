import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { AppState, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { CheckCircle2, ChevronDown, Coffee, Flag, LogOut, SkipForward } from "lucide-react-native";
import {
  QuestionAnswerInput,
  QuestionPrompt,
  emptyAnswer,
  useQuizColors,
  type QuizAttemptAnswerInput,
} from "@/modules/quiz";
import { storage } from "@/shared/lib";
import type { ExamCurrent, ExamCurrentItem, QuizAnswerValue, QuizQuestion } from "@/shared/types";
import { radius, Sheet, SheetButton, Text, useTheme } from "@/shared/ui";
import {
  useExamResults,
  useFinishExam,
  useNextExamSection,
  useRecordExamFocus,
  useSaveExamAnswers,
} from "../model/exam.queries";
import { ExamListeningPlayer } from "./exam-listening-player";
import { ExamResultCard } from "./exam-result-card";
import { ExamReview } from "./exam-review";
import { ExamTimer } from "./exam-timer";

const AUTOSAVE_MS = 10_000;

const flagsKey = (examId: string, sectionKey: string) => `exam-flags:${examId}:${sectionKey}`;
const loadFlags = (examId: string, sectionKey: string) =>
  new Set(storage.getJson<string[]>(flagsKey(examId, sectionKey), []) ?? []);

export interface ExamRunnerProps {
  examId: string;
  title: string;
  current: ExamCurrent;
  onRefresh: () => void;
  onExit: () => void;
}

/**
 * Imtihon topshirish — veb `modules/exam/ui/exam-runner.tsx` porti.
 *
 * Bir xil mantiq: 10 soniyada avtomatik saqlash, savolni bayroqcha bilan
 * belgilash (MMKV'da saqlanadi), savollar paneli, keyingi bo'limga o'tish,
 * yakunlash, tanaffus va tugagandan keyin o'z natijasi.
 *
 * Halollik nazorati: vebda boshqa oynaga o'tish (`blur`/`visibilitychange`)
 * qayd etiladi; mobilda — ilova fonga o'tganda (`AppState`). Vebdagi
 * "insho maydoniga nusxa qo'yishni taqiqlash" mobilda yo'q: RN `TextInput`
 * qo'yish hodisasini bermaydi.
 */
export function ExamRunner({ examId, title, current, onRefresh, onExit }: ExamRunnerProps) {
  const { t } = useTranslation("exam");
  const { palette } = useTheme();
  const colors = useQuizColors();
  const item = current.item;
  const save = useSaveExamAnswers(examId);
  const finish = useFinishExam(examId);
  const recordFocus = useRecordExamFocus(examId);
  const nextSection = useNextExamSection(examId);
  const [answers, setAnswers] = useState<Record<string, QuizAnswerValue>>(item?.savedAnswers ?? {});
  const [finishOpen, setFinishOpen] = useState(false);
  const [nextOpen, setNextOpen] = useState(false);
  const dirtyRef = useRef(false);
  const answersRef = useRef(answers);
  const scrollRef = useRef<ScrollView>(null);
  const positions = useRef<Record<string, number>>({});
  const [flagged, setFlagged] = useState<Set<string>>(() => loadFlags(examId, item?.key ?? ""));

  const questions = useMemo(() => item?.questions ?? [], [item]);
  const sectionKey = item?.key ?? "";

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // Halollik: ilova fonga o'tsa qayd etiladi (o'qituvchi natijada ko'radi).
  const running = item?.kind === "section";
  useEffect(() => {
    if (!running) return undefined;
    let away = false;
    const subscription = AppState.addEventListener("change", (next) => {
      if (next !== "active" && !away) {
        away = true;
        recordFocus.mutate("blur");
      } else if (next === "active") {
        away = false;
      }
    });
    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, examId]);

  function toggleFlag(questionId: string) {
    setFlagged((currentFlags) => {
      const next = new Set(currentFlags);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      storage.setJson(flagsKey(examId, sectionKey), [...next]);
      return next;
    });
  }

  function jumpTo(questionId: string) {
    const y = positions.current[questionId];
    if (y !== undefined) scrollRef.current?.scrollTo({ y: Math.max(0, y - 120), animated: true });
  }

  function payload(): QuizAttemptAnswerInput[] {
    return questions
      .filter((question) => answersRef.current[question.id])
      .map((question) => ({ questionId: question.id, answer: answersRef.current[question.id] }));
  }

  function flush() {
    if (!dirtyRef.current || !questions.length) return;
    dirtyRef.current = false;
    save.mutate(payload());
  }

  useEffect(() => {
    if (!questions.length) return undefined;
    const timer = setInterval(flush, AUTOSAVE_MS);
    return () => {
      clearInterval(timer);
      flush();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionKey, questions.length]);

  const answeredCount = useMemo(
    () => questions.filter((question) => answers[question.id]).length,
    [answers, questions]
  );

  function answerChanged(question: QuizQuestion, value: QuizAnswerValue) {
    dirtyRef.current = true;
    setAnswers((currentAnswers) => ({ ...currentAnswers, [question.id]: value }));
  }

  async function goNext() {
    if (dirtyRef.current && questions.length) {
      dirtyRef.current = false;
      try {
        await save.mutateAsync(payload());
      } catch {
        dirtyRef.current = true;
        return;
      }
    }
    try {
      await nextSection.mutateAsync();
      setNextOpen(false);
      onRefresh();
    } catch {
      /* xato xabari mutatsiyada ko'rsatiladi */
    }
  }

  function sectionExpired() {
    flush();
    onRefresh();
  }

  const dialogs = (
    <>
      <Sheet
        open={nextOpen && Boolean(current.next)}
        onClose={() => setNextOpen(false)}
        title={t("runner.nextTitle")}
        description={t("runner.nextDescription", { title: current.next?.title ?? "" })}
      >
        <View style={styles.actions}>
          <SheetButton fill={false} title={t("runner.cancel")} onPress={() => setNextOpen(false)} />
          <SheetButton
            fill={false}
            variant="primary"
            title={t("runner.nextConfirm")}
            loading={nextSection.isPending || save.isPending}
            onPress={() => void goNext()}
          />
        </View>
      </Sheet>
      <Sheet
        open={finishOpen}
        onClose={() => setFinishOpen(false)}
        title={t("runner.finishTitle")}
        description={t("runner.finishDescription")}
      >
        <View style={styles.actions}>
          <SheetButton fill={false} title={t("runner.cancel")} onPress={() => setFinishOpen(false)} />
          <SheetButton
            fill={false}
            variant="primary"
            title={t("runner.finishConfirm")}
            loading={finish.isPending}
            onPress={() => {
              flush();
              void finish.mutateAsync().then(() => {
                setFinishOpen(false);
                onRefresh();
              });
            }}
          />
        </View>
      </Sheet>
    </>
  );

  if (!item) {
    return (
      <ScrollView contentContainerStyle={styles.state}>
        <CheckCircle2 size={28} color={colors.muted} />
        <Text variant="body" style={[styles.center, { color: colors.muted }]}>
          {current.state === "upcoming" ? t("runner.notStarted") : t("runner.finished")}
        </Text>
        {current.state === "upcoming" ? null : <ExamOwnResult examId={examId} />}
        <SheetButton fill={false} title={t("runner.exit")} onPress={onExit} />
      </ScrollView>
    );
  }

  if (item.kind === "break") {
    return (
      <View style={styles.fill}>
        <ExamRunnerHeader
          title={title}
          item={item}
          answered={null}
          total={null}
          onFinish={() => setFinishOpen(true)}
          onNext={current.next ? () => setNextOpen(true) : undefined}
          onExpire={sectionExpired}
        />
        <View style={styles.breakBox}>
          <Coffee size={30} color={colors.muted} />
          <Text variant="body" style={[styles.breakTitle, { color: colors.foreground }]}>
            {item.title || t("runner.breakTitle")}
          </Text>
          <Text variant="body" style={[styles.center, { color: colors.muted }]}>
            {t("runner.breakHint")}
          </Text>
          {current.next ? (
            <Text variant="caption" style={{ color: colors.muted }}>
              {t("runner.nextItem", { title: current.next.title })}
            </Text>
          ) : null}
        </View>
        {dialogs}
      </View>
    );
  }

  const grouped = groupQuestions(item);

  return (
    <View style={styles.fill}>
      <ScrollView ref={scrollRef} stickyHeaderIndices={[0]} keyboardShouldPersistTaps="handled">
        <ExamRunnerHeader
          title={title}
          item={item}
          answered={answeredCount}
          total={questions.length}
          onFinish={() => setFinishOpen(true)}
          onNext={current.next ? () => setNextOpen(true) : undefined}
          onExpire={sectionExpired}
          player={<ExamListeningPlayer key={item.key} examId={examId} groups={item.groups} />}
          nav={<QuestionNav questions={questions} answers={answers} flagged={flagged} onJump={jumpTo} />}
        />

        <View style={styles.body}>
          {grouped.map((block) => (
            <View key={block.group?.id ?? "plain"} style={styles.block}>
              {block.group ? <GroupPanel group={block.group} /> : null}
              {block.questions.map((question) => {
                const isFlagged = flagged.has(question.id);
                return (
                  <View
                    key={question.id}
                    onLayout={(event) => {
                      positions.current[question.id] = event.nativeEvent.layout.y;
                    }}
                    style={[
                      styles.question,
                      { backgroundColor: palette.surface, borderColor: isFlagged ? "#f59e0b" : colors.border },
                    ]}
                  >
                    <View style={styles.questionHead}>
                      <Text variant="caption" style={[styles.headText, { color: colors.muted }]}>
                        {t("runner.questionNumber", { number: question.order + 1 })}
                      </Text>
                      <View style={styles.tools}>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityState={{ selected: isFlagged }}
                          onPress={() => toggleFlag(question.id)}
                          style={styles.flag}
                        >
                          <Flag size={13} color={isFlagged ? "#b45309" : colors.muted} />
                          <Text variant="caption" style={[styles.flagText, { color: isFlagged ? "#b45309" : colors.muted }]}>
                            {isFlagged ? t("runner.unflag") : t("runner.flag")}
                          </Text>
                        </Pressable>
                        <Text variant="caption" style={[styles.headText, { color: colors.muted }]}>
                          {t("runner.points", { count: question.points })}
                        </Text>
                      </View>
                    </View>
                    <QuestionPrompt question={question} />
                    <QuestionAnswerInput
                      question={question}
                      number={question.order + 1}
                      value={answers[question.id] ?? emptyAnswer(question)}
                      onChange={(value) => answerChanged(question, value)}
                    />
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
      {dialogs}
    </View>
  );
}

function ExamRunnerHeader({
  title,
  item,
  answered,
  total,
  onFinish,
  onNext,
  onExpire,
  player = null,
  nav = null,
}: {
  title: string;
  item: ExamCurrentItem;
  answered: number | null;
  total: number | null;
  onFinish: () => void;
  onNext?: () => void;
  onExpire: () => void;
  player?: ReactNode;
  nav?: ReactNode;
}) {
  const { t } = useTranslation("exam");
  const { palette } = useTheme();
  const colors = useQuizColors();
  return (
    // `.exam-runner-head` — yopishqoq, bo'shliq 16, pastki chegara, oq fon
    <View style={[styles.head, { backgroundColor: palette.surface, borderBottomColor: colors.border }]}>
      <View>
        <Text variant="caption" style={[styles.eyebrow, { color: palette["primary-text"] }]}>
          {title}
        </Text>
        <Text variant="body" style={[styles.h1, { color: colors.foreground }]}>
          {item.title}
        </Text>
        {answered !== null && total !== null ? (
          <Text variant="caption" style={[styles.answered, { color: colors.muted }]}>
            {t("runner.answered", { answered, total })}
          </Text>
        ) : null}
        {item.kind === "section" ? (
          <Text variant="caption" style={{ color: colors.muted }}>
            {t("runner.integrityNotice")}
          </Text>
        ) : null}
      </View>
      <View style={styles.headActions}>
        <ExamTimer key={item.endsAt} deadline={item.endsAt} label={t("runner.timeLeft")} onExpire={onExpire} />
        {onNext ? (
          <HeadButton icon={<SkipForward size={16} color={colors.foreground} />} label={t("runner.next")} onPress={onNext} />
        ) : null}
        <HeadButton icon={<LogOut size={16} color={colors.foreground} />} label={t("runner.finish")} onPress={onFinish} />
      </View>
      {player}
      {nav}
    </View>
  );
}

/** Eski `.button--secondary` (form-skin ostida): h-48, radius to'liq, chegara 1. */
function HeadButton({ icon, label, onPress }: { icon: ReactNode; label: string; onPress: () => void }) {
  const { palette } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.headButton,
        { borderColor: palette.border, backgroundColor: pressed ? palette["primary-soft"] : palette.surface },
      ]}
    >
      {icon}
      <Text variant="label">{label}</Text>
    </Pressable>
  );
}

/** Savollar paneli — veb `exam-question-nav.tsx` (`.exam-qnav`). */
function QuestionNav({
  questions,
  answers,
  flagged,
  onJump,
}: {
  questions: QuizQuestion[];
  answers: Record<string, QuizAnswerValue>;
  flagged: ReadonlySet<string>;
  onJump: (questionId: string) => void;
}) {
  const { t } = useTranslation("exam");
  const { palette } = useTheme();
  const colors = useQuizColors();
  if (questions.length < 2) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.nav} accessibilityLabel={t("runner.navAria")}>
      {questions.map((question) => {
        const done = Boolean(answers[question.id]);
        const marked = flagged.has(question.id);
        return (
          <Pressable
            key={question.id}
            accessibilityRole="button"
            accessibilityLabel={t("runner.questionNumber", { number: question.order + 1 })}
            onPress={() => onJump(question.id)}
            style={[
              styles.navButton,
              done
                ? { backgroundColor: palette.primary, borderColor: palette.primary }
                : { backgroundColor: palette.surface, borderColor: colors.border },
              marked && styles.navFlagged,
            ]}
          >
            <Text variant="caption" style={[styles.navText, { color: done ? palette["primary-foreground"] : colors.muted }]}>
              {question.order + 1}
            </Text>
            {marked ? (
              <View style={styles.navFlag}>
                <Flag size={9} color="#f59e0b" />
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** Savollar guruhi — veb `exam-question-group.tsx` (`.exam-group`). */
function GroupPanel({ group }: { group: ExamCurrentItem["groups"][number] }) {
  const colors = useQuizColors();
  return (
    <View style={[styles.group, { backgroundColor: colors.surfaceTint, borderColor: colors.border }]}>
      {group.title ? (
        <Text variant="body" style={[styles.groupTitle, { color: colors.foreground }]}>
          {group.title}
        </Text>
      ) : null}
      {group.passage ? (
        <ScrollView nestedScrollEnabled style={styles.passageBox}>
          <Text variant="body" style={[styles.passage, { color: colors.foreground }]}>
            {group.passage}
          </Text>
        </ScrollView>
      ) : null}
    </View>
  );
}

function groupQuestions(item: ExamCurrentItem) {
  const blocks: Array<{ group: ExamCurrentItem["groups"][number] | null; questions: QuizQuestion[] }> = [];
  const byGroup = new Map<string, QuizQuestion[]>();
  const plain: QuizQuestion[] = [];
  for (const question of item.questions) {
    const groupId = question.groupId;
    if (!groupId) {
      plain.push(question);
      continue;
    }
    const list = byGroup.get(groupId) ?? [];
    list.push(question);
    byGroup.set(groupId, list);
  }
  for (const group of item.groups) {
    const groupQuestionsList = byGroup.get(group.id);
    if (groupQuestionsList?.length) blocks.push({ group, questions: groupQuestionsList });
  }
  if (plain.length) blocks.push({ group: null, questions: plain });
  return blocks;
}

/** Tugagandan keyin o'quvchining o'z natijasi va savol-savol tahlil (vebda `<details>`). */
function ExamOwnResult({ examId }: { examId: string }) {
  const { t } = useTranslation("exam");
  const colors = useQuizColors();
  const results = useExamResults(examId);
  const [open, setOpen] = useState(false);

  if (results.isLoading) return <Text variant="caption" style={{ color: colors.muted }}>{t("result.loading")}</Text>;
  if (results.data?.hidden) return <Text variant="caption" style={{ color: colors.muted }}>{t("result.hidden")}</Text>;

  const own = results.data?.results?.[0];
  if (!own) return null;
  return (
    <View style={styles.own}>
      <ExamResultCard result={own} />
      {own.participated && results.data?.state === "finished" ? (
        <View style={styles.reviewToggle}>
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen((value) => !value)} style={styles.summary}>
            <ChevronDown size={16} color={colors.foreground} style={open ? undefined : styles.collapsed} />
            <Text variant="body" style={styles.summaryText}>
              {t("review.show")}
            </Text>
          </Pressable>
          {open ? <ExamReview examId={examId} studentId={own.studentId} /> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { textAlign: "center" },
  /* `.exam-runner-state` */
  state: { flexGrow: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 16 },
  own: { alignItems: "center", gap: 12 },
  reviewToggle: { marginTop: 12 },
  summary: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8 },
  summaryText: { fontWeight: "600" },
  collapsed: { transform: [{ rotate: "-90deg" }] },
  breakBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, padding: 16 },
  breakTitle: { fontSize: 19, fontWeight: "700", textAlign: "center" },

  head: { gap: 16, padding: 16, borderBottomWidth: 1 },
  eyebrow: { fontSize: 12, fontWeight: "700", letterSpacing: 0.96, textTransform: "uppercase" },
  h1: { marginTop: 4, fontSize: 19, lineHeight: 26, fontWeight: "700" },
  answered: { marginTop: 4, fontSize: 13 },
  headActions: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 10 },
  headButton: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderRadius: radius.full,
  },
  nav: { gap: 6, paddingTop: 2, paddingBottom: 4 },
  navButton: {
    minWidth: 32,
    height: 32,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 8,
  },
  navFlagged: { borderColor: "#f59e0b", borderBottomWidth: 3 },
  navFlag: { position: "absolute", top: 2, right: 2 },
  navText: { fontSize: 13, fontWeight: "700" },

  /* `.exam-runner-body` — bo'shliq 0 16, oraliq 26 */
  body: { gap: 26, paddingHorizontal: 16, paddingTop: 18, paddingBottom: 60 },
  block: { gap: 14 },
  group: { gap: 12, padding: 16, borderWidth: 1, borderRadius: 16 },
  groupTitle: { fontSize: 16, fontWeight: "700" },
  passageBox: { maxHeight: 420 },
  passage: { fontSize: 14, lineHeight: 23 },
  question: { gap: 8, padding: 14, borderWidth: 1, borderRadius: 16 },
  questionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headText: { fontSize: 12, lineHeight: 18, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase" },
  tools: { flexDirection: "row", alignItems: "center", gap: 12 },
  flag: { flexDirection: "row", alignItems: "center", gap: 5 },
  flagText: { fontSize: 12, fontWeight: "700" },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 12 },
});
