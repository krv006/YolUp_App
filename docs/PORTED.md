# Port manifesti

> **Bu fayl majburiy.** Veb loyihadan ko'chirilgan har bir fayl shu yerda
> qayd etiladi. Ro'yxatga kirmagan ko'chirma — PR'da blocker
> (`docs/MOBILE_PLAN.md` §18.4).

- **Manba:** `Edu_Front` — port endi BOSQICHMA-BOSQICH ketmoqda, shuning uchun
  yagona commit yo'q: har faylning hash'i o'zi ko'chirilgan paytdagi veb
  holatini bildiradi. Poydevor (shared + auth), chat, kurs va dars domeni `eb02cd7` da,
  qolganlari hali `1e53492` da.
- **Oxirgi yangilanish:** 2026-10-21 (veb `e88ca42` — yangi backend endpointlari: auth, kurs, vazifa, dars, jonli dars, doska, imtihon)
- **Drift tekshiruvi:** `npm run check-sync`

> ⚠️ `npm run build:ported` ni HOZIR ishga tushirmang. U butun manifestni
> joriy veb holatiga qarab qayta yozadi va hali ko'chirilmagan fayllarni
> "moslashtirilgan" deb belgilab qo'yadi — drift ko'rinmay qoladi. Port
> tugagach qayta ishlatsa bo'ladi (sabab: `scripts/build-ported.mjs` boshida).

## Toifalar

| Belgi | Ma'nosi |
|---|---|
| 🟢 NUSXA | Veb bilan bayt-bayt bir xil. **Qo'lda tahrirlanmaydi** — o'zgarish avval veb'da qilinadi, keyin qayta ko'chiriladi |
| 🟡 MOSLASH | Ko'chirilgan, mobil uchun kichik o'zgarish. Farq quyida yozilgan |
| 🔴 QAYTA | Noldan mobil uchun yozilgan. Ommaviy interfeys veb bilan bir xil |
| 🆕 MOBIL | Mobilga xos, veb'da manbasi yo'q |

**Hash** — port qilingan paytdagi VEB faylining sha256 boshi. `check-sync`
uni qayta hisoblab, veb tomonda o'zgargan fayllarni ko'rsatadi.

## Hisob

- 🟢 NUSXA: **134**
- 🟡/🔴 moslashtirilgan: **84**
- 🆕 mobilga xos: **11**
- Jami: **229**

## Olib tashlangan bo'limlar

| Bo'lim | Sana | Sabab |
| --- | --- | --- |
| Mock test (`modules/mock-test`, `pages/mock-test`) | 2026-10-05 | Backend javobi: endpoint mavjud emas va rejalashtirilmagan, funksiya platformadan ataylab olib tashlangan. Veb'da modul hali turibdi — u yerda ham olinishi kutilmoqda. Kod git tarixida qoladi. |
| O'quvchi reytingi (`app/student/report.tsx`) | 2026-10-05 | Loyiha egasi qarori. Hisobotning o'zi qoladi — ota-ona farzandining natijalarini ko'radi. |

## Fayllar

| Mobil fayl | Toifa | Veb hash | Farq / izoh |
|---|---|---|---|
| `src/modules/analytics/api/analytics.api.ts` | 🟢 NUSXA | `90c9cb7529fa` | — |
| `src/modules/analytics/api/analytics.dto.ts` | 🟢 NUSXA | `342fb56c6f1c` | — |
| `src/modules/analytics/api/analytics.endpoints.ts` | 🟢 NUSXA | `eb7c53d743c7` | — |
| `src/modules/analytics/index.ts` | 🟡 MOSLASH | `273b0bb4abe3` | generatsiya: veb barrel minus `ui/` eksportlari (port-barrels.mjs) |
| `src/modules/analytics/lib/analytics.mappers.ts` | 🟢 NUSXA | `d75c309664ba` | — |
| `src/modules/analytics/model/analytics.queries.ts` | 🟢 NUSXA | `daf5ad9278e5` | — |
| `src/modules/analytics/ui/trend-line-chart.tsx` | 🟡 MOSLASH | `3164201c6a1e` | hisob-kitob bir xil; `<svg>` -> `react-native-svg`; sichqoncha o'rniga bosish, qiymatlar vebdagidek tepada (`chart-tooltip.tsx`); o'q belgisi kichik oraliqda kasr bilan |
| `src/modules/analytics/ui/trend-stacked-bar-chart.tsx` | 🟡 MOSLASH | `96a4de5f614c` | hisob-kitob bir xil; `<svg>` -> `react-native-svg`; sichqoncha o'rniga bosish, qiymatlar tepada |
| `src/modules/attendance/api/attendance.api.ts` | 🟢 NUSXA | `db89018ad77c` | — |
| `src/modules/attendance/api/attendance.dto.ts` | 🟢 NUSXA | `4304c96f3e89` | — |
| `src/modules/attendance/api/attendance.endpoints.ts` | 🟢 NUSXA | `83cfca43b8de` | — |
| `src/modules/attendance/index.ts` | 🟡 MOSLASH | `83f88d8c0f2b` | generatsiya: veb barrel minus `ui/` eksportlari (port-barrels.mjs) |
| `src/modules/attendance/lib/attendance.mappers.ts` | 🟢 NUSXA | `0df1bc1d4732` | — |
| `src/modules/attendance/lib/group-by-lesson.ts` | 🟢 NUSXA | `2a79a46a78ac` | — |
| `src/modules/attendance/model/attendance.queries.ts` | 🟢 NUSXA | `245d98eff3e3` | — |
| `src/modules/auth/api/auth.api.ts` | 🟢 NUSXA | `6bde385b7dff` | — |
| `src/modules/auth/api/auth.dto.ts` | 🟢 NUSXA | `7b340e0bd732` | — |
| `src/modules/auth/api/auth.endpoints.ts` | 🟢 NUSXA | `08343fe68db8` | — |
| `src/modules/auth/index.ts` | 🟡 MOSLASH | `4f4ad4f6c7f2` | generatsiya: veb barrel minus `ui/` eksportlari (port-barrels.mjs) |
| `src/modules/auth/lib/auth-session.ts` | 🟢 NUSXA | `4e39458e320b` | — |
| `src/modules/auth/lib/auth.mappers.ts` | 🟢 NUSXA | `7a6984c5afb9` | — |
| `src/modules/auth/lib/uz-phone.ts` | 🟢 NUSXA | `5d9261447f72` | — |
| `src/modules/exam/api/exam.dto.ts` | 🟢 NUSXA | `e6bb65d23b85` | — |
| `src/modules/exam/lib/exam.mappers.ts` | 🟢 NUSXA | `e0e1f58b42ad` | — |
| `src/modules/auth/lib/describe-reset-error.ts` | 🟢 NUSXA | `e4d7589ed136` | — |
| `src/modules/auth/lib/describe-two-factor.ts` | 🟢 NUSXA | `20c09ae21e84` | — |
| `src/modules/auth/lib/describe-user-agent.ts` | 🟢 NUSXA | `ee0799ca7c53` | — |
| `src/modules/auth/lib/resolve-home-route.ts` | 🟢 NUSXA | `86d9a3f708fc` | — |
| `src/modules/auth/lib/teacher-approval.ts` | 🟢 NUSXA | `ea465e71f081` | — |
| `src/modules/auth/model/auth.mutations.ts` | 🟢 NUSXA | `1d8a7dd10d9c` | — |
| `src/modules/auth/model/auth.queries.ts` | 🟢 NUSXA | `77f4c5a259ca` | — |
| `src/modules/auth/model/auth.schemas.ts` | 🟢 NUSXA | `217cf656f39d` | — |
| `src/modules/auth/model/auth.store.ts` | 🟡 MOSLASH | `cebdd271f354` | window hodisalari -> refreshTokenManager; tab obunasi yo'q; sessiya raqami olindi; til sinxroni vebdagidek; vebdagi foydalanuvchi keshi (`USER_SNAPSHOT`) hali ko'chirilmagan — 7-bosqich |
| `src/modules/auth/model/use-role-routes.ts` | 🟢 NUSXA | `143916a2a7cf` | — |
| `src/modules/notification/lib/notification-display.ts` | 🟢 NUSXA | `8c04d7209a80` | — |
| `src/modules/voice/model/voice-ui.store.ts` | 🟢 NUSXA | `cad4aa4b6000` | — |
| `src/shared/styles/design-tokens.css` | 🔴 QAYTA | `266c5478b127` | `src/shared/ui/ds-tokens.json` ga generatsiya (`npm run build:ds-tokens`): `@theme` dagi rang, matn, soya, gradient nomlari ikkala tema uchun yechilgan; ishlatish — `shared/ui/ds.tsx` |
| `src/modules/auth/model/use-auth.ts` | 🟢 NUSXA | `795c1de32280` | — |
| `src/modules/board/api/board.api.ts` | 🟢 NUSXA | `6252a44a0172` | — |
| `src/modules/board/api/board.dto.ts` | 🟢 NUSXA | `f274a33592fe` | — |
| `src/modules/board/api/board.endpoints.ts` | 🟢 NUSXA | `8d9435eab00a` | — |
| `src/modules/board/constants/board.constants.ts` | 🟢 NUSXA | `4918a47aeaa5` | — |
| `src/modules/board/index.ts` | 🟡 MOSLASH | `e6aa4ec0ea07` | generatsiya: veb barrel minus `ui/` + mobil doska UI eksportlari |
| `src/modules/board/lib/board-channel.ts` | 🟢 NUSXA | `561ddd1ea25e` | — |
| `src/modules/board/lib/board-flow.ts` | 🟢 NUSXA | `dbc83be61980` | — |
| `src/modules/board/lib/board-socket-manager.ts` | 🟢 NUSXA | `25cff85e44b5` | — |
| `src/modules/board/lib/board.geometry.ts` | 🟢 NUSXA | `cca6c3277bc2` | — |
| `src/modules/board/lib/board.mappers.ts` | 🟢 NUSXA | `06a6ec1aee0b` | — |
| `src/modules/board/lib/formula-palette.ts` | 🟢 NUSXA | `adae5f14b4f7` | — |
| `src/modules/board/lib/periodic-board.ts` | 🟢 NUSXA | `d56c7a889fd5` | — |
| `src/modules/board/lib/rich-text.ts` | 🟡 MOSLASH | `1723fd242bf7` | htmlToLines ko'chirilmadi (contenteditable + getComputedStyle); qolgan uchta sof funksiya bir xil |
| `src/modules/board/model/board.queries.ts` | 🟢 NUSXA | `51010e9e0d32` | — |
| `src/modules/board/model/use-board-channel.ts` | 🟢 NUSXA | `734d17e2d1f4` | — |
| `src/modules/board/model/use-board-realtime.ts` | 🟢 NUSXA | `85a15e35d539` | — |
| `src/modules/board/ui/away-students-notice.tsx` | 🟡 MOSLASH | `86e30eba5686` | farq qayd etilmagan — tekshiring |
| `src/modules/board/ui/bohr-model.tsx` | 🔴 QAYTA | `f70cf5b9dfcf` | veb three.js/WebGL bilan 3D chizadi; mobilda Skia bilan 2D — `expo-gl`+`expo-three` faqat shu oynacha uchun og'ir, tekis aylanada esa elektronlarni sanash osonroq |
| `src/modules/board/ui/board-stroke.tsx` | 🟡 MOSLASH | `8e850d9e1b06` | SVG o'rniga Skia tugunlari; shakl mantig'i (`strokeKindOf`, `arrowHeadPoints`) veb'dan; formatlangan matn `rich-text-stroke.tsx` ga ajratilgan |
| `src/modules/board/ui/board-font.ts` | 🆕 MOBIL | `—` | Skia shrift oilasi; vebda brauzer shriftni o'zi tanlaydi, Skia'da oila nomi aniq berilishi shart |
| `src/modules/board/ui/rich-text-stroke.tsx` | 🟡 MOSLASH | `8e850d9e1b06` | veb `board-stroke.tsx` dagi `lines` shoxi; Skia'da har run uchun `matchFont` va qo'lda joylashtirish, tagiga chizish qo'lda `Rect` bilan |
| `src/modules/board/ui/rich-text-sheet.tsx` | 🔴 QAYTA | `dfebccfb5ed6` | veb `rich-text-input.tsx` (contenteditable + execCommand) RN'da mumkin emas; format QATOR darajasida qo'yiladi va `TextLineDto` to'g'ridan-to'g'ri quriladi |
| `src/modules/board/ui/board-toolbar.tsx` | 🟡 MOSLASH | `d7353afa8564` | farq qayd etilmagan — tekshiring |
| `src/modules/board/ui/board-panel.tsx` | 🟡 MOSLASH | `ff2c8e5a2260` | mobilda `board-surface.tsx` (Skia); ruxsat oynasi `board-dialogs.tsx` dagi `BoardPermissionSheet` |
| `src/modules/board/ui/board-permission-dialog.tsx` | 🟡 MOSLASH | `44c76ae71974` | mobilda `board-dialogs.tsx` dagi `BoardPermissionSheet` (AppDialog -> Sheet) |
| `src/modules/board/ui/formula-palette.tsx` | 🟡 MOSLASH | `c3db89716ff5` | MathLive placeholder'lari (#0, #?) olib tashlanadi — mobilda LaTeX oddiy TextInput da yoziladi |
| `src/modules/board/ui/periodic-table-sheet.tsx` | 🟡 MOSLASH | `f354893b6a1a` | manba: veb `periodic-table-dialog.tsx`; veb 18 ustunli panjara, mobilda qidiruvli ro'yxat — telefonda panjara o'qilmaydi |
| `src/modules/conversation/api/conversation.api.ts` | 🟢 NUSXA | `4ee5ffcb78a3` | — |
| `src/modules/conversation/api/conversation.dto.ts` | 🟢 NUSXA | `6b7d656e17ed` | — |
| `src/modules/conversation/api/conversation.endpoints.ts` | 🟢 NUSXA | `0620e472cd90` | — |
| `src/modules/conversation/constants/direct-status.ts` | 🟢 NUSXA | `32913399a614` | — |
| `src/modules/conversation/index.ts` | 🟡 MOSLASH | `35d8fcb9007a` | generatsiya: veb barrel minus `ui/` eksportlari (port-barrels.mjs) |
| `src/modules/conversation/lib/conversation.mappers.ts` | 🟢 NUSXA | `a78ab1c556d8` | — |
| `src/modules/conversation/model/conversation-filter.store.ts` | 🟢 NUSXA | `ea649aac1e44` | — |
| `src/modules/conversation/model/conversation.keys.ts` | 🟢 NUSXA | `8dedfc078009` | — |
| `src/modules/conversation/model/use-conversations.ts` | 🟢 NUSXA | `4ef27f08ee5f` | — |
| `src/modules/conversation/ui/chat-header.tsx` | 🟡 MOSLASH | `106599ec34ab` | farq qayd etilmagan — tekshiring |
| `src/modules/conversation/ui/conversation-item.tsx` | 🟡 MOSLASH | `e68e12cace5f` | farq qayd etilmagan — tekshiring |
| `src/modules/course/api/course.api.ts` | 🟢 NUSXA | `0e1b99f705ce` | — |
| `src/modules/course/api/course.dto.ts` | 🟢 NUSXA | `29b2e732fb51` | — |
| `src/modules/course/api/course.endpoints.ts` | 🟢 NUSXA | `3d24c89fb947` | — |
| `src/modules/course/index.ts` | 🟡 MOSLASH | `465f4702b653` | generatsiya: veb barrel minus `ui/` eksportlari (port-barrels.mjs) |
| `src/modules/course/lib/course.mappers.ts` | 🟢 NUSXA | `15c80478319c` | — |
| `src/modules/course/model/course.queries.ts` | 🟢 NUSXA | `6c347f3fc915` | — |
| `src/modules/course/ui/add-student-sheet.tsx` | 🟡 MOSLASH | `23417d755aae` | manba: veb `add-student-dialog.tsx`; dialog o'rniga pastdan ochiladigan oyna, qidiruv debounce'siz (ro'yxat kichik) |
| `src/modules/course/ui/add-student-dialog.tsx` | 🟡 MOSLASH | `99ce9ce1073e` | mobilda `add-student-sheet.tsx`; "Taklif havolasini ulashish" -> `invite-link-sheet.tsx` (ikki oyna ketma-ket, ustma-ust emas) |
| `src/modules/course/ui/invite-link-dialog.tsx` | 🟡 MOSLASH | `b696c00d20fd` | mobilda `invite-link-sheet.tsx` (AppDialog -> Sheet); nusxalash `expo-clipboard` |
| `src/modules/live/ui/lesson-invite-dialog.tsx` | 🟡 MOSLASH | `333fc4931091` | mobilda `lesson-invite-sheet.tsx`; onlayn nuqta va "Onlayn" holati vebdagidek |
| `src/pages/join/join-course-page.tsx` | 🟡 MOSLASH | `50b9d49bc41c` | marshrut `app/j/[code].tsx`. VEBDA bu sahifa `app-router` ga ULANMAGAN. "Guruhni ochish" chatlar ro'yxatiga olib boradi (mobilda kurs sahifasi yo'q, guruh chat ichida) |
| `src/modules/course/ui/course-members-section.tsx` | 🟡 MOSLASH | `67f8017c22aa` | veb bilan bir joyda — suhbat ma'lumoti oynasida; o'chirishni tasdiqlash `ConfirmSheet` bilan |
| `src/modules/homework/api/homework.api.ts` | 🟢 NUSXA | `cc437380f592` | — |
| `src/modules/homework/api/homework.dto.ts` | 🟢 NUSXA | `2d74c02d3309` | — |
| `src/modules/homework/api/homework.endpoints.ts` | 🟢 NUSXA | `08cb1a26f121` | — |
| `src/modules/homework/constants/homework.constants.ts` | 🟢 NUSXA | `fccf69310542` | — |
| `src/modules/homework/index.ts` | 🟡 MOSLASH | `19838ce8c6e1` | generatsiya: veb barrel minus `ui/` eksportlari (port-barrels.mjs) |
| `src/modules/homework/lib/homework-validation.ts` | 🟢 NUSXA | `c8327541f59b` | — |
| `src/modules/homework/lib/homework.mappers.ts` | 🟢 NUSXA | `bf4c650f7b9f` | — |
| `src/modules/homework/model/homework.queries.ts` | 🟢 NUSXA | `55e1d7957402` | — |
| `src/modules/homework/model/use-homework-board.ts` | 🟡 MOSLASH | `27575a8d3a24` | brauzerning `beforeunload` ogohlantirishi olib tashlandi; chiqishdagi oxirgi saqlash qoldi |
| `src/modules/homework/ui/homework-report-view.tsx` | 🟡 MOSLASH | `e63f770dcde0` | portal bloklari (`shared/ui/portal.tsx`) bilan; ko'rsatkichlar tor ekrandagidek bir ustun |
| `src/widgets/homework-workspace/assignment-form-dialog.tsx` | 🟡 MOSLASH | `59d4cea990ba` | mobilda `assignment-form-sheet.tsx` (AppDialog -> Sheet); `window.prompt` o'rniga havola oynasi |
| `src/widgets/homework-workspace/homework-workspace.tsx` | 🟡 MOSLASH | `36636e5f6ad1` | telefon ko'rinishi: ro'yxat yoki tanlangan vazifa (avtomatik tanlov yo'q); eslatma oynasi `Sheet` |
| `src/widgets/homework-workspace/submission-review.tsx` | 🟡 MOSLASH | `bd9efb95f694` | bitta ustun; qayta topshirish oynasi `Sheet` |
| `src/modules/lesson/api/lesson.api.ts` | 🟢 NUSXA | `b9f5ed47626a` | — |
| `src/modules/lesson/api/lesson.dto.ts` | 🟢 NUSXA | `142ad1ebc15a` | — |
| `src/modules/lesson/api/lesson.endpoints.ts` | 🟢 NUSXA | `8496314cadf7` | — |
| `src/modules/lesson/index.ts` | 🟡 MOSLASH | `320e656d380f` | generatsiya: veb barrel minus `ui/`; WEEKDAY_LABELS mobil UI fayliga ko'chdi |
| `src/modules/lesson/lib/lesson-calendar.ts` | 🟢 NUSXA | `76769eb5a69d` | — |
| `src/modules/lesson/lib/lesson-schedule.ts` | 🟢 NUSXA | `2a3c243d16ae` | — |
| `src/modules/lesson/lib/lesson-status.ts` | 🟢 NUSXA | `43afd26367df` | — |
| `src/modules/lesson/lib/lesson.mappers.ts` | 🟢 NUSXA | `531bc5cda2f0` | — |
| `src/modules/lesson/model/lesson-view.store.ts` | 🟢 NUSXA | `31172199c0d6` | — |
| `src/modules/lesson/model/lesson.queries.ts` | 🟡 MOSLASH | `d1a900847609` | useFinishLesson: mijoz tomon MediaRecorder flush olib tashlandi (Egress server tomonda) |
| `src/modules/lesson/model/schedule.store.ts` | 🟢 NUSXA | `—` | jadval ko'rinishi, tayanch sana va qadam (2026-10-20 qo'shildi) |
| `src/modules/lesson/ui/lesson-calendar.tsx` | 🟡 MOSLASH | `b2d68d725254` | farq qayd etilmagan — tekshiring |
| `src/modules/lesson/ui/live-lesson-bar.tsx` | 🟡 MOSLASH | `520a875a379e` | farq qayd etilmagan — tekshiring |
| `src/modules/lesson/ui/schedule-grid.tsx` | 🟡 MOSLASH | `—` | faqat tor ekran shoxlari (Ro'yxat/Kun/Hafta/Oy); keng ekran to'rlari ko'chirilmadi |
| `src/modules/lesson/ui/schedule-sidebar.tsx` | 🟡 MOSLASH | `—` | faqat telefon bloklari: hafta tasmasi va eng yaqin dars |
| `src/modules/lesson/ui/lesson-detail-dialog.tsx` | 🟡 MOSLASH | `fe03b39eee02` | mobilda `lesson-detail-sheet.tsx` (AppDialog -> Sheet); bekor qilish tasdig'ida seriya tanlovi `ConfirmSheet` ichida |
| `src/modules/lesson/ui/lesson-create-dialog.tsx` | 🟡 MOSLASH | `e1ad0ea3713b` | mobilda `lesson-create-sheet.tsx` (AppDialog -> Sheet) |
| `src/modules/lesson/ui/star-rating.tsx` | 🟡 MOSLASH | `48d221a7c01f` | farq qayd etilmagan — tekshiring |
| `src/modules/live/api/live.api.ts` | 🟢 NUSXA | `ccb7d986e5bd` | — |
| `src/modules/live/api/live.dto.ts` | 🟢 NUSXA | `2f9a569c29d6` | — |
| `src/modules/live/api/live.endpoints.ts` | 🟢 NUSXA | `c8b6c340c1d3` | — |
| `src/modules/live/index.ts` | 🟡 MOSLASH | `536e4282d359` | generatsiya: veb barrel minus `ui/` eksportlari (port-barrels.mjs) |
| `src/modules/live/lib/live-permissions.ts` | 🟢 NUSXA | `9898296e9030` | — |
| `src/modules/live/lib/live-token.ts` | 🟢 NUSXA | `1296d9f81423` | — |
| `src/modules/live/lib/live.mappers.ts` | 🟢 NUSXA | `2de41c074a84` | — |
| `src/modules/live/lib/screen-share-signal.ts` | 🟢 NUSXA | `b5c1de5417ea` | — |
| `src/modules/live/lib/use-focus-tracker.ts` | 🔴 QAYTA | `26ddec20b17b` | visibilitychange/blur -> AppState; iOS `inactive` filtrlanadi |
| `src/modules/live/model/live.queries.ts` | 🟢 NUSXA | `0964fdedbe41` | — |
| `src/modules/live/model/use-camera-signals.ts` | 🟢 NUSXA | `3ecbc3d73d24` | — |
| `src/modules/live/model/use-mic-signals.ts` | 🟢 NUSXA | `03d1fd38c519` | — |
| `src/modules/message/api/message.api.ts` | 🟢 NUSXA | `7b3783375bd9` | — |
| `src/modules/message/api/message.dto.ts` | 🟢 NUSXA | `56135a06aec4` | — |
| `src/modules/message/api/message.endpoints.ts` | 🟢 NUSXA | `a059ec7ac8e3` | — |
| `src/modules/message/index.ts` | 🟡 MOSLASH | `a1065d5cb63f` | generatsiya: veb barrel minus `ui/` eksportlari (port-barrels.mjs) |
| `src/modules/message/lib/chat-socket-manager.ts` | 🟢 NUSXA | `db09bb03f1a0` | — |
| `src/modules/message/lib/linkify.ts` | 🟢 NUSXA | `5a21a96293c4` | — |
| `src/modules/message/lib/message.mappers.ts` | 🟢 NUSXA | `2c43593d1edf` | — |
| `src/modules/message/model/message.keys.ts` | 🟢 NUSXA | `fadd16224f37` | — |
| `src/modules/message/model/chat-ui.store.ts` | 🟢 NUSXA | `—` | xabar qidiruvi va tanlash holati (2026-10-20 qo'shildi) |
| `src/modules/message/model/use-chat.ts` | 🟡 MOSLASH | `809460742acb` | react-router useNavigate -> expo-router (2026-10-20 vebdan qayta sinxronlandi; literal matn moslashtirishi olib tashlandi — chat.json da `removedFromGroup` endi bor) |
| `src/modules/message/ui/message-attachment.tsx` | 🟡 MOSLASH | `e5c7e28f553a` | farq qayd etilmagan — tekshiring |
| `src/modules/message/ui/message-bubble.tsx` | 🟡 MOSLASH | `2cefe5cc619f` | farq qayd etilmagan — tekshiring |
| `src/modules/message/ui/message-composer.tsx` | 🟡 MOSLASH | `2d0725ac8b8a` | farq qayd etilmagan — tekshiring |
| `src/modules/message/ui/message-list.tsx` | 🟡 MOSLASH | `06013405aa64` | farq qayd etilmagan — tekshiring |
| `src/modules/message/ui/message-text.tsx` | 🟡 MOSLASH | `61a4de2c8e42` | farq qayd etilmagan — tekshiring |
| `src/modules/notification/api/notification.api.ts` | 🟢 NUSXA | `554c9d1ed288` | — |
| `src/modules/notification/api/notification.dto.ts` | 🟢 NUSXA | `9642b2602dea` | — |
| `src/modules/notification/api/notification.endpoints.ts` | 🟢 NUSXA | `2f9b58ec017a` | — |
| `src/modules/notification/index.ts` | 🟡 MOSLASH | `58e783043abe` | generatsiya: veb barrel minus `ui/` eksportlari (port-barrels.mjs) |
| `src/modules/notification/lib/notification-socket-manager.ts` | 🟢 NUSXA | `c8aa876d78e0` | — |
| `src/modules/notification/lib/notification.mappers.ts` | 🟢 NUSXA | `3cc34475f362` | — |
| `src/modules/notification/model/notification.queries.ts` | 🟢 NUSXA | `64e64268858d` | — |
| `src/modules/notification/model/use-notification-feed.ts` | 🟢 NUSXA | `483e9d4f8fa1` | — |
| `src/modules/notification/ui/sent-notifications-panel.tsx` | 🟡 MOSLASH | `64ca48119aee` | kartada (vebda `.portal-panel` uslubsiz); xabar ko'rinishi WebView emas, 2 qatorli matn |
| `src/modules/notification/api/push-device.api.ts` | 🆕 MOBIL | `—` | FCM qurilma tokeni; vebda Web Push obunasi (`push/subscribe/`) ishlatiladi |
| `src/modules/notification/lib/device-id.ts` | 🆕 MOBIL | `—` | barqaror qurilma ID'si; backend kaliti `(user, device_id)`, token o'zgaruvchan |
| `src/modules/notification/model/push-device.ts` | 🆕 MOBIL | `—` | chiqishda qurilmani ro'yxatdan chiqarish |
| `src/modules/parent/api/parent.api.ts` | 🟡 MOSLASH | `c944f05ed9d5` | `FK-` bilan boshlangan qiymat `invite_code`, qolgani `username` sifatida yuboriladi (veb hammasini `invite_code` deb yuboradi) |
| `src/modules/parent/api/parent.dto.ts` | 🟢 NUSXA | `25da4ec6dbda` | — |
| `src/modules/parent/index.ts` | 🟡 MOSLASH | `f7f9585ba037` | generatsiya: veb barrel minus `ui/` eksportlari (port-barrels.mjs) |
| `src/modules/parent/lib/parent.mappers.ts` | 🟢 NUSXA | `bbf6f561d148` | — |
| `src/modules/parent/model/parent.queries.ts` | 🟢 NUSXA | `b4bec42438a7` | — |
| `src/modules/parent/model/selected-child.store.ts` | 🟢 NUSXA | `75e6235a5ff2` | — |
| `src/modules/parent/ui/selected-child-selector.tsx` | 🟡 MOSLASH | `32189c228848` | mobilda `parent-app-bar.tsx` ichida; `<select>` o'rniga pastdan chiqadigan ro'yxat |
| `src/modules/permission/constants/permission-map.ts` | 🟢 NUSXA | `9f90d5d3661c` | — |
| `src/modules/permission/index.ts` | 🟡 MOSLASH | `5b5ffd8d4e1d` | generatsiya: veb barrel minus `ui/` eksportlari (port-barrels.mjs) |
| `src/modules/permission/lib/can.ts` | 🟢 NUSXA | `3ab23734d2c0` | — |
| `src/modules/permission/lib/has-role.ts` | 🟢 NUSXA | `b30d0d1d76c6` | — |
| `src/modules/permission/ui/permission-guard.tsx` | 🟡 MOSLASH | `4c2702ba4a5d` | farq qayd etilmagan — tekshiring |
| `src/modules/quiz/api/quiz.api.ts` | 🟢 NUSXA | `ac58af811194` | — |
| `src/modules/quiz/api/quiz.dto.ts` | 🟢 NUSXA | `a140eab6fc9c` | — |
| `src/modules/quiz/api/quiz.endpoints.ts` | 🟢 NUSXA | `525d209a6fec` | — |
| `src/modules/quiz/index.ts` | 🟡 MOSLASH | `b142e60af271` | generatsiya: veb barrel minus `ui/` eksportlari (port-barrels.mjs) |
| `src/modules/quiz/lib/google-import.ts` | 🟢 NUSXA | `d89ca84726fc` | — |
| `src/modules/quiz/lib/answer-value.ts` | 🟢 NUSXA | `724d9951d2f2` | — |
| `src/modules/quiz/lib/question-draft.ts` | 🟢 NUSXA | `c91791787e92` | — |
| `src/modules/quiz/lib/quiz-errors.ts` | 🟢 NUSXA | `da4cf7939388` | — |
| `src/modules/quiz/lib/quiz.mappers.ts` | 🟢 NUSXA | `65a4cb127d82` | — |
| `src/modules/quiz/model/quiz.queries.ts` | 🟢 NUSXA | `1e7da8956064` | — |
| `src/modules/quiz/ui/question-answer-input.tsx` | 🟡 MOSLASH | `—` | veb uslublari (legacy.css) bilan qayta yozildi; `<select>` -> ro'yxatli oyna, bo'sh joylar so'zlar oqimida; `$...$` formulalar oddiy matn (MathLive yo'q); `Choice` eksport qilingan |
| `src/modules/quiz/ui/question-editor.tsx` | 🟡 MOSLASH | `—` | veb o'lchamlari bilan qayta yozildi; formula oynasida MathLive/palitra yo'q — LaTeX matn sifatida kursor joyiga `$...$` bo'lib qo'yiladi |
| `src/modules/quiz/ui/question-group-editor.tsx` | 🟡 MOSLASH | `—` | `<audio>` -> expo-audio; `<details>` -> ochib-yopiladigan blok |
| `src/modules/quiz/ui/quiz-create-dialog.tsx` | 🟡 MOSLASH | `—` | ikki bosqich vebdagidek (Sheet + to'liq ekranli Modal); nom taklifi (existingQuizzes) yo'q; telefondagi "Qoralama saqlash" haqiqatan qoralama sifatida saqlaydi |
| `src/modules/quiz/ui/quiz-preview.tsx` | 🟡 MOSLASH | `—` | veb o'lchamlari |
| `src/modules/quiz/ui/subject-filter-sheet.tsx` | 🟡 MOSLASH | `—` | Drawer -> Sheet |
| `src/modules/quiz/ui/assign-quiz-dialog.tsx` | 🟡 MOSLASH | `—` | mobilda `assign-quiz-sheet.tsx` (Dialog -> Sheet) |
| `src/modules/quiz/ui/quiz-export-dialog.tsx` | 🟡 MOSLASH | `—` | mobilda `quiz-export-sheet.tsx`; faqat telefon varianti (3 qator, o'qituvchi nusxasi) |
| `src/modules/quiz/ui/quiz-attempts-dialog.tsx` | 🟡 MOSLASH | `—` | mobilda `quiz-attempts-sheet.tsx`; yuklab olish `downloadBlob` (ulashish oynasi) orqali |
| `src/pages/teacher/quizzes/teacher-quizzes-page.tsx` | 🟡 MOSLASH | `—` | mobilda `pages/quizzes/teacher-quizzes-page.tsx`; karta bosilganda tahrirlash oynasi ochiladi (savollardan boshlash hali yo'q) |
| `src/modules/student/api/student.api.ts` | 🟢 NUSXA | `8e54d2259086` | vebda o'chirilgan (2026-10 qayta dizayn); eski o'quvchi ekranlari uchun qoldi — 6-bosqichda olib tashlanadi |
| `src/modules/student/api/student.dto.ts` | 🟢 NUSXA | `f0d3020fd053` | vebda o'chirilgan (2026-10 qayta dizayn); eski o'quvchi ekranlari uchun qoldi — 6-bosqichda olib tashlanadi |
| `src/modules/student/index.ts` | 🟡 MOSLASH | `b64689876640` | vebda domen eksportlari o'chirilgan (faqat UI qoldi); mobilda eski o'quvchi ekranlari uchun qoldi — 6-bosqichda tozalanadi |
| `src/modules/student/model/student.queries.ts` | 🟢 NUSXA | `e507a2f33021` | vebda o'chirilgan (2026-10 qayta dizayn); eski o'quvchi ekranlari uchun qoldi — 6-bosqichda olib tashlanadi |
| `src/modules/voice/api/voice.api.ts` | 🟢 NUSXA | `c779868ae383` | — |
| `src/modules/voice/api/voice.dto.ts` | 🟢 NUSXA | `d68f135cf46e` | — |
| `src/modules/voice/api/voice.endpoints.ts` | 🟢 NUSXA | `21c1eee7370f` | — |
| `src/modules/voice/index.ts` | 🟡 MOSLASH | `a6ac0727b617` | generatsiya: veb barrel minus `ui/` + mobil UI eksportlari |
| `src/modules/voice/lib/voice.mappers.ts` | 🟢 NUSXA | `63111b04bb08` | — |
| `src/modules/voice/model/voice.queries.ts` | 🟢 NUSXA | `34c755e07c59` | — |
| `src/modules/voice/ui/voice-room-bar.tsx` | 🟡 MOSLASH | `46d2b5212234` | mobil qobiq: xona ochish oynasi shu faylda (veb'da alohida dialog) |
| `src/modules/voice/ui/voice-room-sheet.tsx` | 🟡 MOSLASH | `76f4b2d71876` | manba: veb `voice-room-dialog.tsx`; video plitkalari o'rniga ro'yxat, LiveKitRoom video={false} |
| `src/pages/admin/admin-dashboard-page.tsx` | 🟡 MOSLASH | `584486d026fd` | jadvallar ustunlab chiziladi va gorizontal aylanadi (`admin-table.tsx`) |
| `src/pages/admin/system-panels.tsx` | 🟡 MOSLASH | `1f10ae6fae56` | server holatida davr tugmalari sarlavha ostida (vebda tor ekranda ustun bo'lib izohni siqadi) |
| `src/pages/admin/teachers/admin-teachers-page.tsx` | 🟡 MOSLASH | `73fbd40d4d08` | mobilda `pages/admin/admin-teachers-page.tsx`; ko'rinish tanlagichi sarlavha ostida; `?teacher=` qatorga aylantiradi va belgilaydi |
| `src/pages/admin/teachers/teacher-stats-dialog.tsx` | 🟡 MOSLASH | `b15753cd64fc` | mobilda `pages/admin/teacher-stats-sheet.tsx` (Dialog o'rniga Sheet) |
| `src/widgets/group-workspace/group-action-dialogs.tsx` | 🟡 MOSLASH | `528e45ee1d4f` | mobilda ikki fayl: `add-lesson-dialog.tsx` (butun ekran, saqlash shu yerda) va `add-assignment-sheet.tsx`; vazifa matnidagi formatlash qatori YO'Q — vebda tugmalar `onClick` siz |
| `src/shared/ui/app-dialog.tsx` | 🟡 MOSLASH | `c4982b8cfc42` | faqat `fullscreen` varianti — mobilda `fullscreen-dialog.tsx`; `sheet` o'rniga `Sheet` |
| `src/modules/board/ui/formula-solver-dialog.tsx` | 🟡 MOSLASH | `c94dcadd37cd` | mobilda `formula-solver-sheet.tsx` (AppDialog sheet o'rniga Sheet); joylash vebdagidek `nextTextPoint` bilan |
| `src/pages/teacher/exams/teacher-exams-page.tsx` | 🟡 MOSLASH | `aaec2fc43c46` | mobilda `pages/exams/teacher-exams-page.tsx`; telefon ko'rinishi (ro'yxat yoki tanlangan imtihon) |
| `src/pages/analytics/analytics-page.tsx` | 🟡 MOSLASH | `092cef5c60fa` | o'qituvchi jadvali (olti ustun) kartochkalarga aylandi — telefonda jadval o'qilmaydi |
| `src/pages/auth/login-page.tsx` | 🟡 MOSLASH | `9c9510af0702` | manba: veb `mobile-login-form.tsx` (tor ekran varianti); oflayn ogohlantirish NetInfo orqali |
| `src/pages/auth/register-page.tsx` | 🟡 MOSLASH | `cbcaa1d3644e` | manba: veb `mobile-register-form.tsx`; "tayyor" ekrani haqiqatan ko'rsatiladi (vebda `PublicRoute` uni darhol yo'naltirib yuboradi) |
| `src/modules/auth/ui/auth-screen.tsx` | 🟡 MOSLASH | `f6df598d6f72` | `AuthScreen` + maydon/tugma komponentlari bitta faylda; telefon maslahati toast orqali |
| `src/modules/auth/ui/otp-input.tsx` | 🟡 MOSLASH | `3f62db0fe17c` | har katak alohida `TextInput`; SMS avtoto'ldirish `oneTimeCode`/`sms-otp` |
| `src/modules/auth/ui/two-factor-form.tsx` | 🟡 MOSLASH | `f5e1e3feede6` | faqat `MobileTwoFactorForm` (veb tor ekranda shuni ko'rsatadi); `TwoFactorForm` (keng ekran) yo'q |
| `src/pages/profile/account-settings-page.tsx` | 🟡 MOSLASH | `c869627db2a3` | `AppDialog` -> `Sheet`; 2FA yoqish/kod/o'chirish oynalari vebdagidek |
| `src/widgets/account-menu/notification-settings.tsx` | 🟡 MOSLASH | `01088df91bda` | mobilda `pages/profile/system-settings-page.tsx` ichida; Web Push qatori yo'q (qurilma tokeni kirishda o'zi yoziladi) |
| `src/modules/auth/ui/login-history-dialog.tsx` | 🟡 MOSLASH | `8127cad1ced2` | mobilda `login-history-sheet.tsx` (Dialog o'rniga Sheet) |
| `src/pages/auth/welcome-page.tsx` | 🟡 MOSLASH | `b50a11868d3a` | til menyusi oddiy ochiluvchi ro'yxat |
| `src/pages/auth/forgot-password-page.tsx` | 🟡 MOSLASH | `ab117d8b766a` | mobilda `password-reset-pages.tsx` ichida |
| `src/pages/auth/verify-code-page.tsx` | 🟡 MOSLASH | `4fb19ea2d2db` | mobilda `password-reset-pages.tsx` ichida |
| `src/pages/auth/new-password-page.tsx` | 🟡 MOSLASH | `76130023cdc7` | mobilda `password-reset-pages.tsx` ichida |
| `src/pages/parent/dashboard/parent-dashboard-page.tsx` | 🟡 MOSLASH | `aad62c96ad28` | mobilda `pages/parent/parent-dashboard-page.tsx`; sarlavha `ParentAppBar`, pastki tablar saqlangan |
| `src/pages/parent/children/parent-children-page.tsx` | 🟡 MOSLASH | `fc3d24f1cb61` | mobilda `pages/parent/parent-children-page.tsx`; ruxsatlar sarlavhasi va "Kirishlar tarixi" ustma-ust (vebda tor ekranda sinadi) |
| `src/pages/parent/attendance/parent-attendance-page.tsx` | 🟡 MOSLASH | `36689affc99d` | mobilda `pages/parent/parent-attendance-page.tsx`; "Hisobot" (window.print) yo'q; jadval o'rniga `AttendanceList` |
| `src/pages/parent/homework/parent-homework-page.tsx` | 🟡 MOSLASH | `2851d3486787` | mobilda `pages/parent/parent-homework-page.tsx`; karta ichida 16 gorizontal bo'shliq (vebda qatorlar chetga yopishadi) |
| `src/pages/parent/exams/parent-exams-page.tsx` | 🟡 MOSLASH | `6211f82e3125` | mobilda `pages/parent/parent-exams-page.tsx`; "Natija" tugmasi pastki qatorda (vebda sarlavhani siqadi) |
| `src/pages/parent/report/parent-report-page.tsx` | 🟡 MOSLASH | `3a6146c6e277` | mobilda `pages/parent/parent-grades-page.tsx` |
| `src/pages/board/board-page.tsx` | 🟡 MOSLASH | `9b73053549dd` | PDF yuklab olish `downloadBlob` (ulashish oynasi); chatga yuborish server endpointi orqali |
| `src/pages/workspace/workspace-page.tsx` | 🟡 MOSLASH | `1310f75223c3` | vebda kartochkalar to'rda; telefonda bir ustunli ro'yxat — tor ekranda ikki ustunli matn sinib ketadi |
| `src/pages/live/live-lesson-page.tsx` | 🟡 MOSLASH | `b0b1a939b1a1` | farq qayd etilmagan — tekshiring |
| `src/pages/recording/recording-page.tsx` | 🟡 MOSLASH | `224fb405dfbe` | `expo-video` pleeri; pleer QO'LDA to'xtatilmaydi — `useVideoPlayer` uni o'zi bo'shatadi |
| `src/modules/lesson/ui/lesson-recording-player.tsx` | 🟡 MOSLASH | `42684a8f0678` | mobilda `pages/recording/recording-page.tsx` ichida (pleer, statistika chiplari, meta) |
| `src/pages/schedule/schedule-page.tsx` | 🟡 MOSLASH | `c05e6da877ab` | farq qayd etilmagan — tekshiring |
| `src/shared/api/api-client.ts` | 🟡 MOSLASH | `7d61f7ccadf0` | navigator.onLine -> NetInfo |
| `src/shared/api/api-config.ts` | 🟢 NUSXA | `0e6a5d2a4cc7` | — |
| `src/shared/api/api-error.ts` | 🟢 NUSXA | `7d4c958b715c` | — |
| `src/shared/api/api-response.ts` | 🟢 NUSXA | `d0edd5c3cf73` | — |
| `src/shared/api/apply-api-field-errors.ts` | 🟢 NUSXA | `1225a6e9c6b2` | — |
| `src/shared/api/index.ts` | 🟡 MOSLASH | `7378d50009ec` | barrel — veb bilan bir xil ro'yxat |
| `src/shared/api/media-url.ts` | 🟡 MOSLASH | `c3a91c2f41af` | location.origin -> env.apiUrl (mobilda proxy yo'q) |
| `src/shared/api/pagination.ts` | 🟢 NUSXA | `ff2532083aa9` | — |
| `src/shared/api/realtime-socket.ts` | 🔴 QAYTA | `d64ba10c0dea` | AppState + NetInfo; fon rejimida uziladi, qaytganda onResync |
| `src/shared/api/refresh-token-manager.ts` | 🔴 QAYTA | `d7216dbab64d` | CustomEvent o'rniga obuna ro'yxati; announceSessionChange va refresh poyga tuzatishi olindi |
| `src/shared/api/request-interceptor.ts` | 🟡 MOSLASH | `f99b14fa30f2` | + `X-Device-Name` sarlavhasi (seanslarda qurilma nomi; vebda brauzer o'zi aniqlanadi) |
| `src/shared/api/response-interceptor.ts` | 🟢 NUSXA | `283cbb28d435` | — |
| `src/shared/api/token-storage.ts` | 🔴 QAYTA | `47a479a247f8` | SecureStore + xotira keshi; interfeys va sinxronligi bir xil; `readUser/writeUser` hali yo'q — 7-bosqich |
| `src/shared/config/env.ts` | 🔴 QAYTA | `ff591f4dcda1` | import.meta.env -> expo-constants; o'sha zod sxemasi |
| `src/shared/config/index.ts` | 🟢 NUSXA | `2a1ff6fd4d60` | — |
| `src/shared/config/routes.ts` | 🟢 NUSXA | `998939695656` | — |
| `src/shared/constants/index.ts` | 🟢 NUSXA | `c06257bbb1f3` | — |
| `src/shared/constants/roles.ts` | 🟢 NUSXA | `2f90f03f91dc` | — |
| `src/shared/constants/storage-keys.ts` | 🟢 NUSXA | `51ef121d70fd` | — |
| `src/shared/i18n/i18n.ts` | 🟡 MOSLASH | `d2d2d9a67a3a` | `import.meta.glob` (Vite) o'rniga qo'lda import; `mobile` bo'limi qo'shilgan; suspense o'chirilgan |
| `src/shared/i18n/intl-locale.ts` | 🟢 NUSXA | `b3f6b40c5b6f` | — |
| `src/shared/i18n/locales/**` | 🟢 NUSXA | `—` | 18 bo'lim × 3 til, vebdan bayt-bayt; `mobile.json` mobilga xos |
| `src/shared/model/language.store.ts` | 🔴 QAYTA | `0f01a0cbc3c6` | zustand `persist` (localStorage) o'rniga MMKV; qurilma tili `Intl` dan |
| `src/shared/model/text-size.store.ts` | 🔴 QAYTA | `f61042795fd4` | `persist` o'rniga MMKV; `--text-scale` o'rniga `Text` komponenti ko'paytiruvchisi (`text-scale.tsx`) |
| `src/shared/lib/app-state.ts` | 🆕 MOBIL | `—` | Mobilga xos, veb'da yo'q |
| `src/shared/lib/date.ts` | 🟢 NUSXA | `89c75c616d39` | — |
| `src/shared/lib/download.ts` | 🔴 QAYTA | `af194a763a11` | <a download> -> expo-file-system + Share; ASYNC bo'ldi |
| `src/shared/lib/file-kind.ts` | 🟢 NUSXA | `6d217a6b4891` | — |
| `src/shared/lib/index.ts` | 🟡 MOSLASH | `798c80d346e3` | barrel + app-state/network eksportlari; `pdf` (pdfjs) eksporti yo'q — vebdagi PDF ko'ruvchi brauzerga xos |
| `src/shared/lib/network.ts` | 🆕 MOBIL | `—` | Mobilga xos, veb'da yo'q |
| `src/shared/lib/sanitize-html.ts` | 🔴 QAYTA | `0fffa4bdbf6c` | DOMPurify -> regex; WebView CSP bilan birga |
| `src/shared/lib/storage.ts` | 🔴 QAYTA | `a49745b6789d` | localStorage -> MMKV; interfeys bir xil |
| `src/shared/lib/utils.ts` | 🟢 NUSXA | `4dd93deacc31` | — |
| `src/shared/types/auth.ts` | 🟢 NUSXA | `1868a164d8f0` | — |
| `src/shared/types/chat.ts` | 🟢 NUSXA | `69dedcbdcc16` | — |
| `src/shared/types/domain.ts` | 🟢 NUSXA | `6cf9d4b7e50f` | — |
| `src/shared/types/dto.ts` | 🟢 NUSXA | `626467937625` | — |
| `src/shared/types/index.ts` | 🟢 NUSXA | `59a10d955379` | — |
| `src/shared/ui/avatar.tsx` | 🟡 MOSLASH | `8f4429737fdb` | farq qayd etilmagan — tekshiring |
| `src/shared/ui/badge.tsx` | 🟡 MOSLASH | `f0c6b9cbc966` | farq qayd etilmagan — tekshiring |
| `src/shared/ui/button.tsx` | 🟡 MOSLASH | `693a56cdfe79` | farq qayd etilmagan — tekshiring |
| `src/shared/ui/card.tsx` | 🟡 MOSLASH | `5cd43302e888` | farq qayd etilmagan — tekshiring |
| `src/shared/ui/checkbox.tsx` | 🟡 MOSLASH | `073b5898e69d` | farq qayd etilmagan — tekshiring |
| `src/shared/ui/input.tsx` | 🟡 MOSLASH | `52da1927077d` | farq qayd etilmagan — tekshiring |
| `src/shared/ui/palette.json` | 🆕 MOBIL | `—` | Mobilga xos, veb'da yo'q |
| `src/shared/ui/logo-svg.ts` | 🆕 MOBIL | `—` | avtomatik yaratiladi: `assets/y-logo.svg` -> `npm run build:icons` |
| `src/shared/ui/sheet.tsx` | 🟡 MOSLASH | `ef338bb871e5` | veb `Dialog` o'rni; sudrab yopish va klaviatura ishlovi qo'lda, sudrash ro'yxat bilan bir vaqtda tanilishi shart |
| `src/shared/ui/toast.tsx` | 🆕 MOBIL | `—` | Mobilga xos, veb'da yo'q |
| `src/shared/ui/tokens.ts` | 🆕 MOBIL | `—` | Mobilga xos, veb'da yo'q |
| `src/widgets/group-workspace/group-workspace.tsx` | 🟡 MOSLASH | `17d7db1ac265` | tablar veb bilan teng: suhbat, darslar, vazifalar, davomat. O'quvchilar tab EMAS — ma'lumot oynasida (`CourseMembersSection`) |
| `src/widgets/live-room/live-room.tsx` | 🟡 MOSLASH | `bdb7697a4424` | yolg'iz ishtirokchi oynasi butun maydonni egallaydi (vebda setka doim); tizim panellari uchun safe-area |

## Ataylab ko'chirilmagan

| Veb fayl | Sabab |
|---|---|
| `src/modules/lesson/lib/teacher-audio-recording.ts` | Mijoz tomon yozuvi — Egress server tomonda (§7.3) |
| `src/modules/lesson/lib/teacher-video-recording.ts` | Mijoz tomon yozuvi — Egress server tomonda (§7.3) |
| `src/modules/lesson/model/use-teacher-audio-recording.ts` | Yuqoridagining hook'i |
| `src/modules/lesson/model/use-teacher-video-recording.ts` | Yuqoridagining hook'i |
| `src/modules/board/lib/mathlive-loader.ts` | Web Component loader — Faza 5 da WebView bilan |
| `src/modules/board/model/use-board-drawing.ts` | DOM pointer events — Faza 5 da Skia + gesture-handler |
| `src/modules/live/model/use-camera-signals.ts` | @livekit/components-react ga bog'liq — Faza 4 |
| `src/modules/live/model/use-mic-signals.ts` | @livekit/components-react ga bog'liq — Faza 4 |
| `src/shared/ui/** (80+ fayl)` | shadcn/Radix — mobil dizayn tizimi alohida (§8.2) |
| `src/modules/*/ui/**` | UI ko'chirilmaydi (§5) |
| `src/pages/**, src/widgets/**, src/app/**` | UI qatlami — mobil uchun qayta yoziladi |

## Qoidalar

1. **Veb — yagona haqiqat manbai.** Backend DTO o'zgarsa avval veb yangilanadi,
   keyin mobil. Hech qachon teskarisi.
2. **🟢 NUSXA fayl tahrirlanmaydi.** Tahrirlansa toifasi 🟡 ga o'zgaradi va
   farq shu jadvalga yoziladi.
3. **Har sprint boshida `npm run check-sync`** — 5 daqiqalik ish, drift'ni
   erta ushlaydi.
4. **Yangi ko'chirma — yangi qator.** `npm run build:ported` jadvalni qayta
   yasaydi; yangi moslashtirishlar `scripts/build-ported.mjs` dagi
   `ADAPTED` ro'yxatiga qo'shiladi.
