export type ResponseType = "json" | "text" | "blob";

export async function readApiResponse(
  response: Response,
  responseType: ResponseType = "json"
): Promise<unknown> {
  if (response.status === 204) return null;
  if (responseType === "blob") return response.blob();
  if (responseType === "text") return response.text();
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) return response.json().catch(() => null);
  return response.text().catch(() => null);
}

/** Backend `{ success: true, data }` konvertini ochadi; boshqa shakllarni o‘zgarishsiz qaytaradi. */
export function unwrapApiResponse(payload: unknown): unknown {
  if (payload && typeof payload === "object" && (payload as { success?: unknown }).success === true) {
    return (payload as { data: unknown }).data;
  }
  return payload;
}
