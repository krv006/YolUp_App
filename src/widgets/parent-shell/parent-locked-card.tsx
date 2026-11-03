import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { ROUTES } from "@/shared/config";
import { DsText, dsRadius, Icon, useDs } from "@/shared/ui";

/**
 * "Faollik tahlili" ruxsati o'chiq — veb `widgets/parent-shell/parent-locked-card.tsx`:
 * binafsha qulf, sarlavha, izoh va telefonda farzand ruxsatlari sahifasiga tugma.
 */
export function ParentLockedCard({ childId, childName, action = true }: { childId: string; childName: string; action?: boolean }) {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const router = useRouter();
  return (
    <View style={[styles.card, { backgroundColor: ds.c.surface }]}>
      <View style={[styles.ring, { backgroundColor: ds.c["accent-violet-bg"] }]}>
        <View style={[styles.core, { backgroundColor: ds.c["accent-violet-fg"] }]}>
          <Icon name="lock-fill" size={24} color={ds.c["on-action"]} />
        </View>
      </View>
      <DsText v="h2" heading w="600" style={styles.title}>
        {t("locked.title")}
      </DsText>
      <DsText v="body-sm" c="ink-secondary" style={styles.center}>
        {t("locked.text", { name: childName.split(" ")[0] || childName })}
      </DsText>
      {action ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(ROUTES.parent.childPermissions(childId) as never, { withAnchor: true })}
          style={({ pressed }) => [styles.button, { backgroundColor: pressed ? ds.c["brand-strong"] : ds.c.brand }]}
        >
          <Icon name="shield" size={18} color={ds.c["on-action"]} />
          <DsText v="button" c="on-action">
            {t("locked.action")}
          </DsText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: "center" },
  /* `flex flex-col items-center gap-3 rounded-[24px] bg-surface px-6 py-12` */
  card: { alignItems: "center", gap: 12, paddingHorizontal: 24, paddingVertical: 48, borderRadius: 24 },
  ring: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  core: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  /* `font-heading text-[20px]/7 font-semibold` */
  title: { lineHeight: 28, textAlign: "center" },
  button: { marginTop: 4, height: 44, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, borderRadius: dsRadius.full },
});
