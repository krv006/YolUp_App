import { Fragment, useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, TextInput, View, type StyleProp, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { bodyFont } from "./fonts";
import { DsGradient, DsText, dsRadius, dsType, toneColors, useDs, type DsColor } from "./ds";
import { Icon, type IconName } from "./icon";

/*
 * Yangi dizayndagi mobil sahifa bloklari — veb `shared/ui/mobile-page.tsx`.
 * Komponent nomlari va o'lchamlari vebdagidek; Tailwind klasslari izohda.
 */

export interface MobilePageHeaderProps {
  title: ReactNode;
  backLabel: string;
  onBack: () => void;
  action?: ReactNode;
}

/** `h-11 gap-3`: chapda yumaloq orqaga tugmasi, markazda `text-title-lg` sarlavha. */
export function MobilePageHeader({ title, backLabel, onBack, action }: MobilePageHeaderProps) {
  return (
    <View style={styles.header}>
      <MobileRoundButton icon="chevron-left" label={backLabel} onPress={onBack} />
      <DsText v="title-lg" numberOfLines={1} style={styles.headerTitle}>
        {title}
      </DsText>
      {action ?? <View style={styles.round} />}
    </View>
  );
}

export interface MobileRoundButtonProps {
  /** `iconNode` berilsa shart emas. */
  icon?: IconName;
  /** Tayyor ikonka (masalan vebdagi `lucide` belgisi) — `icon` o'rniga chiziladi. */
  iconNode?: ReactNode;
  label: string;
  onPress: () => void;
  iconSize?: number;
  disabled?: boolean;
  /** Fon rangi — standart `bg-subtle`. */
  background?: DsColor;
  /** Belgi (masalan o'qilmagan bildirishnoma nuqtasi). */
  badge?: ReactNode;
}

/** `mobileRoundButton` — `size-11 rounded-full bg-subtle text-ink`. */
export function MobileRoundButton({ icon, iconNode, label, onPress, iconSize = 22, disabled, background = "subtle", badge }: MobileRoundButtonProps) {
  const ds = useDs();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.round,
        { backgroundColor: pressed ? ds.c.muted : ds.c[background] },
        disabled && styles.disabled,
      ]}
    >
      {iconNode ?? (icon ? <Icon name={icon} size={iconSize} color={ds.c.ink} /> : null)}
      {badge}
    </Pressable>
  );
}

export type MobileButtonVariant = "primary" | "secondary" | "danger";

export interface MobileButtonProps {
  label: ReactNode;
  onPress: () => void;
  variant?: MobileButtonVariant;
  icon?: IconName;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** `mobileButton` — `h-13 rounded-full px-5 text-title font-semibold`, `flex-1`. */
export function MobileButton({ label, onPress, variant = "primary", icon, disabled, style }: MobileButtonProps) {
  const ds = useDs();
  const colors: Record<MobileButtonVariant, { bg: string; pressed: string; fg: DsColor; border?: string }> = {
    primary: { bg: ds.c.brand, pressed: ds.c["brand-strong"], fg: "on-action" },
    secondary: { bg: ds.c.surface, pressed: ds.c.subtle, fg: "ink", border: ds.c["line-strong"] },
    danger: { bg: ds.c["danger-bg"], pressed: ds.c["danger-bg"], fg: "danger" },
  };
  const tone = colors[variant];
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: pressed ? tone.pressed : tone.bg },
        tone.border ? { borderWidth: 1, borderColor: tone.border } : null,
        disabled && styles.buttonDisabled,
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={20} color={ds.c[tone.fg]} /> : null}
      <DsText v="title" w="600" c={tone.fg} numberOfLines={1}>
        {label}
      </DsText>
    </Pressable>
  );
}

/** `rounded-t-2xl bg-surface px-4 pt-3 pb-8.5 shadow-nav-top gap-3` — pastki amallar paneli. */
export function MobileActionBar({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const ds = useDs();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.actionBar,
        { backgroundColor: ds.c.surface, boxShadow: ds.shadow["nav-top"], paddingBottom: Math.max(34, insets.bottom + 12) },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export interface MobileScreenProps {
  title: ReactNode;
  closeLabel: string;
  closeIcon?: "close" | "chevron-left";
  onClose: () => void;
  action?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

/** To'liq ekranli oyna: auth gradienti, `px-4 pt-5 pb-6`, sarlavha va ixtiyoriy pastki panel. */
export function MobileScreen({ title, closeLabel, closeIcon = "close", onClose, action, footer, children }: MobileScreenProps) {
  const ds = useDs();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.fill, { backgroundColor: ds.c.canvas }]}>
      <ScrollView
        style={styles.fill}
        contentContainerStyle={[styles.screenBody, { paddingTop: insets.top + 20 }]}
        keyboardShouldPersistTaps="handled"
      >
        <DsGradient name="auth" />
        <View style={styles.header}>
          <MobileRoundButton icon={closeIcon} label={closeLabel} onPress={onClose} />
          <DsText v="title-lg" w="600" numberOfLines={1} style={styles.headerTitle}>
            {title}
          </DsText>
          {action ?? <View style={styles.round} />}
        </View>
        {children}
      </ScrollView>
      {footer ? <MobileActionBar>{footer}</MobileActionBar> : null}
    </View>
  );
}

/** `rounded-xl bg-warning-bg px-3.5 py-3 gap-3`, `warning-fill` belgisi. */
export function MobileWarningNote({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const ds = useDs();
  return (
    <View style={[styles.warning, { backgroundColor: ds.c["warning-bg"] }, style]}>
      <Icon name="warning-fill" size={20} color={ds.c["warning-fg"]} />
      <DsText v="body-sm" w="500" c="warning-fg" style={styles.warningText}>
        {children}
      </DsText>
    </View>
  );
}

export interface MobileTitleHeaderProps {
  eyebrow: ReactNode;
  title: ReactNode;
  action?: ReactNode;
}

/** Bo'lim sarlavhasi: ustida kichik izoh (`text-caption`), ostida `text-h1 leading-7 font-bold`. */
export function MobileTitleHeader({ eyebrow, title, action }: MobileTitleHeaderProps) {
  return (
    <View style={styles.titleHeader}>
      <View style={styles.titleText}>
        <DsText v="caption" c="ink-secondary" numberOfLines={1}>
          {eyebrow}
        </DsText>
        <DsText v="h1" w="700" numberOfLines={1} style={styles.titleH1}>
          {title}
        </DsText>
      </View>
      {action}
    </View>
  );
}

export interface MobileStatsCardProps {
  icon?: IconName;
  label: ReactNode;
  actionLabel?: ReactNode;
  onAction?: () => void;
  items: Array<{ id: string; value: ReactNode; label: ReactNode }>;
}

/** Ko'k statistika kartasi: tepada belgi + izoh, ostida uchta oq-shaffof katak. */
export function MobileStatsCard({ icon = "bar-chart", label, actionLabel, onAction, items }: MobileStatsCardProps) {
  const ds = useDs();
  return (
    <View style={[styles.stats, { backgroundColor: ds.c.brand }]}>
      <View style={styles.statsHead}>
        <View style={[styles.statsChip, { backgroundColor: ds.c["on-brand-subtle"] }]}>
          <Icon name={icon} size={14} color={ds.c["on-action"]} />
          <DsText v="caption" c="on-action" numberOfLines={1}>
            {label}
          </DsText>
        </View>
        {actionLabel ? (
          <Pressable accessibilityRole="button" onPress={onAction}>
            <DsText v="caption" c="on-action">
              {actionLabel}
            </DsText>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.statsGrid}>
        {items.map((item) => (
          <View key={item.id} style={[styles.statsCell, { backgroundColor: ds.c["on-brand-subtle"] }]}>
            <DsText c="on-action" w="600" numberOfLines={1} style={styles.statsValue}>
              {item.value}
            </DsText>
            <DsText v="caption" c="on-action" w="400" numberOfLines={1}>
              {item.label}
            </DsText>
          </View>
        ))}
      </View>
    </View>
  );
}

export interface MobileListRowProps {
  icon?: IconName;
  /** Vebdagi klass satri, masalan `"bg-brand-subtle text-brand"`. */
  tone?: string;
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  titleColor?: DsColor;
  chevron?: boolean;
  /** Ro'yxatning oxirgi qatori — chegara yo'q (`last:border-b-0`). */
  last?: boolean;
  onPress?: () => void;
}

/** `min-h-[69px] border-b px-4 py-3 gap-3`; chapda `size-10 rounded-md` belgi. */
export function MobileListRow({
  icon,
  tone = "bg-brand-subtle text-brand",
  leading,
  title,
  subtitle,
  trailing,
  titleColor = "ink",
  chevron = true,
  last = false,
  onPress,
}: MobileListRowProps) {
  const ds = useDs();
  const colors = toneColors(tone, ds);
  const body = (
    <>
      {leading ??
        (icon ? (
          <View style={[styles.rowIcon, { backgroundColor: colors.bg }]}>
            <Icon name={icon} size={20} color={colors.fg ?? ds.c.ink} />
          </View>
        ) : null)}
      <View style={styles.rowText}>
        <DsText v="title" c={titleColor} numberOfLines={1}>
          {title}
        </DsText>
        {subtitle ? (
          <DsText v="body-sm" c="ink-secondary" numberOfLines={1}>
            {subtitle}
          </DsText>
        ) : null}
      </View>
      {trailing}
      {chevron ? <Icon name="chevron-right" size={20} color={ds.c["icon-secondary"]} /> : null}
    </>
  );
  const rowStyle = [styles.row, last ? styles.rowLast : { borderBottomWidth: 1, borderBottomColor: ds.c.line }];
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [rowStyle, pressed && { backgroundColor: ds.c.subtle }]}
    >
      {body}
    </Pressable>
  ) : (
    <View style={rowStyle}>{body}</View>
  );
}

/** `rounded-xl bg-surface py-1` — qatorlar kartasi. */
export function MobileListCard({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const ds = useDs();
  return <View style={[styles.listCard, { backgroundColor: ds.c.surface }, style]}>{children}</View>;
}

/** `text-title leading-5 font-normal` sarlavha va o'ngda ixtiyoriy amal. */
export function MobileSectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <View style={styles.sectionTitle}>
      <DsText v="title" w="400" style={styles.sectionTitleText}>
        {children}
      </DsText>
      {action}
    </View>
  );
}

export interface MobileSearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel?: string;
  clearLabel: string;
  autoFocus?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** `h-12 rounded-full border-[1.5px] bg-surface px-3.5 gap-3`; fokusda `border-focus`. */
export function MobileSearchField({ value, onChange, placeholder, ariaLabel, clearLabel, autoFocus, style }: MobileSearchFieldProps) {
  const ds = useDs();
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.search, { backgroundColor: ds.c.surface, borderColor: focused ? ds.c.focus : "transparent" }, style]}>
      <Icon name="search" size={20} color={ds.c["ink-secondary"]} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={ds.c["ink-secondary"]}
        accessibilityLabel={ariaLabel ?? placeholder}
        selectionColor={ds.c.brand}
        autoFocus={autoFocus}
        autoCorrect={false}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[styles.searchInput, { color: ds.c.ink }]}
      />
      {value ? <SearchClear label={clearLabel} onPress={() => onChange("")} /> : null}
    </View>
  );
}

/** `size-6 rounded-full bg-subtle` ichida `close` belgisi. */
export function SearchClear({ label, onPress }: { label: string; onPress: () => void }) {
  const ds = useDs();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={8}
      style={[styles.clear, { backgroundColor: ds.c.subtle }]}
    >
      <Icon name="close" size={14} color={ds.c["ink-secondary"]} />
    </Pressable>
  );
}

/** Ro'yxat yuklanayotganda — qatorlar shaklidagi xira bloklar. */
export function MobileListSkeleton({ rows = 5, card = false, style }: { rows?: number; card?: boolean; style?: StyleProp<ViewStyle> }) {
  const ds = useDs();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.skeletonList, card && { borderRadius: dsRadius.xl, backgroundColor: ds.c.surface, paddingVertical: 4 }, style]}
    >
      {Array.from({ length: rows }, (_, index) => (
        <View key={index} style={[styles.skeletonRow, { paddingVertical: card ? 14 : 20 }]}>
          <View style={[styles.skeletonTime, { backgroundColor: ds.c.subtle }]} />
          <View style={[styles.skeletonTile, { backgroundColor: ds.c.subtle }]} />
          <View style={styles.skeletonLines}>
            <View style={[styles.skeletonLine, { width: 140, height: 14, backgroundColor: ds.c.subtle }]} />
            <View style={[styles.skeletonLine, { width: 90, height: 12, backgroundColor: ds.c.subtle }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

export interface MobileEmptyCardProps {
  icon: IconName;
  title: ReactNode;
  description?: ReactNode;
  action?: { label: ReactNode; icon?: IconName; onPress: () => void; disabled?: boolean };
  /** Belgi rangi — standart `brand`. */
  iconColor?: DsColor;
  /** Izoh uchun ichki chetlar (standart `max-w-[310px] px-4`). */
  descriptionStyle?: StyleProp<ViewStyle>;
}

/** Bo'sh holat kartasi: `size-18` doira belgi, sarlavha, izoh va ixtiyoriy tugma. */
export function MobileEmptyCard({ icon, title, description, action, iconColor = "brand", descriptionStyle }: MobileEmptyCardProps) {
  const ds = useDs();
  return (
    <View style={[styles.empty, { backgroundColor: ds.c.surface }]}>
      <View style={[styles.emptyIcon, { backgroundColor: ds.c["brand-subtle"] }]}>
        <Icon name={icon} size={30} color={ds.c[iconColor]} />
      </View>
      <DsText v="title" heading w="500" style={styles.emptyTitle}>
        {title}
      </DsText>
      {description ? (
        <View style={[styles.emptyDescription, descriptionStyle]}>
          <DsText v="body-sm" c="ink-secondary" style={styles.center}>
            {description}
          </DsText>
        </View>
      ) : null}
      {action ? (
        <Pressable
          accessibilityRole="button"
          disabled={action.disabled}
          onPress={action.onPress}
          style={({ pressed }) => [
            styles.emptyAction,
            { backgroundColor: pressed ? ds.c["brand-strong"] : ds.c.brand },
            action.disabled && styles.buttonDisabled,
          ]}
        >
          {action.icon ? <Icon name={action.icon} size={18} color={ds.c["on-action"]} /> : null}
          <DsText v="button" c="on-action">
            {action.label}
          </DsText>
        </Pressable>
      ) : null}
    </View>
  );
}

export interface MobileSegmentProps<T extends string> {
  items: Array<{ id: T; label: ReactNode }>;
  value: T;
  onChange: (value: T) => void;
  /** Gorizontal suriladigan (`w-28.5` tugmalar) yoki teng bo'lingan (`flex-1`). */
  scroll?: boolean;
}

/** `h-11 rounded-full border px-4 text-body-sm font-medium`; faoli `bg-brand`. */
export function MobileSegment<T extends string>({ items, value, onChange, scroll = false }: MobileSegmentProps<T>) {
  const ds = useDs();
  const buttons = items.map((item) => {
    const active = value === item.id;
    return (
      <Pressable
        key={item.id}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        onPress={() => onChange(item.id)}
        style={({ pressed }) => [
          styles.segment,
          scroll ? styles.segmentScroll : styles.segmentFlex,
          active
            ? { borderColor: ds.c.brand, backgroundColor: ds.c.brand }
            : { borderColor: ds.c.line, backgroundColor: pressed ? ds.c.subtle : ds.c.surface },
        ]}
      >
        <DsText v="body-sm" w="500" c={active ? "on-action" : "ink"} numberOfLines={1}>
          {item.label}
        </DsText>
      </Pressable>
    );
  });

  if (!scroll) {
    return (
      <View accessibilityRole="tablist" style={styles.segments}>
        {buttons}
      </View>
    );
  }
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="tablist"
      style={styles.segmentScroller}
      contentContainerStyle={styles.segmentsScroll}
    >
      {buttons.map((button, index) => (
        <Fragment key={index}>{button}</Fragment>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { textAlign: "center" },
  disabled: { opacity: 0.5 },
  header: { height: 44, flexDirection: "row", alignItems: "center", gap: 12 },
  headerTitle: { flex: 1, minWidth: 0, textAlign: "center" },
  round: { width: 44, height: 44, borderRadius: dsRadius.full, alignItems: "center", justifyContent: "center" },
  button: { flex: 1, minWidth: 0, height: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 20, borderRadius: dsRadius.full },
  buttonDisabled: { opacity: 0.4 },
  actionBar: { flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingTop: 12, borderTopLeftRadius: dsRadius["2xl"], borderTopRightRadius: dsRadius["2xl"] },
  screenBody: { paddingHorizontal: 16, paddingBottom: 24 },
  warning: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderRadius: dsRadius.xl },
  warningText: { flex: 1, minWidth: 0, lineHeight: 18 },
  titleHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  titleText: { flex: 1, minWidth: 0, gap: 2, marginTop: -2 },
  titleH1: { lineHeight: 28, letterSpacing: 0 },
  stats: { gap: 14, padding: 16, paddingBottom: 17, borderRadius: dsRadius.xl },
  statsHead: { height: 24, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  statsChip: { height: 24, flexShrink: 1, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, borderRadius: dsRadius.full },
  statsGrid: { flexDirection: "row", gap: 8 },
  statsCell: { flex: 1, minWidth: 0, height: 60, justifyContent: "center", paddingLeft: 12, paddingRight: 6, borderRadius: dsRadius.md },
  statsValue: { fontSize: 20, lineHeight: 24 },
  row: { minHeight: 69, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  rowLast: { minHeight: 68 },
  rowIcon: { width: 40, height: 40, borderRadius: dsRadius.md, alignItems: "center", justifyContent: "center" },
  rowText: { flex: 1, minWidth: 0 },
  listCard: { overflow: "hidden", paddingVertical: 4, borderRadius: dsRadius.xl },
  sectionTitle: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  sectionTitleText: { lineHeight: 20 },
  search: { height: 48, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, borderWidth: 1.5, borderRadius: dsRadius.full },
  searchInput: { flex: 1, minWidth: 0, height: "100%", paddingVertical: 0, fontSize: dsType["body-sm"].fontSize, fontFamily: bodyFont("400") },
  clear: { width: 24, height: 24, borderRadius: dsRadius.full, alignItems: "center", justifyContent: "center" },
  skeletonList: { overflow: "hidden" },
  skeletonRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16 },
  skeletonTime: { width: 44, height: 36, borderRadius: dsRadius.sm },
  skeletonTile: { width: 44, height: 44, borderRadius: dsRadius.md },
  skeletonLines: { flex: 1, minWidth: 0, gap: 8 },
  skeletonLine: { maxWidth: "100%", borderRadius: dsRadius.full },
  empty: { alignItems: "center", paddingHorizontal: 24, paddingVertical: 28, borderRadius: dsRadius.xl },
  emptyIcon: { width: 72, height: 72, borderRadius: dsRadius.full, alignItems: "center", justifyContent: "center" },
  emptyTitle: { marginTop: 12, textAlign: "center" },
  emptyDescription: { marginTop: 12, maxWidth: 310, paddingHorizontal: 16 },
  emptyAction: { marginTop: 12, height: 44, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 20, borderRadius: dsRadius.full },
  segments: { flexDirection: "row", gap: 8 },
  segmentScroller: { marginHorizontal: -16, flexGrow: 0 },
  segmentsScroll: { gap: 8, paddingHorizontal: 16 },
  segment: { height: 44, alignItems: "center", justifyContent: "center", paddingHorizontal: 16, borderWidth: 1, borderRadius: dsRadius.full },
  segmentFlex: { flex: 1, minWidth: 0 },
  /*
   * `w-28.5` — CSS'da `whitespace-nowrap` matni ichki chetdan chiqib ham
   * to'liq ko'rinadi ("Hammasi · 14"); RN esa uni qisqartiradi. Matn baribir
   * markazda, shuning uchun ichki chet olib tashlanadi.
   */
  segmentScroll: { width: 114, paddingHorizontal: 0 },
});
