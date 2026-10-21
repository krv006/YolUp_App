import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useTranslation } from "react-i18next";
import { initials } from "@/shared/lib";
import type { PresenceStatus } from "@/shared/types";
import { useTheme } from "./theme";
import { Text } from "./text";
import { GradientFill } from "./gradient";

export type AvatarTone = "violet" | "blue" | "emerald" | "amber" | "rose";
export type AvatarSize = "sm" | "md" | "lg" | "xl" | "2xl";

export interface AvatarProps {
  name?: string;
  /** Backend `avatarTone` ni satr sifatida qaytaradi — noma'lum qiymat `violet` ga tushadi. */
  tone?: AvatarTone | string;
  size?: AvatarSize;
  /** Faqat shaxsiy suhbatlarda ko'rsatiladi (guruhda ma'nosi yo'q). */
  status?: PresenceStatus;
  src?: string | null;
  style?: StyleProp<ViewStyle>;
  /**
   * `legacy` — vebning eski avatari (`.avatar--{tone}`): gradient fon va
   * oq harflar. Vebda u hali imtihon natijalari va test urinishlari
   * ro'yxatida ishlatiladi; qolgan joylarda yangi (tekis) avatar.
   */
  variant?: "default" | "legacy";
}

const LEGACY_SIZES: Partial<Record<AvatarSize, { box: number; font: number }>> = {
  sm: { box: 36, font: 13 },
  md: { box: 43, font: 15 },
  lg: { box: 50, font: 16 },
  // Jonli dars plitkasi: `.live-camera-placeholder .avatar` — 72px, `--fs-4xl`.
  xl: { box: 72, font: 28 },
};

/** Veb `legacy.css` dagi `.avatar--{tone}` gradientlari (145deg). */
const LEGACY_GRADIENTS: Record<AvatarTone, readonly [string, string]> = {
  violet: ["#9b8bf8", "#6855dc"],
  rose: ["#f395ac", "#d85c83"],
  blue: ["#70b6ef", "#3e7fc4"],
  amber: ["#f5bd70", "#dc833a"],
  emerald: ["#61cba6", "#319777"],
};

const SIZES: Record<AvatarSize, { box: number; font: number; dot: number }> = {
  sm: { box: 28, font: 11, dot: 8 },
  // `md` — suhbat panelidagi avatar. 40 — veb DOM'idan (ilgari 36).
  md: { box: 40, font: 13, dot: 9 },
  // `lg` — ro'yxat avatari. 50 — veb DOM'idan o'lchangan qiymat (ilgari 46).
  lg: { box: 50, font: 16, dot: 11 },
  xl: { box: 64, font: 22, dot: 14 },
  // Profil sahifasining bosh avatari — Telegramdagi kabi yirik.
  "2xl": { box: 96, font: 32, dot: 18 },
};

const TONES: readonly AvatarTone[] = ["violet", "blue", "emerald", "amber", "rose"];

function normalizeTone(tone: string | undefined): AvatarTone {
  return TONES.includes(tone as AvatarTone) ? (tone as AvatarTone) : "violet";
}

export function Avatar({ name, tone, size = "md", status, src, style, variant = "default" }: AvatarProps) {
  const { t } = useTranslation("mobile");
  const { palette } = useTheme();
  // Eski avatar o'lchamlari: sm 36/13, md 43/15, lg 50/16 (`.avatar--*`).
  const metrics =
    variant === "legacy" && LEGACY_SIZES[size] ? { ...SIZES[size], ...LEGACY_SIZES[size] } : SIZES[size];
  const resolved = normalizeTone(tone);
  const legacy = variant === "legacy";

  return (
    <View style={[{ width: metrics.box, height: metrics.box }, style]}>
      <View
        style={[
          styles.box,
          {
            width: metrics.box,
            height: metrics.box,
            borderRadius: metrics.box / 2,
            backgroundColor: legacy ? undefined : palette[`tone-${resolved}-bg`],
            overflow: "hidden",
          },
        ]}
      >
        {legacy && !src ? <GradientFill colors={LEGACY_GRADIENTS[resolved]} /> : null}
        {src ? (
          <Image
            source={{ uri: src }}
            style={styles.image}
            accessibilityIgnoresInvertColors
            accessible={false}
          />
        ) : (
          <Text
            style={[
              styles.initials,
              legacy
                ? { fontSize: metrics.font, color: "#ffffff", fontWeight: "700" }
                : { fontSize: metrics.font, color: palette[`tone-${resolved}-fg`] },
            ]}
          >
            {initials(name)}
          </Text>
        )}
      </View>

      {status === "online" ? (
        <View
          accessibilityLabel={t("shared.onlayn")}
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
