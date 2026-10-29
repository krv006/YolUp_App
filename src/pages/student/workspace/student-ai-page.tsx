import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PracticeSession, useExplainMutation, usePracticeMutation, type PracticeRequest } from "@/modules/tutor";
import { ROUTES } from "@/shared/config";
import {
  DsGradient,
  DsText,
  dsRadius,
  Icon,
  MobileFieldLabel,
  MobileInput,
  MobilePageHeader,
  MobileSegment,
  toast,
  toneColors,
  useDs,
  type IconName,
} from "@/shared/ui";

type Mode = "practice" | "explain";

const COUNTS = [3, 5, 10];

/**
 * AI repetitor — veb `student-ai-page.tsx` ning tor ekran varianti:
 * "Mashq" (mavzu yoki matn bo'yicha savollar, `PracticeSession`) va
 * "Tushuntirish" (savol, noto'g'ri va to'g'ri javob — AI izohi).
 */
export function StudentAiPage() {
  const { t } = useTranslation("student");
  const ds = useDs();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>("practice");
  const modes = [
    { id: "practice" as const, label: t("tutor.modes.practice") },
    { id: "explain" as const, label: t("tutor.modes.explain") },
  ];

  return (
    <View style={[styles.fill, { backgroundColor: ds.c.canvas }]}>
      <KeyboardAwareScrollView
        style={styles.fill}
        contentContainerStyle={[styles.page, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        bottomOffset={24}
      >
        <DsGradient name="auth" />
        <MobilePageHeader
          title={t("tutor.title")}
          backLabel={t("workspace.back")}
          onBack={() => (router.canGoBack() ? router.back() : router.replace(ROUTES.student.workspace as never))}
        />
        <MobileSegment items={modes} value={mode} onChange={setMode} />
        {mode === "practice" ? <PracticePanel /> : <ExplainPanel />}
      </KeyboardAwareScrollView>
    </View>
  );
}

/** Forma sarlavhasi — `size-10 rounded-xl` belgi, `text-title` va `text-body-xs` izoh. */
function PanelHead({ icon, tone, title, hint }: { icon: IconName; tone: string; title: string; hint: string }) {
  const ds = useDs();
  const colors = toneColors(tone, ds);
  return (
    <View style={styles.head}>
      <View style={[styles.headIcon, { backgroundColor: colors.bg }]}>
        <Icon name={icon} size={20} color={colors.fg ?? ds.c.ink} />
      </View>
      <View style={styles.grow}>
        <DsText v="title">{title}</DsText>
        <DsText v="body-xs" c="ink-secondary">
          {hint}
        </DsText>
      </View>
    </View>
  );
}

/** Yuborish tugmasi — `h-11 rounded-full bg-brand px-5 text-button text-ink-inverse disabled:opacity-60`. */
function SubmitButton({ label, disabled, onPress }: { label: string; disabled: boolean; onPress: () => void }) {
  const ds = useDs();
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.submit, { backgroundColor: pressed ? ds.c["brand-strong"] : ds.c.brand }, disabled && styles.faded]}
    >
      <Icon name="auto-awesome" size={18} color={ds.c["ink-inverse"]} />
      <DsText v="button" c="ink-inverse">
        {label}
      </DsText>
    </Pressable>
  );
}

function PracticePanel() {
  const { t } = useTranslation("student");
  const ds = useDs();
  const practice = usePracticeMutation();
  const [topic, setTopic] = useState("");
  const [material, setMaterial] = useState("");
  const [count, setCount] = useState(5);
  const [request, setRequest] = useState<PracticeRequest | null>(null);

  function run(input: PracticeRequest) {
    setRequest(input);
    practice.mutate(input, { onError: (error: Error) => toast.error(error.message) });
  }

  return (
    <View style={styles.panel}>
      {/* `flex-col gap-4 rounded-2xl bg-surface p-4` */}
      <View style={[styles.form, { backgroundColor: ds.c.surface }]}>
        <PanelHead icon="auto-awesome" tone="bg-accent-violet-bg text-accent-violet-fg" title={t("tutor.practiceTitle")} hint={t("tutor.practiceHint")} />
        <MobileFieldLabel label={t("tutor.topic")}>
          <MobileInput value={topic} maxLength={300} placeholder={t("tutor.topicPlaceholder")} onChangeText={setTopic} />
        </MobileFieldLabel>
        <MobileFieldLabel label={t("tutor.material")}>
          <MobileInput multiline multilineHeight={96} value={material} maxLength={3000} placeholder={t("tutor.materialPlaceholder")} onChangeText={setMaterial} />
        </MobileFieldLabel>
        <View style={styles.countRow}>
          <DsText v="body-xs" c="ink-secondary">
            {t("tutor.count")}
          </DsText>
          <View style={styles.counts}>
            {COUNTS.map((value) => {
              const active = count === value;
              return (
                <Pressable
                  key={value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => setCount(value)}
                  style={({ pressed }) => [
                    styles.count,
                    active ? { backgroundColor: ds.c.brand } : { borderWidth: 1, borderColor: ds.c["line-strong"], backgroundColor: pressed ? ds.c.subtle : ds.c.surface },
                  ]}
                >
                  <DsText v="body-sm" w="600" c={active ? "on-action" : "ink"}>
                    {value}
                  </DsText>
                </Pressable>
              );
            })}
          </View>
        </View>
        <SubmitButton
          label={practice.isPending ? t("tutor.generating") : t("tutor.generate")}
          disabled={!topic.trim() || practice.isPending}
          onPress={() => topic.trim() && run({ topic: topic.trim(), count, material: material.trim() })}
        />
      </View>

      {practice.isPending && !practice.data ? (
        <View style={styles.panel}>
          {Array.from({ length: 3 }, (_, index) => (
            <View key={index} style={[styles.skeleton, { backgroundColor: ds.c.skeleton }]} />
          ))}
        </View>
      ) : null}

      {practice.data ? (
        <PracticeSession
          key={practice.data.questions.map((question) => question.text).join("|")}
          set={practice.data}
          restarting={practice.isPending}
          onRestart={request ? () => run(request) : undefined}
        />
      ) : null}
    </View>
  );
}

function ExplainPanel() {
  const { t } = useTranslation("student");
  const ds = useDs();
  const explain = useExplainMutation();
  const [question, setQuestion] = useState("");
  const [wrongAnswer, setWrongAnswer] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const result = explain.data;

  function submit() {
    if (!question.trim()) return;
    explain.mutate(
      { question: question.trim(), wrongAnswer: wrongAnswer.trim(), correctAnswer: correctAnswer.trim() },
      { onError: (error: Error) => toast.error(error.message) }
    );
  }

  return (
    <View style={styles.panel}>
      <View style={[styles.form, { backgroundColor: ds.c.surface }]}>
        <PanelHead icon="help" tone="bg-accent-blue-bg text-accent-blue-fg" title={t("tutor.explainTitle")} hint={t("tutor.explainHint")} />
        <MobileFieldLabel label={t("tutor.question")}>
          <MobileInput multiline multilineHeight={112} value={question} maxLength={3000} placeholder={t("tutor.questionPlaceholder")} onChangeText={setQuestion} />
        </MobileFieldLabel>
        <MobileFieldLabel label={t("tutor.wrongAnswer")}>
          <MobileInput value={wrongAnswer} maxLength={500} onChangeText={setWrongAnswer} />
        </MobileFieldLabel>
        <MobileFieldLabel label={t("tutor.correctAnswer")}>
          <MobileInput value={correctAnswer} maxLength={500} onChangeText={setCorrectAnswer} />
        </MobileFieldLabel>
        <SubmitButton label={explain.isPending ? t("tutor.thinking") : t("tutor.explain")} disabled={!question.trim() || explain.isPending} onPress={submit} />
      </View>

      {explain.isPending && !result ? <View style={[styles.skeleton, { backgroundColor: ds.c.skeleton }]} /> : null}

      {result ? (
        <View style={[styles.form, styles.answer, { backgroundColor: ds.c.surface }]}>
          <DsText v="title">{t("tutor.answerTitle")}</DsText>
          <DsText v="body-sm">{result.explanation}</DsText>
          {result.tip ? (
            <View style={[styles.tip, { backgroundColor: ds.c["brand-subtle"] }]}>
              <Icon name="info" size={18} color={ds.c.brand} />
              <DsText v="body-sm" c="brand" style={styles.grow}>
                {result.tip}
              </DsText>
            </View>
          ) : null}
          {result.limit ? (
            <DsText v="caption" c="ink-tertiary">
              {t("tutor.usage", { used: result.used ?? 0, limit: result.limit })}
            </DsText>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  faded: { opacity: 0.6 },
  submit: { height: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 20, borderRadius: dsRadius.full },
  /* `gap-5 px-4 pt-5` — ichki sahifada suzuvchi panel yo'q, shuning uchun `pb-32` o'rniga xavfsiz hudud */
  page: { paddingHorizontal: 16, gap: 20 },
  panel: { gap: 16 },
  form: { gap: 16, padding: 16, borderRadius: dsRadius["2xl"] },
  head: { flexDirection: "row", alignItems: "center", gap: 12 },
  headIcon: { width: 40, height: 40, borderRadius: dsRadius.xl, alignItems: "center", justifyContent: "center" },
  countRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 12 },
  counts: { flexDirection: "row", gap: 8 },
  count: { height: 36, minWidth: 44, alignItems: "center", justifyContent: "center", paddingHorizontal: 12, borderRadius: dsRadius.full },
  skeleton: { height: 160, borderRadius: dsRadius["2xl"] },
  answer: { gap: 12 },
  tip: { flexDirection: "row", alignItems: "flex-start", gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderRadius: dsRadius.xl },
});
