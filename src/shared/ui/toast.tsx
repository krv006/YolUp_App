import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { create } from "zustand";
import { colors, fontSize, MIN_TOUCH_SIZE, radius } from "./tokens";

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

/** Ilova ildizida bir marta render qilinadi (`src/app/_layout.tsx`). */
export function ToastHost() {
  const items = useToastStore((state) => state.items);
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() === "dark" ? "dark" : "light";

  if (items.length === 0) return null;

  return (
    <View
      // Ostidagi ekranga teginish o'tib ketsin — faqat toast'ning o'zi bosiladi.
      pointerEvents="box-none"
      style={[styles.host, { top: insets.top + 8 }]}
    >
      {items.map((item) => (
        <ToastCard key={item.id} item={item} scheme={scheme} />
      ))}
    </View>
  );
}

const ACCENT: Record<ToastVariant, "success" | "destructive" | "warning" | "primary"> = {
  default: "primary",
  success: "success",
  error: "destructive",
  warning: "warning",
  info: "primary",
};

function ToastCard({ item, scheme }: { item: ToastItem; scheme: "light" | "dark" }) {
  const palette = colors[scheme];
  const dismiss = useToastStore((state) => state.dismiss);

  useEffect(() => {
    const timer = setTimeout(() => dismiss(item.id), item.duration);
    return () => clearTimeout(timer);
  }, [dismiss, item.id, item.duration]);

  function runAction(action: ToastAction) {
    action.onClick();
    dismiss(item.id);
  }

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[
        styles.card,
        {
          backgroundColor: palette["surface-elevated"],
          borderColor: palette.border,
          shadowColor: palette.shadow,
        },
      ]}
    >
      <View style={[styles.accent, { backgroundColor: palette[ACCENT[item.variant]] }]} />
      <View style={styles.body}>
        <Text style={[styles.message, { color: palette.foreground }]}>{item.message}</Text>
        {item.description ? (
          <Text style={[styles.description, { color: palette["muted-foreground"] }]}>
            {item.description}
          </Text>
        ) : null}
        {item.action || item.cancel ? (
          <View style={styles.actions}>
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
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    left: 12,
    right: 12,
    gap: 8,
    zIndex: 1000,
  },
  card: {
    flexDirection: "row",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    overflow: "hidden",
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  accent: { width: 4 },
  body: { flex: 1, padding: 12, gap: 4 },
  message: { fontSize: fontSize.lg, fontWeight: "600" },
  description: { fontSize: fontSize.md, lineHeight: 20 },
  actions: { flexDirection: "row", gap: 8, marginTop: 4 },
  actionButton: {
    minHeight: MIN_TOUCH_SIZE - 12,
    justifyContent: "center",
    paddingHorizontal: 14,
    borderRadius: radius.sm,
  },
  actionLabel: { fontSize: fontSize.md, fontWeight: "600" },
});
