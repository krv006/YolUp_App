import { useShallow } from "zustand/react/shallow";
import { AUTH_STATUS, useAuthStore } from "./auth.store";

/**
 * Auth global holati — zustand. Provider ham, Context ham yo'q.
 * Faqat kerakli maydonlarni tanlang, shunda ortiqcha render bo'lmaydi.
 */
export function useAuth() {
  return useAuthStore(
    useShallow((state) => ({
      user: state.user,
      status: state.status,
      isAuthenticated: state.status === AUTH_STATUS.AUTHENTICATED,
      isInitializing: state.status === AUTH_STATUS.INITIALIZING,
      initializationError: state.status === AUTH_STATUS.ERROR ? state.error : null,
      login: state.login,
      logout: state.logout,
      retrySession: state.retry,
    }))
  );
}

/** Faqat foydalanuvchi kerak bo'lganda — eng arzon selektor. */
export function useCurrentUser() {
  return useAuthStore((state) => state.user);
}

export function useIsAuthenticated() {
  return useAuthStore((state) => state.status === AUTH_STATUS.AUTHENTICATED);
}
