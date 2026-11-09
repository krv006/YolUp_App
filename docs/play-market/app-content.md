# Play Market — "Содержание приложения" va "Безопасность данных" javoblari

Play Console → **Правила → Содержание приложения**. Har bo'lim alohida to'ldiriladi.
Javoblar koddan aniqlangan (2026-11-09, `main` holati). Ilova o'zgarsa, shu fayl ham yangilanadi.

---

## 1. Политика конфиденциальности (maxfiylik siyosati)

Matn: `privacy-policy.md`. Ochiq havolada joylanadi (masalan `https://yolup.uz/privacy`) va havola shu yerga kiritiladi.

## 2. Реклама (reklama)

**Нет** — ilovada reklama yo'q. Reklama SDK'lari ham ulanmagan.

## 3. Доступ к приложению (tekshiruvchilar uchun kirish)

**Часть функций недоступна без входа** ni tanlang, keyin uchta yo'riqnoma qo'shing:

| Nomi | Login | Parol | Izoh |
|---|---|---|---|
| Teacher | `[o'qituvchi test hisobi]` | `[parol]` | Guruhlar, jonli dars, vazifalarni tekshirish |
| Student | `[o'quvchi test hisobi]` | `[parol]` | Darslar, vazifa topshirish, testlar, AI repetitor |
| Parent | `[ota-ona test hisobi]` | `[parol]` | Farzand davomati, vazifalari, natijalari |

Talablar:
- Hisoblar `backend.yolup.uz` da ishlashi kerak.
- Parol muddati tugamasligi va ikki bosqichli tasdiq (2FA) o'chiq bo'lishi kerak.

Ko'rsatma matni (inglizcha):
> Sign in with the credentials above on the login screen ("Kirish"). Each account opens a different role. Live lessons start only at the teacher's scheduled time; recorded lessons and the whiteboard are available from the teacher's "Workspace".

## 4. Возрастные ограничения (kontent reytingi — IARC so'rovnomasi)

- Toifa: **Справочные материалы, новости или образование** (Reference, News, or Educational)
- Zo'ravonlik, qo'rqinchli, jinsiy, giyohvandlik, qimor va so'kinish: **Нет**
- Foydalanuvchilar o'zaro muloqot qiladimi / kontent almashadimi: **Да** — guruh va shaxsiy chatlar, fayllar, ovozli xabarlar, jonli dars
- Foydalanuvchi joylashuvini boshqalarga ko'rsatadimi: **Нет**
- Raqamli tovarlar sotiladimi: **Нет**

## 5. Целевая аудитория (maqsadli auditoriya) — QAROR KERAK

O'quvchilar orasida 13 yoshgacha bolalar bo'lishi mumkin. Bu yerdagi tanlov ilovaga qo'yiladigan talablarni o'zgartiradi:

- **13+ (13–15, 16–17, 18+):** oddiy tekshiruv.
- **13 yoshgacha guruhlar ham belgilansa:** Google'ning "Families" siyosati qo'llanadi.
  - Bolalar ma'lumotlari uchun qattiqroq talablar bor.
  - Faqat sertifikatlangan SDK'lardan foydalanish mumkin.
  - Jonli video va chat alohida tekshiriladi.

Tavsiya: agar 13 yoshgacha o'quvchilar asosiy auditoriya bo'lmasa, **13+** ni tanlang va tavsifda "o'quv markazlari uchun" deb ko'rsating. Farzandlarni ota-ona hisobi orqali qo'shish funksiyasi bu tanlovdan qat'i nazar qoladi.

## 6. Новостное приложение — **Нет**

## 7. Приложения для отслеживания контактов / здоровья / финансов — **Нет**

## 8. Государственное приложение — **Нет**

## 9. Разрешения на использование сервисов переднего плана (foreground service)

Ilova ikki turdagi fon xizmatini e'lon qiladi. Har biriga tavsif va qisqa video havolasi (YouTube, "unlisted" bo'lsa ham bo'ladi) so'raladi.

| Tur | Nima uchun | Videoda ko'rsatiladi |
|---|---|---|
| `mediaProjection` | O'qituvchi jonli darsda telefon ekranini o'quvchilarga ulashadi (LiveKit/WebRTC `MediaProjectionService`) | Jonli dars → "Ekranni ulashish" → tizim ruxsati → ekran o'quvchida ko'rinadi |
| `mediaPlayback` | Jonli dars yoki ovozli xabar ovozi ilova fonga o'tganda uzilmasligi uchun (`expo-audio`) | Jonli darsda → ilovani yopish (Home) → ovoz davom etadi, bildirishnomada boshqaruv |

Tavsif matnlari (inglizcha):
- **mediaProjection:** "Teachers share their phone screen with students during a live lesson. Screen capture runs only after the teacher taps 'Share screen' and accepts the system prompt, and stops when the teacher ends sharing or leaves the lesson."
- **mediaPlayback:** "Keeps the live lesson and voice message audio playing when the user switches to another app, so students do not lose the lesson audio. Playback stops when the lesson ends or the user stops it."

Bulardan tashqari ilova so'raydigan ruxsatlar:
- Kamera va mikrofon — jonli dars, ovozli xabar, og'zaki vazifa.
- Bildirishnomalar — push-bildirishnomalar uchun.

Bu ikki ruxsat oddiy ruxsatlar, ular uchun alohida e'lon kerak emas.
`READ_MEDIA_IMAGES` va (production'da) `SYSTEM_ALERT_WINDOW` `app.config.ts` da bloklangan — rasm tanlash tizim Photo Picker'i orqali ruxsatsiz ishlaydi.

---

## 10. Безопасность данных (Data safety)

### Umumiy savollar

| Savol | Javob |
|---|---|
| Ilova ma'lumot to'playdimi yoki uzatadimi? | **Да** |
| Barcha ma'lumotlar uzatishda shifrlanadimi? | **Да** — barcha so'rovlar HTTPS/WSS orqali |
| Foydalanuvchi ma'lumotlarini o'chirishni so'ray oladimi? | **Да** — ilovada "Akkauntni o'chirish" bor (Profil → Akkaunt sozlamalari) |
| Hisob yaratish usuli | Login va parol (ilova ichida ro'yxatdan o'tish yoki o'quv markazi beradi) |
| Hisobni o'chirish havolasi (veb) | `[https://yolup.uz/... — hisobni o'chirish sahifasi yoki ko'rsatma havolasi]` |

### To'planadigan ma'lumotlar

Hammasi uchun:
- **Передаётся третьим лицам:** Нет. AI tekshiruv va video server bizning nomimizdan ishlaydigan xizmat ko'rsatuvchilar, Google ta'rifi bo'yicha bu "uzatish" emas.
- **Обработка эфемерная:** Нет.

| Toifa → tur | Majburiymi | Maqsad |
|---|---|---|
| Личная информация → Имя | Majburiy | Работа приложения, Управление аккаунтом |
| Личная информация → Адрес электронной почты | Ixtiyoriy | Управление аккаунтом, Связь с разработчиком (xabarnomalar) |
| Личная информация → Идентификаторы пользователей (login) | Majburiy | Работа приложения, Управление аккаунтом |
| Личная информация → Номер телефона | Ixtiyoriy | Управление аккаунтом, Безопасность (2FA) |
| Личная информация → Другая информация (tug'ilgan sana, shahar, sinf, fan, bio) | Ixtiyoriy | Работа приложения |
| Местоположение → Приблизительное местоположение (IP bo'yicha, kirishlar tarixida) | Majburiy | Безопасность, предотвращение мошенничества |
| Фото и видео → Фотографии (avatar, vazifa rasmlari) | Ixtiyoriy | Работа приложения |
| Фото и видео → Видео (jonli dars kamerasi, dars yozuvlari) | Ixtiyoriy | Работа приложения |
| Аудио → Голосовые или звуковые записи (ovozli xabar, jonli dars, og'zaki vazifa) | Ixtiyoriy | Работа приложения |
| Файлы и документы (vazifa fayllari, sertifikatlar) | Ixtiyoriy | Работа приложения |
| Сообщения → Другие сообщения в приложении (chat) | Ixtiyoriy | Работа приложения |
| Действия в приложении → Взаимодействие с приложением (davomat, darsdagi diqqat/fokus) | Majburiy | Работа приложения, Аналитика (o'qituvchi va ota-ona uchun hisobot) |
| Действия в приложении → Другой пользовательский контент (vazifa javoblari, doska) | Ixtiyoriy | Работа приложения |
| Идентификаторы устройства или другие идентификаторы (push token, qurilma nomi) | Majburiy | Работа приложения (push), Безопасность (kirishlar tarixi) |

Ilova **to'plamaydi**: aniq joylashuv, kontaktlar, kalendar, moliyaviy ma'lumot, sog'liq ma'lumoti, brauzer tarixi, o'rnatilgan ilovalar, crash/diagnostika (uchinchi tomon SDK'si yo'q).
