import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import {
  bodyFont,
  DsText,
  dsRadius,
  dsType,
  Icon,
  MobileButton,
  MobileFieldLabel,
  MobileInput,
  MobileScreenDialog,
  MobileSelectSheet,
  useDs,
  type IconName,
} from "@/shared/ui";
import type { ExamTemplateFormValues } from "../api/exam.dto";
import { templateToForm, templateTotalMinutes, validateTemplate, type TemplateItemDraft } from "../lib/template-draft";

export interface ExamTemplateDialogProps {
  open: boolean;
  pending?: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (values: ExamTemplateFormValues) => void;
}

/**
 * Imtihon shabloni — veb `exam-template-dialog.tsx` ning tor ekran varianti
 * (to'liq ekran): nom, bo'limlar va tanaffuslar tartibi (daqiqa, og'irlik,
 * yuqoriga/pastga, o'chirish), "Bo'lim" / "Tanaffus" qo'shish, ball shkalasi
 * va o'tish foizi.
 */
export function ExamTemplateDialog({ open, pending = false, onOpenChange, onCreate }: ExamTemplateDialogProps) {
  const { t } = useTranslation("exam");
  const ds = useDs();
  const nextId = useRef(0);
  const [name, setName] = useState("");
  const [scale, setScale] = useState("100");
  const [passPercent, setPassPercent] = useState("");
  const [items, setItems] = useState<TemplateItemDraft[]>(() => [{ id: "i0", kind: "section", title: "", minutes: "60", weight: "1" }]);
  const [error, setError] = useState<string | null>(null);
  const [weightFor, setWeightFor] = useState<string | null>(null);

  const total = templateTotalMinutes(items);
  const hours = Math.floor(total / 60);
  const weightSum = items.filter((item) => item.kind === "section").reduce((sum, item) => sum + (Number(item.weight) || 0), 0);
  const weightItem = items.find((item) => item.id === weightFor) ?? null;

  function close() {
    onOpenChange(false);
  }

  function addItem(kind: "section" | "break") {
    nextId.current += 1;
    const id = `i${nextId.current}`;
    setItems((current) => [
      ...current,
      { id, kind, title: kind === "break" ? t("templateDialog.breakDefaultTitle") : "", minutes: kind === "break" ? "10" : "60", weight: "1" },
    ]);
  }

  function updateItem(id: string, patch: Partial<TemplateItemDraft>) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    setError(null);
  }

  function moveItem(index: number, to: number) {
    if (to < 0 || to >= items.length) return;
    setItems((current) => {
      const next = [...current];
      const [item] = next.splice(index, 1);
      if (item) next.splice(to, 0, item);
      return next;
    });
  }

  function submit() {
    const failure = validateTemplate(name, items, scale, passPercent);
    if (failure) {
      setError(t(`templateDialog.validation.${failure}`));
      return;
    }
    onCreate(templateToForm(name, "", items, scale, passPercent));
  }

  return (
    <MobileScreenDialog
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      title={t("templateDialog.title")}
      closeLabel={t("templateDialog.cancel")}
      onClose={close}
      footer={
        <>
          <MobileButton variant="secondary" label={t("templateDialog.cancel")} onPress={close} />
          <MobileButton label={t("templateDialog.mobile.save")} disabled={pending} onPress={submit} />
        </>
      }
    >
      <DsText v="body-sm" c="ink-secondary" style={styles.intro}>
        {t("templateDialog.description")}
      </DsText>

      <View style={styles.mt12}>
        <MobileFieldLabel gap={7} label={t("templateDialog.nameLabel")}>
          <MobileInput
            surface
            value={name}
            placeholder={t("templateDialog.namePlaceholder")}
            onChangeText={(value) => {
              setName(value);
              setError(null);
            }}
          />
        </MobileFieldLabel>
      </View>

      <DsText v="caption-strong" c="ink-secondary" style={[styles.mt12, styles.upper]}>
        {t("templateDialog.orderHead")} · {hours ? t("templateDialog.totalHours", { hours, count: total % 60 }) : t("templateDialog.totalMinutes", { count: total })}
      </DsText>

      {error ? (
        <View style={[styles.error, { backgroundColor: ds.c["danger-bg"] }]}>
          <Icon name="warning-fill" size={18} color={ds.c.danger} />
          <DsText v="body-sm" c="error-text" style={styles.grow}>
            {error}
          </DsText>
        </View>
      ) : null}

      {/* `rounded-xl border border-line bg-surface px-1 pt-[3px] pb-[5px]`, qator `h-16 rounded-lg` */}
      <View style={[styles.list, { borderColor: ds.c.line, backgroundColor: ds.c.surface }]}>
        {items.map((item, index) => {
          const isBreak = item.kind === "break";
          const percent = !isBreak && weightSum ? Math.round(((Number(item.weight) || 0) / weightSum) * 100) : null;
          return (
            <View key={item.id} style={[styles.row, index > 0 && styles.mt10, isBreak && { backgroundColor: ds.c["warning-bg"] }]}>
              <Icon name="drag-indicator" size={20} color={ds.c["icon-tertiary"]} />
              <View style={styles.grow}>
                <TextInput
                  value={item.title}
                  placeholder={isBreak ? t("templateDialog.breakPlaceholder") : t("templateDialog.sectionPlaceholder")}
                  placeholderTextColor={ds.c["ink-tertiary"]}
                  onChangeText={(title) => updateItem(item.id, { title })}
                  style={[styles.titleInput, { color: isBreak ? ds.c["warning-fg"] : ds.c.ink }]}
                />
                <View style={styles.meta}>
                  <TextInput
                    value={item.minutes}
                    keyboardType="number-pad"
                    accessibilityLabel={t("templateDialog.minutesLabel")}
                    onChangeText={(value) => updateItem(item.id, { minutes: value.replace(/\D/g, "") })}
                    style={[styles.minutes, { color: ds.c["ink-secondary"] }]}
                  />
                  <DsText v="caption" w="400" c="ink-secondary">
                    {t("templateDialog.minutesShort")}
                  </DsText>
                  {percent !== null ? (
                    <DsText
                      v="caption"
                      w="400"
                      c="ink-secondary"
                      numberOfLines={1}
                      accessibilityRole="button"
                      accessibilityLabel={t("templateDialog.weightLabel")}
                      onPress={() => setWeightFor(item.id)}
                      style={styles.shrink}
                    >
                      {` · ${t("templateDialog.mobile.weight", { value: percent })}`}
                    </DsText>
                  ) : null}
                </View>
              </View>
              <RowButton icon="expand-less" label={t("templateDialog.moveUp")} disabled={index === 0} onPress={() => moveItem(index, index - 1)} />
              <RowButton icon="expand-more" label={t("templateDialog.moveDown")} disabled={index === items.length - 1} onPress={() => moveItem(index, index + 1)} />
              <RowButton
                icon="delete"
                danger
                label={t("templateDialog.removeItem")}
                disabled={items.length <= 1}
                onPress={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}
              />
            </View>
          );
        })}
      </View>

      <View style={[styles.pair, styles.mt12]}>
        <View style={styles.cell}>
          <Pressable accessibilityRole="button" onPress={() => addItem("section")} style={({ pressed }) => [styles.add, { backgroundColor: ds.c["brand-subtle"], opacity: pressed ? 0.85 : 1 }]}>
            <DsText v="button-sm" c="brand">
              + {t("templateDialog.addSection")}
            </DsText>
          </Pressable>
        </View>
        <View style={styles.cell}>
          <Pressable
            accessibilityRole="button"
            onPress={() => addItem("break")}
            style={({ pressed }) => [styles.add, { borderWidth: 1, borderColor: ds.c["line-strong"], backgroundColor: pressed ? ds.c.subtle : ds.c.surface }]}
          >
            <DsText v="button-sm">+ {t("templateDialog.addBreak")}</DsText>
          </Pressable>
        </View>
      </View>

      <View style={[styles.pair, styles.mt11]}>
        <View style={styles.cell}>
          <MobileFieldLabel gap={7} label={t("templateDialog.scaleLabel")}>
            <MobileInput surface keyboardType="number-pad" value={scale} onChangeText={(value) => setScale(value.replace(/\D/g, ""))} />
          </MobileFieldLabel>
        </View>
        <View style={styles.cell}>
          <MobileFieldLabel gap={7} label={t("templateDialog.mobile.passLabel")}>
            <MobileInput
              surface
              keyboardType="number-pad"
              value={passPercent ? `${passPercent}%` : ""}
              placeholder="60%"
              onChangeText={(value) => setPassPercent(value.replace(/\D/g, "").slice(0, 3))}
            />
          </MobileFieldLabel>
        </View>
      </View>

      <MobileSelectSheet
        open={Boolean(weightItem)}
        onOpenChange={(next) => !next && setWeightFor(null)}
        title={t("templateDialog.weightLabel")}
        value={weightItem?.weight ?? ""}
        options={Array.from({ length: 10 }, (_, value) => ({ value: String(value + 1), label: String(value + 1) }))}
        onChange={(weight) => weightItem && updateItem(weightItem.id, { weight })}
      />
    </MobileScreenDialog>
  );
}

function RowButton({ icon, label, danger = false, disabled, onPress }: { icon: IconName; label: string; danger?: boolean; disabled: boolean; onPress: () => void }) {
  const ds = useDs();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.rowButton, pressed && { backgroundColor: danger ? ds.c["danger-bg"] : ds.c.subtle }, disabled && styles.faded]}
    >
      <Icon name={icon} size={danger ? 20 : 22} color={danger ? ds.c["error-text"] : ds.c.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  shrink: { flexShrink: 1 },
  faded: { opacity: 0.3 },
  upper: { textTransform: "uppercase" },
  mt10: { marginTop: 10 },
  mt11: { marginTop: 11 },
  mt12: { marginTop: 12 },
  intro: { marginTop: 15 },
  error: { marginTop: 12, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderRadius: dsRadius.lg },
  list: { marginTop: 12, paddingHorizontal: 4, paddingTop: 3, paddingBottom: 5, borderWidth: 1, borderRadius: dsRadius.xl },
  row: { height: 64, flexDirection: "row", alignItems: "center", gap: 8, paddingLeft: 12, paddingRight: 4, borderRadius: dsRadius.lg },
  titleInput: { padding: 0, fontSize: dsType.title.fontSize, fontFamily: bodyFont("600") },
  meta: { flexDirection: "row", alignItems: "center" },
  minutes: { minWidth: 22, padding: 0, fontSize: dsType.caption.fontSize, fontFamily: bodyFont("400") },
  rowButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  pair: { flexDirection: "row", gap: 8 },
  cell: { flex: 1, flexBasis: 0 },
  add: { height: 44, alignItems: "center", justifyContent: "center", borderRadius: 22 },
});
