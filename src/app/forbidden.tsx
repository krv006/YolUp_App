import { StyleSheet, View } from "react-native";
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
  return (
    <Screen>
      <ScreenEmpty
        title="Bu bo'limga ruxsat yo'q"
        description="Hisobingiz ushbu sahifani ko'rish huquqiga ega emas."
      />
      <View style={styles.actions}>
        <Link href={ROUTES.root}>
          <Text tone="brand" variant="label">
            Bosh sahifaga qaytish
          </Text>
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({ actions: { alignItems: "center", paddingBottom: 32 } });
