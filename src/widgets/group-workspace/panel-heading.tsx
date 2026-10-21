import { StyleSheet, View } from "react-native";
import { Text, useTheme } from "@/shared/ui";

/**
 * Bo'lim sarlavhasi — veb guruh panellaridagi blok: ko'k kichik yozuv
 * ("DARS JADVALI"), katta sarlavha va izoh.
 */
export function PanelHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  const { palette } = useTheme();
  return (
    <View style={styles.root}>
      <Text variant="caption" style={[styles.eyebrow, { color: palette.primary }]}>
        {eyebrow}
      </Text>
      <Text variant="heading">{title}</Text>
      {subtitle ? (
        <Text variant="label" style={[styles.subtitle, { color: palette["muted-foreground"] }]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 4 },
  eyebrow: { fontWeight: "600", letterSpacing: 0.3, textTransform: "uppercase" },
  subtitle: { fontWeight: "400" },
});
