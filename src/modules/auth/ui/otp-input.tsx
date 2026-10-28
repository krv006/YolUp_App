import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TextInput, View } from "react-native";
import { dsType, headingFont, useDs } from "@/shared/ui";

export type OtpTone = "idle" | "verifying" | "invalid";

export interface OtpInputProps {
  length?: number;
  value: string;
  invalid?: boolean;
  /** `verifying` — kod tekshirilmoqda (yashil chegara), `invalid` — xato. */
  tone?: OtpTone;
  onChange: (value: string) => void;
}

/**
 * Tasdiqlash kodi katakchalari — veb `modules/auth/ui/otp-input.tsx` (M4.5–4.9):
 * `h-16 w-14.5 rounded-xl border-2`, raqam `font-heading text-h1`. Har
 * katakda bitta raqam, keyingisiga avtomatik o'tish, bo'sh katakda
 * "orqaga" oldingisiga qaytaradi, joylashtirilgan yoki SMS'dan
 * avtoto'ldirilgan kod tarqatiladi.
 */
export function OtpInput({ length = 5, value, invalid = false, tone, onChange }: OtpInputProps) {
  const { t } = useTranslation("auth");
  const ds = useDs();
  const boxes = useRef<Array<TextInput | null>>([]);
  const [focused, setFocused] = useState<number | null>(null);
  const digits = Array.from({ length }, (_, index) => value[index] ?? "");
  const resolved: OtpTone = tone ?? (invalid ? "invalid" : "idle");

  function setDigits(index: number, raw: string) {
    const clean = raw.replace(/\D/g, "");
    if (clean.length > 1) {
      // Katakda raqam bor edi va ustiga yana yozildi — yangisi KEYINGI katakdan boshlanadi.
      const kept = Boolean(digits[index]) && clean.startsWith(digits[index]!);
      const typed = kept ? clean.slice(1) : clean;
      const start = kept ? index + 1 : index;
      if (typed.length >= length) {
        // Joylashtirish yoki SMS avtoto'ldirishi — butun kod.
        onChange(typed.slice(0, length));
        boxes.current[length - 1]?.focus();
        return;
      }
      /*
       * Tez yozilganda raqam fokus keyingi katakka o'tib ulgurmasdan keladi
       * va shu katakka tushadi. Avval bu "joylashtirish" deb olinib, butun
       * kod almashib ketardi — endi ortiqchasi keyingi kataklarga tarqaladi.
       */
      const next = [...digits];
      [...typed].forEach((char, offset) => {
        if (start + offset < length) next[start + offset] = char;
      });
      onChange(next.join(""));
      boxes.current[Math.min(start + typed.length, length - 1)]?.focus();
      return;
    }
    const next = digits.map((item, position) => (position === index ? clean : item)).join("");
    onChange(next);
    if (clean && index < length - 1) boxes.current[index + 1]?.focus();
  }

  /* `TONE` — idle: fokusda `border-focus bg-surface`; verifying: `border-success`; invalid: `bg-danger-bg`. */
  function boxStyle(index: number) {
    if (resolved === "invalid") return { borderColor: ds.c["error-text"], backgroundColor: ds.c["danger-bg"], color: ds.c["error-text"] };
    if (resolved === "verifying") return { borderColor: ds.c.success, backgroundColor: ds.c.subtle, color: ds.c.ink };
    return focused === index
      ? { borderColor: ds.c.focus, backgroundColor: ds.c.surface, color: ds.c.ink }
      : { borderColor: "transparent", backgroundColor: ds.c.subtle, color: ds.c.ink };
  }

  return (
    <View style={styles.row}>
      {digits.map((digit, index) => (
        <TextInput
          key={index}
          ref={(node) => {
            boxes.current[index] = node;
          }}
          value={digit}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          accessibilityLabel={t("mobile.code.digitAria", { number: index + 1 })}
          onChangeText={(text) => setDigits(index, text)}
          onFocus={() => setFocused(index)}
          onBlur={() => setFocused((current) => (current === index ? null : current))}
          onKeyPress={(event) => {
            if (event.nativeEvent.key === "Backspace" && !digit && index > 0) boxes.current[index - 1]?.focus();
          }}
          selectionColor={ds.c.brand}
          style={[styles.box, boxStyle(index)]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  /* `gap-3` */
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12 },
  /* `h-16 w-14.5 min-w-0 shrink rounded-xl border-2 text-center font-heading text-h1` */
  box: {
    width: 58,
    flexShrink: 1,
    minWidth: 0,
    height: 64,
    borderWidth: 2,
    borderRadius: 20,
    textAlign: "center",
    paddingVertical: 0,
    fontSize: dsType.h1.fontSize,
    fontFamily: headingFont("600"),
  },
});
