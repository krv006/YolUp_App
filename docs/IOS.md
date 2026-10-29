# iOS — ishga tushirish

**Sana:** 2026-10-14
**Holat:** simulyatorda ishga tushdi. Vaqtinchalik yo'l — shu Mac'da lokal qurish; bulutdagi qurish (EAS) va App Store keyinroq.

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

## Yo'lda uchragan to'siqlar

Uchalasi ham kodda emas, muhitda edi. Qaytarilmasligi uchun yozib
qo'yildi.

### 1. Skia'ning simulyator kutubxonasi yetishmasdi

```
rsync(162): error: .../libskia.xcframework/ios-arm64_arm64e_x86_64-simulator/*:
(l)stat: No such file or directory
```

`@shopify/react-native-skia` ning npm paketida `libs/` UMUMAN YO'Q —
u `postinstall` skripti orqali `react-native-skia-apple-ios` dan
nusxalanadi. O'sha yuklash qachonlardir qisman uzilgan: sakkizta
xcframework ichidan faqat `libskia` ning simulyator qismi bo'sh
qolgandi (53 MB fayl). Qurilma qismi joyida bo'lgani uchun Android
va haqiqiy iPhone yo'lida bu sezilmasdi.

Yechim:

```bash
rm -rf node_modules/react-native-skia-apple-ios node_modules/@shopify/react-native-skia
npm cache clean --force
npm install
```

Tekshirish — fayl bo'sh bo'lmasligi kerak:

```bash
ls -la node_modules/@shopify/react-native-skia/libs/ios/libskia.xcframework/ios-arm64_arm64e_x86_64-simulator/
```

### 2. UIScene hayot sikli (Xcode 27)

Ilova yig'ilardi, lekin ISHGA TUSHMASDI:

```
Application failed to launch: UIScene life cycle is required for
apps built with this SDK.
```

Apple TN3187: iOS 27 SDK bilan yig'ilgan ilova UIScene'ni qabul
qilishi shart. Cheklov qurilmaning iOS versiyasiga emas, **qaysi
SDK bilan yig'ilganiga** bog'liq — shu ilovani Xcode 26 bilan
yig'sak, iOS 27 da ham ishlardi.

React Native buni 0.88 da qabul qildi (bizda 0.86.3), Expo esa SDK
58 da `SceneDelegate.swift` ni avtomatik yaratadi. SDK 57 da
`ExpoAppSceneDelegate` mavjud, lekin prebuild shabloni uni
ro'yxatdan o'tkazmaydi.

Yechim — `app.config.ts` da `expo-build-properties` ga:

```ts
ios: { deploymentTarget: "16.4", enableSceneSupport: true }
```

Talab: `expo` >= 57.0.29, `expo-build-properties` >= 57.0.22.
Shu sababli SDK 57 ichidagi patch versiyalari ko'tarildi
(`npx expo install --fix`) va Android qayta yig'ilib tekshirildi.

Natijada `Info.plist` ga quyidagi tushadi:

```
UIApplicationSceneManifest
  UISceneDelegateClassName = EXExpoAppSceneDelegate
```

### 3. Xcode 27.1 — Swift 6.4 (2026-10-29)

Xcode 27.1 ga yangilangach build yiqildi:

```
cannot find type '__ObjC::expo' in scope
failed to build module 'ExpoModulesCore'; this SDK is not supported by
the compiler (the SDK is built with 'Apple Swift version 6.3.1', while
this compiler is 'Apple Swift version 6.4')
```

Ikki sabab bor edi:

1. Expo modullarining tayyor XCFramework'lari Swift 6.3.1 bilan
   kompilyatsiya qilingan — Swift 6.4 ularni o'qiy olmaydi.
   Yechim: `app.config.ts` da `ios.usePrecompiledModules: false` —
   modullar manbadan yig'iladi (sekinroq, lekin istalgan Xcode bilan).
2. `expo-modules-jsi` 57.1.2 ning `.swiftinterface` ida C++ turi
   kengaytmasi qolib ketgan, Swift 6.4 uni rad etadi. 57.1.3 da
   tuzatilgan — SDK 57 patch'lari yana ko'tarildi
   (`expo` 57.0.31, `expo-modules-core` 57.0.24, `expo-modules-jsi`
   57.1.3).

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
