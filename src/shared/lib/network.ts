import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";

/**
 * Tarmoq holati — veb'dagi `navigator.onLine` va `online` hodisasining o'rni.
 *
 * NetInfo asinxron ishlaydi, lekin `ApiClient` xato yasashda holatni SINXRON
 * so'raydi. Shuning uchun oxirgi ma'lum holat xotirada saqlanadi va modul
 * yuklanganda obuna ochiladi.
 *
 * `isInternetReachable` ataylab ustuvor: O'zbekistonda mobil internet
 * "ulangan, lekin o'tmaydi" holati keng tarqalgan (Wi-Fi captive portal,
 * balans tugashi). `isConnected` bunday paytda ham `true` qaytaradi.
 */

let online = true;

NetInfo.addEventListener((state: NetInfoState) => {
  online = state.isInternetReachable ?? state.isConnected ?? true;
});

/** Sinxron: oxirgi ma'lum tarmoq holati. */
export function isOnline(): boolean {
  return online;
}

/**
 * Tarmoq qaytganda chaqiriladi (offline -> online o'tishi).
 * Obunani bekor qiluvchi funksiya qaytaradi.
 */
export function onOnline(callback: () => void): () => void {
  let previous = online;
  return NetInfo.addEventListener((state: NetInfoState) => {
    const next = state.isInternetReachable ?? state.isConnected ?? true;
    if (next && !previous) callback();
    previous = next;
  });
}

/** Haqiqiy holatni serverdan so'rab tekshiradi (keshlangan qiymat emas). */
export async function refreshNetworkState(): Promise<boolean> {
  const state = await NetInfo.fetch();
  online = state.isInternetReachable ?? state.isConnected ?? true;
  return online;
}
