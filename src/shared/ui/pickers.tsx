import { useState } from "react";
import { Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
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
  /**
   * Ro'yxat ustida qidiruv maydoni. Berilmasa, variant soni
   * `SEARCH_THRESHOLD` dan oshganda O'ZI yoqiladi.
   */
  searchable?: boolean;
}

/**
 * Shu sondan ko'p variant bo'lsa qidiruv o'zi paydo bo'ladi.
 *
 * Sabab: fanlar ro'yxati backenddan 20 dan ortiq element bilan keladi va
 * uni aylantirib chiqish uzoq. Qisqa ro'yxatlarda (masalan 3 ta rol)
 * qidiruv faqat joy egallaydi.
 */
const SEARCH_THRESHOLD = 8;

/**
 * Ro'yxatdan tanlash. Nativ `Picker` ATAYLAB ishlatilmadi: u Android va
 * iOS'da butunlay boshqacha ko'rinadi va uzun yorliqlarni kesib tashlaydi
 * (dars nomlari uzun bo'ladi). O'rniga to'liq ekranli ro'yxat.
 */
export function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder,
  searchable,
}: SelectFieldProps) {
  const { palette } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = options.find((option) => option.value === value);
  const withSearch = searchable ?? options.length > SEARCH_THRESHOLD;

  const visible = query.trim()
    ? options.filter((option) => option.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  function close() {
    setOpen(false);
    // Qidiruv keyingi ochilishda tozalangan bo'lsin — aks holda foydalanuvchi
    // qisqargan ro'yxatni ko'rib, "variantlar yo'qolibdi" deb o'ylaydi.
    setQuery("");
  }

  return (
    <View style={styles.group}>
      <Text variant="label">{label}</Text>
      <Trigger
        icon={<ChevronDown size={18} color={palette["muted-foreground"]} />}
        text={selected?.label ?? placeholder ?? "Tanlang"}
        muted={!selected}
        onPress={() => setOpen(true)}
      />

      <Modal visible={open} transparent animationType="slide" onRequestClose={close}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Yopish"
          style={[styles.backdrop, { backgroundColor: palette.overlay }]}
          onPress={close}
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
            {withSearch ? (
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Qidirish"
                placeholderTextColor={palette["muted-foreground"]}
                autoCorrect={false}
                style={[
                  styles.search,
                  {
                    backgroundColor: palette["surface-subtle"],
                    borderColor: palette.border,
                    color: palette.foreground,
                  },
                ]}
              />
            ) : null}

            {visible.length === 0 ? (
              <Text variant="caption" tone="muted" style={styles.empty}>
                Mos variant topilmadi
              </Text>
            ) : null}

            <ScrollView keyboardShouldPersistTaps="handled">
              {visible.map((option) => {
                const active = option.value === value;
                return (
                  <Pressable
                    key={option.value || "__empty"}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => {
                      onChange(option.value);
                      close();
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
  search: {
    marginHorizontal: 16,
    marginBottom: 8,
    minHeight: MIN_TOUCH_SIZE,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    fontSize: fontSize.lg,
  },
  empty: { paddingHorizontal: 16, paddingBottom: 12 },
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
