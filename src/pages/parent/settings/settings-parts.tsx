import type { ReactNode } from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { DsText, dsRadius, Icon, MobileInput, useDs, type DsColor, type IconName, type MobileInputProps } from "@/shared/ui";

export interface ToneLook {
  bg: DsColor;
  fg: DsColor;
}

/**
 * Sozlamalar qatori — veb `settings-mobile-*.tsx` dagi `MenuRow` / `Row`:
 * `size-11 rounded-xl` belgi, sarlavha va izoh, o'ngda qo'shimcha (almashtirgich,
 * qiymat) yoki strelka. `danger` — qizil sarlavha, strelkasiz.
 */
export function SettingsItem({
  icon,
  tone,
  title,
  text,
  onPress,
  danger = false,
  chevron,
  last,
  children,
}: {
  icon: IconName;
  tone: ToneLook;
  title: string;
  text?: string;
  onPress?: () => void;
  danger?: boolean;
  /** Standart: bosiladigan va xavfli bo'lmagan qatorda. */
  chevron?: boolean;
  last: boolean;
  children?: ReactNode;
}) {
  const ds = useDs();
  const body = (
    <>
      <View style={[styles.icon, { backgroundColor: ds.c[tone.bg] }]}>
        <Icon name={icon} size={22} color={ds.c[tone.fg]} />
      </View>
      <View style={styles.text}>
        <DsText v="title-sm" c={danger ? "error-text" : "ink"}>
          {title}
        </DsText>
        {text ? (
          <DsText v="body-xs" c="ink-secondary" numberOfLines={1}>
            {text}
          </DsText>
        ) : null}
      </View>
      {children}
      {(chevron ?? (Boolean(onPress) && !danger)) ? <Icon name="chevron-right" size={20} color={ds.c["icon-tertiary"]} /> : null}
    </>
  );
  const border = !last && { borderBottomWidth: 1, borderBottomColor: ds.c.line };
  return onPress ? (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, border, pressed && { backgroundColor: ds.c.subtle }]}>
      {body}
    </Pressable>
  ) : (
    <View style={[styles.row, border]}>{body}</View>
  );
}

/** Qatorlar kartasi — `flex flex-col overflow-hidden rounded-[20px] bg-surface`. */
export function SettingsCard({ children, style }: { children: ReactNode; style?: object }) {
  const ds = useDs();
  return <View style={[styles.card, { backgroundColor: ds.c.surface }, style]}>{children}</View>;
}

/** Bo'lim sarlavhasi — `px-1 text-body-sm text-ink-secondary`. */
export function SettingsLabel({ children }: { children: ReactNode }) {
  return (
    <DsText v="body-sm" c="ink-secondary" style={styles.label}>
      {children}
    </DsText>
  );
}

/** Forma maydoni — `MOBILE_INPUT_SURFACE` (`bg-surface`), xatoda qizil ramka va belgi, ostida izoh yoki xato. */
export function SettingsField({
  label,
  hint,
  error,
  containerStyle,
  ...props
}: MobileInputProps & { label: string; hint?: string; error?: string; containerStyle?: StyleProp<ViewStyle> }) {
  const ds = useDs();
  return (
    <View style={[styles.field, containerStyle]}>
      <DsText v="body-sm" w="500">
        {label}
      </DsText>
      <View>
        <MobileInput surface invalid={Boolean(error)} style={error ? styles.inputError : undefined} {...props} />
        {error ? (
          <View pointerEvents="none" style={styles.inputIcon}>
            <Icon name="warning-fill" size={20} color={ds.c["error-text"]} />
          </View>
        ) : null}
      </View>
      {error ? (
        <DsText v="body-xs" c="error-text">
          {error}
        </DsText>
      ) : hint ? (
        <DsText v="body-xs" c="ink-tertiary">
          {hint}
        </DsText>
      ) : null}
    </View>
  );
}

/** Xatolar soni lentasi — `flex items-center gap-3 rounded-2xl bg-danger-bg px-4 py-3`. */
export function ErrorsNote({ children }: { children: ReactNode }) {
  const ds = useDs();
  return (
    <View style={[styles.errors, { backgroundColor: ds.c["danger-bg"] }]}>
      <Icon name="warning-fill" size={20} color={ds.c["error-text"]} />
      <DsText v="body-sm" w="500" c="error-text" style={styles.text}>
        {children}
      </DsText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { overflow: "hidden", borderRadius: 20 },
  /* `flex items-center gap-3 px-4 py-3.5` */
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  icon: { width: 44, height: 44, borderRadius: dsRadius.xl, alignItems: "center", justifyContent: "center" },
  text: { flex: 1, minWidth: 0 },
  label: { paddingHorizontal: 4 },
  field: { minWidth: 0, gap: 8 },
  inputError: { paddingRight: 48 },
  inputIcon: { position: "absolute", right: 16, top: 0, bottom: 0, justifyContent: "center" },
  errors: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderRadius: dsRadius["2xl"] },
});
