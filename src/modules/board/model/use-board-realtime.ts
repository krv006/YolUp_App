import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { BoardState, StrokeDto } from "../api/board.dto";
import type { BoardSocketEvent } from "../lib/board-socket-manager";
import { boardKeys } from "./board.queries";
import { useBoardChannel } from "./use-board-channel";

const BOARD_STATE_EVENTS = new Set<BoardSocketEvent["type"]>(["stroke", "erase", "sheet"]);

/** Sahifadagi stroke ro'yxatini o'zgartiradigan sof yordamchi. */
function updateSheet(
  state: BoardState,
  index: number,
  update: (strokes: StrokeDto[]) => StrokeDto[]
): BoardState {
  return {
    ...state,
    sheets: state.sheets.map((sheet) =>
      sheet.index === index ? { ...sheet, strokes: update(sheet.strokes) } : sheet
    ),
  };
}

function applyEvent(state: BoardState | undefined, event: BoardSocketEvent): BoardState | undefined {
  if (!state) return state;

  switch (event.type) {
    case "stroke":
      return updateSheet(state, event.sheet, (strokes) =>
        // Bir xil stroke REST javobi bilan ham kelishi mumkin — takrorlamaymiz.
        strokes.some((item) => item.id === event.stroke.id) ? strokes : [...strokes, event.stroke]
      );

    case "erase":
      return updateSheet(state, event.sheet, (strokes) =>
        strokes.filter((item) => !event.strokeIds.includes(item.id))
      );

    case "sheet":
      return state.sheets.some((sheet) => sheet.index === event.index)
        ? state
        : { ...state, sheets: [...state.sheets, { index: event.index, strokes: [] }] };

    default:
      return state;
  }
}

/**
 * Doska real-time kanali (docs/PROJECT.md §5.2).
 *
 * Kelgan hodisalarni to'g'ridan-to'g'ri react-query keshiga qo'llaydi, shuning uchun
 * `useBoard` qayta so'rov yubormaydi. Kanal ulanmasa (masalan server `/ws/*` ni
 * proksilamasa) `connected` `false` bo'ladi va `useBoard` pollingga qaytadi.
 *
 * `identity` — joriy foydalanuvchining LiveKit identity'si. `board_granted`
 * HAMMAGA keladi (mikrofon signallari kabi), shuning uchun har client o'zi
 * filtrlaydi: faqat shu o'quvchiga tegishli bo'lsa `canDraw`ni `true`ga
 * o'rnatadi — aks holda o'qituvchi ruxsat berganda sahifani yangilamaguncha
 * o'quvchi chiza olmay turardi (FRONTEND_TODO_CAMERA_BOARD.md §2).
 */
export function useBoardRealtime(lessonId: string, enabled = true, identity?: string | null) {
  const queryClient = useQueryClient();

  const handleEvent = useCallback(
    (event: BoardSocketEvent) => {
      if (event.type === "board_granted") {
        if (!identity || event.studentId !== identity) return;
        queryClient.setQueryData<BoardState>(boardKeys.state(lessonId), (current) =>
          current ? { ...current, canDraw: true } : current
        );
        return;
      }
      // Kanal doskadan tashqari signallarni ham olib keladi (mikrofon so'rovi) —
      // ular doska holatiga tegishli emas.
      if (!BOARD_STATE_EVENTS.has(event.type)) return;
      queryClient.setQueryData<BoardState>(boardKeys.state(lessonId), (current) =>
        applyEvent(current, event)
      );
    },
    [lessonId, queryClient, identity]
  );

  return useBoardChannel(lessonId, enabled, handleEvent);
}
