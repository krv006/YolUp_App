import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { useLegacyColors } from "./legacy-colors";
import { Text } from "./text";
import { useTheme } from "./theme";

/*
 * Vebdagi ota-ona sahifalari va hisobotlar ESKI portal uslubida (`legacy.css`:
 * `.portal-page`, `.portal-page-heading`, `.portal-card` ...). Bu bloklar
 * o'sha klasslarning mobil o'rni; o'lchamlar 390px kenglikdagi veb
 * DOM'idan olingan. Sarlavhalar ham Inter o'rniga oddiy matn shriftida —
 * vebda bu sahifalarda Unbounded ishlatilmaydi.
 */

/** `.portal-page` — 20 12 38; ichidagi bloklar yana 12 ichkarida. */
export const portalPage = { paddingTop: 20, paddingHorizontal: 24, paddingBottom: 38, gap: 20 } as const;

export interface PortalHeadingProps {
  eyebrow: string;
  /** Eyebrow ustidagi kichik ikonka — veb admin sahifalarida `ShieldCheck`. */
  eyebrowIcon?: LucideIcon;
  title: string;
  description?: string;
  actions?: ReactNode;
}

/** `.portal-page-heading` — ko'k "eyebrow", 28/42 sarlavha, izoh va amallar. */
export function PortalHeading({ eyebrow, eyebrowIcon: EyebrowIcon, title, description, actions }: PortalHeadingProps) {
  const { palette } = useTheme();
  const colors = useLegacyColors();
  return (
    <View style={styles.heading}>
      <View>
        {/* Vebda ikonka `inline` matn bilan, tor ekranda o'z qatoriga tushadi. */}
        {EyebrowIcon ? <EyebrowIcon size={14} color={palette["primary-text"]} style={styles.eyebrowIcon} /> : null}
        <Text variant="caption" style={[styles.eyebrow, { color: palette["primary-text"] }]}>
          {eyebrow}
        </Text>
        <Text variant="body" accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        {description ? (
          <Text variant="label" style={[styles.description, { color: colors.muted }]}>
            {description}
          </Text>
        ) : null}
      </View>
      {actions ? <View style={styles.actions}>{actions}</View> : null}
    </View>
  );
}

/** `.portal-card` — 1px chegara, radius 20, oq fon. */
export function PortalCard({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { palette } = useTheme();
  const colors = useLegacyColors();
  return <View style={[styles.card, { borderColor: colors.border, backgroundColor: palette.surface }, style]}>{children}</View>;
}

/** `.portal-section-head` — kichik kulrang "eyebrow" (ixtiyoriy ikonka bilan), 19px sarlavha va izoh. */
export function PortalSectionHead({
  eyebrow,
  eyebrowIcon: EyebrowIcon,
  title,
  note,
  action,
}: {
  eyebrow: string;
  eyebrowIcon?: LucideIcon;
  title: string;
  note?: string;
  action?: ReactNode;
}) {
  const colors = useLegacyColors();
  return (
    <View style={styles.sectionHead}>
      <View style={styles.grow}>
        <View style={styles.sectionEyebrowRow}>
          {EyebrowIcon ? <EyebrowIcon size={13} color={colors.muted} /> : null}
          <Text variant="caption" style={[styles.sectionEyebrow, { color: colors.muted }]}>
            {eyebrow}
          </Text>
        </View>
        <Text variant="body" style={styles.sectionTitle}>
          {title}
        </Text>
        {note ? (
          <Text variant="caption" style={[styles.sectionNote, { color: colors.muted }]}>
            {note}
          </Text>
        ) : null}
      </View>
      {action}
    </View>
  );
}

export interface PortalButtonProps {
  label: string;
  onPress?: () => void;
  icon?: LucideIcon;
  variant?: "primary" | "secondary";
  /**
   * `md` — oddiy tugma (44, 16/700); `sm` — kichik (38, 15/700);
   * `dense` — tor ekrandagi `.heading-actions` (44, 12/700);
   * `link` — `.portal-primary-link` (44, 0 14, 13/800).
   */
  size?: "md" | "sm" | "dense" | "link";
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Veb `legacy` `Button` — radius 10, ikonka va matn orasi 8. */
export function PortalButton({
  label,
  onPress,
  icon: Icon,
  variant = "secondary",
  size = "md",
  loading = false,
  disabled = false,
  style,
}: PortalButtonProps) {
  const { palette } = useTheme();
  const colors = useLegacyColors();
  const primary = variant === "primary";
  const color = primary ? palette["primary-foreground"] : colors.foreground;
  const preset = BUTTON_SIZES[size];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { minHeight: preset.height, paddingHorizontal: preset.padding },
        primary
          ? { backgroundColor: pressed ? palette["primary-hover"] : palette.primary }
          : { borderWidth: 1, borderColor: colors.border, backgroundColor: pressed ? palette["primary-soft"] : palette.surface },
        (disabled || loading) && styles.dim,
        style,
      ]}
    >
      {loading ? <ActivityIndicator size="small" color={color} /> : Icon ? <Icon size={preset.icon} color={color} /> : null}
      <Text variant="label" numberOfLines={1} style={{ color, fontSize: preset.font, lineHeight: preset.font * 1.5, fontWeight: "700" }}>
        {label}
      </Text>
    </Pressable>
  );
}

const BUTTON_SIZES = {
  md: { height: 44, padding: 18, font: 16, icon: 17 },
  sm: { height: 38, padding: 13, font: 15, icon: 15 },
  dense: { height: 44, padding: 9, font: 12, icon: 17 },
  link: { height: 44, padding: 14, font: 13, icon: 15 },
} as const;

/** `.portal-empty` — kesik chiziqli ko'k chegara, markazda ikonka, sarlavha va izoh. */
export function PortalEmpty({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description?: string }) {
  const { palette } = useTheme();
  const colors = useLegacyColors();
  return (
    <View style={[styles.empty, { borderColor: palette["border-accent"], backgroundColor: palette.surface }]}>
      <Icon size={30} color={palette["primary-text"]} />
      <Text variant="body" style={styles.emptyTitle}>
        {title}
      </Text>
      {description ? (
        <Text variant="label" style={[styles.emptyText, { color: colors.muted }]}>
          {description}
        </Text>
      ) : null}
    </View>
  );
}

export type PortalMetricTone = "violet" | "blue" | "amber" | "emerald" | "rose";

/** `.portal-metric` — rangli ikonka kvadrati, katta son va izoh. */
export function PortalMetric({ icon: Icon, tone, value, label }: { icon: LucideIcon; tone: PortalMetricTone; value: string | number; label: string }) {
  const { palette } = useTheme();
  const colors = useLegacyColors();
  return (
    <View style={[styles.metric, { borderColor: colors.border, backgroundColor: palette.surface }]}>
      <View style={[styles.metricIcon, { backgroundColor: palette[`tone-${tone}-bg`] }]}>
        <Icon size={20} color={palette[`tone-${tone}-fg`]} />
      </View>
      <View style={styles.metricBody}>
        <Text variant="body" style={styles.metricValue}>
          {value}
        </Text>
        <Text variant="caption" style={{ color: colors.muted }}>
          {label}
        </Text>
      </View>
    </View>
  );
}

/** `.workspace-list-icon` / `.consent-icon` — 41x41, radius 13, ko'k fon. */
export function PortalListIcon({ icon: Icon, size = 41 }: { icon: LucideIcon; size?: number }) {
  const { palette } = useTheme();
  return (
    <View style={[styles.listIcon, { width: size, height: size, backgroundColor: palette["primary-soft"] }]}>
      <Icon size={19} color={palette["primary-text"]} />
    </View>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  heading: { gap: 20 },
  /* `.portal-eyebrow` — 12/900, harf orasi .13em */
  eyebrow: { fontSize: 12, lineHeight: 18, fontWeight: "700", letterSpacing: 1.56 },
  eyebrowIcon: { marginBottom: 3 },
  /* `.portal-page-heading h1` — 28/42/400, -0.035em */
  title: { marginVertical: 6, fontSize: 28, lineHeight: 42, fontWeight: "400", letterSpacing: -0.98 },
  description: { fontSize: 14, lineHeight: 21, fontWeight: "400" },
  actions: { flexDirection: "row", gap: 9 },
  card: { borderWidth: 1, borderRadius: 20 },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: 15 },
  /* `.portal-section-head span` — 11/900, .12em */
  sectionEyebrowRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  sectionNote: { marginTop: 4, fontSize: 12, lineHeight: 18 },
  sectionEyebrow: { fontSize: 11, lineHeight: 16.5, fontWeight: "700", letterSpacing: 1.32 },
  sectionTitle: { marginTop: 4, fontSize: 19, lineHeight: 28.5, fontWeight: "400" },
  button: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 10 },
  dim: { opacity: 0.6 },
  /* `.portal-empty` — kamida 340, 35 bo'shliq, 1px kesik chegara, radius 20 */
  empty: { minHeight: 340, alignItems: "center", justifyContent: "center", padding: 35, borderWidth: 1, borderStyle: "dashed", borderRadius: 20 },
  emptyTitle: { marginTop: 13, marginBottom: 6, fontSize: 21, lineHeight: 30, fontWeight: "400", textAlign: "center" },
  emptyText: { maxWidth: 370, fontSize: 13, lineHeight: 19.5, fontWeight: "400", textAlign: "center" },
  /* `.portal-metric` — 13 bo'shliq, radius 16; tor ekranda bir ustun */
  metric: { minHeight: 82, flexDirection: "row", alignItems: "center", gap: 13, padding: 13, borderWidth: 1, borderRadius: 16 },
  metricIcon: { width: 37, height: 37, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  metricBody: { flex: 1, gap: 3 },
  metricValue: { fontSize: 19, lineHeight: 28.5, fontWeight: "700", letterSpacing: -0.38 },
  listIcon: { borderRadius: 13, alignItems: "center", justifyContent: "center" },
});
