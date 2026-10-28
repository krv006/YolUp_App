import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, TextInput, View, type LayoutChangeEvent } from "react-native";
import { Canvas, Group } from "@shopify/react-native-skia";
import { Plus } from "lucide-react-native";
import {
  Avatar,
  radius,
  Sheet,
  SheetButton,
  SheetFooter,
  Switch,
  Text,
  toast,
  useTheme,
} from "@/shared/ui";
import type { BoardSheet } from "../../api/board.dto";
import { BoardStroke, useBoardFont } from "../board-stroke";

/* ────────────────────────────── Sahifalar ────────────────────────────── */

export interface BoardPagesSheetProps {
  open: boolean;
  onClose: () => void;
  sheets: BoardSheet[];
  active: number;
  boardWidth: number;
  boardHeight: number;
  canAdd: boolean;
  onSelect: (index: number) => void;
  onAdd: () => void;
}

/** Veb `board-pages-sheet.tsx`: 3 ustunli eskizlar va "Yangi" sahifa. */
export function BoardPagesSheet({
  open,
  onClose,
  sheets,
  active,
  boardWidth,
  boardHeight,
  canAdd,
  onSelect,
  onAdd,
}: BoardPagesSheetProps) {
  const { t } = useTranslation("board");
  const { palette } = useTheme();
  const font = useBoardFont();
  const [cell, setCell] = useState(0);
  const ratio = boardWidth / Math.max(1, boardHeight);
  const scale = cell / Math.max(1, boardWidth);

  return (
    <Sheet open={open} onClose={onClose} title={t("pages.title")} description={t("pages.hint")}>
      <View style={styles.pages}>
        {sheets.map((item) => (
          <Pressable key={item.index} accessibilityRole="button" onPress={() => onSelect(item.index)} style={styles.page}>
            <View
              onLayout={(event: LayoutChangeEvent) => setCell(event.nativeEvent.layout.width)}
              style={[
                styles.thumb,
                { aspectRatio: ratio, borderColor: item.index === active ? palette.primary : palette.border },
              ]}
            >
              {cell ? (
                <Canvas style={styles.fill}>
                  <Group transform={[{ scale }]}>
                    {item.strokes.map((stroke) => (
                      <BoardStroke key={stroke.id} stroke={stroke} font={font} />
                    ))}
                  </Group>
                </Canvas>
              ) : null}
            </View>
            <Text variant="caption" style={{ color: palette["muted-foreground"] }}>
              #{item.index + 1}
            </Text>
          </Pressable>
        ))}
        {canAdd ? (
          <Pressable accessibilityRole="button" onPress={onAdd} style={styles.page}>
            <View style={[styles.newPage, { aspectRatio: ratio, borderColor: palette.border }]}>
              <Plus size={22} color={palette["subtle-foreground"]} />
            </View>
            <Text variant="caption" style={{ color: palette["muted-foreground"] }}>
              {t("pages.new")}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </Sheet>
  );
}

/* ─────────────────────────── O'chirish sababi ─────────────────────────── */

const PRESET_KEYS = ["wrongAnswer", "offTopic", "cleanup"] as const;

export interface EraseReasonSheetProps {
  open: boolean;
  pending: boolean;
  reason: string;
  onReasonChange: (reason: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Veb `erase-reason-dialog.tsx`: tayyor sabablar va "Boshqa" maydoni. */
export function EraseReasonSheet({ open, pending, reason, onReasonChange, onCancel, onConfirm }: EraseReasonSheetProps) {
  const { t } = useTranslation("board");
  const { palette } = useTheme();
  const presets = PRESET_KEYS.map((key) => t(`eraseDialog.reasons.${key}`));
  const custom = Boolean(reason) && !presets.includes(reason);

  const chip = (selected: boolean) =>
    selected
      ? { borderColor: palette.primary, backgroundColor: palette["primary-soft"] }
      : { borderColor: palette.border, backgroundColor: palette.surface };

  return (
    <Sheet open={open} onClose={onCancel} title={t("eraseDialog.title")} description={t("eraseDialog.description")}>
      <View style={styles.chips}>
        {presets.map((preset) => (
          <Pressable key={preset} accessibilityRole="button" onPress={() => onReasonChange(preset)} style={[styles.chip, chip(reason === preset)]}>
            <Text variant="label" style={{ color: reason === preset ? palette.primary : palette["muted-foreground"] }}>
              {preset}
            </Text>
          </Pressable>
        ))}
        <Pressable
          accessibilityRole="button"
          onPress={() => onReasonChange(custom ? reason : " ")}
          style={[styles.chip, chip(custom)]}
        >
          <Text variant="label" style={{ color: custom ? palette.primary : palette["muted-foreground"] }}>
            {t("eraseDialog.reasons.other")}
          </Text>
        </Pressable>
      </View>
      {custom ? (
        <TextInput
          autoFocus
          value={reason.trimStart()}
          onChangeText={(value) => onReasonChange(value || " ")}
          placeholder={t("eraseDialog.reasonLabel")}
          placeholderTextColor={palette["subtle-foreground"]}
          style={[styles.input, { borderColor: palette.border, backgroundColor: palette.surface, color: palette.foreground }]}
        />
      ) : null}
      <SheetFooter>
        <SheetButton title={t("eraseDialog.cancel")} onPress={onCancel} />
        <SheetButton variant="danger" title={t("eraseDialog.confirm")} disabled={pending || !reason.trim()} onPress={onConfirm} />
      </SheetFooter>
    </Sheet>
  );
}

/* ─────────────────────────── Chizish ruxsati ─────────────────────────── */

type PermissionMode = "teacher" | "selected" | "everyone";
const MODES: PermissionMode[] = ["teacher", "selected", "everyone"];

export interface BoardPermissionStudent {
  id: string;
  name: string;
  username: string;
}

export type BoardPermissionInput = { studentIds: string[] } | { mode: "all" | "none" };

export interface BoardPermissionSheetProps {
  open: boolean;
  onClose: () => void;
  students: BoardPermissionStudent[];
  pending: boolean;
  onSubmit: (input: BoardPermissionInput) => void;
}

/** Veb `board-permission-dialog.tsx`: rejim tanlash va o'quvchilar ro'yxati. */
export function BoardPermissionSheet({ open, onClose, students, pending, onSubmit }: BoardPermissionSheetProps) {
  const { t } = useTranslation("board");
  const { palette } = useTheme();
  const [mode, setMode] = useState<PermissionMode>("selected");
  const [allowed, setAllowed] = useState<string[]>([]);

  function save() {
    if (mode === "teacher") {
      onSubmit({ mode: "none" });
      return;
    }
    if (mode === "everyone") {
      onSubmit({ mode: "all" });
      return;
    }
    if (!allowed.length) {
      toast.info(t("permissionDialog.pickStudent"));
      return;
    }
    onSubmit({ studentIds: allowed });
  }

  return (
    <Sheet open={open} onClose={onClose} title={t("permissionDialog.title")} description={t("permissionDialog.description")}>
      <View style={styles.modes}>
        {MODES.map((item) => {
          const on = mode === item;
          return (
            <Pressable
              key={item}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              onPress={() => setMode(item)}
              style={[
                styles.mode,
                on
                  ? { borderColor: palette.primary, backgroundColor: palette["primary-soft"] }
                  : { borderColor: palette.border, backgroundColor: palette.surface },
              ]}
            >
              <View style={[styles.radio, { borderColor: on ? palette.primary : palette.border }]}>
                {on ? <View style={[styles.radioDot, { backgroundColor: palette.primary }]} /> : null}
              </View>
              <View style={styles.grow}>
                <Text variant="label">{t(`permissionDialog.modes.${item}.title`)}</Text>
                <Text variant="caption" style={[styles.caption, { color: palette["subtle-foreground"] }]}>
                  {t(`permissionDialog.modes.${item}.hint`)}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {mode === "selected" ? (
        <View style={styles.students}>
          {students.map((student) => {
            const on = allowed.includes(student.id);
            return (
              <View key={student.id} style={styles.student}>
                <Avatar variant="legacy" name={student.name} size="sm" />
                <Text variant="label" numberOfLines={1} style={styles.grow}>
                  {student.name}
                </Text>
                <Switch
                  checked={on}
                  accessibilityLabel={student.name}
                  onCheckedChange={(next) =>
                    setAllowed((current) => (next ? [...current, student.id] : current.filter((id) => id !== student.id)))
                  }
                />
              </View>
            );
          })}
          {students.length ? null : (
            <Text variant="label" style={[styles.empty, { color: palette["subtle-foreground"] }]}>
              {t("grantDialog.noStudents")}
            </Text>
          )}
        </View>
      ) : null}

      <SheetFooter>
        <SheetButton title={t("permissionDialog.cancel")} onPress={onClose} />
        <SheetButton variant="primary" title={t("permissionDialog.save")} disabled={pending} onPress={save} />
      </SheetFooter>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  fill: { flex: 1 },
  caption: { fontWeight: "500" },
  /* `grid-cols-3 gap-3 pb-4` */
  pages: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingBottom: 16 },
  page: { width: "30.5%", alignItems: "center", gap: 6 },
  thumb: { width: "100%", overflow: "hidden", borderWidth: 2, borderRadius: radius.xl, backgroundColor: "#ffffff" },
  newPage: { width: "100%", alignItems: "center", justifyContent: "center", borderWidth: 1, borderStyle: "dashed", borderRadius: radius.xl },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { height: 36, justifyContent: "center", paddingHorizontal: 12, borderWidth: 1, borderRadius: radius.full },
  input: { height: 48, paddingHorizontal: 14, borderWidth: 1, borderRadius: radius.xl, fontSize: 16, fontFamily: "Onest-Regular" },
  modes: { gap: 8 },
  mode: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderRadius: radius.xl },
  radio: { width: 20, height: 20, borderWidth: 2, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  radioDot: { width: 10, height: 10, borderRadius: radius.full },
  students: { gap: 4 },
  student: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 4, paddingVertical: 8 },
  empty: { paddingVertical: 12, textAlign: "center", fontWeight: "400" },
});
