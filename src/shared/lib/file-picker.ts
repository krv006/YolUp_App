import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";

/**
 * Fayl tanlash va uni ko'chirilgan API qatlamiga uzatish.
 *
 * MUAMMO: veb API qatlami (`homework.api.ts`, `auth.api.ts`, …) `File`
 * kutadi — bu brauzer tipi, RN'da mavjud emas. RN'ning `FormData` si esa
 * `{ uri, name, type }` shaklidagi obyektni fayl deb qabul qiladi.
 *
 * YECHIM: shunday obyekt yasaymiz va uni `File` sifatida uzatamiz. Bu xavfsiz,
 * chunki ko'chirilgan kod fayldan FAQAT `name` va `size` ni o'qiydi
 * (`validateHomeworkFile`), qolganini to'g'ridan-to'g'ri `FormData` ga beradi —
 * u yerda esa aynan `{ uri, name, type }` kerak.
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

/** `File` o'rniga uzatiladigan RN obyekti (izohi yuqorida). */
export function toUploadFile(picked: PickedFile): File {
  return {
    uri: picked.uri,
    name: picked.name,
    type: picked.mimeType,
    size: picked.size,
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
  const permission =
    source === "camera"
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) return null;

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
