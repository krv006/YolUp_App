import { isOnline } from "@/shared/lib/network";
import { apiConfig } from "./api-config";
import { AppError, createTransportError } from "./api-error";
import { buildRequestUrl, createRequestInit, type RequestOptions } from "./request-interceptor";
import { handleApiResponse } from "./response-interceptor";
import { refreshTokenManager } from "./refresh-token-manager";

/**
 * Veb `src/shared/api/api-client.ts` ning porti.
 *
 * Yagona farq: offline holatini `navigator.onLine` emas, NetInfo beradi
 * (`@/shared/lib/network`). Qolgan hammasi — timeout, 401 -> refresh -> bir
 * marta qayta yuborish, xato konvertatsiyasi — o'zgarishsiz.
 */

function createRequestId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `req-${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
}

interface ManagedSignal {
  signal: AbortSignal;
  didTimeOut: () => boolean;
  cleanup: () => void;
}

/** Tashqi `signal` va timeout'ni bitta AbortController ostida birlashtiradi. */
function createSignal(externalSignal: AbortSignal | undefined, timeoutMs: number): ManagedSignal {
  const controller = new AbortController();
  let timedOut = false;
  const abortFromExternal = () => controller.abort(externalSignal?.reason);
  externalSignal?.addEventListener("abort", abortFromExternal, { once: true });
  const timeoutId = globalThis.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  return {
    signal: controller.signal,
    didTimeOut: () => timedOut,
    cleanup() {
      globalThis.clearTimeout(timeoutId);
      externalSignal?.removeEventListener("abort", abortFromExternal);
    },
  };
}

export interface ApiClientInit {
  baseUrl?: string;
  timeoutMs?: number;
}

export class ApiClient {
  readonly baseUrl: string;
  readonly timeoutMs: number;

  constructor({ baseUrl = apiConfig.baseUrl, timeoutMs = apiConfig.timeoutMs }: ApiClientInit = {}) {
    this.baseUrl = baseUrl;
    this.timeoutMs = timeoutMs;
  }

  async request<T = unknown>(
    path: string,
    options: RequestOptions = {},
    isRetry = false
  ): Promise<T> {
    const requestId = options.requestId ?? createRequestId();
    const requestUrl = buildRequestUrl(this.baseUrl, path, options.query);
    const requestOptions: RequestOptions = { ...options, requestId };
    const requestSignal = createSignal(options.signal, options.timeoutMs ?? this.timeoutMs);

    try {
      const response = await fetch(
        requestUrl,
        createRequestInit(requestOptions, requestSignal.signal, apiConfig.defaultHeaders)
      );

      // 401 -> bir marta refresh qilib, so'rovni qaytadan yuboramiz.
      if (
        response.status === 401 &&
        !isRetry &&
        !options.skipAuth &&
        !options.skipRefresh &&
        (await refreshTokenManager.refresh())
      ) {
        return this.request<T>(path, options, true);
      }

      return (await handleApiResponse(response, {
        responseType: options.responseType,
        requestId,
      })) as T;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw createTransportError(error, {
        timedOut: requestSignal.didTimeOut(),
        aborted: requestSignal.signal.aborted,
        offline: !isOnline(),
      });
    } finally {
      requestSignal.cleanup();
    }
  }

  get<T = unknown>(path: string, options?: RequestOptions) {
    return this.request<T>(path, { ...options, method: "GET" });
  }
  post<T = unknown>(path: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>(path, { ...options, method: "POST", body });
  }
  put<T = unknown>(path: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>(path, { ...options, method: "PUT", body });
  }
  patch<T = unknown>(path: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>(path, { ...options, method: "PATCH", body });
  }
  delete<T = unknown>(path: string, options?: RequestOptions) {
    return this.request<T>(path, { ...options, method: "DELETE" });
  }
}

export const apiClient = new ApiClient();
