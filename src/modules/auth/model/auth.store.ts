import { create } from "zustand";
import { AppError, announceSessionChange, refreshTokenManager, tokenStorage } from "@/shared/api";
import type { TokenPair } from "@/shared/api";
import { SUPPORTED_LANGUAGES, useLanguageStore, useTextSizeStore, type AppLanguage } from "@/shared/model";
import { useAppearanceStore } from "@/shared/model/theme.store";
import type { AuthStatus, AuthUser, LoginCredentials } from "@/shared/types";
import { unregisterPushDevice } from "@/modules/notification/model/push-device";
import { authApi } from "../api/auth.api";
import type { RegisterRequestDto, TwoFactorChallenge } from "../api/auth.dto";
import {
  mapLoginRequest,
  mapLoginResponse,
  mapSwitchAccountResponse,
  mapTokenPairDto,
  mapUserDto,
} from "../lib/auth.mappers";
import { configureAuthRefresh } from "../lib/auth-session";

/*
 * Til serverdagi profil bilan bog'liq — veb `auth.store.ts` dagi kabi.
 * Kirish/tiklash paytida serverdagi `preferred_language` qo'llanadi;
 * foydalanuvchi tilni o'zgartirsa, u serverga yoziladi. Serverdan kelgan
 * tilni qo'llayotganda uni qaytarib serverga yubormaslik uchun bayroq.
 */
let suppressLanguagePush = false;

/*
 * 🟡 Vebdagi `useThemeStore` mobilda `useAppearanceStore` (mavzu, urg'u rangi,
 * xabar o'lchami bir do'konda).
 */
function syncPreferencesFromServer(user: AuthUser) {
  if (user.theme && useAppearanceStore.getState().mode !== user.theme) useAppearanceStore.getState().setMode(user.theme);
  if (user.textSize && useTextSizeStore.getState().size !== user.textSize) useTextSizeStore.getState().setSize(user.textSize);
}

function syncLanguageFromServer(preferred: string) {
  if (!SUPPORTED_LANGUAGES.includes(preferred as AppLanguage)) return;
  if (useLanguageStore.getState().language === preferred) return;
  suppressLanguagePush = true;
  useLanguageStore.getState().setLanguage(preferred as AppLanguage);
  suppressLanguagePush = false;
}

export const AUTH_STATUS = Object.freeze({
  ANONYMOUS: "anonymous",
  INITIALIZING: "initializing",
  AUTHENTICATED: "authenticated",
  ERROR: "error",
}) satisfies Record<string, AuthStatus>;

export type LoginResult =
  | { status: "authenticated"; user: AuthUser }
  | { status: "twoFactor"; challenge: TwoFactorChallenge };

interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;
  error: AppError | null;

  /** Ilova ochilganda bir marta chaqiriladi: saqlangan token bo'lsa profilni tiklaydi. */
  bootstrap: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<LoginResult>;
  completeTwoFactorLogin: (
    challengeToken: string,
    code: string,
    remember?: boolean
  ) => Promise<AuthUser>;
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
 * Oxirgi ma'lum profil — ilova `me/` javobini kutmasdan ochilishi uchun.
 * 🟡 Vebda modul yuklanganda o'qiladi; mobilda tokenlar Keychain'dan
 * `hydrate()` bilan keyinroq keladi, shuning uchun `bootstrap()` ichida.
 */
function cachedUser(): AuthUser | null {
  try {
    const raw = tokenStorage.readUser();
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
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
  // Mobilda `setTokens` profil keshini saqlab qoladi — yangi sessiyada eskisi qolmasin.
  tokenStorage.writeUser(null);
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
      const cached = get().user ?? cachedUser();
      if (cached) set({ user: cached, status: AUTH_STATUS.AUTHENTICATED, error: null });
      else set({ status: AUTH_STATUS.INITIALIZING, error: null });
      try {
        const user = mapUserDto(await authApi.getCurrentUser());
        set({ user, status: AUTH_STATUS.AUTHENTICATED, error: null });
        syncLanguageFromServer(user.preferredLanguage);
        syncPreferencesFromServer(user);
      } catch (error) {
        const appError = toAppError(error);
        // 401 — token yaroqsiz: sessiyani jimgina tozalaymiz, xato ekrani chiqarmaymiz.
        if (appError.status === 401) {
          tokenStorage.clearTokens();
          set({ user: null, status: AUTH_STATUS.ANONYMOUS, error: null });
          return;
        }
        // Keshdagi profil bilan ochilgan — tarmoq xatosida ham shu holatda qoladi.
        if (cached) return;
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
      const outcome = mapLoginResponse(await authApi.login(mapLoginRequest(credentials)));
      if (outcome.kind === "twoFactor") {
        return { status: "twoFactor", challenge: outcome.challenge };
      }
      const seq = beginSession(outcome.tokens, credentials.remember !== false);
      const user = mapUserDto(await authApi.getCurrentUser());
      if (seq !== sessionSeq) return { status: "authenticated", user };
      set({ user, status: AUTH_STATUS.AUTHENTICATED, error: null });
      syncLanguageFromServer(user.preferredLanguage);
      syncPreferencesFromServer(user);
      return { status: "authenticated", user };
    } catch (error) {
      endSession();
      set({ user: null, status: AUTH_STATUS.ANONYMOUS, error: null });
      throw error;
    }
  },

  async completeTwoFactorLogin(challengeToken, code, remember = true) {
    try {
      const tokens = mapTokenPairDto(
        await authApi.twoFactorLogin({ challenge_token: challengeToken, code })
      );
      const seq = beginSession(tokens, remember);
      const user = mapUserDto(await authApi.getCurrentUser());
      if (seq !== sessionSeq) return user;
      set({ user, status: AUTH_STATUS.AUTHENTICATED, error: null });
      syncLanguageFromServer(user.preferredLanguage);
      syncPreferencesFromServer(user);
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
      syncLanguageFromServer(user.preferredLanguage);
      syncPreferencesFromServer(user);
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
    syncLanguageFromServer(user.preferredLanguage);
    syncPreferencesFromServer(user);
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
    /*
     * Qurilma push ro'yxatidan CHIQARILADI — tokenlar tozalanishidan
     * oldin, chunki so'rov autentifikatsiyani talab qiladi.
     *
     * Usiz telefondan chiqib ketgan foydalanuvchiga bildirishnoma kelib
     * turaverardi: backend uchun qurilma hali ham o'sha hisobga bog'liq
     * bo'lib qolardi.
     *
     * 🆕 mobil qadam — vebda qurilma tushunchasi yo'q.
     */
    await unregisterPushDevice();
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

useAuthStore.subscribe((state, prevState) => {
  if (state.user === prevState.user) return;
  tokenStorage.writeUser(state.user ? JSON.stringify(state.user) : null);
});

useLanguageStore.subscribe((state, prevState) => {
  if (suppressLanguagePush || state.language === prevState.language) return;
  if (useAuthStore.getState().status !== AUTH_STATUS.AUTHENTICATED) return;
  // Saqlanmasa ham til qurilmada qoladi — keyingi o'zgarishda qayta yuboriladi.
  authApi.updateLanguage(state.language).catch(() => undefined);
});

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
 * Til sinxroni (`syncLanguageFromServer`) i18n kiritilgach qaytarildi
 * (DECISIONS §23) — fayl boshida.
 */
refreshTokenManager.onSessionExpired(() => {
  useAuthStore.setState({ user: null, status: AUTH_STATUS.ANONYMOUS, error: null });
});
