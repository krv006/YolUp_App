import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import {
  Camera,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileUp,
  ImageIcon,
  Paperclip,
  Plus,
  Trash2,
} from "lucide-react-native";
import {
  useAssignments,
  useDeleteAssignment,
  useDownloadAssignmentFile,
  useSubmission,
  useSubmitHomework,
} from "@/modules/homework";
import { HomeworkResultSheet } from "@/modules/homework/ui/homework-result-sheet";
import { SubmissionReviewSheet } from "@/modules/homework/ui/submission-review-sheet";
import { useLessons } from "@/modules/lesson";
import { AddAssignmentSheet } from "./add-assignment-sheet";
import { formatDayTime, pickDocument, pickImage, toUploadFile, type PickedFile } from "@/shared/lib";
import type { Assignment, Submission } from "@/shared/types";
import {
  Badge,
  Button,
  ConfirmSheet,
  IconButton,
  radius,
  ScreenEmpty,
  ScreenLoading,
  Sheet,
  Text,
  useTheme,
} from "@/shared/ui";

/** Muddat o'tganmi — kech topshirish backendda belgilanadi, bu faqat ko'rinish. */
function isOverdue(assignment: Assignment): boolean {
  return Boolean(assignment.dueAt && new Date(assignment.dueAt) < new Date());
}

/**
 * Kurs vazifalari — veb `student-group-workspace.tsx` ning "Vazifalar"
 * bo'limi.
 *
 * O'quvchi vazifani o'qiydi, faylini biriktiradi va topshiradi; AI natijasi
 * tayyor bo'lgach shu yerda ochiladi.
 */
export function AssignmentsSection({
  courseId,
  isTeacher = false,
  subject = "",
}: {
  courseId: string;
  isTeacher?: boolean;
  /** Kurs fani — til fanlarida vazifaga "tekshiruv turi" tanlovi qo'shiladi. */
  subject?: string;
}) {
  const { palette } = useTheme();
  const assignments = useAssignments(courseId);
  const removeAssignment = useDeleteAssignment();
  const [deleteTarget, setDeleteTarget] = useState<Assignment | null>(null);
  // Darslar faqat o'qituvchiga kerak — vazifani tugagan darsga bog'lash uchun.
  const lessons = useLessons({ course: courseId, page_size: 100 }, isTeacher && Boolean(courseId));
  const [selected, setSelected] = useState<Assignment | null>(null);
  const [resultOf, setResultOf] = useState<Submission | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [reviewOf, setReviewOf] = useState<Assignment | null>(null);

  if (assignments.isLoading) return <ScreenLoading label="Vazifalar yuklanmoqda…" />;

  const items = assignments.data ?? [];

  return (
    <>
      <ScrollView contentContainerStyle={styles.list}>
        {isTeacher ? (
          <Button
            title="Vazifa qo'shish"
            variant="secondary"
            icon={<Plus size={16} color={palette["secondary-foreground"]} />}
            onPress={() => setAddOpen(true)}
          />
        ) : null}

        {items.length === 0 ? (
          <ScreenEmpty
            title="Vazifa yo'q"
            description={
              isTeacher
                ? "Birinchi vazifani qo'shing."
                : "O'qituvchi vazifa berganda shu yerda ko'rinadi."
            }
          />
        ) : null}

        {items.map((assignment) => (
          <Pressable
            key={assignment.id}
            accessibilityRole="button"
            onPress={() => (isTeacher ? setReviewOf(assignment) : setSelected(assignment))}
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: palette.card,
                borderColor: palette.border,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <View style={styles.cardHead}>
              <View style={styles.cardBody}>
                <Text variant="label" numberOfLines={2}>
                  {assignment.title}
                </Text>
                <Text variant="caption" tone="muted" numberOfLines={1}>
                  {assignment.dueAt ? formatDayTime(assignment.dueAt) : "muddat yo'q"}
                </Text>
              </View>
              {assignment.hasAttachment ? (
                <Paperclip size={16} color={palette["muted-foreground"]} />
              ) : null}

              {/* O'chirish — kartani ochib yubormasligi uchun alohida tugma. */}
              {isTeacher ? (
                <IconButton
                  accessibilityLabel={`${assignment.title} vazifasini o'chirish`}
                  onPress={() => setDeleteTarget(assignment)}
                >
                  <Trash2 size={17} color={palette.destructive} />
                </IconButton>
              ) : null}
            </View>

            <View style={styles.cardFoot}>
              {isTeacher ? (
                <View style={styles.teacherFoot}>
                  <ClipboardList size={14} color={palette["muted-foreground"]} />
                  <Text variant="caption" tone="muted">
                    {assignment.submissionsCount ?? assignment.submissions.length} ta topshiriq
                  </Text>
                </View>
              ) : assignment.mySubmission ? (
                <SubmissionPill submission={assignment.mySubmission} onOpen={setResultOf} />
              ) : (
                <Badge
                  label={isOverdue(assignment) ? "Muddat o'tgan" : "Topshirilmagan"}
                  tone={isOverdue(assignment) ? "danger" : "neutral"}
                />
              )}
            </View>
          </Pressable>
        ))}
      </ScrollView>

      <ConfirmSheet
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Vazifani o'chirish"
        description={`"${deleteTarget?.title ?? ""}" va unga bog'liq topshiriqlar o'chadi.`}
        loading={removeAssignment.isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          removeAssignment.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
        }}
      />

      <AssignmentSheet
        assignment={selected}
        onClose={() => setSelected(null)}
        onOpenResult={setResultOf}
      />
      <HomeworkResultSheet submission={resultOf} onClose={() => setResultOf(null)} />

      <AddAssignmentSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        courseId={courseId}
        lessons={lessons.data ?? []}
        isLanguageSubject={/til|language|ingliz|english/i.test(subject)}
      />
      <SubmissionReviewSheet assignment={reviewOf} onClose={() => setReviewOf(null)} />
    </>
  );
}

/**
 * Topshirilgan ishning holati. `useSubmission` `checking` bo'lganda polling
 * qiladi — AI tekshiruvi tugagach ro'yxatdagi belgi o'zi yangilanadi
 * (veb bilan bir xil xulq).
 */
function SubmissionPill({
  submission,
  onOpen,
}: {
  submission: Submission;
  onOpen: (submission: Submission) => void;
}) {
  const { palette } = useTheme();
  const live = useSubmission(submission.id, { poll: submission.status === "checking" });
  const data = live.data ?? submission;

  const config =
    data.status === "done"
      ? {
          background: palette["success-soft"],
          color: palette["success-strong"],
          label: `${data.overallScore} ball`,
          icon: <CheckCircle2 size={14} color={palette["success-strong"]} />,
        }
      : data.status === "error"
        ? {
            background: palette["destructive-soft"],
            color: palette["destructive-strong"],
            label: "Tekshiruv xatosi",
            icon: null,
          }
        : {
            background: palette["warning-soft"],
            color: palette["warning-strong"],
            label: "Tekshirilmoqda…",
            icon: <Clock3 size={14} color={palette["warning-strong"]} />,
          };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Natijani ochish"
      onPress={() => onOpen(data)}
      style={({ pressed }) => [
        styles.pill,
        { backgroundColor: config.background, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      {config.icon}
      <Text variant="caption" style={{ color: config.color }}>
        {config.label}
      </Text>
    </Pressable>
  );
}

function AssignmentSheet({
  assignment,
  onClose,
  onOpenResult,
}: {
  assignment: Assignment | null;
  onClose: () => void;
  onOpenResult: (submission: Submission) => void;
}) {
  const { palette } = useTheme();
  const [file, setFile] = useState<PickedFile | null>(null);
  const submit = useSubmitHomework();
  const download = useDownloadAssignmentFile();

  async function choose(picker: () => Promise<PickedFile | null>) {
    const picked = await picker();
    if (picked) setFile(picked);
  }

  async function send() {
    if (!assignment || !file) return;
    try {
      await submit.mutateAsync({
        assignmentId: assignment.id,
        file: toUploadFile(file),
        skillKey: assignment.skillKey,
      });
      setFile(null);
      onClose();
    } catch {
      /*
       * XATO BU YERDA KO'RSATILMAYDI — uni mutatsiyaning `onError` i
       * chiqaradi. Ilgari ikkalasi ham chiqarardi va toast EKRANDA IKKI
       * MARTA ko'rinardi.
       *
       * `catch` o'zi kerak: `mutateAsync` rad javob bersa, quyidagi
       * `close()` bajarilmasligi va rad javob e'tiborsiz qolmasligi shart.
       */
    }
  }

  return (
    <Sheet
      open={Boolean(assignment)}
      onClose={() => {
        setFile(null);
        onClose();
      }}
      title={assignment?.title ?? ""}
      description={assignment?.dueAt ? `Muddat: ${formatDayTime(assignment.dueAt)}` : "Muddat yo'q"}
    >
      {assignment ? (
        <>
          {assignment.body || assignment.description ? (
            <Text>{assignment.body || assignment.description}</Text>
          ) : null}

          {assignment.hasAttachment ? (
            <Button
              title={assignment.attachmentName || "Vazifa faylini ochish"}
              variant="secondary"
              loading={download.isPending}
              icon={<Paperclip size={16} color={palette["secondary-foreground"]} />}
              onPress={() =>
                download.mutate({
                  id: assignment.id,
                  fileName: assignment.attachmentName || assignment.title,
                })
              }
            />
          ) : null}

          {assignment.mySubmission ? (
            <Button
              title="Natijani ko'rish"
              variant="secondary"
              onPress={() => {
                onOpenResult(assignment.mySubmission as Submission);
                onClose();
              }}
            />
          ) : null}

          <Text variant="label">Javobingizni biriktiring</Text>
          <Text variant="caption" tone="muted">
            PDF, DOCX yoki rasm. Eng ko'pi 25 MB.
            {assignment.skillKey === "speaking" ? " Speaking uchun audio ham mumkin." : ""}
          </Text>

          <View style={styles.pickers}>
            <IconButton accessibilityLabel="Fayl tanlash" onPress={() => void choose(pickDocument)}>
              <FileUp size={22} color={palette["primary-text"]} />
            </IconButton>
            <IconButton
              accessibilityLabel="Galereyadan rasm"
              onPress={() => void choose(() => pickImage("library"))}
            >
              <ImageIcon size={22} color={palette["primary-text"]} />
            </IconButton>
            <IconButton
              accessibilityLabel="Kameradan suratga olish"
              onPress={() => void choose(() => pickImage("camera"))}
            >
              <Camera size={22} color={palette["primary-text"]} />
            </IconButton>
          </View>

          {file ? (
            <View style={[styles.file, { backgroundColor: palette["primary-tint"] }]}>
              <Paperclip size={15} color={palette["primary-text"]} />
              <Text variant="caption" numberOfLines={1} style={styles.fileName}>
                {file.name}
              </Text>
              <Text
                accessibilityRole="button"
                onPress={() => setFile(null)}
                variant="caption"
                tone="danger"
              >
                O'chirish
              </Text>
            </View>
          ) : null}

          <Button
            title="Topshirish"
            size="lg"
            disabled={!file}
            loading={submit.isPending}
            onPress={() => void send()}
          />
        </>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 12 },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: 14,
    gap: 10,
  },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardBody: { flex: 1, gap: 3 },
  cardFoot: { flexDirection: "row" },
  teacherFoot: { flexDirection: "row", alignItems: "center", gap: 6 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
  },
  pickers: { flexDirection: "row", gap: 8 },
  file: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: radius.sm },
  fileName: { flex: 1 },
});
