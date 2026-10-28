import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { Atom, ChevronLeft, ChevronRight, Plus, Redo2, Undo2 } from "lucide-react-native";
import { DsText, dsRadius, Icon, useDs, type DsColor, type IconName } from "@/shared/ui";
import { MOBILE_BOARD_COLORS, MOBILE_BOARD_WIDTHS } from "../constants/board.constants";
import type { DrawKind } from "../lib/board.geometry";

/** Veb `board-toolbar.tsx` dagi tur — mobilda keng ekran paneli yo'q, tur shu yerda. */
export type BoardTool = DrawKind | "text" | "math" | "erase";

const TOOLS: Array<{ id: BoardTool; labelKey: string; icon: IconName; size: number }> = [
  { id: "marker", labelKey: "tools.marker", icon: "board-marker", size: 21 },
  { id: "pen", labelKey: "tools.pen", icon: "board-pen", size: 24 },
  { id: "line", labelKey: "tools.line", icon: "board-line", size: 24 },
  { id: "arrow", labelKey: "tools.arrow", icon: "board-arrow", size: 22 },
  { id: "rect", labelKey: "tools.rect", icon: "board-rect", size: 24 },
  { id: "ellipse", labelKey: "tools.ellipse", icon: "board-ellipse", size: 24 },
  { id: "text", labelKey: "tools.text", icon: "board-text", size: 21 },
  { id: "math", labelKey: "tools.math", icon: "board-sigma", size: 21 },
  { id: "erase", labelKey: "tools.erase", icon: "board-eraser", size: 20 },
];

const PLAIN_TOOLS: BoardTool[] = ["text", "math", "erase"];

export interface MobileBoardHeaderProps {
  title: ReactNode;
  subtitle: ReactNode;
  live?: boolean;
  backLabel: string;
  onBack: () => void;
  pill?: ReactNode;
  action?: ReactNode;
}

/** Doska sarlavhasi — veb `board-mobile.tsx`: orqaga, nom va izoh (jonli nuqta), holat va amal. */
export function MobileBoardHeader({ title, subtitle, live, backLabel, onBack, pill, action }: MobileBoardHeaderProps) {
  const ds = useDs();
  return (
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel={backLabel} onPress={onBack} style={[styles.round, { backgroundColor: ds.c.surface }]}>
        <ChevronLeft size={20} color={ds.c.ink} />
      </Pressable>
      <View style={styles.grow}>
        <DsText v="title" numberOfLines={1}>
          {title}
        </DsText>
        <View style={styles.subtitle}>
          {live ? <View style={[styles.liveDot, { backgroundColor: ds.c.danger }]} /> : null}
          <DsText v="caption" w="400" c="ink-secondary" numberOfLines={1} style={styles.shrink}>
            {subtitle}
          </DsText>
        </View>
      </View>
      {pill}
      {action}
    </View>
  );
}

/** Sarlavhadagi holat — `h-8 rounded-full px-3 gap-1.5 text-caption-strong`. */
export function MobileBoardPill({
  icon,
  tone,
  children,
  onPress,
}: {
  icon: (color: string) => ReactNode;
  tone: "success" | "neutral" | "warning";
  children: ReactNode;
  onPress?: () => void;
}) {
  const ds = useDs();
  const colors: Record<typeof tone, { bg: string; fg: DsColor }> = {
    success: { bg: ds.c["success-bg"], fg: "success-fg" },
    warning: { bg: ds.c["warning-bg"], fg: "warning-fg" },
    neutral: { bg: ds.c.subtle, fg: "ink-secondary" },
  };
  const { bg, fg } = colors[tone];
  return (
    <Pressable accessibilityRole={onPress ? "button" : undefined} disabled={!onPress} onPress={onPress} style={[styles.pill, { backgroundColor: bg }]}>
      {icon(ds.c[fg])}
      <DsText v="caption-strong" c={fg} numberOfLines={1}>
        {children}
      </DsText>
    </Pressable>
  );
}

export interface MobileBoardToolbarProps {
  tool: BoardTool;
  color: string;
  width: number;
  onToolChange: (tool: BoardTool) => void;
  onColorChange: (color: string) => void;
  onWidthChange: (width: number) => void;
  onPeriodic?: () => void;
}

/**
 * Asboblar — tepada ranglar va qalinlik (matn, formula va o'chirgichda
 * yashiriladi), pastda asboblar qatori; kimyo yoqilgan bo'lsa davriy jadval.
 */
export function MobileBoardToolbar({ tool, color, width, onToolChange, onColorChange, onWidthChange, onPeriodic }: MobileBoardToolbarProps) {
  const { t } = useTranslation("board");
  const ds = useDs();
  const plain = PLAIN_TOOLS.includes(tool);
  const button = onPeriodic ? styles.toolSmall : styles.tool;
  return (
    <View
      accessibilityRole="toolbar"
      accessibilityLabel={t("tools.toolbarAria")}
      style={[styles.toolbar, plain ? styles.toolbarPlain : styles.toolbarFull, { backgroundColor: ds.c.surface, boxShadow: ds.shadow.sm }]}
    >
      {plain ? null : (
        <View style={styles.swatches}>
          {MOBILE_BOARD_COLORS.map((value) => {
            const active = color.toLowerCase() === value;
            return (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityLabel={t("tools.colorLabel", { value })}
                accessibilityState={{ selected: active }}
                onPress={() => onColorChange(value)}
                style={styles.swatch}
              >
                {active ? (
                  <View style={[styles.swatchRing, { borderColor: value }]}>
                    <View style={[styles.swatchInner, { backgroundColor: value }]} />
                  </View>
                ) : (
                  <View style={[styles.swatchDot, { backgroundColor: value }]} />
                )}
              </Pressable>
            );
          })}
          <View style={[styles.divider, { backgroundColor: ds.c.line }]} />
          {MOBILE_BOARD_WIDTHS.map((value, index) => {
            const active = width === value;
            return (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityLabel={t("tools.widthLabel", { value })}
                accessibilityState={{ selected: active }}
                onPress={() => onWidthChange(value)}
                style={[styles.widthButton, index > 0 && styles.widthGap, active && { backgroundColor: ds.c.brand }]}
              >
                <View style={{ width: value + 2, height: value + 2, borderRadius: (value + 2) / 2, backgroundColor: ds.c.ink }} />
              </Pressable>
            );
          })}
        </View>
      )}
      <View style={styles.tools}>
        {TOOLS.map(({ id, labelKey, icon, size }) => {
          const active = tool === id;
          const erase = id === "erase";
          return (
            <Pressable
              key={id}
              accessibilityRole="button"
              accessibilityLabel={t(labelKey)}
              accessibilityState={{ selected: active }}
              onPress={() => onToolChange(id)}
              style={[button, active && { backgroundColor: erase ? ds.c["danger-bg"] : ds.c.brand }]}
            >
              <Icon name={icon} size={size} color={active ? (erase ? ds.c.danger : ds.c["on-action"]) : ds.c.ink} />
            </Pressable>
          );
        })}
        {onPeriodic ? (
          <Pressable accessibilityRole="button" accessibilityLabel={t("periodic.button")} onPress={onPeriodic} style={button}>
            <Atom size={20} color={ds.c.ink} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export interface MobileBoardFooterProps {
  page: number;
  total: number;
  canUndo: boolean;
  canRedo: boolean;
  showHistory: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onPrev: () => void;
  onNext: () => void;
  onPages: () => void;
  onAdd?: () => void;
}

/** Sahifa almashtirgich — `rounded-full bg-surface px-3`, o'rtada "1 / 3" (sahifalar oynasini ochadi). */
export function MobileBoardPageNav({
  page,
  total,
  onPrev,
  onNext,
  onPages,
  height = 64,
  tight = false,
}: Pick<MobileBoardFooterProps, "page" | "total" | "onPrev" | "onNext" | "onPages"> & { height?: number; tight?: boolean }) {
  const { t } = useTranslation("board");
  const ds = useDs();
  return (
    <View style={[styles.pageNav, tight && styles.pageNavTight, { height, borderRadius: height / 2, backgroundColor: ds.c.surface }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={t("sheet.prev")} disabled={page <= 1} onPress={onPrev} style={styles.round}>
        <ChevronLeft size={18} color={page <= 1 ? ds.c["ink-tertiary"] : ds.c.ink} />
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onPages} style={styles.pageLabel}>
        <DsText v="title-sm" style={styles.center}>
          {page} / {total}
        </DsText>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={t("sheet.next")} disabled={page >= total} onPress={onNext} style={styles.round}>
        <ChevronRight size={18} color={page >= total ? ds.c["ink-tertiary"] : ds.c.ink} />
      </Pressable>
    </View>
  );
}

/** Pastki qator — bekor qilish/qaytarish, sahifalar va "+ Sahifa". */
export function MobileBoardFooter(props: MobileBoardFooterProps) {
  const { t } = useTranslation("board");
  const ds = useDs();
  return (
    <View style={styles.footer}>
      {props.showHistory ? (
        <View style={[styles.history, { backgroundColor: ds.c.surface }]}>
          <Pressable accessibilityRole="button" accessibilityLabel={t("mobile.undo")} disabled={!props.canUndo} onPress={props.onUndo} style={styles.historyButton}>
            <Undo2 size={20} color={props.canUndo ? ds.c.ink : ds.c["ink-tertiary"]} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={t("mobile.redo")} disabled={!props.canRedo} onPress={props.onRedo} style={styles.historyButton}>
            <Redo2 size={20} color={props.canRedo ? ds.c.ink : ds.c["ink-tertiary"]} />
          </Pressable>
        </View>
      ) : (
        <View style={styles.historySpacer} />
      )}
      <MobileBoardPageNav {...props} tight />
      {props.onAdd ? (
        <Pressable
          accessibilityRole="button"
          onPress={props.onAdd}
          style={({ pressed }) => [styles.add, { backgroundColor: pressed ? ds.c["brand-strong"] : ds.c.brand }]}
        >
          <Plus size={18} color={ds.c["on-action"]} />
          <DsText v="title-sm" c="on-action" numberOfLines={1}>
            {t("sheet.addSheet")}
          </DsText>
        </Pressable>
      ) : (
        <View style={styles.addSpacer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  shrink: { flexShrink: 1 },
  center: { textAlign: "center" },
  header: { height: 44, flexDirection: "row", alignItems: "center", gap: 12 },
  round: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  subtitle: { flexDirection: "row", alignItems: "center", gap: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  pill: { height: 32, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, borderRadius: 16 },
  /* `flex-col gap-2.5 rounded-2xl px-2.5`; to'liq: `pt-[7px] pb-[9px]`, oddiy: `py-2.5` */
  toolbar: { gap: 10, paddingHorizontal: 10, borderRadius: dsRadius["2xl"] },
  toolbarFull: { paddingTop: 7, paddingBottom: 9 },
  toolbarPlain: { paddingVertical: 10 },
  swatches: { height: 32, flexDirection: "row", alignItems: "center" },
  swatch: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  swatchRing: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  swatchInner: { width: 16, height: 16, borderRadius: 8 },
  swatchDot: { width: 22, height: 22, borderRadius: 11 },
  divider: { width: 1, height: 20, marginLeft: 7, marginRight: 8 },
  widthButton: { width: 28, height: 28, borderRadius: dsRadius.sm, alignItems: "center", justifyContent: "center" },
  widthGap: { marginLeft: 10 },
  tools: { height: 36, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  tool: { width: 36, height: 36, borderRadius: dsRadius.md, alignItems: "center", justifyContent: "center" },
  toolSmall: { width: 32, height: 32, borderRadius: dsRadius.md, alignItems: "center", justifyContent: "center" },
  /* `px-3`; pastki qatorda `px-2.5` — RN shrifti kengroq, "+ Sahifa" ekran chetiga tegmasin */
  pageNav: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12 },
  pageNavTight: { paddingHorizontal: 10 },
  pageLabel: { minWidth: 56, alignSelf: "stretch", justifyContent: "center" },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  history: { height: 40, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, borderRadius: 20 },
  historyButton: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  historySpacer: { width: 78 },
  /* `px-4` -> 12: yuqoridagi sabab */
  add: { height: 40, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, borderRadius: 20 },
  addSpacer: { width: 98 },
});
