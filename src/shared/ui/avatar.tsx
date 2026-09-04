import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { initials } from "@/shared/lib";
import type { PresenceStatus } from "@/shared/types";
import { useTheme } from "./theme";
import { Text } from "./text";

export type AvatarTone = "violet" | "blue" | "emerald" | "amber" | "rose";
export type AvatarSize = "sm" | "md" | "lg" | "xl";

export interface AvatarProps {
  name?: string;
  /** Backend `avatarTone` ni satr sifatida qaytaradi — noma'lum qiymat `violet` ga tushadi. */
  tone?: AvatarTone | string;
  size?: AvatarSize;
  /** Faqat shaxsiy suhbatlarda ko'rsatiladi (guruhda ma'nosi yo'q). */
  status?: PresenceStatus;
  src?: string | null;
  style?: StyleProp<ViewStyle>;
}

const SIZES: Record<AvatarSize, { box: number; font: number; dot: number }> = {
  sm: { box: 28, font: 11, dot: 8 },
  md: { box: 36, font: 13, dot: 9 },
  lg: { box: 46, font: 16, dot: 11 },
  xl: { box: 64, font: 22, dot: 14 },
};

const TONES: readonly AvatarTone[] = ["violet", "blue", "emerald", "amber", "rose"];

function normalizeTone(tone: string | undefined): AvatarTone {
  return TONES.includes(tone as AvatarTone) ? (tone as AvatarTone) : "violet";
}

export function Avatar({ name, tone, size = "md", status, src, style }: AvatarProps) {
  const { palette } = useTheme();
  const metrics = SIZES[size];
  const resolved = normalizeTone(tone);

  return (
    <View style={[{ width: metrics.box, height: metrics.box }, style]}>
      <View
        style={[
          styles.box,
          {
            width: metrics.box,
            height: metrics.box,
            borderRadius: metrics.box / 2,
            backgroundColor: palette[`tone-${resolved}-bg`],
          },
        ]}
      >
        {src ? (
          <Image
            source={{ uri: src }}
            style={styles.image}
            accessibilityIgnoresInvertColors
            accessible={false}
          />
        ) : (
          <Text
            style={[styles.initials, { fontSize: metrics.font, color: palette[`tone-${resolved}-fg`] }]}
          >
            {initials(name)}
          </Text>
        )}
      </View>

      {status === "online" ? (
        <View
          accessibilityLabel="Onlayn"
          style={[
            styles.dot,
            {
              width: metrics.dot,
              height: metrics.dot,
              borderRadius: metrics.dot / 2,
              backgroundColor: palette.success,
              // Halqa fon rangida — nuqta avatar chetida "kesilgan" ko'rinmasin.
              borderColor: palette.surface,
            },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: "center", justifyContent: "center", overflow: "hidden" },
  image: { width: "100%", height: "100%" },
  initials: { fontWeight: "600" },
  dot: { position: "absolute", right: -1, bottom: -1, borderWidth: 2 },
});
