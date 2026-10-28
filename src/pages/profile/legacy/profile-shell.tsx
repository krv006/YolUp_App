import { useCallback, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useFocusEffect, usePathname, useRouter } from "expo-router";
import { NotificationBell } from "@/modules/notification";
import { AppBar, Icon, radius, Screen, Text, useTheme, type IconName } from "@/shared/ui";

/**
 * Profil sahifalari qobig'i — veb `pages/profile/profile-shell.tsx`.
 *
 * Vebda tor ekranda tepada "Profil" paneli (qo'ng'iroq bilan) turaveradi,
 * ichki sahifa esa o'z sarlavhasini orqaga tugmasi bilan chizadi. Pastki
 * "Saqlash" kabi tugmalar `footer` ga — u aylantirilmaydi.
 */
export function ProfileSubPage({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { t } = useTranslation("account");
  const { t: tn } = useTranslation("nav");
  const { palette } = useTheme();
  const onBack = useProfileBack();

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        onBack();
        return true;
      });
      return () => subscription.remove();
    }, [onBack])
  );

  return (
    <Screen padded={false}>
      <AppBar title={tn("titles.profile")}>
        <NotificationBell />
      </AppBar>
      <View style={styles.subHeader}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("page.title")}
          onPress={onBack}
          style={({ pressed }) => [styles.back, pressed && { backgroundColor: palette["surface-subtle"] }]}
        >
          <Icon name="arrow-back" size={22} color={palette.foreground} />
        </Pressable>
        <Text variant="heading" numberOfLines={1} style={styles.grow}>
          {title}
        </Text>
      </View>
      <ScrollView style={styles.grow} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {description ? (
          <Text variant="label" style={[styles.bodySm, { color: palette["muted-foreground"] }]}>
            {description}
          </Text>
        ) : null}
        {children}
      </ScrollView>
      {footer ? (
        <View style={[styles.footer, { borderTopColor: palette.border, backgroundColor: palette.surface }]}>{footer}</View>
      ) : null}
    </Screen>
  );
}

/**
 * Ichki sahifadan "Profil"ga qaytish — vebdagi `navigate(-1)`.
 *
 * Ichki sahifalar tab ichidagi yashirin marshrutlar (`profile-personal`
 * va h.k.), tab tarixida `back()` boshqa tabga olib ketishi mumkin —
 * shuning uchun aniq manzilga qaytamiz.
 */
export function useProfileBack(): () => void {
  const router = useRouter();
  const pathname = usePathname();
  const target = pathname.replace(/\/profile-[a-z]+$/, "/profile");
  return useCallback(() => router.replace(target as never), [router, target]);
}

/** `/teacher/profile` -> `/teacher/profile-personal` */
export function useProfileLink(): (section: "personal" | "account" | "system") => void {
  const router = useRouter();
  const pathname = usePathname();
  const base = pathname.replace(/\/profile(-[a-z]+)?$/, "");
  return useCallback((section) => router.push(`${base}/profile-${section}` as never), [router, base]);
}

export function SectionLabel({ children }: { children: string }) {
  const { palette } = useTheme();
  return (
    <Text variant="caption" style={[styles.sectionLabel, { color: palette["subtle-foreground"] }]}>
      {children}
    </Text>
  );
}

/** `SettingsSection` — kichik sarlavha va ajratkichli ro'yxat kartasi. */
export function SettingsSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <SectionLabel>{label}</SectionLabel>
      <SettingsCard>{children}</SettingsCard>
    </View>
  );
}

/** `divide-y divide-line rounded-2xl border bg-surface` */
export function SettingsCard({ children, danger = false }: { children: ReactNode; danger?: boolean }) {
  const { palette } = useTheme();
  const items = (Array.isArray(children) ? children : [children]).flat().filter(Boolean);
  return (
    <View
      style={[
        styles.card,
        danger
          ? { borderColor: palette["destructive-soft"], backgroundColor: palette["destructive-soft"] }
          : { borderColor: palette.border, backgroundColor: palette.surface },
      ]}
    >
      {items.map((child, index) => (
        <View key={index} style={index > 0 && { borderTopWidth: 1, borderTopColor: palette.border }}>
          {child}
        </View>
      ))}
    </View>
  );
}

export function SettingsRow({
  icon,
  tone,
  title,
  hint,
  right,
  onPress,
  danger = false,
}: {
  icon: IconName;
  /** Ikonka doirasi foni; berilmasa — asosiy rang. */
  tone?: string;
  title: string;
  hint?: string;
  right?: ReactNode;
  onPress?: () => void;
  danger?: boolean;
}) {
  const { palette } = useTheme();
  const content = (
    <>
      <View style={[styles.rowIcon, { backgroundColor: tone ?? palette.primary }]}>
        <Icon name={icon} size={18} color="#ffffff" />
      </View>
      <View style={styles.grow}>
        {/* Vebda bo'sh `<strong>` joy egallamaydi — masalan email yo'q bo'lsa. */}
        {title ? (
          <Text variant="label" numberOfLines={1} style={{ color: danger ? palette["destructive-strong"] : palette.foreground }}>
            {title}
          </Text>
        ) : null}
        {hint ? (
          <Text variant="caption" numberOfLines={1} style={[styles.hint, { color: palette["subtle-foreground"] }]}>
            {hint}
          </Text>
        ) : null}
      </View>
      {right !== undefined ? right : onPress ? <Icon name="chevron-right" size={18} color={palette["subtle-foreground"]} /> : null}
    </>
  );

  if (!onPress) return <View style={styles.row}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: palette["surface-subtle"] }]}
    >
      {content}
    </Pressable>
  );
}

/** "Tasdiqlangan" / "Shu qurilma" kabi kichik yorliq. */
export function RowPill({ label, color, background, icon }: { label: string; color: string; background: string; icon?: IconName }) {
  return (
    <View style={[styles.pill, { backgroundColor: background }]}>
      {icon ? <Icon name={icon} size={14} color={color} /> : null}
      <Text variant="caption" style={[styles.pillText, { color }]}>
        {label}
      </Text>
    </View>
  );
}

export function initialsOf(name: string | null | undefined): string {
  return (name ?? "")
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  bodySm: { fontWeight: "400" },
  /* `px-4 py-3 gap-3` */
  subHeader: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  back: { width: 40, height: 40, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  /* `px-4 pb-6 gap-4` */
  body: { gap: 16, paddingHorizontal: 16, paddingBottom: 24 },
  footer: { paddingHorizontal: 16, paddingVertical: 16, borderTopWidth: 1 },
  section: { gap: 8 },
  /* `text-caption-strong tracking-wide uppercase px-1` */
  sectionLabel: { paddingHorizontal: 4, fontWeight: "600", letterSpacing: 0.3, textTransform: "uppercase" },
  card: { overflow: "hidden", borderWidth: 1, borderRadius: radius["2xl"] },
  /* `px-4 py-3.5 gap-3` */
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  rowIcon: { width: 40, height: 40, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  hint: { fontWeight: "500" },
  pill: { height: 28, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, borderRadius: radius.full },
  pillText: { fontWeight: "600" },
});
