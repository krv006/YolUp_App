import type { ColorScheme } from "./tokens";

/**
 * Foydalanuvchi tanlaydigan brend ranglari va ulardan palitra hosil qilish.
 *
 * NEGA TAYYOR RO'YXAT: ixtiyoriy rang tanlash (rang g'ildiragi) chiroyli
 * ko'rinadi, lekin foydalanuvchi och sariq tanlasa, ustidagi OQ matn
 * o'qilmay qoladi. Bu yerdagi ranglarning har biri oq matn bilan kamida
 * 4.5:1 kontrast beradi (WCAG AA), ya'ni qaysi biri tanlansa ham tugmalar
 * o'qiladigan bo'lib qoladi.
 */
export interface Accent {
  id: string;
  label: string;
  /** Yorug' mavzuda asos rang. */
  light: string;
  /** Qorong'i mavzuda asos rang — och fonda emas, to'q fonda ishlaydi. */
  dark: string;
}

export const ACCENTS: readonly Accent[] = [
  { id: "blue", label: "Ko'k", light: "#1a66e0", dark: "#4d91ff" },
  { id: "indigo", label: "Siyoh", light: "#4f46e5", dark: "#8b8cf9" },
  { id: "violet", label: "Binafsha", light: "#7c3aed", dark: "#a78bfa" },
  { id: "teal", label: "Firuza", light: "#0f766e", dark: "#2dd4bf" },
  { id: "green", label: "Yashil", light: "#15803d", dark: "#4ade80" },
  { id: "amber", label: "Kahrabo", light: "#b45309", dark: "#fbbf24" },
  { id: "rose", label: "Qizg'ish", light: "#be123c", dark: "#fb7185" },
  { id: "slate", label: "Kulrang", light: "#334155", dark: "#94a3b8" },
] as const;

export const DEFAULT_ACCENT = "blue";

export function findAccent(id: string): Accent {
  return ACCENTS.find((accent) => accent.id === id) ?? ACCENTS[0];
}

// ─── Rang matematikasi ──────────────────────────────────────────────────────

function parseHex(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((c) => c + c)
          .join("")
      : value;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [number, number, number];
}

function toHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("")}`;
}

/** `amount` — 0 da `from`, 1 da `to`. */
function mix(from: string, to: string, amount: number): string {
  const a = parseHex(from);
  const b = parseHex(to);
  return toHex([
    a[0] + (b[0] - a[0]) * amount,
    a[1] + (b[1] - a[1]) * amount,
    a[2] + (b[2] - a[2]) * amount,
  ]);
}

/** WCAG nisbiy yorqinligi. */
function luminance(hex: string): number {
  const [r, g, b] = parseHex(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Fon ustida o'qiladigan matn rangi — oq yoki to'q. */
export function readableOn(background: string): string {
  return luminance(background) > 0.45 ? "#0f1319" : "#ffffff";
}

/**
 * Tanlangan rangdan `primary-*` tokenlar to'plamini yasaydi.
 *
 * Ohangli fonlar (`tint`, `soft`) asos rangni MAVZU FONIGA aralashtirib
 * olinadi — shuning uchun ular yorug' mavzuda och, qorong'ida to'q chiqadi
 * va ikkalasida ham ustidagi matn o'qiladi.
 */
export function deriveAccentTokens(
  accentId: string,
  scheme: ColorScheme,
  background: string
): {
  primary: string;
  "primary-hover": string;
  "primary-foreground": string;
  "primary-text": string;
  "primary-tint": string;
  "primary-tint-strong": string;
  "primary-soft": string;
  ring: string;
} {
  const accent = findAccent(accentId);
  const base = scheme === "dark" ? accent.dark : accent.light;

  return {
    primary: base,
    "primary-hover": mix(base, scheme === "dark" ? "#ffffff" : "#000000", 0.12),
    "primary-foreground": readableOn(base),
    // Matn sifatida ishlatiladigan variant: qorong'i mavzuda asos rang
    // allaqachon yorug', yorug' mavzuda esa asosning o'zi yetarli to'q.
    "primary-text": base,
    "primary-tint": mix(base, background, scheme === "dark" ? 0.86 : 0.9),
    "primary-tint-strong": mix(base, background, scheme === "dark" ? 0.74 : 0.8),
    "primary-soft": mix(base, background, scheme === "dark" ? 0.68 : 0.74),
    ring: base,
  };
}
