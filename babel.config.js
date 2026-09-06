module.exports = function (api) {
  api.cache(true);
  return {
    /*
     * NativeWind ATAYLAB YO'Q — qayta qo'shmang.
     *
     * Avval bu yerda `["babel-preset-expo", { jsxImportSource: "nativewind" }]`
     * va `"nativewind/babel"` turardi. NativeWind butun JSX'ni o'z runtime'i
     * orqali o'tkazadi va `Pressable` ning `style` propini qayta ishlaydi —
     * FUNKSIYA ko'rinishidagi uslubni (`style={({ pressed }) => [...]}`)
     * esa umuman qo'llamaydi.
     *
     * Natijada 23 ta faylda tugmalar, ro'yxat qatorlari va ikonka tugmalari
     * fonsiz, bo'shliqsiz va bosilmaydigan bo'lib chiqardi: "Kirish" tugmasi
     * oq fonda oq matn edi (2026-09-06 da emulyatorda topildi).
     *
     * Loyihada `className` BIRORTA joyda ishlatilmaydi — uslublar
     * `StyleSheet` va `shared/ui/tokens.ts` orqali beriladi, shuning uchun
     * NativeWind hech qanday foyda bermay, faqat zarar keltirardi.
     */
    presets: ["babel-preset-expo"],
    plugins: [
      // Reanimated/worklets plugini HAR DOIM oxirgi bo'lishi shart.
      "react-native-worklets/plugin",
    ],
  };
};
