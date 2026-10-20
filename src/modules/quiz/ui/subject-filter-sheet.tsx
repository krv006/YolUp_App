import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { Check, GraduationCap, Search } from "lucide-react-native";
import { radius, Sheet, Text, useTheme } from "@/shared/ui";

export interface SubjectFilterSheetProps {
  open: boolean;
  onClose: () => void;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}

/**
 * Fan bo'yicha filtr — veb `modules/quiz/ui/subject-filter-sheet.tsx` porti.
 * Vebdagi `Drawer` o'rniga `Sheet`; qidiruv maydoni va ro'yxat bir xil.
 */
export function SubjectFilterSheet({ open, onClose, value, options, onChange }: SubjectFilterSheetProps) {
  const { t } = useTranslation("quiz");
  const { palette } = useTheme();
  const [query, setQuery] = useState("");
  const term = query.trim().toLowerCase();
  const visible = term ? options.filter((option) => option.label.toLowerCase().includes(term)) : options;

  function close() {
    setQuery("");
    onClose();
  }

  return (
    <Sheet open={open} onClose={close} title={t("teacherPage.subjectFilterLabel")}>
      {/* `h-12 rounded-2xl bg-subtle px-4 gap-3` */}
      <View style={[styles.search, { backgroundColor: palette["surface-subtle"] }]}>
        <Search size={18} color={palette["subtle-foreground"]} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t("teacherPage.subjectSearch")}
          placeholderTextColor={palette["subtle-foreground"]}
          accessibilityLabel={t("teacherPage.subjectSearch")}
          autoCorrect={false}
          style={[styles.searchInput, { color: palette.foreground }]}
        />
      </View>

      <View style={styles.list}>
        {visible.map((option) => {
          const active = option.value === value;
          const color = active ? palette.primary : palette.foreground;
          return (
            <Pressable
              key={option.value || "all"}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => {
                onChange(option.value);
                close();
              }}
              style={({ pressed }) => [
                styles.option,
                active
                  ? { backgroundColor: palette["primary-soft"] }
                  : pressed && { backgroundColor: palette["surface-subtle"] },
              ]}
            >
              <GraduationCap size={19} color={color} />
              <Text variant="body" numberOfLines={1} style={[styles.grow, { color }]}>
                {option.label}
              </Text>
              {active ? (
                <View style={[styles.check, { backgroundColor: palette.primary }]}>
                  <Check size={15} color={palette["primary-foreground"]} />
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1 },
  search: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    borderRadius: radius["2xl"],
  },
  searchInput: { flex: 1, height: "100%", fontSize: 16, fontFamily: "Onest-Regular" },
  /* `flex-col gap-0.5` */
  list: { gap: 2 },
  /* `h-12 rounded-xl px-3 gap-3 text-body` */
  option: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    borderRadius: radius.xl,
  },
  check: { width: 24, height: 24, borderRadius: 7, alignItems: "center", justifyContent: "center" },
});
