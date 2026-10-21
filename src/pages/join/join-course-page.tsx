import { useState } from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { resolveHomeRoute, useAuth } from "@/modules/auth";
import { useJoinCourse } from "@/modules/course";
import { AppError } from "@/shared/api";
import { ROUTES } from "@/shared/config";
import { ROLES } from "@/shared/constants";
import { Icon, Logo, radius, Screen, Text, useTheme } from "@/shared/ui";

type JoinState = "idle" | "joined" | "pending" | "error";

/**
 * Taklif havolasi bilan guruhga qo'shilish — veb `pages/join/join-course-page.tsx`.
 *
 * Holatlar vebdagidek: kod ko'rsatiladi -> "Qo'shilish" -> qo'shildi /
 * o'qituvchi tasdig'i kutilmoqda / xato. Faqat o'quvchi qo'shila oladi.
 *
 * Farq: vebda "Guruhni ochish" `/student/courses/:id` ga olib boradi;
 * mobilda guruh sahifasi chat ichida, shuning uchun chatlar ro'yxati ochiladi.
 */
export function JoinCoursePage() {
  const { t } = useTranslation("group");
  const { palette } = useTheme();
  const router = useRouter();
  const { code = "" } = useLocalSearchParams<{ code: string }>();
  const { user } = useAuth();
  const join = useJoinCourse();
  const [state, setState] = useState<JoinState>("idle");
  const [message, setMessage] = useState("");

  const isStudent = user?.role === ROLES.STUDENT;

  function submit() {
    setMessage("");
    join.mutate(code, {
      onSuccess: (result) => setState(result.status === "pending" ? "pending" : "joined"),
      onError: (error: Error) => {
        setState("error");
        setMessage(describeJoinError(error, t));
      },
    });
  }

  const iconTone =
    state === "error"
      ? { color: palette["destructive-strong"], background: palette["destructive-soft"] }
      : state === "joined"
        ? { color: palette["success-strong"], background: palette["success-soft"] }
        : { color: palette.primary, background: palette["primary-soft"] };

  return (
    <Screen scroll>
      <View style={styles.page}>
        <Logo size={48} />

        {/* `rounded-3xl border bg-surface p-6 gap-4 text-center` */}
        <View style={[styles.card, { borderColor: palette.border, backgroundColor: palette.surface }]}>
          <View style={[styles.icon, { backgroundColor: iconTone.background }]}>
            <Icon
              name={state === "error" ? "error" : state === "joined" ? "check-circle" : "groups"}
              size={26}
              color={iconTone.color}
            />
          </View>

          <Text variant="heading" style={styles.center}>
            {state === "joined"
              ? t("join.joinedTitle")
              : state === "pending"
                ? t("join.pendingTitle")
                : state === "error"
                  ? t("join.errorTitle")
                  : t("join.title")}
          </Text>

          <Text variant="label" style={[styles.center, styles.regular, { color: palette["muted-foreground"] }]}>
            {state === "joined"
              ? t("join.joinedDescription")
              : state === "pending"
                ? t("join.pendingDescription")
                : state === "error"
                  ? message
                  : isStudent
                    ? t("join.description")
                    : t("join.notStudent")}
          </Text>

          {state === "idle" ? (
            <View style={[styles.code, { backgroundColor: palette["surface-subtle"] }]}>
              <Text variant="subheading" style={styles.codeText}>
                {code.toUpperCase()}
              </Text>
            </View>
          ) : null}

          {state === "idle" && isStudent ? (
            <PillButton
              primary
              label={join.isPending ? t("join.joining") : t("join.action")}
              loading={join.isPending}
              disabled={join.isPending || !code}
              onPress={submit}
            />
          ) : null}

          {state === "joined" ? (
            <PillButton primary label={t("join.openCourse")} onPress={() => router.replace(ROUTES.student.chats)} />
          ) : null}

          {state === "error" ? (
            <PillButton
              label={t("join.retry")}
              onPress={() => {
                setState("idle");
                setMessage("");
              }}
            />
          ) : null}

          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace(user ? resolveHomeRoute(user) : ROUTES.root)}
          >
            <Text variant="label" style={{ color: palette.primary }}>
              {t("join.home")}
            </Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

/** `h-12 w-full rounded-full` — asosiy (`bg-action`) yoki chegarali tugma. */
function PillButton({
  label,
  onPress,
  primary = false,
  loading = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
  loading?: boolean;
  disabled?: boolean;
}) {
  const { palette } = useTheme();
  const color = primary ? palette["primary-foreground"] : palette.foreground;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        primary
          ? { backgroundColor: pressed ? palette["primary-hover"] : palette.primary }
          : {
              borderWidth: 1,
              borderColor: palette.border,
              backgroundColor: pressed ? palette["surface-subtle"] : palette.surface,
            },
        disabled && styles.disabled,
      ]}
    >
      {loading ? <ActivityIndicator size="small" color={color} /> : null}
      <Text variant="label" style={{ color }}>
        {label}
      </Text>
    </Pressable>
  );
}

function describeJoinError(error: Error, t: TFunction<"group">): string {
  if (error instanceof AppError) {
    if (error.status === 404) return t("join.errorNotFound");
    if (error.status === 400) return t("join.errorExpired");
    if (error.status === 403) return t("join.errorForbidden");
    if (error.message) return error.message;
  }
  return t("join.errorGeneric");
}

const styles = StyleSheet.create({
  /* `min-h-dvh items-center justify-center gap-6 px-5 py-10` */
  page: { flexGrow: 1, alignItems: "center", justifyContent: "center", gap: 24, paddingHorizontal: 4, paddingVertical: 40 },
  /* `rounded-3xl` — vebda o'z tokeni yo'q, Tailwind standarti 24px */
  card: { width: "100%", maxWidth: 420, alignItems: "center", gap: 16, padding: 24, borderWidth: 1, borderRadius: radius["2xl"] },
  /* `size-14 rounded-2xl` */
  icon: { width: 56, height: 56, borderRadius: radius["2xl"], alignItems: "center", justifyContent: "center" },
  center: { textAlign: "center" },
  regular: { fontWeight: "400" },
  /* `rounded-full bg-subtle px-4 py-2 font-numeric text-title` */
  code: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.full },
  codeText: { fontVariant: ["tabular-nums"], letterSpacing: 1 },
  pill: { alignSelf: "stretch", height: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: radius.full },
  disabled: { opacity: 0.6 },
});
