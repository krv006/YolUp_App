import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { pickDocument, toUploadFile, type PickedFile } from "@/shared/lib";
import type { QuizImportPreview, QuizSummary } from "@/shared/types";
import { bodyFont, DsText, dsRadius, Icon, MobileButton, MobileInput, Sheet, toast, useDs } from "@/shared/ui";
import { quizApi } from "../api/quiz.api";
import type { QuizImportRequest } from "../api/quiz.dto";
import { useDownloadQuizTemplate, useImportGoogleLink, useImportQuizDocx } from "../model/quiz.queries";

export interface QuizImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: QuizImportRequest;
  onImported?: (quiz: QuizSummary) => void;
}

/** Vebdagi `accept=".docx,.xlsx,.json"` ning MIME ko'rinishi. */
const ACCEPT = [
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/json",
];
const TEMPLATES = ["docx", "xlsx"] as const;
const TEMPLATE_QUESTION_COUNT = 10;

/**
 * Testni import qilish — veb `quiz-import-dialog.tsx` ning tor ekran
 * varianti (pastki oyna): fayl (DOCX, XLSX, JSON) yoki Google Forms/Docs
 * havolasi, shablonlar, fayl tanlanganda topilgan savollar va ogohlantirishlar.
 */
export function QuizImportDialog({ open, onOpenChange, request, onImported }: QuizImportDialogProps) {
  const { t } = useTranslation("quiz");
  const ds = useDs();
  const [file, setFile] = useState<PickedFile | null>(null);
  const [link, setLink] = useState("");
  const [preview, setPreview] = useState<QuizImportPreview | null>(null);

  const importDocx = useImportQuizDocx();
  const importLink = useImportGoogleLink();
  const downloadTemplate = useDownloadQuizTemplate();
  const previewFile = useMutation({
    mutationFn: (value: PickedFile) => quizApi.importDocxPreview(toUploadFile(value)),
    onSuccess: setPreview,
    onError: (error: Error) => toast.error(error.message),
  });

  const pending = importDocx.isPending || importLink.isPending || previewFile.isPending;

  function reset() {
    setFile(null);
    setLink("");
    setPreview(null);
  }

  function close() {
    reset();
    onOpenChange(false);
  }

  async function pick() {
    const next = await pickDocument(ACCEPT);
    if (!next) return;
    setFile(next);
    setPreview(null);
    previewFile.mutate(next);
  }

  function done(quiz: QuizSummary) {
    onImported?.(quiz);
    close();
  }

  function submit() {
    if (file) {
      importDocx.mutate({ file: toUploadFile(file), request }, { onSuccess: (result) => done(result.quiz) });
      return;
    }
    if (!link.trim()) return;
    const source = link.includes("/forms/") ? "google_form" : "google_doc";
    importLink.mutate({ source, url: link.trim(), request }, { onSuccess: (result) => done(result.quiz) });
  }

  return (
    <Sheet
      variant="app"
      open={open}
      onClose={close}
      title={t("importDialog.title")}
      description={t("importDialog.description")}
      footer={
        <>
          <MobileButton variant="secondary" label={t("importDialog.cancel")} onPress={close} />
          <MobileButton label={t("importDialog.submit")} disabled={pending || (!file && !link.trim())} onPress={submit} />
        </>
      }
    >
      <View style={styles.body}>
        {/* `h-28 rounded-lg border-[1.5px] border-dashed border-brand bg-subtle` */}
        <Pressable
          accessibilityRole="button"
          onPress={() => void pick()}
          style={({ pressed }) => [styles.drop, { borderColor: ds.c.brand, backgroundColor: pressed ? ds.c["brand-subtle"] : ds.c.subtle }]}
        >
          <Icon name="upload" size={22} color={ds.c.brand} />
          <DsText v="title" numberOfLines={1} style={styles.dropTitle}>
            {file ? file.name : t("importDialog.pickFile")}
          </DsText>
          <DsText v="body-xs" c="ink-secondary" style={styles.dropHint}>
            {t("importDialog.pickHint")}
          </DsText>
        </Pressable>

        <View style={styles.templates}>
          <DsText v="body-xs" c="ink-secondary">
            {t("importDialog.templates")}
          </DsText>
          {TEMPLATES.map((type) => (
            <DsText
              key={type}
              v="body-xs"
              w="500"
              c="brand"
              accessibilityRole="button"
              onPress={downloadTemplate.isPending ? undefined : () => downloadTemplate.mutate({ type, count: TEMPLATE_QUESTION_COUNT })}
              style={downloadTemplate.isPending && styles.faded}
            >
              .{type}
            </DsText>
          ))}
        </View>

        <View style={styles.linkField}>
          <DsText v="caption-strong" c="ink-secondary" style={styles.upper}>
            {t("importDialog.googleLabel")}
          </DsText>
          <MobileInput
            value={link}
            placeholder="docs.google.com/forms/d/1aB…"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            style={styles.linkInput}
            onChangeText={(value) => {
              setLink(value);
              setFile(null);
              setPreview(null);
            }}
          />
        </View>

        <DsText v="body-xs" c="ink-secondary" style={styles.hint}>
          {t("importDialog.googleHint")}
        </DsText>

        {preview ? (
          <View style={[styles.preview, { backgroundColor: ds.c["warning-bg"] }]}>
            <View style={styles.previewHead}>
              <Icon name="warning-fill" size={18} color={ds.c["accent-saffron-fg"]} />
              <DsText v="title" style={styles.grow}>
                {t("importDialog.found", { count: preview.questions.length, warnings: preview.warnings.length })}
              </DsText>
            </View>
            {preview.warnings.slice(0, 2).map((warning) => (
              <DsText key={warning.questionNumber} v="body-sm" c="ink-secondary">
                {t("importDialog.warningLine", { number: warning.questionNumber, reason: warning.reason })}
              </DsText>
            ))}
          </View>
        ) : null}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  faded: { opacity: 0.5 },
  upper: { textTransform: "uppercase" },
  body: { marginTop: -2 },
  drop: { height: 112, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, borderWidth: 1.5, borderStyle: "dashed", borderRadius: dsRadius.lg },
  dropTitle: { marginTop: 8, maxWidth: "100%" },
  dropHint: { marginTop: 4, textAlign: "center" },
  templates: { marginTop: 12, flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  linkField: { marginTop: 11, gap: 12 },
  linkInput: { height: 56, fontFamily: bodyFont("600") },
  hint: { marginTop: 12 },
  preview: { marginTop: 8, gap: 1, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 9, borderRadius: dsRadius.lg },
  previewHead: { flexDirection: "row", alignItems: "center", gap: 8 },
});
