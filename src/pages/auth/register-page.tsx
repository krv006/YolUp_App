import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole, Phone, UserRound } from "lucide-react-native";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { applyApiFieldErrors, type AppError } from "@/shared/api";
import { registerSchema, useAuth, useRegisterMutation } from "@/modules/auth";
import { ROUTES } from "@/shared/config";
import type { RegisterFormValues } from "@/modules/auth";
import { Button, Chip, ChipRow, Input, Logo, Screen, Text, toast, useTheme } from "@/shared/ui";

/** Veb `register-form.tsx` dagi tanlov bilan bir xil (o'quvchi ham mumkin). */
const ROLE_OPTIONS: { id: RegisterFormValues["role"]; label: string }[] = [
  { id: "teacher", label: "O'qituvchi" },
  { id: "parent", label: "Ota-ona" },
  { id: "student", label: "O'quvchi" },
];

/**
 * Ro'yxatdan o'tish — veb `register-form.tsx` + `register-page.tsx` porti.
 *
 * Ro'yxatdan o'tgach AVTOMATIK kiritiladi: mobilda foydalanuvchini yana
 * login ekraniga qaytarib, parolni qayta yozdirish ortiqcha ishqalanish.
 */
export function RegisterPage() {
  const router = useRouter();
  const { palette } = useTheme();
  const { login } = useAuth();
  const register = useRegisterMutation();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      firstName: "",
      lastName: "",
      phone: "",
      role: "student",
    },
  });

  async function submit(values: RegisterFormValues) {
    try {
      await register.mutateAsync(values);
      // Ro'yxatdan o'tish tokenlar qaytarmaydi — darhol kirib olamiz.
      await login({ login: values.username.trim(), password: values.password, remember: true });
      router.replace(ROUTES.root);
    } catch (error) {
      const appError = error as AppError;
      if (!applyApiFieldErrors(appError, setError, { first_name: "firstName", last_name: "lastName" })) {
        toast.error(appError.message);
      }
    }
  }

  return (
    <Screen scroll avoidKeyboard>
      <View style={styles.header}>
        <Logo size={48} variant="tile" />
        <Text variant="title">Ro'yxatdan o'tish</Text>
        <Text tone="muted">YolUp platformasida yangi hisob oching.</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.roleGroup}>
          <Text variant="label">Hisob turi</Text>
          <Controller
            control={control}
            name="role"
            render={({ field: { onChange, value } }) => (
              <View style={styles.roles}>
                <ChipRow>
                  {ROLE_OPTIONS.map((option) => (
                    <Chip
                      key={option.id}
                      label={option.label}
                      selected={value === option.id}
                      onPress={() => onChange(option.id)}
                    />
                  ))}
                </ChipRow>
              </View>
            )}
          />
        </View>

        <Field
          control={control}
          name="firstName"
          label="Ism"
          autoCapitalize="words"
          error={errors.firstName?.message}
        />
        <Field
          control={control}
          name="lastName"
          label="Familiya"
          autoCapitalize="words"
          error={errors.lastName?.message}
        />
        <Field
          control={control}
          name="username"
          label="Login"
          placeholder="Kamida 3 ta belgi"
          icon={<UserRound size={18} color={palette["muted-foreground"]} />}
          error={errors.username?.message}
        />
        <Field
          control={control}
          name="phone"
          label="Telefon (ixtiyoriy)"
          placeholder="+998 90 123 45 67"
          keyboardType="phone-pad"
          icon={<Phone size={18} color={palette["muted-foreground"]} />}
          error={errors.phone?.message}
        />
        <Field
          control={control}
          name="password"
          label="Parol"
          placeholder="Kamida 8 ta belgi"
          secure
          icon={<LockKeyhole size={18} color={palette["muted-foreground"]} />}
          error={errors.password?.message}
        />

        <Button
          title="Ro'yxatdan o'tish"
          size="lg"
          loading={isSubmitting || register.isPending}
          onPress={handleSubmit(submit)}
        />

        <Text
          accessibilityRole="button"
          onPress={() => router.replace(ROUTES.auth.login)}
          variant="caption"
          tone="brand"
          style={styles.link}
        >
          Hisobingiz bormi? Kirish
        </Text>
      </View>
    </Screen>
  );
}

/** `Controller` + `Input` ni takrorlamaslik uchun kichik yordamchi. */
function Field({
  control,
  name,
  label,
  error,
  ...inputProps
}: {
  control: ReturnType<typeof useForm<RegisterFormValues>>["control"];
  name: keyof RegisterFormValues;
  label: string;
  error?: string;
  placeholder?: string;
  secure?: boolean;
  icon?: React.ReactNode;
  autoCapitalize?: "none" | "words";
  keyboardType?: "default" | "phone-pad";
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value } }) => (
        <Input
          label={label}
          value={typeof value === "string" ? value : ""}
          onChangeText={onChange}
          onBlur={onBlur}
          error={error}
          {...inputProps}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  header: { gap: 10, paddingTop: 28, paddingBottom: 24 },
  form: { gap: 16, paddingBottom: 24 },
  roleGroup: { gap: 8 },
  roles: { marginHorizontal: -20 },
  link: { textAlign: "center", paddingVertical: 12 },
});
