import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { Calendar, Check, ChevronDown, ChevronLeft, ChevronRight, Clock } from "lucide-react-native";
import { toIntlLocale } from "@/shared/i18n/intl-locale";
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
  const { t } = useTranslation("mobile");
  const { palette } = useTheme();
  const [open, setOpen] = useState(false);
  /* Tanlov DARHOL qo'llanmaydi — "Tanlash" bosilguncha qoralama. */
  const [draft, setDraft] = useState<Date>(() => parseDate(value));

  function openPicker() {
    // Har ochilishda joriy qiymatdan boshlanadi — `TimeField` dagi kabi.
    setDraft(parseDate(value));
    setOpen(true);
  }

  return (
    <View style={styles.group}>
      <Text variant="label">
        {label}
        {optional ? t("shared.ixtiyoriy_qoshimcha") : ""}
      </Text>
      <Trigger
        icon={<Calendar size={18} color={palette["muted-foreground"]} />}
        text={value || t("shared.tanlanmagan")}
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

            {open ? (
              <MonthCalendar value={draft} minimumDate={minimumDate} onSelect={setDraft} />
            ) : null}

            <View style={styles.timeActions}>
              <Button
                title={t("shared.bekor")}
                variant="secondary"
                onPress={() => setOpen(false)}
                style={styles.timeAction}
              />
              <Button
                title={t("shared.tanlash")}
                onPress={() => {
                  onChange(toDateValue(draft));
                  setOpen(false);
                }}
                style={styles.timeAction}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

/** Dushanbadan boshlanadigan haftaning kun tartibi (JS'da hafta yakshanbadan). */
function weekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Oylik kalendar — O'ZIMIZNIKI, nativ tanlagich EMAS.
 *
 * ┌─ NEGA NATIV TASHLAB YUBORILDI ───────────────────────────────────────┐
 * │ Android'da `@react-native-community/datetimepicker` FAQAT dialog     │
 * │ bo'lib chiqa oladi — uni panel ichiga joylashtirib bo'lmaydi         │
 * │ (iOS'dagi `display="inline"` ning Android'da muqobili yo'q). Dialog  │
 * │ esa Material'ning o'z rangida chiqadi: qurilmada u firuza-yashil     │
 * │ bo'lib, ilovaning binafsha rangi va yorug' paneli yonida butunlay    │
 * │ begona ko'rinardi.                                                    │
 * │                                                                       │
 * │ Shu dalil bilan `TimeField` da ham nativ tanlagich rad etilgan edi   │
 * │ (izohi o'sha yerda). Endi sana ham shunday — natijada iOS va Android │
 * │ BIR XIL ko'rinadi va ilova ichida bitta uslub qoladi.                 │
 * └───────────────────────────────────────────────────────────────────────┘
 *
 * Oy va hafta kunlari nomlari `Intl` dan olinadi, ya'ni ilova tiliga
 * ergashadi. Hafta HAR DOIM dushanbadan boshlanadi: `en-US` yakshanbadan
 * boshlanadi, lekin ilova O'zbekiston uchun va jadval dushanbadan yuriladi.
 */
function MonthCalendar({
  value,
  minimumDate,
  onSelect,
}: {
  value: Date;
  minimumDate?: Date;
  onSelect: (date: Date) => void;
}) {
  const { t, i18n } = useTranslation("mobile");
  const { palette } = useTheme();
  const locale = toIntlLocale(i18n.language);

  /**
   * Ko'rinib turgan oy.
   *
   * Faqat MOUNT paytida tanlangan sanadan olinadi: keyin foydalanuvchi
   * oylar bo'ylab yurganda sana tanlansa ham ko'rinish sakramasligi
   * kerak. Panel har ochilganda komponent qaytadan tug'iladi (chizilishi
   * `open` ga bog'langan), shuning uchun sinxronlash effekti kerak emas.
   */
  const [cursor, setCursor] = useState(() => new Date(value.getFullYear(), value.getMonth(), 1));

  const title = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(cursor),
    [cursor, locale]
  );

  /** Qisqa hafta kunlari: 2026-06-01 dushanba ekani ma'lum, shundan olamiz. */
  const weekdays = useMemo(() => {
    const format = new Intl.DateTimeFormat(locale, { weekday: "short" });
    return Array.from({ length: 7 }, (_, index) =>
      format.format(new Date(2026, 5, 1 + index))
    );
  }, [locale]);

  /** Katakchalar: oy boshigacha bo'sh joylar, keyin kunlar. */
  const cells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const total = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const blanks = Array.from({ length: weekdayIndex(first) }, () => null);
    const days = Array.from(
      { length: total },
      (_, index) => new Date(cursor.getFullYear(), cursor.getMonth(), index + 1)
    );
    return [...blanks, ...days];
  }, [cursor]);

  const min = minimumDate ? startOfDay(minimumDate) : null;
  const selected = startOfDay(value).getTime();

  function shiftMonth(step: number) {
    setCursor((current) => new Date(current.getFullYear(), current.getMonth() + step, 1));
  }

  return (
    <View style={styles.calendar}>
      <View style={styles.calendarHead}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("shared.oldingi_oy")}
          onPress={() => shiftMonth(-1)}
          style={styles.calendarArrow}
        >
          <ChevronLeft size={20} color={palette["primary-text"]} />
        </Pressable>

        <Text variant="label" style={styles.calendarTitle}>
          {title}
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("shared.keyingi_oy")}
          onPress={() => shiftMonth(1)}
          style={styles.calendarArrow}
        >
          <ChevronRight size={20} color={palette["primary-text"]} />
        </Pressable>
      </View>

      <View style={styles.calendarRow}>
        {weekdays.map((name) => (
          <Text key={name} variant="caption" tone="muted" style={styles.calendarCellText}>
            {name}
          </Text>
        ))}
      </View>

      <View style={styles.calendarGrid}>
        {cells.map((date, index) => {
          if (!date) return <View key={`bo-${index}`} style={styles.calendarCell} />;

          const disabled = min ? date.getTime() < min.getTime() : false;
          const active = date.getTime() === selected;

          return (
            <Pressable
              key={date.toISOString()}
              accessibilityRole="button"
              accessibilityState={{ selected: active, disabled }}
              accessibilityLabel={new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(date)}
              disabled={disabled}
              onPress={() => onSelect(date)}
              style={styles.calendarCell}
            >
              <View
                style={[
                  styles.calendarDay,
                  active && { backgroundColor: palette.primary, borderRadius: radius.full },
                ]}
              >
                <Text
                  style={{
                    color: active
                      ? palette["primary-foreground"]
                      : disabled
                        ? palette["muted-foreground"]
                        : palette.foreground,
                    opacity: disabled ? 0.45 : 1,
                  }}
                >
                  {date.getDate()}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
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
        text={value || t("shared.tanlanmagan")}
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
  calendar: { paddingHorizontal: 12, paddingBottom: 8 },
  calendarHead: { flexDirection: "row", alignItems: "center", paddingBottom: 8 },
  calendarTitle: { flex: 1, textAlign: "center" },
  calendarArrow: {
    width: MIN_TOUCH_SIZE,
    height: MIN_TOUCH_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarRow: { flexDirection: "row" },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap" },
  /* Yetti ustun: `flexBasis` foizda, shunda ekran enidan qat'i nazar teng. */
  calendarCell: { width: `${100 / 7}%`, alignItems: "center", paddingVertical: 2 },
  /*
   * Yetti ustun — katakcha bilan BIR XIL kenglik. Ilgari bu yerda
   * `width: "100%"` turardi va birinchi yorliq butun qatorni egallab,
   * qolgan oltitasini chetga surib yuborardi: ekranda faqat "Dush"
   * ko'rinardi.
   */
  calendarCellText: { width: `${100 / 7}%`, textAlign: "center" },
  calendarDay: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  timePreview: {
    textAlign: "center",
    fontSize: 34,
    // `Text` variantsiz `body` ni oladi (lineHeight 20) va 34px raqamlarning
    // tepasi kesilib qolardi — shuning uchun aniq beriladi.
    lineHeight: 42,
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
