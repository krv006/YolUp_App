import { create } from "zustand";
import { AppError, refreshTokenManager, tokenStorage } from "@/shared/api";
import type { AuthStatus, AuthUser, LoginCredentials } from "@/shared/types";
import { authApi } from "../api/auth.api";
import { mapLoginRequest, mapTokenPairDto, mapUserDto } from "../lib/auth.mappers";
import { configureAuthRefresh } from "../lib/auth-session";

export const AUTH_STATUS = Object.freeze({
  ANONYMOUS: "anonymous",
  INITIALIZING: "initializing",
  AUTHENTICATED: "authenticated",
  ERROR: "error",
}) satisfies Record<string, AuthStatus>;

interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;
  error: AppError | null;

  /** Ilova ochilganda bir marta chaqiriladi: saqlangan token bo'lsa profilni tiklaydi. */
  bootstrap: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser) => void;
  /** Tarmoq xatosidan keyin "Qayta urinish". */
  retry: () => Promise<void>;
}

function toAppError(error: unknown): AppError {
  return error instanceof AppError
    ? error
    : new AppError({
        message: error instanceof Error ? error.message : "Sessiyani tekshirib bo‘lmadi",
      });
}

/**
 * Ketayotgan `me/` so'rovi. React StrictMode (dev) effektni ikki marta
 * chaqiradi, shuningdek daraxt qayta mount bo'lishi ham mumkin — ikkalasida
 * ham bitta so'rov yetarli, chaqiruvchilar bir xil natijani kutadi.
 */
let pendingBootstrap: Promise<void> | null = null;

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  status: tokenStorage.hasSession() ? AUTH_STATUS.INITIALIZING : AUTH_STATUS.ANONYMOUS,
  error: null,

  async bootstrap() {
    pendingBootstrap ??= (async () => {
      if (!tokenStorage.hasSession()) {
        set({ user: null, status: AUTH_STATUS.ANONYMOUS, error: null });
        return;
      }
      set({ status: AUTH_STATUS.INITIALIZING, error: null });
      try {
        const user = mapUserDto(await authApi.getCurrentUser());
        set({ user, status: AUTH_STATUS.AUTHENTICATED, error: null });
      } catch (error) {
        const appError = toAppError(error);
        // 401 — token yaroqsiz: sessiyani jimgina tozalaymiz, xato ekrani chiqarmaymiz.
        if (appError.status === 401) {
          tokenStorage.clearTokens();
          set({ user: null, status: AUTH_STATUS.ANONYMOUS, error: null });
          return;
        }
        set({ user: null, status: AUTH_STATUS.ERROR, error: appError });
      }
    })();

    // Tugagach tozalaymiz — "Qayta urinish" yangi so'rov yubora olsin.
    try {
      await pendingBootstrap;
    } finally {
      pendingBootstrap = null;
    }
  },

  async login(credentials) {
    try {
      const tokens = mapTokenPairDto(await authApi.login(mapLoginRequest(credentials)));
      tokenStorage.setTokens(tokens, { persistent: credentials.remember !== false });
      const user = mapUserDto(await authApi.getCurrentUser());
      set({ user, status: AUTH_STATUS.AUTHENTICATED, error: null });
      return user;
    } catch (error) {
      // Yarim ochilgan sessiya qolmasin.
      tokenStorage.clearTokens();
      set({ user: null, status: AUTH_STATUS.ANONYMOUS, error: null });
      throw error;
    }
  },

  /**
   * Chiqish: avval serverga aytamiz (refresh token bekor qilinsin), keyin
   * lokal holatni tozalaymiz.
   *
   * So'rov xatosi ATAYLAB YUTILADI: tarmoq uzilgan, token eskirgan yoki
   * endpoint hali chiqarilmagan bo'lishi mumkin — bularning hech biri
   * foydalanuvchini tizimda ushlab qolishga sabab emas. Shuning uchun
   * tokenlar `finally` da, har qanday holatda tozalanadi.
   */
  async logout() {
    const refreshToken = tokenStorage.getRefreshToken();
    try {
      await authApi.logout(refreshToken);
    } catch {
      // Sababi muhim emas — chiqish baribir davom etadi.
    } finally {
      tokenStorage.clearTokens();
      set({ user: null, status: AUTH_STATUS.ANONYMOUS, error: null });
    }
  },

  setUser(user) {
    set({ user, status: AUTH_STATUS.AUTHENTICATED });
  },

  retry() {
    return get().bootstrap();
  },
}));

// ─── Bir martalik yon-effektlar ─────────────────────────────────────────────
configureAuthRefresh();

/*
 * 🟡 MOBIL FARQI (MOBILE_PLAN §4.2):
 *
 * Veb versiya ikkita `window` hodisasiga obuna bo'lardi:
 *   1) `SESSION_EXPIRED_EVENT` — CustomEvent orqali kelardi. Mobilda global
 *      hodisa shinasi yo'q, shuning uchun refresh menejerining o'z obunasi
 *      ishlatiladi (interfeys mazmunan bir xil).
 *   2) `storage` — boshqa TABda chiqilsa bu tab ham yopilsin degan qoida.
 *      Mobilda tab tushunchasi yo'q, ilova bitta nusxada ishlaydi — bu
 *      obuna ataylab OLIB TASHLANDI, ekvivalenti yo'q.
 */
refreshTokenManager.onSessionExpired(() => {
  useAuthStore.setState({ user: null, status: AUTH_STATUS.ANONYMOUS, error: null });
});
