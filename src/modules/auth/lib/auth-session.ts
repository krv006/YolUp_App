import { AppError, API_ERROR_CODES, refreshTokenManager, tokenStorage } from "@/shared/api";
import { authApi } from "../api/auth.api";
import { mapTokenPairDto } from "./auth.mappers";

let configured = false;

/** `apiClient` 401 olganda chaqiradigan refresh strategiyasini bir marta ro'yxatdan o'tkazadi. */
export function configureAuthRefresh(): void {
  if (configured) return;
  refreshTokenManager.configure(async () => {
    const refresh = tokenStorage.getRefreshToken();
    if (!refresh) {
      throw new AppError({ code: API_ERROR_CODES.UNAUTHORIZED, message: "Sessiya tugagan" });
    }
    const persistent = tokenStorage.isPersistent();
    const tokenPair = mapTokenPairDto(await authApi.refresh({ refresh }));
    tokenStorage.setTokens(tokenPair, { persistent });
  });
  configured = true;
}
