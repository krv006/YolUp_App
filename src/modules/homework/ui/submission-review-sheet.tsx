import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { CheckCircle2, Clock3, Download, RefreshCw } from "lucide-react-native";
import type { Assignment, Submission } from "@/shared/types";
import {
  Badge,
  Button,
  Input,
  ScreenEmpty,
  ScreenLoading,
  Separator,
  Sheet,
  Text,
  useTheme,
} from "@/shared/ui";
import {
  useAssignment,
  useDownloadSubmissionFile,
  useRecheckSubmission,
  useReviewSubmission,
} from "../model/homework.queries";

export interface SubmissionReviewSheetProps {
  assignment: Assignment | null;
  onClose: () => void;
}

/**
 * Topshiriqlarni ko'rib chiqish — veb `assignment-detail-dialog.tsx` ning
 * mobil varianti.
 *
 * O'qituvchi AI qo'ygan bahoni TUZATISHI mumkin. Muhim tafsilot: backend
 * `result` maydonini AI ning ASL JSON'i ko'rinishida kutadi, shuning uchun
 * `rawResult` o'zgarishsiz qaytariladi — domen ko'rinishidan qayta yig'sak,
 * mapper bilmaydigan maydonlar (AI yangi kalit qo'shsa) jimgina yo'qolardi
 * (`domain.ts` dagi izoh).
 */
export function SubmissionReviewSheet({ assignment, onClose }: SubmissionReviewSheetProps) {
  const [selected, setSelected] = useState<Submission | null>(null);

  /*
   * Ro'yxatdan kelgan vazifa QISQARTIRILGAN bo'lishi mumkin (topshiriqlar
   * soni ko'p bo'lsa server ularni to'liq bermaydi), shuning uchun oyna
   * ochilganda tafsilot alohida so'raladi — 🟢 veb ham shunday qiladi.
   * So'rov kelguncha ro'yxatdagi nusxa ko'rsatiladi: oyna bo'sh turmaydi.
   */
  const detail = useAssignment(assignment?.id ?? null);
  const data = detail.data ?? assignment;

  return (
    <Sheet
      open={Boolean(assignment)}
      onClose={() => {
        setSelected(null);
        onClose();
      }}
      title={data?.title ?? ""}
      description={
        data
          ? `${data.submissions.length} ta topshiriq${
              data.stats?.studentsCount ? ` · ${data.stats.studentsCount} o'quvchi` : ""
            }`
          : undefined
      }
    >
      {detail.isLoading && !assignment ? <ScreenLoading label="Yuklanmoqda…" /> : null}

      {data && data.submissions.length === 0 ? (
        <ScreenEmpty title="Hali topshirilmagan" description="O'quvchilar topshirgach shu yerda ko'rinadi." />
      ) : null}

      {(data?.submissions ?? []).map((submission, index) => (
        <View key={submission.id}>
          {index > 0 ? <Separator /> : null}
          <SubmissionRow
            submission={submission}
            expanded={selected?.id === submission.id}
            onToggle={() => setSelected(selected?.id === submission.id ? null : submission)}
          />
        </View>
      ))}
    </Sheet>
  );
}

function SubmissionRow({
  submission,
  expanded,
  onToggle,
}: {
  submission: Submission;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { palette } = useTheme();
  const review = useReviewSubmission();
  const recheck = useRecheckSubmission();

  // Yuklab olish 🟢 ko'chirilgan hook orqali: xato matni va fayl nomi
  // qoidasi veb bilan bitta joyda turadi.
  const downloadFile = useDownloadSubmissionFile();
  const busy = downloadFile.isPending;

  function save(score: string, grade: string) {
    review.mutate({
      id: submission.id,
      input: {
        overallScore: score.trim() === "" ? null : Number(score),
        grade: grade.trim(),
        // AI ning ASL JSON'i — izohi komponent boshida.
        result: submission.rawResult,
      },
    });
  }

  const statusTone =
    submission.status === "done" ? "success" : submission.status === "error" ? "danger" : "warning";

  return (
    <View style={styles.row}>
      <View style={styles.head}>
        <View style={styles.body}>
          <Text
            accessibilityRole="button"
            onPress={onToggle}
            variant="label"
            numberOfLines={1}
          >
            {submission.studentName}
          </Text>
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {submission.fileName}
            {submission.isLate ? " · kech" : ""}
          </Text>
        </View>

        <Badge
          label={
            submission.status === "done"
              ? `${submission.overallScore ?? "—"} ball`
              : submission.status === "checking"
                ? "Tekshirilmoqda"
                : "Xato"
          }
          tone={statusTone}
        />
      </View>

      {expanded ? (
        <View style={styles.detail}>
          <View style={styles.actions}>
            <Button
              title="Faylni ochish"
              variant="secondary"
              fullWidth={false}
              loading={busy}
              icon={<Download size={15} color={palette["secondary-foreground"]} />}
              onPress={() =>
                downloadFile.mutate({ id: submission.id, fileName: submission.fileName })
              }
            />
            <Button
              title="Qayta tekshirish"
              variant="ghost"
              fullWidth={false}
              loading={recheck.isPending}
              icon={<RefreshCw size={15} color={palette["primary-text"]} />}
              onPress={() => recheck.mutate(submission.id)}
            />
          </View>

          {submission.status === "checking" ? (
            <View style={styles.note}>
              <Clock3 size={14} color={palette["warning-strong"]} />
              <Text variant="caption" tone="muted">
                AI tekshiruvi tugagach baho o'zi yangilanadi.
              </Text>
            </View>
          ) : null}

          {submission.result?.summary ? (
            <Text variant="caption" tone="muted">
              AI xulosasi natija oynasida to'liq ko'rinadi.
            </Text>
          ) : null}

          <Text variant="label">Bahoni tuzatish</Text>
          {/*
           * `key` serverdan kelgan bahoga bog'langan: qayta tekshiruvdan
           * keyin yangi qiymat kelsa forma o'zi qayta boshlanadi. Bu —
           * React'ning tavsiya etgan naqshi; effekt bilan sinxronlash
           * kaskadli render berardi.
           */}
          <GradeForm
            key={`${submission.overallScore ?? ""}-${submission.grade}`}
            initialScore={String(submission.overallScore ?? "")}
            initialGrade={submission.grade}
            saving={review.isPending}
            onSave={save}
          />
        </View>
      ) : null}
    </View>
  );
}

function GradeForm({
  initialScore,
  initialGrade,
  saving,
  onSave,
}: {
  initialScore: string;
  initialGrade: string;
  saving: boolean;
  onSave: (score: string, grade: string) => void;
}) {
  const { palette } = useTheme();
  const [score, setScore] = useState(initialScore);
  const [grade, setGrade] = useState(initialGrade);

  return (
    <>
      <View style={styles.gradeRow}>
        <View style={styles.scoreField}>
          <Input
            label="Ball"
            value={score}
            onChangeText={setScore}
            keyboardType="number-pad"
            placeholder="0-100"
          />
        </View>
        <View style={styles.gradeField}>
          <Input label="Baho" value={grade} onChangeText={setGrade} placeholder="A'lo" />
        </View>
      </View>

      <Button
        title="Bahoni saqlash"
        loading={saving}
        icon={<CheckCircle2 size={16} color={palette["primary-foreground"]} />}
        onPress={() => onSave(score, grade)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 10, gap: 10 },
  head: { flexDirection: "row", alignItems: "center", gap: 10 },
  body: { flex: 1, gap: 2 },
  detail: { gap: 10, paddingTop: 4 },
  actions: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  note: { flexDirection: "row", alignItems: "center", gap: 6 },
  gradeRow: { flexDirection: "row", gap: 12 },
  scoreField: { width: 110 },
  gradeField: { flex: 1 },
});
