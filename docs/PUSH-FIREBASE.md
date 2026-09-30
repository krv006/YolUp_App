# Firebase sozlash — mobil push ishga tushishi uchun

**Kimga:** loyihani olib boradigan dasturchiga
**Holat:** mobil kod tayyor, backend tayyor — faqat shu qadamlar qolgan
**Sana:** 2026-09-30

---

## Nega kerak

Mobil tomon FCM qurilma tokenini oladi va uni backendga yuboradi. Token
Firebase'dan keladi, Firebase esa ilovani `google-services.json` orqali
taniydi. Fayl bo'lmasa token olinmaydi va push jimgina ishlamaydi —
ilovaning qolgan hamma qismi normal ishlayveradi.

Backend tomoni tayyor: endpointlar bor, `firebase-admin` o'rnatilgan.
Backendga **service account JSON** kerak, uni ular o'zlari qo'yadi.
Mobilga esa quyidagi ikki fayl kerak.

---

## 1. Firebase loyihasi

`console.firebase.google.com` → **Add project**.

Nomi ixtiyoriy (masalan `yolup`). Google Analytics shart emas.

---

## 2. Android ilovasi

Loyiha ichida **Add app → Android**.

| Maydon | Qiymat |
|---|---|
| Android package name | `uz.yolup.edu` |
| App nickname | YolUp (ixtiyoriy) |
| Debug signing certificate SHA-1 | hozircha shart emas |

**Diqqat — paket nomi aynan `uz.yolup.edu` bo'lsin.** Dev va staging
qurilishlari `uz.yolup.edu.dev` va `uz.yolup.edu.staging` paketlarini
ishlatadi (`app.config.ts`). Agar push'ni dev qurilishida ham sinamoqchi
bo'lsangiz, o'sha paketlarni ham **alohida Android ilova** sifatida shu
loyihaga qo'shing — bitta `google-services.json` bir nechta paketni
saqlay oladi.

Keyin **google-services.json** ni yuklab oling va loyiha ILDIZIGA
qo'ying:

```
YolUp_App/google-services.json
```

Fayl `.gitignore` da — repoga tushmaydi, chunki loyihaga xos kalitlarni
saqlaydi. Uni jamoaga alohida (parol menejeri yoki xavfsiz kanal orqali)
bering.

---

## 3. iOS ilovasi — keyinroq ham bo'ladi

**Add app → iOS**, bundle ID `uz.yolup.edu`.

**GoogleService-Info.plist** ni yuklab olib, u ham loyiha ildiziga:

```
YolUp_App/GoogleService-Info.plist
```

iOS uchun QO'SHIMCHA qadam bor: Apple Developer hisobidan **APNs Auth
Key** (`.p8` fayl + Key ID + Team ID) olinib, Firebase Console →
Project Settings → **Cloud Messaging** → Apple app configuration ga
yuklanishi kerak. Usiz iOS'da push umuman ishlamaydi.

Android chiqarilishi uchun bu shart emas.

---

## 4. Qayta qurish

Fayllar `android/` ichiga prebuild vaqtida ko'chiriladi, shuning uchun
ularni qo'yganingizdan keyin nativ loyiha qayta yaratilishi kerak:

```bash
npx expo run:android          # dev client
npm run apk                   # release APK
```

`app.config.ts` fayl bor-yo'qligini o'zi tekshiradi (`firebaseFile`):
bo'lmasa qurish yiqilmaydi, faqat push ishlamaydi.

---

## 5. Tekshirish

1. Ilovani oching va hisobga kiring. Ilova ruxsat so'raydi
   ("Bildirishnomalar yuborishga ruxsat bering") — **Ruxsat berish**.
2. Bildirishnomalar ekranini oching (qo'ng'iroq belgisi).
3. Yuqoridagi **qo'ng'iroq tugmasini** bosing — bu `push/test/` ga
   so'rov yuboradi (faqat dev qurilishda ko'rinadi).
4. Telefonga banner kelishi kerak.

Kelmasa, tartib bilan tekshiring:

| Belgi | Sabab |
|---|---|
| "Sinov push yuborildi" chiqdi, banner kelmadi | Backendda service account JSON yo'q, yoki token backendga yetmagan |
| Xato toast chiqdi | Backend endpointi javob bermadi — xabar matniga qarang |
| Hech narsa bo'lmadi | Ruxsat berilmagan (telefon sozlamalari → ilova → bildirishnomalar) |

Ilovani **yopib** yoki fonga o'tkazib sinang: ilova ochiq bo'lganda
tizim banneri ATAYLAB ko'rsatilmaydi (ichki toast allaqachon chiqadi,
ikkitasi ortiqcha bo'lardi — `use-push-registration.ts`).

---

## Nima allaqachon ishlaydi

Push'siz ham ilova ochiq bo'lganda bildirishnoma WebSocket orqali keladi
va ichki toast chiqadi. Push faqat **ilova yopiq yoki fonda** bo'lgan
holatni qoplaydi.

---

## Ochiq savol (backend so'ragan)

Hozir HAMMA bildirishnoma push bo'lib boradi. Chat xabarlari ko'p bo'lsa
foydalanuvchi bannerdan charchashi mumkin. Kerak bo'lsa backend `kind`
maydoni bo'yicha filtrlashni qo'shadi — bu qaror qabul qilinishi kerak.
