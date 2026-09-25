import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole, UserRound } from "lucide-react-native";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { applyApiFieldErrors, type AppError } from "@/shared/api";
import { loginSchema, resolveHomeRoute, useAuth } from "@/modules/auth";
import { ROUTES } from "@/shared/config";
import type { LoginCredentials } from "@/shared/types";
import { Button, Checkbox, Input, Logo, Screen, Text, useTheme } from "@/shared/ui";

/**
 * Veb `src/modules/auth/ui/login-form.tsx` + `src/pages/auth/login-page.tsx`
 * ning mobil varianti.
 *
 * QAYTA YOZILGAN, lekin XULQI bir xil: o'sha `loginSchema`, o'sha
 * `applyApiFieldErrors` (backend `username` maydonini formadagi `login` ga
 * bog'laydi), o'sha `resolveHomeRoute`. Faqat ko'rinish RN.
 */
export function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { palette } = useTheme();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: { login: "", password: "", remember: true },
  });

  async function submit(values: LoginCredentials) {
    try {
      const user = await login(values);
      router.replace(resolveHomeRoute(user));
    } catch (error) {
      const appError = error as AppError;
      // Backend maydon xatolari formaga tushadi; qolgani umumiy xato bo'ladi.
      if (!applyApiFieldErrors(appError, setError, { username: "login" })) {
        setError("root", { type: "server", message: appError.message });
      }
    }
  }

  return (
    <Screen scroll avoidKeyboard>
      <View style={styles.header}>
        <Logo size={64} variant="tile" />
        <Text variant="title">YolUp</Text>
        <Text tone="muted">Onlayn ta'lim platformasi</Text>
      </View>

      <View style={styles.form}>
        <Controller
          control={control}
          name="login"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Login"
              placeholder="Loginingizni kiriting"
              icon={<UserRound size={18} color={palette["muted-foreground"]} />}
              textContentType="username"
              autoComplete="username"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.login?.message}
              returnKeyType="next"
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Parol"
              placeholder="Parolingizni kiriting"
              icon={<LockKeyhole size={18} color={palette["muted-foreground"]} />}
              secure
              textContentType="password"
              autoComplete="current-password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
              returnKeyType="go"
              onSubmitEditing={handleSubmit(submit)}
            />
          )}
        />

        <Controller
          control={control}
          name="remember"
          render={({ field: { onChange, value } }) => (
            <Checkbox
              checked={value !== false}
              onChange={onChange}
              label="Meni eslab qolish"
            />
          )}
        />

        {errors.root ? (
          <View
            accessibilityRole="alert"
            style={[
              styles.alert,
              {
                backgroundColor: palette["destructive-soft"],
                borderColor: palette["destructive-soft-border"],
              },
            ]}
          >
            <Text tone="danger">{errors.root.message}</Text>
          </View>
        ) : null}

        <Button title="Kirish" size="lg" loading={isSubmitting} onPress={handleSubmit(submit)} />

        <Text
          accessibilityRole="button"
          onPress={() => router.push(ROUTES.auth.register)}
          variant="caption"
          tone="brand"
          style={styles.link}
        >
          Hisobingiz yo'qmi? Ro'yxatdan o'tish
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 10, paddingTop: 40, paddingBottom: 28 },
  form: { gap: 18 },
  alert: { padding: 12, borderRadius: 13, borderWidth: StyleSheet.hairlineWidth },
  link: { textAlign: "center", paddingVertical: 12 },
});
