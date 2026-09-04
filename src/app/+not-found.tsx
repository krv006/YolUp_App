import { Link } from "expo-router";
import { StyleSheet, View } from "react-native";
import { ROUTES } from "@/shared/config";
import { Screen, ScreenEmpty, Text } from "@/shared/ui";

export default function NotFoundRoute() {
  return (
    <Screen>
      <ScreenEmpty
        title="Sahifa topilmadi"
        description="Havola eskirgan yoki noto'g'ri bo'lishi mumkin."
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
