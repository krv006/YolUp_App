import { env } from "@/shared/config";

export const apiConfig = Object.freeze({
  baseUrl: env.apiUrl,
  timeoutMs: env.requestTimeout,
  defaultHeaders: Object.freeze({ Accept: "application/json" }) as Readonly<Record<string, string>>,
});
