import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TextInput, View } from "react-native";
import { radius, useTheme } from "@/shared/ui";

export interface OtpInputProps {
  length?: number;
  value: string;
  invalid?: boolean;
  onChange: (value: string) => void;
}

/**
 * Tasdiqlash kodi katakchalari — veb `modules/auth/ui/otp-input.tsx`:
 * har katakda bitta raqam, keyingisiga avtomatik o'tish, bo'sh katakda
 * "orqaga" oldingisiga qaytaradi, joylashtirilgan kod tarqatiladi.
 */
export function OtpInput({ length = 5, value, invalid = false, onChange }: OtpInputProps) {
  const { t } = useTranslation("auth");
  const { palette } = useTheme();
  const boxes = useRef<Array<TextInput | null>>([]);
  const [focused, setFocused] = useState<number | null>(null);
  const digits = Array.from({ length }, (_, index) => value[index] ?? "");

  function setDigits(index: number, raw: string) {
    const clean = raw.replace(/\D/g, "");
    if (clean.length > 1) {
      // Joylashtirish yoki SMS avtoto'ldirishi — butun kod.
      const pasted = clean.slice(0, length);
      onChange(pasted);
      boxes.current[Math.min(pasted.length, length - 1)]?.focus();
      return;
    }
    const next = digits.map((item, position) => (position === index ? clean : item)).join("");
    onChange(next);
    if (clean && index < length - 1) boxes.current[index + 1]?.focus();
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
          selectionColor={palette.primary}
          style={[
            styles.box,
            {
              borderColor: focused === index ? palette.primary : invalid ? palette["destructive-strong"] : palette.border,
              backgroundColor: palette["surface-subtle"],
              color: invalid ? palette["destructive-strong"] : palette.foreground,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  /* `gap-2.5` */
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  /* `h-16 rounded-2xl border bg-subtle font-heading text-h2` */
  box: {
    flex: 1,
    minWidth: 0,
    height: 64,
    borderWidth: 1,
    borderRadius: radius["2xl"],
    textAlign: "center",
    fontSize: 22,
    fontFamily: "Unbounded-Medium",
  },
});
