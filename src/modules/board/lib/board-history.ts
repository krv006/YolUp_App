import type { BoardSheet, StrokeShapeDto } from "../api/board.dto";

/**
 * O'z chizgan strokeim (bekor qilish tarixi uchun) — 🆕 mobil.
 *
 * Avval (veb ham) server stroke'i yuborilgan shakl bilan JSON kaliti
 * (`strokeKey`) orqali topilardi. Backend #176 dan beri har stroke'ga
 * `by` / `by_id` qo'shadi (kalitda yo'q edi), nuqtalarni yaxlitlaydi va
 * doska chegarasiga qisadi — kalit hech qachon mos kelmas, "Bekor qilish"
 * tugmasi doim o'chiq qolardi. Endi yuborilgan payt sahifadagi id'lar
 * eslab qolinadi (`known`) va KEYIN paydo bo'lgan, turi bir xil, muallifi
 * men bo'lgan birinchi stroke shu yozuvga bog'lanadi (id saqlanadi).
 * Tur `type` maydoni bo'yicha (qalam va marker bitta "erkin chiziq") —
 * server `opacity` ni o'zgartirsa ham mos keladi.
 */
export interface OwnStroke {
  sheet: number;
  shape: StrokeShapeDto;
  /** Serverdagi id — topilgach. */
  id?: string;
  /** Yuborilgan paytdagi sahifa id'lari (topilguncha). */
  known?: ReadonlySet<string>;
}

export function ownStroke(
  sheet: number,
  shape: StrokeShapeDto,
  sheets: readonly BoardSheet[]
): OwnStroke {
  const strokes = sheets.find((item) => item.index === sheet)?.strokes ?? [];
  return { sheet, shape, known: new Set(strokes.map((stroke) => stroke.id)) };
}

/**
 * Hali id'si yo'q yozuvlarni yangi kelgan strokelarga tartib bilan
 * bog'laydi (yuborish tartibi = kelish tartibi). O'zgarish bo'lmasa o'sha
 * massivning o'zi qaytadi.
 */
export function resolveOwnStrokes(
  history: OwnStroke[],
  sheets: readonly BoardSheet[],
  userId: string | null | undefined
): OwnStroke[] {
  if (history.every((entry) => entry.id)) return history;
  const claimed = new Set(history.flatMap((entry) => (entry.id ? [entry.id] : [])));
  let changed = false;
  const next = history.map((entry) => {
    if (entry.id) return entry;
    const kind = entry.shape.type ?? "free";
    const match = (sheets.find((item) => item.index === entry.sheet)?.strokes ?? []).find(
      (stroke) =>
        !entry.known?.has(stroke.id) &&
        !claimed.has(stroke.id) &&
        (stroke.type ?? "free") === kind &&
        (!userId || !stroke.by_id || String(stroke.by_id) === String(userId))
    );
    if (!match) return entry;
    claimed.add(match.id);
    changed = true;
    return { sheet: entry.sheet, shape: entry.shape, id: match.id };
  });
  return changed ? next : history;
}
