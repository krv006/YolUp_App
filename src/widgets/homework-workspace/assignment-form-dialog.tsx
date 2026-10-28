import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { AssignmentFormInput } from "@/modules/homework";
import type { GradingScale } from "@/shared/types";
import {
  bodyFont,
  DsGradient,
  DsText,
  dsRadius,
  dsType,
  Icon,
  MobileChoiceChips,
  MobileFieldLabel,
  MobileInput,
  MobilePickerField,
  MobileRoundButton,
  Switch,
  toneColors,
  useDs,
  type IconName,
} from "@/shared/ui";

export interface AssignmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses: ReadonlyArray<{ id: string; title: string; studentCount: number }>;
  pending?: boolean;
  initial?: {
    courseId: string;
    title: string;
    body: string;
    dueAt: string | null;
    grading: GradingScale;
    announceInChat: boolean;
  } | null;
  onSubmit: (values: AssignmentFormInput) => void;
}

const GRADINGS: GradingScale[] = ["five", "hundred", "none"];
const FORMAT_BUTTONS: IconName[] = ["format-bold", "format-italic", "format-underlined", "format-list-bulleted", "link", "functions"];

function today(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/**
 * Yangi vazifa / tahrirlash — veb `assignment-form-dialog.tsx` ning tor
 * ekran varianti (to'liq ekran): guruh, nom, matn (formatlash panelli),
 * muddat sanasi va vaqti, baholash, AI tekshiruv va chatga e'lon; pastda
 * "Qoralama" va "Yuborish". To'ldirilmagan majburiy maydonlar qizil.
 */
export function AssignmentFormDialog({ open, onOpenChange, courses, pending = false, initial = null, onSubmit }: AssignmentFormDialogProps) {
  const { t } = useTranslation("homework");
  const common = useTranslation("common").t;
  const ds = useDs();
  const insets = useSafeAreaInsets();
  const weekdays = common("formPickers.weekdays", { returnObjects: true }) as string[];
  const months = common("formPickers.months", { returnObjects: true }) as string[];
  const [courseId, setCourseId] = useState(initial?.courseId ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [date, setDate] = useState(() => initial?.dueAt?.slice(0, 10) ?? today());
  const [time, setTime] = useState(() => initial?.dueAt?.slice(11, 16) ?? "18:00");
  const [grading, setGrading] = useState<GradingScale>(initial?.grading ?? "five");
  const [aiCheck, setAiCheck] = useState(true);
  const [announce, setAnnounce] = useState(initial?.announceInChat ?? true);
  const [touched, setTouched] = useState(false);

  const course = courses.find((item) => item.id === courseId) ?? null;
  const missing = [!courseId, !title.trim()].filter(Boolean).length;
  const invalid = touched && missing > 0;
  const titleMissing = invalid && !title.trim();

  function save(status: "draft" | "active") {
    if (missing) {
      setTouched(true);
      return;
    }
    onSubmit({
      courseId,
      title: title.trim(),
      description: "",
      body,
      dueAt: `${date}T${time || "23:59"}`,
      status,
      announceInChat: announce,
      allowLate: true,
      grading,
      extraInstructions: aiCheck ? "" : undefined,
    });
  }

  const dueDate = new Date(`${date}T00:00`);
  const dateLabel = Number.isNaN(dueDate.getTime())
    ? date
    : t("mobileForm.dateValue", {
        weekday: weekdays[(dueDate.getDay() + 6) % 7] ?? "",
        day: dueDate.getDate(),
        month: (months[dueDate.getMonth()] ?? "").slice(0, 3).toLowerCase(),
      });

  return (
    <Modal visible={open} animationType="slide" statusBarTranslucent navigationBarTranslucent onRequestClose={() => onOpenChange(false)}>
      <KeyboardAvoidingView behavior="padding" style={[styles.fill, { backgroundColor: ds.c.canvas }]}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.page, { paddingTop: insets.top + 20 }]}>
          <DsGradient name="auth" />
          <View style={styles.header}>
            <MobileRoundButton icon="close" label={t("mobileForm.close")} onPress={() => onOpenChange(false)} />
            <DsText v="title-lg" w="600" numberOfLines={1} style={styles.headerTitle}>
              {initial ? t("mobileForm.editTitle") : t("mobileForm.title")}
            </DsText>
            <View style={styles.spacer} />
          </View>

          {invalid ? (
            <View style={[styles.banner, { backgroundColor: ds.c["danger-bg"] }]}>
              <Icon name="warning-fill" size={18} color={ds.c.danger} />
              <DsText v="body-sm" c="error-text" style={styles.grow}>
                {t("form.errorBanner")}
              </DsText>
            </View>
          ) : null}

          <MobileFieldLabel label={<RequiredLabel>{t("form.group")}</RequiredLabel>}>
            <MobilePickerField
              type="select"
              surface
              value={courseId}
              invalid={invalid && !courseId}
              placeholder={!course}
              display={course ? `${course.title} · ${t("form.students", { count: course.studentCount })}` : t("mobileForm.groupPlaceholder")}
              ariaLabel={t("form.group")}
              options={[
                { value: "", label: t("mobileForm.groupPlaceholder") },
                ...courses.map((item) => ({ value: item.id, label: `${item.title} · ${t("form.students", { count: item.studentCount })}` })),
              ]}
              onChange={(value) => {
                setCourseId(value);
                setTouched(false);
              }}
            />
          </MobileFieldLabel>

          <MobileFieldLabel label={<RequiredLabel>{t("form.titleLabel")}</RequiredLabel>}>
            <View>
              <MobileInput
                surface
                invalid={titleMissing}
                value={title}
                placeholder={titleMissing ? "" : t("form.titlePlaceholder")}
                onChangeText={setTitle}
                style={titleMissing ? styles.inputWithIcon : undefined}
              />
              {titleMissing ? (
                <View pointerEvents="none" style={styles.inputIcon}>
                  <Icon name="warning-fill" size={20} color={ds.c.danger} />
                </View>
              ) : null}
            </View>
            {titleMissing ? (
              <DsText v="caption" c="error-text">
                {t("form.titleRequired")}
              </DsText>
            ) : null}
          </MobileFieldLabel>

          <MobileFieldLabel label={<RequiredLabel>{t("form.bodyLabel")}</RequiredLabel>}>
            {/* `rounded-lg bg-surface`: formatlash paneli va matn maydoni */}
            <View style={[styles.editor, { backgroundColor: ds.c.surface }]}>
              <View style={[styles.toolbar, { borderBottomColor: ds.c.line }]}>
                {FORMAT_BUTTONS.map((icon) => (
                  <View key={icon} style={styles.tool}>
                    <Icon name={icon} size={18} color={ds.c["ink-secondary"]} />
                  </View>
                ))}
              </View>
              <TextInput
                multiline
                value={body}
                onChangeText={setBody}
                placeholder={t("form.bodyPlaceholder")}
                placeholderTextColor={ds.c["ink-secondary"]}
                selectionColor={ds.c.brand}
                textAlignVertical="top"
                style={[styles.body, { color: ds.c.ink }]}
              />
            </View>
          </MobileFieldLabel>

          <View style={styles.pair}>
            <View style={styles.grow}>
              <MobileFieldLabel label={<RequiredLabel>{t("form.due")}</RequiredLabel>}>
                <MobilePickerField type="date" surface value={date} min={today()} display={dateLabel} ariaLabel={t("form.due")} onChange={setDate} />
              </MobileFieldLabel>
            </View>
            <View style={styles.grow}>
              <MobileFieldLabel label={t("form.time")}>
                <MobilePickerField type="time" surface value={time} display={time} ariaLabel={t("form.time")} onChange={setTime} />
              </MobileFieldLabel>
            </View>
          </View>

          <MobileFieldLabel label={t("form.grading")}>
            <MobileChoiceChips items={GRADINGS} value={grading} onChange={setGrading} render={(item) => t(`form.gradings.${item}`)} />
          </MobileFieldLabel>

          <View style={[styles.toggles, { backgroundColor: ds.c.surface }]}>
            <ToggleRow
              icon="sparkles-fill"
              tone="bg-accent-saffron-bg text-accent-saffron-fg"
              title={t("form.aiCheck")}
              hint={t("form.aiCheckHint")}
              checked={aiCheck}
              onChange={setAiCheck}
            />
            <ToggleRow icon="chat" tone="bg-brand-subtle text-brand" title={t("form.announce")} hint={t("form.announceHint")} checked={announce} onChange={setAnnounce} />
          </View>
        </ScrollView>

        {/* `rounded-t-2xl bg-surface px-4 pt-3 pb-8.5 shadow-nav-top` */}
        <View style={[styles.footer, { backgroundColor: ds.c.surface, boxShadow: ds.shadow["nav-top"], paddingBottom: Math.max(34, insets.bottom + 12) }]}>
          <Pressable
            accessibilityRole="button"
            disabled={pending}
            onPress={() => save("draft")}
            style={({ pressed }) => [styles.draft, { borderColor: ds.c["line-strong"], backgroundColor: pressed ? ds.c.subtle : ds.c.surface }, pending && styles.dim]}
          >
            <DsText v="title" w="500">
              {t("form.draft")}
            </DsText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={pending}
            onPress={() => save("active")}
            style={({ pressed }) => [styles.submit, { backgroundColor: pressed ? ds.c["brand-strong"] : ds.c.brand }, pending && styles.dim]}
          >
            <Icon name="send" size={20} color={ds.c["on-action"]} />
            <DsText v="title" w="500" c="on-action">
              {t("form.submit")}
            </DsText>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function RequiredLabel({ children }: { children: ReactNode }) {
  return (
    <>
      {children} <DsText v="body-sm" c="error-text">*</DsText>
    </>
  );
}

function ToggleRow({
  icon,
  tone,
  title,
  hint,
  checked,
  onChange,
}: {
  icon: IconName;
  tone: string;
  title: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  const ds = useDs();
  const colors = toneColors(tone, ds);
  return (
    <View style={styles.toggle}>
      <View style={[styles.toggleIcon, { backgroundColor: colors.bg }]}>
        <Icon name={icon} size={20} color={colors.fg ?? ds.c.ink} />
      </View>
      <View style={styles.grow}>
        <DsText v="title" numberOfLines={1} style={styles.lh24}>
          {title}
        </DsText>
        <DsText v="body-sm" c="ink-secondary" numberOfLines={1}>
          {hint}
        </DsText>
      </View>
      <Switch size="lg" checked={checked} onCheckedChange={onChange} accessibilityLabel={title} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  dim: { opacity: 0.4 },
  lh24: { lineHeight: 24 },
  /* `gap-3.5 px-4 pt-5 pb-6` */
  page: { gap: 14, paddingHorizontal: 16, paddingBottom: 24 },
  header: { height: 44, flexDirection: "row", alignItems: "center", gap: 12 },
  headerTitle: { flex: 1, minWidth: 0, textAlign: "center" },
  spacer: { width: 44, height: 44 },
  banner: { marginTop: 2, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderRadius: dsRadius.lg },
  inputWithIcon: { paddingRight: 48 },
  inputIcon: { position: "absolute", top: 16, right: 16 },
  editor: { overflow: "hidden", borderRadius: dsRadius.lg },
  toolbar: { height: 47, flexDirection: "row", alignItems: "center", paddingHorizontal: 6, borderBottomWidth: 1 },
  tool: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  body: { height: 96, paddingHorizontal: 16, paddingVertical: 12, fontSize: dsType.body.fontSize, fontFamily: bodyFont("400") },
  pair: { flexDirection: "row", gap: 12 },
  toggles: { marginTop: 2, gap: 16, padding: 16, borderRadius: dsRadius.lg },
  toggle: { flexDirection: "row", alignItems: "center", gap: 12 },
  toggleIcon: { width: 40, height: 40, borderRadius: dsRadius.md, alignItems: "center", justifyContent: "center" },
  footer: { flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingTop: 12, borderTopLeftRadius: dsRadius["2xl"], borderTopRightRadius: dsRadius["2xl"] },
  draft: { height: 52, paddingHorizontal: 20, borderWidth: 1, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  submit: { flex: 1, minWidth: 0, height: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 26 },
});
