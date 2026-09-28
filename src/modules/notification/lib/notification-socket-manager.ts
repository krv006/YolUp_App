import { RealtimeSocket, type SocketState } from "@/shared/api";
import { sanitizeHtml } from "@/shared/lib";
import { mapNotificationLink } from "./notification.mappers";
import type { NotificationDto, NotificationLink, NotificationTarget } from "../api/notification.dto";

export type { SocketState };

export interface LiveNotification {
  id: string;
  html: string;
  targetType: NotificationTarget;
  kind: string | null;
  senderName: string;
  link: NotificationLink | null;
  createdAt: string;
}

interface RawEvent {
  type?: string;
  notification?: NotificationDto;
}

export function parseNotificationEvent(raw: unknown): LiveNotification | null {
  const event = (typeof raw === "string" ? JSON.parse(raw) : raw) as RawEvent | null;
  const dto = event?.type === "notification" ? event.notification : null;
  if (!dto) return null;

  const sender = dto.sender;
  return {
    id: String(dto.id),
    html: sanitizeHtml(dto.description ?? ""),
    targetType: dto.target_type ?? "user",
    kind: dto.kind ?? null,
    link: mapNotificationLink(dto.link_type, dto.link_id),
    senderName:
      [sender?.first_name, sender?.last_name].filter(Boolean).join(" ") ||
      sender?.username ||
      "Tizim",
    createdAt: dto.created_at ?? "",
  };
}

export interface NotificationSocketManagerInit {
  onNotification?: (notification: LiveNotification) => void;
  onState?: (state: SocketState) => void;
}

export class NotificationSocketManager {
  private readonly socket: RealtimeSocket;

  constructor({ onNotification, onState }: NotificationSocketManagerInit) {
    this.socket = new RealtimeSocket({
      path: "/ws/notifications/",
      onState,
      onMessage: (raw) => {
        try {
          const parsed = parseNotificationEvent(raw);
          if (parsed) onNotification?.(parsed);
        } catch (error) {
          void error;
        }
      },
    });
  }

  start(): void {
    this.socket.start();
  }

  stop(): void {
    this.socket.stop();
  }
}
