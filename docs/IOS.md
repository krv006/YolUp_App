# iOS — ishga tushirish

**Sana:** 2026-10-14
**Holat:** vaqtinchalik yo'l — shu Mac'da lokal qurish. Bulutdagi qurish
(EAS) va App Store'ga chiqarish keyinroq.

---

## Nega Expo Go ishlamaydi

Expo Go'da ochilganda birinchi `import` dayoq yiqiladi:

```
Failed to get NitroModules: The native "NitroModules" Turbo/Native-Module
could not be found.
  src/shared/lib/storage.ts:1  import { createMMKV } from "react-native-mmkv"
```

`react-native-mmkv` v4 `react-native-nitro-modules` nativ moduliga
tayanadi. Expo Go — oldindan yig'ilgan tayyor ilova; uning ichida faqat
belgilangan nativ modullar bor va nitro ular orasida yo'q.

Bu bitta paket muammosi emas. Ilovada bundan tashqari **LiveKit WebRTC**,
**Skia** (doska) va `expo-video` bor — ularning hech biri Expo Go'da yo'q.
Shuning uchun ilova **ikkala platformada ham** faqat o'z dev client'i
bilan ishlaydi. Androidda shu sababli alohida dev client yig'ilgan.

`NitroModules` xatosidan keyingi `Cannot read property 'ErrorBoundary' of
undefined` — oqibat, alohida muammo emas: `_layout.tsx` moduli yuklanmay
qolgani uchun expo-router undan hech narsa o'qiy olmaydi.

---

## Bir martalik tayyorgarlik

### 1. Xcode

App Store → Xcode → o'rnatish. ~15 GB yuklanadi, o'rnatilgach 40 GB
gacha egallaydi. Bu eng uzoq qadam.

O'rnatilgach:

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -license accept
xcodebuild -version        # versiya chiqsa — tayyor
```

**Nega kerak:** hozir mashinada faqat Command Line Tools bor, u bilan
`xcodebuild` ishlamaydi va iOS simulyatori yo'q.

### 2. CocoaPods

```bash
brew install cocoapods
pod --version
```

**`sudo gem install cocoapods` QILMANG.** Tizim Ruby'si 2.6 —
zamonaviy CocoaPods undan yuqori versiya talab qiladi va ruxsatlar
bilan chalkashadi. Homebrew o'z Ruby'si bilan keladi.

---

## Har safar

```bash
APP_VARIANT=development npx expo prebuild -p ios --clean
APP_VARIANT=development npx expo run:ios
```

`ios/` papkasi `.gitignore` da (40-qator) — Android bilan bir xil qoida.
Ya'ni u git'da turmaydi va konfiguratsiya o'zgarganda qaytadan
yaratiladi. `--clean` shuning uchun kerak.

Birinchi `run:ios` uzoq ketadi: `pod install` barcha nativ bog'liqliklarni
yuklab, keyin hammasi noldan kompilyatsiya qilinadi.

### Simulyator yoki haqiqiy iPhone

| | Nima kerak |
|---|---|
| Simulyator | hech narsa — Xcode bilan keladi |
| Haqiqiy iPhone | oddiy Apple ID yetarli |
| App Store | Apple Developer Program, **$99/yil** |

Haqiqiy qurilmaga oddiy Apple ID bilan o'rnatilgan ilova **7 kundan
keyin ochilmay qoladi** — qayta imzolab o'rnatish kerak. Sinash uchun
yetarli, tarqatish uchun emas.

Apple to'lovi Google'dan farq qiladi: Play'da $25 bir marta, App
Store'da $99 **har yili**.

---

## Tekshirilgan

`expo prebuild -p ios` toza o'tdi va `app.config.ts` dagi sozlamalar
nativ loyihaga to'g'ri tushdi:

| | Qiymat |
|---|---|
| Bundle ID | `uz.yolup.edu.dev` |
| Ko'rinadigan nom | YolUp (Dev) |
| Minimal iOS | 16.4 |
| `UIBackgroundModes` | `audio` (dars fonda uzilmasin) |
| Kamera/mikrofon/galereya izohlari | joyida |

---

## iOS'da hali ishlamaydigan narsalar

**Ekran ulashish.** `FOREGROUND_SERVICE_MEDIA_PROJECTION` — Android
tushunchasi. iOS'da ekran ulashish uchun alohida **Broadcast Upload
Extension** target yozish kerak; Expo config plugini buni o'zi
qilmaydi. Rejada v1.1 (`app.config.ts` izohi).

**Push.** `GoogleService-Info.plist` hali yo'q — Androiddagi
`google-services.json` bilan bir xil holat (`docs/PUSH-FIREBASE.md`).
Bundan tashqari iOS'da APNs kaliti kerak, u esa Apple Developer
Program ichida beriladi. Ya'ni $99 to'lanmaguncha iOS'da push yo'q.

---

## Kod tomoni

Alohida iOS fayllari yozilmagan — farqlar `Platform.OS` shoxlari bilan
hal qilingan:

| Fayl | Nima uchun |
|---|---|
| `shared/ui/screen.tsx` | klaviatura ochilganda `padding` (iOS), Android o'zi ko'taradi |
| `shared/ui/sheet.tsx` | shu sabab, izohi ichida |
| `shared/ui/pickers.tsx` | sana tanlagich iOS'da `inline`, tanlangach o'zi yopiladi |
| `modules/message/ui/message-composer.tsx` | matn maydoni balandligi |
| `widgets/live-room/live-controls.tsx` | jonli dars boshqaruvi |
| `providers/use-push-registration.ts` | backendga `platform: "ios"` yuboradi |

Bular Androidda sinalgan, iOS'da hali **qurilmada ko'rilmagan**.
