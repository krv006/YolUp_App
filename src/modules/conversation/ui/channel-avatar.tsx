import { Image, StyleSheet, View, type ImageStyle, type StyleProp } from "react-native";
import { dsRadius, Icon, useDs } from "@/shared/ui";

export interface ChannelAvatarProps {
  src?: string | null;
  /** Standart `size-12 rounded-lg`. */
  size?: number;
  radius?: number;
  iconSize?: number;
  style?: StyleProp<ImageStyle>;
}

/** Kanal rasmi — veb `channel-avatar.tsx`: rasm bo'lmasa `campaign` belgisi `bg-brand-subtle` da. */
export function ChannelAvatar({ src, size = 48, radius = dsRadius.lg, iconSize = 24, style }: ChannelAvatarProps) {
  const ds = useDs();
  const box = { width: size, height: size, borderRadius: radius };
  if (src) return <Image source={{ uri: src }} style={[styles.image, box, { backgroundColor: ds.c.subtle }, style]} />;
  return (
    <View style={[styles.icon, box, { backgroundColor: ds.c["brand-subtle"] }, style as object]}>
      <Icon name="campaign" size={iconSize} color={ds.c.brand} />
    </View>
  );
}

const styles = StyleSheet.create({
  image: { flexShrink: 0 },
  icon: { flexShrink: 0, alignItems: "center", justifyContent: "center" },
});
