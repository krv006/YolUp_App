import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Choice } from "@/modules/quiz";
import { Badge, Button, ConfirmSheet, radius, Text, useTheme } from "@/shared/ui";
import type { MockAttempt } from "../api/mock-test.dto";
import { useSubmitMockTest } from "../model/mock-test.queries";

function remainingSeconds(deadline: string): number {
  return Math.max(0, Math.floor((new Date(deadline).getTime() - Date.now()) / 1000));
}

function formatClock(seconds: number): string {
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

/** Oxirgi daqiqada soat qizaradi — veb `is-urgent` klassi bilan bir xil. */
const URGENT_SECONDS = 60;

export interface MockTestRunnerProps {
  mockTestId: string;
  attempt: MockAttempt;
  onFinished: (score: { total: number; max: number }) => void;
  onCancel: () => void;
}

/**
 * Mock test yechish — veb `mock-test-runner.tsx` ning mobil varianti.
 *
 * Vaqt mantiqi VEBDAN O'ZGARISHSIZ: muddat absolyut sana
 * (`attempt.deadline`), qolgan vaqt har soniyada qaytadan hisoblanadi va
 * nolga yetganda javoblar avtomatik yuboriladi. Absolyut sana muhim —
 * ilova fonga chiqib qaytsa ham vaqt "to'xtab qolmaydi".
 *
 * 🟡 MOBIL FARQLARI:
 *
 *   · Soat va tugmalar YUQORIDA QOTIRILGAN. Vebda ular sahifa boshida
 *     turadi va pastga aylantirilganda ko'rinmay qoladi. Imtihonda qolgan
 *     vaqt har doim ko'rinishi kerak.
 *   · "To'xtatish" TASDIQ so'raydi. Vebda u darhol chiqaradi; telefonda
 *     tasodifan bosish ancha oson va urinish qaytarib bo'lmaydi.
 *   · Variant tugmasi quiz modulidan olinadi (`Choice`) — vebda ham
 *     ikkalasi bitta CSS klassini bo'lishadi.
 */
export function MockTestRunner({ mockTestId, attempt, onFinished, onCancel }: MockTestRunnerProps) {
  const { palette } = useTheme();
  const submit = useSubmitMockTest();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [left, setLeft] = useState(() => remainingSeconds(attempt.deadline));
  const [cancelOpen, setCancelOpen] = useState(false);
  const autoSubmitted = useRef(false);

  const payload = useMemo(
    () => ({
      sections: attempt.sections.map((section) => ({
        quiz: section.quizId,
        answers: section.questions
          .filter((question) => answers[question.id])
          .map((question) => ({ question: question.id, selected_option: answers[question.id] })),
      })),
    }),
    [attempt.sections, answers]
  );

  /*
   * Javoblar REF orqali ham saqlanadi: taymer effekti bir marta o'rnatiladi
   * va uning ichidagi `payload` eskirib qolardi — vaqt tugaganda BO'SH
   * javoblar yuborilardi. Veb ham aynan shunday qiladi.
   */
  const payloadRef = useRef(payload);
  useEffect(() => {
    payloadRef.current = payload;
  }, [payload]);

  const finishRef = useRef<() => void>(() => undefined);

  const totalQuestions = attempt.sections.reduce((sum, section) => sum + section.questions.length, 0);
  const answeredCount = Object.keys(answers).length;

  useEffect(() => {
    finishRef.current = () => {
      if (autoSubmitted.current) return;
      autoSubmitted.current = true;
      submit
        .mutateAsync({ id: mockTestId, attemptId: attempt.id, payload: payloadRef.current })
        .then((result) => onFinished({ total: result.totalScore, max: result.totalMaxScore }))
        .catch(() => undefined);
    };
  }, [attempt.id, mockTestId, onFinished, submit]);

  useEffect(() => {
    const timer = setInterval(() => {
      const next = remainingSeconds(attempt.deadline);
      setLeft(next);
      if (next === 0) finishRef.current();
    }, 1000);
    return () => clearInterval(timer);
  }, [attempt.deadline]);

  async function handleSubmit() {
    if (autoSubmitted.current) return;
    autoSubmitted.current = true;
    try {
      const result = await submit.mutateAsync({ id: mockTestId, attemptId: attempt.id, payload });
      onFinished({ total: result.totalScore, max: result.totalMaxScore });
    } catch {
      // Yuborilmadi — qayta urinish mumkin bo'lishi uchun qulfni ochamiz.
      autoSubmitted.current = false;
    }
  }

  const urgent = left <= URGENT_SECONDS;

  return (
    <>
      <View style={[styles.bar, { backgroundColor: palette.card, borderBottomColor: palette.border }]}>
        <View style={styles.barTop}>
          <Text variant="caption" tone="muted">
            {answeredCount} / {totalQuestions} javob berildi
          </Text>
          <Badge label={formatClock(left)} tone={urgent ? "danger" : "neutral"} />
        </View>

        <View style={styles.barActions}>
          <View style={styles.half}>
            <Button title="To'xtatish" variant="secondary" onPress={() => setCancelOpen(true)} />
          </View>
          <View style={styles.half}>
            <Button title="Topshirish" loading={submit.isPending} onPress={() => void handleSubmit()} />
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {attempt.sections.map((section, sectionIndex) => (
          <View key={section.quizId} style={styles.section}>
            <Text variant="label">
              {sectionIndex + 1}. {section.quizTitle}
            </Text>

            {section.questions.map((question, index) => (
              <View
                key={question.id}
                style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}
              >
                <View style={styles.cardHead}>
                  <Text variant="caption" tone="brand">
                    {index + 1}-savol
                  </Text>
                  <Badge label={`${question.points} ball`} tone="neutral" />
                </View>

                <Text variant="label">{question.text}</Text>

                <View style={styles.options}>
                  {question.options.map((option) => (
                    <Choice
                      key={option.id}
                      label={option.text}
                      selected={answers[question.id] === option.id}
                      shape="radio"
                      onPress={() =>
                        setAnswers((current) => ({ ...current, [question.id]: option.id }))
                      }
                    />
                  ))}
                </View>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>

      <ConfirmSheet
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Imtihonni to'xtatish"
        description="Javoblaringiz yuborilmaydi va urinish bekor bo'ladi."
        onConfirm={() => {
          setCancelOpen(false);
          onCancel();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    gap: 10,
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  barTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  barActions: { flexDirection: "row", gap: 10 },
  half: { flex: 1 },
  body: { gap: 16, padding: 20 },
  section: { gap: 10 },
  card: {
    gap: 8,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  options: { gap: 8, marginTop: 4 },
});
