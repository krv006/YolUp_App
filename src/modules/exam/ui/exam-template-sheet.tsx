import { useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { ArrowDown, ArrowUp, Coffee, Plus, X } from "lucide-react-native";
import { Button, IconButton, Input, Sheet, Text, useTheme } from "@/shared/ui";
import type { ExamTemplateFormValues } from "../api/exam.dto";
import {
  templateToForm,
  templateTotalMinutes,
  validateTemplate,
  type TemplateItemDraft,
} from "../lib/template-draft";

export interface ExamTemplateSheetProps {
  open: boolean;
  pending?: boolean;
  onClose: () => void;
  onCreate: (values: ExamTemplateFormValues) => void;
}

/** O'z shabloningiz: bo'lim va tanaffuslar zanjiri. */
export function ExamTemplateSheet({ open, pending = false, onClose, onCreate }: ExamTemplateSheetProps) {
  const { t } = useTranslation("exam");
  const { palette } = useTheme();
  const nextId = useRef(0);
  const [name, setName] = useState("");
  const [scale, setScale] = useState("100");
  const [passPercent, setPassPercent] = useState("");
  const [items, setItems] = useState<TemplateItemDraft[]>([
    { id: "i0", kind: "section", title: "", minutes: "60", weight: "1" },
  ]);
  const [error, setError] = useState<string | null>(null);

  function addItem(kind: "section" | "break") {
    nextId.current += 1;
    setItems((current) => [
      ...current,
      {
        id: `i${nextId.current}`,
        kind,
        title: kind === "break" ? t("templateDialog.breakDefaultTitle") : "",
        minutes: kind === "break" ? "10" : "60",
        weight: "1",
      },
    ]);
  }

  function update(id: string, patch: Partial<TemplateItemDraft>) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    setError(null);
  }

  function move(index: number, to: number) {
    if (to < 0 || to >= items.length) return;
    setItems((current) => {
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(to, 0, item);
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
    <Sheet
      open={open}
      onClose={onClose}
      title={t("templateDialog.title")}
      description={t("templateDialog.description")}
    >
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Input
          label={t("templateDialog.nameLabel")}
          value={name}
          onChangeText={(value) => {
            setName(value);
            setError(null);
          }}
          placeholder={t("templateDialog.namePlaceholder")}
        />

        {items.map((item, index) => (
          <View key={item.id} style={[styles.item, { borderColor: palette.border }]}>
            <View style={styles.itemHead}>
              {item.kind === "break" ? (
                <Coffee size={15} color={palette["muted-foreground"]} />
              ) : (
                <Text variant="caption" tone="muted">
                  {index + 1}
                </Text>
              )}
              <View style={styles.itemTitle}>
                <Input
                  value={item.title}
                  onChangeText={(value) => update(item.id, { title: value })}
                  placeholder={
                    item.kind === "break"
                      ? t("templateDialog.breakPlaceholder")
                      : t("templateDialog.sectionPlaceholder")
                  }
                />
              </View>
              <IconButton
                accessibilityLabel={t("templateDialog.moveUp")}
                disabled={index === 0}
                onPress={() => move(index, index - 1)}
              >
                <ArrowUp size={16} color={palette["muted-foreground"]} />
              </IconButton>
              <IconButton
                accessibilityLabel={t("templateDialog.moveDown")}
                disabled={index === items.length - 1}
                onPress={() => move(index, index + 1)}
              >
                <ArrowDown size={16} color={palette["muted-foreground"]} />
              </IconButton>
              {items.length > 1 ? (
                <IconButton
                  accessibilityLabel={t("templateDialog.removeItem")}
                  onPress={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}
                >
                  <X size={16} color={palette.destructive} />
                </IconButton>
              ) : null}
            </View>

            <View style={styles.itemNumbers}>
              <View style={styles.number}>
                <Input
                  label={t("templateDialog.minutesLabel")}
                  value={item.minutes}
                  keyboardType="number-pad"
                  onChangeText={(value) => update(item.id, { minutes: value.replace(/\D/g, "") })}
                />
              </View>
              {item.kind === "section" ? (
                <View style={styles.number}>
                  <Input
                    label={t("templateDialog.weightLabel")}
                    value={item.weight}
                    keyboardType="number-pad"
                    onChangeText={(value) => update(item.id, { weight: value.replace(/\D/g, "") })}
                  />
                </View>
              ) : null}
            </View>
          </View>
        ))}

        <View style={styles.addRow}>
          <Button
            variant="secondary"
            title={t("templateDialog.addSection")}
            icon={<Plus size={15} color={palette.foreground} />}
            onPress={() => addItem("section")}
          />
          <Button
            variant="secondary"
            title={t("templateDialog.addBreak")}
            icon={<Coffee size={15} color={palette.foreground} />}
            onPress={() => addItem("break")}
          />
        </View>
        <Text variant="caption" tone="muted">
          {t("templateDialog.totalMinutes", { count: templateTotalMinutes(items) })}
        </Text>

        <View style={styles.itemNumbers}>
          <View style={styles.number}>
            <Input
              label={t("templateDialog.scaleLabel")}
              value={scale}
              keyboardType="number-pad"
              onChangeText={(value) => setScale(value.replace(/\D/g, ""))}
            />
          </View>
          <View style={styles.number}>
            <Input
              label={t("templateDialog.passLabel")}
              value={passPercent}
              keyboardType="number-pad"
              placeholder={t("templateDialog.passPlaceholder")}
              onChangeText={(value) => setPassPercent(value.replace(/\D/g, ""))}
            />
          </View>
        </View>

        {error ? (
          <Text variant="caption" style={{ color: palette.destructive }}>
            {error}
          </Text>
        ) : null}

        <Button title={t("templateDialog.submit")} loading={pending} onPress={submit} />
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: 12, paddingBottom: 24 },
  item: { gap: 8, padding: 10, borderWidth: 1, borderRadius: 13 },
  itemHead: { flexDirection: "row", alignItems: "center", gap: 6 },
  itemTitle: { flex: 1 },
  itemNumbers: { flexDirection: "row", gap: 10 },
  number: { flex: 1 },
  addRow: { flexDirection: "row", gap: 10 },
});
