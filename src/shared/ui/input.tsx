import { forwardRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import { fontSize, MIN_TOUCH_SIZE, radius } from "./tokens";
import { useTheme } from "./theme";
import { Text } from "./text";

export interface InputProps extends Omit<TextInputProps, "style"> {
  label?: string;
  error?: string;
  /** Chapdagi ikonka (lucide). */
  icon?: React.ReactNode;
  /** Parol maydoni — ko'rsatish/yashirish tugmasi qo'shiladi. */
  secure?: boolean;
  /**
   * Maydonning O'ZIGA beriladigan uslub: matn tekislash, balandlik, shrift.
   *
   * DIQQAT — KENGLIK BU YERGA BERILMAYDI. Ichki `TextInput` da `flex: 1`
   * turadi va u tashqi o'ramning kengligiga bo'ysunadi; bu yerga `width`
   * berilsa, o'ram baribir siqilib qoladi va qiymat kesiladi. Aynan shu
   * xato test qo'shish oynasidagi "ball" maydonini ko'rinmas qilgan edi.
   * Kenglik uchun `containerStyle` ishlatiladi.
   */
  inputStyle?: StyleProp<TextStyle>;
  /**
   * Tashqi o'ramga (yorliq + maydon + xato) beriladigan uslub — kenglik,
   * chekka bo'shliqlar. `flex` qatorlarida maydon o'lchamini SHU orqali
   * belgilang.
   */
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * Maydon + yorliq + xato — uchtasi birga, chunki ular har doim birga keladi
 * va alohida bo'lsa har ekranda qayta yig'ishga to'g'ri kelardi.
 *
 * Xato holati faqat rang bilan emas, MATN bilan ham beriladi — rang ko'rmaydigan
 * foydalanuvchi uchun ham, screen reader uchun ham.
 */
export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, icon, secure = false, inputStyle, containerStyle, ...rest },
  ref
) {
  const { palette } = useTheme();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const borderColor = error ? palette.destructive : focused ? palette.ring : palette.input;

  return (
    <View style={[styles.group, containerStyle]}>
      {label ? (
        <Text variant="label" style={styles.label}>
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.shell,
          { backgroundColor: palette.surface, borderColor, borderWidth: focused || error ? 1.5 : 1 },
        ]}
      >
        {icon ? <View style={styles.icon}>{icon}</View> : null}
        <TextInput
          ref={ref}
          style={[styles.input, { color: palette.foreground }, inputStyle]}
          placeholderTextColor={palette["muted-foreground"]}
          secureTextEntry={secure && !revealed}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={(event) => {
            setFocused(true);
            rest.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            rest.onBlur?.(event);
          }}
          accessibilityLabel={label}
          {...rest}
        />
        {secure ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? "Parolni yashirish" : "Parolni ko'rsatish"}
            hitSlop={8}
            onPress={() => setRevealed((value) => !value)}
            style={styles.reveal}
          >
            {revealed ? (
              <EyeOff size={18} color={palette["muted-foreground"]} />
            ) : (
              <Eye size={18} color={palette["muted-foreground"]} />
            )}
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text variant="caption" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  group: { gap: 6 },
  label: { marginLeft: 2 },
  shell: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: MIN_TOUCH_SIZE + 4,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    gap: 10,
  },
  icon: { alignItems: "center", justifyContent: "center" },
  input: { flex: 1, fontSize: fontSize.lg, paddingVertical: 12 },
  reveal: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
