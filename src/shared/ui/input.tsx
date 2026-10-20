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

  /*
   * Veb `form-skin.css`: tinch holatda kulrang fon va SHAFFOF chegara,
   * fokusda oq fon va ko'k (`--border-focus`) chegara.
   */
  const borderColor = error ? palette.destructive : focused ? palette.primary : "transparent";
  const multiline = Boolean(rest.multiline);

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
          multiline && styles.shellMultiline,
          {
            backgroundColor: focused ? palette.surface : palette["surface-subtle"],
            borderColor,
          },
        ]}
      >
        {icon ? <View style={styles.icon}>{icon}</View> : null}
        <TextInput
          ref={ref}
          style={[
            styles.input,
            multiline && styles.inputMultiline,
            { color: palette.foreground },
            inputStyle,
          ]}
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
  /* `.field-group > span` — 14/21, 500 */
  label: { lineHeight: 21, fontWeight: "500" },
  /* `.input-shell` — 52 balandlik, radius 13 (390px DOM'dan), bo'shliq 0 16 */
  shell: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 16,
    gap: 10,
  },
  /* `.field-group textarea` — bo'shliq 14/16, ikki qator = 78 */
  shellMultiline: { alignItems: "flex-start", minHeight: 78 },
  icon: { alignItems: "center", justifyContent: "center" },
  input: { flex: 1, fontSize: 16, paddingVertical: 12 },
  inputMultiline: { lineHeight: 24, paddingVertical: 14, textAlignVertical: "top" },
  reveal: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
