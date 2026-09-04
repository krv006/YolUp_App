import { tokenStorage } from "./token-storage";

export type RefreshHandler = () => void | Promise<void>;

/**
 * Veb `src/shared/api/refresh-token-manager.ts` ning mobil varianti.
 *
 * Farq: veb `window` ga `CustomEvent` yuborardi. Mobilda global hodisa shinasi
 * yo'q, shuning uchun oddiy obuna ro'yxati ishlatiladi. Mantiq — parallel
 * 401 larni bitta refresh so'roviga birlashtirish — o'zgarishsiz.
 */

/** Sessiya tugaganda yuboriladi — `auth.store` shunga obuna bo'ladi. */
export const SESSION_EXPIRED_EVENT = "fokus:session-expired";

type SessionExpiredListener = () => void;

export class RefreshTokenManager {
  private refreshHandler: RefreshHandler | null = null;
  /** Parallel 401 lar bitta refresh so'roviga birlashtiriladi. */
  private refreshPromise: Promise<boolean> | null = null;
  private readonly listeners = new Set<SessionExpiredListener>();

  configure(refreshHandler: RefreshHandler): void {
    this.refreshHandler = refreshHandler;
  }

  /** Obunani bekor qiluvchi funksiya qaytaradi. */
  onSessionExpired(listener: SessionExpiredListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emitSessionExpired(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (error) {
        console.warn("[refresh-token-manager] obunachi xatosi", error);
      }
    }
  }

  async refresh(): Promise<boolean> {
    if (!this.refreshHandler) return false;
    this.refreshPromise ??= Promise.resolve(this.refreshHandler())
      .then(() => true)
      .catch(() => {
        tokenStorage.clearTokens();
        this.emitSessionExpired();
        return false;
      })
      .finally(() => {
        this.refreshPromise = null;
      });
    return this.refreshPromise;
  }
}

export const refreshTokenManager = new RefreshTokenManager();
