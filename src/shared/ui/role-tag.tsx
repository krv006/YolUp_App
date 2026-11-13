import { useTranslation } from "react-i18next";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { DsText, useDs } from "./ds";

const LABELLED_ROLES = new Set(["teacher", "student", "parent"]);

/**
 * Rol yorlig'i — veb `role-tag.tsx`: "O'qituvchi / O'quvchi / Kuzatuvchi".
 * `inline-flex h-5 rounded-full bg-brand-subtle px-2 text-caption-strong text-brand-strong`.
 */
export function RoleTag({ role, style }: { role?: string | null; style?: StyleProp<ViewStyle> }) {
  const { t } = useTranslation("nav");
  const ds = useDs();
  if (!role || !LABELLED_ROLES.has(role)) return null;
  return (
    <View style={[styles.tag, { backgroundColor: ds.c["brand-subtle"] }, style]}>
      <DsText v="caption-strong" c="brand-strong" numberOfLines={1}>
        {t(`roles.${role}`)}
      </DsText>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: { height: 20, flexShrink: 0, justifyContent: "center", paddingHorizontal: 8, borderRadius: 10 },
});
