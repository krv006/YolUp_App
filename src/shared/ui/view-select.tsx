import { useState, type ComponentType } from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Check, ChevronDown } from "lucide-react-native";
import { Text } from "./text";
import { useTheme } from "./theme";
import { radius } from "./tokens";

export interface ViewSelectOption<T extends string> {
  value: T;
  label: string;
  icon?: ComponentType<{ size?: number; color?: string }>;
}

export interface ViewSelectProps<T extends string> {
  value: T;
  options: ReadonlyArray<ViewSelectOption<T>>;
  onChange: (value: T) => void;
  label: string;
  align?: "start" | "end";
  style?: StyleProp<ViewStyle>;
}

/**
 * Ko'rinish tanlagichi — veb `shared/ui/view-select.tsx`: yumaloq tugma
 * ("Ro'yxat ⌄") va ostida ochiladigan kichik ro'yxat.
 *
 * Ro'yxat tugma ostida suzib chiqadi (`zIndex`), shuning uchun komponent
 * sahifa tepasida turishi kerak — undan keyingi qismlar ustiga chiqadi.
 */
export function ViewSelect<T extends string>({ value, options, onChange, label, align = "start", style }: ViewSelectProps<T>) {
  const { palette } = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value) ?? options[0];
  const SelectedIcon = selected?.icon;

  return (
    <View style={[styles.wrap, open && styles.raised, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((current) => !current)}
        style={({ pressed }) => [
          styles.trigger,
          { borderColor: palette.border, backgroundColor: pressed ? palette["surface-subtle"] : palette.surface },
        ]}
      >
        {SelectedIcon ? <SelectedIcon size={17} color={palette["muted-foreground"]} /> : null}
        <Text variant="label" numberOfLines={1} style={styles.grow}>
          {selected?.label}
        </Text>
        <View style={open && styles.flip}>
          <ChevronDown size={17} color={palette["muted-foreground"]} />
        </View>
      </Pressable>

      {open ? (
        <View
          accessibilityRole="menu"
          style={[
            styles.list,
            align === "end" ? styles.right : styles.left,
            { borderColor: palette.border, backgroundColor: palette.surface },
          ]}
        >
          {options.map((option) => {
            const active = option.value === value;
            const OptionIcon = option.icon;
            const color = active ? palette.primary : palette.foreground;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="menuitem"
                accessibilityState={{ selected: active }}
                onPress={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                style={({ pressed }) => [
                  styles.option,
                  active ? { backgroundColor: palette["primary-soft"] } : pressed && { backgroundColor: palette["surface-subtle"] },
                ]}
              >
                {OptionIcon ? <OptionIcon size={17} color={color} /> : null}
                <Text variant="label" numberOfLines={1} style={[styles.grow, { color }]}>
                  {option.label}
                </Text>
                {active ? <Check size={16} color={color} /> : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "relative" },
  raised: { zIndex: 40, elevation: 40 },
  grow: { flex: 1, minWidth: 0 },
  /* `h-11 rounded-full border px-4 gap-2` */
  trigger: { height: 44, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, borderWidth: 1, borderRadius: radius.full },
  flip: { transform: [{ rotate: "180deg" }] },
  /* `top-[calc(100%+6px)] rounded-2xl border p-1.5 shadow-xl` */
  list: {
    position: "absolute",
    top: 50,
    minWidth: "100%",
    gap: 2,
    padding: 6,
    borderWidth: 1,
    borderRadius: radius["2xl"],
    shadowColor: "#24264d",
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  left: { left: 0 },
  right: { right: 0 },
  option: { height: 44, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, borderRadius: radius.xl },
});
