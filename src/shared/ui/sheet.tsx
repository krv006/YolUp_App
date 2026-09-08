import { useEffect, type ReactNode } from "react";
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

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
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
export function Sheet({ open, onClose, title, description, children }: SheetProps) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();

  const translateY = useSharedValue(0);
  const scrollY = useSharedValue(0);

  // Har ochilishda holat nolga qaytadi — aks holda oldingi safar sudralgan
  // masofa saqlanib qolib, oyna yarmi ko'rinib ochilardi.
  useEffect(() => {
    if (open) {
      translateY.set(0);
      scrollY.set(0);
    }
  }, [open, translateY, scrollY]);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.set(event.contentOffset.y);
  });

  const pan = Gesture.Pan()
    /*
     * Faqat PASTGA sudralganda faollashadi va yuqoriga harakatda bekor
     * bo'ladi — ya'ni ro'yxatni aylantirish gesture'i buzilmaydi.
     * Usiz har qanday teginish oynani qimirlatib yuborardi.
     */
    .activeOffsetY(12)
    .failOffsetY(-12)
    .onUpdate((event) => {
      // Faqat PASTGA va faqat ro'yxat tepada turganda.
      if (event.translationY > 0 && scrollY.get() <= 0) {
        translateY.set(event.translationY);
      }
    })
    .onEnd((event) => {
      const farEnough = event.translationY > CLOSE_DISTANCE;
      const fastEnough = event.velocityY > CLOSE_VELOCITY;

      if ((farEnough || fastEnough) && scrollY.get() <= 0) {
        // Oyna ekrandan chiqib ketmasin: `Modal` ning o'z yopilish
        // animatsiyasi qolganini bajaradi, biz faqat uzatamiz.
        translateY.set(withTiming(event.translationY, { duration: 0 }));
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
            accessibilityLabel="Yopish"
            style={[StyleSheet.absoluteFill, { backgroundColor: palette.overlay }]}
            onPress={onClose}
          />
        </Animated.View>

        <GestureDetector gesture={pan}>
          <Animated.View
            style={[
              styles.sheet,
              {
                backgroundColor: palette["surface-elevated"],
                borderColor: palette.border,
                paddingBottom: insets.bottom + 16,
              },
              sheetStyle,
            ]}
          >
            <View style={[styles.grabber, { backgroundColor: palette["border-strong"] }]} />

            <View style={styles.head}>
              <View style={styles.headBody}>
                <Text variant="subheading">{title}</Text>
                {description ? (
                  <Text variant="caption" tone="muted">
                    {description}
                  </Text>
                ) : null}
              </View>
              <IconButton accessibilityLabel="Yopish" onPress={onClose}>
                <X size={20} color={palette["muted-foreground"]} />
              </IconButton>
            </View>

            <Animated.ScrollView
              onScroll={scrollHandler}
              scrollEventThrottle={16}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.body}
            >
              {children}
            </Animated.ScrollView>
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
});
