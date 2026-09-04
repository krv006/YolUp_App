import { format, isToday, isYesterday } from "date-fns";
import { uz } from "date-fns/locale";
import type { ChatMessage } from "@/shared/types";

/**
 * Xabarlar ro'yxatini sana ajratgichlari bilan tayyorlaydi.
 *
 * Tartib TABIIY (eski -> yangi). Ro'yxat teskari ag'darilmaydi: FlashList v2
 * `inverted` ni olib tashlab, o'rniga `maintainVisibleContentPosition`
 * berdi — u yangi xabar kelganda skrollni o'zi joyida ushlab turadi va
 * `startRenderingFromBottom` bilan ro'yxat darhol pastdan ochiladi.
 *
 * Bu eski `inverted` hiylasidan yaxshiroq: kontent ag'darilmaydi, ya'ni
 * soyalar, ajratgichlar va screen reader tartibi tabiiy qoladi.
 */

export type MessageRow =
  | { kind: "message"; message: ChatMessage; showSender: boolean }
  | { kind: "day"; label: string; key: string };

function dayKey(value: string): string {
  return new Date(value).toDateString();
}

function dayLabel(value: string): string {
  const date = new Date(value);
  if (isToday(date)) return "Bugun";
  if (isYesterday(date)) return "Kecha";
  return format(date, "d-MMMM yyyy", { locale: uz });
}

/** Ketma-ket bir odam yozgan xabarlarda ism takrorlanmaydi. */
function shouldShowSender(current: ChatMessage, previous: ChatMessage | undefined): boolean {
  if (!previous) return true;
  if (previous.senderId !== current.senderId) return true;
  return dayKey(previous.createdAt) !== dayKey(current.createdAt);
}

export function buildMessageRows(messages: readonly ChatMessage[]): MessageRow[] {
  const rows: MessageRow[] = [];

  messages.forEach((message, index) => {
    const previous = index > 0 ? messages[index - 1] : undefined;

    // Kun almashgan joyda — o'sha kunning birinchi xabari USTIDA ajratgich.
    if (!previous || dayKey(previous.createdAt) !== dayKey(message.createdAt)) {
      rows.push({
        kind: "day",
        label: dayLabel(message.createdAt),
        key: `day-${dayKey(message.createdAt)}`,
      });
    }

    rows.push({ kind: "message", message, showSender: shouldShowSender(message, previous) });
  });

  return rows;
}
