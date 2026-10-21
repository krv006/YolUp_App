import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, CircleX } from "lucide-react-native";
import { radius, Text, ThemeScope, useTheme } from "@/shared/ui";

export interface LiveRoomStateProps {
  title: string;
  description?: string;
  lessonTitle?: string;
  subtitle?: string;
  tone?: "error" | "neutral";
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  onBack?: () => void;
}

/**
 * Jonli dars holat ekrani — veb `widgets/live-room/live-room-state.tsx`:
 * dars topilmadi, kirib bo'lmadi, dars yakunlandi. Doim qorong'i.
 */
export function LiveRoomState(props: LiveRoomStateProps) {
  return (
    <ThemeScope scheme="dark">
      <StateBody {...props} />
    </ThemeScope>
  );
}

function StateBody({
  title,
  description,
  lessonTitle,
  subtitle,
  tone = "error",
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  onBack,
}: LiveRoomStateProps) {
  const { t } = useTranslation("live");
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: palette.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        {onBack ? (
          <Pressable accessibilityRole="button" accessibilityLabel={t("room.leaveAria")} onPress={onBack} style={styles.back}>
            <ArrowLeft size={20} color={palette["muted-foreground"]} />
          </Pressable>
        ) : null}
        {lessonTitle ? (
          <View style={styles.grow}>
            <View style={styles.titleRow}>
              <View style={[styles.dot, { backgroundColor: LIVE_SUCCESS }]} />
              <Text variant="body" numberOfLines={1} style={[styles.grow, styles.heading]}>
                {lessonTitle}
              </Text>
            </View>
            {subtitle ? (
              <Text variant="caption" numberOfLines={1} style={[styles.caption, { color: palette["subtle-foreground"] }]}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        {tone === "error" ? (
          <View style={[styles.errorIcon, { backgroundColor: "#fdeeee" }]}>
            <CircleX size={30} color="#b93636" />
          </View>
        ) : null}
        <Text variant="title" style={styles.center}>
          {title}
        </Text>
        {description ? (
          <Text variant="body" style={[styles.center, styles.description, { color: palette["muted-foreground"] }]}>
            {description}
          </Text>
        ) : null}
        {actionLabel && onAction ? (
          <Pressable
            accessibilityRole="button"
            onPress={onAction}
            style={({ pressed }) => [styles.action, { backgroundColor: pressed ? palette["primary-hover"] : palette.primary }]}
          >
            <Text variant="label" style={{ color: palette["primary-foreground"] }}>
              {actionLabel}
            </Text>
          </Pressable>
        ) : null}
        {secondaryLabel && onSecondary ? (
          <Pressable accessibilityRole="button" onPress={onSecondary}>
            <Text variant="label" style={{ color: palette.primary }}>
              {secondaryLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

/** Veb qorong'i `--success` (`bg-success`): yashil "jonli" nuqta. */
export const LIVE_SUCCESS = "#35c493";

const styles = StyleSheet.create({
  root: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  center: { textAlign: "center" },
  caption: { fontWeight: "500" },
  /* `px-5 pt-4 pb-3 gap-3` */
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  back: { width: 36, height: 36, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  heading: { fontFamily: "Unbounded-SemiBold", fontWeight: "600" },
  dot: { width: 8, height: 8, borderRadius: radius.full },
  /* `items-center justify-center gap-4 px-6` */
  body: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 24 },
  errorIcon: { width: 64, height: 64, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  description: { maxWidth: 460 },
  action: { marginTop: 8, minWidth: 260, height: 48, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, borderRadius: radius.full },
});
