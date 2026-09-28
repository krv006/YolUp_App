import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { CircleAlert, Clock3, Lightbulb } from "lucide-react-native";
import type { AiQuestion, Submission } from "@/shared/types";
import {
  Badge,
  radius,
  ScreenLoading,
  Separator,
  Sheet,
  Text,
  useTheme,
  type BadgeTone,
} from "@/shared/ui";

export interface HomeworkResultSheetProps {
  submission: Submission | null;
  onClose: () => void;
}

/**
 * AI tekshiruvi natijasi — veb `homework-result-dialog.tsx` (430 qator) ning
 * mobil varianti.
 *
 * Backend `mistakes`, `suggestions`, `strengths` kabi maydonlarni `unknown[]`
 * sifatida beradi (AI JSON'i o'zgarishi mumkin, mapper uni qattiq tiplamaydi).
 * Shuning uchun har element render qilishdan oldin matnga aylantiriladi —
 * kutilmagan shakl ekranni yiqitmaydi.
 */
export function HomeworkResultSheet({ submission, onClose }: HomeworkResultSheetProps) {
  const { t } = useTranslation("mobile");
  return (
    <Sheet
      open={Boolean(submission)}
      onClose={onClose}
      title={t("homework.tekshiruv_natijasi")}
      description={submission?.fileName}
    >
      {submission ? <ResultBody submission={submission} /> : null}
    </Sheet>
  );
}

function ResultBody({ submission }: { submission: Submission }) {
  const { t } = useTranslation("mobile");
  const { palette } = useTheme();

  if (submission.status === "checking") {
    return (
      <View style={styles.center}>
        <Clock3 size={28} color={palette["muted-foreground"]} />
        <ScreenLoading label={t("homework.ai_ishingizni_tekshirmoqda")} />
        <Text variant="caption" tone="muted" style={styles.centerText}>
          Bu bir necha daqiqa olishi mumkin. Ekranni yopib turishingiz mumkin —
          natija tayyor bo'lgach shu yerda ko'rinadi.
        </Text>
      </View>
    );
  }

  if (submission.status === "error") {
    return (
      <View style={[styles.alert, { backgroundColor: palette["destructive-soft"] }]}>
        <CircleAlert size={18} color={palette["destructive-strong"]} />
        <Text variant="caption" style={{ flex: 1, color: palette["destructive-strong"] }}>
          {submission.error || "Tekshiruvda xatolik yuz berdi. O'qituvchiga murojaat qiling."}
        </Text>
      </View>
    );
  }

  const result = submission.result;

  return (
    <>
      <View style={[styles.score, { backgroundColor: palette["primary-tint"] }]}>
        <View style={styles.scoreBody}>
          <Text variant="caption" tone="muted">
            {t("homework.umumiy_natija")}
          </Text>
          <Text variant="title">{submission.overallScore ?? "—"}</Text>
        </View>
        <Badge label={submission.grade || "Baholanmagan"} tone={gradeTone(submission.overallScore)} />
      </View>

      {submission.isLate ? <Badge label={t("homework.kech_topshirilgan")} tone="warning" /> : null}

      {result?.summary ? (
        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <View style={styles.cardHead}>
            <Lightbulb size={16} color={palette["primary-text"]} />
            <Text variant="label">Xulosa</Text>
          </View>
          <ListBlock title={t("homework.kuchli_tomonlar")} items={result.summary.strengths} />
          <ListBlock title={t("homework.zaif_tomonlar")} items={result.summary.weaknesses} />
          <ListBlock title={t("homework.takrorlash_kerak")} items={result.summary.topicsToReview} />
          <ListBlock title={t("homework.tavsiyalar")} items={result.summary.recommendations} />
        </View>
      ) : null}

      {(result?.questions ?? []).map((question, index) => (
        <QuestionBlock key={index} index={index + 1} question={question} />
      ))}
    </>
  );
}

function QuestionBlock({ index, question }: { index: number; question: AiQuestion }) {
  const { t } = useTranslation("mobile");
  const { palette } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
      <View style={styles.cardHead}>
        <Text variant="caption" tone="brand" style={styles.cardTitle}>
          {question.questionNumber ?? index}-savol
        </Text>
        {typeof question.score === "number" ? (
          <Badge label={`${question.score} ball`} tone={gradeTone(question.score)} />
        ) : null}
      </View>

      {question.question ? <Text variant="label">{question.question}</Text> : null}

      {question.studentAnswer ? (
        <Field label={t("homework.sizning_javobingiz")} value={question.studentAnswer} />
      ) : null}
      {question.correctAnswer ? (
        <Field label={t("homework.togri_javob")} value={question.correctAnswer} tone="success" />
      ) : null}
      {question.analysis ? <Field label={t("homework.tahlil")} value={question.analysis} /> : null}

      <ListBlock title={t("homework.xatolar")} items={question.mistakes} />
      <ListBlock title={t("homework.tavsiyalar")} items={question.suggestions} />
    </View>
  );
}

function Field({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "success";
}) {
  const { palette } = useTheme();
  return (
    <View style={styles.field}>
      <Text variant="caption" tone="muted">
        {label}
      </Text>
      <Text
        variant="caption"
        style={tone === "success" ? { color: palette["success-strong"] } : undefined}
      >
        {value}
      </Text>
    </View>
  );
}

/**
 * Backend `unknown[]` beradi — element satr, obyekt yoki hatto `null`
 * bo'lishi mumkin. Faqat matnga aylantira oladiganlari ko'rsatiladi.
 */
function ListBlock({ title, items }: { title: string; items?: unknown[] }) {
  const texts = (items ?? [])
    .map((item) => (typeof item === "string" ? item : item ? JSON.stringify(item) : ""))
    .filter(Boolean);

  if (texts.length === 0) return null;

  return (
    <View style={styles.listBlock}>
      <Separator />
      <Text variant="caption" tone="muted">
        {title}
      </Text>
      {texts.map((text, index) => (
        <Text key={index} variant="caption">
          • {text}
        </Text>
      ))}
    </View>
  );
}

/** 80+ a'lo, 50+ qoniqarli, pastrog'i e'tibor talab qiladi. */
function gradeTone(score: number | null | undefined): BadgeTone {
  if (score === null || score === undefined) return "neutral";
  if (score >= 80) return "success";
  if (score >= 50) return "warning";
  return "danger";
}

const styles = StyleSheet.create({
  center: { alignItems: "center", gap: 12, paddingVertical: 24 },
  centerText: { textAlign: "center" },
  alert: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: radius.sm },
  score: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: radius.lg,
  },
  scoreBody: { flex: 1, gap: 2 },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: 14,
    gap: 8,
  },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { flex: 1 },
  field: { gap: 2 },
  listBlock: { gap: 4, paddingTop: 4 },
});
