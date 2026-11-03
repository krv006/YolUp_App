import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { DsText, dsRadius, Icon, useDs } from "@/shared/ui";

/**
 * Server xatosi lentasi — veb `widgets/parent-shell/parent-error-banner.tsx`:
 * `-mb-1 rounded-2xl bg-surface-inverse px-5 py-3`, o'ngda `h-9` "Qayta urinish".
 */
export function ParentErrorBanner({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation(["parent", "common"]);
  const ds = useDs();
  return (
    <View style={[styles.banner, { backgroundColor: ds.c["surface-inverse"] }]}>
      <Icon name="warning" size={20} color={ds.c["ink-inverse"]} />
      <DsText v="body-sm" c="ink-inverse" style={styles.text}>
        {t("home.serverError")}
      </DsText>
      <Pressable
        accessibilityRole="button"
        onPress={onRetry}
        style={({ pressed }) => [styles.button, { backgroundColor: pressed ? ds.c.subtle : ds.c.surface }]}
      >
        <DsText v="button">{t("common:actions.retry")}</DsText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { marginBottom: -4, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 12, borderRadius: dsRadius["2xl"] },
  text: { flex: 1, minWidth: 0 },
  button: { height: 36, justifyContent: "center", paddingHorizontal: 16, borderRadius: dsRadius.full },
});
