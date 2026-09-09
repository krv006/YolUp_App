import { useState } from "react";
import { Modal, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Calendar, Check, ChevronDown, Clock } from "lucide-react-native";
import { fontSize, MIN_TOUCH_SIZE, radius } from "./tokens";
import { useTheme } from "./theme";
import { Text } from "./text";

/**
 * Sana, vaqt va ro'yxatdan tanlash — veb `legacy/form-pickers.tsx` (733 qator)
 * ning mobil o'rni.
 *
 * Veb'da bu maxsus yozilgan kalendar va dropdown edi. Mobilda platformaning
 * O'Z tanlagichi ishlatiladi: foydalanuvchi uni allaqachon biladi, u
 * ekran o'lchamiga o'zi moslashadi va ekran o'quvchisi bilan to'g'ri ishlaydi.
 */

/** `yyyy-MM-dd` — mahalliy vaqt bo'yicha (toISOString UTC'ga surib yuboradi). */
function toDateValue(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** `HH:mm` */
function toTimeValue(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function parseDate(value: string, fallback = new Date()): Date {
  if (!value) return fallback;
  const parsed = new Date(value.includes("T") ? value : `${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

/**
 * `HH:mm` ni BUGUNGI sanadagi `Date` ga aylantiradi.
 *
 * ┌─ NEGA BUGUN, 1970 EMAS ──────────────────────────────────────────────┐
 * │ Ilgari bu yerda `new Date("1970-01-01T" + value)` turardi — vaqt     │
 * │ uchun "neytral" sana sifatida. Neytral emas ekan: mintaqa siljishi   │
 * │ YILLAR DAVOMIDA O'ZGARADI. Asia/Tashkent 1970 yilda UTC+6 edi,       │
 * │ hozir UTC+5.                                                          │
 * │                                                                       │
 * │ Nativ tanlagich Date ni JORIY mintaqa qoidasi bilan o'qiydi, JS esa  │
 * │ o'sha lahza uchun TARIXIY qoidani qo'llaydi — ikkalasi bir soatga    │
 * │ farq qilardi. Natijada 19:00 tanlansa 18:00 saqlanardi.              │
 * │                                                                       │
 * │ Bugungi sana ishlatilganda ikkala tomon ham bitta, joriy siljishni   │
 * │ qo'llaydi. Sana matnga umuman kirmaydi — faqat `HH:mm` saqlanadi.    │
 * └───────────────────────────────────────────────────────────────────────┘
 */
function parseTime(value: string): Date {
  const [hours, minutes] = (value || "18:30").split(":").map(Number);
  const date = new Date();
  date.setHours(Number.isFinite(hours) ? hours : 18, Number.isFinite(minutes) ? minutes : 30, 0, 0);
  return date;
}

export interface DateFieldProps {
  label: string;
  /** `yyyy-MM-dd` */
  value: string;
  onChange: (value: string) => void;
  minimumDate?: Date;
  optional?: boolean;
}

export function DateField({ label, value, onChange, minimumDate, optional }: DateFieldProps) {
  const { palette } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.group}>
      <Text variant="label">
        {label}
        {optional ? " — ixtiyoriy" : ""}
      </Text>
      <Trigger
        icon={<Calendar size={18} color={palette["muted-foreground"]} />}
        text={value || "Tanlanmagan"}
        muted={!value}
        onPress={() => setOpen(true)}
      />
      {open ? (
        <DateTimePicker
          value={parseDate(value)}
          mode="date"
          minimumDate={minimumDate}
          // Androidda tanlagich modal sifatida chiqadi va o'zi yopiladi;
          // iOS'da u inline turadi, shuning uchun holatni biz boshqaramiz.
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={(event, selected) => {
            if (Platform.OS === "android") setOpen(false);
            if (event.type === "dismissed" || !selected) return;
            onChange(toDateValue(selected));
            if (Platform.OS === "ios") setOpen(false);
          }}
        />
      ) : null}
    </View>
  );
}

export interface TimeFieldProps {
  label: string;
  /** `HH:mm` */
  value: string;
  onChange: (value: string) => void;
}

export function TimeField({ label, value, onChange }: TimeFieldProps) {
  const { palette } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.group}>
      <Text variant="label">{label}</Text>
      <Trigger
        icon={<Clock size={18} color={palette["muted-foreground"]} />}
        text={value || "Tanlanmagan"}
        muted={!value}
        onPress={() => setOpen(true)}
      />
      {open ? (
        <DateTimePicker
          value={parseTime(value)}
          mode="time"
          is24Hour
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, selected) => {
            if (Platform.OS === "android") setOpen(false);
            if (event.type === "dismissed" || !selected) return;
            onChange(toTimeValue(selected));
            if (Platform.OS === "ios") setOpen(false);
          }}
        />
      ) : null}
    </View>
  );
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFieldProps {
  label: string;
  value: string;
  options: readonly SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * Ro'yxatdan tanlash. Nativ `Picker` ATAYLAB ishlatilmadi: u Android va
 * iOS'da butunlay boshqacha ko'rinadi va uzun yorliqlarni kesib tashlaydi
 * (dars nomlari uzun bo'ladi). O'rniga to'liq ekranli ro'yxat.
 */
export function SelectField({ label, value, options, onChange, placeholder }: SelectFieldProps) {
  const { palette } = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <View style={styles.group}>
      <Text variant="label">{label}</Text>
      <Trigger
        icon={<ChevronDown size={18} color={palette["muted-foreground"]} />}
        text={selected?.label ?? placeholder ?? "Tanlang"}
        muted={!selected}
        onPress={() => setOpen(true)}
      />

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Yopish"
          style={[styles.backdrop, { backgroundColor: palette.overlay }]}
          onPress={() => setOpen(false)}
        >
          <Pressable
            onPress={() => undefined}
            style={[
              styles.sheet,
              { backgroundColor: palette["surface-elevated"], borderColor: palette.border },
            ]}
          >
            <View style={[styles.grabber, { backgroundColor: palette["border-strong"] }]} />
            <Text variant="subheading" style={styles.sheetTitle}>
              {label}
            </Text>
            <ScrollView>
              {options.map((option) => {
                const active = option.value === value;
                return (
                  <Pressable
                    key={option.value || "__empty"}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    style={({ pressed }) => [
                      styles.option,
                      pressed && { backgroundColor: palette["surface-subtle"] },
                    ]}
                  >
                    <Text style={styles.optionText} numberOfLines={2}>
                      {option.label}
                    </Text>
                    {active ? <Check size={18} color={palette["primary-text"]} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function Trigger({
  icon,
  text,
  muted,
  onPress,
}: {
  icon: React.ReactNode;
  text: string;
  muted: boolean;
  onPress: () => void;
}) {
  const { palette } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={text}
      onPress={onPress}
      style={({ pressed }) => [
        styles.trigger,
        {
          backgroundColor: palette.surface,
          borderColor: palette.input,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      {icon}
      <Text
        style={[styles.triggerText, { color: muted ? palette["muted-foreground"] : palette.foreground }]}
        numberOfLines={1}
      >
        {text}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  group: { gap: 6 },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: MIN_TOUCH_SIZE + 4,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  triggerText: { flex: 1, fontSize: fontSize.lg },
  backdrop: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    maxHeight: "70%",
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    paddingBottom: 24,
  },
  grabber: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, marginBottom: 10 },
  sheetTitle: { paddingHorizontal: 16, paddingBottom: 8 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: MIN_TOUCH_SIZE + 6,
    paddingHorizontal: 16,
  },
  optionText: { flex: 1 },
});
