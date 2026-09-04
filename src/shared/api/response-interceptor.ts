import { createApiError } from "./api-error";
import { readApiResponse, unwrapApiResponse, type ResponseType } from "./api-response";

export interface HandleResponseOptions {
  responseType?: ResponseType;
  requestId?: string | null;
}

export async function handleApiResponse(
  response: Response,
  options: HandleResponseOptions = {}
): Promise<unknown> {
  const payload = await readApiResponse(response, options.responseType);
  const requestId = response.headers.get("x-request-id") ?? options.requestId ?? null;
  const failedEnvelope =
    payload && typeof payload === "object" && (payload as { success?: unknown }).success === false;

  if (!response.ok || failedEnvelope) {
    throw createApiError({ payload, status: response.status, requestId });
  }
  return unwrapApiResponse(payload);
}
