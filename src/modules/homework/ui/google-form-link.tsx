import { ExternalLink } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Linking, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { DsText, dsRadius, Icon, useDs } from "@/shared/ui";

export interface GoogleFormLinkProps {
  url: string;
  hint?: string;
  /** Vebdagi `className` o'rniga — masalan, fonni almashtirish (`bg-surface`). */
  style?: StyleProp<ViewStyle>;
}

/**
 * Vazifaga biriktirilgan Google Form havolasi — veb `google-form-link.tsx`:
 * binafsha fondagi qator, bosilsa forma tashqi brauzerda ochiladi.
 */
export function GoogleFormLink({ url, hint, style }: GoogleFormLinkProps) {
  const { t } = useTranslation("homework");
  const ds = useDs();
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={t("googleForm.open")}
      accessibilityHint={hint ?? t("googleForm.hint")}
      onPress={() => void Linking.openURL(url)}
      style={({ pressed }) => [
        styles.root,
        { backgroundColor: ds.c["accent-violet-bg"] },
        style,
        pressed && styles.pressed,
      ]}
    >
      {/* `size-9 rounded-lg bg-surface text-accent-violet-fg` */}
      <View style={[styles.icon, { backgroundColor: ds.c.surface }]}>
        <Icon name="link" size={20} color={ds.c["accent-violet-fg"]} />
      </View>
      <View style={styles.grow}>
        <DsText v="body-sm" w="600" numberOfLines={1}>
          {t("googleForm.open")}
        </DsText>
        <DsText v="caption" c="ink-secondary" numberOfLines={2}>
          {hint ?? t("googleForm.hint")}
        </DsText>
      </View>
      <ExternalLink size={18} color={ds.c["accent-violet-fg"]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  /* `min-h-14 gap-3 rounded-xl px-3 py-2.5` */
  root: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: dsRadius.xl,
  },
  pressed: { opacity: 0.85 },
  icon: {
    width: 36,
    height: 36,
    borderRadius: dsRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  grow: { flex: 1, minWidth: 0 },
});
