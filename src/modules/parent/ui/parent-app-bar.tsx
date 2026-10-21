import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { Check, ChevronDown, UserRound } from "lucide-react-native";
import { NotificationBell } from "@/modules/notification";
import { AppBar, radius, Sheet, Text, useTheme } from "@/shared/ui";
// Barrel emas, o'z faylidan — sababi `child-selector.tsx` izohida.
import { useSelectedChild } from "../model/selected-child.store";

export interface ParentAppBarProps {
  /** Ekran nomi — logotipli panelda faqat ekran o'quvchisiga aytiladi. */
  a11yTitle: string;
  back?: { label: string; onPress: () => void };
}

/**
 * Ota-ona sahifalarining tepa paneli — veb `parent-layout.tsx` dagi
 * `PortalLayout` sarlavhasi: chapda logotip, o'ngda farzand tanlagichi va
 * qo'ng'iroq.
 *
 * Vebdagi avatar (hisob menyusi) va hamburger bu yerda YO'Q: mobilda
 * bo'limlar pastki tablarda, hisob menyusi esa Profil tabida.
 */
export function ParentAppBar({ a11yTitle, back }: ParentAppBarProps) {
  return (
    <AppBar a11yTitle={a11yTitle} back={back}>
      <ChildPicker />
      <NotificationBell />
    </AppBar>
  );
}

/**
 * Farzand tanlagichi — veb `selected-child-selector.tsx`. Vebdagi `<select>`
 * telefonda tizim ro'yxatini ochadi; bu yerda uning o'rnini pastdan
 * chiqadigan oyna egallaydi.
 */
function ChildPicker() {
  const { t } = useTranslation("parent");
  const { palette } = useTheme();
  const { children, selectedChild, selectedChildId, selectChild, childrenQuery } = useSelectedChild();
  const [open, setOpen] = useState(false);
  const disabled = childrenQuery.isLoading || !children.length;

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("selector.label")}
        accessibilityState={{ disabled, expanded: open }}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.trigger,
          { borderColor: palette.border, backgroundColor: pressed ? palette["surface-subtle"] : palette.surface },
        ]}
      >
        <UserRound size={16} color={palette["muted-foreground"]} />
        <Text variant="label" numberOfLines={1} style={styles.name}>
          {selectedChild?.name ?? t("selector.noChild")}
        </Text>
        <ChevronDown size={14} color={palette.foreground} />
      </Pressable>

      <Sheet open={open} onClose={() => setOpen(false)} title={t("selector.label")}>
        <View style={styles.options}>
          {children.map((child) => {
            const active = child.id === selectedChildId;
            const color = active ? palette.primary : palette.foreground;
            return (
              <Pressable
                key={child.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                onPress={() => {
                  selectChild(child.id);
                  setOpen(false);
                }}
                style={({ pressed }) => [
                  styles.option,
                  active ? { backgroundColor: palette["primary-soft"] } : pressed && { backgroundColor: palette["surface-subtle"] },
                ]}
              >
                <Text variant="body" numberOfLines={1} style={[styles.grow, { color }]}>
                  {child.name}
                </Text>
                {active ? <Check size={18} color={color} /> : null}
              </Pressable>
            );
          })}
        </View>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  /* `.selected-child-selector` — 38 balandlik, 0 9 bo'shliq, radius 10, 13/700 */
  trigger: {
    flexShrink: 1,
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderRadius: 10,
  },
  name: { flexShrink: 1, maxWidth: 150, fontSize: 13, fontWeight: "700" },
  options: { gap: 2 },
  option: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, borderRadius: radius.md },
  grow: { flex: 1, minWidth: 0 },
});
