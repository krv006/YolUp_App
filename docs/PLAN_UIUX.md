# UI/UX va CRUD tuzatishlar rejasi

> Manba: `docs/ChatExport_2026-09-08/` — 16 ta xabar, 11 ta ekran rasmi
> (2026-09-08, Abdumo'min). Barchasi o'qildi va kod bilan tekshirildi.

Bu reja **taxminga emas, o'lchangan faktga** asoslangan: har bir shikoyat
uchun kodda aniq sabab topildi va quyida ko'rsatilgan.

---

## 1. Eng muhim xulosa: 12 ta shikoyat — 6 ta ildiz sabab

Shikoyatlarni birma-bir tuzatish noto'g'ri bo'lardi. Ular guruhlanadi:

| Ildiz sabab | Undan kelib chiqqan shikoyatlar |
|---|---|
| **`edgeToEdgeEnabled=true` + klaviatura ishlovi yo'q** | chat inputi klaviatura ostida qoladi · **barcha** bottomsheet inputlari ham |
| **Tab panelida balandlik qat'iy 60px, inset hisobga olinmagan** | tizim navigatsiyasi tab yozuvlari ustiga chiqib ketgan |
| **RN `Modal` alohida nativ oyna** | toast bottomsheet overlayi orqasida qoladi |
| **`Sheet` tutqichi faqat bezak** | sudrab yopib bo'lmaydi, X tugmasiga majbur |
| **Kesh kaliti mos kelmasligi** | test yaratilgach ro'yxat yangilanmaydi |
| **Temada foydalanuvchi tanlovi umuman yo'q** | rang/shrift/mavzu boshqaruvi imkonsiz |

Ya'ni **bitta tuzatish bir nechta shikoyatni yopadi**. Reja shunga qurilgan.

---

## 2. Har bir shikoyatning kodddagi sababi

### 2.1 Klaviatura inputni to'sib qoladi (chat + barcha sheetlar)

**Shikoyat:** #132172, #132173 — «keyboard chiqib inputni tosib qoymoqda»,
«deyarli barcha joyda bor».

**Sabab (o'lchangan):**

```
android/gradle.properties:47   edgeToEdgeEnabled=true
```

Edge-to-edge yoqilganda Android 15+ klaviatura ochilganda **oynani
kichraytirmaydi**. Bizning kod esa aynan shunga tayanadi:

```tsx
// conversation-page.tsx va sheet.tsx — ikkalasida bir xil
behavior={Platform.OS === "ios" ? "padding" : undefined}
//                                            ↑ Androidda HECH NARSA qilmaydi
```

`undefined` — «oynaning o'zi kichrayadi» degani. U kichraymaydi, natijada
input klaviatura ostida qoladi.

**Ta'sir doirasi:** chat kompozitori + `<Sheet>` ishlatuvchi **22 ta fayl**.

**Yechim:** `react-native-reanimated` (4.5.1, allaqachon o'rnatilgan)
ichidagi `useAnimatedKeyboard()` — u edge-to-edge bilan to'g'ri ishlaydi.
Yangi nativ paket **kerak emas** (`react-native-keyboard-controller` qo'shish
shart emas — bu qayta qurish va yana bir nativ bog'liqlik degani).

---

### 2.2 Tizim navigatsiyasi tab panelini bosib turibdi

**Shikoyat:** #132180 + `photo_4` (bizniki) va `photo_5` (LinkedIn namunasi).

**Sabab:**

```tsx
// src/providers/role-tabs.tsx:44
...Platform.select({ android: { height: 60, paddingBottom: 8, paddingTop: 6 } })
```

Balandlik **qat'iy 60**, pastki to'ldirish **qat'iy 8**. Jest-navigatsiyali
telefonda pastki inset ~24–48px — shuning uchun «Jadval» va «Testlar»
yozuvlari tizim chizig'i ostida qolgan. Rasmda aniq ko'rinadi.

`useSafeAreaInsets()` loyihada bor, lekin tab panelida **ishlatilmagan**.

---

### 2.3 Toast bottomsheet orqasida qolib ketadi

**Shikoyat:** #132214.

**Sabab:** `Sheet` — RN `Modal`. Modal **alohida nativ oyna** yaratadi va
har doim ilova ildizidagi ko'rinishlar ustida turadi. `ToastHost` esa
ildizda:

```tsx
// app-providers.tsx:66
{children}
<ToastHost />        // zIndex: 1000 — Modal'ga qarshi FOYDASIZ
```

`zIndex` bir daraxt ichida ishlaydi; Modal boshqa oynada. Shuning uchun
toast doim orqada qoladi.

**Yechim:** `ToastHost` ni ham o'z `Modal` iga solish.

---

### 2.4 Bottomsheetni sudrab yopib bo'lmaydi

**Shikoyat:** #132188.

**Sabab:** tutqich shunchaki bo'yalgan to'rtburchak —

```tsx
// sheet.tsx:70
<View style={[styles.grabber, ...]} />   // hech qanday gesture yo'q
```

`react-native-gesture-handler` va `GestureHandlerRootView` loyihada
**bor** (`app-providers.tsx:62`) — ya'ni yangi bog'liqlik kerak emas.

---

### 2.5 Test yaratilgach ro'yxat yangilanmaydi

**Shikoyat:** #132209 — «refresh qilishga majbur bolmasligim kerak edi».

**Sabab — kalitlar mos kelmaydi:**

```
Testlar sahifasi so'raydi:    ["quizzes", "list", null]     ← useQuizzes(null)
Yaratish invalidate qiladi:   ["quizzes", "list", <courseId>]
```

TanStack Query prefiks bo'yicha solishtiradi; bu ikki kalit **hech qachon
mos kelmaydi**, shuning uchun ro'yxat yangilanmaydi. `useDeleteQuiz` esa
to'g'ri yozilgan (`quizKeys.all`) — shuning uchun o'chirish ishlaydi.

**Foydalanuvchi haq edi, bu yolg'iz holat emas.** O'lchov:

```
useMutation:         72 ta
invalidateQueries:   40 ta
```

Ya'ni ~32 ta mutatsiya keshni umuman yangilamaydi. Ularning bir qismi
haqli (masalan soket orqali xabar yuborish), lekin hammasi tekshirilishi
kerak.

---

### 2.6 Test qo'shishda ball inputi ko'rinmaydi

**Shikoyat:** #132208 + `photo_7`.

**Sabab:** o'lcham **noto'g'ri qatlamga** berilgan.

```tsx
// add-quiz-sheet.tsx:242
<Input inputStyle={styles.points} />        // width: 56 — ICHKI TextInput ga
```

`Input` tuzilishi:

```
<View style={styles.group}>      ← kengligi YO'Q, flex qatorda siqiladi
  <View style={styles.shell}>    ← ko'rinadigan quti
    <TextInput flex:1 + width:56 />
```

Kenglik ichkariga berilgani uchun tashqi quti siqilib qoladi va qiymat
kesiladi. Rasmda aynan shu ko'rinadi: tor, baland, bo'sh quti.

---

### 2.7 Chat detalida pastki panel keraksiz

**Shikoyat:** #132170 + `photo_1`.

**Sabab:** `chats` — Tab ekrani, uning ichida `Stack`. Stack ichiga
o'tilganda tab paneli ko'rinaveradi (Expo Router'da bu standart xulq).

---

### 2.8 Tema, rang, shrift boshqaruvi yo'q

**Shikoyat:** #132213.

**Sabab:** tema tizimida foydalanuvchi tanlovi **umuman qurilmagan**:

```ts
// src/shared/ui/theme.ts — TO'LIQ fayl mazmuni
export function useTheme() {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  return { scheme, palette: colors[scheme] };
}
```

Faylning o'zidagi izohda tan olingan: *«Foydalanuvchi ilova ichida mavzuni
majburlashi Faza 1 da theme.store bilan qo'shiladi»* — qo'shilmagan.
Profildagi «Mavzu» qatori shuning uchun faqat **ko'rsatadi**, o'zgartirmaydi.

**Ta'sir doirasi (o'lchangan):**

| | soni | izoh |
|---|---|---|
| `useTheme()` ishlatuvchi fayl | **75** | kodi o'zgarmaydi — hook reaktiv bo'lsa avtomatik ishlaydi |
| `fontSize` ni to'g'ridan-to'g'ri import qilgan | **15** | shrift masshtabi uchun shular hookka o'tishi kerak |

Ya'ni asosiy qism (75 fayl) **tegilmaydi** — bu ishni ancha yengillashtiradi.

---

## 3. Bosqichlar

Tartib ikki qoidaga bo'ysunadi: **(a)** ildiz sabablar avval, chunki ular
bir nechta shikoyatni birdan yopadi; **(b)** buyurtmachi aytgani —
«oldin umumiy va oddiyroq ishlarni hal qilib olish kerak».

### Faza A — Poydevor (buzilgan narsalar)

| # | Ish | Fayl |
|---|---|---|
| A1 | `useKeyboardHeight` primitivi (reanimated `useAnimatedKeyboard`) | `shared/ui/` yangi |
| A2 | Chat kompozitorini klaviatura bilan ko'tarish | `conversation-page.tsx` |
| A3 | `Sheet` ni klaviatura bilan ko'tarish (22 fayl avtomatik tuzaladi) | `sheet.tsx` |
| A4 | Tab paneli balandligini `insets.bottom` dan olish | `role-tabs.tsx` |
| A5 | `ToastHost` ni `Modal` ichiga — har doim ustida | `toast.tsx`, `app-providers.tsx` |

**Nega birinchi:** bular *sinishlar*, bezak emas. A3 bitta fayl bo'lsa ham
22 ta ekranni tuzatadi.

### Faza B — Bottomsheet sifati

| # | Ish |
|---|---|
| B1 | Sudrab yopish (gesture-handler + reanimated), tezlikka sezgir |
| B2 | Sudralganda ekrandan chiqib ketmasligi, cheklovlar (buyurtmachi alohida aytgan) |
| B3 | Backdrop shaffofligi sudrash bilan birga o'zgarishi |

### Faza C — Toast

| # | Ish |
|---|---|
| C1 | Yon tomonga sudrab yo'q qilish + bosib yo'q qilish |
| C2 | Dizayn: Telegram uslubida — yumaloq, soyali, ikonkali |
| C3 | Ilova temasiga bo'ysunishi (hozir `useColorScheme` ni to'g'ridan o'qiydi) |

### Faza D — Navigatsiya va pastki panel

| # | Ish |
|---|---|
| D1 | Chat detalida tab panelini yashirish |
| D2 | Tab panel dizayni — Telegram uslubi (`photo_6`): yumaloq, tanlangani ajralib turadi |

### Faza E — CRUD refetch auditi

| # | Ish |
|---|---|
| E1 | `useCreateQuiz` kalitini tuzatish (tasdiqlangan xato) |
| E2 | **72 ta mutatsiyani birma-bir tekshirish** — qaysi biri keshni yangilamaydi |
| E3 | Qoida: mutatsiya doim `<modul>Keys.all` ni invalidate qilsin, tor kalit faqat asos bilan |

### Faza F — Mayda tuzatishlar

| # | Ish |
|---|---|
| F1 | Ball inputi (`Input` ga `style` propi — kenglik tashqi qutiga) |

### Faza G — Profil (Telegram uslubi)

`photo_9` (Telegram) va `photo_10` (bizniki) taqqoslandi. Kerak:

- katta markazlashgan avatar
- ism + holat
- amal tugmalari qatori
- ma'lumot kartasi: qiymat tepada, yorlig'i pastda (muted)

**Buyurtmachi shartini yodda tutish:** *«faqat mock data qoshib tashlash
yoki bor narsani chopish kerak emas»* — faqat backendda **haqiqatan bor**
maydonlar ko'rsatiladi.

### Faza H — Tema va moslashtirish (eng yirik)

| # | Ish |
|---|---|
| H1 | `theme.store` (zustand + MMKV): `light` / `dark` / `system` |
| H2 | `useTheme` ni reaktiv qilish — 75 fayl **kodsiz** foyda oladi |
| H3 | Foydalanuvchi tanlaydigan primary rang |
| H4 | Shrift masshtabi (15 faylni hookka o'tkazish) |
| H5 | Chat xabarlari foni (Telegramdagidek) |
| H6 | Profilda sozlamalar ekrani |

**Nega oxirida:** eng katta ish va poydevorga (A5, C3) bog'liq.

---

## 4. Xavflar va cheklovlar — ochiq aytilgan

1. **Men ekranlarni ko'ra olmayman.** Login uchun hisob yo'q, shuning uchun
   chat, test, profil ekranlarini o'zim tekshira olmayman. Har fazadan
   keyin tekshirish **sizda**. Shu sababli fazalar mayda qilib bo'lingan.

2. **Har o'zgarish uchun qayta qurish.** Fast refresh emulyatorda ishlaydi
   (`npm run dev:android`), lekin emulyator bu mashinada juda sekin.
   Telefonda tekshirish uchun `npm run apk` — ~10 daqiqa. Shuning uchun
   fazalarni birlashtirib, kamroq marta qurish maqsadga muvofiq.

3. **A1 (klaviatura) — eng nozik ish.** `useAnimatedKeyboard` iOS va
   Androidda turlicha yo'l tutadi; noto'g'ri qilinsa ekran «sakraydi».
   Shuning uchun u alohida primitiv sifatida yoziladi va bitta joyda
   sozlanadi.

4. **H2 — 75 faylga ta'sir qiladi**, garchi ularning kodi o'zgarmasa ham.
   Agar `useTheme` reaktiv bo'lsa, tema almashganda 75 fayl qayta render
   bo'ladi. Bu to'g'ri xulq, lekin unumdorlikni tekshirish kerak.

5. **Doska va LiveKit tegilmaydi** — buyurtmachi aniq aytdi: bu ishlardan
   keyin alohida bosqich.

---

## 5. Tekshirish tartibi

Har fazadan keyin:

```
npm run verify      # typecheck + lint + bog'liqlik tekshiruvi
```

Faza A, D va G dan keyin qurilma tekshiruvi shart (ular ko'rinishga
tegadi). Qolganlarini birlashtirib bir marta qurish mumkin.
