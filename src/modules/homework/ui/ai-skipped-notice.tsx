import { useTranslation } from "react-i18next";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { DsText, dsRadius, Icon, useDs } from "@/shared/ui";

/**
 * Veb `ai-skipped-notice.tsx`: AI'ga sig'magan sahifalar haqida sariq
 * ogohlantirish (`rounded-lg bg-warning-bg px-3 py-2 text-body-xs text-warning-fg`).
 */
export function AiSkippedNotice({ count, style }: { count: number; style?: StyleProp<ViewStyle> }) {
  const { t } = useTranslation("homework");
  const ds = useDs();
  if (count <= 0) return null;
  return (
    <View style={[styles.root, { backgroundColor: ds.c["warning-bg"] }, style]}>
      <View style={styles.icon}>
        <Icon name="warning" size={16} color={ds.c["warning-fg"]} />
      </View>
      <DsText v="body-xs" c="warning-fg" style={styles.text}>
        {t("aiSkipped", { count })}
      </DsText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: "row", alignItems: "flex-start", gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: dsRadius.lg },
  icon: { marginTop: 2 },
  text: { flex: 1, minWidth: 0 },
});
