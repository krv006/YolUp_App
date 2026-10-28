import { useNetInfo } from "@react-native-community/netinfo";

/**
 * Tarmoq holati — veb `shared/model/use-online-status.ts` (`navigator.onLine`).
 *
 * `isInternetReachable` ustuvor (`shared/lib/network.ts` dagi sabab bilan);
 * holat hali aniqlanmagan (`null`) paytda onlayn deb hisoblanadi — aks holda
 * har ekran ochilishida bir lahza "offline" ogohlantirishi chiqib ketardi.
 */
export function useOnlineStatus(): boolean {
  const state = useNetInfo();
  return state.isInternetReachable ?? state.isConnected ?? true;
}
