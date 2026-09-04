/**
 * LiveKit token'i ichidagi ruxsatlarni o'qish.
 *
 * Token JWT: uchinchi qismi imzo, o'rtasi ochiq JSON. Uni tekshirmaymiz —
 * haqiqiy nazorat serverda. Bizga faqat interfeysni to'g'ri ko'rsatish uchun
 * kerak: mikrofon taqiqlangan bo'lsa, uni yoqiq holda ko'rsatib aldamaymiz.
 */

/** Grant ichida manbalar matn ko'rinishida keladi: "camera", "microphone", … */
export const MIC_TRACK = "microphone";

interface VideoGrant {
  canPublish?: boolean;
  canPublishSources?: string[];
}

function readVideoGrant(token: string): VideoGrant | null {
  const payload = token.split(".")[1];
  if (!payload) return null;
  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")), (
      character
    ) => character.charCodeAt(0));
    const claims = JSON.parse(new TextDecoder().decode(bytes)) as { video?: VideoGrant };
    return claims.video ?? null;
  } catch {
    return null;
  }
}

/**
 * Token shu manbani uzatishga ruxsat beradimi.
 *
 * Token o'qilmasa `true` qaytadi — eski/kutilmagan formatda bo'lsa ham
 * imkoniyat yopilib qolmasin, chunki haqiqiy taqiqni server baribir qo'yadi.
 */
export function tokenAllowsTrack(token: string, source: string): boolean {
  const grant = readVideoGrant(token);
  if (!grant) return true;
  if (grant.canPublish === false) return false;
  const sources = grant.canPublishSources;
  // Ro'yxat bo'sh yoki yo'q — cheklov yo'q (LiveKit shartnomasi).
  return !sources?.length || sources.includes(source);
}
