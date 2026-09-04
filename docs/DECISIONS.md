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

## 14. Mobilda YARATISH oqimlari yo'q

**Holat:** Ongli cheklov

Mobil ilovada dars, vazifa, test va kurs YARATIB bo'lmaydi; o'quvchi
qo'shib ham bo'lmaydi. Ko'rish, kirish, topshirish va baholash — hammasi bor.

**Nega:** bu oqimlar uzun forma, sana/vaqt tanlash, haftalik jadval
generatori va ko'p bosqichli qidiruvni talab qiladi (veb'da
`quiz-create-dialog` 349 qator, `add-student-dialog` 267 qator,
`group-action-dialogs` 606 qator). O'qituvchi bu ishlarni odatda kurs
boshida, kompyuterda bajaradi.

**Narxi:** o'qituvchi mobil ilovadan kontent yarata olmaydi. Agar
foydalanuvchi tadqiqoti buni talab qilsa — avval TEST yaratish qo'shiladi
(eng ko'p so'raladigan), keyin vazifa.

---

## 15. Bajarilmagan ishlar (ochiq ro'yxat)

Bular qilinishi kerak, lekin hozircha yo'q — yashirilmasin:

| Ish | Sabab |
|---|---|
| Push xabarnoma (FCM/APNs) | Backend `POST /api/v1/devices/` hali yo'q (MOBILE_PLAN §11 #1) |
| Chat delta sync | Backend `?after=<id>` hali yo'q (§11 #2). `RealtimeSocket` da `onResync` ilgagi tayyor turibdi |
| Doskada LaTeX render | Skia'da matn dvigateli yo'q; WebView qatlami kerak |
| iOS ekran ulashish | Broadcast Extension — alohida nativ target (§7.2) |
| Sentry, analytics | Faza 6 |
| Unit va E2E testlar | Faza 6. Ko'chirilgan mapperlar uchun test MAJBURIY (§13) |
| Do'kon materiallari | Faza 6 |
| Real qurilmada sinov | Bu muhitda Android SDK/Xcode yo'q. Metro bundle ikkala platformada quriladi, lekin bu ishlayotgan ilova bilan bir xil emas |
