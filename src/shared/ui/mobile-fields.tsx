import { forwardRef, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from "react-native";
import { bodyFont } from "./fonts";
import { DsText, dsRadius, dsType, useDs } from "./ds";
import { Icon } from "./icon";
import { MobileDateSheet, MobileTimeSheet, type MobileTimeSheetProps } from "./mobile-pickers";
import { Sheet } from "./sheet";

/*
 * Yangi dizayndagi mobil forma maydonlari — veb `shared/ui/mobile-fields.tsx`.
 * `MOBILE_INPUT`: `h-13 rounded-lg border-[1.5px] px-4 text-body`, fokusda
 * `border-focus`; `bg-subtle` (yoki `surface` — `MOBILE_INPUT_SURFACE`).
 */

export interface MobileInputProps extends Omit<TextInputProps, "style"> {
  /** `bg-surface` (kulrang fondagi kartalarda). */
  surface?: boolean;
  invalid?: boolean;
  /** Ko'p qatorli (`textarea`) — balandligi `h-28`. */
  multilineHeight?: number;
  style?: StyleProp<ViewStyle>;
}

export const MobileInput = forwardRef<TextInput, MobileInputProps>(function MobileInput(
  { surface = false, invalid = false, multiline, multilineHeight = 112, onFocus, onBlur, style, ...props },
  ref
) {
  const ds = useDs();
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      ref={ref}
      multiline={multiline}
      placeholderTextColor={ds.c["ink-secondary"]}
      selectionColor={ds.c.brand}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
      style={[
        styles.input,
        multiline ? { height: multilineHeight, paddingTop: 14, paddingBottom: 14, textAlignVertical: "top" } : null,
        {
          color: ds.c.ink,
          backgroundColor: surface ? ds.c.surface : ds.c.subtle,
          borderColor: invalid ? ds.c["error-text"] : focused ? ds.c.focus : "transparent",
        },
        style as never,
      ]}
      {...props}
    />
  );
});

/** Yorliq (`text-body-sm`) va o'ngda ixtiyoriy qo'shimcha, ostida maydon. */
export function MobileFieldLabel({ label, aside, gap = 8, children }: { label: ReactNode; aside?: ReactNode; gap?: number; children: ReactNode }) {
  return (
    <View style={[styles.labelled, { gap }]}>
      <View style={styles.labelRow}>
        <DsText v="body-sm" numberOfLines={1} style={styles.grow}>
          {label}
        </DsText>
        {aside}
      </View>
      {children}
    </View>
  );
}

export interface MobilePickerFieldProps {
  /** `select` — variantlar ro'yxati; `date`/`time` — kalendar va soat oynalari. */
  type: "select" | "date" | "time";
  value: string;
  display: ReactNode;
  /** Qiymat tanlanmagan — matn `text-ink-secondary`. */
  placeholder?: boolean;
  invalid?: boolean;
  surface?: boolean;
  options?: Array<{ value: string; label: string }>;
  /** `date`: shundan oldingi kunlar tanlanmaydi (`YYYY-MM-DD`). */
  min?: string;
  /** `time`: oynada davomiylik ham tanlanadi. */
  duration?: MobileTimeSheetProps["duration"];
  ariaLabel: string;
  /** Tanlov oynasining sarlavhasi (standart — `ariaLabel`). */
  sheetTitle?: string;
  onChange: (value: string) => void;
}

/**
 * Tanlov maydoni — `h-13 rounded-lg bg-subtle px-4`, o'ngda `chevron-down`
 * (xato bo'lsa `warning`). `select` — pastki oynadagi variantlar ro'yxati
 * (vebda brauzer ro'yxati), `date`/`time` — `MobileDateSheet`/`MobileTimeSheet`.
 */
export function MobilePickerField({
  type,
  value,
  display,
  placeholder = false,
  invalid = false,
  surface = false,
  options = [],
  min,
  duration,
  ariaLabel,
  sheetTitle,
  onChange,
}: MobilePickerFieldProps) {
  const ds = useDs();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={ariaLabel}
        onPress={() => setOpen(true)}
        style={[
          styles.picker,
          { backgroundColor: surface ? ds.c.surface : ds.c.subtle, borderColor: invalid ? ds.c["error-text"] : open ? ds.c.focus : "transparent" },
        ]}
      >
        <DsText c={placeholder ? "ink-secondary" : "ink"} numberOfLines={1} style={styles.grow}>
          {display}
        </DsText>
        <Icon name={invalid ? "warning" : "chevron-down"} size={20} color={invalid ? ds.c["error-text"] : ds.c["ink-secondary"]} />
      </Pressable>
      {type === "date" ? <MobileDateSheet open={open} onOpenChange={setOpen} value={value} min={min} onChange={onChange} /> : null}
      {type === "time" ? <MobileTimeSheet open={open} onOpenChange={setOpen} value={value} duration={duration} onChange={onChange} /> : null}
      <Sheet variant="app" open={type === "select" && open} onClose={() => setOpen(false)} title={sheetTitle ?? ariaLabel}>
        <View style={[styles.options, { backgroundColor: ds.c.subtle }]}>
          {options.map((option, index) => {
            const selected = option.value === value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                style={({ pressed }) => [
                  styles.option,
                  index < options.length - 1 && { borderBottomWidth: 1, borderBottomColor: ds.c.line },
                  pressed && { backgroundColor: ds.c.muted },
                ]}
              >
                <DsText c={selected ? "brand" : "ink"} w={selected ? "500" : undefined} numberOfLines={1} style={styles.grow}>
                  {option.label}
                </DsText>
                <MobileRadio checked={selected} />
              </Pressable>
            );
          })}
        </View>
      </Sheet>
    </>
  );
}

/** Teng bo'lingan tanlov tugmalari — `h-11 rounded-full`, faoli `bg-brand`. */
export function MobileChoiceChips<T extends string | number>({
  items,
  value,
  onChange,
  render,
}: {
  items: readonly T[];
  value: T;
  onChange: (value: T) => void;
  render?: (item: T) => ReactNode;
}) {
  const ds = useDs();
  return (
    <View style={styles.chips}>
      {items.map((item) => {
        const active = item === value;
        return (
          <Pressable
            key={String(item)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(item)}
            style={({ pressed }) => [
              styles.chip,
              active
                ? { backgroundColor: ds.c.brand }
                : { borderWidth: 1, borderColor: ds.c["line-strong"], backgroundColor: pressed ? ds.c.subtle : ds.c.surface },
            ]}
          >
            <DsText v="body-sm" w="500" c={active ? "on-action" : "ink"}>
              {render ? render(item) : String(item)}
            </DsText>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Ikki holatli almashtirgich — `h-13 rounded-full bg-subtle p-1`, faoli `bg-brand`. */
export function MobileToggle<T extends string>({
  items,
  value,
  onChange,
}: {
  items: Array<{ id: T; label: ReactNode }>;
  value: T;
  onChange: (value: T) => void;
}) {
  const ds = useDs();
  return (
    <View accessibilityRole="radiogroup" style={[styles.toggle, { backgroundColor: ds.c.subtle }]}>
      {items.map((item) => {
        const active = value === item.id;
        return (
          <Pressable
            key={item.id}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            onPress={() => onChange(item.id)}
            style={[styles.toggleItem, active && { backgroundColor: ds.c.brand }]}
          >
            <DsText v="body-sm" w="500" c={active ? "on-action" : "ink"}>
              {item.label}
            </DsText>
          </Pressable>
        );
      })}
    </View>
  );
}

/** `size-[22px] rounded-full`; tanlanganda `border-[6px] border-brand`. */
export function MobileRadio({ checked }: { checked: boolean }) {
  const ds = useDs();
  return (
    <View
      style={[
        styles.radio,
        { backgroundColor: ds.c.surface },
        checked ? { borderWidth: 6, borderColor: ds.c.brand } : { borderWidth: 1.5, borderColor: ds.c["line-strong"] },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  input: {
    height: 52,
    paddingHorizontal: 16,
    paddingVertical: 0,
    borderWidth: 1.5,
    borderRadius: dsRadius.lg,
    fontSize: dsType.body.fontSize,
    fontFamily: bodyFont("400"),
  },
  labelled: { minWidth: 0 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  picker: { height: 52, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, borderWidth: 1.5, borderRadius: dsRadius.lg },
  options: { overflow: "hidden", borderRadius: dsRadius.xl },
  option: { minHeight: 52, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  chips: { flexDirection: "row", gap: 8 },
  chip: { flex: 1, minWidth: 0, height: 44, alignItems: "center", justifyContent: "center", borderRadius: dsRadius.full },
  toggle: { alignSelf: "flex-start", height: 52, flexDirection: "row", alignItems: "center", padding: 4, borderRadius: dsRadius.full },
  toggleItem: { height: 44, justifyContent: "center", paddingHorizontal: 16, borderRadius: dsRadius.full },
  radio: { width: 22, height: 22, borderRadius: dsRadius.full },
});
