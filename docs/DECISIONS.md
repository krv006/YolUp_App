# Qarorlar jurnali (ADR)

Nima uchun shunday qilingani. Kod nima qilishini o'zi aytadi — bu fayl
**nega** boshqa yo'l tanlanmaganini yozadi, chunki olti oydan keyin buni
hech kim eslamaydi.

---

## 1. Monorepo emas, alohida repo

**Sana:** Faza 0 · **Holat:** Qabul qilindi

Mobil ilova `Edu_Front/mobile/` da, o'z git reposi bilan. Veb loyihaning
`.gitignore` iga qo'shilgan.

**Nega:** 2–3 kishilik jamoa uchun Turborepo/pnpm workspace foydadan ko'ra
ko'proq ovora qiladi; Vite va Metro bitta `node_modules` daraxtida doimiy
urishadi; Vercel deploy'i hozir shu repodan ishlaydi va strukturani
o'zgartirish tekin risk.

**Narxi:** domen qatlami ikki nusxada yashaydi va sinxrondan chiqishi mumkin.

**Narx qanday boshqariladi:** `docs/PORTED.md` (har faylning port paytidagi
veb hash'i) + `npm run check-sync` (drift detektori). Har sprint boshida
ishga tushiriladi.

---

## 2. Struktura va alias veb bilan 1:1

**Nega:** ko'chirilgan faylning `import { apiClient } from "@/shared/api"`
qatorini o'zgartirmaslik uchun. Alias yoki papka nomi farq qilsa, 149 ta
faylning har birida import tahrirlash kerak bo'lardi va ular darhol 🟡 ga
aylanib, veb'dagi har o'zgarish qo'lda birlashtirishni talab qilardi.

**Chetlanish:** `src/providers/` — veb'da `src/app/providers/`. Expo Router
`src/app/` dagi **har fayldan marshrut yasaydi**, shuning uchun provider'lar
u yerda tura olmaydi. Yagona majburiy chetlanish.

---

## 3. `PlatformAdapter` interfeysi YO'Q

**Nega:** adapter naqshi bitta kod ikkala platformada ishlashi kerak
bo'lgandagina foyda beradi — ya'ni monorepo'da. Alohida loyihada u faqat
qo'shimcha indirection qatlami bo'lardi.

**O'rniga:** `src/shared/api/token-storage.ts` to'g'ridan-to'g'ri RN uchun
yozilgan, lekin **ommaviy interfeysi veb bilan aynan bir xil**. Undan
yuqoridagi kod farqni sezmaydi.

---

## 4. Token o'qish SINXRON qoladi

**Muammo:** `expo-secure-store` asinxron, `ApiClient` esa tokenni sinxron
so'raydi.

**Rad etilgan yo'l:** butun API qatlamini `async` qilish — 50+ faylga tegadi
va veb bilan farqni keskin oshiradi.

**Tanlangan yo'l:** ilova boot'ida tokenlar Keychain/Keystore dan **xotiraga**
o'qiladi (`tokenStorage.hydrate()`), keyin o'qish xotiradan — sinxron.
Yozish xotiraga darhol, xavfsiz saqlashga fon rejimida.

**Shart:** `hydrate()` `bootstrap()` dan OLDIN chaqirilishi kerak, aks holda
`/auth/me/` tokensiz ketadi va foydalanuvchi har safar login qiladi. Tartib
`src/providers/app-providers.tsx` da qulflangan.

---

## 5. `sonner` — modul aliasi, import tahriri emas

**Muammo:** domen qatlamining 14 ta fayli `import { toast } from "sonner"`
yozadi. `sonner` — DOM kutubxonasi.

**Rad etilgan yo'l:** 14 faylda import satrini o'zgartirish. Ular 🟢 NUSXA
edi; tahrirlansa 🟡 ga aylanib, veb'dagi har o'zgarish qo'lda birlashtirish
talab qilardi.

**Tanlangan yo'l:** fayl emas, **modul yechimi** almashtiriladi —
`tsconfig.json` `paths` + `metro.config.js` `resolveRequest`. Shim
`src/shared/ui/toast.tsx` da, API sonner bilan mos (`action.onClick`
nomigacha).

**Narxi:** mobil kodda `"sonner"` importini ko'rgan odam chalkashishi mumkin.
Shim faylning boshida va shu yerda hujjatlashtirilgan.

---

## 6. Ota-papkadan paket sizib o'tishi yopildi

**Muammo:** `mobile/` veb loyiha ichida. Node ham, TS ham topolmagan modulni
yuqoridan qidiradi — `sonner`, `react-router-dom`, `@livekit/*` veb'ning
`node_modules` idan yechilib, `tsc` dan **jimgina** o'tib ketardi.

**Yechim ikki tomonlama:**
- Metro: `nodeModulesPaths` + veb `node_modules`/`src` ni `blockList`
- TS: `scripts/check-deps.mjs` (tsc'da bunday sozlama yo'q)

**Rad etilgan:** `resolver.disableHierarchicalLookup = true` — u juda qattiq,
bog'liqlikning ichki bog'liqligini ham (`expo/node_modules/@expo/metro-runtime`)
topolmay qoldi va bundle yiqildi.

---

## 7. Marshrutlarda "guruh" papkalari ishlatilmaydi

**Nega:** Expo Router'da `(teacher)` guruh nomi URL'ga kirmaydi. Ya'ni
`(teacher)/chats` va `(student)/chats` ikkalasi ham `/chats` ga aylanib
to'qnashardi.

**Tanlangan:** haqiqiy segmentlar — `teacher/`, `student/`, `parent/`.
Natijada marshrutlar veb `shared/config/routes.ts` bilan bir xil bo'ladi,
backend chatga yuboradigan `/boards/<id>` havolalari va ko'chirilgan
`resolveHomeRoute` o'zgarishsiz ishlaydi.

---

## 8. `typedRoutes` hozircha o'chiq

Marshrut yo'llari veb'dan ko'chirilgan `ROUTES` dan oddiy `string` sifatida
keladi (masalan `resolveHomeRoute(user)`). Typed routes ularning har birida
cast talab qilardi. Faza 1 da `ROUTES` tiplanganidan keyin yoqiladi.

---

## 9. Dizayn primitivlari — StyleSheet, NativeWind emas

**Nega:** primitivlar aniq nazorat talab qiladi (fokus holati, disabled
opacity, minimal teginish maydoni) va StyleSheet ularni to'liq tiplangan
qiladi — `tsc` xatoni ushlaydi.

**NativeWind qoladi** (sozlangan, `global.css` o'sha `palette.json` dan
generatsiya bo'ladi) — ekran darajasidagi kompozitsiya uchun. Bu — NativeWind
loyihalarida odatiy taqsimot: primitivlar StyleSheet, ekranlar `className`.

**Tekshirilmagan:** NativeWind pipeline'i haqiqiy qurilmada hali sinalmagan.
Faza 1 ning birinchi ishi — dev build'da uni tasdiqlash.

---

## 10. Uslub qoidalari veb loyihaga moslashtirildi

`eslint-config-expo` dan keladigan uchta qoida o'chirildi:

| Qoida | Sabab |
|---|---|
| `@typescript-eslint/array-type` | Veb loyihada yo'q. 🟢 NUSXA fayllarni unga moslash port qoidasini buzardi |
| `@typescript-eslint/no-redeclare` | `api-error.ts` dagi `ApiError` aliasi ataylab |
| `react/no-unescaped-entities` | **HTML qoidasi.** RN'da `<Text>` `&apos;` ni MATN sifatida chiqaradi — qoidaga bo'ysunish ekranda "o&apos;quvchi" ko'rinishiga olib kelardi. O'zbekcha matnda apostrof deyarli har so'zda |

---

## 11. Mijoz tomon dars yozuvi ko'chirilmadi

`teacher-audio-recording.ts` va `teacher-video-recording.ts` (558 qator) —
brauzer `MediaRecorder` ustiga qurilgan **vaqtinchalik** yechim (Egress
ishlamagani uchun yozilgan, `COMPLETED_WORK.md` §1).

Mobilda dars yozuvi **to'liq server tomonda** (LiveKit Egress). Ilova faqat
yozuvni ko'radi. Shu sabab `useFinishLesson` dan flush/finalize mantiqi
olib tashlandi.

---

## 12. Fokus jurnali mobilda aniqroq

Veb `visibilitychange` + `window.blur/focus` ga tayanardi — brauzerda bu
signal ishonchsiz: boshqa tabga o'tish, oynani kichraytirish va DevTools
ochish bir xil ko'rinardi.

Mobilda `AppState` OS'dan aniq javob beradi. Qo'shimcha ehtiyot: iOS'ning
qisqa `inactive` holati (ruxsat oynasi, bildirishnoma pardasi) filtrlanadi —
aks holda har kamera ruxsati so'rovi "darsdan chiqish" bo'lib yozilib,
ota-onaga yolg'on signal ketardi.

---

## 13. i18n KIRITILMADI — ongli qaror

**Sana:** Faza 1 · **Holat:** Qabul qilindi, qayta ko'rib chiqiladi

`MOBILE_PLAN.md` §18.10 "matn literal emas, `t()` — birinchi kundan" degan
edi. Amalda bu bajarilmadi va sababi shu yerda yozilgan.

**Nega:** ko'chirilgan domen qatlami (toast xabarlari, xato matnlari,
`lesson-status`, `homework` baholari) o'zbekcha LITERAL matn qaytaradi va u
🟢 NUSXA — tahrirlab bo'lmaydi. Ya'ni i18n faqat YANGI UI kodini qamrab
olardi: ilovaning yarmi `t("...")`, yarmi literal. Bunday nomuvofiqlik
i18n yo'qligidan yomonroq — keyin qaysi biri qayerdaligini hech kim
bilmaydi.

**Narxi:** ikkinchi til qo'shilganda barcha literal matnlar bir yo'la
ajratiladi. Bu bir martalik, mexanik ish (~2-3 kun).

**Qachon qayta ko'riladi:** ikkinchi til rejaga kirganda. O'sha paytda
veb ham i18n'ga o'tishi kerak — ikkalasi BIR VAQTDA, aks holda domen
qatlami yana ikkiga bo'linadi.

---

## 14. Yaratish oqimlari — QAYTA KO'RIB CHIQILDI

**Holat:** Bekor qilindi, oqimlar qo'shildi

Dastlab dars/vazifa/test/kurs yaratish mobilga chiqarilmagan edi: ular uzun
forma va ko'p bosqichli qidiruvni talab qiladi (veb'da `group-action-dialogs`
606 qator, `quiz-create-dialog` 349, `add-student-dialog` 267), va
o'qituvchi bu ishlarni odatda kompyuterda bajaradi degan taxmin bor edi.

**Nega bekor qilindi:** buyurtmachi to'liq funksional tenglikni talab qildi.
Taxmin ham tekshirilmagan edi — o'qituvchi darsni telefondan ham qo'shishi
mumkin (masalan yo'lda jadval o'zgarganda).

**Natija:** hammasi qo'shildi — dars (bitta yoki haftalik jadval), vazifa,
test, o'quvchi qo'shish/chiqarish, topshiriqni baholash, kurs yaratish.
Uzun formalar pastdan ochiladigan `Sheet` da, klaviatura hisobga olingan.

---

## 15. Bajarilmagan ishlar (ochiq ro'yxat)

Bular qilinishi kerak, lekin hozircha yo'q — yashirilmasin:

| Ish | Sabab |
|---|---|
| Push xabarnoma (FCM/APNs) | Backend `POST /api/v1/devices/` hali yo'q (MOBILE_PLAN §11 #1) |
| Chat delta sync | Backend `?after=<id>` hali yo'q (§11 #2). `RealtimeSocket` da `onResync` ilgagi tayyor turibdi |
| iOS ekran ulashish | Broadcast Extension — alohida nativ target (§7.2) |
| Sentry, analytics | Faza 6 |
| Unit va E2E testlar | Faza 6. Ko'chirilgan mapperlar uchun test MAJBURIY (§13) |
| Do'kon materiallari | Faza 6 |
| iOS'da qurish va sinov | Bu muhitda Xcode yo'q |

Android tomoni endi ochiq emas: `npx expo run:android` nativ qurilishi
o'tdi va `app-debug.apk` hosil bo'ldi. Ekranlarni QO'LDA bosib chiqish
hali qilinmagan — qurilish o'tgani ilova to'g'ri ishlayotganini bildirmaydi.

**Funksional tenglik yopildi** — `docs/PARITY.md` ga qarang. Yuqoridagilar
funksiya emas, infratuzilma va tashqi bog'liqliklar.

---

## 16. "Tenglik yopildi" da'vosi qanday tekshiriladi

**Qaror:** tenglik komponent NOMLARINI taqqoslash bilan emas, veb
eksportlarini mobil chaqiruv joylarida qidirish bilan tasdiqlanadi.

**Nega:** §14 dan keyin `PARITY.md` "hammasi bor" deb yozilgan edi va
jadval to'g'ri ko'rinardi — har veb komponentiga mobil manzil bor edi.
Lekin jadval NOMLARNI solishtirardi. Keyingi tekshirishda veb'ning 20 ta
`use*` hooki mobil UI'da umuman chaqirilmagani chiqdi; 10 tasi haqiqiy
kamchilik edi (doskada chizish ruxsati, formula yordamchisi, ekran
ulashish ruxsati, dars tahriri, to'rt joyda o'chirish amali, topshiriq
faylini yuklash, "dars ketmoqda" chizig'i).

Sabab bitta: mobil domen qatlami TO'LIQ ko'chirilgan, shuning uchun
"modul bor" degan his aldadi. Ma'lumot bor edi — tugmasi yo'q edi.

**Qoida:** har "tenglik" da'vosidan oldin uchta ro'yxat mexanik
tekshiriladi (usuli `PARITY.md` §"Bu javob QANDAY tekshirilgan" da):
hooklar, modul eksportlari, `shared/lib`. Qo'lda ko'z yugurtirish
hisobga olinmaydi.

---

## 17. NativeWind olib tashlandi (JSX'ni buzardi)

**Qaror:** `nativewind` babel preseti va metro o'rami loyihadan chiqarildi.
`className` bilan uslub berish umuman ishlatilmaydi.

**Nega:** ilova birinchi marta emulyatorda ishga tushganda login ekrani
chiqdi, lekin "Kirish" tugmasi **oq fonda oq matn** bo'lib ko'rinmadi.
Piksellarni o'lchab, so'ng `uiautomator` daraxtini olib aniqlandi:

```
"Kirish" TextView  bounds=[53,1111][157,1164]  clickable="false"
```

Ya'ni tugmaning na foni, na balandligi, na ichki bo'shlig'i qo'llangan —
faqat matn rangi ishlagan. Checkbox va Input esa to'g'ri chizilardi.

Farq shunda ediki, ular `View` ga MASSIV uslub beradi, `Button` esa
`Pressable` ga FUNKSIYA beradi:

```tsx
style={({ pressed }) => [styles.base, { backgroundColor: ... }]}
```

NativeWind `jsxImportSource` orqali har bir JSX elementini o'z runtime'i
bilan o'raydi va `Pressable` uchun `style` propini qayta hisoblaydi —
funksiya ko'rinishidagi uslubni esa yo'qotadi.

**Ta'sir doirasi:** `style={({ pressed }) => ...}` naqshi **23 ta faylda**
ishlatilgan — tugmalar, ro'yxat qatorlari, ikonka tugmalari, chat
elementlari. Ya'ni bu bitta ekranning emas, butun ilovaning nuqsoni edi.

**Nega umuman qo'shilgan edi:** Expo shabloni bilan kelgan. Veb loyihada
Tailwind bor, shuning uchun mobilda ham "kerak bo'lar" deb qoldirilgan.
Amalda `className` biror joyda ishlatilmadi (0 ta), chunki dizayn tizimi
`StyleSheet` + `shared/ui/tokens.ts` ustiga qurilgan.

**Qoldirildi:** `nativewind`, `tailwindcss`, `tailwind-merge` hali
`package.json` da (`shared/lib/utils.ts` dagi `cn()` 🟢 veb porti, hozir
ishlatilmaydi). Ular endi qurilishga TA'SIR QILMAYDI. Qayta yoqilmasligi
uchun `babel.config.js` ga to'liq sabab yozib qo'yildi.

---

## 18. Emulyatorda ishga tushirish: release qurilishi (dev-server emas)

**Qaror:** bu muhitda ilova `npm run android:release` bilan quriladi va
`npm run android:install` bilan o'rnatiladi. Metro dev-serveri
ISHLATILMAYDI.

**Nega:** dev-client Metro'dan JS bundle'ni ola olmaydi. Ilova splash
ekranda qotib qoladi va logda:

```
java.net.ProtocolException: Expected leading [0-9a-fA-F] character but was 0x2d
  at MultipartStreamReader.readAllParts
  at BundleDownloader.processMultipartResponse
```

Chunked ramka desinxron bo'ladi — o'qigich chunk chegarasidan sakrab
multipart tanasining o'rtasiga tushadi.

**Tekshirilgan va istisno qilinganlar:**

| Gumon | Natija |
|---|---|
| Metro noto'g'ri javob beradi | ❌ Host'dan 4338 ta chunk, ramka benuqson |
| Emulyator NAT (`10.0.2.2`) | ❌ `adb reverse` orqali ham aynan shu xato |
| Emulyatorda HTTP proksi | ❌ `http_proxy` = null |
| OkHttp o'qish taymauti | ❌ RN'da `readTimeout(0)` — o'chirilgan |
| expo-dev-client tarmoq inspektori | ❌ `shouldParseBody` chunked javobni chetlab o'tadi |
| Bundle hajmi | ⚠️ 21.8 MB → minify bilan 10.8 MB, **baribir xato** |

Ya'ni sabab Metro'da ham, bizning kodimizda ham emas — bundle
host'dan qurilmaga uzatilayotganda buziladi. Bu mashinada
(Windows + qemu emulyatori, xotira tanqisligi ostida) takrorlanadi.

**Yechim:** release qurilishida JS bundle APK ICHIGA joylanadi, tarmoq
umuman ishlatilmaydi. Ilova shu yo'l bilan muvaffaqiyatli ishga tushdi
(login ekrani chizildi, `ReactNativeJS: Running "main"`).

**Narxi:** fast refresh yo'q — har o'zgarishdan keyin qayta qurish kerak
(~4 daqiqa, nativ kutubxonalar keshda). Bu vaqtinchalik cheklov; boshqa
mashinada yoki real qurilmada dev-server sinab ko'rilishi kerak.

**Muhim:** `-PreactNativeArchitectures=x86_64` MAJBURIY. Usiz Gradle
to'rtala ABI uchun quradi, 5.3 GB xotira so'raydi va demon halok bo'ladi
(shu xato bir marta uchradi).

**Bundle tarkibi** (dev, 20.7 MB) — kelajakda kichraytirish uchun:

| hajm | paket |
|---|---|
| 3.31 MB | `lucide-react-native` (dev'da tree-shaking yo'q) |
| 2.09 MB | `react-native-reanimated` |
| 2.07 MB | `react-native` |
| 2.02 MB | `date-fns` |
| 1.61 MB | `expo-router` |
| 1.39 MB | `livekit-client` |
| 1.04 MB | bizning kodimiz |

---

## 19. Fast refresh ishlaydi — `adb reverse` orqali

**Qaror:** emulyatorda dev-server `adb reverse` kanali orqali ishlatiladi.
`npm run dev:android` shuni sozlaydi.

**§18 ga tuzatish:** o'sha yerda "adb reverse orqali ham aynan shu xato"
deb yozilgan edi. **Bu noto'g'ri xulosa edi** — sinov haqiqiy emas edi:
ilovaga `adb reverse` o'rnatilgan bo'lsa-da, u dev-server manzilini
almashtirmagan va baribir `10.0.2.2` ga murojaat qilgan. Buni logdan
ko'rish mumkin edi (`Callback failure for call to http://10.0.2.2:8081/`),
lekin men e'tibor bermay, yo'l sinaldi deb hisoblagandim.

Manzil haqiqatan `localhost` ga o'tkazilganda bundle **muvaffaqiyatli
yuklandi**: `ReactNativeJS: Running "main"`.

**Uchala shart birga kerak** — bittasi yetishmasa ishlamaydi:

| # | Shart | Nima uchun |
|---|---|---|
| 1 | `adb reverse tcp:8081 tcp:8081` | trafik qemu NAT'i o'rniga adb kanaliga o'tadi |
| 2 | ilovada `debug_http_host=localhost:8081` | RN aks holda `10.0.2.2` ga uradi |
| 3 | Metro'ga `--localhost` BERILMASIN | u bu mashinada faqat `[::1]` (IPv6) ga bog'lanadi, `adb reverse` esa IPv4 `127.0.0.1` ga yo'naltiradi — ulanish uziladi |

3-shart alohida tuzoq: `--localhost` mantiqan to'g'ridek tuyuladi, lekin
aynan u ishni buzadi. `netstat` bilan tekshirish mumkin:

```
--localhost bilan:  TCP  [::1]:8081        LISTENING   ← adb reverse yeta olmaydi
--localhostsiz:     TCP  0.0.0.0:8081      LISTENING   ← to'g'ri
```

**Demak §18 dagi sabab ham aniqroq bo'ldi:** muammo emulyatorning virtual
tarmog'ida (`10.0.2.2`, qemu SLIRP), Metro'da ham, bizning kodimizda ham
emas. Release qurilishi (§18) hamon eng tez va ishonchli yo'l, lekin
kod ustida ishlash uchun endi fast refresh bor.

**Ogohlantirish — mashina resursi.** Debug qurilishi bu kompyuterda juda
sekin ishga tushadi. Logdan:

```
Verification of int AccessibilityActionCompat.getId() took 30.713s (0.29 bytecodes/s)
```

Bu kod ayb emas: Windows `Memory Compression` 2.5 GB ni egallagan,
emulyatorga 2 GB RAM ajratilgan va Android Studio, Chrome, Gradle
demonlari bir vaqtda ishlayotgan edi. Dev rejimida ishlashdan oldin
ortiqcha dasturlarni yopish yoki AVD'ga ko'proq RAM berish kerak.
