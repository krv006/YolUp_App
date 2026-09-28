import { Link } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { ROUTES } from "@/shared/config";
import { Screen, ScreenEmpty, Text } from "@/shared/ui";

export default function NotFoundRoute() {
  const { t } = useTranslation("mobile");
  return (
    <Screen>
      <ScreenEmpty
        title={t("app.sahifa_topilmadi")}
        description={t("app.havola_eskirgan_yoki_notogri_bolishi_mumkin")}
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
