import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Coffee, LogOut } from "lucide-react-native";
import {
  ExamPassage,
  ExamTimer,
  useExam,
  useExamCurrent,
  useFinishExam,
  useSaveExamAnswers,
  type ExamAudioState,
} from "@/modules/exam";
import { emptyAnswer, QuestionAnswerInput, type QuizAttemptAnswerInput } from "@/modules/quiz";
import type { ExamCurrentItem, QuizAnswerValue, QuizQuestion } from "@/shared/types";
import {
  Button,
  Card,
  ConfirmSheet,
  IconButton,
  radius,
  Screen,
  ScreenError,
  ScreenLoading,
  Text,
  useTheme,
} from "@/shared/ui";
import { ExamResultCard } from "./exam-result-card";

const AUTOSAVE_MS = 10_000;

/**
 * Imtihon topshirish ekrani.
 *
 * Vaqtni SERVER hal qiladi: har `current` javobida offset yangilanadi,
 * taymer tugaganda `current` qayta so'raladi va keyingi bo'lim/tanaffus
 * o'zi keladi — mijoz tomonda "keyingisiga o'tish" mantig'i yo'q.
 */
export function ExamRunnerPage() {
  const { t } = useTranslation("exam");
  const { palette } = useTheme();
  const router = useRouter();
  const { examId } = useLocalSearchParams<{ examId: string }>();
  const exam = useExam(examId ?? null);
  const current = useExamCurrent(examId ?? null);
  const save = useSaveExamAnswers(examId ?? "");
  const finish = useFinishExam(examId ?? "");

  const item = current.data?.item ?? null;
  const questions = useMemo(() => item?.questions ?? [], [item]);
  const sectionKey = item?.key ?? "";

  const [answers, setAnswers] = useState<Record<string, QuizAnswerValue>>({});
  const [audioStates, setAudioStates] = useState<Record<string, ExamAudioState>>({});
  const [finishOpen, setFinishOpen] = useState(false);
  const answersRef = useRef(answers);
  const dirtyRef = useRef(false);
  const restoredRef = useRef("");

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  /** Server saqlagan javoblar — bo'lim almashganda bir marta tiklanadi. */
  useEffect(() => {
    if (!item || restoredRef.current === sectionKey) return;
    restoredRef.current = sectionKey;
    setAnswers(item.savedAnswers);
  }, [item, sectionKey]);

  useEffect(() => {
    if (!questions.length) return undefined;
    const timer = setInterval(() => flush(), AUTOSAVE_MS);
    return () => {
      clearInterval(timer);
      flush();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionKey, questions.length]);

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

  function refresh() {
    flush();
    void current.refetch();
  }

  if (current.isLoading || exam.isLoading) {
    return (
      <Screen>
        <ScreenLoading label={t("runner.loading")} />
      </Screen>
    );
  }

  if (current.isError || !current.data) {
    return (
      <Screen>
        <ScreenError message={t("runner.loadError")} onRetry={() => void current.refetch()} />
      </Screen>
    );
  }

  const answered = questions.filter((question) => answers[question.id]).length;

  return (
    <Screen padded={false}>
      <View style={[styles.head, { borderBottomColor: palette.border }]}>
        <IconButton accessibilityLabel={t("runner.exit")} onPress={() => router.back()}>
          <ArrowLeft size={22} color={palette.foreground} />
        </IconButton>
        <View style={styles.headBody}>
          <Text variant="label" numberOfLines={1}>
            {item ? item.title : (exam.data?.title ?? "")}
          </Text>
          {item && item.kind === "section" ? (
            <Text variant="caption" tone="muted">
              {t("runner.answered", { answered, total: questions.length })}
            </Text>
          ) : null}
        </View>
        {item ? <ExamTimer key={item.endsAt} deadline={item.endsAt} label="" onExpire={refresh} /> : null}
      </View>

      {!item ? (
        <ScrollView contentContainerStyle={styles.body}>
          <Text tone="muted">
            {current.data.state === "upcoming" ? t("runner.notStarted") : t("runner.finished")}
          </Text>
          {current.data.state === "upcoming" ? null : <ExamResultCard examId={examId as string} />}
          <Button variant="secondary" title={t("runner.exit")} onPress={() => router.back()} />
        </ScrollView>
      ) : item.kind === "break" ? (
        <View style={styles.break}>
          <Coffee size={30} color={palette["muted-foreground"]} />
          <Text variant="title">{item.title || t("runner.breakTitle")}</Text>
          <Text tone="muted" style={styles.center}>
            {t("runner.breakHint")}
          </Text>
          {current.data.next ? (
            <Text variant="caption" tone="muted">
              {t("runner.nextItem", { title: current.data.next.title })}
            </Text>
          ) : null}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          {blocksOf(item).map((block) => (
            <View key={block.groupId ?? "plain"} style={styles.block}>
              {block.group ? (
                <ExamPassage
                  title={block.group.title}
                  passage={block.group.passage}
                  audioUrl={block.group.audioUrl}
                  playOnce
                  audioState={audioStates[block.group.id] ?? "idle"}
                  onAudioState={(state) =>
                    setAudioStates((currentState) => ({
                      ...currentState,
                      [block.groupId as string]: state,
                    }))
                  }
                />
              ) : null}

              {block.questions.map((question) => (
                <Card key={question.id} style={styles.question}>
                  <View style={styles.questionHead}>
                    <Text variant="caption" tone="muted">
                      {t("runner.questionNumber", { number: question.order + 1 })}
                    </Text>
                    <Text variant="caption" tone="muted">
                      {t("runner.points", { count: question.points })}
                    </Text>
                  </View>
                  <Text style={styles.questionText}>{question.text}</Text>
                  <QuestionAnswerInput
                    question={question}
                    value={answers[question.id] ?? emptyAnswer(question)}
                    onChange={(value) => {
                      dirtyRef.current = true;
                      setAnswers((currentAnswers) => ({ ...currentAnswers, [question.id]: value }));
                    }}
                  />
                </Card>
              ))}
            </View>
          ))}

          <Button
            variant="danger"
            title={t("runner.finish")}
            icon={<LogOut size={16} color={palette["destructive-foreground"]} />}
            onPress={() => setFinishOpen(true)}
          />
        </ScrollView>
      )}

      <ConfirmSheet
        open={finishOpen}
        title={t("runner.finishTitle")}
        description={t("runner.finishDescription")}
        confirmLabel={t("runner.finishConfirm")}
        loading={finish.isPending}
        onClose={() => setFinishOpen(false)}
        onConfirm={() => {
          flush();
          void finish.mutateAsync().then(() => {
            setFinishOpen(false);
            void current.refetch();
          });
        }}
      />
    </Screen>
  );
}

interface Block {
  groupId: string | null;
  group: ExamCurrentItem["groups"][number] | null;
  questions: QuizQuestion[];
}

function blocksOf(item: ExamCurrentItem): Block[] {
  const byGroup = new Map<string, QuizQuestion[]>();
  const plain: QuizQuestion[] = [];
  for (const question of item.questions) {
    if (!question.groupId) {
      plain.push(question);
      continue;
    }
    const list = byGroup.get(question.groupId) ?? [];
    list.push(question);
    byGroup.set(question.groupId, list);
  }

  const blocks: Block[] = [];
  for (const group of item.groups) {
    const list = byGroup.get(group.id);
    if (list?.length) blocks.push({ groupId: group.id, group, questions: list });
  }
  if (plain.length) blocks.push({ groupId: null, group: null, questions: plain });
  return blocks;
}

const styles = StyleSheet.create({
  head: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headBody: { flex: 1, gap: 2 },
  body: { padding: 16, gap: 16, paddingBottom: 48 },
  block: { gap: 12 },
  question: { gap: 10, borderRadius: radius.lg },
  questionHead: { flexDirection: "row", justifyContent: "space-between" },
  questionText: { fontWeight: "600" },
  break: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, padding: 24 },
  center: { textAlign: "center" },
});
