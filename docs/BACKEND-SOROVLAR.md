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

## Ro'yxat

- [ ] `links/request/` `username` qabul qilsin (`invite_code` yonida)
- [ ] username unique ekani tasdiqlansin
- [ ] `PATCH /auth/me/` da band username uchun `username` kalitli 400
- [ ] o'qituvchi uchun tasdiqlash to'sig'i olib tashlansin

Savol bo'lsa yozing — mobil tomon tayyor turibdi.
