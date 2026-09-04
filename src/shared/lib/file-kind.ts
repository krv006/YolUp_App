/** Faylni platforma ichida qanday ko'rsatish mumkinligi. */
export type FileKind = "pdf" | "image" | "video" | "audio" | "other";

const EXTENSION_KINDS: Array<[FileKind, string[]]> = [
  ["pdf", ["pdf"]],
  ["image", ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg", "avif"]],
  ["video", ["mp4", "webm", "ogv", "mov"]],
  ["audio", ["mp3", "wav", "ogg", "m4a", "aac"]],
];

/** MIME turi ishonchli bo'lmasa (masalan `application/octet-stream`) kengaytmaga tayanamiz. */
export function fileKindOf(mimeType = "", name = ""): FileKind {
  const mime = mimeType.toLowerCase();
  if (mime.includes("pdf")) return "pdf";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";

  const extension = name.toLowerCase().split(".").pop() ?? "";
  const match = EXTENSION_KINDS.find(([, extensions]) => extensions.includes(extension));
  return match ? match[0] : "other";
}

const KIND_MIME: Record<Exclude<FileKind, "other">, string> = {
  pdf: "application/pdf",
  image: "image/*",
  video: "video/*",
  audio: "audio/*",
};

/**
 * Brauzer faylni ichida ochishi uchun blob turi to'g'ri bo'lishi shart:
 * `application/octet-stream` kelsa `<iframe>` uni ko'rsatmay, yuklab oladi.
 * Aniq tur faqat PDF uchun ma'lum — qolganlarida server berganini qoldiramiz.
 */
export function blobForViewing(blob: Blob, kind: FileKind): Blob {
  if (kind === "pdf" && blob.type !== KIND_MIME.pdf) {
    return new Blob([blob], { type: KIND_MIME.pdf });
  }
  return blob;
}

/**
 * Nom kengaytmasiz kelsa (backend `file_name` yubormasa — shunchaki "Fayl"),
 * uni javobning MIME turidan to'ldiramiz: aks holda saqlangan faylni tizim
 * ochib bilmaydi. Faqat qisqa, haqiqiy kengaytmaga o'xshash qismi olinadi —
 * `application/vnd.openxmlformats-…` kabi uzunlari e'tiborsiz qoldiriladi.
 */
export function fileNameFor(name: string, mimeType = ""): string {
  if (/\.[a-z0-9]{2,5}$/i.test(name)) return name;
  const subtype = mimeType.split("/")[1]?.split(";")[0]?.trim().toLowerCase() ?? "";
  if (!/^[a-z0-9]{2,5}$/.test(subtype)) return name;
  return `${name}.${subtype === "jpeg" ? "jpg" : subtype}`;
}

export function fileKindLabel(kind: FileKind): string {
  if (kind === "pdf") return "PDF hujjat";
  if (kind === "image") return "Rasm";
  if (kind === "video") return "Video";
  if (kind === "audio") return "Audio";
  return "Fayl";
}
