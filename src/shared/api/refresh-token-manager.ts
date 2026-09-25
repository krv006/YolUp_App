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

/**
 * Sessiya ALMASHGANDA yuboriladi: kirish, chiqish, hisob yoki rol almashtirish.
 *
 * Tugashdan farqi bor: bu yerda foydalanuvchi baribir tizimda qoladi, lekin
 * BOSHQA odam bo'ladi. Shuning uchun TanStack Query keshi to'liq tozalanishi
 * kerak — aks holda yangi hisob eski hisobning suhbatlari va baholarini
 * ko'radi (`providers/query-client.ts`).
 */
export const SESSION_CHANGED_EVENT = "fokus:session-changed";

type SessionExpiredListener = () => void;
type SessionChangedListener = () => void;

export class RefreshTokenManager {
  private refreshHandler: RefreshHandler | null = null;
  /** Parallel 401 lar bitta refresh so'roviga birlashtiriladi. */
  private refreshPromise: Promise<boolean> | null = null;
  private readonly listeners = new Set<SessionExpiredListener>();
  private readonly changeListeners = new Set<SessionChangedListener>();

  configure(refreshHandler: RefreshHandler): void {
    this.refreshHandler = refreshHandler;
  }

  /** Obunani bekor qiluvchi funksiya qaytaradi. */
  onSessionExpired(listener: SessionExpiredListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Obunani bekor qiluvchi funksiya qaytaradi. */
  onSessionChange(listener: SessionChangedListener): () => void {
    this.changeListeners.add(listener);
    return () => this.changeListeners.delete(listener);
  }

  emitSessionChange(): void {
    for (const listener of this.changeListeners) {
      try {
        listener();
      } catch (error) {
        console.warn("[refresh-token-manager] sessiya obunachisi xatosi", error);
      }
    }
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
    // Refresh boshlangandagi token. Agar u jarayon davomida O'ZGARGAN bo'lsa,
    // demak shu orada boshqa sessiya ochilgan (hisob yoki rol almashtirildi) —
    // bu holda eski so'rovning xatosi yangi sessiyani o'chirmasligi kerak.
    const startedWith = tokenStorage.getRefreshToken();
    this.refreshPromise ??= Promise.resolve(this.refreshHandler())
      .then(() => true)
      .catch(() => {
        if (tokenStorage.getRefreshToken() !== startedWith && tokenStorage.hasSession()) {
          return true;
        }
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

/**
 * Veb bu yerda `window` ga `CustomEvent` yuboradi. Mobilda global hodisa
 * shinasi yo'q, shuning uchun menejerning obunachilari chaqiriladi —
 * chaqiruvchi kod uchun nomi va ma'nosi veb bilan bir xil.
 */
export function announceSessionChange(): void {
  refreshTokenManager.emitSessionChange();
}
