import { shareTextFile } from "@/shared/lib";

/**
 * Veb `modules/parent/lib/download-file.ts` ning mobil varianti: vebda
 * `<a download>` bosilardi; mobilda matn keshdagi faylga yoziladi va
 * ulashish oynasi ochiladi (`shared/lib/share-file.ts`). Asinxron — fayl
 * tizimi shuni talab qiladi.
 */
export function downloadFile(name: string, content: string, type: string): Promise<boolean> {
  return shareTextFile(name, content, type);
}
