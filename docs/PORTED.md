# Port manifesti

> **Bu fayl majburiy.** Veb loyihadan ko'chirilgan har bir fayl shu yerda
> qayd etiladi. Ro'yxatga kirmagan ko'chirma — PR'da blocker
> (`docs/MOBILE_PLAN.md` §18.4).

- **Manba:** `Edu_Front` — port bosqichma-bosqich ketgan, har faylning hash'i
  o'zi ko'chirilgan paytdagi veb holatini bildiradi. 2026-10-29 holatiga ko'ra
  barcha qatorlar veb `e3fa321` (qayta dizayn, #151–#158) bilan sinxron.
- **Oxirgi yangilanish:** 2026-10-29 (veb `e3fa321` — qayta dizaynning 7-bosqichi: #157/#158 va qolgan drift)
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

- 🟢 NUSXA: **151**
- 🟡/🔴 moslashtirilgan: **273**
- 🆕 mobilga xos: **13**
- Jami: **437**

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
| `src/modules/auth/model/auth.store.ts` | 🟡 MOSLASH | `92da0b77fa4a` | window hodisalari -> refreshTokenManager; tab obunasi yo'q; sessiya raqami olindi; til sinxroni vebdagidek. Profil keshi (`USER_SNAPSHOT`) — modul yuklanganda emas, `bootstrap()` ichida o'qiladi (tokenlar `hydrate()` dan keyin keladi); yangi sessiyada `beginSession` keshni tozalaydi |
| `src/modules/auth/model/use-role-routes.ts` | 🟢 NUSXA | `143916a2a7cf` | — |
| `src/modules/notification/lib/notification-display.ts` | 🟡 MOSLASH | `8c04d7209a80` | `notificationLines` — `DOMParser` o'rniga `htmlToPlainText` (RN'da DOM yo'q); qolgani bayt-bayt bir xil |
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
| `src/modules/board/ui/away-students-notice.tsx` | 🟡 MOSLASH | `c1402bd61e1f` | `useTeacherSignals` (vebdagidek); ko'rinish RN'da chizilgan (vebda `legacy.css` dagi `.away-students`) |
| `src/modules/board/ui/bohr-model.tsx` | 🔴 QAYTA | `f70cf5b9dfcf` | veb three.js/WebGL bilan 3D chizadi; mobilda Skia bilan 2D — `expo-gl`+`expo-three` faqat shu oynacha uchun og'ir, tekis aylanada esa elektronlarni sanash osonroq |
| `src/modules/board/ui/board-stroke.tsx` | 🟡 MOSLASH | `8e850d9e1b06` | SVG o'rniga Skia tugunlari; shakl mantig'i (`strokeKindOf`, `arrowHeadPoints`) veb'dan; formatlangan matn `rich-text-stroke.tsx` ga ajratilgan |
| `src/modules/board/ui/board-font.ts` | 🆕 MOBIL | `—` | Skia shrift oilasi; vebda brauzer shriftni o'zi tanlaydi, Skia'da oila nomi aniq berilishi shart |
| `src/modules/board/ui/rich-text-stroke.tsx` | 🆕 MOBIL | `—` | veb `board-stroke.tsx` dagi `lines` shoxi; Skia'da har run uchun `matchFont` va qo'lda joylashtirish, tagiga chizish qo'lda `Rect` bilan |
| `src/modules/board/ui/rich-text-input.tsx` | 🔴 QAYTA | `006238ccc013` | faqat `variant="mobile"`; `contenteditable` + `execCommand` RN'da yo'q: format QATOR darajasida (qalin/kursiv/tagi chizilgan butun qatorga), ro'yxat belgisi matnning o'zida ("• ", "1. ") — Enter'da davom etadi, bo'sh bandda Enter ro'yxatdan chiqaradi; natija `TextLineDto[]`. Eski `rich-text-sheet.tsx` `ui/legacy/` da (o'quvchi uy vazifasi doskasi — vebda ham u `mobile` chrome'siz, eski sahifada) |
| `src/modules/board/ui/board-toolbar.tsx` | 🟡 MOSLASH | `953af4036363` | mobilda ishlatilmaydi (vebda faqat keng ekran paneli); `BoardTool` turi `board-mobile.tsx` da. Eski gorizontal panel `ui/legacy/board-toolbar.tsx` da (o'quvchi uy vazifasi doskasi — vebda ham eski sahifada) |
| `src/modules/board/ui/board-panel.tsx` | 🟡 MOSLASH | `fb520b49d978` | faqat tor ekran shoxi (`mobile` majburiy) — mobilda `board-surface.tsx`: Skia kanvas eni bo'yicha sig'adi (`fit="width"`), nuqtali fon Skia `Points`; matn kartasi kanvas tashqarisida (klaviatura ochilganda kanvas kichrayadi, karta kesilmaydi); klaviatura joyi faqat karta ochiqligida (`useReanimatedKeyboardAnimation`). Keng ekran shoxi yo'q — o'quvchining uy vazifasi doskasi `ui/legacy/board-surface.tsx` da (vebda ham bu sahifa `mobile` chrome'siz, eski uslubda) |
| `src/modules/board/ui/board-mobile.tsx` | 🟡 MOSLASH | `f4b6b964103d` | ikonkalar `lucide-react-native`; pastki qatorda sahifa almashtirgich va "+ Sahifa" ichki chetlari 2–4px kichikroq — RN shrifti kengroq, aks holda tugma ekran chetiga tegadi; `BoardTool` turi shu yerda |
| `src/modules/board/ui/board-pages-sheet.tsx` | 🟡 MOSLASH | `02563fb2ecab` | faqat tor ekran varianti (`Sheet variant="app" compact`); eskizlar Skia'da (`xMidYMin slice`); nomni o'zgartirish `onEndEditing` da |
| `src/modules/board/ui/board-preview.tsx` | 🟡 MOSLASH | `a1620aaa5fb5` | Skia `BoardCanvas` faqat o'qish rejimida (vebda SVG) |
| `src/modules/board/ui/board-permission-dialog.tsx` | 🟡 MOSLASH | `cb442712481d` | faqat tor ekran varianti (`Sheet variant="app" compact`). Eski `BoardPermissionSheet` `ui/legacy/board-dialogs.tsx` da |
| `src/modules/board/ui/erase-reason-dialog.tsx` | 🟡 MOSLASH | `71b533f95680` | faqat tor ekran varianti (`MobileAlertDialog`: `titleVariant="title-lg"`, `shift={24}` — veb `titleClassName`, `className`) |
| `src/modules/board/ui/formula-palette.tsx` | 🟡 MOSLASH | `c3db89716ff5` | MathLive placeholder'lari (#0, #?) olib tashlanadi — mobilda LaTeX oddiy TextInput da yoziladi |
| `src/modules/board/ui/math-markup.tsx` | 🔴 QAYTA | `13d0ea12199d` | MathLive renderi o'rniga KaTeX (CDN) WebView'da; `\placeholder{}` katakchaga almashtiriladi (KaTeX bilmaydi); doskada `framed={false}` — chapga tekislangan, rang chiziqdan. Doskada WebView `scale` bilan kichraytirilmaydi (Android Modal ochilganda asl o'lchamga qaytaradi) — shrift masshtabda, joyi `translate` bilan |
| `src/modules/board/ui/math-field-input.tsx` | 🔴 QAYTA | `a6881a5e8d91` | MathLive Web Component RN'da yo'q: LaTeX matn sifatida yoziladi, ostida KaTeX ko'rinishi; MathLive klaviaturasi o'rniga telefon klaviaturasi |
| `src/modules/board/ui/periodic-table-dialog.tsx` | 🟡 MOSLASH | `280e5c31367b` | faqat tor ekran varianti (`Sheet variant="app"`); 18 ustunli panjara absolut joylashuv bilan (RN'da CSS grid yo'q), katak ranglari `form-skin.css` dagi `.periodic-chip--*`. Eski qidiruvli ro'yxat (`periodic-table-sheet.tsx`) `ui/legacy/` da |
| `src/modules/conversation/api/conversation.api.ts` | 🟢 NUSXA | `4ee5ffcb78a3` | — |
| `src/modules/conversation/api/conversation.dto.ts` | 🟢 NUSXA | `6b7d656e17ed` | — |
| `src/modules/conversation/api/conversation.endpoints.ts` | 🟢 NUSXA | `0620e472cd90` | — |
| `src/modules/conversation/constants/direct-status.ts` | 🟢 NUSXA | `32913399a614` | — |
| `src/modules/conversation/index.ts` | 🟡 MOSLASH | `35d8fcb9007a` | generatsiya: veb barrel minus `ui/` eksportlari (port-barrels.mjs) |
| `src/modules/conversation/lib/conversation.mappers.ts` | 🟢 NUSXA | `a78ab1c556d8` | — |
| `src/modules/conversation/model/conversation-filter.store.ts` | 🟢 NUSXA | `ea649aac1e44` | — |
| `src/modules/conversation/model/conversation.keys.ts` | 🟢 NUSXA | `8dedfc078009` | — |
| `src/modules/conversation/model/use-conversations.ts` | 🟢 NUSXA | `4ef27f08ee5f` | — |
| `src/modules/conversation/ui/chat-header.tsx` | 🟡 MOSLASH | `5da11d27ca42` | faqat tor ekran varianti: tanlash sarlavhasi, qidiruv rejimi, guruh rasmi, ovozli xona tugmasi; `topInset` — holat paneli ostidan boshlanadi; ma'lumot oynasi sahifada (`onOpenInfo`) |
| `src/modules/conversation/ui/mobile-group-info.tsx` | 🟡 MOSLASH | `98c571e07833` | mobilda `group-info-screen.tsx` (`variant="screen"`, to'liq ekran Modal); kursni tahrirlash/o'chirish va boshqaruv (`conversation-info-panel.tsx` dagi) shu faylda; guruh rasmi galereyadan |
| `src/modules/conversation/model/new-conversation.store.ts` | 🟢 NUSXA | `a1588dade042` | — |
| `src/modules/conversation/ui/conversation-actions-sheet.tsx` | 🟡 MOSLASH | `ffc54aadd8a9` | faqat telefon varianti (`focusMenu`): qator `measureInWindow` bilan o'lchanib Modal'da joyida ko'tariladi; o'chirish `ConfirmDialog` orqali |
| `src/modules/conversation/ui/new-conversation-dialog.tsx` | 🟡 MOSLASH | `31bf606509b4` | mobilda `new-group-sheet.tsx` (tor ekran varianti, `Sheet variant="app"`); QR — o'sha `qrcode` kutubxonasi, SVG bilan chiziladi; "Ulashish" — tizim `Share` |
| `src/widgets/chat-shell/mobile-conversation-list.tsx` | 🟡 MOSLASH | `0f462ddaa042` | mobilda `pages/chats/chats-page.tsx`; uzoq bosish `onLongPress` (450ms) |
| `src/widgets/chat-shell/conversation-row.tsx` | 🟡 MOSLASH | `508f0dfd43bb` | mobilda `widgets/chat-shell/conversation-row.tsx` |
| `src/widgets/chat-shell/use-conversation-list.ts` | 🟢 NUSXA | `44267cf64a3e` | mantiq bir xil, faqat mobil import yo'llari |
| `src/widgets/mobile-tab-bar/mobile-tab-bar.tsx` | 🟡 MOSLASH | `da37f448a0b4` | mobilda `providers/role-tabs.tsx` dagi `FloatingTabBar` (`variant="floating"`); faqat bo'limlarning o'zida ko'rinadi; eski bo'limlarga `inset`, Workspace'da bo'shliq stack bosh sahifasida (`useFloatingTabInset`); faol tab soyasi doim turadi, faol emasida shaffof (`dsShadowHidden`) — Android keyin qo'shilgan `boxShadow` ga radius qo'llamaydi |
| `src/widgets/mobile-user-header/mobile-user-header.tsx` | 🟡 MOSLASH | `458790186999` | qo'ng'iroq — `MobileRoundButton` + `lucide` Bell, o'qilmagan bo'lsa qizil nuqta |
| `src/widgets/notification-link/use-open-notification-link.ts` | 🟡 MOSLASH | `8cbf81ea8771` | o'qituvchi va o'quvchi havolalari vebdagidek (vazifa, test va uning natijalari, mock natijalari yoki ro'yxati); admin uchun `teacher` havolasi |
| `src/pages/teacher/dashboard/teacher-dashboard-page.tsx` | 🟡 MOSLASH | `8fca280b252c` | faqat tor ekran shoxi; mobilda `pages/dashboard/teacher-dashboard-page.tsx` (`mobile-dashboard.tsx` bilan birga); Jadval va Vazifalar havolalari mobilning hozirgi marshrutlariga |
| `src/pages/teacher/dashboard/mobile-dashboard.tsx` | 🟡 MOSLASH | `ea1f344083ec` | mobilda `pages/dashboard/teacher-dashboard-page.tsx` ichida |
| `src/pages/teacher/dashboard/mobile-onboarding.tsx` | 🟡 MOSLASH | `62a51e7e3e44` | mobilda `pages/dashboard/mobile-onboarding.tsx`; xira fon panel ostida (sahifa ichida), karta va ramka ustida |
| `src/pages/notifications/notifications-page.tsx` | 🟡 MOSLASH | `69ac18a5aa84` | `NotificationHtml` o'rniga birinchi `<b>` sarlavha qatori + matn; ota-ona va admin ham shu sahifani ishlatadi (vebda faqat o'qituvchi/o'quvchi) |
| `src/pages/workspace/workspace-search-page.tsx` | 🟡 MOSLASH | `0d54c73f83ae` | o'qituvchida test qoralamasi muharrirni, e'lon qilingani natijalarni ochadi; o'quvchida test sahifasini (vebdagidek) |
| `src/modules/course/api/course.api.ts` | 🟢 NUSXA | `0e1b99f705ce` | — |
| `src/modules/course/api/course.dto.ts` | 🟢 NUSXA | `29b2e732fb51` | — |
| `src/modules/course/api/course.endpoints.ts` | 🟢 NUSXA | `3d24c89fb947` | — |
| `src/modules/course/index.ts` | 🟡 MOSLASH | `465f4702b653` | generatsiya: veb barrel minus `ui/` eksportlari (port-barrels.mjs) |
| `src/modules/course/lib/course.mappers.ts` | 🟢 NUSXA | `15c80478319c` | — |
| `src/modules/course/model/course.queries.ts` | 🟢 NUSXA | `6c347f3fc915` | — |
| `src/modules/course/ui/add-student-dialog.tsx` | 🟡 MOSLASH | `588956ed9abf` | mobilda `add-student-sheet.tsx` (`Sheet variant="app"`): qidiruv, belgilab qo'shish, yangi hisob oynasi, taklif havolasi |
| `src/modules/course/ui/invite-link-dialog.tsx` | 🟡 MOSLASH | `b1628c4dd95a` | mobilda `invite-link-sheet.tsx` (`Sheet variant="app"`); muddat `MobilePickerField`; nusxalash `expo-clipboard`, ulashish RN `Share` |
| `src/modules/course/ui/join-requests-dialog.tsx` | 🟡 MOSLASH | `2860aeff45ba` | mobilda `join-requests-sheet.tsx`; vaqt `formatRelativeShort` (Hermes'da `Intl.RelativeTimeFormat` yo'q) |
| `src/modules/live/ui/lesson-invite-dialog.tsx` | 🟡 MOSLASH | `8cf64f3ff09e` | mobilda `lesson-invite-sheet.tsx` — faqat tor ekran varianti; havola — vebdagi dars manzili (`env.apiUrl` + `/live/:id`) |
| `src/pages/join/join-course-page.tsx` | 🟡 MOSLASH | `50b9d49bc41c` | marshrut `app/j/[code].tsx`. VEBDA bu sahifa `app-router` ga ULANMAGAN. "Guruhni ochish" chatlar ro'yxatiga olib boradi (mobilda kurs sahifasi yo'q, guruh chat ichida) |
| `src/modules/course/ui/course-members-section.tsx` | 🟡 MOSLASH | `27579dcbaa50` | mobilda ishlatilmaydi — vebda faqat keng ekranda; tor ekranda kursli guruh ma'lumoti `MobileGroupInfo` (mobilda `group-info-screen.tsx`) |
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
| `src/modules/homework/ui/homework-result-dialog.tsx` | 🟡 MOSLASH | `b82a8abfa8af` | faqat tor ekran varianti (to'liq ekran Modal); eski `homework-result-sheet.tsx` ota-ona ekranida va xabar kartasidagi oynada qoladi |
| `src/modules/homework/ui/homework-message-card.tsx` | 🟡 MOSLASH | `ec1425959edf` | faqat tor ekran (`compact`) kartasi; natijalar `AssignmentDetailSheet` da |
| `src/widgets/homework-workspace/assignment-form-dialog.tsx` | 🟡 MOSLASH | `59d4cea990ba` | mobilda ishlatilmaydi — faqat ulanmagan `HomeworkWorkspace` ichida; vazifa formasi `pages/teacher/workspace/homework/assignment-form-dialog.tsx` qatoriga qarang |
| `src/widgets/homework-workspace/homework-workspace.tsx` | 🟡 MOSLASH | `73d9a0d04b48` | mobilda ishlatilmaydi — vebda ham ulanmagan (`/assignments` -> workspace vazifalari); vazifalar `pages/workspace/homework/` da |
| `src/widgets/homework-workspace/submission-review.tsx` | 🟡 MOSLASH | `bd9efb95f694` | mobilda ishlatilmaydi — faqat ulanmagan `HomeworkWorkspace` ichida |
| `src/pages/teacher/workspace/homework/homework-detail-page.tsx` | 🟡 MOSLASH | `50369bc41da2` | tor ekran (`mobile-homework-detail.tsx` bilan birga) — mobilda `pages/workspace/homework/homework-detail-page.tsx`; harfli baho ("A'lo") matn sifatida (vebda `Number()` NaN beradi); orqaga — stack ichida (vazifalar ro'yxatiga) |
| `src/pages/teacher/workspace/workspace-home-page.tsx` | 🟡 MOSLASH | `aa1931a56f0c` | faqat tor ekran shoxi; mobilda `pages/workspace/workspace-home-page.tsx` |
| `src/pages/teacher/workspace/mobile-workspace-home.tsx` | 🟡 MOSLASH | `d53232f1d3c2` | mobilda `workspace-home-page.tsx` ichida; "+" menyusi `PopoverMenu` |
| `src/pages/teacher/workspace/homework/homework-list-page.tsx` | 🟡 MOSLASH | `cec5ff40f113` | faqat tor ekran shoxi; mobilda `pages/workspace/homework/homework-list-page.tsx` |
| `src/pages/teacher/workspace/homework/mobile-homework-list.tsx` | 🟡 MOSLASH | `d53e5e65c565` | mobilda `homework-list-page.tsx` ichida; kartadagi menyu `PopoverMenu` |
| `src/pages/teacher/workspace/analytics-page.tsx` | 🟡 MOSLASH | `ba900b109f48` | faqat tor ekran shoxi; mobilda `pages/workspace/analytics-page.tsx`; "Batafsil" — "Mening baholarim" (`profile/ratings`) |
| `src/pages/teacher/workspace/mobile-analytics.tsx` | 🟡 MOSLASH | `f5298ec97e37` | mobilda `analytics-page.tsx` ichida |
| `src/pages/teacher/workspace/ai-assistant-page.tsx` | 🟡 MOSLASH | `2b76578f99ac` | faqat tor ekran shoxi; mobilda `pages/workspace/ai-assistant-page.tsx`; `?view=jobs` stekka yangi sahifa bo'lib qo'shiladi (orqaga — formaga) |
| `src/pages/teacher/workspace/mobile-ai-assistant.tsx` | 🟡 MOSLASH | `8ca405ade6a0` | mobilda `ai-assistant-page.tsx` ichida; fayllar `pickDocuments` + `toUploadFile` |
| `src/pages/teacher/workspace/tests-page.tsx` | 🟡 MOSLASH | `f4eb8caaea74` | faqat tor ekran shoxi; mobilda `pages/workspace/tests/tests-page.tsx` |
| `src/pages/teacher/workspace/mobile-tests.tsx` | 🟡 MOSLASH | `340b976e6d2c` | mobilda `tests-page.tsx` ichida; karta menyusi `PopoverMenu` |
| `src/pages/teacher/workspace/new-test-dialog.tsx` | 🟡 MOSLASH | `b93daa7e220b` | faqat tor ekran varianti (`MobileScreenDialog`) |
| `src/pages/teacher/workspace/test-editor-page.tsx` | 🟡 MOSLASH | `895badcbe540` | faqat tor ekran shoxi; mobilda `pages/workspace/tests/test-editor-page.tsx`; Android "orqaga" ham saqlanmagan o'zgarishni so'raydi; maydonlar klaviatura ustida (`KeyboardAwareScrollView`) |
| `src/pages/teacher/workspace/mobile-test-editor.tsx` | 🟡 MOSLASH | `d19324ba9861` | mobilda `test-editor-page.tsx` ichida; guruh audiosi `expo-audio`, yuklash `pickDocument` |
| `src/pages/teacher/workspace/mobile-question-card.tsx` | 🟡 MOSLASH | `6347df69631b` | mobilda `pages/workspace/tests/question-card.tsx`; tur `<select>` o'rniga pastki oynada; tartiblashda sudrash `PanResponder` bilan; bo'sh joy matni `TextInput` ichida rangli `Text` bilan (vebda ustma-ust qatlam) |
| `src/pages/teacher/workspace/test-question-card.tsx` | 🟡 MOSLASH | `f4749ebdc820` | mobilda ishlatilmaydi (vebda faqat keng ekran) |
| `src/pages/teacher/workspace/question-type-dialog.tsx` | 🟡 MOSLASH | `a2e806b5c32e` | faqat tor ekran varianti (`Sheet variant="app"`) |
| `src/pages/teacher/workspace/unsaved-changes-dialog.tsx` | 🟡 MOSLASH | `6f7fe7f7efed` | faqat tor ekran varianti (`MobileAlertDialog`) |
| `src/pages/teacher/workspace/test-details-page.tsx` | 🟡 MOSLASH | `7e78d2ffa03a` | muddat `MobilePickerField type="datetime"` (vebda `datetime-local`) |
| `src/pages/teacher/workspace/test-results-page.tsx` | 🟡 MOSLASH | `362c0f2efe19` | faqat tor ekran shoxi; mobilda `pages/workspace/tests/test-results-page.tsx` |
| `src/pages/teacher/workspace/mobile-test-results.tsx` | 🟡 MOSLASH | `124876481688` | mobilda `test-results-page.tsx` ichida |
| `src/pages/teacher/workspace/mock-exams-page.tsx` | 🟡 MOSLASH | `57eac45e8e4e` | faqat tor ekran shoxi; mobilda `pages/workspace/mock/mock-exams-page.tsx` |
| `src/pages/teacher/workspace/mobile-mock-list.tsx` | 🟡 MOSLASH | `4db71a917000` | mobilda `mock-exams-page.tsx` ichida; karta menyusi `PopoverMenu` |
| `src/pages/teacher/workspace/mock-results-page.tsx` | 🟡 MOSLASH | `18d92d17bc80` | faqat tor ekran shoxi; mobilda `pages/workspace/mock/mock-results-page.tsx`; `?view=writing[&student=]` stekka yangi sahifa bo'lib qo'shiladi (orqaga — oldingi ko'rinishga) |
| `src/pages/teacher/workspace/mobile-mock-results.tsx` | 🟡 MOSLASH | `9062f8ee7f0a` | mobilda `mock-results-page.tsx` ichida (jonli kuzatish, natijalar, esselar, AI tahlili) |
| `src/modules/exam/ui/exam-create-dialog.tsx` | 🟡 MOSLASH | `3b685e7c2d45` | faqat tor ekran varianti (`MobileScreenDialog`); bo'lim testi `<select>` o'rniga `MobileSelectSheet`; shablon izohi biroz zichroq (`letterSpacing`) — RN shriftda `tracking-tight` yetmaydi |
| `src/modules/exam/ui/exam-template-dialog.tsx` | 🟡 MOSLASH | `fd6c7ed2fb2d` | faqat tor ekran varianti (`MobileScreenDialog`); og'irlik `<select>` o'rniga `MobileSelectSheet` |
| `src/modules/exam/ui/exam-score-dialog.tsx` | 🟡 MOSLASH | `4d355d8543e5` | faqat tor ekran varianti (`Sheet variant="app"`) |
| `src/modules/exam/ui/exam-writing-review.tsx` | 🟡 MOSLASH | `73d0c81638ec` | mobilda yo'q — vebda keng ekran natijalari (`exam-results-view.tsx`) uchun; tor ekranda AI tahlili `mock-results-page.tsx` da |
| `src/pages/ai/ai-page.tsx` | 🟡 MOSLASH | `35afc5abef67` | mobilda yo'q — vebda ham hech qaysi marshrutga ulanmagan (`/teacher/ai` -> `/teacher/workspace/ai`) |
| `src/modules/quiz/ui/ai-quiz-creator.tsx` | 🟡 MOSLASH | `856cbf831cab` | mobilda yo'q — vebda faqat ulanmagan `pages/ai/ai-page.tsx` ishlatadi |
| `src/pages/teacher/workspace/homework/mobile-homework-detail.tsx` | 🟡 MOSLASH | `6c9eddbcac59` | mobilda `homework-detail-page.tsx` ichida; "⋮" — `PopoverMenu` |
| `src/pages/teacher/workspace/homework/homework-review-page.tsx` | 🟡 MOSLASH | `5755d219b1c2` | faqat tor ekran varianti; `?s=` — `router.setParams` |
| `src/pages/teacher/workspace/homework/assignment-form-dialog.tsx` | 🟡 MOSLASH | `24db057b20da` | faqat tor ekran varianti (to'liq ekran Modal); mobilda `widgets/homework-workspace/assignment-form-dialog.tsx` (pages'ni widget import qila olmaydi) |
| `src/pages/teacher/workspace/homework/remind-dialog.tsx` | 🟡 MOSLASH | `dca5a552e063` | `AppDialog` -> `Sheet variant="app"` |
| `src/pages/teacher/workspace/homework/resubmit-dialog.tsx` | 🟡 MOSLASH | `3124cd8e0e49` | `AppDialog` -> `Sheet variant="app"` |
| `src/pages/teacher/workspace/homework/delete-assignment-dialog.tsx` | 🟡 MOSLASH | `81c16c551fbf` | faqat tor ekran (`ConfirmDialog`) |
| `src/pages/teacher/workspace/homework/submission-preview.tsx` | 🟡 MOSLASH | `8e34b745e05a` | rasm token bilan yuklanib keshga yoziladi (`writeBlobToCache`), `Image` bilan |
| `src/pages/teacher/workspace/homework/format-due.ts` | 🟢 NUSXA | `7e83c7c05b1f` | — |
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
| `src/modules/lesson/ui/lesson-calendar.tsx` | 🟡 MOSLASH | `f4baf96b5725` | mobilda ishlatilmaydi (vebda ham hech qayerda chaqirilmaydi) |
| `src/modules/lesson/ui/live-lesson-bar.tsx` | 🟡 MOSLASH | `e1fdea2ab542` | mobilda ishlatilmaydi — veb tor ekranda jonli dars chizig'ini ko'rsatmaydi |
| `src/modules/lesson/ui/schedule-grid.tsx` | 🟡 MOSLASH | `4be7763e297a` | mobilda ishlatilmaydi — jadval yangi dizaynda `pages/schedule/mobile-schedule.tsx` (vebda ham faqat keng ekranda) |
| `src/modules/lesson/ui/schedule-sidebar.tsx` | 🟡 MOSLASH | `a33c07fd337b` | mobilda ishlatilmaydi (vebda faqat keng ekran) |
| `src/modules/lesson/ui/lesson-detail-dialog.tsx` | 🟡 MOSLASH | `fe03b39eee02` | mobilda ishlatilmaydi — jadvalda `pages/schedule/lesson-detail-drawer.tsx` |
| `src/modules/lesson/ui/lesson-create-dialog.tsx` | 🟡 MOSLASH | `e1ad0ea3713b` | mobilda ishlatilmaydi — jadvalda `pages/schedule/new-lesson-dialog.tsx`, guruhda `add-lesson-dialog.tsx` |
| `src/modules/lesson/ui/finish-lesson-dialog.tsx` | 🟡 MOSLASH | `9523cd3f01c7` | mobilda `lesson-sheets.tsx` dagi `FinishLessonSheet` (`ConfirmDialog`, tor ekran matni) |
| `src/modules/lesson/ui/star-rating.tsx` | 🟡 MOSLASH | `c837cb4c5fb6` | yorliqlar `accessibilityLabel`; teginish maydoni 44pt; `RatingSummary` "N ta baho" o'rniga `(N)` (faqat admin ro'yxatida) |
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
| `src/modules/message/api/message.api.ts` | 🟢 NUSXA | `8636dc74d913` | — |
| `src/modules/message/api/message.dto.ts` | 🟢 NUSXA | `4bad5cfbf5cf` | — |
| `src/modules/message/api/message.endpoints.ts` | 🟢 NUSXA | `1e5bbe71e7d2` | — |
| `src/modules/message/index.ts` | 🟡 MOSLASH | `6cf40e162ad6` | generatsiya: veb barrel minus `ui/` eksportlari (port-barrels.mjs) |
| `src/modules/message/lib/chat-socket-manager.ts` | 🟢 NUSXA | `70fedb5791ca` | — |
| `src/modules/message/lib/linkify.ts` | 🟢 NUSXA | `5a21a96293c4` | — |
| `src/modules/message/lib/message.mappers.ts` | 🟢 NUSXA | `35b0b5e87ee2` | — |
| `src/modules/message/model/message.keys.ts` | 🟢 NUSXA | `7f63f642ebea` | — |
| `src/modules/message/model/chat-ui.store.ts` | 🟢 NUSXA | `—` | xabar qidiruvi va tanlash holati (2026-10-20 qo'shildi) |
| `src/modules/message/model/use-chat.ts` | 🟡 MOSLASH | `809460742acb` | react-router useNavigate -> expo-router (2026-10-20 vebdan qayta sinxronlandi; literal matn moslashtirishi olib tashlandi — chat.json da `removedFromGroup` endi bor) |
| `src/modules/message/ui/message-attachment.tsx` | 🟡 MOSLASH | `b2144ef8b905` | rasm xabar ichida (`Image`, nisbat yuklangach); bosilganda `FileViewer` — fayl ilova ichida ochiladi |
| `src/modules/message/ui/message-actions-menu.tsx` | 🟡 MOSLASH | `9fc6953c0866` | faqat telefon varianti (`focus`): pufak `measureInWindow` bilan o'lchanib Modal'da ko'tariladi; chekkalarga tizim panellari qo'shilgan |
| `src/modules/message/ui/attachment-sheet.tsx` | 🟡 MOSLASH | `9d80259f1011` | `Sheet variant="app"`; fayl tanlash `expo-image-picker`/`expo-document-picker`; so'nggi rasm keshga yozilib `PickedFile` bo'ladi |
| `src/modules/message/ui/image-preview-screen.tsx` | 🟡 MOSLASH | `9e49e666fffd` | to'liq ekran Modal, tokenlar doim qorong'i (`useDs("dark")`), holat paneli oq |
| `src/modules/message/ui/voice-message.tsx` | 🟡 MOSLASH | `5961e0e20cd6` | `expo-audio` token sarlavhasi bilan oqim (Blob emas); tor ekranda 24 ustun; ijro xatosida toast (iOS vebdagi WebM xabarlarni ocholmaydi — `docs/BACKEND-IOS.md`) |
| `src/modules/message/ui/message-bubble.tsx` | 🟡 MOSLASH | `d9888fe9389e` | tor ekran varianti; pufak `MessageBubbleCard` ga ajratilgan (fokus menyusidagi nusxa uchun); sudrab javob berish yo'q (orqaga qaytish imo-ishorasi bilan to'qnashadi) — javob menyudan |
| `src/modules/message/ui/message-composer.tsx` | 🟡 MOSLASH | `4dee1f13d3ae` | tor ekran varianti; fayllar `PickedFile` (uri), yuborishda `toUploadFile`; ovoz `expo-audio`; @ ro'yxati kompozer ustida oqimda (Android'da ota-chegaradan tashqaridagi bosish yetib bormaydi); emoji paneli Modal'da tugma o'rniga qarab |
| `src/modules/message/ui/message-list.tsx` | 🟡 MOSLASH | `c460932a1ff3` | FlashList (pastdan ochiladi); kun ajratgichlari har kun uchun (vebda bitta "Bugun"); qidiruvda joriy natija `scrollToIndex` bilan o'rtaga; o'chirish tasdig'i `ConfirmDialog`; `date-separator`, `typing-indicator` shu faylda |
| `src/modules/message/ui/message-text.tsx` | 🟡 MOSLASH | `9ba5cb9dd097` | havolalar `Text onPress`; ichki havola ilova ichida, tashqisi brauzerda |
| `src/modules/message/ui/pinned-message-bar.tsx` | 🟡 MOSLASH | `d8b8f14c948f` | faqat tor ekran ko'rinishi |
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
| `src/modules/quiz/lib/answer-value.ts` | 🟢 NUSXA | `3fdb1a9ba888` | — |
| `src/modules/quiz/lib/question-draft.ts` | 🟢 NUSXA | `4bf8de451272` | — |
| `src/modules/quiz/lib/quiz-errors.ts` | 🟢 NUSXA | `da4cf7939388` | — |
| `src/modules/quiz/lib/quiz.mappers.ts` | 🟢 NUSXA | `65a4cb127d82` | — |
| `src/modules/quiz/model/quiz.queries.ts` | 🟢 NUSXA | `1e7da8956064` | — |
| `src/modules/quiz/ui/question-answer-input.tsx` | 🟡 MOSLASH | `—` | veb uslublari (legacy.css) bilan qayta yozildi; `<select>` -> ro'yxatli oyna, bo'sh joylar so'zlar oqimida; `$...$` formulalar oddiy matn (MathLive yo'q); `Choice` eksport qilingan |
| `src/modules/quiz/ui/question-editor.tsx` | 🟡 MOSLASH | `—` | veb o'lchamlari bilan qayta yozildi; formula oynasida MathLive/palitra yo'q — LaTeX matn sifatida kursor joyiga `$...$` bo'lib qo'yiladi |
| `src/modules/quiz/ui/question-group-editor.tsx` | 🟡 MOSLASH | `—` | `<audio>` -> expo-audio; `<details>` -> ochib-yopiladigan blok |
| `src/modules/quiz/ui/quiz-create-dialog.tsx` | 🟡 MOSLASH | `—` | ikki bosqich vebdagidek (Sheet + to'liq ekranli Modal); nom taklifi (existingQuizzes) yo'q; telefondagi "Qoralama saqlash" haqiqatan qoralama sifatida saqlaydi |
| `src/modules/quiz/ui/quiz-preview.tsx` | 🟡 MOSLASH | `—` | veb o'lchamlari |
| `src/modules/quiz/ui/subject-filter-sheet.tsx` | 🟡 MOSLASH | `ca91aa42a8f6` | mobilda yo'q — vebda faqat ulanmagan `teacher-quizzes-page.tsx` ishlatadi |
| `src/modules/quiz/ui/assign-quiz-dialog.tsx` | 🟡 MOSLASH | `96f11bdac46a` | faqat tor ekran varianti (`Sheet variant="app"`); guruh bo'limidagi "Tayyor testdan" ham shu |
| `src/modules/quiz/ui/quiz-export-dialog.tsx` | 🟡 MOSLASH | `18ab059f63f7` | faqat tor ekran varianti (`Sheet variant="app"`) |
| `src/modules/quiz/ui/quiz-attempts-dialog.tsx` | 🟡 MOSLASH | `—` | mobilda `quiz-attempts-sheet.tsx`; yuklab olish `downloadBlob` (ulashish oynasi) orqali |
| `src/modules/quiz/ui/quiz-attempts-drawer.tsx` | 🟡 MOSLASH | `06aac0ff56aa` | faqat tor ekran varianti (`MobileScreenDialog`) |
| `src/modules/quiz/ui/quiz-attempt-dialog.tsx` | 🟡 MOSLASH | `8145f21d6231` | mobilda ishlatilmaydi (vebda ham faqat eksport qilinadi); o'quvchi testni `pages/student/workspace/student-test-page.tsx` da yechadi |
| `src/modules/quiz/ui/math-text.tsx` | 🟡 MOSLASH | `bea477c89a44` | `$..$` bo'laklari `MathMarkup framed={false}`, qolgani `Text`; bo'shliqlar bittaga qisqaradi (HTML'dagidek); `v`/`w`/`style` uzatiladi |
| `src/modules/quiz/ui/quiz-group-panel.tsx` | 🟡 MOSLASH | `c07454149183` | audio `expo-audio` bilan; eski `quiz-attempt-sheet.tsx` dan ajratildi |
| `src/modules/quiz/ui/quiz-import-dialog.tsx` | 🟡 MOSLASH | `35556e107370` | faqat tor ekran varianti; fayl `pickDocument` + `toUploadFile` |
| `src/pages/teacher/quizzes/teacher-quizzes-page.tsx` | 🟡 MOSLASH | `6181c5192d3a` | mobilda yo'q — vebda ham ulanmagan (`/teacher/quizzes` -> `/teacher/workspace/tests`) |
| `src/modules/student/index.ts` | 🟡 MOSLASH | `b64689876640` | vebdagidek faqat yozilish oynasi; `StudentEnrollmentDialog` o'rniga `StudentEnrollmentSheet` |
| `src/modules/student/ui/student-enrollment-dialog.tsx` | 🟡 MOSLASH | `6a9055c814b2` | mobilda `ui/student-enrollment-sheet.tsx` (pastdan chiquvchi oyna); eski uslubda — vebda ham `shared/ui/legacy` |
| `src/modules/voice/api/voice.api.ts` | 🟢 NUSXA | `c779868ae383` | — |
| `src/modules/voice/api/voice.dto.ts` | 🟢 NUSXA | `d68f135cf46e` | — |
| `src/modules/voice/api/voice.endpoints.ts` | 🟢 NUSXA | `21c1eee7370f` | — |
| `src/modules/voice/index.ts` | 🟡 MOSLASH | `a6ac0727b617` | generatsiya: veb barrel minus `ui/` + mobil UI eksportlari |
| `src/modules/voice/lib/voice.mappers.ts` | 🟢 NUSXA | `63111b04bb08` | — |
| `src/modules/voice/model/voice.queries.ts` | 🟢 NUSXA | `34c755e07c59` | — |
| `src/modules/voice/ui/voice-room-bar.tsx` | 🟡 MOSLASH | `f18a7c85c56e` | `hideIdle`; ochish oynasi `useVoiceUiStore` orqali (sarlavhadagi tugma ham shuni ochadi) |
| `src/modules/voice/ui/voice-room-create-dialog.tsx` | 🟡 MOSLASH | `3bec99f4bb11` | faqat tor ekran varianti (`Sheet variant="app"`) |
| `src/modules/voice/ui/voice-room-panel.tsx` | 🟡 MOSLASH | `5115fe0470d2` | faqat tor ekran varianti — to'liq ekranli `Modal`; `RoomAudioRenderer` kerak emas (RN ovozni o'zi chiqaradi) |
| `src/pages/admin/admin-dashboard-page.tsx` | 🟡 MOSLASH | `584486d026fd` | jadvallar ustunlab chiziladi va gorizontal aylanadi (`admin-table.tsx`) |
| `src/pages/admin/system-panels.tsx` | 🟡 MOSLASH | `1f10ae6fae56` | server holatida davr tugmalari sarlavha ostida (vebda tor ekranda ustun bo'lib izohni siqadi) |
| `src/pages/admin/teachers/admin-teachers-page.tsx` | 🟡 MOSLASH | `73fbd40d4d08` | mobilda `pages/admin/admin-teachers-page.tsx`; ko'rinish tanlagichi sarlavha ostida; `?teacher=` qatorga aylantiradi va belgilaydi |
| `src/pages/admin/teachers/teacher-stats-dialog.tsx` | 🟡 MOSLASH | `b15753cd64fc` | mobilda `pages/admin/teacher-stats-sheet.tsx` (Dialog o'rniga Sheet) |
| `src/widgets/group-workspace/group-action-dialogs.tsx` | 🟡 MOSLASH | `e51a1ebf0d13` | `AddLessonDialog` — mobilda `add-lesson-dialog.tsx` (tor ekran `ModalCard` -> `Sheet variant="app"`, sana/vaqt `MobilePickerField`); `AddAssignmentDialog` — hozircha eski `add-assignment-sheet.tsx` (4b) |
| `src/shared/ui/app-dialog.tsx` | 🟡 MOSLASH | `4dcce350160d` | `fullscreen` — mobilda `fullscreen-dialog.tsx`; `sheet` — `Sheet variant="app"` (tutqich, `text-h2` sarlavha, 44px yopish, qotirilgan `footer`; `icon`, `headingTitle`, `footerPadding` — vebdagi `icon`, `titleClassName`, `footerClassName`) |
| `src/shared/ui/mobile-page.tsx` | 🟡 MOSLASH | `186ad722b47e` | barcha bloklar RN'da; `mobileRoundButton`/`mobileButton` klasslari o'rniga `MobileRoundButton`/`MobileButton`; segmentda matn kesilmasligi uchun ichki chet kichik — suriladiganda 0, teng kenglikda 4 (CSS'da `nowrap` matn chetdan chiqib ko'rinadi) |
| `src/shared/ui/group-tile.tsx` | 🟡 MOSLASH | `74b48cf68e56` | `box`/`radius` — vebdagi `className="size-11 rounded-xl"` o'rnida |
| `src/shared/ui/confirm-dialog.tsx` | 🟡 MOSLASH | `647991246a4a` | faqat tor ekran varianti; mobilda `shared/ui/center-dialog.tsx`; fon/orqaga faqat `onOpenChange(false)` (vebdagidek), `onCancel` faqat tugmadan |
| `src/shared/ui/mobile-alert-dialog.tsx` | 🟡 MOSLASH | `2dc5f552c93b` | mobilda `shared/ui/center-dialog.tsx`; `titleVariant` va `shift` — vebdagi `titleClassName` va `className` (`top-[calc(50%+Npx)]`) o'rniga |
| `src/shared/ui/mobile-fields.tsx` | 🟡 MOSLASH | `e38ff871ee7c` | `select` — `MobileSelectSheet` (pastki oynadagi ro'yxat, vebda brauzer ro'yxati); `date`/`time` — `mobile-pickers.tsx`; `datetime` (veb `datetime-local`) — avval kalendar, keyin soat |
| `src/shared/ui/mobile-pickers.tsx` | 🟡 MOSLASH | `d93f3cdcb26a` | `AppDialog` -> `Sheet variant="app" compact`; kalendar haftalar qatorida (foizli `flexWrap` yaxlitlanadi); `clearable` — bo'sh qiymat ("Hozir") |
| `src/shared/ui/mobile-screen-dialog.tsx` | 🟡 MOSLASH | `1685aa64f0de` | Radix Dialog -> RN `Modal` + `KeyboardAvoidingView` |
| `src/shared/ui/file-viewer.tsx` | 🟡 MOSLASH | `2bd15f8dcb80` | faqat tor ekran varianti (to'liq ekran `Modal`); PDF — WebView'da pdf.js, hujjat base64 bo'lib beriladi; rasm `Image`, video `expo-video` (tizim boshqaruvlari), audio `expo-audio` (ijro tugmasi, chiziq, vaqt — vebdagi `<audio controls>` o'rnida); rasm/video/audio keshdagi faylga yoziladi |
| `src/shared/ui/pdf-page-canvas.tsx` | 🟡 MOSLASH | `0b762711f65c` | mobilda `file-viewer.tsx` dagi WebView HTML'ida (xuddi shu hisob: kenglik × `devicePixelRatio`) |
| `src/shared/ui/route-status.tsx` | 🟡 MOSLASH | `b048e5dc1a1f` | faqat tor ekran shoxi; belgi rang oladigan funksiya bo'lib beriladi (`mobileIcon` o'rniga sahifalar tor ekran belgisini beradi); tugmalar `MobileButton` |
| `src/app/router/route-status-pages.tsx` | 🟡 MOSLASH | `af1e4e3d62e9` | mobilda `pages/status/route-status-pages.tsx`; marshrutlar `app/+not-found.tsx` va `app/forbidden.tsx` |
| `src/app/router/route-error-boundary.tsx` | 🟡 MOSLASH | `77593fa8b9dd` | mobilda `RouteErrorPage` (`pages/status/route-status-pages.tsx`) + `app/_layout.tsx` dagi Expo Router `ErrorBoundary`; "Qayta urinish" — `retry()` (vebda sahifani qayta yuklash); bo'lak (chunk) qayta yuklash mantig'i yo'q — mobil to'plam bitta |
| `src/shared/ui/modal-card.tsx` | 🟡 MOSLASH | `c7b2169346f0` | tor ekranda `Sheet variant="app"` bilan bir xil — alohida komponent yo'q |
| `src/shared/ui/switch.tsx` | 🟡 MOSLASH | `edc97d390894` | radix o'rniga Pressable; `lg` o'lcham; radius aniq yarim balandlik (Android `boxShadow` 999 ni kesmaydi) |
| `src/modules/board/ui/formula-solver-dialog.tsx` | 🟡 MOSLASH | `a30c57d10aa4` | faqat tor ekran varianti (`Sheet variant="app" compact`); tezkor tugmalar kursor joyiga (`onSelectionChange` + `setSelection`). Eski `formula-solver-sheet.tsx` `ui/legacy/` da |
| `src/pages/teacher/exams/teacher-exams-page.tsx` | 🟡 MOSLASH | `aaec2fc43c46` | mobilda yo'q — vebda ham ulanmagan (`/teacher/exams` -> `/teacher/workspace/mock`) |
| `src/pages/auth/login-page.tsx` | 🟡 MOSLASH | `47267c572c0a` | manba: veb `mobile-login-form.tsx` (tor ekran varianti); oflayn ogohlantirish NetInfo orqali; SMS bilan tasdiqlash hozircha o'chiq (`FEATURES.smsVerification`, 2026-10-29 loyiha egasi qarori): "Parolni unutdingizmi?" yashirin, 2FA talab qilinsa kod oynasi o'rniga izoh |
| `src/modules/auth/ui/mobile-login-form.tsx` | 🟡 MOSLASH | `f2830b3adbe5` | mobilda `pages/auth/login-page.tsx` ichida |
| `src/pages/auth/register-page.tsx` | 🟡 MOSLASH | `fd6ead08a2a2` | manba: veb `mobile-register-form.tsx`; "tayyor" ekrani haqiqatan ko'rsatiladi (vebda `PublicRoute` uni darhol yo'naltirib yuboradi) |
| `src/modules/auth/ui/mobile-register-form.tsx` | 🟡 MOSLASH | `eee88e0d2a0c` | mobilda `pages/auth/register-page.tsx` ichida |
| `src/modules/auth/ui/auth-screen.tsx` | 🟡 MOSLASH | `821d80dc5c6f` | `AuthScreen` (tor ekran varianti, M1–M4) + maydon/tugma komponentlari; `AuthShell` (keng ekran) yo'q; fon gradienti `DsGradient`, maydonlar klaviatura ustiga `KeyboardAwareScrollView` bilan suriladi; placeholder o'lchami RN'da alohida berilmagani uchun bo'sh maydonda shrift placeholder'nikiga o'tadi |
| `src/modules/auth/ui/otp-input.tsx` | 🟡 MOSLASH | `56a812e2324e` | har katak alohida `TextInput`; SMS avtoto'ldirish `oneTimeCode`/`sms-otp`; fokus o'tishidan oldin kelgan raqam keyingi kataklarga tarqatiladi (vebda `maxLength=1`) |
| `src/modules/auth/ui/two-factor-form.tsx` | 🟡 MOSLASH | `e6f1e33d6c41` | faqat `MobileTwoFactorForm` (veb tor ekranda shuni ko'rsatadi); `TwoFactorForm` (keng ekran) yo'q |
| `src/pages/profile/account-settings-page.tsx` | 🟡 MOSLASH | `142fd170b299` | faqat tor ekran varianti; `AppDialog` -> `Sheet`; 2FA yoqish/kod/o'chirish oynalari vebdagidek. Ota-ona hozircha `pages/profile/legacy/` dagi eski sahifada; SMS bilan tasdiqlash hozircha o'chiq (`FEATURES.smsVerification`, 2026-10-29 loyiha egasi qarori): 2FA qatori yashirin, holat so'ralmaydi |
| `src/pages/profile/profile-page.tsx` | 🟡 MOSLASH | `a6e554a1a379` | faqat tor ekran varianti; avatar yuklash yo'q (veb tor ekranda ham yo'q); o'qituvchi va o'quvchi — ota-ona `pages/profile/legacy/` da |
| `src/pages/profile/profile-layout.tsx` | 🟡 MOSLASH | `35ce0f6b738c` | tor ekranda faqat `Outlet` — mobilda `app/teacher/profile/_layout.tsx` (Stack, `anchor: "index"`); keng ekran yon menyusi yo'q |
| `src/pages/profile/profile-shell.tsx` | 🟡 MOSLASH | `282318c579f7` | `ProfileSubPage` — maydonlar klaviatura ustida (`KeyboardAwareScrollView`); orqaga — stekdan, bo'lmasa profil bosh sahifasiga |
| `src/pages/profile/profile-dialogs.tsx` | 🟡 MOSLASH | `a2ea1873e2b1` | `AppDialog` -> `Sheet variant="app"` / `ConfirmDialog` |
| `src/pages/profile/settings-tones.ts` | 🟢 NUSXA | `3d58b6ad30a4` | — |
| `src/pages/profile/personal-info-page.tsx` | 🟡 MOSLASH | `c942534b1f5f` | faqat tor ekran varianti; fan va shahar `<select>` o'rniga `MobilePickerField`; xato `MobileActionBar` ustida |
| `src/pages/profile/system-settings-page.tsx` | 🟡 MOSLASH | `e92e834bba3f` | faqat tor ekran varianti; push — veb Web Push o'rniga OS ruxsati (o'chirish tizim sozlamalarini ochadi, ilovaga qaytganda qayta o'qiladi); eski mobil sahifadagi kesh tozalash va bildirishnoma turlari olib tashlandi (vebda yo'q) |
| `src/pages/profile/my-ratings-page.tsx` | 🟡 MOSLASH | `5842230d4b65` | faqat tor ekran shoxlari: o'qituvchida `TeacherRatings`, o'quvchida `student-ratings.tsx` |
| `src/pages/profile/student-ratings.tsx` | 🟡 MOSLASH | `23c365c11544` | faqat tor ekran varianti |
| `src/pages/profile/certificates-page.tsx` | 🟡 MOSLASH | `57c03981d30b` | faqat tor ekran varianti; fayl `pickDocument` bilan; faylni ochish `Linking.openURL`; qator menyusi `PopoverMenu` |
| `src/pages/profile/login-history-page.tsx` | 🟡 MOSLASH | `0d1bbdb3c27d` | faqat tor ekran varianti |
| `src/pages/profile/help-center-page.tsx` | 🟡 MOSLASH | `29932f6eb4da` | tanishuvni qayta ko'rsatish — `storage` dagi kalit o'chiriladi (vebda `localStorage`) |
| `src/widgets/account-menu/notification-settings.tsx` | 🟡 MOSLASH | `01088df91bda` | mobilda `pages/profile/legacy/system-settings-page.tsx` ichida (ota-ona); Web Push qatori yo'q (qurilma tokeni kirishda o'zi yoziladi) |
| `src/modules/auth/ui/login-history-dialog.tsx` | 🟡 MOSLASH | `8127cad1ced2` | mobilda `login-history-sheet.tsx` (Dialog o'rniga Sheet) |
| `src/pages/auth/welcome-page.tsx` | 🟡 MOSLASH | `c36d8a0a9983` | til menyusi oddiy ochiluvchi ro'yxat; Xush kelibsiz ochilishda `fade` bilan chiqadi |
| `src/shared/ui/splash-screen.tsx` | 🟡 MOSLASH | `2a085985444d` | mobilda `shared/ui/boot-screen.tsx` (ilova ochilishi, sessiya tekshirilishi, `index` yo'naltirishi); nuqtalar Reanimated bilan |
| `src/shared/ui/app-toast.tsx` | 🟡 MOSLASH | `dde01935d48d` | mobilda `shared/ui/toast.tsx` dagi `showErrorToast` (`appError` turi); tepada 16px |
| `src/pages/auth/forgot-password-page.tsx` | 🟡 MOSLASH | `20a0829c7031` | mobilda `password-reset-pages.tsx` ichida; `location.state` o'rniga marshrut parametrlari; SMS bilan tasdiqlash hozircha o'chiq (`FEATURES.smsVerification`, 2026-10-29 loyiha egasi qarori): marshrutlar kirishga yo'naltiradi |
| `src/pages/auth/verify-code-page.tsx` | 🟡 MOSLASH | `16651bf7c720` | mobilda `password-reset-pages.tsx` ichida |
| `src/pages/auth/new-password-page.tsx` | 🟡 MOSLASH | `91726b8fbfb1` | mobilda `password-reset-pages.tsx` ichida |
| `src/pages/parent/dashboard/parent-dashboard-page.tsx` | 🟡 MOSLASH | `aad62c96ad28` | mobilda `pages/parent/parent-dashboard-page.tsx`; sarlavha `ParentAppBar`, pastki tablar saqlangan |
| `src/pages/parent/children/parent-children-page.tsx` | 🟡 MOSLASH | `fc3d24f1cb61` | mobilda `pages/parent/parent-children-page.tsx`; ruxsatlar sarlavhasi va "Kirishlar tarixi" ustma-ust (vebda tor ekranda sinadi) |
| `src/pages/parent/attendance/parent-attendance-page.tsx` | 🟡 MOSLASH | `36689affc99d` | mobilda `pages/parent/parent-attendance-page.tsx`; "Hisobot" (window.print) yo'q; jadval o'rniga `AttendanceList` |
| `src/pages/parent/homework/parent-homework-page.tsx` | 🟡 MOSLASH | `2851d3486787` | mobilda `pages/parent/parent-homework-page.tsx`; karta ichida 16 gorizontal bo'shliq (vebda qatorlar chetga yopishadi) |
| `src/pages/parent/exams/parent-exams-page.tsx` | 🟡 MOSLASH | `6211f82e3125` | mobilda `pages/parent/parent-exams-page.tsx`; "Natija" tugmasi pastki qatorda (vebda sarlavhani siqadi) |
| `src/pages/parent/report/parent-report-page.tsx` | 🟡 MOSLASH | `3a6146c6e277` | mobilda `pages/parent/parent-grades-page.tsx` |
| `src/pages/board/board-page.tsx` | 🟡 MOSLASH | `5c58f38cd773` | faqat tor ekran shoxi; PDF yuklab olish `downloadBlob` (ulashish oynasi); menyu `PopoverMenu`; yuklanish vebdagi `LoadingFallback` o'rniga oddiy belgi |
| `src/pages/workspace/workspace-page.tsx` | 🟡 MOSLASH | `—` | vebda olib tashlangan (#156); mobilda faqat ota-ona ochadi — o'qituvchi va o'quvchi shoxlari endi ishlatilmaydi, ota-ona sahifalari yangi dizaynga o'tganda sahifa bilan birga ketadi |
| `src/pages/live/live-lesson-page.tsx` | 🟡 MOSLASH | `084de48e1a44` | faqat tor ekran shoxlari; Androidda FLAG_SECURE (skrinshot himoyasi), iOS'da ism-watermark |
| `src/modules/live/ui/lesson-pre-join.tsx` | 🟡 MOSLASH | `f21f207c9ecd` | faqat tor ekran varianti; o'qituvchining kompyuterdagi ekran ulashish shoxi yo'q; ruxsat rad etilsa `media-permission-dialog.tsx` ga qarang |
| `src/modules/live/ui/media-permission-dialog.tsx` | 🟡 MOSLASH | `425eb1d4a350` | mobilda `lesson-pre-join.tsx` ichida (`ConfirmDialog`); "Qayta tekshirish" o'rniga tizim sozlamalari (`Linking.openSettings`), ilovaga qaytganda kamera qayta so'raladi; brauzerga xos izoh o'rniga `mobile.live.ruxsat_sozlamalarda` |
| `src/pages/recording/recording-page.tsx` | 🟡 MOSLASH | `ffe0e380630d` | faqat tor ekran shoxi; xato holati `MobileEmptyCard` |
| `src/pages/recording/recording-mobile.tsx` | 🟡 MOSLASH | `d3b787324a69` | mobilda `recording-page.tsx` ichida; davomat qatori guruh chatining "Davomat" bo'limini ochadi (mobilda `/teacher/attendance` yo'q); PDF `downloadBlob` orqali |
| `src/pages/recording/recording-video.tsx` | 🟡 MOSLASH | `8db69f896b26` | mobilda `recording-page.tsx` ichida, `expo-video`; vebdan farqi — oxirida to'liq ekran tugmasi; oxiriga yetgan video boshidan qo'yiladi (ExoPlayer o'zi qaytarmaydi); pleer QO'LDA to'xtatilmaydi; video yo'lagi yo'q (faqat audio) yozuvda native ko'rinish yashiriladi — iOS QuickTime belgisini chizardi |
| `src/pages/recording/recording-desktop.tsx` | 🟡 MOSLASH | `3324fa5cd818` | mobilda ishlatilmaydi (vebda faqat keng ekran) |
| `src/modules/lesson/ui/lesson-recording-player.tsx` | 🟡 MOSLASH | `42684a8f0678` | mobilda ishlatilmaydi (vebda ham hech qayerda chaqirilmaydi) — pleer `recording-video.tsx` asosida `recording-page.tsx` ichida |
| `src/pages/schedule/schedule-page.tsx` | 🟡 MOSLASH | `1a69f46b0718` | faqat tor ekran shoxi (`MobileSchedule` va oynalar); o'quvchi baholashi `RateLessonSheet`; yozuv `/recordings/:id`; darsga yoki yozuvga o'tishda tafsilot oynasi yopiladi (mobilda jadval stekda qoladi) |
| `src/pages/schedule/mobile-schedule.tsx` | 🟡 MOSLASH | `108bc38855cf` | — |
| `src/pages/schedule/lesson-detail-drawer.tsx` | 🟡 MOSLASH | `0cbc7b0f3a80` | faqat tor ekran variantlari (o'qituvchi va o'quvchi), `Sheet variant="app"` |
| `src/pages/schedule/lesson-ratings-dialog.tsx` | 🟡 MOSLASH | `15d30680181e` | faqat tor ekran varianti |
| `src/pages/schedule/new-lesson-dialog.tsx` | 🟡 MOSLASH | `ff60f937bf6c` | faqat tor ekran varianti |
| `src/pages/schedule/schedule-states.tsx` | 🟡 MOSLASH | `11c7ac9f6fea` | faqat `MobileScheduleSkeleton` va `ScheduleError` |
| `src/pages/schedule/lesson-tone.ts` | 🟢 NUSXA | `5c79242889d9` | — |
| `src/pages/student/lib/attendance-rate.ts` | 🟢 NUSXA | `9bcba538adfc` | — |
| `src/pages/student/lib/clock.ts` | 🟢 NUSXA | `cd1550138b5d` | — |
| `src/pages/student/lib/format.ts` | 🟢 NUSXA | `68d329bfea41` | — |
| `src/pages/student/lib/use-student-assignments.ts` | 🟢 NUSXA | `2af2d98a960e` | — |
| `src/pages/student/dashboard/use-student-home.ts` | 🟢 NUSXA | `70c635a2838f` | — |
| `src/pages/student/dashboard/student-dashboard-page.tsx` | 🟡 MOSLASH | `e793239240e9` | faqat tor ekran shoxi (`student-mobile-home.tsx` shu faylda); pastga tortib yangilash faol so'rovlarni qayta oladi |
| `src/pages/student/dashboard/student-mobile-home.tsx` | 🟡 MOSLASH | `057009959777` | mobilda `student-dashboard-page.tsx` ichida |
| `src/pages/student/dashboard/student-hero.tsx` | 🟡 MOSLASH | `3d2d055fff91` | mobilda ishlatilmaydi (vebda faqat keng ekran) |
| `src/pages/student/workspace/use-student-workspace.ts` | 🟢 NUSXA | `7518d93051b5` | — |
| `src/pages/student/workspace/filter-chips.tsx` | 🟡 MOSLASH | `9ce5a36a7e1b` | mobilda `MobileSegment scroll="auto"` (tor ekran varianti) |
| `src/pages/student/workspace/student-workspace-page.tsx` | 🟡 MOSLASH | `6f00bccf1623` | faqat tor ekran shoxi |
| `src/pages/student/workspace/student-tests-page.tsx` | 🟡 MOSLASH | `1b11c089099a` | faqat tor ekran shoxi; urinishlar ro'yxati `Sheet variant="app"` |
| `src/pages/student/workspace/student-test-page.tsx` | 🟡 MOSLASH | `c19f95e8fe1a` | faqat tor ekran shoxi; qoralama `storage` da (`yolup.quiz-draft.<id>`, vebda `localStorage`); topshirilgan natija `fresh-results.ts` orqali uzatiladi (vebda `navigate` holati) |
| `src/pages/student/workspace/student-test-results-page.tsx` | 🟡 MOSLASH | `f4ebbee9f7aa` | faqat tor ekran shoxi; yangi topshirilgan natija `takeFreshResult` dan, aks holda urinishlar ro'yxatidan |
| `src/pages/student/workspace/student-analytics-page.tsx` | 🟡 MOSLASH | `eb41822dfbd3` | faqat tor ekran shoxi; ustunli diagramma oddiy `View` lar bilan |
| `src/pages/student/workspace/student-mock-page.tsx` | 🟡 MOSLASH | `b3ad759af7ab` | faqat tor ekran shoxi |
| `src/pages/student/workspace/student-mock-result-page.tsx` | 🟡 MOSLASH | `e295072ee733` | faqat tor ekran shoxi |
| `src/pages/student/workspace/student-homework-page.tsx` | 🟡 MOSLASH | `5b4b398b9667` | faqat tor ekran shoxi |
| `src/pages/student/workspace/student-homework-item-page.tsx` | 🟡 MOSLASH | `a1bd139eb878` | faqat tor ekran shoxlari; fayl `pickDocument` bilan, qoralama `storage` da (`yolup.homework-draft.<id>`); topshiriq ko'rinishi `SubmissionPreview` |
| `src/pages/student/workspace/fresh-results.ts` | 🆕 MOBIL | `—` | yangi topshirilgan test natijasini natija sahifasiga uzatadi — expo-router'da `navigate(..., { state })` yo'q |
| `src/pages/student/exams/student-exam-page.tsx` | 🟡 MOSLASH | `1a00701cb78f` | mobilda `pages/exams/student-exam-page.tsx`; orqaga va chiqish mock ro'yxatiga, qidiruv `ROUTES.student.search` |
| `src/pages/student/homework-board/student-homework-board-page.tsx` | 🟡 MOSLASH | `a8bc4e23ee83` | mobilda `pages/homework/student-homework-board-page.tsx`; vebdagidek eski sahifa; topshirgach `dismissTo` bilan stekdagi vazifa sahifasiga qaytadi |
| `src/shared/api/api-client.ts` | 🟡 MOSLASH | `debfdc44dc73` | navigator.onLine -> NetInfo |
| `src/shared/api/api-config.ts` | 🟢 NUSXA | `b9623d76c36b` | — |
| `src/shared/api/api-error.ts` | 🟢 NUSXA | `7d4c958b715c` | — |
| `src/shared/api/api-response.ts` | 🟢 NUSXA | `d0edd5c3cf73` | — |
| `src/shared/api/apply-api-field-errors.ts` | 🟢 NUSXA | `1225a6e9c6b2` | — |
| `src/shared/api/index.ts` | 🟡 MOSLASH | `0f236a6c3e69` | barrel — veb bilan bir xil ro'yxat |
| `src/shared/api/media-url.ts` | 🟡 MOSLASH | `c3a91c2f41af` | location.origin -> env.apiUrl (mobilda proxy yo'q) |
| `src/shared/api/pagination.ts` | 🟢 NUSXA | `ff2532083aa9` | — |
| `src/shared/api/realtime-socket.ts` | 🔴 QAYTA | `2bf996aa78b2` | AppState + NetInfo; fon rejimida uziladi, qaytganda onResync |
| `src/shared/api/refresh-token-manager.ts` | 🔴 QAYTA | `cb5664535ecb` | CustomEvent o'rniga obuna ro'yxati; announceSessionChange va refresh poyga tuzatishi olindi; `expireSession` obunachilarni chaqiradi |
| `src/shared/api/request-interceptor.ts` | 🟡 MOSLASH | `f99b14fa30f2` | + `X-Device-Name` sarlavhasi (seanslarda qurilma nomi; vebda brauzer o'zi aniqlanadi) |
| `src/shared/api/response-interceptor.ts` | 🟢 NUSXA | `283cbb28d435` | — |
| `src/shared/api/token-storage.ts` | 🔴 QAYTA | `61b05f24a523` | SecureStore + xotira keshi; interfeys va sinxronligi bir xil. `readUser/writeUser` — profil tokenlar bilan Keychain'da (2 KB dan katta bo'lsa faqat xotirada); `setTokens` profil keshini O'CHIRMAYDI (vebda refresh har safar o'chiradi) |
| `src/shared/config/env.ts` | 🔴 QAYTA | `5109da61b7b3` | import.meta.env -> expo-constants; o'sha zod sxemasi |
| `src/shared/config/index.ts` | 🟡 MOSLASH | `2a1ff6fd4d60` | vebdagi ro'yxat + mobilga xos `FEATURES` |
| `src/shared/config/features.ts` | 🆕 MOBIL | `—` | vaqtincha o'chirilgan imkoniyatlar: `smsVerification` (parol tiklash, 2FA) |
| `src/shared/config/routes.ts` | 🟢 NUSXA | `998939695656` | — |
| `src/shared/constants/index.ts` | 🟢 NUSXA | `c06257bbb1f3` | — |
| `src/shared/constants/roles.ts` | 🟢 NUSXA | `2f90f03f91dc` | — |
| `src/shared/constants/storage-keys.ts` | 🟢 NUSXA | `51ef121d70fd` | — |
| `src/shared/i18n/i18n.ts` | 🟡 MOSLASH | `d75c48501e18` | `import.meta.glob` (Vite) o'rniga qo'lda import; `mobile` bo'limi qo'shilgan; suspense o'chirilgan |
| `src/shared/i18n/intl-locale.ts` | 🟢 NUSXA | `631f809dda19` | — |
| `src/shared/i18n/locales/**` | 🟢 NUSXA | `—` | 18 bo'lim × 3 til, vebdan bayt-bayt; `mobile.json` mobilga xos |
| `src/shared/model/language.store.ts` | 🔴 QAYTA | `b87fa05a508b` | zustand `persist` (localStorage) o'rniga MMKV; qurilma tili `Intl` dan |
| `src/shared/model/text-size.store.ts` | 🔴 QAYTA | `f61042795fd4` | `persist` o'rniga MMKV; `--text-scale` o'rniga `Text` komponenti ko'paytiruvchisi (`text-scale.tsx`) |
| `src/shared/model/use-online-status.ts` | 🔴 QAYTA | `db9f2e6a64f2` | `navigator.onLine` o'rniga NetInfo (`isInternetReachable` ustuvor) |
| `src/shared/lib/app-state.ts` | 🆕 MOBIL | `—` | Mobilga xos, veb'da yo'q |
| `src/shared/lib/date.ts` | 🟢 NUSXA | `89c75c616d39` | — |
| `src/shared/lib/download.ts` | 🔴 QAYTA | `cf70cbf439d2` | <a download> -> expo-file-system + Share; ASYNC bo'ldi; `blobToBase64` eksport (fayl ko'ruvchidagi PDF uchun) |
| `src/shared/lib/file-kind.ts` | 🟢 NUSXA | `df2f7ffd380a` | — |
| `src/shared/lib/index.ts` | 🟡 MOSLASH | `798c80d346e3` | barrel + app-state/network eksportlari; `pdf` (pdfjs) eksporti yo'q — pdf.js WebView ichida (`shared/ui/file-viewer.tsx`); qo'shimcha `blobToBase64` |
| `src/shared/lib/pdf.ts` | 🟡 MOSLASH | `efa7cfa78c01` | mobilda yo'q — pdf.js (3.11, UMD) WebView ichida cdnjs'dan yuklanadi (`shared/ui/file-viewer.tsx`) |
| `src/shared/lib/network.ts` | 🆕 MOBIL | `—` | Mobilga xos, veb'da yo'q |
| `src/shared/lib/sanitize-html.ts` | 🔴 QAYTA | `74673b9ade61` | DOMPurify -> regex; WebView CSP bilan birga |
| `src/shared/lib/storage.ts` | 🔴 QAYTA | `dbaa996f6921` | localStorage -> MMKV; interfeys bir xil |
| `src/shared/lib/utils.ts` | 🟢 NUSXA | `4dd93deacc31` | — |
| `src/shared/types/auth.ts` | 🟢 NUSXA | `1868a164d8f0` | — |
| `src/shared/types/chat.ts` | 🟢 NUSXA | `855595f833bd` | — |
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
| `src/widgets/group-workspace/group-workspace.tsx` | 🟡 MOSLASH | `266930481ee5` | tablar va o'qituvchi bo'limlari (`lessons-panel.tsx`, `teacher-assignments.tsx`, `attendance-section.tsx`) tor ekran variantida; o'quvchi bo'limlari `widgets/student-group-workspace/`; o'qituvchida vazifa bosilganda hozircha `AssignmentDetailSheet` (vebdagidek dialog) |
| `src/widgets/group-workspace/lesson-board.tsx` | 🟡 MOSLASH | `171a2d28a3e0` | faqat tor ekran varianti; yakunlangan darsda `finishedStatsShort` |
| `src/widgets/group-workspace/cancel-lesson-dialog.tsx` | 🟡 MOSLASH | `010e46108b01` | `ModalCard` -> `Sheet variant="app"` |
| `src/widgets/group-workspace/task-cards.tsx` | 🟡 MOSLASH | `645a84312ccc` | "⋮" menyusi `PopoverMenu`; `mobile-assignment-list.tsx` va `add-quiz-menu.tsx` ham shu faylda |
| `src/widgets/group-workspace/mobile-assignment-list.tsx` | 🟡 MOSLASH | `aa1277096592` | mobilda `task-cards.tsx` ichida (`MobileAssignmentList`) |
| `src/widgets/group-workspace/add-quiz-menu.tsx` | 🟡 MOSLASH | `2c72f4ae7e85` | mobilda `task-cards.tsx` ichida (`AddQuizMenu`, `PopoverMenu`) |
| `src/widgets/group-workspace/panel-heading.tsx` | 🟡 MOSLASH | `48e4699dd96e` | — |
| `src/widgets/student-group-workspace/student-group-workspace.tsx` | 🟡 MOSLASH | `6e635a063f9c` | faqat tor ekran shoxi (`StudentGroupSection`) — guruh chatidagi "Darslar" va "Vazifalar" tablari |
| `src/widgets/student-group-workspace/student-lessons.tsx` | 🟡 MOSLASH | `57670cb22da8` | faqat tor ekran varianti; baholash `RateLessonSheet` |
| `src/widgets/student-group-workspace/student-tasks.tsx` | 🟡 MOSLASH | `ad5dcf56cfb0` | faqat tor ekran varianti |
| `src/widgets/student-group-workspace/use-assignment-rows.ts` | 🟡 MOSLASH | `4572affcc7ef` | `navigate` o'rniga `router.push(..., { withAnchor: true })` |
| `src/widgets/forward-dialog/forward-dialog.tsx` | 🟡 MOSLASH | `c22c79a14efe` | pastki oyna (`Sheet variant="app"`) |
| `src/pages/teacher/conversation-page.tsx` | 🟡 MOSLASH | `389086575b2b` | mobilda `pages/chats/conversation-page.tsx` (guruh qismi `group-workspace.tsx` dagi chat bilan birga). Tor ekrandagidek jonli dars chizig'i yo'q. O'quvchida vazifa kartasi vazifa sahifasini ochadi va topshirilganini ko'rsatadi; e'lonlar kanalida yozish maydoni o'rniga ogohlantirish. Qadalgan xabarni olib tashlash `pinned: true` bilan (vebda `false` ketadi — xabar qayta qadaladi, `useChat.pinMessage` ma'nosiga zid) |
| `src/widgets/live-room/live-room.tsx` | 🟡 MOSLASH | `4ee83c735ebd` | tor ekran shoxi (`mobile-live-room.tsx` bilan bitta faylda): sahna, 3 ustunli plitkalar, pastki panel; brauzerdagi yozuv va REC belgisi yo'q (yozuv server tomonda); `MediaPermissionDialog` yo'q — ruxsatni Android so'raydi; doska to'liq ekranda hozircha `BoardSurface` (5-bosqichda `BoardPanel` mobil ko'rinishi) |
| `src/widgets/live-room/mobile-live-room.tsx` | 🟡 MOSLASH | `738a487f3ec9` | mobilda `live-room.tsx` ichida (`RoomBody`, `ToolbarButton`, `CameraTile`) |
| `src/widgets/live-room/live-room-state.tsx` | 🟡 MOSLASH | `83ff7305c2e7` | faqat tor ekran varianti (doim qorong'i) |
| `src/widgets/live-room/use-elapsed-seconds.ts` | 🟢 NUSXA | `6a64d9089071` | — |

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
