# Backenddan kerak bo'lgan ikkita o'zgarish

**Kimga:** backend dasturchisiga
**Sana:** 2026-10-05
**Holat:** mobil tomon kutmoqda

Push bo'yicha oldingi so'rov (`PUSH-BACKEND.md`) bajarildi, rahmat. Bu
yerda yana ikkita narsa bor — ikkalasi ham mobil tomondan hal qilib
bo'lmaydi.

---

## 1. Taklif kodi o'rniga username

### Hozir qanday

O'quvchi profilida tasodifiy **taklif kodi** ko'rsatiladi (`FK-73MU`), va
ota-ona farzandini aynan shu kod bilan ulaydi:

```
POST /api/v1/auth/links/request/
{ "invite_code": "FK-73MU" }
```

Kod `/api/v1/auth/me/` javobidagi `invite_code` maydonidan keladi.

### Nima kerak

Loyiha egasi taklif kodini **olib tashlab**, uning o'rniga o'quvchining
**username** ini ishlatishni so'radi. Sabablari: o'quvchi o'z loginini
allaqachon biladi va uni eslab qolish osonroq, ikkita turli identifikator
esa chalkashtiradi.

Shuning uchun kerak:

**1.1. `links/request/` username qabul qilsin.**

```
POST /api/v1/auth/links/request/
{ "username": "krv006" }
```

Eski `invite_code` ni ham qoldirsangiz yaxshi bo'lardi — veb ilova hali
uni ishlatadi va bir vaqtning o'zida ikkalasi ishlashi o'tish davrini
osonlashtiradi. Ikkisidan biri kelsa yetarli.

**1.2. Username UNIQUE bo'lsin.**

Hozir u unique deb o'ylaymiz (login shu bilan bo'ladi), lekin tasdiqlash
kerak. Agar yo'q bo'lsa — unique qilinishi shart, aks holda ota-ona
qaysi bolaga ulanayotgani aniq bo'lmaydi.

**1.3. Username o'zgartirishda band bo'lsa aniq xato.**

```
PATCH /api/v1/auth/me/
{ "username": "krv006" }

400 { "username": ["Bu login band."] }
```

Mobil maydon xatolarini maydon tagida ko'rsatadi (`applyApiFieldErrors`),
shuning uchun xato aynan `username` kaliti bilan kelishi muhim — umumiy
`detail` bo'lsa, foydalanuvchi qaysi maydon xato ekanini ko'rmaydi.

### Mobilda nima o'zgaradi (backend tayyor bo'lgach)

- Profilda taklif kodi qatori o'rniga username ko'rsatiladi.
- Ota-ona kiritadigan maydon "Taklif kodi" emas, "O'quvchi logini"
  bo'ladi.
- `.toUpperCase()` olib tashlanadi — hozir kiritilgan qiymat katta
  harfga o'giriladi (`parent-children-page.tsx:70`), bu kod uchun
  to'g'ri edi, username uchun esa uni buzadi.

Bular bitta PR da, backend tayyor bo'lgach qilinadi. Hozir qilinsa
farzand ulash butunlay ishlamay qoladi.

---

## 2. O'qituvchi uchun administrator tasdig'i

### Hozir qanday

Tasdiqlanmagan o'qituvchi suhbatlar ro'yxatini ocholmaydi:

```
GET /api/v1/.../rooms/   ->  403
{ "detail": "Sizning rolingizda bu amal uchun ruxsat yo'q." }
```

Kurs va dars yaratish ham 403 qaytaradi.

### Nima kerak

Loyiha egasi bu bosqichda tasdiqlash talabi kerak emas deb qaror qildi.
**Yangi ro'yxatdan o'tgan o'qituvchi darhol ishlay olsin:** suhbatlarni
ko'rsin, kurs va dars yarata olsin.

Qanday qilish sizga havola — `is_approved` ni standart `true` qilish,
yoki ruxsat tekshiruvini olib tashlash. Admin paneldagi tasdiqlash
ro'yxati qolaversin, faqat u **to'siq** bo'lmasin.

### Nega bu shoshilinch

Mobilda profildagi "hisobingiz hali tasdiqlanmagan" ogohlantirishi
allaqachon olib tashlandi (loyiha egasining talabi bilan). Ya'ni hozir
tasdiqlanmagan o'qituvchi 403 ni ko'radi, **sababini esa ko'rmaydi** —
ogohlantirish aynan shuni tushuntirardi.

Backend tomonda o'zgarish kechiksa, ayting: ogohlantirishni vaqtincha
qaytarib qo'yamiz.

---

## 3. Mock test endpointi — savol

Sinov paytida o'quvchi hisobida "Mock Test" bo'limi ochilganda **404**
qaytdi:

```
GET /api/v1/quizzes/mock-tests/   ->  404
```

Bu endpoint ishlab turgan serverda bormi? Agar hali chiqarilmagan bo'lsa,
qachon rejalashtirilganini ayting — mobil tomon tayyor, faqat bo'sh
ro'yxat o'rniga xato ko'rsatmoqchi emasmiz.

Agar endpoint bor bo'lib, bo'sh ro'yxatda 404 qaytarayotgan bo'lsa —
bo'sh ro'yxat uchun `200` va `[]` to'g'riroq bo'lardi: shunda ilova
"hali sinov testi yo'q" deb ko'rsatadi, xato emas.

---

## 4. Veb tomondagi xato (sizning e'tiboringiz uchun)

Bu backend emas, **veb frontend** masalasi, lekin yo'l-yo'lakay topildi.

Ota-ona farzandining vazifalar hisobotini so'raganda backend `student_id`
kutadi:

```
GET /api/v1/homework/report/?student_id=<id>
```

Veb esa `student` yuboradi (`homework.api.ts`), shuning uchun **400**
oladi:

```
{ "student_id": "Bu maydon majburiy." }
```

Ya'ni veb saytda ota-ona farzandining reytingini ko'ra olmaydi. Mobil
tomonda tuzatildi; vebda ham bir so'zlik o'zgarish.

---

## Ro'yxat

- [ ] `links/request/` `username` qabul qilsin (`invite_code` yonida)
- [ ] username unique ekani tasdiqlansin
- [ ] `PATCH /auth/me/` da band username uchun `username` kalitli 400
- [ ] o'qituvchi uchun tasdiqlash to'sig'i olib tashlansin
- [ ] mock test endpointi haqida javob (bormi, qachon)
- [ ] (veb jamoasiga) hisobot so'rovida `student` -> `student_id`

Savol bo'lsa yozing — mobil tomon tayyor turibdi.
