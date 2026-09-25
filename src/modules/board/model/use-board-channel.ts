import { useCallback, useEffect, useRef, useState } from "react";
import type { SocketState } from "@/shared/api";
import type { StrokeInput } from "../api/board.dto";
import { subscribeToBoardChannel } from "../lib/board-channel";
import type { BoardSocketEvent } from "../lib/board-socket-manager";

export function useBoardChannel(
  lessonId: string,
  enabled: boolean,
  onEvent: (event: BoardSocketEvent) => void
) {
  const [state, setState] = useState<SocketState>("idle");
  const handler = useRef(onEvent);
  const send = useRef<((sheet: number, stroke: StrokeInput) => boolean) | null>(null);

  useEffect(() => {
    handler.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!enabled || !lessonId) return undefined;
    const subscription = subscribeToBoardChannel(
      lessonId,
      (event) => handler.current(event),
      setState
    );
    send.current = subscription.sendStroke;
    return () => {
      send.current = null;
      subscription.unsubscribe();
    };
  }, [enabled, lessonId]);

  const sendStroke = useCallback(
    (sheet: number, stroke: StrokeInput) => Boolean(send.current?.(sheet, stroke)),
    []
  );

  return { state, connected: state === "connected", sendStroke };
}
