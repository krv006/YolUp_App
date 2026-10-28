import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { Avatar, DsText, dsRadius, Icon, MobileButton, MobileRadio, Sheet, toast, useDs } from "@/shared/ui";

export type BoardPermissionMode = "teacher" | "selected" | "everyone";

const MODES: BoardPermissionMode[] = ["teacher", "selected", "everyone"];

export interface BoardPermissionStudent {
  id: string;
  name: string;
  username: string;
}

export type BoardPermissionInput = { studentIds: string[] } | { mode: "all" | "none" };

export interface BoardPermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: BoardPermissionStudent[];
  pending: boolean;
  onSubmit: (input: BoardPermissionInput) => void;
}

/**
 * Chizish ruxsati — veb `board-permission-dialog.tsx` (tor ekran): uch rejim
 * kartasi; "Tanlanganlar" da o'quvchilar ro'yxati belgilash katakchalari bilan.
 */
export function BoardPermissionDialog({ open, onOpenChange, students, pending, onSubmit }: BoardPermissionDialogProps) {
  const { t } = useTranslation("board");
  const ds = useDs();
  const [mode, setMode] = useState<BoardPermissionMode>("selected");
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
    <Sheet
      variant="app"
      compact
      open={open}
      onClose={() => onOpenChange(false)}
      title={t("permissionDialog.title")}
      description={t("permissionDialog.description")}
      footer={
        <>
          <MobileButton variant="secondary" label={t("permissionDialog.cancel")} onPress={() => onOpenChange(false)} />
          <MobileButton label={t("permissionDialog.save")} disabled={pending} onPress={save} />
        </>
      }
    >
      <View accessibilityRole="radiogroup" style={styles.modes}>
        {MODES.map((item) => {
          const active = mode === item;
          return (
            <Pressable
              key={item}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              onPress={() => setMode(item)}
              style={[
                styles.mode,
                active ? { borderWidth: 1.5, borderColor: ds.c.brand, backgroundColor: ds.c["brand-subtle"] } : { borderColor: ds.c.line, backgroundColor: ds.c.surface },
              ]}
            >
              <View style={styles.grow}>
                <DsText v="title" numberOfLines={1}>
                  {t(item === "teacher" ? "permissionDialog.teacherOnly" : `permissionDialog.modes.${item}.title`)}
                </DsText>
                <DsText v="body-sm" c="ink-secondary" numberOfLines={1}>
                  {t(`permissionDialog.modes.${item}.hint`)}
                </DsText>
              </View>
              <MobileRadio checked={active} />
            </Pressable>
          );
        })}
      </View>

      {mode === "selected" ? (
        <>
          <DsText v="caption-strong" c="ink-secondary" style={styles.count}>
            {t("permissionDialog.selectedCount", { count: allowed.length }).toUpperCase()}
          </DsText>
          <View style={[styles.students, { borderColor: ds.c.line }]}>
            {students.map((student) => {
              const on = allowed.includes(student.id);
              return (
                <Pressable
                  key={student.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  onPress={() => setAllowed((current) => (on ? current.filter((id) => id !== student.id) : [...current, student.id]))}
                  style={({ pressed }) => [styles.student, pressed && { backgroundColor: ds.c.subtle }]}
                >
                  <Avatar variant="legacy" name={student.name} size="sm" box={32} />
                  <DsText v="title" w="500" numberOfLines={1} style={styles.grow}>
                    {student.name}
                  </DsText>
                  <View style={[styles.check, on ? { borderColor: ds.c.brand, backgroundColor: ds.c.brand } : { borderWidth: 1.5, borderColor: ds.c["line-strong"], backgroundColor: ds.c.surface }]}>
                    {on ? <Icon name="check" size={14} color={ds.c["on-action"]} /> : null}
                  </View>
                </Pressable>
              );
            })}
            {students.length ? null : (
              <DsText v="body-sm" c="ink-tertiary" style={styles.empty}>
                {t("grantDialog.noStudents")}
              </DsText>
            )}
          </View>
        </>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  /* `-mt-0.5 gap-2.5`, karta `h-[74px] rounded-xl pl-3.5 pr-[25px]` */
  modes: { marginTop: -2, gap: 10 },
  mode: { height: 74, flexDirection: "row", alignItems: "center", gap: 12, paddingLeft: 14, paddingRight: 25, borderWidth: 1, borderRadius: dsRadius.xl },
  count: { marginTop: -6 },
  students: { marginTop: -6, overflow: "hidden", borderWidth: 1, borderRadius: dsRadius.xl },
  student: { height: 74, flexDirection: "row", alignItems: "center", gap: 12, paddingLeft: 16, paddingRight: 28 },
  check: { width: 22, height: 22, borderWidth: 1, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  empty: { paddingVertical: 20, textAlign: "center" },
});
