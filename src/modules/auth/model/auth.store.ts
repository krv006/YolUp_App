import { create } from "zustand";
import { AppError, announceSessionChange, refreshTokenManager, tokenStorage } from "@/shared/api";
import type { TokenPair } from "@/shared/api";
import type { AuthStatus, AuthUser, LoginCredentials } from "@/shared/types";
import { authApi } from "../api/auth.api";
import type { RegisterRequestDto } from "../api/auth.dto";
import {
  mapLoginRequest,
  mapSwitchAccountResponse,
  mapTokenPairDto,
  mapUserDto,
} from "../lib/auth.mappers";
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
  register: (dto: RegisterRequestDto) => Promise<AuthUser>;
  /** Bog'langan boshqa hisobga o'tish (masalan ota-ona -> o'quvchi). */
  switchAccount: (userId: string) => Promise<AuthUser>;
  /** Bitta hisob ichida rolni almashtirish. */
  switchRole: (role: string) => Promise<AuthUser>;
  /** Server qaytargan yangi token+profil juftligini joriy sessiya qilib oladi. */
  adoptSession: (response: unknown) => AuthUser;
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

/**
 * Sessiya raqami. Har ochilish va yopilishda oshadi.
 *
 * NEGA KERAK: `login()` ikki bosqichdan iborat — avval token olinadi, keyin
 * `me/` so'raladi. Shu orada foydalanuvchi hisobni almashtirsa yoki chiqsa,
 * kechikib kelgan `me/` javobi ALLAQACHON eskirgan bo'ladi. Raqam mos
 * kelmasa, javob jimgina tashlab yuboriladi va eski profil yangisining
 * ustiga yozilmaydi.
 */
let sessionSeq = 0;

function beginSession(tokens: TokenPair, persistent: boolean): number {
  sessionSeq += 1;
  announceSessionChange();
  tokenStorage.setTokens(tokens, { persistent });
  return sessionSeq;
}

function endSession(): void {
  sessionSeq += 1;
  tokenStorage.clearTokens();
  announceSessionChange();
}

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
      const seq = beginSession(tokens, credentials.remember !== false);
      const user = mapUserDto(await authApi.getCurrentUser());
      if (seq !== sessionSeq) return user;
      set({ user, status: AUTH_STATUS.AUTHENTICATED, error: null });
      return user;
    } catch (error) {
      // Yarim ochilgan sessiya qolmasin.
      endSession();
      set({ user: null, status: AUTH_STATUS.ANONYMOUS, error: null });
      throw error;
    }
  },

  async register(dto) {
    try {
      const tokens = mapTokenPairDto(await authApi.register(dto));
      const seq = beginSession(tokens, true);
      const user = mapUserDto(await authApi.getCurrentUser());
      if (seq !== sessionSeq) return user;
      set({ user, status: AUTH_STATUS.AUTHENTICATED, error: null });
      return user;
    } catch (error) {
      endSession();
      set({ user: null, status: AUTH_STATUS.ANONYMOUS, error: null });
      throw error;
    }
  },

  async switchAccount(userId) {
    return get().adoptSession(await authApi.switchAccount(userId));
  },

  async switchRole(role) {
    return get().adoptSession(await authApi.switchRole(role));
  },

  adoptSession(response) {
    // "Meni eslab qol" tanlovi almashgandan keyin ham saqlanadi.
    const persistent = tokenStorage.isPersistent();
    const { tokens, user } = mapSwitchAccountResponse(response);
    beginSession(tokens, persistent);
    set({ user, status: AUTH_STATUS.AUTHENTICATED, error: null });
    return user;
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
      endSession();
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
 * 🟡 MOBIL FARQI (MOBILE_PLAN §4.2, DECISIONS §22):
 *
 * Veb versiya ikkita `window` hodisasiga obuna bo'lardi:
 *   1) `SESSION_EXPIRED_EVENT` — CustomEvent orqali kelardi. Mobilda global
 *      hodisa shinasi yo'q, shuning uchun refresh menejerining o'z obunasi
 *      ishlatiladi (interfeys mazmunan bir xil).
 *   2) `storage` — boshqa TABda hisob almashtirilsa bu tab ham ergashsin
 *      degan qoida. Mobilda tab tushunchasi yo'q, ilova bitta nusxada
 *      ishlaydi — bu obuna va u bilan kelgan `syncSessionFromOtherTab`
 *      ataylab OLIB TASHLANDI, ekvivalenti yo'q.
 *
 * Veb'dagi til (i18n) sinxroni ham ko'chirilmadi — mobilda i18n hali yo'q
 * (DECISIONS §13). Qo'shilganda `syncLanguageFromServer` shu yerga qaytadi.
 */
refreshTokenManager.onSessionExpired(() => {
  useAuthStore.setState({ user: null, status: AUTH_STATUS.ANONYMOUS, error: null });
});
