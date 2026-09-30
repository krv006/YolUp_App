import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { File as FileSystemFile } from "expo-file-system";
// Barrel EMAS: `@/shared/ui` orqali kelsa aylanma import hosil bo'ladi.
import { toast } from "@/shared/ui/toast";

/**
 * Fayl tanlash va uni ko'chirilgan API qatlamiga uzatish.
 *
 * MUAMMO: veb API qatlami (`homework.api.ts`, `auth.api.ts`, …) `File`
 * kutadi — bu brauzer tipi, RN'da mavjud emas.
 *
 * YECHIM: `File` o'rniga mos obyekt yasaymiz va uni `File` sifatida
 * uzatamiz. Bu xavfsiz, chunki ko'chirilgan kod fayldan FAQAT `name` va
 * `size` ni o'qiydi (`validateHomeworkFile`), qolganini to'g'ridan-to'g'ri
 * `FormData` ga beradi.
 *
 * Cast shu yerda, BITTA joyda qilinadi va sababi yozilgan; API qatlamining
 * o'zi 🟢 NUSXA bo'lib qoladi.
 */

export interface PickedFile {
  uri: string;
  name: string;
  size: number;
  mimeType: string;
}

/**
 * `File` o'rniga uzatiladigan obyekt.
 *
 * ┌─ NEGA `uri` YETMAYDI ─────────────────────────────────────────────────┐
 * │ Ilgari bu yerda `{ uri, name, type, size }` qaytarilardi — React      │
 * │ Native'ning `FormData` si aynan shunday obyektni fayl deb tushunadi.  │
 * │                                                                       │
 * │ Expo SDK 54 dan boshlab ilovada `fetch` — Expo'ning O'Z              │
 * │ implementatsiyasi va u `uri` ni UMUMAN bilmaydi. Uning               │
 * │ `convertFormData.ts` fayli har bir qismni faqat uch holatda qabul    │
 * │ qiladi: satr, `Blob`, yoki `bytes()` metodi bor obyekt. Boshqasida:  │
 * │                                                                       │
 * │   Error: Unsupported FormDataPart implementation                      │
 * │                                                                       │
 * │ Bu xato so'rov ketishidan OLDIN otiladi, shuning uchun API qatlami   │
 * │ uni oddiy tarmoq uzilishi deb ko'rsatardi ("Server bilan bog'lanib   │
 * │ bo'lmadi"). Natijada ilovadagi HAMMA yuklash ishlamasdi: profil      │
 * │ rasmi, sertifikat, guruh rasmi, vazifa fayllari, test importi.       │
 * │                                                                       │
 * │ Endi fayl `expo-file-system` ning `File` i orqali o'qiladi — unda    │
 * │ `bytes()` bor. Nom va MIME tanlagichdan olinadi: `File.name` kesh    │
 * │ faylining nomini berardi (`00dd3fa1-….jpeg`), foydalanuvchi tanlagan │
 * │ nom esa yo'qolardi.                                                   │
 * └───────────────────────────────────────────────────────────────────────┘
 */
export function toUploadFile(picked: PickedFile): File {
  const source = new FileSystemFile(picked.uri);
  return {
    name: picked.name,
    type: picked.mimeType,
    // Tanlagich o'lchamni bermasa (kamera) fayldan o'qiladi.
    size: picked.size || source.size,
    bytes: () => source.bytes(),
  } as unknown as File;
}

/** Foydalanuvchi bekor qilsa `null`. */
export async function pickDocument(mimeTypes?: string[]): Promise<PickedFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: mimeTypes ?? "*/*",
    // Fayl keshga ko'chiriladi — aks holda content:// URI ni yuklab
    // bo'lmaydi (Androidda ruxsat so'rovdan oldin tugaydi).
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];

  return {
    uri: asset.uri,
    name: asset.name || "fayl",
    size: asset.size ?? 0,
    mimeType: asset.mimeType || "application/octet-stream",
  };
}

/**
 * Rasm tanlash yoki kamera.
 *
 * `quality: 0.7` ATAYLAB: telefon kamerasi 5–12 MB rasm beradi, backend
 * chegarasi esa 25 MB. Siqishsiz bir nechta rasmli topshiriq chegaradan
 * oshib ketadi va mobil internetda uzoq yuklanadi.
 */
export async function pickImage(source: "camera" | "library"): Promise<PickedFile | null> {
  /*
   * GALEREYA uchun ruxsat SO'RALMAYDI — ataylab.
   *
   * ┌─ NIMA BUZILGAN EDI ───────────────────────────────────────────────────┐
   * │ Ilgari bu yerda `requestMediaLibraryPermissionsAsync()` turardi va    │
   * │ rad javobda jimgina `null` qaytarilardi. Android 13+ da o'sha ruxsat  │
   * │ (`READ_MEDIA_IMAGES`) manifestda `maxSdkVersion="33"` bilan keladi,   │
   * │ ya'ni yangi Androidda U UMUMAN QO'LLANILMAYDI va so'rov hech qachon   │
   * │ `granted` bo'lmaydi.                                                  │
   * │                                                                       │
   * │ Natijada Android 14/15/16 telefonida profil rasmini almashtirish,     │
   * │ guruh rasmi va rasm biriktirish — hammasi JIM ishlamasdi: bosasiz,    │
   * │ hech narsa ochilmaydi, xato ham chiqmaydi.                            │
   * │                                                                       │
   * │ Aslida ruxsat kerak emas: `expo-image-picker` tizimning Photo Picker  │
   * │ oynasini ochadi (o'z manifestida `photopicker_activity` e'lon         │
   * │ qilingan). U alohida jarayonda ishlaydi va foydalanuvchi TANLAGAN     │
   * │ faylgagina vaqtinchalik ruxsat beradi — shuning uchun ilovaning       │
   * │ galereyaga umumiy ruxsati talab qilinmaydi.                           │
   * └───────────────────────────────────────────────────────────────────────┘
   *
   * KAMERA esa boshqa: `CAMERA` ruxsati haqiqatan shart. U rad etilsa
   * sabab AYTILADI — yana jim qolmasin.
   */
  if (source === "camera") {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      toast.error(
        permission.canAskAgain
          ? "Kameraga ruxsat berilmadi."
          : "Kameraga ruxsat yopilgan. Telefon sozlamalaridan oching."
      );
      return null;
    }
  }

  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ["images"],
    quality: 0.7,
    allowsMultipleSelection: false,
  };

  const result =
    source === "camera"
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];

  // Kameradan kelgan rasmda nom bo'lmasligi mumkin — o'zimiz beramiz,
  // chunki backend kengaytmaga qarab fayl turini aniqlaydi.
  const name = asset.fileName || `rasm-${Date.now()}.jpg`;

  return {
    uri: asset.uri,
    name,
    size: asset.fileSize ?? 0,
    mimeType: asset.mimeType || "image/jpeg",
  };
}
