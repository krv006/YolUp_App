# Do'kon sahifasi — Google Play uchun matnlar

**Sana:** 2026-10-09
**Hisob:** YolUp · `6556041870254057535` (shaxsiy)
**Paket:** `uz.yolup.edu`

Bu fayl Play Console'ning "Основные сведения о приложении" va
"Безопасность данных" bo'limlariga ko'chiriladigan tayyor matnlar.
Hammasi bir joyda tursin — keyingi chiqarishlarda qayta yozilmasin.

---

## Ilova nomi (30 belgi)

```
YolUp — o'quv platformasi
```

(24 belgi)

---

## Qisqa tavsif (80 belgi)

Do'kon ro'yxatida, ilova nomi ostida ko'rinadi.

```
Darslar, uy vazifalari, testlar va imtihonlar — hammasi bitta ilovada.
```

(70 belgi)

---

## To'liq tavsif (4000 belgigacha)

```
YolUp — o'quv markazlari va ularning o'quvchilari uchun mo'ljallangan
ta'lim platformasi. O'qituvchi, o'quvchi va ota-ona bitta tizimda
ishlaydi: har biri o'z rolidagi ekranni ko'radi.

O'QUVCHI UCHUN
• Guruh suhbatlari — o'qituvchi va sinfdoshlar bilan yozishma
• Jonli darslar — ovoz, video va doska bilan
• Dars yozuvlari — o'tkazib yuborilgan darsni keyin ko'rish
• Uy vazifalari — topshiriqni ilovadan topshirish, bahoni ko'rish
• Testlar va imtihonlar — vaqt chekloviga ega savollar
• Reyting va tahlil — natijalar dinamikasi
• Dars jadvali va davomat

O'QITUVCHI UCHUN
• Guruhlar va o'quvchilarni boshqarish
• Jonli dars o'tkazish, ekranni ulashish, doskadan foydalanish
• Uy vazifasi berish va tekshirish
• Test va imtihon tuzish, savollar guruhini saqlash
• Davomat belgilash
• Sun'iy intellekt yordamida IELTS Writing ishlarini tahlil qilish

OTA-ONA UCHUN
• Farzandining davomati
• Uy vazifalari va ularning holati
• Baholar va reyting
• Bildirishnomalar

Ilovadan foydalanish uchun o'quv markazi bergan hisob kerak.

Bildirishnomalar yangi vazifa, dars boshlanishi va tekshirilgan ish
haqida xabar beradi.
```

---

## Toifa va sozlamalar

| Maydon | Qiymat |
|---|---|
| Приложение или игра | Приложение |
| Категория | Образование |
| Теги | Обучение, Онлайн-курсы |
| Целевая аудитория | 13+ (bolalar uchun **emas** — Families policy qo'llanmasin) |
| Содержит ли рекламу | Yo'q |
| Платный или бесплатный | Bepul |
| Эл. почта | yolup2026@gmail.com |

**Diqqat:** "Приложения для детей или всей семьи" belgilanmasin. Belgilansa
Families policy talablari qo'shiladi: alohida maxfiylik siyosati, reklama
cheklovlari va qo'shimcha tekshiruv.

---

## Безопасность данных (Data safety) — javoblar

Google shaklidagi savollarga aniq javoblar. Yolg'on javob berilsa, keyin
ilova do'kondan olib tashlanishi mumkin.

### Yig'iladigan ma'lumotlar

| Toifa | Nima | Majburiymi | Nima uchun |
|---|---|---|---|
| Личная информация → Имя | ism, familiya | ha | hisob va ro'yxat |
| Личная информация → Адрес эл. почты | email | ha | hisob |
| Личная информация → Номер телефона | telefon | ha | hisob va bog'lanish |
| Личная информация → Другое | rol, guruh | ha | ilova ishlashi |
| Фото и видео → Фото | profil rasmi, vazifaga biriktirilgan rasm | yo'q | foydalanuvchi o'zi yuklaydi |
| Файлы и документы | vazifaga biriktirilgan fayl | yo'q | vazifa topshirish |
| Аудио → Записи голоса | jonli darsdagi ovoz | yo'q | darsda qatnashish |
| Сообщения в приложении | guruh suhbati | ha | ilova ishlashi |
| Действия в приложении | test natijalari, davomat | ha | tahlil va baho |

### Har toifa uchun

- **Собираются** — ha (serverga yuboriladi)
- **Передаются третьим лицам** — yo'q
- **Шифруются при передаче** — ha (HTTPS/WSS)
- **Можно ли запросить удаление** — ha (o'quv markazi orqali)

### Ruxsatlar izohi

Tekshiruvda so'ralishi mumkin:

| Ruxsat | Nima uchun |
|---|---|
| CAMERA | jonli darsda video, vazifaga rasm olish |
| RECORD_AUDIO | jonli darsda gapirish |
| FOREGROUND_SERVICE_MEDIA_PLAYBACK | dars fonga o'tganda ovoz uzilmasligi |
| FOREGROUND_SERVICE_MEDIA_PROJECTION | o'qituvchi ekranini ulashishi |
| POST_NOTIFICATIONS | vazifa va dars haqida bildirishnoma |

**`MEDIA_PROJECTION` ko'pincha qo'shimcha savol keltiradi.** Google ekran
ulashish qanday ishlashini ko'rsatuvchi qisqa video so'rashi mumkin —
o'qituvchi hisobidan jonli darsda ekran ulashishni yozib qo'ying.

---

## Grafik materiallar

| Nima | O'lcham | Holati |
|---|---|---|
| Ikonka | 512×512 PNG | `assets/icon.png` dan tayyorlanadi |
| Feature grafika | 1024×500 PNG | kerak |
| Telefon skrinshotlari | kamida 2, 16:9 yoki 9:16 | qurilmadan olinadi |

Tavsiya etiladigan skrinshotlar (6 ta, har rol ko'rinsin):
guruh suhbati · jonli dars · uy vazifasi · test · reyting/tahlil · ota-ona
asosiy ekrani.

---

## Maxfiylik siyosati

URL **majburiy** — ochiq, parolsiz ochiladigan doimiy sahifa.
Matni `docs/MAXFIYLIK.md` da. Uni veb saytga qo'yib, URL'ni shu yerga
yozing:

```
URL: (hali joylanmagan)
```
