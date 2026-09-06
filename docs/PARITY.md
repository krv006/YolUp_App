# Veb ↔ Mobil funksional taqqoslash

> **Savol:** veb'da bor barcha narsa mobilda bormi?
> **Javob: HA** — ataylab qoldirilgan ikkitadan tashqari (§Qoldirilgan).

Bu fayl `mobile/docs/DECISIONS.md` va `../docs/MOBILE_PLAN.md` bilan birga
o'qiladi. Har o'zgarishda yangilanadi.

## Bu javob QANDAY tekshirilgan

Komponent nomlarini taqqoslash yetarli emas edi: nom mos kelsa ham
ichidagi amal yetishmasligi mumkin. Shuning uchun tekshiruv MASHINA
o'qiy oladigan uch o'lchovda o'tkaziladi — har biri "veb'da bor, mobilda
chaqirilmagan" narsani topadi:

1. **Hooklar.** Veb `*.queries.ts` dagi 93 ta `use*` eksporti mobil
   `pages/`, `widgets/`, `modules/*/ui/`, `app/` da qidiriladi.
2. **Modul eksportlari.** Barcha `modules/*/index.ts` dan 139 ta nom.
3. **Umumiy kutubxona.** `shared/lib` va `shared/hooks` dan 16 ta funksiya.

Birinchi o'tkazishda 20 ta hook mobilda hech qayerdan chaqirilmagani
aniqlandi. Ulardan 10 tasi veb'da ham ishlatilmagan (`useCreateCourse`,
`useUnbanFromLesson`, `useStudentDashboard` — bu oxirgisi veb'da
umuman marshrutga ulanmagan o'lik kod), qolgan **10 tasi esa haqiqiy
kamchilik edi va shu tekshiruvdan keyin yopildi** (pastdagi jadval).

Domen qatlami boshidanoq to'liq edi: yetishmagani UI edi — ma'lumot bor,
tugmasi yo'q. Shuning uchun "modul ko'chirilgan" degani "funksiya bor"
degani EMAS; ushbu uch o'lchov aynan shu farqni ko'radi.

---

## Hisob

| | Veb | Mobil |
|---|---|---|
| Sahifalar | 22 | 21 |
| Modul UI komponentlari | 54 | 31 |
| Widgetlar | 6 | 11 |

Komponentlar soni kamroq, lekin **funksiya to'liq**: mobilda bir nechta veb
dialogi bitta oynaga birlashtirilgan (masalan `lesson-sheets.tsx` uchta veb
dialogini o'z ichiga oladi), ba'zilari esa umumiy primitivga aylangan
(`ScreenEmpty`, `RoleRoute`). Quyidagi jadval har bir veb komponentining
mobil manzilini ko'rsatadi.

---

## Tekshiruvdan keyin yopilgan kamchiliklar

Bularning har biri veb UI'da bor edi, mobilda esa faqat ma'lumot qatlami
bor edi:

| Veb amali | Mobil manzili |
|---|---|
| `useGrantDraw` — o'quvchiga chizish ruxsati | `board-surface` → "Chizishga ruxsat" oynasi |
| `useSolveFormula` — SymPy formula yordamchisi | `board-surface` → "Formula yordamchisi" oynasi |
| `useAllowShare` — ekran ulashish ruxsati | `live-room` → ishtirokchi qatoridagi "Ruxsat" + so'rov toast'i |
| ekran ulashish SO'ROVI (o'quvchi) | `live-controls` → `MonitorUp` tugmasi |
| `useUpdateLesson` — darsni tahrirlash | `lesson-card` → "Tahrirlash" → `add-lesson-sheet` tahrir rejimi |
| `useDeleteLesson` — darsni o'chirish | `lessons-section` → `ConfirmSheet` |
| `useDeleteAssignment` — vazifani o'chirish | `assignments-section` → `ConfirmSheet` |
| `useDeleteQuiz` — testni o'chirish | `quizzes-page` → `ConfirmSheet` |
| `useDeleteRecording` — video yozuvni o'chirish | `recording-page` → `ConfirmSheet` |
| `useAssignment` — vazifa tafsilotini yangilash | `submission-review-sheet` |
| `useDownloadSubmissionFile` — topshiriq faylini olish | `submission-review-sheet` (qo'lda yozilgani hook bilan almashtirildi) |
| `LiveLessonBar` — "dars ketmoqda" chizig'i | `conversation-page` (avval faqat ikonka bor edi) |
| `PermissionGuard` | `modules/permission/ui/permission-guard` |
| `ForbiddenPage` (403) | `app/forbidden.tsx` |

---

## Modul UI komponentlari (54/54)

| Veb | Mobil |
|---|---|
| `attendance/attendance-accordion` | `attendance/ui/attendance-list` |
| `attendance/focus-journal-cell` | `attendance-list` ichida |
| `auth/login-form` | `pages/auth/login-page` |
| `auth/login-history-dialog` | `profile-page` ichida (`LoginHistorySheet`) |
| `auth/register-form` | `pages/auth/register-page` |
| `board/away-students-notice` | `board/ui/away-students-notice` |
| `board/board-panel` | `board/ui/board-surface` |
| `board/board-stroke` | `board/ui/board-stroke` (Skia) |
| `board/board-toolbar` | `board/ui/board-toolbar` |
| `board/math-field-input` | `board/ui/math-field-sheet` |
| `board/math-markup` | `MathMarkup` (KaTeX, o'sha faylda) |
| `conversation/chat-empty-state` | `ScreenEmpty` primitivi |
| `conversation/chat-header` | `conversation/ui/chat-header` |
| `conversation/conversation-info-panel` | `conversation/ui/conversation-info-sheet` |
| `conversation/conversation-item` | `conversation/ui/conversation-item` |
| `conversation/conversation-rail` | `providers/role-tabs` (pastki tablar) |
| `conversation/new-conversation-dialog` | `conversation/ui/new-group-sheet` |
| `course/add-student-dialog` | `widgets/group-workspace/add-student-sheet` |
| `homework/assignment-detail-dialog` | `homework/ui/submission-review-sheet` |
| `homework/homework-report-view` | `homework/ui/homework-report-view` |
| `homework/homework-result-dialog` | `homework/ui/homework-result-sheet` |
| `lesson/finish-lesson-dialog` | `lesson/ui/lesson-sheets` → `FinishLessonSheet` |
| `lesson/lesson-actions` | `lesson/ui/lesson-card` amallari |
| `lesson/lesson-calendar` | `lesson/ui/lesson-calendar` |
| `lesson/lesson-list` | `schedule-page` ro'yxat ko'rinishi |
| `lesson/lesson-rating-form` | `lesson-sheets` → `RateLessonSheet` |
| `lesson/lesson-ratings-dialog` | `lesson-sheets` → `LessonRatingsSheet` |
| `lesson/lesson-recording-player` | `recording-page` → `Player` (expo-video) |
| `lesson/lesson-view-switch` | `schedule-page` dagi `Chip` juftligi |
| `lesson/live-lesson-bar` | `lesson/ui/live-lesson-bar` + `chat-header` tugmasi |
| `lesson/rate-lesson-dialog` | `lesson-sheets` |
| `lesson/star-rating` | `lesson/ui/star-rating` |
| `live/attention-check-dialog` | `live-lesson-page` → `AttentionCheckDialog` |
| `live/lesson-invite-dialog` | `live/ui/lesson-invite-sheet` |
| `live/lesson-pre-join` | `live-lesson-page` → `PreJoin` |
| `message/date-separator` | `message-list` dagi kun qatorlari |
| `message/message-actions-menu` | `message/ui/message-actions-sheet` |
| `message/message-attachment` | `message/ui/message-attachment` |
| `message/message-bubble` | `message/ui/message-bubble` |
| `message/message-composer` | `message/ui/message-composer` |
| `message/message-list` | `message/ui/message-list` (FlashList) |
| `message/message-text` | `message/ui/message-text` |
| `message/typing-indicator` | `message-list` ichida |
| `notification/notification-bell` | suhbatlar sarlavhasi + profil |
| `notification/notification-html` | `shared/ui/html-view` (WebView) |
| `notification/notification-inbox-dialog` | `pages/notifications/notifications-page` |
| `notification/send-notification-dialog` | `notification/ui/send-notification-sheet` |
| `notification/sent-notifications-panel` | `notification/ui/sent-notifications-sheet` |
| `parent/selected-child-selector` | `parent/ui/child-selector` |
| `permission/permission-guard` | `permission/ui/permission-guard` (marshrut qorovuli — `providers/route-guards`) |
| `quiz/quiz-attempt-dialog` | `pages/quizzes/quiz-attempt-page` |
| `quiz/quiz-attempts-dialog` | o'sha ekranning "Tarix" bo'limi |
| `quiz/quiz-create-dialog` | `quiz/ui/add-quiz-sheet` |
| `student/student-enrollment-dialog` | `student/ui/student-enrollment-sheet` |

## Widgetlar (6/6)

| Veb | Mobil |
|---|---|
| `account-menu` | `pages/profile/profile-page` + `auth/ui/profile-edit-sheet` |
| `conversation-panel` | `pages/chats/chats-page` |
| `group-action-dialogs` | `add-lesson-sheet` + `add-assignment-sheet` |
| `group-workspace` | `group-workspace` + 4 ta bo'lim |
| `student-group-workspace` | o'sha `group-workspace` (rolga qarab) |
| `live-room` | `live-room` + `live-controls` + `live-watermark` |

## Sahifalar (21/22)

Veb sahifalarining barchasi mobilda bor. Istisnolar quyida.

Marshrutlar ham tekshirildi: veb `app-router.tsx` dagi har bir `path`
mobil `src/app/` da fayl sifatida bor — 403 (`/forbidden`) va 404
(`+not-found`) ham qo'shildi.

---

## Qoldirilgan (ataylab)

| Veb | Sabab |
|---|---|
| `design-system/design-system-page` | Ichki dev-vosita: shadcn komponentlarini ko'zdan kechirish uchun. Mobilda dizayn tizimi boshqa (`shared/ui`), shuning uchun bu sahifaning ko'chirilishida ma'no yo'q |
| `ai/ai-page` mazmuni | Veb'da ham BO'SH placeholder ("hozircha tayyorlanmoqda"). Mobilda marshrut bor, tab qatoridan chiqarilgan (DECISIONS §—) — mazmun paydo bo'lganda bitta qator qo'shiladi |

---

## Mobilda VEB'DAN ORTIQ

| Imkoniyat | Izoh |
|---|---|
| FLAG_SECURE (skrinshot bloki) | Android'da to'liq. Brauzerda IMKONSIZ edi (`PROJECT.md` §10) |
| Ism-watermark | iOS'da skrinshotni to'sib bo'lmagani uchun ikkinchi himoya qatlami |
| Fokus jurnali aniqligi | `AppState` OS'dan aniq javob beradi; brauzer `visibilitychange` ishonchsiz edi |
| Kameradan to'g'ridan-to'g'ri topshirish | Uy vazifasiga rasm olish |
| Ulanish holati ko'rsatkichi | Mobil tarmoq muntazam uziladi — foydalanuvchi sababni biladi |

---

## Hali ochiq (funksional emas, infratuzilma)

`DECISIONS.md §15` da to'liq ro'yxat. Qisqasi:

- **Push xabarnoma** va **chat delta sync** — backend blokeri (`MOBILE_PLAN` §11 #1, #2)
- **i18n** — ongli qaror (`DECISIONS` §13)
- **Sentry, testlar, do'kon materiallari** — Faza 6
- **iOS ekran ulashish** — Broadcast Extension, v1.1
- ⚠️ **Real qurilmada ishga tushirilmagan** — Metro bundle ikkala platformada quriladi, lekin bu ishlayotgan ilova bilan bir xil emas
