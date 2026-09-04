const SCREEN_SHARE_REQUEST_TOPIC = "fokus.screen-share.request";

export interface ScreenShareRequestSignal {
  type: "screen-share-request";
  name: string;
}

export function encodeScreenShareRequest(name: string): {
  payload: Uint8Array<ArrayBuffer>;
  topic: string;
} {
  const encoded = new TextEncoder().encode(
    JSON.stringify({ type: "screen-share-request", name: name.trim() } satisfies ScreenShareRequestSignal)
  );
  const payload = new Uint8Array(new ArrayBuffer(encoded.byteLength));
  payload.set(encoded);

  return {
    payload,
    topic: SCREEN_SHARE_REQUEST_TOPIC,
  };
}

export function decodeScreenShareRequest(
  payload: Uint8Array,
  topic?: string
): ScreenShareRequestSignal | null {
  if (topic !== SCREEN_SHARE_REQUEST_TOPIC) return null;

  try {
    const value = JSON.parse(new TextDecoder().decode(payload)) as Partial<ScreenShareRequestSignal>;
    if (value.type !== "screen-share-request" || typeof value.name !== "string") return null;
    return { type: value.type, name: value.name.trim() };
  } catch {
    return null;
  }
}
