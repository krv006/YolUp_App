import { forwardRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, ChevronDown, Eye, EyeOff, HelpCircle } from "lucide-react-native";
import { radius, Text, toast, useTheme } from "@/shared/ui";

export interface AuthScreenProps {
  onBack?: () => void;
  title?: ReactNode;
  description?: ReactNode;
  notice?: ReactNode;
  children?: ReactNode;
  action: ReactNode;
  footer?: ReactNode;
}

/**
 * Kirish ekranlari qobig'i — veb `modules/auth/ui/auth-screen.tsx`:
 * tepada orqaga tugmasi, o'rtada sarlavha va maydonlar, pastda asosiy
 * tugma va izoh havolasi.
 */
export function AuthScreen({ onBack, title, description, notice, children, action, footer }: AuthScreenProps) {
  const { t } = useTranslation("auth");
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView style={[styles.fill, { backgroundColor: palette.background }]} behavior="padding">
      <ScrollView
        contentContainerStyle={[styles.page, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 28 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.top}>
          {onBack ? (
            <Pressable accessibilityRole="button" accessibilityLabel={t("mobile.back")} onPress={onBack} style={styles.back}>
              <ArrowLeft size={22} color={palette.foreground} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.body}>
          {notice ? <View style={styles.notice}>{notice}</View> : null}
          <View style={styles.center}>
            {title ? (
              <View style={styles.heading}>
                <Text variant="title">{title}</Text>
                {description ? (
                  <Text variant="body" style={{ color: palette["muted-foreground"] }}>
                    {description}
                  </Text>
                ) : null}
              </View>
            ) : null}
            {children}
          </View>
          <View style={styles.bottom}>
            {action}
            {footer ? (
              <Text variant="label" style={[styles.footer, { color: palette["muted-foreground"] }]}>
                {footer}
              </Text>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export interface AuthButtonProps {
  variant?: "primary" | "secondary";
  loading?: boolean;
  loadingLabel?: string;
  disabled?: boolean;
  onPress?: () => void;
  children: ReactNode;
}

/** `h-14 rounded-full text-title` — asosiy (ko'k) yoki chegarali oq. */
export function AuthButton({ variant = "primary", loading = false, loadingLabel, disabled = false, onPress, children }: AuthButtonProps) {
  const { palette } = useTheme();
  const primary = variant === "primary";
  const color = primary ? palette["primary-foreground"] : palette.foreground;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      // Android shaffoflikni bolalarga alohida qo'llaydi — vebdagidek bitta qatlam bo'lib xiralashsin.
      needsOffscreenAlphaCompositing={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        primary
          ? { backgroundColor: pressed ? palette["primary-hover"] : palette.primary }
          : { borderWidth: 1, borderColor: palette.border, backgroundColor: pressed ? palette["surface-subtle"] : palette.surface },
        (disabled || loading) && styles.dim,
      ]}
    >
      {loading ? <ActivityIndicator size="small" color={color} /> : null}
      <Text variant="body" style={[styles.buttonText, { color }]}>
        {loading && loadingLabel ? loadingLabel : children}
      </Text>
    </Pressable>
  );
}

export interface AuthFieldProps extends Omit<TextInputProps, "style"> {
  invalid?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
  style?: TextInputProps["style"];
  containerStyle?: object;
}

/** `h-14 rounded-full bg-subtle px-5`; fokusda ko'k, xatoda qizil chegara. */
export const AuthField = forwardRef<TextInput, AuthFieldProps>(function AuthField(
  { invalid = false, leading, trailing, containerStyle, onFocus, onBlur, ...props },
  ref
) {
  const { palette } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View
      style={[
        styles.field,
        invalid
          ? { borderColor: palette["destructive-strong"], backgroundColor: palette.surface }
          : { borderColor: focused ? palette.primary : "transparent", backgroundColor: palette["surface-subtle"] },
        containerStyle,
      ]}
    >
      {leading}
      <TextInput
        ref={ref}
        placeholderTextColor={invalid ? palette["destructive-strong"] : palette["subtle-foreground"]}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={[styles.input, { color: invalid ? palette["destructive-strong"] : palette.foreground }]}
        {...props}
      />
      {trailing}
    </View>
  );
});

export interface AuthPasswordFieldProps extends AuthFieldProps {
  visible: boolean;
  onToggle: () => void;
}

export const AuthPasswordField = forwardRef<TextInput, AuthPasswordFieldProps>(function AuthPasswordField(
  { visible, onToggle, invalid, ...props },
  ref
) {
  const { t } = useTranslation("auth");
  const { palette } = useTheme();
  const color = invalid ? palette["destructive-strong"] : palette["subtle-foreground"];
  return (
    <AuthField
      ref={ref}
      secureTextEntry={!visible}
      autoCapitalize="none"
      autoCorrect={false}
      invalid={invalid}
      trailing={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={visible ? t("form.hidePassword") : t("form.showPassword")}
          onPress={onToggle}
          style={styles.eye}
        >
          {visible ? <EyeOff size={18} color={color} /> : <Eye size={18} color={color} />}
        </Pressable>
      }
      {...props}
    />
  );
});

export interface AuthPhoneFieldProps extends AuthFieldProps {
  hint?: string;
}

/** Telefon maydoni: chapda "UZ ⌄", o'ngda yordam belgisi (bosilsa izoh chiqadi). */
export const AuthPhoneField = forwardRef<TextInput, AuthPhoneFieldProps>(function AuthPhoneField({ hint, ...props }, ref) {
  const { palette } = useTheme();
  return (
    <AuthField
      ref={ref}
      keyboardType="phone-pad"
      autoComplete="tel"
      textContentType="telephoneNumber"
      leading={
        <View style={styles.country}>
          <Text variant="body" style={styles.countryText}>
            UZ
          </Text>
          <ChevronDown size={16} color={palette["muted-foreground"]} />
        </View>
      }
      trailing={
        hint ? (
          <Pressable accessibilityRole="button" accessibilityLabel={hint} onPress={() => toast.info(hint)} style={styles.eye}>
            <HelpCircle size={18} color={palette["subtle-foreground"]} />
          </Pressable>
        ) : undefined
      }
      {...props}
    />
  );
});

export function AuthFieldError({ children }: { children: ReactNode }) {
  const { palette } = useTheme();
  return (
    <Text variant="caption" accessibilityRole="alert" style={[styles.error, { color: palette["destructive-strong"] }]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  /* `px-5 pt-4 pb-7` */
  page: { flexGrow: 1, paddingHorizontal: 20 },
  top: { height: 40, flexDirection: "row", alignItems: "center" },
  back: { marginLeft: -8, width: 40, height: 40, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  body: { flex: 1, width: "100%", maxWidth: 420, alignSelf: "center" },
  notice: { marginTop: 12 },
  /* `flex-1 justify-center gap-5 py-6` */
  center: { flex: 1, justifyContent: "center", gap: 20, paddingVertical: 24 },
  heading: { gap: 8 },
  bottom: { alignItems: "center", gap: 16 },
  footer: { fontWeight: "400", textAlign: "center" },
  button: { alignSelf: "stretch", height: 56, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: radius.full },
  buttonText: { fontWeight: "600" },
  dim: { opacity: 0.6 },
  field: { height: 56, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, borderWidth: 1, borderRadius: radius.full },
  input: { flex: 1, minWidth: 0, height: "100%", fontSize: 16, fontFamily: "Onest-Regular" },
  eye: { width: 32, height: 32, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  country: { flexDirection: "row", alignItems: "center", gap: 4, paddingRight: 8 },
  countryText: { fontWeight: "600" },
  error: { paddingHorizontal: 8 },
});
