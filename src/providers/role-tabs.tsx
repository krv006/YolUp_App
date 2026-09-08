import { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { LucideIcon } from "lucide-react-native";
import { fontSize, radius, Text, useTheme } from "@/shared/ui";

export interface TabDefinition {
  /** Marshrut fayli nomi: `chats`, `schedule`, … */
  name: string;
  label: string;
  icon: LucideIcon;
}

/** Ikonka qatori balandligi — pastki xavfsiz zona bunga QO'SHILADI. */
const BAR_HEIGHT = 58;

/*
 * Panel proplarining tipi `Tabs` ning O'ZIDAN chiqariladi.
 *
 * `@react-navigation/bottom-tabs` dan import qilib bo'lmaydi: expo-router
 * o'zining NUSXA tiplarini ishlatadi va ikkalasi bir-biriga mos kelmaydi
 * (`BottomTabNavigationOptions` farq qiladi). Bu yerda esa tip har doim
 * o'rnatilgan expo-router versiyasiga mos bo'ladi.
 */
type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>["tabBar"]>>[0];

/**
 * Rol bo'limlarining pastki tab paneli.
 *
 * Veb'da bu yon panel (`ConversationRail` / `PortalLayout`) edi. Mobilda yon
 * panel yaramaydi: ekran tor, va bosh barmoq ekranning pastki qismiga yetadi —
 * shuning uchun asosiy navigatsiya pastda turadi.
 *
 * `hidden` marshrutlar tabda ko'rinmaydi, lekin mavjud bo'ladi: veb bilan
 * bir xil yo'llar saqlanishi kerak (masalan `/teacher/dashboard` chatsga
 * yo'naltiradi), aks holda `resolveHomeRoute` va eski havolalar sinadi.
 */
export function RoleTabs({
  tabs,
  hidden = [],
}: {
  tabs: readonly TabDefinition[];
  hidden?: readonly string[];
}) {
  const { palette } = useTheme();
  const iconByRoute = new Map(tabs.map((tab) => [tab.name, tab.icon]));

  return (
    <Tabs
      tabBar={(props) => <RoleTabBar {...props} iconByRoute={iconByRoute} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: palette.background },
      }}
    >
      {tabs.map(({ name, label }) => (
        <Tabs.Screen key={name} name={name} options={{ title: label }} />
      ))}

      {hidden.map((name) => (
        <Tabs.Screen key={name} name={name} options={{ href: null }} />
      ))}
    </Tabs>
  );
}

/**
 * Panelning o'zi qo'lda chiziladi.
 *
 * NEGA STANDART PANEL EMAS: undan oldin balandlik `height: 60` va
 * `paddingBottom: 8` qilib QAT'IY yozilgan edi. Jest-navigatsiyali
 * telefonda pastki xavfsiz zona 24–48px bo'ladi, natijada tizimning
 * navigatsiya chizig'i tab yozuvlarini bosib turardi.
 *
 * Endi balandlik `insets.bottom` dan hisoblanadi. Qo'lda chizish yana
 * Telegramdagidek tanlangan tabni yumaloq fon bilan ajratish imkonini
 * beradi (buyurtmachi namunasi: `docs/ChatExport_2026-09-08/photo_6`).
 */
function RoleTabBar({
  state,
  descriptors,
  navigation,
  iconByRoute,
}: TabBarProps & { iconByRoute: Map<string, LucideIcon> }) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();

  /*
   * Ichki stack'ning ildizidan chuqurroq ekranda panel YASHIRILADI.
   *
   * Buyurtmachi: "Chat detailga kirganda pastdagi bottom bar kerak emas".
   * Bu qoida bitta ekranga emas, hamma joyga tegishli: suhbat, test
   * tafsiloti va boshqa ichki ekranlarda ham asosiy navigatsiya xalaqit
   * beradi va joy egallaydi. Shuning uchun tekshiruv PANELNING O'ZIDA —
   * har bir ekranda qo'lda `tabBarStyle` yozib chiqish shart emas va
   * yangi ichki ekran qo'shilganda unutilmaydi.
   */
  const activeRoute = state.routes[state.index];
  const nestedIndex = activeRoute?.state?.index ?? 0;
  if (nestedIndex > 0) return null;

  return (
    <View
      style={[
        styles.bar,
        {
          height: BAR_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
          backgroundColor: palette.surface,
          borderTopColor: palette.border,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];

        // `hidden` marshrutlar `tabs` ro'yxatida yo'q, demak ikonkasi ham
        // yo'q — panelda chizilmaydi.
        const Icon = iconByRoute.get(route.name);
        if (!Icon) return null;

        const focused = state.index === index;
        const label = options.title ?? route.name;

        function onPress() {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          // Bosilgan tab allaqachon ochiq bo'lsa navigatsiya qilinmaydi —
          // aks holda stack ildizga qaytib, ochiq suhbat yopilib ketardi.
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        }

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            onPress={onPress}
            style={styles.item}
          >
            <View
              style={[
                styles.pill,
                focused && { backgroundColor: palette["primary-tint"] },
              ]}
            >
              <Icon
                size={21}
                color={focused ? palette["primary-text"] : palette["muted-foreground"]}
                strokeWidth={focused ? 2.4 : 2}
              />
            </View>
            <Text
              numberOfLines={1}
              style={[
                styles.label,
                { color: focused ? palette["primary-text"] : palette["muted-foreground"] },
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 6,
  },
  item: { flex: 1, alignItems: "center", gap: 2 },
  pill: {
    minWidth: 52,
    height: 28,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontSize: fontSize["2xs"], fontWeight: "600" },
});
