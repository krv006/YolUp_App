import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { DsText } from "@/shared/ui";

/**
 * Bo'lim sarlavhasi — veb `panel-heading.tsx`: `text-caption` katta harfli
 * yorliq, `text-[24px]/[26px] font-bold` sarlavha va `text-body-sm` izoh.
 */
export function PanelHeading({
  eyebrow,
  title,
  subtitle,
  style,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.root, style]}>
      <DsText v="caption" c="ink-secondary" style={styles.eyebrow}>
        {eyebrow}
      </DsText>
      <DsText w="700" style={styles.title}>
        {title}
      </DsText>
      {subtitle ? (
        <DsText v="body-sm" c="ink-secondary" numberOfLines={1}>
          {subtitle}
        </DsText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, minWidth: 0, gap: 3 },
  eyebrow: { textTransform: "uppercase" },
  title: { fontSize: 24, lineHeight: 26 },
});
