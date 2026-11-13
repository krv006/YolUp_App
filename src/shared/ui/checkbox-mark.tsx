import { StyleSheet, View } from "react-native";
import { useDs } from "./ds";
import { Icon } from "./icon";

/**
 * Belgilash katakchasi belgisi (🆕 mobil). Tanlanganda `check-box-fill`,
 * tanlanmaganda bo'sh kvadrat. Vebda bu joylarda native `<input
 * type="checkbox">` turadi; `check-box` ikonkasining ichida belgi bor, shuning
 * uchun tanlanmagan holat uchun yaramaydi.
 */
export function CheckboxMark({ checked, size = 20 }: { checked: boolean; size?: number }) {
  const ds = useDs();
  if (checked) return <Icon name="check-box-fill" size={size} color={ds.c.brand} />;
  const box = size * 0.8;
  return <View style={[styles.box, { width: box, height: box, margin: (size - box) / 2, borderColor: ds.c["icon-secondary"] }]} />;
}

const styles = StyleSheet.create({
  box: { borderWidth: 2, borderRadius: 3 },
});
