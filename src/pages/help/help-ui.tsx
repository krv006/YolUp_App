import { Children, isValidElement, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { highlightParts, type SupportTicketStatus } from "@/modules/support";
import { DsText, dsRadius, Icon, MobileEmptyCard, MobileListRow, MobileListSkeleton, toneColors, useDs, type DsColor, type IconName } from "@/shared/ui";

/*
 * Yordam markazining umumiy bloklari — veb `pages/help/help-ui.tsx` ning
 * mobil (tor ekran) qismi. Tailwind klasslari izohda.
 */

/** Qidiruv so'zini ajratib ko'rsatish — `<mark class="text-brand">`. */
export function Highlight({ text, query }: { text: string; query: string }) {
  const ds = useDs();
  return (
    <>
      {highlightParts(text, query).map((part, index) =>
        part.match ? (
          <Text key={index} style={{ color: ds.c.brand }}>
            {part.text}
          </Text>
        ) : (
          <Text key={index}>{part.text}</Text>
        )
      )}
    </>
  );
}

/** `flex flex-col overflow-hidden rounded-xl bg-surface`. */
export function HelpCard({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const ds = useDs();
  return <View style={[styles.card, { backgroundColor: ds.c.surface }, style]}>{children}</View>;
}

/** `flex flex-col gap-3`: `text-title` sarlavha va o'ngda `text-body-sm text-brand` amal. */
export function HelpSection({ title, action, children }: { title: ReactNode; action?: { label: string; onPress: () => void }; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <DsText v="title" w="400" style={styles.grow}>
          {title}
        </DsText>
        {action ? (
          <Pressable accessibilityRole="button" onPress={action.onPress} hitSlop={8}>
            <DsText v="body-sm" c="brand">
              {action.label}
            </DsText>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

export interface HelpRowProps {
  icon: string;
  tone: string;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  chevron?: boolean;
}

/** Qatorlar kartasi `py-1` — oxirgi qatorda chiziq yo'q (`last:border-b-0`). */
export function HelpRows({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const rows = Children.toArray(children).filter(isValidElement<HelpRowProps>);
  return (
    <HelpCard style={[styles.rows, style]}>
      {rows.map((row, index) => (
        <HelpRow key={row.key ?? index} {...row.props} last={index === rows.length - 1} />
      ))}
    </HelpCard>
  );
}

/** `min-h-[69px] border-b px-4 py-3 gap-3`; chapda `size-10 rounded-md` belgi. */
export function HelpRow({ icon, tone, title, subtitle, trailing, onPress, chevron = true, last = false }: HelpRowProps & { last?: boolean }) {
  return (
    <MobileListRow
      icon={icon as IconName}
      tone={tone}
      title={title}
      subtitle={subtitle}
      trailing={trailing}
      chevron={chevron}
      last={last}
      onPress={onPress}
    />
  );
}

/** Belgi plitkasi — `grid size-10 place-items-center rounded-md {tone}`. */
export function ToneTile({ icon, tone, size = 40, iconSize = 20, radius = dsRadius.md }: { icon: string; tone: string; size?: number; iconSize?: number; radius?: number }) {
  const ds = useDs();
  const colors = toneColors(tone, ds);
  return (
    <View style={[styles.tile, { width: size, height: size, borderRadius: radius, backgroundColor: colors.bg }]}>
      <Icon name={icon as IconName} size={iconSize} color={colors.fg ?? ds.c.ink} />
    </View>
  );
}

const STATUS_LOOK: Record<SupportTicketStatus, { icon: IconName; bg: DsColor; fg: DsColor }> = {
  open: { icon: "quiz", bg: "brand-subtle", fg: "brand" },
  answered: { icon: "check-circle", bg: "success-bg", fg: "success-fg" },
  closed: { icon: "edit", bg: "accent-violet-bg", fg: "accent-violet-fg" },
};

/** `inline-flex h-6 rounded-full px-2 gap-1 text-caption-strong`. */
export function StatusChip({ status }: { status: SupportTicketStatus }) {
  const { t } = useTranslation("help");
  const ds = useDs();
  const look = STATUS_LOOK[status];
  return (
    <View style={[styles.chip, { backgroundColor: ds.c[look.bg] }]}>
      <Icon name={look.icon} size={14} color={ds.c[look.fg]} />
      <DsText v="caption-strong" c={look.fg}>
        {t(`status.${status}`)}
      </DsText>
    </View>
  );
}

/** Gorizontal tablar — `h-11 rounded-full border px-4`, tanlangani `bg-brand`. */
export function ChipTabs<T extends string>({ items, value, onChange }: { items: Array<{ id: T; label: ReactNode }>; value: T; onChange: (value: T) => void }) {
  const ds = useDs();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs} accessibilityRole="tablist">
      {items.map((item) => {
        const on = value === item.id;
        return (
          <Pressable
            key={item.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(item.id)}
            style={({ pressed }) => [
              styles.tab,
              { borderColor: on ? ds.c.brand : ds.c.line, backgroundColor: on ? ds.c.brand : pressed ? ds.c.subtle : ds.c.surface },
            ]}
          >
            <DsText v="body-sm" w="500" c={on ? "on-action" : "ink"} numberOfLines={1}>
              {item.label}
            </DsText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** Tugmasimon "pill"lar — `flex-wrap gap-2`, `h-11 rounded-full border bg-surface px-4`. */
export function Pills({ items }: { items: Array<{ id: string; label: string; onPress: () => void }> }) {
  const ds = useDs();
  return (
    <View style={styles.pills}>
      {items.map((item) => (
        <Pressable
          key={item.id}
          accessibilityRole="button"
          onPress={item.onPress}
          style={({ pressed }) => [styles.pill, { borderColor: ds.c.line, backgroundColor: pressed ? ds.c.subtle : ds.c.surface }]}
        >
          <DsText v="body-sm" numberOfLines={1}>
            {item.label}
          </DsText>
        </Pressable>
      ))}
    </View>
  );
}

/** Bo'sh holat — veb `EmptyBlock` (`plain` — kartasiz). */
export function EmptyBlock({
  icon,
  title,
  text,
  action,
  plain = false,
}: {
  icon: string;
  title: ReactNode;
  text?: ReactNode;
  action?: { label: ReactNode; icon?: string; onPress: () => void };
  plain?: boolean;
}) {
  const card = (
    <MobileEmptyCard
      icon={icon as IconName}
      title={title}
      description={text}
      action={action ? { label: action.label, icon: action.icon as IconName | undefined, onPress: action.onPress } : undefined}
    />
  );
  return plain ? <View style={styles.plain}>{card}</View> : card;
}

export function RowsSkeleton({ rows = 4 }: { rows?: number }) {
  return <MobileListSkeleton rows={rows} card />;
}

/** Bosh sahifa yuklanmoqda — hero, ikki kategoriya, qatorlar. */
export function HomeSkeleton() {
  const ds = useDs();
  return (
    <View style={styles.skeleton} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[styles.skeletonHero, { backgroundColor: ds.c.skeleton }]} />
      <View style={[styles.skeletonLine, { backgroundColor: ds.c.skeleton }]} />
      <View style={styles.skeletonGrid}>
        <View style={[styles.skeletonCell, { backgroundColor: ds.c.surface }]} />
        <View style={[styles.skeletonCell, { backgroundColor: ds.c.surface }]} />
      </View>
      <View style={[styles.skeletonLine, { backgroundColor: ds.c.skeleton }]} />
      <RowsSkeleton rows={4} />
    </View>
  );
}

/** `h-11 rounded-xl bg-surface-inverse px-4 gap-3`: "Internet yo'q". */
export function OfflineBanner() {
  const { t } = useTranslation("help");
  const ds = useDs();
  return (
    <View accessibilityRole="alert" style={[styles.offline, { backgroundColor: ds.c["surface-inverse"] }]}>
      <Icon name="wifi" size={20} color={ds.c["ink-inverse"]} />
      <DsText v="body-sm" c="ink-inverse" style={styles.grow}>
        {t("states.offline")}
      </DsText>
    </View>
  );
}

export function LoadError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation("help");
  return <EmptyBlock icon="wifi" title={t("states.errorTitle")} text={t("states.errorText")} action={{ label: t("states.retry"), icon: "refresh", onPress: onRetry }} />;
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  card: { overflow: "hidden", borderRadius: dsRadius.xl },
  rows: { paddingVertical: 4 },
  section: { gap: 12, minWidth: 0 },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  tile: { alignItems: "center", justifyContent: "center", flexShrink: 0 },
  chip: { height: 24, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, borderRadius: 12, alignSelf: "flex-start" },
  tabs: { gap: 8 },
  tab: { height: 44, alignItems: "center", justifyContent: "center", paddingHorizontal: 16, borderWidth: 1, borderRadius: 22 },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: { height: 44, maxWidth: "100%", justifyContent: "center", paddingHorizontal: 16, borderWidth: 1, borderRadius: 22 },
  plain: { paddingVertical: 4 },
  skeleton: { gap: 20 },
  skeletonHero: { height: 168, borderRadius: dsRadius["2xl"] },
  skeletonLine: { width: 140, height: 16, borderRadius: 8 },
  skeletonGrid: { flexDirection: "row", gap: 12 },
  skeletonCell: { flex: 1, height: 100, borderRadius: dsRadius.xl },
  offline: { height: 44, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, borderRadius: dsRadius.xl },
});
