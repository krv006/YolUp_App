import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

const FALLBACK_FILE_NAME = "fokus-fayl";
/** Yuklab olingan fayllar shu yerda — keshda, OS o'zi tozalab turadi. */
const DOWNLOAD_DIR = "downloads";

/**
 * Veb `src/shared/lib/download.ts` ning mobil varianti.
 *
 * Veb'da `<a download>` bosilardi va brauzer qolganini o'zi qilardi. Mobilda
 * "Yuklab olishlar papkasi" tushunchasi bir xil emas, shuning uchun:
 *   1) blob keshdagi faylga yoziladi,
 *   2) OS ning ulashish oynasi ochiladi — foydalanuvchi uni saqlaydi,
 *      boshqa ilovada ochadi yoki yuboradi.
 *
 * Veb'dan farqi: funksiya ASINXRON (fayl tizimi shuni talab qiladi).
 * Chaqiruvchilar (`homework.queries.ts`) uni `async` mutatsiya ichida
 * ishlatadi, shuning uchun bu farq ularga tegmaydi.
 */
export async function downloadBlob(
  blob: Blob | null | undefined,
  fileName = FALLBACK_FILE_NAME
): Promise<boolean> {
  if (!blob) return false;

  try {
    const directory = new Directory(Paths.cache, DOWNLOAD_DIR);
    if (!directory.exists) directory.create({ intermediates: true });

    const file = new File(directory, sanitizeFileName(fileName));
    file.create({ overwrite: true });
    file.write(await blobToBase64(blob), { encoding: "base64" });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, {
        mimeType: blob.type || undefined,
        dialogTitle: fileName,
      });
    }
    return true;
  } catch (error) {
    console.warn("[download] faylni saqlab bo'lmadi", error);
    return false;
  }
}

/**
 * Fayl nomidagi yo'l ajratgichlari va boshqa xavfli belgilar olib tashlanadi —
 * nom serverdan keladi, unga ishonib bo'lmaydi.
 */
function sanitizeFileName(name: string): string {
  const cleaned = name
    .replace(/[/\\?%*:|"<>\x00-\x1f]/g, "-")
    .replace(/^\.+/, "")
    .trim();
  return cleaned || FALLBACK_FILE_NAME;
}

/**
 * RN'ning Blob'ida `arrayBuffer()` yo'q, shuning uchun FileReader orqali
 * base64 ga o'giramiz — bu yo'l ikkala platformada ham ishonchli ishlaydi.
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("Faylni o'qib bo'lmadi"));
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      // `data:<mime>;base64,<payload>` -> `<payload>`
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.readAsDataURL(blob);
  });
}
