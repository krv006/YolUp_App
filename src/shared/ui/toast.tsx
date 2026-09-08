import { useEffect } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  FadeInUp,
  FadeOutUp,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react-native";
import { create } from "zustand";
import { fontSize, MIN_TOUCH_SIZE, radius } from "./tokens";
import { useTheme } from "./theme";
import { Text } from "./text";

/**
 * `sonner` ning mobil o'rnini bosuvchi (shim).
 *
 * NEGA SHIM: veb domen qatlamining 14 ta fayli `import { toast } from "sonner"`
 * yozadi. Ular 🟢 NUSXA — bayt-bayt ko'chirilgan va tahrirlanmaydi
 * (MOBILE_PLAN §18.3). Import satrini o'zgartirsak, ular 🟡 ga aylanardi va
 * veb'dagi har o'zgarish qo'lda birlashtirishni talab qilardi.
 *
 * Shuning uchun fayllar emas, MODUL YECHIMI almashtiriladi:
 *   tsconfig.json  -> paths: { "sonner": ["./src/shared/ui/toast"] }
 *   metro.config.js -> resolveRequest shu faylga yo'naltiradi
 *
 * API sonner bilan mos: `toast(msg, opts)` va `.success/.error/.warning/.info`.
 * `action`/`cancel` da `onClick` nomi ataylab saqlangan — chaqiruvchi kod
 * veb bilan bir xil.
 */

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  description?: string;
  /** Millisekund. Berilmasa turiga qarab tanlanadi. */
  duration?: number;
  action?: ToastAction;
  cancel?: ToastAction;
  id?: string;
}

export type ToastVariant = "default" | "success" | "error" | "warning" | "info";

export interface ToastItem extends ToastOptions {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
}

/** Xato uzoqroq turadi — foydalanuvchi o'qib ulgurishi kerak. */
const DEFAULT_DURATION: Record<ToastVariant, number> = {
  default: 4_000,
  success: 3_000,
  error: 6_000,
  warning: 5_000,
  info: 4_000,
};

/** Ekranni to'ldirib yubormaslik uchun bir vaqtda ko'rinadiganlari cheklangan. */
const MAX_VISIBLE = 3;

/** Shu masofadan ko'p surilsa yo'q qilinadi. */
const SWIPE_DISTANCE = 80;

interface ToastState {
  items: ToastItem[];
  push: (item: ToastItem) => void;
  dismiss: (id?: string) => void;
}

const useToastStore = create<ToastState>()((set) => ({
  items: [],
  push: (item) =>
    set((state) => ({
      // Bir xil id qayta kelsa — yangilanadi, dublikat qo'shilmaydi.
      items: [...state.items.filter((existing) => existing.id !== item.id), item].slice(-MAX_VISIBLE),
    })),
  dismiss: (id) =>
    set((state) => ({
      items: id ? state.items.filter((item) => item.id !== id) : [],
    })),
}));

let counter = 0;

function show(variant: ToastVariant, message: string, options: ToastOptions = {}): string {
  const id = options.id ?? `toast-${++counter}`;
  useToastStore.getState().push({
    ...options,
    id,
    message,
    variant,
    duration: options.duration ?? DEFAULT_DURATION[variant],
  });
  return id;
}

export const toast = Object.assign(
  (message: string, options?: ToastOptions) => show("default", message, options),
  {
    success: (message: string, options?: ToastOptions) => show("success", message, options),
    error: (message: string, options?: ToastOptions) => show("error", message, options),
    warning: (message: string, options?: ToastOptions) => show("warning", message, options),
    info: (message: string, options?: ToastOptions) => show("info", message, options),
    dismiss: (id?: string) => useToastStore.getState().dismiss(id),
  }
);

// ─── Ko'rinish ──────────────────────────────────────────────────────────────

/**
 * Ilova ildizida bir marta render qilinadi (`providers/app-providers.tsx`).
 *
 * NEGA `Modal` ICHIDA: `Sheet` ham `Modal`, ya'ni ALOHIDA NATIV OYNA.
 * Oddiy ko'rinish (qanchalik katta `zIndex` bilan bo'lsa ham) hech qachon
 * boshqa oynaning ustiga chiqa olmaydi — shuning uchun toast bottomsheet
 * overlayi orqasida qolib ketardi.
 *
 * `visible` faqat toast BOR bo'lganda `true` bo'ladi: oyna aynan o'sha
 * paytda yaratiladi va shu sababli o'zidan oldin ochilgan oynalar ustida
 * turadi.
 */
export function ToastHost() {
  const items = useToastStore((state) => state.items);
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={items.length > 0}
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      // Tizim tugmasi toast'ni emas, ostidagi ekranni boshqarsin.
      onRequestClose={() => useToastStore.getState().dismiss()}
    >
      <View pointerEvents="box-none" style={[styles.host, { top: insets.top + 10 }]}>
        {items.map((item) => (
          <ToastCard key={item.id} item={item} />
        ))}
      </View>
    </Modal>
  );
}

const ICONS: Record<ToastVariant, typeof CheckCircle2> = {
  default: Info,
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const ACCENT: Record<ToastVariant, "success" | "destructive" | "warning" | "primary"> = {
  default: "primary",
  success: "success",
  error: "destructive",
  warning: "warning",
  info: "primary",
};

function ToastCard({ item }: { item: ToastItem }) {
  const { palette } = useTheme();
  const dismiss = useToastStore((state) => state.dismiss);
  const translateX = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => dismiss(item.id), item.duration);
    return () => clearTimeout(timer);
  }, [dismiss, item.id, item.duration]);

  function close() {
    dismiss(item.id);
  }

  function runAction(action: ToastAction) {
    action.onClick();
    close();
  }

  /*
   * Yon tomonga surib yo'q qilish.
   *
   * Buyurtmachi: "uni ushlab surib yoki qolda yoq qilib bolmayabdi".
   * Ilgari toast faqat vaqt tugagach yo'qolardi — xato xabari 6 soniya
   * ekranni band qilib turardi va uni olib tashlashning iloji yo'q edi.
   */
  const pan = Gesture.Pan()
    .onUpdate((event) => {
      translateX.set(event.translationX);
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > SWIPE_DISTANCE || Math.abs(event.velocityX) > 700) {
        runOnJS(close)();
      } else {
        translateX.set(withSpring(0, { damping: 22, stiffness: 260 }));
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.get() }],
    // Chetga surilgan sari so'nadi.
    opacity: Math.max(0, 1 - Math.abs(translateX.get()) / (SWIPE_DISTANCE * 2.2)),
  }));

  const Icon = ICONS[item.variant];
  const accent = palette[ACCENT[item.variant]];

  return (
    <GestureDetector gesture={pan}>
      <Animated.View entering={FadeInUp.duration(220)} exiting={FadeOutUp.duration(160)}>
        <Animated.View
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          style={[
            styles.card,
            {
              backgroundColor: palette["surface-elevated"],
              borderColor: palette.border,
              shadowColor: palette.shadow,
            },
            cardStyle,
          ]}
        >
          {/* Bosib ham yo'q qilinadi — surish har doim ham qulay emas. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Xabarni yopish"
            onPress={close}
            style={styles.pressArea}
          >
            <View style={[styles.iconCircle, { backgroundColor: `${accent}22` }]}>
              <Icon size={18} color={accent} />
            </View>

            <View style={styles.body}>
              <Text style={styles.message} numberOfLines={3}>
                {item.message}
              </Text>
              {item.description ? (
                <Text variant="caption" tone="muted" numberOfLines={4}>
                  {item.description}
                </Text>
              ) : null}
            </View>
          </Pressable>

          {item.action || item.cancel ? (
            <View style={styles.actions}>
              {item.cancel ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => runAction(item.cancel!)}
                  style={[styles.actionButton, { backgroundColor: palette.secondary }]}
                >
                  <Text style={[styles.actionLabel, { color: palette["secondary-foreground"] }]}>
                    {item.cancel.label}
                  </Text>
                </Pressable>
              ) : null}
              {item.action ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => runAction(item.action!)}
                  style={[styles.actionButton, { backgroundColor: palette.primary }]}
                >
                  <Text style={[styles.actionLabel, { color: palette["primary-foreground"] }]}>
                    {item.action.label}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  host: { position: "absolute", left: 12, right: 12, gap: 8 },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    shadowOpacity: 1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  pressArea: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, gap: 2 },
  message: { fontSize: fontSize.md, fontWeight: "600" },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  actionButton: {
    minHeight: MIN_TOUCH_SIZE - 12,
    justifyContent: "center",
    paddingHorizontal: 14,
    borderRadius: radius.sm,
  },
  actionLabel: { fontSize: fontSize.md, fontWeight: "600" },
});
