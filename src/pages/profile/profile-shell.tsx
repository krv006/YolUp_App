import { Children, isValidElement, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoleRoutes } from "@/modules/auth";
import { DsGradient, DsText, dsRadius, Icon, MobileActionBar, MobilePageHeader, toneColors, useDs, type IconName } from "@/shared/ui";
import { SETTINGS_TONES } from "./settings-tones";

/**
 * Profilning ichki sahifasi — veb `profile-shell.tsx` dagi `ProfileSubPage`
 * (tor ekran): orqaga va sarlavha, ixtiyoriy izoh, bo'limlar `gap-5`;
 * pastda `MobileActionBar` va uning ustida xato izohi.
 */
export function ProfileSubPage({
  title,
  description,
  children,
  footer,
  footerNote,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  footerNote?: ReactNode;
}) {
  const { t } = useTranslation("account");
  const ds = useDs();
  const router = useRouter();
  const routes = useRoleRoutes();
  const insets = useSafeAreaInsets();

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace(routes.profile as never);
  }

  return (
    <View style={[styles.fill, { backgroundColor: ds.c.canvas }]}>
      <KeyboardAwareScrollView
        style={styles.fill}
        contentContainerStyle={[styles.page, { paddingTop: insets.top + 20, paddingBottom: footer ? 24 : insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        bottomOffset={footer ? 110 : 24}
      >
        <DsGradient name="auth" />
        <MobilePageHeader title={title} backLabel={t("page.back")} onBack={goBack} />
        {description ? (
          <DsText v="body-sm" c="ink-secondary" style={styles.description}>
            {description}
          </DsText>
        ) : null}
        <View style={[styles.body, { marginTop: description ? 14 : 20 }]}>{children}</View>
      </KeyboardAwareScrollView>

      {footer ? (
        <View>
          {footerNote ? <View style={styles.footerNote}>{footerNote}</View> : null}
          <MobileActionBar>{footer}</MobileActionBar>
        </View>
      ) : null}
    </View>
  );
}

/** Sozlamalar bo'limi — sarlavha va `rounded-xl bg-surface` ichida qatorlar (orasida chiziq). */
export function SettingsSection({ label, children }: { label: string; children: ReactNode }) {
  const ds = useDs();
  const rows = Children.toArray(children).filter(isValidElement);
  return (
    <View style={styles.section}>
      <DsText v="title" w="400" style={styles.sectionLabel}>
        {label}
      </DsText>
      <View style={[styles.sectionCard, { backgroundColor: ds.c.surface }]}>
        {rows.map((row, index) => (
          <View key={row.key ?? index} style={index > 0 ? { borderTopWidth: 1, borderTopColor: ds.c.line } : undefined}>
            {row}
          </View>
        ))}
      </View>
    </View>
  );
}

/** Sozlamalar qatori — `min-h-[68px] px-4 py-[14px] gap-3`, chapda `size-10 rounded-md` belgi. */
export function SettingsRow({
  icon,
  tone = SETTINGS_TONES.brand,
  title,
  hint,
  value,
  right,
  onPress,
  danger = false,
}: {
  icon: IconName;
  tone?: string;
  title: string;
  hint?: ReactNode;
  value?: ReactNode;
  right?: ReactNode;
  onPress?: () => void;
  danger?: boolean;
}) {
  const ds = useDs();
  const colors = toneColors(tone, ds);
  const content = (
    <>
      <View style={[styles.rowIcon, { backgroundColor: colors.bg }]}>
        <Icon name={icon} size={20} color={colors.fg ?? ds.c.ink} />
      </View>
      <View style={styles.grow}>
        <DsText v="title" c={danger ? "error-text" : "ink"} numberOfLines={1}>
          {title}
        </DsText>
        {hint ? (
          <DsText v="body-sm" c="ink-secondary" numberOfLines={1} style={styles.hint}>
            {hint}
          </DsText>
        ) : null}
      </View>
      {value ? (
        <DsText v="body-xs" numberOfLines={1} style={styles.value}>
          {value}
        </DsText>
      ) : null}
      {right}
      {onPress && !right ? <Icon name="chevron-right" size={20} color={ds.c["icon-secondary"]} /> : null}
    </>
  );

  if (!onPress) return <View style={styles.row}>{content}</View>;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, pressed && { backgroundColor: ds.c.subtle }]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  /* `px-4 pt-5 pb-6` */
  page: { paddingHorizontal: 16 },
  description: { marginTop: 20 },
  body: { gap: 20 },
  footerNote: { position: "absolute", left: 16, right: 16, bottom: "100%", marginBottom: 12 },
  section: { gap: 13 },
  sectionLabel: { lineHeight: 20 },
  sectionCard: { overflow: "hidden", borderRadius: dsRadius.xl },
  row: { minHeight: 68, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  rowIcon: { width: 40, height: 40, borderRadius: dsRadius.md, alignItems: "center", justifyContent: "center" },
  hint: { lineHeight: 22 },
  value: { flexShrink: 1 },
});
