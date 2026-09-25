# Fokus Mobile

O'zbekiston maktab o'quvchilari uchun onlayn ta'lim platformasining iOS/Android
ilovasi. Backend va veb ilova bilan **bitta API**ni bo'lishadi.

- Reja va arxitektura: [`../docs/MOBILE_PLAN.md`](../docs/MOBILE_PLAN.md)
- Port manifesti: [`docs/PORTED.md`](docs/PORTED.md)
- Qarorlar jurnali: [`docs/DECISIONS.md`](docs/DECISIONS.md)
- Backend shartnomasi: [`../docs/PROJECT.md`](../docs/PROJECT.md)

> Bu papka veb loyihaning `.gitignore` ida — **alohida git repo**. Veb loyihaga
> tegilmaydi.

## Stack

| Qatlam | Texnologiya |
|---|---|
| Platforma | Expo SDK 57 · React Native 0.86 · React 19.2 · New Architecture |
| Navigatsiya | Expo Router (`src/app/`) |
| Holat | TanStack Query v5 + Zustand v5 |
| Formalar | react-hook-form + zod (veb bilan bir xil sxemalar) |
| Stil | Dizayn tokenlari (`palette.json`) + StyleSheet; NativeWind screen'lar uchun |
| Saqlash | expo-secure-store (tokenlar) · MMKV (kesh) |

## Ishga tushirish

```bash
npm install

# Dev client build (bir marta, nativ modullar uchun shart — Expo Go yetmaydi)
npx expo run:android      # yoki: npx expo run:ios (macOS kerak)

# Keyingi safar shunchaki:
npm start
```

**Nega Expo Go emas:** loyihaga LiveKit WebRTC, Skia, MMKV, FLAG_SECURE kabi
nativ modullar kerak — Expo Go ularni ko'tarmaydi.

## Muhitlar

`APP_VARIANT` bo'yicha uchta build, har biri **alohida bundle ID** bilan —
uchalasi bitta telefonda yonma-yon turadi:

```bash
APP_VARIANT=development npm start   # uz.yolup.edu.dev
APP_VARIANT=staging     npm start   # uz.yolup.edu.staging
APP_VARIANT=production  npm start   # uz.yolup.edu
```

API manzilini almashtirish:

```bash
EXPO_PUBLIC_API_URL=https://edu.thesofmebel.uz \
EXPO_PUBLIC_WS_URL=wss://edu.thesofmebel.uz \
npm start
```

⚠️ Veb'dan farqli: mobilda **proxy yo'q**, `apiUrl` absolyut bo'lishi shart.

## Skriptlar

| Buyruq | Nima qiladi |
|---|---|
| `npm run verify` | typecheck + lint + check-deps — **PR'dan oldin shu** |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (FSD qatlam chegaralari bilan) |
| `npm run check-deps` | Har import `package.json` da e'lon qilinganmi (§ pastda) |
| `npm run check-sync` | Veb'dan ko'chirilgan fayllar o'zgarganmi (drift) |
| `npm run build:ported` | `docs/PORTED.md` manifestini qayta yasaydi |
| `npm run build:tokens` | `palette.json` -> `global.css` |
| `npm run bundle:check` | Metro bilan ikkala platformaga bundle yasaydi |

### `check-deps` nega bor

Bu papka veb loyiha **ichida** turadi. Node ham, TypeScript ham modul
topolmasa yuqoriga qarab qidiradi — natijada `sonner`, `react-dom` kabi VEB
paketlari `tsc` dan **jimgina** o'tib ketardi va faqat qurilmada yiqilardi.
Metro tomonda bu `metro.config.js` dagi `blockList` bilan yopilgan; `tsc` da
bunday sozlama yo'q, shuning uchun tekshiruv skript sifatida bajariladi.

### `check-sync` nega bor

Monorepo ATAYLAB tanlanmagan (sabablari `MOBILE_PLAN.md` §0). Buning narxi —
domen qatlami ikki nusxada yashaydi. `docs/PORTED.md` har faylning port
paytidagi veb hash'ini saqlaydi, `check-sync` esa hozirgisi bilan
solishtiradi. **Har sprint boshida ishga tushiring.**

## Struktura

Veb loyiha bilan **1:1 bir xil** (FSD): `app > pages > widgets > modules > shared`.
Alias ham bir xil (`@/*` -> `./src/*`), shuning uchun ko'chirilgan fayllarning
import satrlari o'zgartirilmaydi.

```
src/
├── app/          Expo Router marshrutlari (veb: src/app)
├── pages/        ekran komponentlari (veb: src/pages)
├── widgets/      murakkab bloklar (veb: src/widgets)
├── modules/      domen modullari — api/lib/model/ui (veb: src/modules)
├── shared/       api · config · constants · lib · types · ui
└── providers/    provider va marshrut guard'lari
                  (veb'da src/app/providers — Expo Router src/app ni
                   egallagani uchun ko'chirildi)
```

## Holat

| Faza | Holat |
|---|---|
| 0 — Poydevor, domen porti, login | ✅ Tugadi |
| 1 — Dizayn tizimi, marshrut skeleti | ✅ Tugadi (i18n bundan mustasno — DECISIONS §13) |
| 2 — Chat | ✅ Tugadi (push va delta sync backendni kutmoqda) |
| 3 — Dars, vazifa, test, ota-ona | ✅ Tugadi |
| 4 — Jonli dars (LiveKit) | ✅ Tugadi (iOS ekran ulashish v1.1) |
| 5 — Doska (Skia) | ✅ Tugadi |
| 6 — Xavfsizlik, reliz | 🟡 FLAG_SECURE + watermark bor; Sentry, testlar, do'kon qolgan |

**Veb bilan funksional taqqoslash:** [docs/PARITY.md](docs/PARITY.md) — veb'dagi
barcha 54 modul komponenti, 6 widget va 21 sahifaning mobil manzili.

**Ochiq ishlarning to'liq ro'yxati:** [docs/DECISIONS.md §15](docs/DECISIONS.md).

⚠️ **Ilova hali REAL QURILMADA ishga tushirilmagan** — bu muhitda Android SDK
va Xcode yo'q edi. Metro ikkala platformaga bundle yasaydi (`npm run
bundle:check`), bu kuchli signal, lekin ishlayotgan ilova bilan bir xil emas.
Birinchi ish — `npx expo run:android` bilan dev build.

## Qoidalar

Yangi kod yozishdan oldin `../docs/MOBILE_PLAN.md` §18 ni o'qing. Eng
muhimlari:

1. **🟢 NUSXA fayl qo'lda tahrirlanmaydi** — o'zgarish avval veb'da.
2. **Har ko'chirma `docs/PORTED.md` ga kiritiladi.**
3. **Har ekran uch holatni ko'rsatadi:** loading · empty · error.
4. **Ro'yxat = FlashList**, `ScrollView` ichida 50+ element yo'q.
5. **Bosiladigan element >= 44pt.**

## Telefonga APK qurish

```bash
npm run apk
```

APK shu yerda hosil bo'ladi:
`android/app/build/outputs/apk/release/app-release.apk`

O'rnatish:

```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

yoki APK faylni telefonga ko'chirib, fayl menejeridan oching (Android
"noma'lum manbadan o'rnatish" ruxsatini so'raydi).

**Qurishdan oldin Android Studio'ni yoping.** `expo prebuild` `android/`
papkasini qayta yaratadi, IDE esa uni ushlab turadi va qurish
`EBUSY: resource busy or locked` bilan to'xtaydi.

### Sozlash

| O'zgaruvchi | Standart | Izoh |
|---|---|---|
| `APP_VARIANT` | `production` | `development` / `staging` / `production` — paket nomi va ilova nomi shunga qarab o'zgaradi |
| `ANDROID_ABIS` | `arm64-v8a,armeabi-v7a` | faqat zamonaviy telefonlar uchun `arm64-v8a` bering — tezroq quriladi |

```bash
ANDROID_ABIS=arm64-v8a npm run apk     # tezroq
APP_VARIANT=staging npm run apk        # beta
npm run apk:emulator                   # emulyator uchun (x86_64)
```

### Har yangi versiyada

`app.config.ts` dagi `android.versionCode` ni **oshiring**. Aks holda
telefon eski versiyaning ustiga yangisini o'rnatmaydi va "ilova
o'rnatilmadi" deb xato beradi.

### Imzolash kaliti

Release APK `credentials/fokus-release.keystore` bilan imzolanadi.
Bu papka git'ga kirmaydi.

⚠️ **Kalitni zaxiralang.** Yo'qotsangiz, Play Store'ga chiqarilgan
ilovani boshqa hech qachon yangilay olmaysiz — Google boshqa kalit bilan
imzolangan yangilanishni qabul qilmaydi.

### Logotip

Logo `src/shared/ui/logo-mark.json` da — bitta manba. O'zgartirgach:

```bash
npm run build:icons   # assets/*.png qayta chiziladi
npm run apk           # yangi ikonka APK ga tushadi
```

Ilova ichidagi `<Logo />` o'sha JSON'ni to'g'ridan-to'g'ri o'qiydi,
shuning uchun u avtomatik yangilanadi.
