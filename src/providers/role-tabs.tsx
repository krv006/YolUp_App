import { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Icon, radius, Text, useTheme, type IconName } from "@/shared/ui";

export interface TabDefinition {
  /** Marshrut fayli nomi: `chats`, `schedule`, … */
  name: string;
  /**
   * Tarjima KALITI, tayyor matn emas.
   *
   * Bo'limlar ro'yxati layout fayllarida modul darajasida e'lon qilinadi,
   * u yerda esa hook chaqirib bo'lmaydi. Shuning uchun tarjima shu
   * komponentda, chizish paytida qilinadi.
   */
  labelKey: string;
  /**
   * Veb ikonkasi nomi (`assets/icons/*.svg`).
   *
   * Ilgari bu yerda `lucide-react-native` komponenti turardi. Veb o'z
   * to'plamini ishlatadi va u TO'LDIRILGAN uslubda — yonma-yon qo'yilganda
   * farq darhol ko'rinadi, shuning uchun ikonkalar ham vebdan ko'chirildi
   * (izohi `shared/ui/icon.tsx` da).
   */
  iconName: IconName;
  /**
   * Shu bo'limga TEGISHLI, lekin panelda ko'rinmaydigan marshrutlar.
   *
   * Ular ochilganda bo'lim FAOL bo'lib turadi. Usiz, masalan, Workspace
   * ichidan "Test" ochilganda panelda birorta ham bo'lim ajratilmasdi va
   * foydalanuvchi qayerdaligini bilmasdi.
   */
  owns?: readonly string[];
}

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
  const { t } = useTranslation("mobile");
  const iconByRoute = new Map(tabs.map((tab) => [tab.name, tab.iconName]));
  const ownsByRoute = new Map(tabs.map((tab) => [tab.name, tab.owns ?? []]));

  return (
    <Tabs
      tabBar={(props) => (
        <RoleTabBar {...props} iconByRoute={iconByRoute} ownsByRoute={ownsByRoute} />
      )}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: palette.background },
      }}
    >
      {tabs.map(({ name, labelKey }) => (
        <Tabs.Screen key={name} name={name} options={{ title: t(labelKey) }} />
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
  ownsByRoute,
}: TabBarProps & {
  iconByRoute: Map<string, IconName>;
  ownsByRoute: Map<string, readonly string[]>;
}) {
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
    /*
     * Ikki qatlam: tashqi o'ram TARTIBDA JOY EGALLAYDI, ichkarisi esa
     * suzuvchi plastinka bo'lib ko'rinadi (Telegram naqshi — buyurtmachi
     * namunasi: docs/ChatExport_2026-09-08/photo_6).
     *
     * NEGA `position: absolute` EMAS: suzuvchi panel ostidagi kontentni
     * bekitadi va uni tuzatish uchun HAR bir ekranga pastki to'ldirish
     * qo'shish kerak bo'lardi — yangi ekran qo'shilganda esa unutilardi.
     * Bu yerda o'ram joy egallagani uchun ro'yxatlar o'z-o'zidan panel
     * ustida tugaydi.
     */
    <View style={[styles.wrap, { backgroundColor: palette.background }]}>
      {/*
        * Pastki bo'shliq (home chizig'i / gesture panel) PANELNING o'zida —
        * oq fon ekranning eng pastigacha boradi (vebdagidek). Avval o'ramda
        * edi va iPhone'da panel ostida sahifa rangidagi kulrang chiziq qolardi.
        */}
      <View
        style={[
          styles.bar,
          {
            paddingBottom: insets.bottom + 8,
            backgroundColor: palette["surface-elevated"],
            borderColor: palette.border,
            shadowColor: palette.shadow,
          },
        ]}
      >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];

        // `hidden` marshrutlar `tabs` ro'yxatida yo'q, demak ikonkasi ham
        // yo'q — panelda chizilmaydi.
        const iconName = iconByRoute.get(route.name);
        if (!iconName) return null;

        /*
         * Bo'lim o'zi ochilganda YOKI unga tegishli yashirin marshrut
         * ochilganda faol ko'rinadi (`owns` — izohi tipda).
         */
        const focused =
          state.index === index ||
          (activeRoute ? (ownsByRoute.get(route.name) ?? []).includes(activeRoute.name) : false);
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
            {/* Telegramda tanlangan bo'lim IKONKA VA YORLIQNI birga
                o'rab turgan yumaloq fon bilan ajratiladi. */}
            <View style={styles.itemInner}>
              {/*
               * Plastinka FAQAT IKONKANI o'raydi — vebda ham shunday
               * (o'lchami u yerdan olingan: 56x28). Ilgari u ikonka bilan
               * yorliqni birga o'rardi.
               */}
              <View
                style={[
                  styles.iconWrap,
                  focused && { backgroundColor: palette["primary-soft"] },
                ]}
              >
                <Icon
                  name={iconName}
                  size={24}
                  color={focused ? palette.primary : palette["muted-foreground"]}
                />
              </View>
              <Text
                numberOfLines={1}
                style={[
                  styles.label,
                  { color: focused ? palette.primary : palette["muted-foreground"] },
                ]}
              >
                {label}
              </Text>
            </View>
          </Pressable>
        );
      })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /*
   * O'lchamlar veb DOM'idan olindi (390px kenglikda):
   *   panel      balandlik 68, oq fon, TEPA burchaklari 24, tepa chegara 1px,
   *              bo'shliq 6/8/0
   *   element    radius 13, bo'shliq 6/8, oraliq 4
   *   ikonka plastinkasi  56x28, radius 999, faol fonda #eef2ff
   *   yorliq     12/16, qalinlik 600
   *
   * ILGARI panel SUZUVCHI plastinka edi (yon chekkalarda bo'shliq, to'liq
   * yumaloq, soya bilan). Vebda u ekran kengligida turadi va faqat tepa
   * burchaklari yumaloq.
   */
  wrap: {},
  bar: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderTopLeftRadius: radius["2xl"],
    borderTopRightRadius: radius["2xl"],
    borderTopWidth: 1,
    paddingTop: 6,
    paddingHorizontal: 8,
  },
  item: { flex: 1, alignItems: "center" },
  itemInner: { alignItems: "center", gap: 4, paddingVertical: 6, paddingHorizontal: 8 },
  iconWrap: {
    width: 56,
    height: 28,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontSize: 12, lineHeight: 16, fontWeight: "600" },
});
