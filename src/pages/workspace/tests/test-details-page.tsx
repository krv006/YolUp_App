import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { quizDisplayTitle, useQuiz, useQuizAttempts, useQuizzes, useUpdateQuiz } from "@/modules/quiz";
import { ROUTES } from "@/shared/config";
import {
  dsAlpha,
  DsText,
  dsRadius,
  Icon,
  MobileButton,
  MobileFieldLabel,
  MobileInput,
  MobilePickerField,
  MobileScreen,
  MobileWarningNote,
  useDs,
} from "@/shared/ui";

function localValue(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * E'lon qilingan test sozlamalari — veb `test-details-page.tsx` (faqat tor
 * ekranda bor): nom, mavzu, muddat; savollar ro'yxati (urinish bo'lsa
 * qulflangan, aks holda bosilsa muharrir ochiladi).
 */
export function TestDetailsPage() {
  const { t } = useTranslation("quiz");
  const { t: tl } = useTranslation("lesson");
  const ds = useDs();
  const router = useRouter();
  const { quizId = null } = useLocalSearchParams<{ quizId: string }>();
  const months = tl("list.months", { returnObjects: true }) as string[];
  const quiz = useQuiz(quizId);
  const quizzes = useQuizzes(null);
  const attempts = useQuizAttempts(quizId, Boolean(quizId));
  const update = useUpdateQuiz();
  const [draft, setDraft] = useState<{ title: string; topic: string; due: string } | null>(null);

  const detail = quiz.data ?? null;
  const values = draft ?? { title: detail ? quizDisplayTitle(detail) : "", topic: detail?.topic ?? "", due: localValue(detail?.dueAt ?? null) };
  const topics = useMemo(
    () => [...new Set([values.topic, ...(quizzes.data ?? []).map((item) => item.topic)].filter(Boolean))].map((topic) => ({ value: topic, label: topic })),
    [quizzes.data, values.topic]
  );

  const locked = (attempts.data ?? []).length > 0;
  const due = values.due ? new Date(values.due) : null;
  const dueLabel =
    due && !Number.isNaN(due.getTime()) ? `${due.getDate()}-${(months[due.getMonth()] ?? "").slice(0, 3).toLowerCase()}, ${values.due.slice(11, 16)}` : t("details.noDue");

  function change(patch: Partial<typeof values>) {
    setDraft({ ...values, ...patch });
  }

  function close() {
    if (router.canGoBack()) router.back();
    else router.replace(ROUTES.teacher.tests as never);
  }

  function save() {
    if (!quizId || !values.title.trim()) return;
    update.mutate({ id: quizId, values: { title: values.title.trim(), topic: values.topic, dueAt: values.due || null } }, { onSuccess: close });
  }

  return (
    <MobileScreen
      title={t("details.title")}
      closeLabel={t("details.close")}
      onClose={close}
      footer={<MobileButton label={t("details.save")} disabled={update.isPending || !detail || !values.title.trim()} onPress={save} />}
    >
      {locked ? <MobileWarningNote style={styles.warning}>{t("details.lockedNotice")}</MobileWarningNote> : null}

      <View style={[styles.fields, { marginTop: locked ? 11 : 20 }]}>
        <MobileFieldLabel gap={7} label={t("newTest.name")}>
          <MobileInput surface value={values.title} onChangeText={(title) => change({ title })} />
        </MobileFieldLabel>

        <MobileFieldLabel gap={7} label={t("details.topic")}>
          <MobilePickerField
            type="select"
            surface
            value={values.topic}
            display={values.topic || t("assignDialog.pick")}
            placeholder={!values.topic}
            ariaLabel={t("details.topic")}
            options={topics}
            onChange={(topic) => change({ topic })}
          />
        </MobileFieldLabel>

        <MobileFieldLabel gap={7} label={t("newTest.due")}>
          <MobilePickerField type="datetime" surface value={values.due} display={dueLabel} ariaLabel={t("newTest.due")} onChange={(next) => change({ due: next })} />
        </MobileFieldLabel>
      </View>

      <DsText v="caption-strong" c="ink-secondary" style={styles.sectionLabel}>
        {locked ? t("details.questionsLocked") : t("details.questions")}
      </DsText>

      {/* `mt-[13px] gap-[13px]`, qator `h-[43px] rounded-lg bg-surface/75 px-3.5` */}
      <View style={styles.questions}>
        {(detail?.questions ?? []).map((question, index) => {
          const body = (
            <>
              <DsText v="body-sm" c="ink-secondary">
                {index + 1}.
              </DsText>
              <DsText v="body-sm" c="ink-secondary" numberOfLines={1} style={styles.grow}>
                {question.text || t("editor.noText")}
              </DsText>
              <Icon name={locked ? "lock-fill" : "chevron-right"} size={locked ? 16 : 18} color={ds.c["icon-tertiary"]} />
            </>
          );
          return locked ? (
            <View key={question.id} style={[styles.question, { backgroundColor: dsAlpha(ds.c.surface, 0.75) }]}>
              {body}
            </View>
          ) : (
            <Pressable
              key={question.id}
              accessibilityRole="button"
              onPress={() => quizId && router.push(ROUTES.teacher.test(quizId) as never)}
              style={({ pressed }) => [styles.question, { backgroundColor: pressed ? ds.c.surface : dsAlpha(ds.c.surface, 0.75) }]}
            >
              {body}
            </Pressable>
          );
        })}
      </View>
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  warning: { marginTop: 16 },
  fields: { gap: 11 },
  sectionLabel: { marginTop: 12, textTransform: "uppercase" },
  questions: { marginTop: 13, gap: 13 },
  question: { height: 43, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, borderRadius: dsRadius.lg },
});
