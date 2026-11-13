import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Avatar, CheckboxMark, DsText, dsAlpha, dsRadius, useDs } from "@/shared/ui";

export interface ChecklistStudent {
  id: string;
  name: string;
  avatarUrl?: string | null;
  note?: string;
}

export interface StudentChecklistProps {
  students: ChecklistStudent[];
  excluded: ReadonlySet<string>;
  onChange: (excluded: Set<string>) => void;
  loading?: boolean;
}

/**
 * O'quvchilarni belgilash ro'yxati — veb `student-checklist.tsx`: sarlavha
 * va "N / M", "Hammasini belgilash / olib tashlash", `max-h-64` ro'yxat.
 * Holat — belgilanMAGANlar (`excluded`); bo'sh to'plam = hammasi.
 * Checkbox o'rniga `CheckboxMark` belgili `Pressable`.
 */
export function StudentChecklist({
  students,
  excluded,
  onChange,
  loading = false,
}: StudentChecklistProps) {
  const { t } = useTranslation("quiz");
  const ds = useDs();
  const selected = students.filter((student) => !excluded.has(student.id)).length;
  const allSelected = selected === students.length;

  function toggle(id: string) {
    const next = new Set(excluded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  }

  return (
    <View style={styles.root}>
      <View style={styles.head}>
        <DsText v="body-xs" c="ink-secondary" style={styles.grow}>
          {t("audience.studentsLabel")} ·{" "}
          {t("audience.selected", { count: selected, total: students.length })}
        </DsText>
        {students.length ? (
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              onChange(allSelected ? new Set(students.map((student) => student.id)) : new Set())
            }
            style={({ pressed }) => [
              styles.all,
              pressed && { backgroundColor: ds.c["brand-subtle"] },
            ]}
          >
            <DsText v="caption-strong" c="brand">
              {allSelected ? t("audience.clearAll") : t("audience.selectAll")}
            </DsText>
          </Pressable>
        ) : null}
      </View>
      {/* `max-h-64 overflow-y-auto rounded-xl border border-line` */}
      <ScrollView style={[styles.list, { borderColor: ds.c.line }]} nestedScrollEnabled>
        {students.map((student, index) => {
          const checked = !excluded.has(student.id);
          return (
            <Pressable
              key={student.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked }}
              accessibilityLabel={student.name}
              onPress={() => toggle(student.id)}
              style={[
                styles.row,
                index < students.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: ds.c.line,
                },
                checked && { backgroundColor: dsAlpha(ds.c["brand-subtle"], 0.5) },
              ]}
            >
              <CheckboxMark checked={checked} />
              <Avatar
                variant="legacy"
                name={student.name}
                src={student.avatarUrl ?? undefined}
                size="sm"
                box={32}
              />
              <DsText v="body" numberOfLines={1} style={styles.grow}>
                {student.name}
              </DsText>
              {student.note ? (
                <DsText v="caption" c="ink-tertiary">
                  {student.note}
                </DsText>
              ) : null}
            </Pressable>
          );
        })}
        {!students.length ? (
          <DsText v="body-sm" c="ink-secondary" style={styles.empty}>
            {loading ? t("audience.loading") : t("audience.empty")}
          </DsText>
        ) : null}
      </ScrollView>
      {students.length && !selected ? (
        <DsText v="caption" c="danger">
          {t("audience.pickOne")}
        </DsText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 8 },
  head: { flexDirection: "row", alignItems: "center", gap: 8 },
  grow: { flex: 1, minWidth: 0 },
  /* `h-8 rounded-full px-3` */
  all: { height: 32, justifyContent: "center", paddingHorizontal: 12, borderRadius: 16 },
  list: { maxHeight: 256, borderWidth: 1, borderRadius: dsRadius.xl },
  /* `min-h-12 gap-3 px-3.5 py-2` */
  row: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  empty: { paddingHorizontal: 16, paddingVertical: 16 },
});
