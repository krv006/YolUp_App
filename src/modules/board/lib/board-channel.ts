import type { SocketState } from "@/shared/api";
import { BoardSocketManager, type BoardSocketEvent } from "./board-socket-manager";

type EventListener = (event: BoardSocketEvent) => void;
type StateListener = (state: SocketState) => void;

interface Channel {
  manager: BoardSocketManager;
  events: Set<EventListener>;
  states: Set<StateListener>;
  state: SocketState;
}

/**
 * Dars bo'yicha ochiq doska kanallari.
 *
 * Kanal bitta bo'lishi SHART: doska paneli va mikrofon signallari bir xil
 * `/ws/board/<lesson_id>/` manzilidan foydalanadi. Har biri o'z ulanishini
 * ochsa, server har bir chizmani ikki marta yuborardi. Shuning uchun ulanish
 * shu yerda saqlanadi va obunachilar soni nolga tushganda yopiladi.
 */
const channels = new Map<string, Channel>();

export interface BoardChannelSubscription {
  /** Chizmani kanal orqali yuboradi; ulanish yo'q bo'lsa `false`. */
  sendStroke: BoardSocketManager["sendStroke"];
  unsubscribe: () => void;
}

export function subscribeToBoardChannel(
  lessonId: string,
  onEvent: EventListener,
  onState: StateListener
): BoardChannelSubscription {
  let channel = channels.get(lessonId);

  if (!channel) {
    const events = new Set<EventListener>();
    const states = new Set<StateListener>();
    const created: Channel = {
      events,
      states,
      state: "idle",
      manager: new BoardSocketManager({
        lessonId,
        onEvent: (event) => events.forEach((listener) => listener(event)),
        onState: (state) => {
          created.state = state;
          states.forEach((listener) => listener(state));
        },
      }),
    };
    channel = created;
    channels.set(lessonId, created);
    created.manager.start();
  }

  const active = channel;
  active.events.add(onEvent);
  active.states.add(onState);
  // Kanal allaqachon ulangan bo'lishi mumkin — yangi obunachi holatni darhol biladi.
  onState(active.state);

  return {
    sendStroke: (sheet, stroke) => active.manager.sendStroke(sheet, stroke),
    unsubscribe: () => {
      active.events.delete(onEvent);
      active.states.delete(onState);
      if (active.events.size || active.states.size) return;
      channels.delete(lessonId);
      active.manager.stop();
    },
  };
}
