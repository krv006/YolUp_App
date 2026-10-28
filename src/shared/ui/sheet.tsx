import { useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { radius } from "./tokens";
import { useTheme } from "./theme";
import { Text } from "./text";
import { IconButton } from "./misc";
import { DsText, dsRadius, useDs } from "./ds";
import { Icon } from "./icon";

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  /**
   * `app` — yangi dizayndagi pastki oyna (veb `AppDialog` sheet): 24px
   * burchak, ingichka tutqich, `text-h2` sarlavha, 44px yopish tugmasi.
   */
  variant?: "classic" | "app";
  /** Faqat `app`: aylanmaydigan pastki tugmalar qatori (`px-4 pt-6 gap-3`). */
  footer?: ReactNode;
  /** Faqat `app`: kichik sarlavha (`text-title-lg font-semibold`) va `pt-5` pastki qator — tanlagich oynalari. */
  compact?: boolean;
}

/** Shu masofadan ko'p sudralsa yopiladi. */
const CLOSE_DISTANCE = 120;
/** Yoki shu tezlikdan tez uloqtirilsa — masofadan qat'i nazar. */
const CLOSE_VELOCITY = 900;

/**
 * Pastdan ochiladigan oyna — veb `Dialog` ning mobil o'rni.
 *
 * `@gorhom/bottom-sheet` ATAYLAB olinmadi: bu yerda bir nechta to'xtash
 * nuqtasi yoki ro'yxat bilan chuqur integratsiya kerak emas. Sudrab yopish
 * va klaviatura ishlovi quyida qo'lda yozilgan — bu bitta nativ
 * bog'liqlikni kamaytiradi.
 *
 * ┌─ KLAVIATURA ────────────────────────────────────────────────────────┐
 * │ Ilgari `behavior={Platform.OS === "ios" ? "padding" : undefined}`   │
 * │ turardi. Androiddagi `undefined` — "oynaning o'zi kichrayadi"       │
 * │ degani, lekin `edgeToEdgeEnabled=true` bo'lgani uchun Android 15+   │
 * │ oynani KICHRAYTIRMAYDI. Natijada input klaviatura ostida qolardi —  │
 * │ va bu `Sheet` ni ishlatuvchi 22 ta faylning HAMMASIDA sodir bo'lardi.│
 * │ Endi `react-native-keyboard-controller` ishlatiladi: u klaviatura   │
 * │ balandligini edge-to-edge rejimida ham to'g'ri beradi.              │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * ┌─ SUDRASH ───────────────────────────────────────────────────────────┐
 * │ Ilgari tutqich shunchaki bo'yalgan to'rtburchak edi va yopish uchun │
 * │ X tugmasini bosishga majbur qilardi. Endi butun oynani sudrash      │
 * │ mumkin, LEKIN faqat ichki ro'yxat eng tepada turganda — aks holda   │
 * │ ro'yxatni pastga aylantirmoqchi bo'lgan har harakat oynani yopib    │
 * │ yuborardi.                                                          │
 * │                                                                     │
 * │ Sudrash ro'yxat bilan BIR VAQTDA tanilishi shart                    │
 * │ (`simultaneousWithExternalGesture`). Usiz Pan faollashganda ichki   │
 * │ `ScrollView` ning nativ gesture'i BEKOR qilinardi: ro'yxat pastga   │
 * │ aylantirilgach, barmoqni pastga tortish Pan'ni faollashtirardi,     │
 * │ Pan esa `scrollY > 0` bo'lgani uchun hech narsa qilmasdi — natijada │
 * │ OYNA UMUMAN AYLANMAY QOLARDI (22 ta oynaning hammasida).            │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * ┌─ NEGA ICHKARIDA YANA `GestureHandlerRootView` ────────────────────────┐
 * │ RN `Modal` ALOHIDA nativ oyna yaratadi, gesture-handler esa har bir  │
 * │ ildizda o'z o'ramini talab qiladi. `app-providers.tsx` dagi o'ram bu │
 * │ oynaga YETIB BORMAYDI. Usiz `GestureDetector` jimgina ishlamaydi:    │
 * │ xato chiqmaydi, shunchaki sudrash sezilmaydi — aynan shu sabab oyna  │
 * │ dastlab qo'l bilan surilmagan edi.                                   │
 * └─────────────────────────────────────────────────────────────────────┘
 */
export function Sheet({ open, onClose, title, description, children, variant = "classic", footer, compact = false }: SheetProps) {
  const { t } = useTranslation("mobile");
  const { palette } = useTheme();
  const ds = useDs();
  const app = variant === "app";
  const insets = useSafeAreaInsets();

  const translateY = useSharedValue(0);
  const scrollY = useSharedValue(0);
  /*
   * Sudrash boshlangandan beri ro'yxatni aylantirishga "sarflangan" masofa.
   *
   * Bitta harakat ichida foydalanuvchi avval ro'yxatni tepaga aylantirib,
   * keyin oynani sudrashi mumkin. `translationY` esa harakat BOSHIDAN
   * hisoblanadi, shuning uchun usiz ro'yxat tepaga yetgan lahzada oyna
   * to'satdan sakrab tushardi.
   */
  const dragBase = useSharedValue(0);

  // Har ochilishda holat nolga qaytadi — aks holda oldingi safar sudralgan
  // masofa saqlanib qolib, oyna yarmi ko'rinib ochilardi.
  useEffect(() => {
    if (open) {
      translateY.set(0);
      scrollY.set(0);
      dragBase.set(0);
    }
  }, [open, translateY, scrollY, dragBase]);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.set(event.contentOffset.y);
  });

  /*
   * Ro'yxatning NATIV aylantirish gesture'i.
   *
   * Sudrash u bilan bir vaqtda tanilishi uchun kerak. `ref` o'rniga
   * `Gesture.Native()` olingan: `useAnimatedRef` gesture-handler kutadigan
   * ref turiga to'g'ri kelmaydi va uni faqat cast bilan berish mumkin
   * bo'lardi.
   */
  const scrollGesture = Gesture.Native();

  const pan = Gesture.Pan()
    /*
     * Faqat PASTGA sudralganda faollashadi va yuqoriga harakatda bekor
     * bo'ladi — ya'ni ro'yxatni aylantirish gesture'i buzilmaydi.
     * Usiz har qanday teginish oynani qimirlatib yuborardi.
     */
    .activeOffsetY(12)
    .failOffsetY(-12)
    // Ro'yxat o'z ishini davom ettirsin — izohi yuqorida, "SUDRASH" da.
    .simultaneousWithExternalGesture(scrollGesture)
    .onBegin(() => {
      dragBase.set(0);
    })
    .onUpdate((event) => {
      /*
       * Ro'yxat hali tepada emas: bu harakat AYLANTIRISH, sudrash emas.
       * Oyna qimirlamaydi, faqat boshlanish nuqtasi suriladi.
       */
      if (scrollY.get() > 0) {
        dragBase.set(event.translationY);
        translateY.set(0);
        return;
      }
      translateY.set(Math.max(0, event.translationY - dragBase.get()));
    })
    .onEnd((event) => {
      const dragged = event.translationY - dragBase.get();
      const farEnough = dragged > CLOSE_DISTANCE;
      const fastEnough = event.velocityY > CLOSE_VELOCITY;

      if ((farEnough || fastEnough) && scrollY.get() <= 0) {
        // Oyna ekrandan chiqib ketmasin: `Modal` ning o'z yopilish
        // animatsiyasi qolganini bajaradi, biz faqat uzatamiz.
        translateY.set(withTiming(dragged, { duration: 0 }));
        runOnJS(onClose)();
      } else {
        translateY.set(withSpring(0, { damping: 20, stiffness: 220 }));
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.get() }],
  }));

  // Sudralgan sari orqa fon shaffoflashadi — harakat "jonli" his qilinadi.
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, 1 - translateY.get() / (CLOSE_DISTANCE * 2)),
  }));

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <GestureHandlerRootView style={styles.fill}>
        <KeyboardAvoidingView style={styles.root} behavior="padding">
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("shared.yopish")}
            style={[StyleSheet.absoluteFill, { backgroundColor: app ? ds.c.scrim : palette.overlay }]}
            onPress={onClose}
          />
        </Animated.View>

        <GestureDetector gesture={pan}>
          <Animated.View
            style={[
              styles.sheet,
              app
                ? [styles.appSheet, { backgroundColor: ds.c.surface, paddingBottom: footer ? 0 : insets.bottom + 16 }]
                : {
                    backgroundColor: palette["surface-elevated"],
                    borderColor: palette.border,
                    paddingBottom: insets.bottom + 16,
                  },
              sheetStyle,
            ]}
          >
            <View style={app ? [styles.appGrabber, { backgroundColor: ds.c.line }] : [styles.grabber, { backgroundColor: palette["border-strong"] }]} />

            {app ? (
              <View style={styles.appHead}>
                <View style={styles.appTitle}>
                  <DsText v={compact ? "title-lg" : "h2"} w="600" style={compact ? null : styles.appTitleText}>
                    {title}
                  </DsText>
                  {description ? (
                    <DsText v="body-sm" c="ink-secondary">
                      {description}
                    </DsText>
                  ) : null}
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("shared.yopish")}
                  onPress={onClose}
                  style={({ pressed }) => [styles.appClose, { backgroundColor: pressed ? ds.c.muted : ds.c.subtle }]}
                >
                  <Icon name="close" size={18} color={ds.c.ink} />
                </Pressable>
              </View>
            ) : (
            <View style={styles.head}>
              <View style={styles.headBody}>
                <Text variant="subheading">{title}</Text>
                {description ? (
                  <Text variant="caption" tone="muted">
                    {description}
                  </Text>
                ) : null}
              </View>
              <IconButton accessibilityLabel={t("shared.yopish")} onPress={onClose}>
                <X size={20} color={palette["muted-foreground"]} />
              </IconButton>
            </View>
            )}

            <GestureDetector gesture={scrollGesture}>
              <Animated.ScrollView
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={app ? styles.appBody : styles.body}
              >
                {children}
              </Animated.ScrollView>
            </GestureDetector>
            {app && footer ? (
              <View style={[styles.appFooter, compact && styles.appFooterCompact, { paddingBottom: Math.max(compact ? 24 : 16, insets.bottom + 8) }]}>{footer}</View>
            ) : null}
          </Animated.View>
        </GestureDetector>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  sheet: {
    // Ekranning ko'pi bilan 88% i — orqadagi kontekst ko'rinib tursin.
    maxHeight: "88%",
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  grabber: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, marginBottom: 10 },
  head: { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 16, gap: 8 },
  headBody: { flex: 1, gap: 2, paddingTop: 6 },
  body: { padding: 16, gap: 14 },
  /* Veb `AppDialog` sheet: `rounded-t-2xl bg-surface` */
  appSheet: { borderTopLeftRadius: dsRadius["2xl"], borderTopRightRadius: dsRadius["2xl"], borderWidth: 0, paddingTop: 0 },
  /* `mx-auto mt-2 mb-px h-[5px] w-10 rounded-full bg-line` */
  appGrabber: { alignSelf: "center", width: 40, height: 5, borderRadius: dsRadius.full, marginTop: 8, marginBottom: 1 },
  /* `items-center gap-3 px-4 pt-4` */
  appHead: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingTop: 16 },
  appTitle: { flex: 1, minWidth: 0, gap: 2 },
  appTitleText: { lineHeight: 24 },
  appClose: { width: 44, height: 44, borderRadius: dsRadius.full, alignItems: "center", justifyContent: "center" },
  /* `-mx-1 gap-4 px-5 pt-4.5 pb-1` */
  appBody: { gap: 16, paddingHorizontal: 16, paddingTop: 18, paddingBottom: 4 },
  /* `items-center gap-3 px-4 pt-6 pb-[max(16px,safe)]` */
  appFooter: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingTop: 24 },
  appFooterCompact: { paddingTop: 20 },
});
