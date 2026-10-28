import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import { headingFont } from "./fonts";
import { DsText, dsRadius, useDs } from "./ds";
import { Icon } from "./icon";
import { MobileButton } from "./mobile-page";
import { Sheet } from "./sheet";

/*
 * Sana va vaqt tanlash oynalari — veb `shared/ui/mobile-pickers.tsx`
 * (`MobileDateSheet`, `MobileTimeSheet`): pastki oynada oy kalendari yoki
 * soat/daqiqa ustunlari, tayyor vaqtlar va (berilsa) davomiylik.
 */

const TIME_PRESETS = ["09:00", "14:00", "18:00", "19:30"];

const pad = (value: number) => String(value).padStart(2, "0");
const toDateValue = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

function parseDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null;
}

function parseTime(value: string): [number, number] {
  const match = /^(\d{1,2}):(\d{2})/.exec(value);
  return match ? [Number(match[1]) % 24, Number(match[2]) % 60] : [18, 0];
}

export interface MobileDateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  min?: string;
  onChange: (value: string) => void;
}

export function MobileDateSheet({ open, onOpenChange, value, min, onChange }: MobileDateSheetProps) {
  const { t } = useTranslation("common");
  const ds = useDs();
  const months = t("formPickers.months", { returnObjects: true }) as string[];
  const weekdays = t("formPickers.weekdays", { returnObjects: true }) as string[];
  const [draft, setDraft] = useState(value);
  const [view, setView] = useState(() => parseDate(value) ?? new Date());
  const [shown, setShown] = useState(open);
  const today = toDateValue(new Date());

  if (open !== shown) {
    setShown(open);
    if (open) {
      setDraft(value);
      setView(parseDate(value) ?? new Date());
    }
  }

  const cells = useMemo(() => {
    const first = new Date(view.getFullYear(), view.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7;
    const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    return Array.from({ length: Math.ceil((offset + days) / 7) * 7 }, (_, index) => {
      const day = index - offset + 1;
      return day >= 1 && day <= days ? new Date(view.getFullYear(), view.getMonth(), day) : null;
    });
  }, [view]);

  function shiftMonth(amount: number) {
    setView((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  }

  return (
    <Sheet
      variant="app"
      compact
      open={open}
      onClose={() => onOpenChange(false)}
      title={t("formPickers.chooseDateTitle")}
      footer={
        <>
          <MobileButton variant="secondary" label={t("formPickers.clear")} onPress={() => setDraft("")} />
          <MobileButton
            label={t("formPickers.choose")}
            disabled={!draft}
            onPress={() => {
              onChange(draft);
              onOpenChange(false);
            }}
          />
        </>
      }
    >
      <View style={styles.calendar}>
        <View style={styles.monthRow}>
          <Pressable accessibilityRole="button" accessibilityLabel={t("formPickers.prevMonth")} onPress={() => shiftMonth(-1)} style={styles.monthButton}>
            <Icon name="chevron-left" size={20} color={ds.c.ink} />
          </Pressable>
          <DsText v="title" style={styles.monthTitle}>
            {months[view.getMonth()]} {view.getFullYear()}
          </DsText>
          <Pressable accessibilityRole="button" accessibilityLabel={t("formPickers.nextMonth")} onPress={() => shiftMonth(1)} style={styles.monthButton}>
            <Icon name="chevron-right" size={20} color={ds.c.ink} />
          </Pressable>
        </View>

        <View style={styles.weekdays}>
          {weekdays.map((day) => (
            <DsText key={day} v="caption" c="ink-secondary" style={styles.weekday}>
              {day}
            </DsText>
          ))}
        </View>

        {/* Haftalar alohida qatorda — foizli kenglik `flexWrap` da yaxlitlanib 6 tadan o'ralardi. */}
        <View>
          {Array.from({ length: cells.length / 7 }, (_, week) => (
            <View key={week} style={styles.gridRow}>
              {cells.slice(week * 7, week * 7 + 7).map((date, index) => {
                if (!date) return <View key={`empty-${week}-${index}`} style={styles.cell} />;
                const dateValue = toDateValue(date);
                const selected = dateValue === draft;
                const blocked = Boolean(min && dateValue < min);
                const weekend = date.getDay() === 0 || date.getDay() === 6;
                const color = selected ? "on-action" : dateValue <= today ? "brand-strong" : weekend ? "error-text" : "ink";
                return (
                  <Pressable
                    key={dateValue}
                    accessibilityRole="button"
                    accessibilityState={{ selected, disabled: blocked }}
                    accessibilityLabel={`${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`}
                    disabled={blocked}
                    onPress={() => setDraft(dateValue)}
                    style={styles.cell}
                  >
                    <View style={[styles.day, selected && { backgroundColor: ds.c.brand }]}>
                      <DsText v="body-sm" w={selected ? "600" : dateValue === today ? "700" : "500"} c={color}>
                        {date.getDate()}
                      </DsText>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </Sheet>
  );
}

export interface MobileTimeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onChange: (value: string) => void;
  duration?: {
    value: number;
    options: readonly number[];
    onChange: (value: number) => void;
  };
}

export function MobileTimeSheet({ open, onOpenChange, value, onChange, duration }: MobileTimeSheetProps) {
  const { t } = useTranslation("common");
  const ds = useDs();
  const [draft, setDraft] = useState(() => parseTime(value));
  const [length, setLength] = useState(duration?.value ?? 0);
  const [active, setActive] = useState<"hour" | "minute">("hour");
  const [shown, setShown] = useState(open);
  const [hour, minute] = draft;

  if (open !== shown) {
    setShown(open);
    if (open) {
      setDraft(parseTime(value));
      setLength(duration?.value ?? 0);
      setActive("hour");
    }
  }
  const time = `${pad(hour)}:${pad(minute)}`;

  function shift(part: "hour" | "minute", amount: number) {
    setActive(part);
    setDraft(([h, m]) => {
      if (part === "hour") return [(h + amount + 24) % 24, m];
      const total = (h * 60 + m + amount + 24 * 60) % (24 * 60);
      return [Math.floor(total / 60), total % 60];
    });
  }

  const column = (part: "hour" | "minute", label: string) => (
    <View style={styles.column}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t(part === "hour" ? "formPickers.increaseHourAria" : "formPickers.increaseMinuteAria")}
        onPress={() => shift(part, part === "hour" ? 1 : 5)}
        style={styles.arrow}
      >
        <ChevronUp size={24} strokeWidth={1.75} color={ds.c.ink} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => setActive(part)}
        style={[
          styles.digits,
          active === part ? { borderColor: ds.c.brand, backgroundColor: ds.c["brand-subtle"] } : { borderColor: "transparent", backgroundColor: ds.c.subtle },
        ]}
      >
        <DsText style={[styles.digitText, { color: ds.c.ink }]}>{pad(part === "hour" ? hour : minute)}</DsText>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t(part === "hour" ? "formPickers.decreaseHourAria" : "formPickers.decreaseMinuteAria")}
        onPress={() => shift(part, part === "hour" ? -1 : -5)}
        style={[styles.arrow, styles.arrowDown]}
      >
        <ChevronDown size={24} strokeWidth={1.75} color={ds.c.ink} />
      </Pressable>
    </View>
  );

  const chip = (selected: boolean, height: number) => [
    styles.chip,
    { height, backgroundColor: selected ? ds.c.brand : ds.c.subtle },
  ];

  return (
    <Sheet
      variant="app"
      compact
      open={open}
      onClose={() => onOpenChange(false)}
      title={t("formPickers.chooseTimeTitle")}
      footer={
        <>
          <MobileButton variant="secondary" label={t("formPickers.cancel")} onPress={() => onOpenChange(false)} />
          <MobileButton
            label={t("formPickers.choose")}
            onPress={() => {
              onChange(time);
              if (duration && length) duration.onChange(length);
              onOpenChange(false);
            }}
          />
        </>
      }
    >
      <View style={styles.time}>
        <View accessibilityLabel={t("formPickers.adjustTimeAria")} style={styles.columns}>
          {column("hour", t("formPickers.hourLabel"))}
          <DsText style={[styles.digitText, { color: ds.c.ink }]}>:</DsText>
          {column("minute", t("formPickers.minuteLabel"))}
        </View>

        <DsText v="caption-strong" c="ink-secondary" style={styles.section}>
          {t("formPickers.presetSection")}
        </DsText>
        <View accessibilityLabel={t("formPickers.presetTimesAria")} style={styles.chips}>
          {TIME_PRESETS.map((preset) => (
            <Pressable key={preset} accessibilityRole="button" onPress={() => setDraft(parseTime(preset))} style={chip(time === preset, 27)}>
              <DsText v="caption" c={time === preset ? "on-action" : "ink"}>
                {preset}
              </DsText>
            </Pressable>
          ))}
        </View>

        {duration ? (
          <>
            <DsText v="caption-strong" c="ink-secondary" style={[styles.section, styles.sectionTight]}>
              {t("formPickers.durationSection")}
            </DsText>
            <View accessibilityLabel={t("formPickers.presetDurationsAria")} style={styles.chips}>
              {duration.options.map((option) => (
                <Pressable key={option} accessibilityRole="button" onPress={() => setLength(option)} style={chip(length === option, 22)}>
                  <DsText v="caption" c={length === option ? "on-action" : "ink"}>
                    {option} {t("formPickers.minuteShort")}
                  </DsText>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  /* `-mx-1 -mt-0.5` */
  calendar: { marginHorizontal: -4, marginTop: -2 },
  monthRow: { height: 40, flexDirection: "row", alignItems: "center" },
  monthButton: { flex: 1, height: 40, alignItems: "center", justifyContent: "center" },
  monthTitle: { flex: 5, textAlign: "center" },
  weekdays: { marginTop: 12, flexDirection: "row" },
  weekday: { flex: 1, textAlign: "center", lineHeight: 18 },
  gridRow: { flexDirection: "row" },
  cell: { flex: 1, height: 46, alignItems: "center", justifyContent: "center" },
  day: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  time: { marginTop: 4 },
  columns: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 14 },
  column: { alignItems: "center" },
  arrow: { height: 28, width: 96, alignItems: "center", justifyContent: "center" },
  arrowDown: { marginTop: 14 },
  digits: { marginTop: 16, height: 74, width: 96, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderRadius: dsRadius.lg },
  digitText: { fontFamily: headingFont("700"), fontSize: 40, lineHeight: 48 },
  section: { marginTop: 23, textTransform: "uppercase" },
  sectionTight: { marginTop: 14 },
  chips: { marginTop: 14, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { justifyContent: "center", paddingHorizontal: 9, borderRadius: 14 },
});
