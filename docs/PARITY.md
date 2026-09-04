# Veb ↔ Mobil funksional taqqoslash

> **Savol:** veb'da bor barcha narsa mobilda bormi?
> **Javob: YO'Q.** Quyida aniq ro'yxat — nima bor, nima yo'q, nega.

Bu fayl `mobile/docs/DECISIONS.md` va `../docs/MOBILE_PLAN.md` bilan birga
o'qiladi. Har o'zgarishda yangilanadi.

---

## Xulosa

| | Veb | Mobil |
|---|---|---|
| Sahifalar | 22 | 19 |
| Modul UI komponentlari | 54 | 17 |
| **KO'RISH oqimlari** (o'qish, kirish, topshirish) | ✅ | ✅ **to'liq** |
| **YARATISH/BOSHQARISH oqimlari** (o'qituvchi, admin) | ✅ | ❌ **asosan yo'q** |

Boshqacha aytganda: **o'quvchi va ota-ona uchun mobil deyarli to'liq;
o'qituvchi va admin uchun mobil hozircha "ko'rish rejimi"da.**

---

## ✅ Mobilda BOR (veb bilan teng)

| Bo'lim | Izoh |
|---|---|
| Kirish, ro'yxatdan o'tish, sessiya | To'liq |
| Suhbatlar ro'yxati, qidiruv, filtrlar | To'liq |
| Chat: xabar, javob, biriktirma, "yozmoqda", offline navbat | To'liq |
| Guruh bo'limlari: Darslar · Vazifalar · O'quvchilar | Ko'rish |
| Uy vazifasi: o'qish, fayl/kamera bilan topshirish, AI natijasi | To'liq |
| Jadval: kalendar + ro'yxat | Ko'rish |
| Testlar: yechish, natija, urinishlar tarixi | To'liq |
| Reyting / hisobot | To'liq |
| Ota-ona: panel, farzandlar, rozilik, davomat, fokus jurnali, vazifalar, baholar | To'liq |
| Jonli dars: kirish, video, mikrofon/kamera so'rovi, diqqat tekshiruvi, fokus jurnali | To'liq |
| Doska: chizish, shakllar, matn, varaqlar, sababli o'chirish | To'liq |
| Dars yozuvi | To'liq |
| Bildirishnomalar: ro'yxat, jonli kanal | To'liq |
| Profil: ma'lumot, kirishlar tarixi, chiqish | Qisman (§P2) |
| FLAG_SECURE + watermark | Mobilda **veb'dan ortiq** |

---

## ❌ Mobilda YO'Q

### P0 — foydalanuvchi oqimini to'sadi

| Veb komponenti | Nima qiladi | Kimga tegadi |
|---|---|---|
| `student-enrollment-dialog.tsx` | "Yangi muloqot": ochiq **kursga qo'shilish**, o'qituvchiga **direct so'rov**, **ota-ona so'rovini tasdiqlash** | 🔴 **O'quvchi.** Busiz yangi o'quvchi mobilda hech qayerga qo'shila olmaydi va ota-onasini tasdiqlay olmaydi |
| `rate-lesson-dialog.tsx` + `lesson-rating-form.tsx` + `star-rating.tsx` | Tugagan darsni baholash | 🔴 O'quvchi. Jadvalda tugma bor edi — hozir o'chirilgan (`onRate: undefined`) |
| `finish-lesson-dialog.tsx` | Darsni yakunlash + yozuv nomini berish | 🔴 O'qituvchi. Darsni mobildan tugatib bo'lmaydi |

### P1 — o'qituvchi ishini to'sadi

| Veb komponenti | Nima qiladi |
|---|---|
| `AddLessonDialog` (group-action-dialogs) | Dars yaratish + haftalik jadval generatori |
| `AddAssignmentDialog` | Vazifa yaratish (rich matn, fayl, muddat, skill) |
| `quiz-create-dialog.tsx` | Test yaratish (savollar, variantlar) |
| `add-student-dialog.tsx` | Kursga o'quvchi qidirib qo'shish |
| `assignment-detail-dialog.tsx` | Topshiriqlarni ko'rib chiqish, AI bahosini **tuzatish** |
| `attendance-accordion.tsx` | O'qituvchi davomat jadvali (mobilda faqat ota-ona ko'rinishi bor) |
| `lesson-ratings-dialog.tsx` | Darsga qo'yilgan baholarni ko'rish |
| `lesson-invite-dialog.tsx` | Darsga o'quvchi taklif qilish |
| `away-students-notice.tsx` | Doskada: hozir chiqib ketganlar |
| `new-conversation-dialog.tsx` | O'qituvchi tomondan suhbat ochish |

### P2 — ikkinchi darajali

| Veb komponenti | Nima qiladi | Qaror |
|---|---|---|
| `admin-dashboard-page.tsx` | Admin paneli | ATAYLAB (MOBILE_PLAN §6.1) — telefonda yomon UX |
| `admin-teachers-page.tsx` | O'qituvchini tasdiqlash | ATAYLAB, lekin push bilan qayta ko'rilishi mumkin |
| `send-notification-dialog.tsx` · `sent-notifications-panel.tsx` | Admin xabar yuborish | ATAYLAB (admin veb'da) |
| `conversation-info-panel.tsx` | Suhbat ma'lumoti, guruh rasmini o'rnatish | Qolgan |
| `account-menu` profil tahriri | Ism/telefon o'zgartirish, avatar, sertifikatlar | Qolgan |
| `math-field-input.tsx` · `math-markup.tsx` | LaTeX kiritish va **render** | Qolgan (Skia'da matn dvigateli yo'q) |
| `notification-html.tsx` | Bildirishnomaning to'liq HTML'i | Qolgan (hozir oddiy matn) |
| `live-lesson-bar.tsx` | "Dars ketmoqda" paneli | Qisman — suhbat sarlavhasida tugma bor |
| `ai-page.tsx` | AI bo'limi | Veb'da ham bo'sh placeholder |
| `design-system-page.tsx` | Ichki komponent ko'rgazmasi | Kerak emas |

---

## Reja

Tartib foydalanuvchiga ta'siri bo'yicha, texnik qulaylik bo'yicha emas:

1. **P0** — o'quvchi va o'qituvchining asosiy oqimlari to'silmasin.
2. **P1** — o'qituvchi mobildan to'liq ishlay olsin.
3. **P2** — sayqal; admin ATAYLAB veb'da qoladi.
