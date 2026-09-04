import { AppState, type AppStateStatus, type NativeEventSubscription } from "react-native";
import { env } from "@/shared/config";
import { isOnline, onOnline } from "@/shared/lib/network";
import { refreshTokenManager } from "./refresh-token-manager";
import { tokenStorage } from "./token-storage";

export type SocketState = "idle" | "connecting" | "connected" | "disconnected" | "error";

export interface SocketClosePolicy {
  refresh: boolean;
  reconnect: boolean;
}

/**
 * Yopilish kodlari (docs/PROJECT.md §5) — chat va doska kanallari uchun bir xil:
 * `4401` — token yaroqsiz (refresh qilib qayta ulanamiz),
 * `4403` — xonaga a'zo emas (qayta urinmaymiz).
 *
 * 🟢 Veb bilan AYNAN bir xil mantiq.
 */
export function getSocketClosePolicy(code: number): SocketClosePolicy {
  if (code === 4403) return { refresh: false, reconnect: false };
  if (code === 4401) return { refresh: true, reconnect: true };
  return { refresh: false, reconnect: true };
}

export interface RealtimeSocketInit {
  /** JWT'siz yo'l, masalan `/ws/chat/<room_id>/`. */
  path: string;
  onMessage?: (raw: string) => void;
  onState?: (state: SocketState) => void;
  /**
   * Qayta ulangandan keyin chaqiriladi — chaqiruvchi shu payt yo'qolgan
   * xabarlarni REST orqali tortib oladi (delta sync, MOBILE_PLAN §9.2).
   * Birinchi ulanishda chaqirilmaydi.
   */
  onResync?: () => void;
}

const MAX_RETRIES = 6;
const MAX_RETRY_DELAY_MS = 30_000;

/**
 * Ilova fon rejimiga o'tgach soket shu muddatdan keyin yopiladi.
 *
 * Darhol yopmaymiz: bildirishnoma panelini ochib yopish yoki kamera ruxsati
 * so'rovi ham ilovani qisqa vaqtga fonga chiqaradi — har safar uzib-ulanish
 * batareyani ham, serverni ham ortiqcha yuklaydi.
 */
const BACKGROUND_CLOSE_DELAY_MS = 30_000;

/**
 * WebSocket ulanishini boshqaradi: JWT bilan ulanish, uzilganda eksponensial
 * qayta urinish, `4401` da tokenni yangilash, tarmoq/ilova holatiga reaksiya.
 *
 * Xabar formatini bilmaydi — xom matnni qaytaradi. Har bir modul (chat, doska)
 * o'z shartnomasini o'zi parse qiladi.
 *
 * Veb versiyadan farqlari (MOBILE_PLAN §9.1):
 *  - `visibilitychange` -> `AppState`
 *  - `navigator.onLine` -> NetInfo
 *  - fon rejimida soket ATAYLAB yopiladi (batareya), qaytganda tiklanadi
 *  - qayta ulanishdan keyin `onResync` chaqiriladi
 */
export class RealtimeSocket {
  private readonly path: string;
  private readonly onMessage?: (raw: string) => void;
  private readonly onState?: (state: SocketState) => void;
  private readonly onResync?: () => void;

  private socket: WebSocket | null = null;
  private retries = 0;
  private closed = false;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private backgroundTimer: ReturnType<typeof setTimeout> | null = null;
  /** Birinchi muvaffaqiyatli ulanishdan keyin `true` — resync shunga qarab chaqiriladi. */
  private hasConnectedOnce = false;

  private appStateSubscription: NativeEventSubscription | null = null;
  private unsubscribeOnline: (() => void) | null = null;

  constructor({ path, onMessage, onState, onResync }: RealtimeSocketInit) {
    this.path = path;
    this.onMessage = onMessage;
    this.onState = onState;
    this.onResync = onResync;
  }

  get isOpen(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  start(): void {
    this.closed = false;
    this.appStateSubscription = AppState.addEventListener("change", this.handleAppState);
    this.unsubscribeOnline = onOnline(() => this.connect());
    this.connect();
  }

  private readonly handleAppState = (status: AppStateStatus): void => {
    if (status === "active") {
      this.clearBackgroundTimer();
      if (!this.socket) this.connect();
      return;
    }
    // background / inactive — kutamiz, keyin uzamiz.
    if (this.backgroundTimer || !this.socket) return;
    this.backgroundTimer = setTimeout(() => {
      this.backgroundTimer = null;
      this.disconnectSocket();
    }, BACKGROUND_CLOSE_DELAY_MS);
  };

  connect(): void {
    if (this.closed || this.socket || !isOnline()) return;
    const token = tokenStorage.getAccessToken();
    if (!token) return;

    this.onState?.("connecting");
    const socket = new WebSocket(`${env.wsUrl}${this.path}?token=${encodeURIComponent(token)}`);
    this.socket = socket;

    socket.onopen = () => {
      this.retries = 0;
      this.onState?.("connected");
      // Uzilib-ulangan bo'lsak, o'sha oraliqdagi xabarlar tushib qolgan.
      if (this.hasConnectedOnce) this.onResync?.();
      this.hasConnectedOnce = true;
    };

    socket.onmessage = (event: WebSocketMessageEvent) => {
      if (typeof event.data === "string") this.onMessage?.(event.data);
    };

    socket.onerror = () => this.onState?.("error");

    socket.onclose = async (event: WebSocketCloseEvent) => {
      if (this.socket === socket) this.socket = null;
      this.onState?.("disconnected");
      const policy = getSocketClosePolicy(event.code ?? 1006);
      if (this.closed || !policy.reconnect) return;
      // Fon rejimida ataylab yopdik — qaytganda AppState o'zi ulaydi.
      if (AppState.currentState !== "active") return;
      if (policy.refresh && !(await refreshTokenManager.refresh())) return;
      this.scheduleReconnect();
    };
  }

  /** Exponential backoff: 700ms, 1.4s, 2.8s … maksimum 30s, 6 martagacha. */
  private scheduleReconnect(): void {
    if (this.closed || this.retryTimer || this.retries >= MAX_RETRIES) return;
    const delay = Math.min(MAX_RETRY_DELAY_MS, 700 * 2 ** this.retries++);
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      this.connect();
    }, delay);
  }

  /** Ulanish yopiq bo'lsa `false` qaytaradi — chaqiruvchi REST'ga o'tishi mumkin. */
  send(payload: unknown): boolean {
    if (!this.isOpen) return false;
    this.socket!.send(JSON.stringify(payload));
    return true;
  }

  private clearBackgroundTimer(): void {
    if (this.backgroundTimer) clearTimeout(this.backgroundTimer);
    this.backgroundTimer = null;
  }

  /** Soketni yopadi, lekin obunalarni saqlaydi — qayta ulanish mumkin. */
  private disconnectSocket(): void {
    const socket = this.socket;
    this.socket = null;
    socket?.close(1000, "Ilova fon rejimida");
  }

  stop(): void {
    this.closed = true;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = null;
    this.clearBackgroundTimer();
    this.appStateSubscription?.remove();
    this.appStateSubscription = null;
    this.unsubscribeOnline?.();
    this.unsubscribeOnline = null;
    this.disconnectSocket();
  }
}
