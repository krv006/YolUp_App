import type { ChatMessage } from "@/shared/types";

/**
 * Xabarlar ro'yxati qatorlari: kun ajratgichlari, "N ta yangi xabar"
 * chizig'i va ketma-ket xabarlarni guruhlash (veb `message-list.tsx`:
 * bir odamning 5 daqiqa ichidagi xabarlarida ism faqat birinchisida,
 * avatar faqat oxirgisida).
 *
 * Tartib TABIIY (eski -> yangi): FlashList v2 `inverted` o'rniga
 * `maintainVisibleContentPosition` bilan pastdan ochiladi.
 */
export type MessageRow =
  | { kind: "message"; key: string; message: ChatMessage; showName: boolean; showAvatar: boolean }
  | { kind: "assignment"; key: string; message: ChatMessage }
  | { kind: "day"; key: string; date: string }
  | { kind: "unread"; key: string };

const GROUP_WINDOW_MS = 5 * 60 * 1000;

function dayKey(value: string): string {
  return new Date(value).toDateString();
}

function sameGroup(current: ChatMessage, other: ChatMessage | undefined): boolean {
  return Boolean(
    other &&
      other.senderId === current.senderId &&
      other.type !== "system" &&
      dayKey(other.createdAt) === dayKey(current.createdAt) &&
      Math.abs(new Date(other.createdAt).getTime() - new Date(current.createdAt).getTime()) < GROUP_WINDOW_MS
  );
}

export function buildMessageRows(
  messages: readonly ChatMessage[],
  options: { days?: boolean; dividerId?: string | null } = {}
): MessageRow[] {
  const { days = true, dividerId = null } = options;
  const rows: MessageRow[] = [];

  messages.forEach((message, index) => {
    const previous = messages[index - 1];
    const next = messages[index + 1];

    if (days && (!previous || dayKey(previous.createdAt) !== dayKey(message.createdAt))) {
      rows.push({ kind: "day", key: `day-${dayKey(message.createdAt)}`, date: message.createdAt });
    }
    if (message.id === dividerId) rows.push({ kind: "unread", key: `unread-${message.id}` });

    if (message.type === "assignment" && message.assignment) {
      rows.push({ kind: "assignment", key: message.id, message });
      return;
    }
    rows.push({
      kind: "message",
      key: message.id,
      message,
      showName: !sameGroup(message, previous),
      showAvatar: !sameGroup(message, next),
    });
  });

  return rows;
}
