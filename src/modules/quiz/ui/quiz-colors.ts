import { useTheme } from "@/shared/ui";

/**
 * Test muharriri va javob maydonlari ranglari.
 *
 * Vebda bu qismlar hali ESKI (`legacy.css`) o'zgaruvchilari bilan
 * chiziladi va ular yangi dizayn tokenlaridan biroz farq qiladi:
 * matn `#1a1f26`, kuchli chegara `#d2d9e4`, yashil `#22a979` va h.k.
 * Qiymatlar 390px veb sahifasining ishlash paytidagi
 * `getComputedStyle(:root)` dan olingan.
 *
 * Qorong'i mavzuda ilova palitrasi ishlatiladi — vebdagi eski qorong'i
 * qiymatlar mobil palitraga mos kelmaydi.
 */
export function useQuizColors() {
  const { scheme, palette } = useTheme();
  if (scheme === "dark") {
    return {
      foreground: palette.foreground,
      muted: palette["muted-foreground"],
      borderStrong: palette["border-strong"],
      border: palette.border,
      surfaceTint: palette["surface-subtle"],
      mutedBg: palette.muted,
      success: palette.success,
      statusSuccess: palette.success,
    };
  }
  return {
    /* --foreground */
    foreground: "#1a1f26",
    /* --muted-foreground */
    muted: "#5a6672",
    /* --border-strong */
    borderStrong: "#d2d9e4",
    /* --border */
    border: "#e2e7ef",
    /* --surface-tint */
    surfaceTint: "#f6faff",
    /* --muted */
    mutedBg: "#eef1f6",
    /* --success */
    success: "#22a979",
    /* --status-success (yangi token) */
    statusSuccess: "#2c9a78",
  };
}

/** Eski `--r-md` va `--r-sm` (veb ishlash paytida 13 va 10). */
export const QUIZ_RADIUS = { md: 13, sm: 10 } as const;
