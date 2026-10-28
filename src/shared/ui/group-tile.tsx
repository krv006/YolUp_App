import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { DsText, dsRadius, toneColors, useDs } from "./ds";

/** Veb `group-tile.tsx` dagi `TONES` — guruh rangi -> fon va harf rangi. */
const TONES: Record<string, string> = {
  violet: "bg-accent-violet-bg text-accent-violet-fg",
  blue: "bg-accent-blue-bg text-accent-blue-fg",
  emerald: "bg-accent-green-bg text-accent-green-fg",
  amber: "bg-accent-saffron-bg text-accent-saffron-fg",
  rose: "bg-accent-red-bg text-accent-red-fg",
};

/** `sm` — `size-8 rounded-lg text-caption-strong`; `md` — `size-10 rounded-xl text-title-sm`. */
const SIZES = {
  sm: { box: 32, radius: dsRadius.lg, text: "caption-strong" },
  md: { box: 40, radius: dsRadius.xl, text: "title-sm" },
} as const;

export interface GroupTileProps {
  name: string;
  tone?: string;
  size?: "sm" | "md";
  /** Aniq o'lcham va burchak — vebdagi `className="size-11 rounded-xl"` kabi. */
  box?: number;
  radius?: number;
  /** Guruh rasmi (backenddan kelgan `avatar`). */
  src?: string | null;
  style?: StyleProp<ViewStyle>;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "—";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
}

/**
 * Guruh belgisi — veb `shared/ui/group-tile.tsx`: rasm bo'lsa rasm, bo'lmasa
 * guruh rangidagi kvadratda bosh harflar (`font-heading`).
 */
export function GroupTile({ name, tone = "blue", size = "md", box, radius, src, style }: GroupTileProps) {
  const ds = useDs();
  const metrics = SIZES[size];
  const frame = { width: box ?? metrics.box, height: box ?? metrics.box, borderRadius: radius ?? metrics.radius };

  if (src) return <Image source={{ uri: src }} style={[frame, style as never]} accessibilityIgnoresInvertColors />;

  const colors = toneColors(TONES[tone] ?? TONES.blue!, ds);
  return (
    <View accessibilityElementsHidden importantForAccessibility="no" style={[styles.tile, frame, { backgroundColor: colors.bg }, style]}>
      <DsText v={metrics.text} heading style={{ color: colors.fg }}>
        {initials(name)}
      </DsText>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { alignItems: "center", justifyContent: "center" },
});
