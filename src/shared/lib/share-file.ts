import { Directory, File, Paths } from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

/** Yaratilgan hisobotlar shu yerda — keshda, OS o'zi tozalab turadi. */
const REPORT_DIR = "reports";

function sanitize(name: string): string {
  return name.replace(/[/\\?%*:|"<>\x00-\x1f]/g, "-").replace(/^\.+/, "").trim() || "report";
}

function freshFile(name: string): File {
  const directory = new Directory(Paths.cache, REPORT_DIR);
  if (!directory.exists) directory.create({ intermediates: true });
  const file = new File(directory, sanitize(name));
  if (file.exists) file.delete();
  return file;
}

async function share(file: File, mimeType: string, title: string): Promise<boolean> {
  if (!(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: title, UTI: mimeType === "application/pdf" ? "com.adobe.pdf" : undefined });
  return true;
}

/**
 * Matnli fayl (CSV va h.k.) — vebdagi `<a download>` o'rni: keshdagi faylga
 * yoziladi va tizimning ulashish oynasi ochiladi (saqlash yoki yuborish).
 */
export async function shareTextFile(name: string, content: string, type: string): Promise<boolean> {
  try {
    const file = freshFile(name);
    file.create();
    file.write(content);
    return await share(file, type.split(";")[0] ?? type, name);
  } catch (error) {
    console.warn("[share] faylni saqlab bo'lmadi", error);
    return false;
  }
}

export interface PdfPage {
  /** Nuqtalarda (A4 albom — 842 × 595). */
  width: number;
  height: number;
  margin: number;
}

/**
 * HTML'dan PDF — vebdagi chop etish oynasi (`window.print`) o'rni:
 * `expo-print` sahifani PDF'ga aylantiradi, fayl `<name>` bilan keshga
 * qo'yiladi va ulashish oynasi ochiladi.
 */
export async function shareHtmlAsPdf(name: string, html: string, page: PdfPage): Promise<boolean> {
  try {
    const { uri } = await Print.printToFileAsync({
      html,
      width: page.width,
      height: page.height,
      margins: { top: page.margin, bottom: page.margin, left: page.margin, right: page.margin },
    });
    const target = freshFile(name.endsWith(".pdf") ? name : `${name}.pdf`);
    new File(uri).move(target);
    return await share(target, "application/pdf", name);
  } catch (error) {
    console.warn("[share] PDF yaratib bo'lmadi", error);
    return false;
  }
}
