import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { Check } from "lucide-react-native";
import { createRegisterSchema, resolveHomeRoute, useAuth, useRegisterMutation, type RegisterFormValues } from "@/modules/auth";
import {
  AuthButton,
  AuthField,
  AuthFieldError,
  AuthPasswordField,
  AuthPhoneField,
  AuthScreen,
} from "@/modules/auth/ui/auth-screen";
import { applyApiFieldErrors, type AppError } from "@/shared/api";
import { ROUTES } from "@/shared/config";
import type { AuthUser } from "@/shared/types";
import { radius, Text, toast, useTheme } from "@/shared/ui";

const ROLES = ["teacher", "parent", "student"] as const;

/**
 * Ro'yxatdan o'tish — veb `modules/auth/ui/mobile-register-form.tsx`:
 * rol tanlagichi, ism/familiya, login, telefon, parol va tasdiq.
 * Muvaffaqiyatdan keyin vebdagi "tayyor" ekrani, "Boshlash" bosh sahifaga
 * olib boradi. Vebda kirgan foydalanuvchi darhol yo'naltirilgani uchun
 * bu ekran ko'rinmaydi (xato) — mobilda u haqiqatan ko'rsatiladi.
 */
export function RegisterPage() {
  const { t } = useTranslation("auth");
  const { palette } = useTheme();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const register = useRegisterMutation();
  const schema = useMemo(() => createRegisterSchema(t), [t]);
  const [createdUser, setCreatedUser] = useState<AuthUser | null>(null);
  const [confirm, setConfirm] = useState("");
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    control,
    handleSubmit,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", password: "", firstName: "", lastName: "", phone: "", role: "teacher" },
  });

  // Allaqachon kirgan foydalanuvchi (ro'yxatdan o'tish jarayonidan tashqari) bosh sahifaga.
  if (isAuthenticated && !createdUser && !isSubmitting) return <Redirect href={ROUTES.root} />;

  async function submit(values: RegisterFormValues) {
    if (values.password !== confirm) {
      setConfirmError(t("mobile.register.mismatch"));
      return;
    }
    setConfirmError(null);
    try {
      setCreatedUser(await register.mutateAsync(values));
      toast.success(t("register.accountCreated"));
    } catch (error) {
      const appError = error as AppError;
      if (!applyApiFieldErrors(appError, setError, { first_name: "firstName", last_name: "lastName" })) {
        setError("root", { message: appError.message });
      }
    }
  }

  if (createdUser)
    return (
      <AuthScreen
        onBack={() => router.replace(ROUTES.auth.login)}
        action={
          <AuthButton onPress={() => router.replace(resolveHomeRoute(createdUser))}>
            {t("mobile.register.start")}
          </AuthButton>
        }
      >
        <View style={styles.done}>
          <View style={[styles.doneIcon, { backgroundColor: palette["success-soft"] }]}>
            <Check size={34} strokeWidth={3} color={palette["success-strong"]} />
          </View>
          <Text variant="title" style={styles.centerText}>
            {t("mobile.register.doneTitle")}
          </Text>
          <Text variant="body" style={[styles.centerText, styles.doneText, { color: palette["muted-foreground"] }]}>
            {t("mobile.register.doneDescription")}
          </Text>
        </View>
      </AuthScreen>
    );

  return (
    <AuthScreen
      onBack={() => (router.canGoBack() ? router.back() : router.replace(ROUTES.root))}
      title={t("mobile.register.title")}
      description={t("register.subtitle")}
      action={
        <AuthButton loading={isSubmitting} loadingLabel={t("mobile.register.submitting")} onPress={handleSubmit(submit)}>
          {t("mobile.login.registerLink")}
        </AuthButton>
      }
      footer={
        <>
          {t("mobile.register.haveAccount")}{" "}
          <Text variant="label" style={{ color: palette.primary }} onPress={() => router.replace(ROUTES.auth.login)}>
            {t("form.submit")}
          </Text>
        </>
      }
    >
      <View style={styles.form}>
        <Controller
          control={control}
          name="role"
          render={({ field }) => (
            <View accessibilityRole="radiogroup" accessibilityLabel={t("register.roleLabel")} style={[styles.roles, { backgroundColor: palette["surface-subtle"] }]}>
              {ROLES.map((role) => {
                const active = field.value === role;
                return (
                  <Pressable
                    key={role}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: active }}
                    onPress={() => field.onChange(role)}
                    style={[styles.role, active && [styles.roleActive, { backgroundColor: palette.surface }]]}
                  >
                    <Text variant="label" style={{ color: active ? palette.foreground : palette["muted-foreground"] }}>
                      {t(`register.role.${role}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        />

        <View style={styles.pair}>
          <Controller
            control={control}
            name="firstName"
            render={({ field: { onChange, onBlur, value } }) => (
              <AuthField
                containerStyle={styles.grow}
                autoComplete="given-name"
                placeholder={t("register.form.firstName")}
                accessibilityLabel={t("register.form.firstName")}
                invalid={Boolean(errors.firstName)}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
              />
            )}
          />
          <Controller
            control={control}
            name="lastName"
            render={({ field: { onChange, onBlur, value } }) => (
              <AuthField
                containerStyle={styles.grow}
                autoComplete="family-name"
                placeholder={t("register.form.lastName")}
                accessibilityLabel={t("register.form.lastName")}
                invalid={Boolean(errors.lastName)}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
              />
            )}
          />
        </View>
        {errors.firstName || errors.lastName ? <AuthFieldError>{errors.firstName?.message ?? errors.lastName?.message}</AuthFieldError> : null}

        <Controller
          control={control}
          name="username"
          render={({ field: { onChange, onBlur, value } }) => (
            <AuthField
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={t("register.form.username")}
              accessibilityLabel={t("register.form.username")}
              invalid={Boolean(errors.username)}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
            />
          )}
        />
        {errors.username ? <AuthFieldError>{errors.username.message}</AuthFieldError> : null}

        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, onBlur, value } }) => (
            <AuthPhoneField
              placeholder={t("mobile.reset.phonePlaceholder")}
              accessibilityLabel={t("register.form.phone")}
              hint={t("mobile.reset.phoneHint")}
              value={value ?? ""}
              onChangeText={onChange}
              onBlur={onBlur}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <AuthPasswordField
              autoComplete="new-password"
              textContentType="newPassword"
              placeholder={t("register.form.password")}
              accessibilityLabel={t("register.form.password")}
              invalid={Boolean(errors.password) || Boolean(confirmError)}
              visible={showPassword}
              onToggle={() => setShowPassword((current) => !current)}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
            />
          )}
        />
        {errors.password ? <AuthFieldError>{errors.password.message}</AuthFieldError> : null}

        <AuthPasswordField
          autoComplete="new-password"
          textContentType="newPassword"
          placeholder={t("mobile.newPassword.confirmPlaceholder")}
          accessibilityLabel={t("mobile.newPassword.confirmPlaceholder")}
          value={confirm}
          invalid={Boolean(confirmError)}
          visible={showConfirm}
          onToggle={() => setShowConfirm((current) => !current)}
          onChangeText={(value) => {
            setConfirmError(null);
            setConfirm(value);
          }}
          onBlur={() => {
            if (confirm && getValues("password") !== confirm) setConfirmError(t("mobile.register.mismatch"));
          }}
        />
        {confirmError ? <AuthFieldError>{confirmError}</AuthFieldError> : null}
        {errors.root ? <AuthFieldError>{errors.root.message}</AuthFieldError> : null}
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1 },
  centerText: { textAlign: "center" },
  form: { gap: 12 },
  /* `rounded-full bg-subtle p-1 gap-1` */
  roles: { flexDirection: "row", gap: 4, padding: 4, borderRadius: radius.full },
  role: { flex: 1, height: 44, alignItems: "center", justifyContent: "center", borderRadius: radius.full },
  roleActive: {
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  pair: { flexDirection: "row", gap: 12 },
  done: { alignItems: "center", gap: 16 },
  doneIcon: { width: 80, height: 80, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  doneText: { maxWidth: 320 },
});
