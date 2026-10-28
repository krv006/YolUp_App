import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DsText, Icon, ThemeScope, useDs } from "@/shared/ui";

export interface LiveRoomStateProps {
  title: string;
  description?: ReactNode;
  lessonTitle?: string;
  subtitle?: string;
  tone?: "error" | "neutral" | "offline";
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  onBack?: () => void;
}

/**
 * Jonli dars holat ekrani — veb `live-room-state.tsx` ning tor ekran
 * varianti (doim qorong'i): yopish tugmasi, katta belgi, dars nomi,
 * sarlavha va izoh, "Qayta urinish" va ikkinchi tugma.
 */
export function LiveRoomState(props: LiveRoomStateProps) {
  return (
    <ThemeScope scheme="dark">
      <StateBody {...props} />
    </ThemeScope>
  );
}

function StateBody({ title, description, lessonTitle, tone = "error", actionLabel, onAction, secondaryLabel, onSecondary, onBack }: LiveRoomStateProps) {
  const { t } = useTranslation("live");
  const ds = useDs();
  const insets = useSafeAreaInsets();
  const close = onBack ?? onSecondary;

  return (
    <ScrollView
      style={{ backgroundColor: ds.c.canvas }}
      contentContainerStyle={[styles.page, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 36 }]}
    >
      <View style={styles.header}>
        {close ? (
          <Pressable accessibilityRole="button" accessibilityLabel={t("room.leaveAria")} onPress={close} style={[styles.close, { backgroundColor: ds.c["surface-inverse"] }]}>
            <Icon name="close" size={22} color={ds.c["ink-inverse"]} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.body}>
        {tone !== "neutral" ? (
          <View style={[styles.icon, { backgroundColor: ds.c.subtle }]}>
            <Icon name={tone === "offline" ? "wifi" : "error"} size={40} color={ds.c["error-text"]} />
          </View>
        ) : null}
        {lessonTitle ? (
          <DsText v="body-sm" c="ink-secondary" style={styles.lesson}>
            {lessonTitle}
          </DsText>
        ) : null}
        <DsText v="title-lg" heading style={[styles.center, styles.title]}>
          {title}
        </DsText>
        {description ? (
          <DsText v="body-sm" c="ink-secondary" style={[styles.center, styles.description]}>
            {description}
          </DsText>
        ) : null}
        {actionLabel && onAction ? (
          <Pressable accessibilityRole="button" onPress={onAction} style={({ pressed }) => [styles.button, { backgroundColor: pressed ? ds.c["brand-strong"] : ds.c.brand }]}>
            {tone === "neutral" ? null : <Icon name="refresh" size={20} color={ds.c["on-action"]} />}
            <DsText v="title" w="600" c="on-action">
              {actionLabel}
            </DsText>
          </Pressable>
        ) : null}
        {secondaryLabel && onSecondary ? (
          <Pressable accessibilityRole="button" onPress={onSecondary} style={({ pressed }) => [styles.button, { backgroundColor: ds.c["surface-inverse"], opacity: pressed ? 0.85 : 1 }]}>
            <DsText v="title" w="600" c="ink-inverse">
              {secondaryLabel}
            </DsText>
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: "center" },
  /* `px-4 pt-5 pb-9` */
  page: { flexGrow: 1, paddingHorizontal: 16 },
  header: { height: 44, flexDirection: "row", alignItems: "center" },
  close: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  /* `items-center justify-center px-2 pb-25` */
  body: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 8, paddingBottom: 100 },
  icon: { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center" },
  lesson: { marginTop: 12 },
  title: { marginTop: 14 },
  description: { marginTop: 20, paddingHorizontal: 24 },
  button: { marginTop: 16, alignSelf: "stretch", height: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 26 },
});
