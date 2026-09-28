import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Calendar, Check, ChevronDown, Clock } from "lucide-react-native";
import { fontSize, MIN_TOUCH_SIZE, radius } from "./tokens";
import { useTheme } from "./theme";
import { Text } from "./text";
import { Button } from "./button";

/**
 * Sana, vaqt va ro'yxatdan tanlash — veb `legacy/form-pickers.tsx` (733 qator)
 * ning mobil o'rni.
 *
 * Veb'da bu maxsus yozilgan kalendar va dropdown edi. SANA uchun mobilda
 * platformaning O'Z tanlagichi ishlatiladi: foydalanuvchi uni allaqachon
 * biladi, u ekran o'lchamiga o'zi moslashadi va ekran o'quvchisi bilan
 * to'g'ri ishlaydi.
 *
 * VAQT esa o'zimizniki — sababi `TimeField` ustidagi izohda.
 */

/** `yyyy-MM-dd` — mahalliy vaqt bo'yicha (toISOString UTC'ga surib yuboradi). */
function toDateValue(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function parseDate(value: string, fallback = new Date()): Date {
  if (!value) return fallback;
  const parsed = new Date(value.includes("T") ? value : `${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
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

/** Daqiqalar qadami — dars vaqtlari amalda beshlik bo'ladi. */
const MINUTE_STEP = 5;
/** Ro'yxat elementining balandligi — tanlanganga surish uchun ham kerak. */
const WHEEL_ITEM_HEIGHT = 44;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/**
 * Vaqt tanlash — O'ZIMIZNIKI, nativ tanlagich EMAS.
 *
 * ┌─ NEGA NATIV TASHLAB YUBORILDI ───────────────────────────────────────┐
 * │ Androidda `@react-native-community/datetimepicker` Material soat     │
 * │ SIFERBLATINI chiqaradi: doira bo'ylab raqamlar, ularni barmoq bilan  │
 * │ aylantirish kerak. U ilovaning qolgan qismidan butunlay boshqacha    │
 * │ ko'rinadi (o'z rangi, o'z shrifti, inglizcha CANCEL/OK) va telefonda │
 * │ 18:30 ni qo'yish uchun ikki marta aylantirish talab qilinadi.        │
 * │                                                                       │
 * │ Bu yerdagi ikki ustunli ro'yxat esa bitta teginishda soatni, bitta   │
 * │ teginishda daqiqani beradi va `SelectField` bilan bir xil            │
 * │ ko'rinadi — ilova ichida bitta uslub qoladi.                          │
 * └───────────────────────────────────────────────────────────────────────┘
 *
 * Daqiqalar beshlikda, LEKIN serverdan kelgan begona qiymat (masalan
 * `18:37`) ro'yxatga QO'SHILADI — aks holda mavjud darsni tahrirlashda
 * vaqt jimgina yaxlitlanib ketardi.
 */
export function TimeField({ label, value, onChange }: TimeFieldProps) {
  const { t } = useTranslation("mobile");
  const { palette } = useTheme();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value || "18:30");

  const [hour, minute] = splitTime(draft);

  const hours = useMemo(() => Array.from({ length: 24 }, (_, index) => index), []);
  const minutes = useMemo(() => {
    const steps = Array.from({ length: 60 / MINUTE_STEP }, (_, index) => index * MINUTE_STEP);
    return steps.includes(minute) ? steps : [...steps, minute].sort((a, b) => a - b);
  }, [minute]);

  function openPicker() {
    // Har ochilishda joriy qiymatdan boshlanadi: oldingi tugallanmagan
    // tanlov qolib ketmasin.
    setDraft(value || "18:30");
    setOpen(true);
  }

  function confirm() {
    onChange(draft);
    setOpen(false);
  }

  return (
    <View style={styles.group}>
      <Text variant="label">{label}</Text>
      <Trigger
        icon={<Clock size={18} color={palette["muted-foreground"]} />}
        text={value || "Tanlanmagan"}
        muted={!value}
        onPress={openPicker}
      />

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("shared.yopish")}
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

            {/* Tanlangan vaqt yirik ko'rinadi — ikki ustunni bog'lab turadi. */}
            <Text style={[styles.timePreview, { color: palette.foreground }]}>{draft}</Text>

            <View style={styles.wheelHeads}>
              <Text variant="caption" tone="muted" style={styles.wheelHead}>
                {t("shared.soat")}
              </Text>
              <Text variant="caption" tone="muted" style={styles.wheelHead}>
                {t("shared.daqiqa")}
              </Text>
            </View>

            <View style={styles.wheels}>
              <Wheel
                accessibilityLabel={t("shared.soat")}
                values={hours}
                selected={hour}
                onSelect={(next) => setDraft(`${pad(next)}:${pad(minute)}`)}
              />
              <Wheel
                accessibilityLabel={t("shared.daqiqa")}
                values={minutes}
                selected={minute}
                onSelect={(next) => setDraft(`${pad(hour)}:${pad(next)}`)}
              />
            </View>

            <View style={styles.timeActions}>
              <Button
                title={t("shared.bekor")}
                variant="secondary"
                onPress={() => setOpen(false)}
                style={styles.timeAction}
              />
              <Button title={t("shared.tanlash")} onPress={confirm} style={styles.timeAction} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

/** `HH:mm` -> `[soat, daqiqa]`; buzuq qiymatda 18:30 ga qaytadi. */
function splitTime(value: string): [number, number] {
  const [rawHour, rawMinute] = (value || "").split(":").map(Number);
  const hour = Number.isFinite(rawHour) && rawHour >= 0 && rawHour < 24 ? rawHour : 18;
  const minute = Number.isFinite(rawMinute) && rawMinute >= 0 && rawMinute < 60 ? rawMinute : 30;
  return [hour, minute];
}

/** Vaqt tanlagichining bitta ustuni. */
function Wheel({
  values,
  selected,
  onSelect,
  accessibilityLabel,
}: {
  values: number[];
  selected: number;
  onSelect: (value: number) => void;
  accessibilityLabel: string;
}) {
  const { palette } = useTheme();
  const ref = useRef<ScrollView>(null);

  /*
   * Ochilganda tanlangan qiymatga suriladi.
   *
   * `contentOffset` bilan qilib bo'lmaydi — u ScrollView'da faqat iOS'da
   * ishlaydi. Shu sabab birinchi render'dan keyin qo'lda suriladi.
   */
  useEffect(() => {
    const index = values.indexOf(selected);
    if (index < 0) return;
    ref.current?.scrollTo({ y: index * WHEEL_ITEM_HEIGHT, animated: false });
    // Faqat ochilishda — keyingi tanlovlarda ro'yxat sakramasin.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ScrollView
      ref={ref}
      accessibilityLabel={accessibilityLabel}
      style={styles.wheel}
      showsVerticalScrollIndicator={false}
      snapToInterval={WHEEL_ITEM_HEIGHT}
      decelerationRate="fast"
    >
      {values.map((item) => {
        const active = item === selected;
        return (
          <Pressable
            key={item}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onSelect(item)}
            style={[
              styles.wheelItem,
              active && { backgroundColor: palette["primary-soft"] },
            ]}
          >
            <Text
              style={[
                styles.wheelText,
                { color: active ? palette["primary-text"] : palette.foreground },
              ]}
            >
              {pad(item)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
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
  const { t } = useTranslation("mobile");
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
          accessibilityLabel={t("shared.yopish")}
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
                placeholder={t("shared.qidirish")}
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
                {t("shared.mos_variant_topilmadi")}
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
  timePreview: {
    textAlign: "center",
    fontSize: 34,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    paddingBottom: 8,
  },
  wheelHeads: { flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingBottom: 4 },
  wheelHead: { flex: 1, textAlign: "center" },
  wheels: { flexDirection: "row", gap: 12, paddingHorizontal: 16, height: WHEEL_ITEM_HEIGHT * 4 },
  wheel: { flex: 1 },
  wheelItem: {
    height: WHEEL_ITEM_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
  },
  wheelText: { fontSize: fontSize.xl, fontVariant: ["tabular-nums"] },
  timeActions: { flexDirection: "row", gap: 10, padding: 16 },
  timeAction: { flex: 1 },
});
