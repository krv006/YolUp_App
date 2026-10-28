import { forwardRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, ChevronDown, Eye, EyeOff, HelpCircle } from "lucide-react-native";
import { bodyFont, DsGradient, DsText, dsRadius, dsType, toast, useDs } from "@/shared/ui";
import { UZ_PHONE_LENGTH, formatUzPhone } from "../lib/uz-phone";

export type AuthScreenLayout = "top" | "spaced" | "center";

export interface AuthScreenProps {
  onBack?: () => void;
  title?: ReactNode;
  description?: ReactNode;
  notice?: ReactNode;
  hero?: ReactNode;
  layout?: AuthScreenLayout;
  children?: ReactNode;
  action: ReactNode;
  footer?: ReactNode;
}

/** Sarlavha ustidagi bo'shliq — `h-9` / `h-47` / `h-43`. */
const TOP_SPACE: Record<AuthScreenLayout, number> = { top: 36, spaced: 188, center: 172 };

/**
 * Kirish ekranlari qobig'i — veb `modules/auth/ui/auth-screen.tsx` ning
 * tor ekran varianti (M1–M4): auth gradienti, tepada orqaga tugmasi,
 * sarlavha (`top` / `spaced` / `center` joylashuvlari), maydonlar va
 * pastda asosiy tugma bilan izoh.
 */
export function AuthScreen({
  onBack,
  title,
  description,
  notice,
  hero,
  layout = "top",
  children,
  action,
  footer,
}: AuthScreenProps) {
  const { t } = useTranslation("auth");
  const ds = useDs();
  const insets = useSafeAreaInsets();

  return (
    /*
     * `KeyboardAwareScrollView` — brauzerdagidek fokusdagi maydon klaviatura
     * ustiga suriladi (oddiy ScrollView buni qilmaydi va parol maydoni
     * klaviatura ostida qolardi). Gradient kontent bilan birga suriladi.
     */
    <KeyboardAwareScrollView
      style={[styles.fill, { backgroundColor: ds.c.canvas }]}
      contentContainerStyle={[styles.page, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 80 }]}
      keyboardShouldPersistTaps="handled"
      bottomOffset={24}
    >
      <DsGradient name="auth" />
        <View style={styles.top}>
          {onBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("mobile.back")}
              onPress={onBack}
              style={({ pressed }) => [styles.back, pressed && { backgroundColor: ds.c.subtle }]}
            >
              <ArrowLeft size={20} color={ds.c.ink} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.body}>
          {notice ? <View style={styles.notice}>{notice}</View> : null}

          <View style={{ height: TOP_SPACE[layout], minHeight: 24 }} />

          {layout === "center" ? (
            <View style={styles.centerHead}>
              {hero}
              {title ? (
                <DsText heading w="500" style={styles.centerTitle}>
                  {title}
                </DsText>
              ) : null}
              {description ? (
                <DsText c="ink-secondary" style={styles.centerDescription}>
                  {description}
                </DsText>
              ) : null}
            </View>
          ) : title ? (
            <View style={styles.head}>
              <DsText v="display" heading w="500" style={styles.title}>
                {title}
              </DsText>
              {description ? <DsText c="ink-secondary">{description}</DsText> : null}
            </View>
          ) : null}

          {children ? <View style={layout === "spaced" ? styles.childrenSpaced : styles.children}>{children}</View> : null}

          <View style={styles.grow} />

          <View style={styles.bottom}>
            {action}
            {footer ? (
              <DsText v="body-sm" style={styles.footer}>
                {footer}
              </DsText>
            ) : (
              <View style={{ height: layout === "center" ? 12 : 20 }} />
            )}
          </View>
        </View>
    </KeyboardAwareScrollView>
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

/**
 * `h-14.5 rounded-2xl text-title` — asosiy (`bg-action`) yoki chegarali oq.
 * Telefonda yuklanish aylanasi yo'q (vebda `hidden lg:block`) — faqat matn
 * almashadi.
 */
export function AuthButton({ variant = "primary", loading = false, loadingLabel, disabled = false, onPress, children }: AuthButtonProps) {
  const ds = useDs();
  const primary = variant === "primary";
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      // Android shaffoflikni bolalarga alohida qo'llaydi — vebdagidek bitta qatlam bo'lib xiralashsin.
      needsOffscreenAlphaCompositing={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        primary
          ? { backgroundColor: pressed ? ds.c["action-pressed"] : ds.c.action }
          : { borderWidth: 1, borderColor: ds.c["line-strong"], backgroundColor: pressed ? ds.c.subtle : ds.c.surface },
        inactive && { opacity: loading ? 0.8 : 0.45 },
      ]}
    >
      <DsText v="title" c={primary ? "on-action" : "ink"}>
        {loading && loadingLabel ? loadingLabel : children}
      </DsText>
    </Pressable>
  );
}

export interface AuthFieldProps extends Omit<TextInputProps, "style"> {
  invalid?: boolean;
  /** `full` — matn ham qizil; `border` — faqat chegara. */
  invalidStyle?: "full" | "border";
  leading?: ReactNode;
  trailing?: ReactNode;
  label?: ReactNode;
}

/**
 * `h-14 rounded-2xl bg-subtle px-5`; fokusda `border-focus`, xatoda
 * `border-error-text`. Kiritilgan matn `text-body font-medium`, placeholder
 * esa `text-body-sm` — RN placeholder shriftini alohida bermaydi, shuning
 * uchun maydon bo'sh turganda o'lcham va qalinlik placeholder'nikiga o'tadi.
 */
export const AuthField = forwardRef<TextInput, AuthFieldProps>(function AuthField(
  { invalid = false, invalidStyle = "full", leading, trailing, label, onFocus, onBlur, value, ...props },
  ref
) {
  const ds = useDs();
  const [focused, setFocused] = useState(false);
  const redText = invalid && invalidStyle === "full";
  const empty = !value;
  const text = empty ? dsType["body-sm"] : dsType.body;

  const box = (
    <View
      style={[
        styles.field,
        { backgroundColor: ds.c.subtle, borderColor: invalid ? ds.c["error-text"] : focused ? ds.c.focus : "transparent" },
      ]}
    >
      {leading}
      <TextInput
        ref={ref}
        value={value}
        placeholderTextColor={redText ? ds.c["error-text"] : ds.c["ink-secondary"]}
        selectionColor={ds.c.brand}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={[
          styles.input,
          {
            fontSize: text.fontSize,
            fontFamily: bodyFont(empty ? "400" : "500"),
            color: redText ? ds.c["error-text"] : ds.c.ink,
          },
        ]}
        {...props}
      />
      {trailing}
    </View>
  );

  if (!label) return box;

  return (
    <View style={styles.labelled}>
      <DsText v="body-sm">{label}</DsText>
      {box}
    </View>
  );
});

export interface AuthPasswordFieldProps extends AuthFieldProps {
  visible: boolean;
  onToggle: () => void;
}

export const AuthPasswordField = forwardRef<TextInput, AuthPasswordFieldProps>(function AuthPasswordField(
  { visible, onToggle, invalid, invalidStyle = "full", ...props },
  ref
) {
  const { t } = useTranslation("auth");
  const ds = useDs();
  const color = invalid && invalidStyle === "full" ? ds.c["error-text"] : ds.c["ink-secondary"];
  return (
    <AuthField
      ref={ref}
      secureTextEntry={!visible}
      autoCapitalize="none"
      autoCorrect={false}
      invalid={invalid}
      invalidStyle={invalidStyle}
      trailing={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={visible ? t("form.hidePassword") : t("form.showPassword")}
          onPress={onToggle}
          style={styles.eye}
        >
          {visible ? <EyeOff size={20} color={color} /> : <Eye size={20} color={color} />}
        </Pressable>
      }
      {...props}
    />
  );
});

export interface AuthPhoneFieldProps extends AuthFieldProps {
  hint?: string;
}

/** Ro'yxatdan o'tishdagi telefon maydoni: chapda "UZ ⌄", o'ngda yordam belgisi. */
export const AuthPhoneField = forwardRef<TextInput, AuthPhoneFieldProps>(function AuthPhoneField({ hint, ...props }, ref) {
  const ds = useDs();
  return (
    <AuthField
      ref={ref}
      keyboardType="phone-pad"
      autoComplete="tel"
      textContentType="telephoneNumber"
      leading={
        <View style={styles.country}>
          <DsText v="title">UZ</DsText>
          <ChevronDown size={16} color={ds.c["ink-secondary"]} />
        </View>
      }
      trailing={
        hint ? (
          <Pressable accessibilityRole="button" accessibilityLabel={hint} onPress={() => toast.info(hint)} style={styles.eye}>
            <HelpCircle size={18} color={ds.c["ink-tertiary"]} />
          </Pressable>
        ) : undefined
      }
      {...props}
    />
  );
});

export interface AuthPhoneInputProps {
  label?: ReactNode;
  hint?: ReactNode;
  /** Faqat milliy qism raqamlari (9 ta), `+998` siz. */
  value: string;
  invalid?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  onChange: (digits: string) => void;
}

/**
 * Parolni tiklashdagi telefon (M4.1): `+998 |` prefiksi qotirilgan, raqam
 * `90 123 45 67` ko'rinishida guruhlanadi, faqat 9 ta raqam qabul qilinadi.
 */
export function AuthPhoneInput({ label, hint, value, invalid = false, placeholder, autoFocus, onChange }: AuthPhoneInputProps) {
  const ds = useDs();
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.labelled}>
      {label ? <DsText v="body-sm">{label}</DsText> : null}
      <View
        style={[
          styles.field,
          styles.phone,
          { backgroundColor: ds.c.subtle, borderColor: invalid ? ds.c["error-text"] : focused ? ds.c.focus : "transparent" },
        ]}
      >
        <DsText v="title">+998</DsText>
        <View style={[styles.divider, { backgroundColor: ds.c["line-subtle"] }]} />
        <TextInput
          keyboardType="number-pad"
          autoComplete="tel-national"
          textContentType="telephoneNumber"
          autoFocus={autoFocus}
          placeholder={placeholder}
          placeholderTextColor={ds.c["ink-secondary"]}
          selectionColor={ds.c.brand}
          value={formatUzPhone(value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChangeText={(text) => onChange(text.replace(/\D/g, "").slice(0, UZ_PHONE_LENGTH))}
          style={[
            styles.input,
            {
              fontSize: dsType.title.fontSize,
              fontFamily: bodyFont(value ? "600" : "400"),
              color: invalid ? ds.c["error-text"] : ds.c.ink,
            },
          ]}
        />
      </View>
      {hint ? (
        <DsText v="caption" c="ink-secondary" style={styles.hint}>
          {hint}
        </DsText>
      ) : null}
    </View>
  );
}

export function AuthFieldError({ children }: { children: ReactNode }) {
  return (
    <DsText v="caption" c="error-text" accessibilityRole="alert">
      {children}
    </DsText>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  /* `px-4 pt-2 pb-20` */
  page: { flexGrow: 1, paddingHorizontal: 16 },
  /* `h-10` */
  top: { height: 40, flexDirection: "row", alignItems: "center" },
  /* `-ml-2 size-10 rounded-full` */
  back: { marginLeft: -8, width: 40, height: 40, borderRadius: dsRadius.full, alignItems: "center", justifyContent: "center" },
  /* `mx-auto max-w-[420px] flex-1` */
  body: { flex: 1, width: "100%", maxWidth: 420, alignSelf: "center" },
  notice: { marginTop: 12 },
  /* `flex-col gap-3`; sarlavha `max-w-85 font-heading text-display font-medium` */
  head: { gap: 12 },
  title: { maxWidth: 340 },
  /* `items-center gap-3 text-center`; sarlavha `text-[22px]/7` */
  centerHead: { alignItems: "center", gap: 12 },
  centerTitle: { fontSize: 22, lineHeight: 28, textAlign: "center" },
  centerDescription: { paddingHorizontal: 16, textAlign: "center" },
  /* `mt-7.5` / `mt-3` */
  children: { marginTop: 30 },
  childrenSpaced: { marginTop: 12 },
  /* `min-h-8 flex-1` */
  grow: { flex: 1, minHeight: 32 },
  /* `items-center gap-4` */
  bottom: { alignItems: "center", gap: 16 },
  footer: { textAlign: "center" },
  /* `h-14.5 w-full rounded-2xl gap-2` */
  button: { alignSelf: "stretch", height: 58, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: dsRadius["2xl"] },
  /* `flex-col gap-1` — yorliq va maydon */
  labelled: { alignSelf: "stretch", gap: 4 },
  /* `h-14 rounded-2xl border px-5 gap-2` */
  field: { height: 56, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, borderWidth: 1, borderRadius: dsRadius["2xl"] },
  phone: { gap: 0 },
  input: { flex: 1, minWidth: 0, height: "100%", paddingVertical: 0 },
  /* `-mr-2 size-8 rounded-full` */
  eye: { marginRight: -8, width: 32, height: 32, borderRadius: dsRadius.full, alignItems: "center", justifyContent: "center" },
  /* `gap-1 pr-2` */
  country: { flexDirection: "row", alignItems: "center", gap: 4, paddingRight: 8 },
  /* `mx-3 h-6 w-px` */
  divider: { width: 1, height: 24, marginHorizontal: 12 },
  /* `pt-2.5` */
  hint: { paddingTop: 10 },
});
