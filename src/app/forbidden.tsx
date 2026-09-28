import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Link } from "expo-router";
import { ROUTES } from "@/shared/config";
import { Screen, ScreenEmpty, Text } from "@/shared/ui";

/**
 * "Ruxsat yo'q" ekrani — veb `ForbiddenPage` (403) ning mobil varianti.
 *
 * Rol mos kelmaganda `RoleRoute` bosh sahifaga qaytaradi (foydalanuvchi
 * bu yerga ataylab emas, eski havola orqali tushadi). Bu ekran esa
 * BACKEND 403 qaytarganda va chuqur havola orqali ochiladi.
 */
export default function ForbiddenRoute() {
  const { t } = useTranslation("mobile");
  return (
    <Screen>
      <ScreenEmpty
        title={t("app.bu_bolimga_ruxsat_yoq")}
        description={t("app.hisobingiz_ushbu_sahifani_korish_huquqiga_eg")}
      />
      <View style={styles.actions}>
        <Link href={ROUTES.root}>
          <Text tone="brand" variant="label">
            {t("app.bosh_sahifaga_qaytish")}
          </Text>
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({ actions: { alignItems: "center", paddingBottom: 32 } });
