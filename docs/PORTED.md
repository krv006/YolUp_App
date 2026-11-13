# Port manifesti

> **Bu fayl majburiy.** Veb loyihadan ko'chirilgan har bir fayl shu yerda
> qayd etiladi. Ro'yxatga kirmagan ko'chirma — PR'da blocker
> (`docs/MOBILE_PLAN.md` §18.4).

- **Manba:** `Edu_Front` — port bosqichma-bosqich ketgan, har faylning hash'i
  o'zi ko'chirilgan paytdagi veb holatini bildiradi. 2026-11-13 dan domen
  qatlami veb `6469eb6` bilan sinxron; UI qatlami bosqichma-bosqich ko'chirilmoqda
  (`feat/veb-noyabr-sync`).
- **Oxirgi yangilanish:** 2026-11-13 (veb `6469eb6` — 3–13-noyabr, veb PR #174–#191)
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

- 🟢 NUSXA: **241**
- 🟡/🔴 moslashtirilgan: **374**
- 🆕 mobilga xos: **17**
- Jami: **632**

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
| `src/modules/analytics/lib/analytics.mappers.ts` | 🟢 NUSXA | `1035e23dddbc` | — |
| `src/modules/analytics/model/analytics.queries.ts` | 🟢 NUSXA | `daf5ad9278e5` | — |
| `src/modules/analytics/ui/trend-line-chart.tsx` | 🟡 MOSLASH | `3164201c6a1e` | hisob-kitob bir xil; `<svg>` -> `react-native-svg`; sichqoncha o'rniga bosish, qiymatlar vebdagidek tepada (`chart-tooltip.tsx`); o'q belgisi kichik oraliqda kasr bilan |
| `src/modules/analytics/ui/trend-stacked-bar-chart.tsx` | 🟡 MOSLASH | `96a4de5f614c` | hisob-kitob bir xil; `<svg>` -> `react-native-svg`; sichqoncha o'rniga bosish, qiymatlar tepada |
| `src/modules/attendance/api/attendance.api.ts` | 🟢 NUSXA | `e5570b97307f` | — |
| `src/modules/attendance/api/attendance.dto.ts` | 🟢 NUSXA | `3e46ec8e25ea` | — |
| `src/modules/attendance/api/attendance.endpoints.ts` | 🟢 NUSXA | `83cfca43b8de` | — |
| `src/modules/attendance/index.ts` | 🟡 MOSLASH | `512ebac188d1` | generatsiya: veb barrel minus `ui/` eksportlari (port-barrels.mjs) |
| `src/modules/attendance/lib/attendance.mappers.ts` | 🟢 NUSXA | `52babbbc63ad` | — |
| `src/modules/attendance/lib/group-by-lesson.ts` | 🟢 NUSXA | `2a79a46a78ac` | — |
| `src/modules/attendance/model/attendance.queries.ts` | 🟢 NUSXA | `06c1277db8a4` | — |
| `src/modules/auth/api/auth.api.ts` | 🟢 NUSXA | `90849f717c5f` | — |
| `src/modules/auth/api/auth.dto.ts` | 🟢 NUSXA | `ede3a935bf57` | — |
| `src/modules/auth/api/auth.endpoints.ts` | 🟢 NUSXA | `1907df71b8d3` | — |
| `src/modules/auth/index.ts` | 🟡 MOSLASH | `c552ad7b6ca8` | generatsiya: veb barrel minus `ui/` eksportlari (port-barrels.mjs) |
| `src/modules/auth/lib/auth-session.ts` | 🟢 NUSXA | `4e39458e320b` | — |
| `src/modules/auth/lib/auth.mappers.ts` | 🟢 NUSXA | `2a54ec3d3eef` | — |
| `src/modules/auth/lib/uz-phone.ts` | 🟢 NUSXA | `3c5a2a144ed8` | — |
| `src/modules/exam/api/exam.dto.ts` | 🟢 NUSXA | `6f742518e3b5` | — |
| `src/modules/exam/lib/exam.mappers.ts` | 🟢 NUSXA | `0a9d7d580f61` | — |
| `src/modules/auth/lib/describe-reset-error.ts` | 🟢 NUSXA | `e4d7589ed136` | — |
| `src/modules/auth/lib/describe-two-factor.ts` | 🟢 NUSXA | `20c09ae21e84` | — |
| `src/modules/auth/lib/describe-user-agent.ts` | 🟢 NUSXA | `ee0799ca7c53` | — |
| `src/modules/auth/lib/resolve-home-route.ts` | 🟢 NUSXA | `1e015eda25e9` | — |
| `src/modules/auth/lib/teacher-approval.ts` | 🟢 NUSXA | `ea465e71f081` | — |
| `src/modules/auth/model/auth.mutations.ts` | 🟢 NUSXA | `1b5248ebbf40` | — |
| `src/modules/auth/model/auth.queries.ts` | 🟢 NUSXA | `5cb308b135c3` | — |
| `src/modules/auth/model/auth.schemas.ts` | 🟢 NUSXA | `438ed07056d1` | — |
| `src/modules/auth/model/auth.store.ts` | 🟡 MOSLASH | `845be1f01a71` | window hodisalari -> refreshTokenManager; tab obunasi yo'q; sessiya raqami olindi; til sinxroni vebdagidek. Profil keshi (`USER_SNAPSHOT`) — modul yuklanganda emas, `bootstrap()` ichida o'qiladi (tokenlar `hydrate()` dan keyin keladi); yangi sessiyada `beginSession` keshni tozalaydi; serverdagi mavzu va matn o'lchami (`syncPreferencesFromServer`) — vebdagi `useThemeStore` o'rniga `useAppearanceStore` |
| `src/modules/auth/model/use-role-routes.ts` | 🟢 NUSXA | `53dfe7671897` | — |
| `src/modules/notification/lib/notification-display.ts` | 🟡 MOSLASH | `a8aaf67657ba` | `notificationLines` — `DOMParser` o'rniga `htmlToPlainText` (RN'da DOM yo'q); qolgani bayt-bayt bir xil |
| `src/modules/voice/model/voice-ui.store.ts` | 🟢 NUSXA | `cad4aa4b6000` | — |
| `src/shared/styles/design-tokens.css` | 🔴 QAYTA | `266c5478b127` | `src/shared/ui/ds-tokens.json` ga generatsiya (`npm run build:ds-tokens`): `@theme` dagi rang, matn, soya, gradient nomlari ikkala tema uchun yechilgan; ishlatish — `shared/ui/ds.tsx` |
| `src/modules/auth/model/use-auth.ts` | 🟢 NUSXA | `795c1de32280` | — |
| `src/modules/board/api/board.api.ts` | 🟢 NUSXA | `373a33590696` | — |
| `src/modules/board/api/board.dto.ts` | 🟢 NUSXA | `6cb20114035f` | — |
| `src/modules/board/api/board.endpoints.ts` | 🟢 NUSXA | `7834515903b6` | — |
| `src/modules/board/constants/board.constants.ts` | 🟢 NUSXA | `e0ce993a74f7` | — |
| `src/modules/board/index.ts` | 🟡 MOSLASH | `f0109eadee57` | generatsiya: veb barrel minus `ui/` + mobil doska UI eksportlari |
| `src/modules/board/lib/board-channel.ts` | 🟢 NUSXA | `561ddd1ea25e` | — |
| `src/modules/board/lib/board-flow.ts` | 🟢 NUSXA | `bbb53245ccda` | — |
| `src/modules/board/lib/board-socket-manager.ts` | 🟢 NUSXA | `9963093db153` | — |
| `src/modules/board/lib/board.geometry.ts` | 🟢 NUSXA | `cca6c3277bc2` | — |
| `src/modules/board/lib/board.mappers.ts` | 🟢 NUSXA | `23453aa274f5` | — |
| `src/modules/board/lib/formula-palette.ts` | 🟢 NUSXA | `adae5f14b4f7` | — |
| `src/modules/board/lib/periodic-board.ts` | 🟢 NUSXA | `d56c7a889fd5` | — |
| `src/modules/board/lib/rich-text.ts` | 🟡 MOSLASH | `43bf04bbb519` | htmlToLines ko'chirilmadi (contenteditable + getComputedStyle); qolgan sof funksiyalar (`linesToHtml`, `plainTextToLines` ham) bir xil |
| `src/modules/board/model/board.queries.ts` | 🟢 NUSXA | `28fc90d644a1` | — |
| `src/modules/board/model/use-board-channel.ts` | 🟢 NUSXA | `734d17e2d1f4` | — |
| `src/modules/board/model/use-board-realtime.ts` | 🟢 NUSXA | `e74d4bba5e3b` | — |
| `src/modules/board/ui/away-students-notice.tsx` | 🟡 MOSLASH | `c1402bd61e1f` | `useTeacherSignals` (vebdagidek); ko'rinish RN'da chizilgan (vebda `legacy.css` dagi `.away-students`) |
| `src/modules/board/ui/bohr-model.tsx` | 🔴 QAYTA | `f70cf5b9dfcf` | veb three.js/WebGL bilan 3D chizadi; mobilda Skia bilan 2D — `expo-gl`+`expo-three` faqat shu oynacha uchun og'ir, tekis aylanada esa elektronlarni sanash osonroq |
| `src/modules/board/ui/board-stroke.tsx` | 🟡 MOSLASH | `8162507a4b0c` | SVG o'rniga Skia tugunlari; shakl mantig'i (`strokeKindOf`, `arrowHeadPoints`) veb'dan; formatlangan matn `rich-text-stroke.tsx` ga ajratilgan |
| `src/modules/board/ui/board-font.ts` | 🆕 MOBIL | `—` | Skia shrift oilasi; vebda brauzer shriftni o'zi tanlaydi, Skia'da oila nomi aniq berilishi shart |
| `src/modules/board/ui/rich-text-stroke.tsx` | 🆕 MOBIL | `—` | veb `board-stroke.tsx` dagi `lines` shoxi; Skia'da har run uchun `matchFont` va qo'lda joylashtirish, tagiga chizish qo'lda `Rect` bilan |
| `src/modules/board/ui/rich-text-input.tsx` | 🔴 QAYTA | `006238ccc013` | faqat `variant="mobile"`; `contenteditable` + `execCommand` RN'da yo'q: format QATOR darajasida (qalin/kursiv/tagi chizilgan butun qatorga), ro'yxat belgisi matnning o'zida ("• ", "1. ") — Enter'da davom etadi, bo'sh bandda Enter ro'yxatdan chiqaradi; natija `TextLineDto[]` |
| `src/modules/board/ui/board-toolbar.tsx` | 🟡 MOSLASH | `953af4036363` | mobilda ishlatilmaydi (vebda faqat keng ekran paneli); `BoardTool` turi `board-mobile.tsx` da |
| `src/modules/board/ui/board-panel.tsx` | 🟡 MOSLASH | `9bf063c44073` | faqat tor ekran shoxi (`mobile` majburiy) — mobilda `board-surface.tsx`: Skia kanvas eni bo'yicha sig'adi (`fit="width"`); kanvas balandligi = server doskasi (`state.height`), karta doska nisbatida — vebdagidek karta nisbatiga cho'zilmaydi (server pastki nuqtalarni `height` bilan kesadi, 2026-11-13); nuqtali fon Skia `Points`; matn kartasi kanvas tashqarisida (klaviatura ochilganda kanvas kichrayadi, karta kesilmaydi); klaviatura joyi faqat karta ochiqligida (`useReanimatedKeyboardAnimation`). Keng ekran shoxi yo'q; o'quvchining uy vazifasi doskasi ham shu sirtda (`source` bilan) |
| `src/modules/board/ui/board-mobile.tsx` | 🟡 MOSLASH | `f4b6b964103d` | ikonkalar `lucide-react-native`; pastki qatorda sahifa almashtirgich va "+ Sahifa" ichki chetlari 2–4px kichikroq — RN shrifti kengroq, aks holda tugma ekran chetiga tegadi; `BoardTool` turi shu yerda |
| `src/modules/board/ui/board-pages-sheet.tsx` | 🟡 MOSLASH | `02563fb2ecab` | faqat tor ekran varianti (`Sheet variant="app" compact`); eskizlar Skia'da (`xMidYMin slice`); nomni o'zgartirish `onEndEditing` da |
| `src/modules/board/ui/board-preview.tsx` | 🟡 MOSLASH | `a1620aaa5fb5` | Skia `BoardCanvas` faqat o'qish rejimida (vebda SVG) |
| `src/modules/board/ui/board-permission-dialog.tsx` | 🟡 MOSLASH | `cb442712481d` | faqat tor ekran varianti (`Sheet variant="app" compact`) |
| `src/modules/board/ui/erase-reason-dialog.tsx` | 🟡 MOSLASH | `71b533f95680` | faqat tor ekran varianti (`MobileAlertDialog`: `titleVariant="title-lg"`, `shift={24}` — veb `titleClassName`, `className`) |
| `src/modules/board/ui/formula-palette.tsx` | 🟡 MOSLASH | `c3db89716ff5` | MathLive placeholder'lari (#0, #?) olib tashlanadi — mobilda LaTeX oddiy TextInput da yoziladi |
| `src/modules/board/ui/math-markup.tsx` | 🔴 QAYTA | `13d0ea12199d` | MathLive renderi o'rniga KaTeX (CDN) WebView'da; `\placeholder{}` katakchaga almashtiriladi (KaTeX bilmaydi); doskada `framed={false}` — chapga tekislangan, rang chiziqdan. Doskada WebView `scale` bilan kichraytirilmaydi (Android Modal ochilganda asl o'lchamga qaytaradi) — shrift masshtabda, joyi `translate` bilan |
| `src/modules/board/ui/math-field-input.tsx` | 🔴 QAYTA | `a6881a5e8d91` | MathLive Web Component RN'da yo'q: LaTeX matn sifatida yoziladi, ostida KaTeX ko'rinishi; MathLive klaviaturasi o'rniga telefon klaviaturasi |
| `src/modules/board/ui/periodic-table-dialog.tsx` | 🟡 MOSLASH | `deec24e4b8ce` | faqat tor ekran varianti (`Sheet variant="app"`); 18 ustunli panjara absolut joylashuv bilan (RN'da CSS grid yo'q), katak ranglari `form-skin.css` dagi `.periodic-chip--*` |
| `src/modules/conversation/api/conversation.api.ts` | 🟢 NUSXA | `f552f6d58182` | — |
| `src/modules/conversation/api/conversation.dto.ts` | 🟢 NUSXA | `f4e0844c5e38` | — |
| `src/modules/conversation/api/conversation.endpoints.ts` | 🟢 NUSXA | `1073466fe932` | — |
| `src/modules/conversation/constants/direct-status.ts` | 🟢 NUSXA | `7eddfaf05b6d` | — |
| `src/modules/conversation/index.ts` | 🟡 MOSLASH | `2e7c6828564e` | generatsiya: veb barrel minus `ui/` eksportlari (port-barrels.mjs) |
| `src/modules/conversation/lib/conversation.mappers.ts` | 🟢 NUSXA | `8e98456d69fc` | — |
| `src/modules/conversation/model/conversation-filter.store.ts` | 🟢 NUSXA | `71e244316f8a` | — |
| `src/modules/conversation/model/conversation.keys.ts` | 🟢 NUSXA | `8dedfc078009` | — |
| `src/modules/conversation/model/use-conversations.ts` | 🟢 NUSXA | `a691aeeaad5f` | — |
| `src/modules/conversation/ui/chat-header.tsx` | 🟡 MOSLASH | `b01e173768b0` | faqat tor ekran varianti: tanlash sarlavhasi, qidiruv rejimi, guruh rasmi, ovozli xona tugmasi; `topInset` — holat paneli ostidan boshlanadi; ma'lumot oynasi sahifada (`onOpenInfo`) |
| `src/modules/conversation/ui/mobile-group-info.tsx` | 🟡 MOSLASH | `5731b8df1463` | mobilda `group-info-screen.tsx` (`variant="screen"`, to'liq ekran Modal); kursni tahrirlash/o'chirish va boshqaruv (`conversation-info-panel.tsx` dagi) shu faylda; guruh rasmi galereyadan; o'quvchida o'qituvchi qatorida "O'qituvchiga yozish" (`MemberRow` `action`); fayllar/media tablari `RoomAttachments` |
| `src/modules/conversation/model/new-conversation.store.ts` | 🟢 NUSXA | `a1588dade042` | — |
| `src/modules/conversation/ui/conversation-actions-sheet.tsx` | 🟡 MOSLASH | `ffc54aadd8a9` | faqat telefon varianti (`focusMenu`): qator `measureInWindow` bilan o'lchanib Modal'da joyida ko'tariladi; o'chirish `ConfirmDialog` orqali |
| `src/modules/conversation/ui/new-conversation-dialog.tsx` | 🟡 MOSLASH | `f13bed00fc32` | mobilda `new-group-sheet.tsx` (tor ekran varianti, `Sheet variant="app"`); QR — o'sha `qrcode` kutubxonasi, SVG bilan chiziladi; "Ulashish" — tizim `Share`; oylik to'lov maydoni (`formatFee`) vebda faqat keng ekranda — mobilda yo'q |
| `src/widgets/chat-shell/mobile-conversation-list.tsx` | 🟡 MOSLASH | `c36fabdd3827` | mobilda `pages/chats/chats-page.tsx`; uzoq bosish `onLongPress` (450ms); tablardagi o'qilmaganlar soni `MobileSegment` `badge` |
| `src/widgets/chat-shell/conversation-row.tsx` | 🟡 MOSLASH | `ca707b0bff20` | mobilda `widgets/chat-shell/conversation-row.tsx`; "yozmoqda" `useRoomTyping` dan (veb #165) |
| `src/widgets/chat-shell/use-conversation-list.ts` | 🟢 NUSXA | `581727dc7f31` | mantiq bir xil, faqat mobil import yo'llari |
| `src/widgets/mobile-tab-bar/mobile-tab-bar.tsx` | 🟡 MOSLASH | `da37f448a0b4` | mobilda `providers/role-tabs.tsx` dagi `FloatingTabBar` (`variant="floating"`); faqat bo'limlarning o'zida ko'rinadi; eski bo'limlarga `inset`, Workspace'da bo'shliq stack bosh sahifasida (`useFloatingTabInset`); faol tab soyasi doim turadi, faol emasida shaffof (`dsShadowHidden`) — Android keyin qo'shilgan `boxShadow` ga radius qo'llamaydi |
| `src/widgets/mobile-user-header/mobile-user-header.tsx` | 🟡 MOSLASH | `458790186999` | qo'ng'iroq — `MobileRoundButton` + `lucide` Bell, o'qilmagan bo'lsa qizil nuqta |
| `src/widgets/notification-link/use-open-notification-link.ts` | 🟡 MOSLASH | `9d79dd0e5c78` | o'qituvchi va o'quvchi havolalari vebdagidek (vazifa, test va uning natijalari, mock natijalari yoki ro'yxati); admin uchun `teacher` havolasi; sertifikat va murojaat havolalari profilga (`/profile/certificates`, `/profile/help?ticket=`); admin sertifikat va murojaat havolalari veb `admin-dashboard-page` `openNotificationLink` dagidek; ota-onada `widgets/parent-shell/use-parent-notification-link.ts` |
| `src/pages/teacher/dashboard/teacher-dashboard-page.tsx` | 🟡 MOSLASH | `1fe27bcd6604` | faqat tor ekran shoxi; mobilda `pages/dashboard/teacher-dashboard-page.tsx` (`mobile-dashboard.tsx` bilan birga); Jadval va Vazifalar havolalari mobilning hozirgi marshrutlariga; "Tekshirish kerak" dagi vazifalar soni `assignmentsPending` dan (vebda `toReview.length` — ro'yxat API'si `submissions` bermagani uchun doim 0) |
| `src/pages/teacher/dashboard/mobile-dashboard.tsx` | 🟡 MOSLASH | `1abc9723488c` | mobilda `pages/dashboard/teacher-dashboard-page.tsx` ichida |
| `src/pages/teacher/dashboard/mobile-onboarding.tsx` | 🟡 MOSLASH | `62a51e7e3e44` | mobilda `pages/dashboard/mobile-onboarding.tsx`; xira fon panel ostida (sahifa ichida), karta va ramka ustida |
| `src/pages/notifications/notifications-page.tsx` | 🟡 MOSLASH | `f349ef9397e9` | `NotificationHtml` o'rniga birinchi `<b>` sarlavha qatori + matn; ota-ona va admin ham shu sahifani ishlatadi (vebda faqat o'qituvchi/o'quvchi) |
| `src/pages/workspace/workspace-search-page.tsx` | 🟡 MOSLASH | `cedaa3fcba18` | o'qituvchida test qoralamasi muharrirni, e'lon qilingani natijalarni ochadi; o'quvchida test sahifasini (vebdagidek) |
| `src/modules/course/api/course.api.ts` | 🟢 NUSXA | `be53118d3dac` | — |
| `src/modules/course/api/course.dto.ts` | 🟢 NUSXA | `75ffaf92bbaa` | — |
| `src/modules/course/api/course.endpoints.ts` | 🟢 NUSXA | `3d24c89fb947` | — |
| `src/modules/course/index.ts` | 🟡 MOSLASH | `198e8faafc3f` | generatsiya: veb barrel minus `ui/` eksportlari (port-barrels.mjs) |
| `src/modules/course/lib/course.mappers.ts` | 🟢 NUSXA | `a2f285c2215d` | — |
| `src/modules/course/model/course.queries.ts` | 🟢 NUSXA | `ddc5a3066415` | — |
| `src/modules/course/ui/add-student-dialog.tsx` | 🟡 MOSLASH | `588956ed9abf` | mobilda `add-student-sheet.tsx` (`Sheet variant="app"`): qidiruv, belgilab qo'shish, yangi hisob oynasi, taklif havolasi |
| `src/modules/course/ui/invite-link-dialog.tsx` | 🟡 MOSLASH | `b1628c4dd95a` | mobilda `invite-link-sheet.tsx` (`Sheet variant="app"`); muddat `MobilePickerField`; nusxalash `expo-clipboard`, ulashish RN `Share` |
| `src/modules/course/ui/join-requests-dialog.tsx` | 🟡 MOSLASH | `2860aeff45ba` | mobilda `join-requests-sheet.tsx`; vaqt `formatRelativeShort` (Hermes'da `Intl.RelativeTimeFormat` yo'q) |
| `src/modules/live/ui/lesson-invite-dialog.tsx` | 🟡 MOSLASH | `8cf64f3ff09e` | mobilda `lesson-invite-sheet.tsx` — faqat tor ekran varianti; havola — vebdagi dars manzili (`env.apiUrl` + `/live/:id`) |
| `src/pages/join/join-course-page.tsx` | 🟡 MOSLASH | `50b9d49bc41c` | marshrut `app/j/[code].tsx`. VEBDA bu sahifa `app-router` ga ULANMAGAN. "Guruhni ochish" chatlar ro'yxatiga olib boradi (mobilda kurs sahifasi yo'q, guruh chat ichida) |
| `src/modules/course/ui/course-members-section.tsx` | 🟡 MOSLASH | `b6d72beb8504` | mobilda ishlatilmaydi — vebda faqat keng ekranda; tor ekranda kursli guruh ma'lumoti `MobileGroupInfo` (mobilda `group-info-screen.tsx`) |
| `src/modules/course/api/club.api.ts` | 🟢 NUSXA | `8e55ba23d474` | — |
| `src/modules/course/model/club.queries.ts` | 🟢 NUSXA | `b4ef4cebb515` | — |
| `src/modules/homework/api/homework.api.ts` | 🟢 NUSXA | `80a5f8015a7b` | — |
| `src/modules/homework/api/homework.dto.ts` | 🟢 NUSXA | `7ba075efda04` | — |
| `src/modules/homework/api/homework.endpoints.ts` | 🟢 NUSXA | `9c91399ac78c` | — |
| `src/modules/homework/constants/homework.constants.ts` | 🟢 NUSXA | `fccf69310542` | — |
| `src/modules/homework/index.ts` | 🟡 MOSLASH | `30553969e640` | generatsiya: veb barrel minus `ui/` eksportlari (port-barrels.mjs) |
| `src/modules/homework/lib/homework-validation.ts` | 🟢 NUSXA | `d1a936efe3b5` | — |
| `src/modules/homework/lib/homework.mappers.ts` | 🟢 NUSXA | `099eadbda744` | — |
| `src/modules/homework/model/homework.queries.ts` | 🟢 NUSXA | `17702116341c` | — |
| `src/modules/homework/model/use-homework-board.ts` | 🟡 MOSLASH | `bed68bc9743a` | brauzerning `beforeunload` ogohlantirishi olib tashlandi; chiqishdagi oxirgi saqlash qoldi |
| `src/modules/homework/ui/homework-report-view.tsx` | 🟡 MOSLASH | `e63f770dcde0` | portal bloklari (`shared/ui/portal.tsx`) bilan; ko'rsatkichlar tor ekrandagidek bir ustun |
| `src/modules/homework/ui/homework-result-dialog.tsx` | 🟡 MOSLASH | `b82a8abfa8af` | faqat tor ekran varianti (to'liq ekran Modal); eski `homework-result-sheet.tsx` ota-ona ekranida va xabar kartasidagi oynada qoladi |
| `src/modules/homework/ui/homework-message-card.tsx` | 🟡 MOSLASH | `ec1425959edf` | faqat tor ekran (`compact`) kartasi; natijalar `AssignmentDetailSheet` da |
| `src/modules/homework/lib/google-form.ts` | 🟢 NUSXA | `7a1ec07d2db7` | — |
| `src/modules/homework/lib/grade-display.ts` | 🟢 NUSXA | `c0fba5064925` | — |
| `src/modules/homework/lib/homework-answers.ts` | 🟢 NUSXA | `61cac205af99` | — |
| `src/modules/homework/lib/homework-questions.ts` | 🟢 NUSXA | `8968f8e4260b` | — |
| `src/modules/homework/lib/submission-ai-state.ts` | 🟢 NUSXA | `d4637ecf237c` | — |
| `src/modules/homework/model/use-question-drafts.ts` | 🟢 NUSXA | `ac11f86fe110` | — |
| `src/widgets/homework-workspace/assignment-form-dialog.tsx` | 🟡 MOSLASH | `59d4cea990ba` | mobilda ishlatilmaydi — faqat ulanmagan `HomeworkWorkspace` ichida; vazifa formasi `pages/teacher/workspace/homework/assignment-form-dialog.tsx` qatoriga qarang |
| `src/widgets/homework-workspace/homework-workspace.tsx` | 🟡 MOSLASH | `73d9a0d04b48` | mobilda ishlatilmaydi — vebda ham ulanmagan (`/assignments` -> workspace vazifalari); vazifalar `pages/workspace/homework/` da |
| `src/widgets/homework-workspace/submission-review.tsx` | 🟡 MOSLASH | `5cc04acc90bb` | mobilda ishlatilmaydi — faqat ulanmagan `HomeworkWorkspace` ichida |
| `src/pages/teacher/workspace/homework/homework-detail-page.tsx` | 🟡 MOSLASH | `535cc61668ce` | tor ekran (`mobile-homework-detail.tsx` bilan birga) — mobilda `pages/workspace/homework/homework-detail-page.tsx`; harfli baho ("A'lo") matn sifatida (vebda `Number()` NaN beradi); orqaga — stack ichida (vazifalar ro'yxatiga) |
| `src/pages/teacher/workspace/workspace-home-page.tsx` | 🟡 MOSLASH | `e6eb617a7514` | faqat tor ekran shoxi; mobilda `pages/workspace/workspace-home-page.tsx`; "Tekshirilmagan" soni `submissionsPending` dan (vebda `item.submissions` — ro'yxat API'si bermagani uchun doim 0) |
| `src/pages/teacher/workspace/mobile-workspace-home.tsx` | 🟡 MOSLASH | `b8917e8df805` | mobilda `workspace-home-page.tsx` ichida; "+" menyusi `PopoverMenu` |
| `src/pages/teacher/workspace/homework/homework-list-page.tsx` | 🟡 MOSLASH | `cec5ff40f113` | faqat tor ekran shoxi; mobilda `pages/workspace/homework/homework-list-page.tsx` |
| `src/pages/teacher/workspace/homework/mobile-homework-list.tsx` | 🟡 MOSLASH | `d53e5e65c565` | mobilda `homework-list-page.tsx` ichida; kartadagi menyu `PopoverMenu` |
| `src/pages/teacher/workspace/analytics-page.tsx` | 🟡 MOSLASH | `ba900b109f48` | faqat tor ekran shoxi; mobilda `pages/workspace/analytics-page.tsx`; "Batafsil" — "Mening baholarim" (`profile/ratings`) |
| `src/pages/teacher/workspace/mobile-analytics.tsx` | 🟡 MOSLASH | `f5298ec97e37` | mobilda `analytics-page.tsx` ichida |
| `src/pages/teacher/workspace/ai-assistant-page.tsx` | 🟡 MOSLASH | `f7702322b4c9` | faqat tor ekran shoxi; mobilda `pages/workspace/ai-assistant-page.tsx`; `?view=jobs` stekka yangi sahifa bo'lib qo'shiladi (orqaga — formaga) |
| `src/pages/teacher/workspace/mobile-ai-assistant.tsx` | 🟡 MOSLASH | `7806da4a32e4` | mobilda `ai-assistant-page.tsx` ichida; fayllar `pickDocuments` + `toUploadFile` |
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
| `src/pages/teacher/workspace/test-results-page.tsx` | 🟡 MOSLASH | `bf75dec96d53` | faqat tor ekran shoxi; mobilda `pages/workspace/tests/test-results-page.tsx` |
| `src/pages/teacher/workspace/mobile-test-results.tsx` | 🟡 MOSLASH | `6affe467ba71` | mobilda `test-results-page.tsx` ichida |
| `src/pages/teacher/workspace/mock-exams-page.tsx` | 🟡 MOSLASH | `57eac45e8e4e` | faqat tor ekran shoxi; mobilda `pages/workspace/mock/mock-exams-page.tsx` |
| `src/pages/teacher/workspace/mobile-mock-list.tsx` | 🟡 MOSLASH | `4db71a917000` | mobilda `mock-exams-page.tsx` ichida; karta menyusi `PopoverMenu` |
| `src/pages/teacher/workspace/mock-results-page.tsx` | 🟡 MOSLASH | `f5c8824cd02f` | faqat tor ekran shoxi; mobilda `pages/workspace/mock/mock-results-page.tsx`; `?view=writing[&student=]` stekka yangi sahifa bo'lib qo'shiladi (orqaga — oldingi ko'rinishga) |
| `src/pages/teacher/workspace/mobile-mock-results.tsx` | 🟡 MOSLASH | `150eae3e7315` | mobilda `mock-results-page.tsx` ichida (jonli kuzatish, natijalar, esselar, AI tahlili) |
| `src/modules/exam/ui/exam-create-dialog.tsx` | 🟡 MOSLASH | `604186c23619` | faqat tor ekran varianti (`MobileScreenDialog`); bo'lim testi `<select>` o'rniga `MobileSelectSheet`; shablon izohi biroz zichroq (`letterSpacing`) — RN shriftda `tracking-tight` yetmaydi |
| `src/modules/exam/ui/exam-template-dialog.tsx` | 🟡 MOSLASH | `fd6c7ed2fb2d` | faqat tor ekran varianti (`MobileScreenDialog`); og'irlik `<select>` o'rniga `MobileSelectSheet` |
| `src/modules/exam/ui/exam-score-dialog.tsx` | 🟡 MOSLASH | `0231e7c33d65` | faqat tor ekran varianti (`Sheet variant="app"`) |
| `src/modules/exam/ui/exam-writing-review.tsx` | 🟡 MOSLASH | `73d0c81638ec` | mobilda yo'q — vebda keng ekran natijalari (`exam-results-view.tsx`) uchun; tor ekranda AI tahlili `mock-results-page.tsx` da |
| `src/pages/ai/ai-page.tsx` | 🟡 MOSLASH | `35afc5abef67` | mobilda yo'q — vebda ham hech qaysi marshrutga ulanmagan (`/teacher/ai` -> `/teacher/workspace/ai`) |
| `src/modules/quiz/ui/ai-quiz-creator.tsx` | 🟡 MOSLASH | `856cbf831cab` | mobilda yo'q — vebda faqat ulanmagan `pages/ai/ai-page.tsx` ishlatadi |
| `src/pages/teacher/workspace/homework/mobile-homework-detail.tsx` | 🟡 MOSLASH | `6c9eddbcac59` | mobilda `homework-detail-page.tsx` ichida; "⋮" — `PopoverMenu` |
| `src/pages/teacher/workspace/homework/homework-review-page.tsx` | 🟡 MOSLASH | `3e5314c8bd12` | faqat tor ekran varianti; `?s=` — `router.setParams`; izoh maydoni klaviatura ustida (`KeyboardAwareScrollView`) |
| `src/pages/teacher/workspace/homework/assignment-form-dialog.tsx` | 🟡 MOSLASH | `64e36282420d` | faqat tor ekran varianti (to'liq ekran Modal); mobilda `widgets/homework-workspace/assignment-form-dialog.tsx` (pages'ni widget import qila olmaydi) |
| `src/pages/teacher/workspace/homework/remind-dialog.tsx` | 🟡 MOSLASH | `dca5a552e063` | `AppDialog` -> `Sheet variant="app"` |
| `src/pages/teacher/workspace/homework/resubmit-dialog.tsx` | 🟡 MOSLASH | `3124cd8e0e49` | `AppDialog` -> `Sheet variant="app"` |
| `src/pages/teacher/workspace/homework/delete-assignment-dialog.tsx` | 🟡 MOSLASH | `81c16c551fbf` | faqat tor ekran (`ConfirmDialog`) |
| `src/pages/teacher/workspace/homework/submission-preview.tsx` | 🟡 MOSLASH | `8e34b745e05a` | rasm token bilan yuklanib keshga yoziladi (`writeBlobToCache`), `Image` bilan |
| `src/pages/teacher/workspace/homework/format-due.ts` | 🟢 NUSXA | `7e83c7c05b1f` | — |
| `src/modules/lesson/api/lesson.api.ts` | 🟢 NUSXA | `4d8bd859917e` | — |
| `src/modules/lesson/api/lesson.dto.ts` | 🟢 NUSXA | `efadc084ca96` | — |
| `src/modules/lesson/api/lesson.endpoints.ts` | 🟢 NUSXA | `c077868e576a` | — |
| `src/modules/lesson/index.ts` | 🟡 MOSLASH | `46d77f5abaa2` | generatsiya: veb barrel minus `ui/`; WEEKDAY_LABELS mobil UI fayliga ko'chdi |
| `src/modules/lesson/lib/lesson-calendar.ts` | 🟢 NUSXA | `76769eb5a69d` | — |
| `src/modules/lesson/lib/lesson-schedule.ts` | 🟢 NUSXA | `2ff11bc462bd` | — |
| `src/modules/lesson/lib/lesson-status.ts` | 🟢 NUSXA | `43afd26367df` | — |
| `src/modules/lesson/lib/lesson.mappers.ts` | 🟢 NUSXA | `73a2bf779da6` | — |
| `src/modules/lesson/model/lesson-view.store.ts` | 🟢 NUSXA | `31172199c0d6` | — |
| `src/modules/lesson/model/lesson.queries.ts` | 🟡 MOSLASH | `fc4ae3bb8cb0` | useFinishLesson: mijoz tomon MediaRecorder flush olib tashlandi (Egress server tomonda); `postRecording` va toast matni vebdagidek |
| `src/modules/lesson/model/schedule.store.ts` | 🟢 NUSXA | `—` | jadval ko'rinishi, tayanch sana va qadam (2026-10-20 qo'shildi) |
| `src/modules/lesson/ui/lesson-calendar.tsx` | 🟡 MOSLASH | `f4baf96b5725` | mobilda ishlatilmaydi (vebda ham hech qayerda chaqirilmaydi) |
| `src/modules/lesson/ui/live-lesson-bar.tsx` | 🟡 MOSLASH | `e1fdea2ab542` | mobilda ishlatilmaydi — veb tor ekranda jonli dars chizig'ini ko'rsatmaydi |
| `src/modules/lesson/ui/schedule-grid.tsx` | 🟡 MOSLASH | `4be7763e297a` | mobilda ishlatilmaydi — jadval yangi dizaynda `pages/schedule/mobile-schedule.tsx` (vebda ham faqat keng ekranda) |
| `src/modules/lesson/ui/schedule-sidebar.tsx` | 🟡 MOSLASH | `a33c07fd337b` | mobilda ishlatilmaydi (vebda faqat keng ekran) |
| `src/modules/lesson/ui/lesson-detail-dialog.tsx` | 🟡 MOSLASH | `fe03b39eee02` | mobilda ishlatilmaydi — jadvalda `pages/schedule/lesson-detail-drawer.tsx` |
| `src/modules/lesson/ui/lesson-create-dialog.tsx` | 🟡 MOSLASH | `e1ad0ea3713b` | mobilda ishlatilmaydi — jadvalda `pages/schedule/new-lesson-dialog.tsx`, guruhda `add-lesson-dialog.tsx` |
| `src/modules/lesson/ui/finish-lesson-dialog.tsx` | 🟡 MOSLASH | `9523cd3f01c7` | mobilda `lesson-sheets.tsx` dagi `FinishLessonSheet` (`ConfirmDialog`, tor ekran matni) |
| `src/modules/lesson/ui/star-rating.tsx` | 🟡 MOSLASH | `c837cb4c5fb6` | yorliqlar `accessibilityLabel`; teginish maydoni 44pt; `RatingSummary` "N ta baho" o'rniga `(N)` (faqat admin ro'yxatida) |
| `src/modules/live/api/live.api.ts` | 🟢 NUSXA | `6bcde4cb0067` | — |
| `src/modules/live/api/live.dto.ts` | 🟢 NUSXA | `ebd0415d0318` | — |
| `src/modules/live/api/live.endpoints.ts` | 🟢 NUSXA | `d9cfc57d5604` | — |
| `src/modules/live/index.ts` | 🟡 MOSLASH | `857a64dd345f` | generatsiya: veb barrel minus `ui/` eksportlari (port-barrels.mjs); `screen-capture` (getDisplayMedia, `DISPLAY_CAPTURE_OPTIONS`, `SCREEN_SHARE_*`) eksportlari yo'q — brauzerga xos |
| `src/modules/live/lib/live-permissions.ts` | 🟢 NUSXA | `bc79fd025682` | — |
| `src/modules/live/lib/live-token.ts` | 🟢 NUSXA | `3578fb00f20a` | — |
| `src/modules/live/lib/live.mappers.ts` | 🟢 NUSXA | `7e043d7e03d1` | — |
| `src/modules/live/lib/screen-share-signal.ts` | 🟢 NUSXA | `b5c1de5417ea` | — |
| `src/modules/live/lib/use-focus-tracker.ts` | 🔴 QAYTA | `e5a73c8e6fa4` | visibilitychange/blur -> AppState; iOS `inactive` filtrlanadi |
| `src/modules/live/model/live.queries.ts` | 🟢 NUSXA | `ce9b0a69f1fc` | — |
| `src/modules/live/model/use-camera-signals.ts` | 🟢 NUSXA | `cbad2de79192` | — |
| `src/modules/live/model/use-mic-signals.ts` | 🟢 NUSXA | `c920b2c1990a` | — |
| `src/modules/message/api/message.api.ts` | 🟢 NUSXA | `7977023f0b2d` | — |
| `src/modules/message/api/message.dto.ts` | 🟢 NUSXA | `734f416adfc5` | — |
| `src/modules/message/api/message.endpoints.ts` | 🟢 NUSXA | `cbc1e68e5a1e` | — |
| `src/modules/message/index.ts` | 🟡 MOSLASH | `beef9cff4479` | generatsiya: veb barrel minus `ui/` eksportlari (port-barrels.mjs); mobil UI bo'limida `RoomAttachments` |
| `src/modules/message/lib/chat-socket-manager.ts` | 🟢 NUSXA | `7ac301894804` | — |
| `src/modules/message/lib/linkify.ts` | 🟢 NUSXA | `5a21a96293c4` | — |
| `src/modules/message/lib/message.mappers.ts` | 🟢 NUSXA | `c25f32845d83` | — |
| `src/modules/message/model/message.keys.ts` | 🟢 NUSXA | `d00b7016c621` | — |
| `src/modules/message/model/chat-ui.store.ts` | 🟢 NUSXA | `—` | xabar qidiruvi va tanlash holati (2026-10-20 qo'shildi) |
| `src/modules/message/model/use-chat.ts` | 🟡 MOSLASH | `ec92398177bb` | react-router useNavigate -> expo-router (2026-10-20 vebdan qayta sinxronlandi; literal matn moslashtirishi olib tashlandi — chat.json da `removedFromGroup` endi bor) |
| `src/modules/message/ui/message-attachment.tsx` | 🟡 MOSLASH | `b2144ef8b905` | rasm xabar ichida (`Image`, nisbat yuklangach); bosilganda `FileViewer` — fayl ilova ichida ochiladi |
| `src/modules/message/ui/message-actions-menu.tsx` | 🟡 MOSLASH | `9fc6953c0866` | faqat telefon varianti (`focus`): pufak `measureInWindow` bilan o'lchanib Modal'da ko'tariladi; chekkalarga tizim panellari qo'shilgan |
| `src/modules/message/ui/attachment-sheet.tsx` | 🟡 MOSLASH | `9d80259f1011` | `Sheet variant="app"`; fayl tanlash `expo-image-picker`/`expo-document-picker`; so'nggi rasm keshga yozilib `PickedFile` bo'ladi |
| `src/modules/message/ui/image-preview-screen.tsx` | 🟡 MOSLASH | `9e49e666fffd` | to'liq ekran Modal, tokenlar doim qorong'i (`useDs("dark")`), holat paneli oq |
| `src/modules/message/ui/voice-message.tsx` | 🟡 MOSLASH | `5961e0e20cd6` | `expo-audio` token sarlavhasi bilan oqim (Blob emas); tor ekranda 24 ustun; ijro xatosida toast (iOS vebdagi WebM xabarlarni ocholmaydi — `docs/BACKEND-IOS.md`) |
| `src/modules/message/ui/message-bubble.tsx` | 🟡 MOSLASH | `9149615aa15a` | tor ekran varianti; pufak `MessageBubbleCard` ga ajratilgan (fokus menyusidagi nusxa uchun); sudrab javob berish yo'q (orqaga qaytish imo-ishorasi bilan to'qnashadi) — javob menyudan; tizim kartalari (`SystemCard`): yozuv — vaqt bilan, doska PDF'i — `FileViewer` da |
| `src/modules/message/ui/message-composer.tsx` | 🟡 MOSLASH | `2dd19ea16487` | tor ekran varianti; fayllar `PickedFile` (uri), yuborishda `toUploadFile`; ovoz `expo-audio`; @ ro'yxati kompozer ustida oqimda (Android'da ota-chegaradan tashqaridagi bosish yetib bormaydi); emoji paneli Modal'da tugma o'rniga qarab; "ovozli xabar yozmoqda" signali `RecordingPanel` ichida |
| `src/modules/message/ui/message-list.tsx` | 🟡 MOSLASH | `49cf56db367c` | FlashList (pastdan ochiladi); kun ajratgichlari har kun uchun (vebda bitta "Bugun"); qidiruvda joriy natija `scrollToIndex` bilan o'rtaga; o'chirish tasdig'i `ConfirmDialog`; `date-separator`, `typing-indicator` shu faylda; qator kaliti `clientMessageId || id` (`message-day.ts`) — yuborilganda sakrash yo'q; `TypingIndicator` ovoz turi bilan |
| `src/modules/conversation/ui/direct-request-bar.tsx` | 🟡 MOSLASH | `a143ac9dc457` | faqat tor ekran varianti; tugmalar `MobileButton`, pastda xavfsiz hudud |
| `src/modules/message/ui/room-attachments.tsx` | 🟡 MOSLASH | `5c106d66e10b` | media plitkasi faqat rasm/eskizni chizadi (backend `media` ga doska PDF'ini ham qo'shadi — vebda buzilgan rasm), boshqasiga belgi |
| `src/modules/message/ui/typing-indicator.tsx` | 🟡 MOSLASH | `ab2967c41ff4` | mobilda `message-list.tsx` ichida (`TypingIndicator`) |
| `src/modules/message/ui/message-text.tsx` | 🟡 MOSLASH | `9ba5cb9dd097` | havolalar `Text onPress`; ichki havola ilova ichida, tashqisi brauzerda |
| `src/modules/message/ui/pinned-message-bar.tsx` | 🟡 MOSLASH | `d8b8f14c948f` | faqat tor ekran ko'rinishi |
| `src/modules/notification/api/notification.api.ts` | 🟢 NUSXA | `b5ebf59d897d` | — |
| `src/modules/notification/api/notification.dto.ts` | 🟢 NUSXA | `58debbd4a6a4` | — |
| `src/modules/notification/api/notification.endpoints.ts` | 🟢 NUSXA | `c48e653a4cfc` | — |
| `src/modules/notification/index.ts` | 🟡 MOSLASH | `48b1ff3a3fe8` | generatsiya: veb barrel minus `ui/` eksportlari (port-barrels.mjs) |
| `src/modules/notification/lib/notification-socket-manager.ts` | 🟢 NUSXA | `3717cfa6e2d2` | — |
| `src/modules/notification/lib/notification.mappers.ts` | 🟢 NUSXA | `3adafe007db1` | — |
| `src/modules/notification/model/notification.queries.ts` | 🟢 NUSXA | `3e3023b0c072` | — |
| `src/modules/notification/model/use-notification-feed.ts` | 🟢 NUSXA | `3f95f846ca29` | — |
| `src/modules/notification/ui/sent-notifications-panel.tsx` | 🟡 MOSLASH | `ae4c7b53217c` | kartada (vebda `.portal-panel` uslubsiz); xabar ko'rinishi WebView emas, 2 qatorli matn |
| `src/modules/notification/api/push-device.api.ts` | 🆕 MOBIL | `—` | FCM qurilma tokeni; vebda Web Push obunasi (`push/subscribe/`) ishlatiladi |
| `src/modules/notification/lib/device-id.ts` | 🆕 MOBIL | `—` | barqaror qurilma ID'si; backend kaliti `(user, device_id)`, token o'zgaruvchan |
| `src/modules/notification/model/push-device.ts` | 🆕 MOBIL | `—` | chiqishda qurilmani ro'yxatdan chiqarish |
| `src/modules/parent/api/parent.api.ts` | 🟢 NUSXA | `c685c901b155` | — |
| `src/modules/parent/api/parent.dto.ts` | 🟢 NUSXA | `e5decdab122d` | — |
| `src/modules/parent/index.ts` | 🟡 MOSLASH | `e9fb4b7432aa` | generatsiya: veb barrel minus `ui/` eksportlari (port-barrels.mjs) |
| `src/modules/parent/lib/parent.mappers.ts` | 🟢 NUSXA | `dcefca327b75` | — |
| `src/modules/parent/model/parent.queries.ts` | 🟢 NUSXA | `a0531e2dfa3c` | — |
| `src/modules/parent/model/selected-child.store.ts` | 🟢 NUSXA | `75e6235a5ff2` | — |
| `src/modules/permission/constants/permission-map.ts` | 🟢 NUSXA | `9f90d5d3661c` | — |
| `src/modules/permission/index.ts` | 🟡 MOSLASH | `5b5ffd8d4e1d` | generatsiya: veb barrel minus `ui/` eksportlari (port-barrels.mjs) |
| `src/modules/permission/lib/can.ts` | 🟢 NUSXA | `3ab23734d2c0` | — |
| `src/modules/permission/lib/has-role.ts` | 🟢 NUSXA | `b30d0d1d76c6` | — |
| `src/modules/permission/ui/permission-guard.tsx` | 🟡 MOSLASH | `4c2702ba4a5d` | farq qayd etilmagan — tekshiring |
| `src/modules/quiz/api/quiz.api.ts` | 🟢 NUSXA | `a9533c3584e5` | — |
| `src/modules/quiz/api/quiz.dto.ts` | 🟢 NUSXA | `f99ca291ebb0` | — |
| `src/modules/quiz/api/quiz.endpoints.ts` | 🟢 NUSXA | `916b07c2cda0` | — |
| `src/modules/quiz/index.ts` | 🟡 MOSLASH | `1cbf687bb9d7` | generatsiya: veb barrel minus `ui/` eksportlari (port-barrels.mjs) |
| `src/modules/quiz/lib/google-import.ts` | 🟢 NUSXA | `d89ca84726fc` | — |
| `src/modules/quiz/lib/answer-value.ts` | 🟢 NUSXA | `3fdb1a9ba888` | — |
| `src/modules/quiz/lib/question-draft.ts` | 🟢 NUSXA | `4bf8de451272` | — |
| `src/modules/quiz/lib/quiz-errors.ts` | 🟢 NUSXA | `da4cf7939388` | — |
| `src/modules/quiz/lib/quiz.mappers.ts` | 🟢 NUSXA | `3e3335a516e3` | — |
| `src/modules/quiz/model/quiz.queries.ts` | 🟢 NUSXA | `cb2e5ce1bc18` | — |
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
| `src/modules/quiz/lib/countdown.ts` | 🟢 NUSXA | `b78e4ca075cf` | — |
| `src/modules/quiz/lib/quiz-limits.ts` | 🟢 NUSXA | `90cbecfebb94` | — |
| `src/modules/quiz/model/use-paid-test-gate.ts` | 🟢 NUSXA | `79936af48938` | — |
| `src/modules/quiz/model/use-quiz-limits-text.ts` | 🟢 NUSXA | `27b75bf3b405` | — |
| `src/modules/quiz/model/use-quiz-countdown.ts` | 🟡 MOSLASH | `894d79c8d1dc` | `window.setInterval` -> global `setInterval` (domen qatlamida `window` taqiqlangan) |
| `src/modules/quiz/model/use-quiz-sessions.ts` | 🟡 MOSLASH | `bb70d161d006` | `window.setInterval` -> global `setInterval` (domen qatlamida `window` taqiqlangan) |
| `src/pages/teacher/quizzes/teacher-quizzes-page.tsx` | 🟡 MOSLASH | `6181c5192d3a` | mobilda yo'q — vebda ham ulanmagan (`/teacher/quizzes` -> `/teacher/workspace/tests`) |
| `src/modules/student/index.ts` | 🟡 MOSLASH | `b64689876640` | vebdagidek faqat yozilish oynasi; `StudentEnrollmentDialog` o'rniga `StudentEnrollmentSheet` |
| `src/modules/student/ui/student-enrollment-dialog.tsx` | 🟡 MOSLASH | `b337e126089a` | mobilda `ui/student-enrollment-sheet.tsx` (pastdan chiquvchi oyna); eski uslubda — vebda ham `shared/ui/legacy` |
| `src/modules/voice/api/voice.api.ts` | 🟢 NUSXA | `c02578716398` | — |
| `src/modules/voice/api/voice.dto.ts` | 🟢 NUSXA | `2c89acae27a3` | — |
| `src/modules/voice/api/voice.endpoints.ts` | 🟢 NUSXA | `8604722f505d` | — |
| `src/modules/voice/index.ts` | 🟡 MOSLASH | `a6ac0727b617` | generatsiya: veb barrel minus `ui/` + mobil UI eksportlari |
| `src/modules/voice/lib/voice.mappers.ts` | 🟢 NUSXA | `63111b04bb08` | — |
| `src/modules/voice/model/voice.queries.ts` | 🟢 NUSXA | `2675004d1b80` | — |
| `src/modules/voice/ui/voice-room-bar.tsx` | 🟡 MOSLASH | `f18a7c85c56e` | `hideIdle`; ochish oynasi `useVoiceUiStore` orqali (sarlavhadagi tugma ham shuni ochadi) |
| `src/modules/voice/ui/voice-room-create-dialog.tsx` | 🟡 MOSLASH | `3bec99f4bb11` | faqat tor ekran varianti (`Sheet variant="app"`) |
| `src/modules/voice/ui/voice-room-panel.tsx` | 🟡 MOSLASH | `1b71d881514a` | faqat tor ekran varianti — to'liq ekranli `Modal`; `RoomAudioRenderer` kerak emas (RN ovozni o'zi chiqaradi) |
| `src/pages/admin/admin-dashboard-page.tsx` | 🟡 MOSLASH | `bd9ba5a14a76` | jadvallar ustunlab chiziladi va gorizontal aylanadi (`admin-table.tsx`); havolalar qatori o'raladi (sertifikatlar va murojaatlar qo'shilgach) |
| `src/pages/admin/system-panels.tsx` | 🟡 MOSLASH | `1f10ae6fae56` | server holatida davr tugmalari sarlavha ostida (vebda tor ekranda ustun bo'lib izohni siqadi) |
| `src/pages/admin/teachers/admin-teachers-page.tsx` | 🟡 MOSLASH | `73fbd40d4d08` | mobilda `pages/admin/admin-teachers-page.tsx`; ko'rinish tanlagichi sarlavha ostida; `?teacher=` qatorga aylantiradi va belgilaydi |
| `src/pages/admin/teachers/teacher-stats-dialog.tsx` | 🟡 MOSLASH | `b15753cd64fc` | mobilda `pages/admin/teacher-stats-sheet.tsx` (Dialog o'rniga Sheet) |
| `src/widgets/group-workspace/group-action-dialogs.tsx` | 🟡 MOSLASH | `03f62e428e61` | `AddLessonDialog` — mobilda `add-lesson-dialog.tsx` (tor ekran `ModalCard` -> `Sheet variant="app"`, sana/vaqt `MobilePickerField`); `AddAssignmentDialog` — hozircha eski `add-assignment-sheet.tsx` (4b) |
| `src/shared/ui/app-dialog.tsx` | 🟡 MOSLASH | `4dcce350160d` | `fullscreen` — mobilda `fullscreen-dialog.tsx`; `sheet` — `Sheet variant="app"` (tutqich, `text-h2` sarlavha, 44px yopish, qotirilgan `footer`; `icon`, `headingTitle`, `footerPadding` — vebdagi `icon`, `titleClassName`, `footerClassName`) |
| `src/shared/ui/mobile-page.tsx` | 🟡 MOSLASH | `a7c5e4d901b8` | barcha bloklar RN'da; `mobileRoundButton`/`mobileButton` klasslari o'rniga `MobileRoundButton`/`MobileButton`; segmentda matn kesilmasligi uchun ichki chet kichik — suriladiganda 0, teng kenglikda 4 (CSS'da `nowrap` matn chetdan chiqib ko'rinadi); `MobileSegment` `badge`; `scroll` rejimida eni `minWidth: 114`, ichki chet 12; `MobileActionBar` shu faylda (vebda `mobile-action-bar.tsx` ga ajratilgan) |
| `src/shared/ui/group-tile.tsx` | 🟡 MOSLASH | `74b48cf68e56` | `box`/`radius` — vebdagi `className="size-11 rounded-xl"` o'rnida |
| `src/shared/ui/confirm-dialog.tsx` | 🟡 MOSLASH | `211978f29b83` | faqat tor ekran varianti (vebdagi `alert` — keng ekranda markaziy ko'rinish, mobilda doim shunday); mobilda `shared/ui/center-dialog.tsx`; fon/orqaga faqat `onOpenChange(false)` (vebdagidek), `onCancel` faqat tugmadan |
| `src/shared/ui/mobile-alert-dialog.tsx` | 🟡 MOSLASH | `2dc5f552c93b` | mobilda `shared/ui/center-dialog.tsx`; `titleVariant` va `shift` — vebdagi `titleClassName` va `className` (`top-[calc(50%+Npx)]`) o'rniga |
| `src/shared/ui/mobile-fields.tsx` | 🟡 MOSLASH | `e38ff871ee7c` | `select` — `MobileSelectSheet` (pastki oynadagi ro'yxat, vebda brauzer ro'yxati); `date`/`time` — `mobile-pickers.tsx`; `datetime` (veb `datetime-local`) — avval kalendar, keyin soat |
| `src/shared/ui/mobile-pickers.tsx` | 🟡 MOSLASH | `d93f3cdcb26a` | `AppDialog` -> `Sheet variant="app" compact`; kalendar haftalar qatorida (foizli `flexWrap` yaxlitlanadi); `clearable` — bo'sh qiymat ("Hozir") |
| `src/shared/ui/mobile-screen-dialog.tsx` | 🟡 MOSLASH | `1685aa64f0de` | Radix Dialog -> RN `Modal` + `KeyboardAvoidingView` |
| `src/shared/ui/file-viewer.tsx` | 🟡 MOSLASH | `5f6aa616130d` | faqat tor ekran varianti (to'liq ekran `Modal`); PDF va rasm — WebView'da (pdf.js 3.11, hujjat/rasm base64 bo'lib beriladi), zoom vebdagidek: kenglik × zoom, −/+ tugmalari (`stepZoom`), ikki barmoq — WebView ichidagi touch hodisalari (vebda `useZoomGestures`), canvas 16 Mpx bilan cheklangan; video `expo-video` (tizim boshqaruvlari), audio `expo-audio` (ijro tugmasi, chiziq, vaqt — vebdagi `<audio controls>` o'rnida) |
| `src/shared/ui/pdf-page-canvas.tsx` | 🟡 MOSLASH | `33260db16776` | mobilda `file-viewer.tsx` dagi WebView HTML'ida (xuddi shu hisob: kenglik × `devicePixelRatio`) |
| `src/shared/ui/route-status.tsx` | 🟡 MOSLASH | `8e59a53abe0f` | faqat tor ekran shoxi; belgi rang oladigan funksiya bo'lib beriladi (`mobileIcon` o'rniga sahifalar tor ekran belgisini beradi); tugmalar `MobileButton` |
| `src/app/router/route-status-pages.tsx` | 🟡 MOSLASH | `af1e4e3d62e9` | mobilda `pages/status/route-status-pages.tsx`; marshrutlar `app/+not-found.tsx` va `app/forbidden.tsx` |
| `src/app/router/route-error-boundary.tsx` | 🟡 MOSLASH | `e46f7720d562` | mobilda `RouteErrorPage` (`pages/status/route-status-pages.tsx`) + `app/_layout.tsx` dagi Expo Router `ErrorBoundary`; "Qayta urinish" — `retry()` (vebda sahifani qayta yuklash); bo'lak (chunk) qayta yuklash mantig'i yo'q — mobil to'plam bitta |
| `src/shared/ui/modal-card.tsx` | 🟡 MOSLASH | `c7b2169346f0` | tor ekranda `Sheet variant="app"` bilan bir xil — alohida komponent yo'q |
| `src/shared/ui/switch.tsx` | 🟡 MOSLASH | `edc97d390894` | radix o'rniga Pressable; `lg` o'lcham; radius aniq yarim balandlik (Android `boxShadow` 999 ni kesmaydi) |
| `src/modules/board/ui/formula-solver-dialog.tsx` | 🟡 MOSLASH | `a30c57d10aa4` | faqat tor ekran varianti (`Sheet variant="app" compact`); tezkor tugmalar kursor joyiga (`onSelectionChange` + `setSelection`) |
| `src/pages/teacher/exams/teacher-exams-page.tsx` | 🟡 MOSLASH | `aaec2fc43c46` | mobilda yo'q — vebda ham ulanmagan (`/teacher/exams` -> `/teacher/workspace/mock`) |
| `src/pages/auth/login-page.tsx` | 🟡 MOSLASH | `47267c572c0a` | manba: veb `mobile-login-form.tsx` (tor ekran varianti); oflayn ogohlantirish NetInfo orqali; SMS bilan tasdiqlash hozircha o'chiq (`FEATURES.smsVerification`, 2026-10-29 loyiha egasi qarori): "Parolni unutdingizmi?" yashirin, 2FA talab qilinsa kod oynasi o'rniga izoh |
| `src/modules/auth/ui/mobile-login-form.tsx` | 🟡 MOSLASH | `f2830b3adbe5` | mobilda `pages/auth/login-page.tsx` ichida |
| `src/pages/auth/register-page.tsx` | 🟡 MOSLASH | `fd6ead08a2a2` | manba: veb `mobile-register-form.tsx`; "tayyor" ekrani haqiqatan ko'rsatiladi (vebda `PublicRoute` uni darhol yo'naltirib yuboradi) |
| `src/modules/auth/ui/mobile-register-form.tsx` | 🟡 MOSLASH | `eee88e0d2a0c` | mobilda `pages/auth/register-page.tsx` ichida |
| `src/modules/auth/ui/auth-screen.tsx` | 🟡 MOSLASH | `821d80dc5c6f` | `AuthScreen` (tor ekran varianti, M1–M4) + maydon/tugma komponentlari; `AuthShell` (keng ekran) yo'q; fon gradienti `DsGradient`, maydonlar klaviatura ustiga `KeyboardAwareScrollView` bilan suriladi; placeholder o'lchami RN'da alohida berilmagani uchun bo'sh maydonda shrift placeholder'nikiga o'tadi |
| `src/modules/auth/ui/otp-input.tsx` | 🟡 MOSLASH | `56a812e2324e` | har katak alohida `TextInput`; SMS avtoto'ldirish `oneTimeCode`/`sms-otp`; fokus o'tishidan oldin kelgan raqam keyingi kataklarga tarqatiladi (vebda `maxLength=1`) |
| `src/modules/auth/ui/two-factor-form.tsx` | 🟡 MOSLASH | `e6f1e33d6c41` | faqat `MobileTwoFactorForm` (veb tor ekranda shuni ko'rsatadi); `TwoFactorForm` (keng ekran) yo'q |
| `src/pages/profile/account-settings-page.tsx` | 🟡 MOSLASH | `2f0e10040d95` | faqat tor ekran varianti; `AppDialog` -> `Sheet`; login o'zgartirish pastki oynada. Ota-onaning o'z sahifalari — `pages/parent/settings/` |
| `src/pages/profile/profile-page.tsx` | 🟡 MOSLASH | `2c90aa54cf0c` | faqat tor ekran varianti; avatar yuklash yo'q (veb tor ekranda ham yo'q); o'qituvchi va o'quvchi — ota-ona `pages/parent/settings/settings-mobile-profile.tsx` da |
| `src/pages/profile/profile-layout.tsx` | 🟡 MOSLASH | `3255068a24e6` | tor ekranda faqat `Outlet` — mobilda `app/teacher/profile/_layout.tsx` (Stack, `anchor: "index"`); keng ekran yon menyusi yo'q |
| `src/pages/profile/profile-shell.tsx` | 🟡 MOSLASH | `282318c579f7` | `ProfileSubPage` — maydonlar klaviatura ustida (`KeyboardAwareScrollView`); orqaga — stekdan, bo'lmasa profil bosh sahifasiga |
| `src/pages/profile/profile-dialogs.tsx` | 🟡 MOSLASH | `b40b451d2915` | `AppDialog` -> `Sheet variant="app"` / `ConfirmDialog`; faqat tor ekran shoxi; `LinkAccountDialog` almashtirish oynasi ichida (iOS) |
| `src/pages/profile/settings-tones.ts` | 🟢 NUSXA | `3d58b6ad30a4` | — |
| `src/pages/profile/personal-info-page.tsx` | 🟡 MOSLASH | `28200661b973` | faqat tor ekran varianti; fan va shahar `<select>` o'rniga `MobilePickerField`; xato `MobileActionBar` ustida |
| `src/pages/profile/system-settings-page.tsx` | 🟡 MOSLASH | `f5135024240f` | faqat tor ekran varianti; push — veb Web Push o'rniga OS ruxsati (o'chirish tizim sozlamalarini ochadi, ilovaga qaytganda qayta o'qiladi); eski mobil sahifadagi kesh tozalash va bildirishnoma turlari olib tashlandi (vebda yo'q); mavzu va matn o'lchami vebdagidek serverga ham yoziladi |
| `src/pages/profile/my-ratings-page.tsx` | 🟡 MOSLASH | `d8a2a399924a` | faqat tor ekran shoxlari: o'qituvchida `TeacherRatings`, o'quvchida `student-ratings.tsx` |
| `src/pages/profile/student-ratings.tsx` | 🟡 MOSLASH | `681aec74e6b1` | faqat tor ekran varianti |
| `src/pages/profile/certificates-page.tsx` | 🟡 MOSLASH | `25dea699b601` | faqat tor ekran varianti; fayl `pickDocument` bilan; faylni ochish `Linking.openURL`; qator menyusi `PopoverMenu` |
| `src/pages/profile/login-history-page.tsx` | 🟡 MOSLASH | `3844db93624c` | faqat tor ekran varianti |
| `src/pages/profile/help-center-page.tsx` | 🟡 MOSLASH | `2771d2562e58` | tanishuvni qayta ko'rsatish — `storage` dagi kalit o'chiriladi (vebda `localStorage`); FAQ javobi `AppDialog` o'rniga `Sheet`; video `Linking.openURL`; `?ticket=` — `useLocalSearchParams`/`router.setParams`; ota-onaga qo'llanma va tanishuv yo'q (vebdagidek) |
| `src/widgets/account-menu/notification-settings.tsx` | 🟡 MOSLASH | `01088df91bda` | ota-onada `pages/parent/settings/settings-mobile-system.tsx` (veb `settings-mobile-system` bilan); Web Push qatori o'rnida OS push ruxsati |
| `src/modules/auth/ui/login-history-dialog.tsx` | 🟡 MOSLASH | `6aa57a5cc062` | mobilda `login-history-sheet.tsx` (Dialog o'rniga Sheet) |
| `src/pages/auth/welcome-page.tsx` | 🟡 MOSLASH | `c36d8a0a9983` | til menyusi oddiy ochiluvchi ro'yxat; Xush kelibsiz ochilishda `fade` bilan chiqadi |
| `src/shared/ui/splash-screen.tsx` | 🟡 MOSLASH | `2a085985444d` | mobilda `shared/ui/boot-screen.tsx` (ilova ochilishi, sessiya tekshirilishi, `index` yo'naltirishi); nuqtalar Reanimated bilan |
| `src/shared/ui/app-toast.tsx` | 🟡 MOSLASH | `dde01935d48d` | mobilda `shared/ui/toast.tsx` dagi `showErrorToast` (`appError` turi); tepada 16px |
| `src/pages/auth/forgot-password-page.tsx` | 🟡 MOSLASH | `20a0829c7031` | mobilda `password-reset-pages.tsx` ichida; `location.state` o'rniga marshrut parametrlari; SMS bilan tasdiqlash hozircha o'chiq (`FEATURES.smsVerification`, 2026-10-29 loyiha egasi qarori): marshrutlar kirishga yo'naltiradi |
| `src/pages/auth/verify-code-page.tsx` | 🟡 MOSLASH | `16651bf7c720` | mobilda `password-reset-pages.tsx` ichida |
| `src/pages/auth/new-password-page.tsx` | 🟡 MOSLASH | `91726b8fbfb1` | mobilda `password-reset-pages.tsx` ichida |
| `src/pages/parent/dashboard/parent-dashboard-page.tsx` | 🟡 MOSLASH | `d1832d5e7006` | faqat telefon shoxi (`ParentHomeMobile`) |
| `src/pages/parent/children/parent-children-page.tsx` | 🟡 MOSLASH | `1a984f1e60c2` | faqat telefon shoxi (`FamilyMobile`) |
| `src/pages/parent/attendance/parent-attendance-page.tsx` | 🟡 MOSLASH | `9b8c3bc6ee33` | faqat telefon shoxi (`AttendanceMobile`) |
| `src/pages/parent/homework/parent-homework-page.tsx` | 🟡 MOSLASH | `cb3f89693849` | faqat telefon shoxi (`HomeworkMobile`) |
| `src/pages/parent/exams/parent-exams-page.tsx` | 🟡 MOSLASH | `33a9f589e315` | faqat telefon shoxi (`MockMobile`) |
| `src/pages/parent/report/parent-report-page.tsx` | 🟡 MOSLASH | `976d5b111c4a` | faqat telefon shoxi (`ResultsMobile`) |
| `src/pages/board/board-page.tsx` | 🟡 MOSLASH | `5c58f38cd773` | faqat tor ekran shoxi; PDF yuklab olish `downloadBlob` (ulashish oynasi); menyu `PopoverMenu`; yuklanish vebdagi `LoadingFallback` o'rniga oddiy belgi |
| `src/pages/live/live-lesson-page.tsx` | 🟡 MOSLASH | `41c62b179e63` | faqat tor ekran shoxlari; Androidda FLAG_SECURE (skrinshot himoyasi), iOS'da ism-watermark |
| `src/modules/live/ui/lesson-pre-join.tsx` | 🟡 MOSLASH | `ee92bbd8bbb0` | faqat tor ekran varianti; o'qituvchining kompyuterdagi ekran ulashish shoxi yo'q; ruxsat rad etilsa `media-permission-dialog.tsx` ga qarang |
| `src/modules/live/ui/media-permission-dialog.tsx` | 🟡 MOSLASH | `425eb1d4a350` | mobilda `lesson-pre-join.tsx` ichida (`ConfirmDialog`); "Qayta tekshirish" o'rniga tizim sozlamalari (`Linking.openSettings`), ilovaga qaytganda kamera qayta so'raladi; brauzerga xos izoh o'rniga `mobile.live.ruxsat_sozlamalarda` |
| `src/pages/recording/recording-page.tsx` | 🟡 MOSLASH | `befefce3e95e` | faqat tor ekran shoxi; xato holati `MobileEmptyCard` |
| `src/pages/recording/recording-mobile.tsx` | 🟡 MOSLASH | `d6481405f820` | mobilda `recording-page.tsx` ichida; davomat qatori `LessonAttendanceDialog` ni ochadi (vebdagidek); PDF `downloadBlob` orqali |
| `src/pages/recording/recording-video.tsx` | 🟡 MOSLASH | `81d25e23dd52` | mobilda `recording-page.tsx` ichida, `expo-video`; vebdan farqi — oxirida to'liq ekran tugmasi; oxiriga yetgan video boshidan qo'yiladi (ExoPlayer o'zi qaytarmaydi); pleer QO'LDA to'xtatilmaydi; video yo'lagi yo'q (faqat audio) yozuvda native ko'rinish yashiriladi — iOS QuickTime belgisini chizardi |
| `src/pages/recording/recording-desktop.tsx` | 🟡 MOSLASH | `8e22240fb02b` | mobilda ishlatilmaydi (vebda faqat keng ekran) |
| `src/modules/lesson/ui/lesson-recording-player.tsx` | 🟡 MOSLASH | `42684a8f0678` | mobilda ishlatilmaydi (vebda ham hech qayerda chaqirilmaydi) — pleer `recording-video.tsx` asosida `recording-page.tsx` ichida |
| `src/pages/schedule/schedule-page.tsx` | 🟡 MOSLASH | `b106a05bca46` | faqat tor ekran shoxi (`MobileSchedule` va oynalar); o'quvchi baholashi `RateLessonSheet`; yozuv `/recordings/:id`; darsga yoki yozuvga o'tishda tafsilot oynasi yopiladi (mobilda jadval stekda qoladi) |
| `src/pages/schedule/mobile-schedule.tsx` | 🟡 MOSLASH | `108bc38855cf` | — |
| `src/pages/schedule/lesson-detail-drawer.tsx` | 🟡 MOSLASH | `fac2f1b7392d` | faqat tor ekran variantlari (o'qituvchi va o'quvchi), `Sheet variant="app"` |
| `src/pages/schedule/lesson-ratings-dialog.tsx` | 🟡 MOSLASH | `15d30680181e` | faqat tor ekran varianti |
| `src/pages/schedule/new-lesson-dialog.tsx` | 🟡 MOSLASH | `bd28723e0f70` | faqat tor ekran varianti |
| `src/pages/schedule/schedule-states.tsx` | 🟡 MOSLASH | `11c7ac9f6fea` | faqat `MobileScheduleSkeleton` va `ScheduleError` |
| `src/pages/schedule/lesson-tone.ts` | 🟢 NUSXA | `5c79242889d9` | — |
| `src/pages/student/lib/attendance-rate.ts` | 🟢 NUSXA | `1ea3330ef1bc` | — |
| `src/pages/student/lib/clock.ts` | 🟢 NUSXA | `cd1550138b5d` | — |
| `src/pages/student/lib/format.ts` | 🟢 NUSXA | `68d329bfea41` | — |
| `src/pages/student/lib/use-student-assignments.ts` | 🟢 NUSXA | `2af2d98a960e` | — |
| `src/pages/student/dashboard/use-student-home.ts` | 🟢 NUSXA | `f89abff4a6c8` | — |
| `src/pages/student/dashboard/student-dashboard-page.tsx` | 🟡 MOSLASH | `c34b35b5efa5` | faqat tor ekran shoxi (`student-mobile-home.tsx` shu faylda); pastga tortib yangilash faol so'rovlarni qayta oladi |
| `src/pages/student/dashboard/student-mobile-home.tsx` | 🟡 MOSLASH | `b421ad628017` | mobilda `student-dashboard-page.tsx` ichida |
| `src/pages/student/dashboard/student-hero.tsx` | 🟡 MOSLASH | `3d2d055fff91` | mobilda ishlatilmaydi (vebda faqat keng ekran) |
| `src/pages/student/workspace/use-student-workspace.ts` | 🟢 NUSXA | `2e4c774c6c5e` | — |
| `src/pages/student/workspace/filter-chips.tsx` | 🟡 MOSLASH | `9ce5a36a7e1b` | mobilda `MobileSegment scroll="auto"` (tor ekran varianti) |
| `src/pages/student/workspace/student-workspace-page.tsx` | 🟡 MOSLASH | `ec408762f107` | faqat tor ekran shoxi |
| `src/pages/student/workspace/student-tests-page.tsx` | 🟡 MOSLASH | `1b11c089099a` | faqat tor ekran shoxi; urinishlar ro'yxati `Sheet variant="app"` |
| `src/pages/student/workspace/student-test-page.tsx` | 🟡 MOSLASH | `b46417846f8f` | faqat tor ekran shoxi; qoralama `storage` da (`yolup.quiz-draft.<id>`, vebda `localStorage`); topshirilgan natija `fresh-results.ts` orqali uzatiladi (vebda `navigate` holati) |
| `src/pages/student/workspace/student-test-results-page.tsx` | 🟡 MOSLASH | `fc49635b853d` | faqat tor ekran shoxi; yangi topshirilgan natija `takeFreshResult` dan, aks holda urinishlar ro'yxatidan |
| `src/pages/student/workspace/student-analytics-page.tsx` | 🟡 MOSLASH | `ad0d589d9c6c` | faqat tor ekran shoxi; ustunli diagramma oddiy `View` lar bilan |
| `src/pages/student/workspace/student-mock-page.tsx` | 🟡 MOSLASH | `efc615d60b4a` | faqat tor ekran shoxi |
| `src/pages/student/workspace/student-mock-result-page.tsx` | 🟡 MOSLASH | `31bf71bb6a6c` | faqat tor ekran shoxi |
| `src/pages/student/workspace/student-homework-page.tsx` | 🟡 MOSLASH | `5b4b398b9667` | faqat tor ekran shoxi |
| `src/pages/student/workspace/student-homework-item-page.tsx` | 🟡 MOSLASH | `a787df93264c` | faqat tor ekran shoxlari; fayllar `pickDocuments` bilan (5 tagacha); topshiriq ko'rinishi `SubmissionPreview`; qoralama serverda — saqlangach `homeworkKeys.draft` keshi yangilanadi (vebda `staleTime: Infinity` sababli shu seansda eski qiymat chiqadi) |
| `src/pages/student/workspace/fresh-results.ts` | 🆕 MOBIL | `—` | yangi topshirilgan test natijasini natija sahifasiga uzatadi — expo-router'da `navigate(..., { state })` yo'q |
| `src/pages/student/exams/student-exam-page.tsx` | 🟡 MOSLASH | `1a00701cb78f` | mobilda `pages/exams/student-exam-page.tsx`; orqaga va chiqish mock ro'yxatiga, qidiruv `ROUTES.student.search` |
| `src/pages/student/homework-board/student-homework-board-page.tsx` | 🟡 MOSLASH | `c7b4f55dd806` | mobilda `pages/homework/student-homework-board-page.tsx`; tor ekran shoxi — `BoardSurface` `mobile` chrome bilan, tasdiqlash `ConfirmDialog` (brand); topshirgach `dismissTo` bilan stekdagi vazifa sahifasiga qaytadi |
| `src/shared/api/api-client.ts` | 🟡 MOSLASH | `debfdc44dc73` | navigator.onLine -> NetInfo |
| `src/shared/api/api-config.ts` | 🟢 NUSXA | `b9623d76c36b` | — |
| `src/shared/api/api-error.ts` | 🟢 NUSXA | `a8f798c7ade8` | — |
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
| `src/shared/config/env.ts` | 🔴 QAYTA | `a7d4ef786218` | import.meta.env -> expo-constants; o'sha zod sxemasi; vebning production'da proksisiz API (`VITE_API_PROXY`) o'zgarishi mobilga taalluqli emas — mobil doim to'g'ridan-to'g'ri |
| `src/shared/config/index.ts` | 🟡 MOSLASH | `238b0c55c11e` | vebdagi ro'yxat + mobilga xos `FEATURES` |
| `src/shared/config/features.ts` | 🟡 MOSLASH | `78f8f3fdb77e` | veb `aiAssistant` + mobilga xos `smsVerification` (parol tiklash, 2FA) |
| `src/shared/config/routes.ts` | 🟢 NUSXA | `ce66c1e6008f` | — |
| `src/shared/constants/index.ts` | 🟢 NUSXA | `c06257bbb1f3` | — |
| `src/shared/constants/roles.ts` | 🟢 NUSXA | `2f90f03f91dc` | — |
| `src/shared/constants/storage-keys.ts` | 🟢 NUSXA | `51ef121d70fd` | — |
| `src/shared/i18n/i18n.ts` | 🟡 MOSLASH | `6c55967a78fc` | `import.meta.glob` (Vite) o'rniga qo'lda import; `mobile` bo'limi qo'shilgan; suspense o'chirilgan; vebdagi tarmoqdan bo'lib yuklash (`i18nReady`, `prefetchTranslations`) yo'q — lug'atlar ilova ichida |
| `src/shared/i18n/intl-locale.ts` | 🟢 NUSXA | `631f809dda19` | — |
| `src/shared/i18n/locales/**` | 🟢 NUSXA | `—` | 18 bo'lim × 3 til, vebdan bayt-bayt; `mobile.json` mobilga xos |
| `src/shared/model/language.store.ts` | 🔴 QAYTA | `b87fa05a508b` | zustand `persist` (localStorage) o'rniga MMKV; qurilma tili `Intl` dan |
| `src/shared/model/text-size.store.ts` | 🔴 QAYTA | `f61042795fd4` | `persist` o'rniga MMKV; `--text-scale` o'rniga `Text` komponenti ko'paytiruvchisi (`text-scale.tsx`) |
| `src/shared/model/use-online-status.ts` | 🔴 QAYTA | `db9f2e6a64f2` | `navigator.onLine` o'rniga NetInfo (`isInternetReachable` ustuvor) |
| `src/shared/lib/app-state.ts` | 🆕 MOBIL | `—` | Mobilga xos, veb'da yo'q |
| `src/shared/lib/date.ts` | 🟢 NUSXA | `a7be861120a8` | — |
| `src/shared/lib/download.ts` | 🔴 QAYTA | `cf70cbf439d2` | <a download> -> expo-file-system + Share; ASYNC bo'ldi; `blobToBase64` eksport (fayl ko'ruvchidagi PDF uchun) |
| `src/shared/lib/file-kind.ts` | 🟢 NUSXA | `df2f7ffd380a` | — |
| `src/shared/lib/index.ts` | 🟡 MOSLASH | `33890af25640` | barrel + app-state/network eksportlari; `pdf` (pdfjs) eksporti yo'q — pdf.js WebView ichida (`shared/ui/file-viewer.tsx`); qo'shimcha `blobToBase64` |
| `src/shared/lib/pdf.ts` | 🟡 MOSLASH | `29cb37bd7b6f` | mobilda yo'q — pdf.js (3.11, UMD) WebView ichida cdnjs'dan yuklanadi (`shared/ui/file-viewer.tsx`) |
| `src/shared/lib/network.ts` | 🆕 MOBIL | `—` | Mobilga xos, veb'da yo'q |
| `src/shared/lib/sanitize-html.ts` | 🔴 QAYTA | `74673b9ade61` | DOMPurify -> regex; WebView CSP bilan birga |
| `src/shared/lib/storage.ts` | 🔴 QAYTA | `dbaa996f6921` | localStorage -> MMKV; interfeys bir xil |
| `src/shared/lib/utils.ts` | 🟢 NUSXA | `4dd93deacc31` | — |
| `src/shared/types/auth.ts` | 🟢 NUSXA | `e04b984d9558` | — |
| `src/shared/types/chat.ts` | 🟢 NUSXA | `855595f833bd` | — |
| `src/shared/types/domain.ts` | 🟢 NUSXA | `bb4d9033e70a` | — |
| `src/shared/types/dto.ts` | 🟢 NUSXA | `ffc508231f4e` | — |
| `src/shared/types/index.ts` | 🟢 NUSXA | `1b4c8dfc0f8f` | — |
| `src/shared/ui/avatar.tsx` | 🟡 MOSLASH | `8f4429737fdb` | farq qayd etilmagan — tekshiring |
| `src/shared/ui/badge.tsx` | 🟡 MOSLASH | `f0c6b9cbc966` | farq qayd etilmagan — tekshiring |
| `src/shared/ui/button.tsx` | 🟡 MOSLASH | `693a56cdfe79` | farq qayd etilmagan — tekshiring |
| `src/shared/ui/card.tsx` | 🟡 MOSLASH | `5cd43302e888` | farq qayd etilmagan — tekshiring |
| `src/shared/ui/checkbox.tsx` | 🟡 MOSLASH | `073b5898e69d` | farq qayd etilmagan — tekshiring |
| `src/shared/ui/input.tsx` | 🟡 MOSLASH | `52da1927077d` | farq qayd etilmagan — tekshiring |
| `src/shared/ui/palette.json` | 🆕 MOBIL | `—` | Mobilga xos, veb'da yo'q |
| `src/shared/ui/logo-svg.ts` | 🆕 MOBIL | `—` | avtomatik yaratiladi: `assets/y-logo.svg` -> `npm run build:icons` |
| `src/shared/ui/sheet.tsx` | 🟡 MOSLASH | `28dce0df2571` | veb `Dialog` o'rni; sudrab yopish va klaviatura ishlovi qo'lda, sudrash ro'yxat bilan bir vaqtda tanilishi shart |
| `src/shared/ui/toast.tsx` | 🆕 MOBIL | `—` | Mobilga xos, veb'da yo'q |
| `src/shared/ui/tokens.ts` | 🆕 MOBIL | `—` | Mobilga xos, veb'da yo'q |
| `src/widgets/group-workspace/group-workspace.tsx` | 🟡 MOSLASH | `b9cb653cfc49` | tablar va o'qituvchi bo'limlari (`lessons-panel.tsx`, `teacher-assignments.tsx`, `attendance-section.tsx`) tor ekran variantida; o'quvchi bo'limlari `widgets/student-group-workspace/`; o'qituvchida vazifa bosilganda hozircha `AssignmentDetailSheet` (vebdagidek dialog) |
| `src/widgets/group-workspace/lesson-board.tsx` | 🟡 MOSLASH | `f1c9a121013f` | faqat tor ekran varianti; yakunlangan darsda `finishedStatsShort` |
| `src/widgets/group-workspace/cancel-lesson-dialog.tsx` | 🟡 MOSLASH | `010e46108b01` | `ModalCard` -> `Sheet variant="app"` |
| `src/widgets/group-workspace/task-cards.tsx` | 🟡 MOSLASH | `645a84312ccc` | "⋮" menyusi `PopoverMenu`; `mobile-assignment-list.tsx` va `add-quiz-menu.tsx` ham shu faylda |
| `src/widgets/group-workspace/mobile-assignment-list.tsx` | 🟡 MOSLASH | `aa1277096592` | mobilda `task-cards.tsx` ichida (`MobileAssignmentList`) |
| `src/widgets/group-workspace/add-quiz-menu.tsx` | 🟡 MOSLASH | `2c72f4ae7e85` | mobilda `task-cards.tsx` ichida (`AddQuizMenu`, `PopoverMenu`) |
| `src/widgets/group-workspace/panel-heading.tsx` | 🟡 MOSLASH | `48e4699dd96e` | — |
| `src/widgets/group-workspace/club-members-panel.tsx` | 🟡 MOSLASH | `942d208fd475` | qo'shish oynasi pastki `Sheet`; tab `group-workspace.tsx` dagi `CLUB_TABS` da |
| `src/widgets/student-group-workspace/student-group-workspace.tsx` | 🟡 MOSLASH | `6e635a063f9c` | faqat tor ekran shoxi (`StudentGroupSection`) — guruh chatidagi "Darslar" va "Vazifalar" tablari |
| `src/widgets/student-group-workspace/student-lessons.tsx` | 🟡 MOSLASH | `a8a5b9c66857` | faqat tor ekran varianti; baholash `RateLessonSheet` |
| `src/widgets/student-group-workspace/student-tasks.tsx` | 🟡 MOSLASH | `ad5dcf56cfb0` | faqat tor ekran varianti |
| `src/widgets/student-group-workspace/use-assignment-rows.ts` | 🟡 MOSLASH | `4572affcc7ef` | `navigate` o'rniga `router.push(..., { withAnchor: true })` |
| `src/widgets/forward-dialog/forward-dialog.tsx` | 🟡 MOSLASH | `c22c79a14efe` | pastki oyna (`Sheet variant="app"`) |
| `src/pages/teacher/conversation-page.tsx` | 🟡 MOSLASH | `7ae453d9b1fb` | mobilda `pages/chats/conversation-page.tsx` (guruh qismi `group-workspace.tsx` dagi chat bilan birga). Tor ekrandagidek jonli dars chizig'i yo'q. O'quvchida vazifa kartasi vazifa sahifasini ochadi va topshirilganini ko'rsatadi; e'lonlar kanalida yozish maydoni o'rniga ogohlantirish. Qadalgan xabarni olib tashlash `pinned: true` bilan (vebda `false` ketadi — xabar qayta qadaladi, `useChat.pinMessage` ma'nosiga zid); o'qilganlik faqat kelgan xabarga (`readKey`); kutilayotgan/bloklangan shaxsiy chatda `DirectRequestBar` (oldingi qattiq yozilgan o'zbekcha izoh olib tashlandi) |
| `src/widgets/live-room/live-room.tsx` | 🟡 MOSLASH | `b51311f38c8f` | tor ekran shoxi (`mobile-live-room.tsx` bilan bitta faylda): sahna, 3 ustunli plitkalar, pastki panel; brauzerdagi yozuv yo'q (yozuv server tomonda) — REC belgisi o'qituvchida ham server `recordingActive` dan (vebda o'qituvchida brauzer yozuvi); `MediaPermissionDialog` yo'q — ruxsatni Android so'raydi; doska to'liq ekranda hozircha `BoardSurface` (5-bosqichda `BoardPanel` mobil ko'rinishi) |
| `src/widgets/live-room/mobile-live-room.tsx` | 🟡 MOSLASH | `4d274234abf8` | mobilda `live-room.tsx` ichida (`RoomBody`, `ToolbarButton`, `CameraTile`) |
| `src/widgets/live-room/live-room-state.tsx` | 🟡 MOSLASH | `83ff7305c2e7` | faqat tor ekran varianti (doim qorong'i) |
| `src/widgets/live-room/use-elapsed-seconds.ts` | 🟢 NUSXA | `6a64d9089071` | — |
| `src/modules/conversation/lib/last-message.ts` | 🟢 NUSXA | `9a3b37afbe12` | — |
| `src/modules/exam/api/exam.api.ts` | 🟢 NUSXA | `392f41feb6f3` | — |
| `src/modules/exam/api/exam.endpoints.ts` | 🟢 NUSXA | `4fed44d6b712` | — |
| `src/modules/exam/index.ts` | 🟡 MOSLASH | `d0aa0dcfa65c` | veb barrel minus `ui/` eksportlari |
| `src/modules/exam/model/exam.queries.ts` | 🟢 NUSXA | `1355af5cafae` | — |
| `src/modules/material/api/material.api.ts` | 🟢 NUSXA | `8b187e5ea467` | — |
| `src/modules/material/api/material.dto.ts` | 🟢 NUSXA | `dff74a0f86ec` | — |
| `src/modules/material/api/material.endpoints.ts` | 🟢 NUSXA | `42ffb0ad938d` | — |
| `src/modules/material/index.ts` | 🟢 NUSXA | `7d4168ed2ca4` | — |
| `src/modules/material/model/material.queries.ts` | 🟢 NUSXA | `24ff3daab927` | — |
| `src/modules/search/api/search.api.ts` | 🟢 NUSXA | `856a45a5bd40` | — |
| `src/modules/search/api/search.dto.ts` | 🟢 NUSXA | `ee4f5d773e85` | — |
| `src/modules/search/api/search.endpoints.ts` | 🟢 NUSXA | `9d234707726a` | — |
| `src/modules/search/index.ts` | 🟢 NUSXA | `7b9bd0bd2699` | — |
| `src/modules/search/model/search.queries.ts` | 🟢 NUSXA | `b03fcec57b3e` | — |
| `src/modules/support/api/support.api.ts` | 🟢 NUSXA | `6563a2ec4da0` | — |
| `src/modules/support/api/support.dto.ts` | 🟢 NUSXA | `da35f39b892c` | — |
| `src/modules/support/api/support.endpoints.ts` | 🟢 NUSXA | `4074a461df2f` | — |
| `src/modules/support/index.ts` | 🟡 MOSLASH | `30f7a662d77d` | veb barrel minus `ui/` eksportlari; mobil `SupportDialog` alohida bo'limda |
| `src/modules/support/model/support.queries.ts` | 🟢 NUSXA | `dc55fa0171da` | — |
| `src/modules/support/ui/support-dialog.tsx` | 🟡 MOSLASH | `8ac44facd076` | `AppDialog variant="panel"` -> `Sheet variant="app"`; yangi murojaat va javob tugmalari oyna pastki qatorida; xodim ko'rinishi `SupportDialog staffView` (vebda alohida `SupportThread staffView`) |
| `src/modules/tutor/api/tutor.api.ts` | 🟢 NUSXA | `528d187d1499` | — |
| `src/modules/tutor/api/tutor.dto.ts` | 🟢 NUSXA | `3e37a652c909` | — |
| `src/modules/tutor/api/tutor.endpoints.ts` | 🟢 NUSXA | `684db9b4d7ab` | — |
| `src/modules/tutor/index.ts` | 🟡 MOSLASH | `6e07e223d9e3` | veb barrel minus `ui/` eksportlari; mobil `PracticeSession` alohida bo'limda |
| `src/modules/tutor/lib/tutor.mappers.ts` | 🟢 NUSXA | `5e472f3de6e5` | — |
| `src/modules/tutor/model/tutor.queries.ts` | 🟢 NUSXA | `59bfd0df3bfc` | — |
| `src/pages/workspace/materials-page.tsx` | 🟡 MOSLASH | `8ef427675303` | faqat tor ekran varianti; `SelectPicker` -> `MobilePickerField`, `FilterChips compact` -> `MobileSegment scroll="auto"`, yuklash `AppDialog` -> `Sheet`; fayl `pickDocument` (kengaytmalar o'rniga MIME ro'yxati); yuklab olish — OS ulashish oynasi (`downloadBlob`) |
| `src/pages/teacher/workspace/share-results-dialog.tsx` | 🟡 MOSLASH | `6e3853cc00dd` | mobilda `pages/workspace/tests/share-results-dialog.tsx`; `AppDialog` -> `Sheet variant="app"` |
| `src/pages/student/workspace/student-ai-page.tsx` | 🟡 MOSLASH | `3068926e14dc` | faqat tor ekran varianti; maydonlar klaviatura ustida (`KeyboardAwareScrollView`) |
| `src/modules/tutor/ui/practice-session.tsx` | 🟡 MOSLASH | `fed1593cf756` | RN komponentlari; barrel'ning mobil UI bo'limidan eksport |
| `src/pages/admin/certificates/admin-certificates-page.tsx` | 🟡 MOSLASH | `85eebc2f140b` | mobilda `pages/admin/admin-certificates-page.tsx`; portal uslubi (`admin-teachers-page` kabi); tugmalar qator ostida; fayl `Linking.openURL`; rad etish `Sheet` |
| `src/pages/admin/support/admin-support-page.tsx` | 🟡 MOSLASH | `21a5e503ddbb` | mobilda `pages/admin/admin-support-page.tsx`; portal uslubi; yozishma `SupportDialog staffView`; `?ticket=` — `router.setParams` |
| `src/modules/attendance/lib/lesson-roster.ts` | 🟢 NUSXA | `6e6fd57cfd83` | — |
| `src/widgets/lesson-attendance/index.ts` | 🟢 NUSXA | `3e5a33642bc9` | — |
| `src/widgets/lesson-attendance/lesson-attendance-dialog.tsx` | 🟡 MOSLASH | `e3a4e31ae05d` | `AppDialog variant="panel"` -> `Sheet variant="app"`; statistika kartalari 2 ustunda; chiqishlar qatori bosilganda ochiladi |
| `src/modules/conversation/model/chat-realtime.ts` | 🟢 NUSXA | `6db18a4ac217` | — |
| `src/modules/conversation/model/typing.store.ts` | 🟢 NUSXA | `b86832cf4795` | — |
| `src/modules/conversation/api/channel.api.ts` | 🟢 NUSXA | `c1e6977175ba` | — |
| `src/modules/conversation/api/spam-report.api.ts` | 🟢 NUSXA | `c7899e1314fe` | — |
| `src/modules/conversation/model/spam-reports.ts` | 🟢 NUSXA | `abd826f0d617` | — |
| `src/modules/conversation/model/use-channels.ts` | 🟢 NUSXA | `6b312575bfff` | — |
| `src/modules/conversation/model/use-start-direct-chat.ts` | 🟡 MOSLASH | `aebcf47465f7` | react-router `useNavigate` -> expo-router `router.push` |
| `src/modules/conversation/ui/person-chat-hint.tsx` | 🟡 MOSLASH | `f06d7e072deb` | `small`/`Icon` -> `DsText`/`Icon` |
| `src/modules/conversation/ui/report-conversation-dialog.tsx` | 🟡 MOSLASH | `5858f6abb9af` | pastki `Sheet`; radio ro'yxat `Pressable` bilan; mobilda shaxsiy chatning `conversation-info-sheet.tsx` ichida ochiladi (veb: `conversation-info-panel.tsx`) |
| `src/modules/conversation/ui/channel-avatar.tsx` | 🟡 MOSLASH | `10c923a3bcf7` | `<img>` -> `Image`; o'lcham va radius props bilan (`className` o'rniga) |
| `src/modules/notification/model/realtime-hub.ts` | 🟢 NUSXA | `8a4448c4d28d` | — |
| `src/modules/notification/model/realtime-hub-context.ts` | 🟢 NUSXA | `e48e1809a6ca` | — |
| `src/shared/lib/zod.ts` | 🟢 NUSXA | `231a0d61d1ce` | — |
| `src/app/router/realtime-sync.tsx` | 🟡 MOSLASH | `8a90d910424f` | mobilda `providers/realtime-sync.tsx` — marshrutda emas, `NotificationBridge` ichida (soket ilova bo'ylab bitta); ota-ona va adminda faqat `useNotificationFeed` |
| `src/shared/ui/mobile-action-bar.tsx` | 🟡 MOSLASH | `92b6c28ae6ee` | mobilda `mobile-page.tsx` ichida |
| `src/shared/ui/floating-watermark.tsx` | 🟡 MOSLASH | `74bf70261276` | RN `View` + reanimated (opacity 1 s); `translate(-x%, -y%)` o'rniga `onLayout` o'lchami; logo — `Logo` komponenti; mobilda `recording-page.tsx` dagi `RecordingVideo` ustida |
| `src/shared/ui/role-tag.tsx` | 🟡 MOSLASH | `050848b538b6` | RN `View` + `DsText`; `className` o'rniga `style` |
| `src/modules/auth/ui/force-password-dialog.tsx` | 🟡 MOSLASH | `14e2219182ac` | markaziy oyna `CenterDialog` (yopilmaydi, klaviaturadan qochadi); vebda har rol marshrutida (`role-route.tsx`), mobilda ildiz layout'da bitta nusxa |
| `src/modules/auth/lib/account-link.ts` | 🟢 NUSXA | `7d11d910393c` | — |
| `src/modules/auth/lib/account-switch.ts` | 🟢 NUSXA | `c3456f35da4c` | — |
| `src/modules/auth/model/use-account-switch.ts` | 🟡 MOSLASH | `0378ebd833ab` | react-router `useNavigate` -> expo-router `useRouter` (`replace`/`push`) |
| `src/modules/auth/ui/link-account-dialog.tsx` | 🟡 MOSLASH | `b37bb4522e4e` | pastki `Sheet` + `MobileInput`; mantiq (`seed`, xato turlari, qulflangan login) bir xil; `SwitchAccountDialog` ichida ichma-ich ochiladi (iOS ikkita yonma-yon Modal'ni ko'rsatmaydi) |
| `src/modules/parent/api/parent.endpoints.ts` | 🟢 NUSXA | `85b3cf9db4d0` | — |
| `src/modules/parent/lib/parent-attendance.ts` | 🟢 NUSXA | `b3352ac652af` | — |
| `src/modules/parent/lib/parent-errors.ts` | 🟢 NUSXA | `ce4e5985c831` | — |
| `src/modules/parent/lib/parent-family.ts` | 🟢 NUSXA | `a76b515ffaf9` | — |
| `src/modules/parent/lib/parent-home.ts` | 🟢 NUSXA | `8d8358678799` | — |
| `src/modules/parent/lib/parent-homework.ts` | 🟢 NUSXA | `fdc943dd8fce` | — |
| `src/modules/parent/lib/parent-logins.ts` | 🟢 NUSXA | `8b6e373bfc79` | — |
| `src/modules/parent/lib/parent-results.ts` | 🟢 NUSXA | `d2ef630e07d5` | — |
| `src/modules/parent/lib/password-strength.ts` | 🟢 NUSXA | `cbc3f52dcb3b` | — |
| `src/modules/parent/lib/download-file.ts` | 🔴 QAYTA | `e07912d3f4f4` | DOM `<a download>` o'rnida `shared/lib/share-file.ts` (keshdagi fayl + ulashish oynasi), asinxron; `downloadBlob` mobilda `shared/lib/download.ts` dan |
| `src/modules/parent/lib/print-table.ts` | 🟡 MOSLASH | `d23944351cda` | yashirin iframe + `window.print` o'rnida HTML -> A4 albom PDF (`expo-print`, `shared/lib/share-file.ts`) va ulashish; chetlar ham `@page` da (Android), ham `margins` parametrida (iOS) — har platforma bittasini oladi |
| `src/modules/parent/ui/add-child-dialog.tsx` | 🟡 MOSLASH | `8c9ef0e504f7` | faqat telefon shoxi: pastki oynada usul bosilishi bilan o'z oynasi ochiladi (350 ms keyin — ikki `Modal` bir vaqtda emas) |
| `src/modules/parent/ui/link-child-dialog.tsx` | 🟡 MOSLASH | `9ea57b268c48` | telefon shoxi: forma `Sheet`, natija `ChildSuccessScreen` (vebda `AppDialog variant="fullscreen"`) — forma yopilgach 350 ms dan keyin (iOS ikki `Modal` ni bir vaqtda almashtirmaydi) |
| `src/modules/parent/ui/create-child-dialog.tsx` | 🟡 MOSLASH | `d5e66b8c3ae6` | telefon shoxi; `navigator.share` o'rnida RN `Share`, nusxa `expo-clipboard`; PDF (`printCredentials`) telefonda yo'q — vebda ham; natija ekrani forma yopilgach 350 ms dan keyin |
| `src/modules/parent/ui/child-dialog-parts.tsx` | 🟡 MOSLASH | `cc7564342a53` | `child-dialog-styles.ts` ham shu yerda (`ChildButton`, `ChildInput`, `ChildLabel`, `ChildNote`); `ChildSuccessScreen` — butun ekranli natija; `Celebration` holat ekranlarida ham ishlatiladi |
| `src/modules/parent/ui/child-dialog-styles.ts` | 🟡 MOSLASH | `57b28d0393ab` | mobilda `child-dialog-parts.tsx` ichida |
| `src/widgets/parent-shell/parent-mobile-shell.tsx` | 🟡 MOSLASH | `127b7a244637` | mobilda `app/parent/_layout.tsx`: `RoleTabs` suzuvchi paneli, `ParentUnlinked`/`ParentOffline` navigator ustidan qoplanadi; `pb-32` va fon — `widgets/parent-shell/parent-screen.tsx` |
| `src/widgets/parent-shell/parent-tab-bar.tsx` | 🟡 MOSLASH | `40d2d81f4a2e` | mobilda `providers/role-tabs.tsx` `FloatingTabBar` (`badge`, `siblings: [exams]`, `floatingBottom: 24`, `backBehavior: history`); ochiq vazifalar soni `parent-tab-badge.tsx` |
| `src/widgets/parent-shell/parent-mobile-header.tsx` | 🟡 MOSLASH | `7e28b8cd9ae4` | `Link` o'rnida `Pressable` + `router.push` |
| `src/widgets/parent-shell/parent-bell.tsx` | 🟡 MOSLASH | `83a50b42e52f` | telefonda faqat sahifa havolasi (popover yo'q); `.notification-badge` uslubi qo'lda |
| `src/widgets/parent-shell/child-chips.tsx` | 🟡 MOSLASH | `d1a9516c7d06` | `AppDialog sheet` -> `Sheet`; qo'shish oynasi tanlagich yopilgach (350 ms) |
| `src/widgets/parent-shell/parent-states.tsx` | 🟡 MOSLASH | `e7e7b61fc72e` | `ParentUnlinked` sahifani almashtirmaydi, ustidan qoplaydi (navigator holati saqlanadi) |
| `src/widgets/parent-shell/parent-state-screen.tsx` | 🟡 MOSLASH | `c482ccb9e3c4` | faqat telefon shoxi; halqa rasmi `Celebration` (`modules/parent`) bilan umumiy |
| `src/widgets/parent-shell/parent-state-styles.ts` | 🟡 MOSLASH | `27ff538fb319` | mobilda `parent-state-screen.tsx` ichida |
| `src/widgets/parent-shell/parent-locked-card.tsx` | 🟡 MOSLASH | `f087b471afc8` | telefonda ruxsatlar sahifasiga (`withAnchor`) |
| `src/widgets/parent-shell/parent-error-banner.tsx` | 🟡 MOSLASH | `f557d547d20e` | ko'rinish bir xil |
| `src/widgets/parent-shell/use-parent-notification-link.ts` | 🟡 MOSLASH | `dbbec7df12dc` | `navigate` -> `router.push(..., { withAnchor })`; push bosilganda ham ishlaydi (`providers/notification-bridge.tsx`, `data.student_id`) |
| `src/widgets/parent-shell/index.ts` | 🟡 MOSLASH | `ed29f02cba0c` | keng ekran eksportlari yo'q; `ParentScreen`, `useParentBack`, `OpenHomeworkBadge`, holat ekranlari qo'shilgan |
| `src/pages/parent/dashboard/use-parent-home.ts` | 🟢 NUSXA | `2b13b3ec170e` | — |
| `src/pages/parent/dashboard/home-format.ts` | 🟢 NUSXA | `4eb42b803570` | — |
| `src/pages/parent/dashboard/parent-home-mobile.tsx` | 🟡 MOSLASH | `df5954fed832` | `ParentScreen` ichida (pastga tortib yangilash); halqa va uzuq chiziq `react-native-svg`; `MobileConnect` boshqa bo'limlarda ham |
| `src/pages/parent/dashboard/home-hero.tsx` | 🟡 MOSLASH | `79b9305a12f6` | faqat `compact` shoxi |
| `src/pages/parent/dashboard/home-recent.tsx` | 🟡 MOSLASH | `4e0b5c99f35f` | `Link` -> `router.navigate` |
| `src/pages/parent/dashboard/home-side.tsx` | 🟡 MOSLASH | `ec3453baf9fc` | `AttentionCard` va `ScoreCard` (chizma eni karta enidan o'lchanadi, `viewBox` cho'zilmaydi) |
| `src/pages/parent/dashboard/pending-link-actions.tsx` | 🟡 MOSLASH | `5a4e6a006b91` | `ConfirmDialog alert` -> mobil `ConfirmDialog` |
| `src/pages/parent/children/use-parent-family.ts` | 🟢 NUSXA | `cbf225ecbd69` | — |
| `src/pages/parent/children/use-child-profile.ts` | 🟢 NUSXA | `d6ab0e23f96a` | — |
| `src/pages/parent/children/family-format.ts` | 🟢 NUSXA | `1a08d077a715` | — |
| `src/pages/parent/children/login-format.ts` | 🟢 NUSXA | `42b98ef2a15f` | — |
| `src/pages/parent/children/family-mobile.tsx` | 🟡 MOSLASH | `d1a9114be013` | kutilayotgan so'rov ramkasi SVG (Android `dashed` ramkani notekis chizadi) |
| `src/pages/parent/children/child-avatar.tsx` | 🟡 MOSLASH | `e1a7ad9a6523` | o'lchamlar px'da (`box`) |
| `src/pages/parent/children/child-profile-mobile.tsx` | 🟡 MOSLASH | `50561be22d65` | orqaga — stek (`useParentBack`) |
| `src/pages/parent/children/parent-child-profile-page.tsx` | 🟡 MOSLASH | `81ed03990394` | mobilda `app/parent/children/[childId]/index.tsx` |
| `src/pages/parent/children/parent-child-logins-page.tsx` | 🟡 MOSLASH | `acfde4e574a1` | mobilda `app/parent/children/[childId]/logins.tsx` |
| `src/pages/parent/children/parent-child-permissions-page.tsx` | 🟡 MOSLASH | `9e4080227e99` | `childId` marshrut parametri (`app/parent/children/[childId]/permissions.tsx`) |
| `src/pages/parent/children/child-logins-mobile.tsx` | 🟡 MOSLASH | `bcb91995cbae` | filtr `AppDialog` -> `Sheet` |
| `src/pages/parent/children/child-logins.tsx` | 🟡 MOSLASH | `fcdad3d2145d` | faqat `LoginDetail` — mobilda `login-detail.tsx` (pastki oyna, tugmalar `column-reverse`) |
| `src/pages/parent/children/child-sessions.tsx` | 🟡 MOSLASH | `d02f97e9583a` | ko'rinish bir xil |
| `src/pages/parent/children/consent-switches.tsx` | 🟡 MOSLASH | `c0e2d0d7efbe` | ko'rinish bir xil |
| `src/pages/parent/children/unlink-child-dialog.tsx` | 🟡 MOSLASH | `35f7e93bb544` | uzilgach `router.dismissTo(children)` |
| `src/pages/parent/attendance/use-attendance-view.ts` | 🟢 NUSXA | `52d488d332fd` | — |
| `src/pages/parent/attendance/attendance-format.ts` | 🟢 NUSXA | `556d238833d0` | — |
| `src/pages/parent/attendance/attendance-mobile.tsx` | 🟡 MOSLASH | `fdc102c90704` | `<select>` -> `MobilePickerField`; `AttendanceList` kalendar va qidiruvda ham |
| `src/pages/parent/attendance/attendance-calendar-page.tsx` | 🟡 MOSLASH | `a228d1bf56b1` | orqaga — stek |
| `src/pages/parent/attendance/attendance-search-page.tsx` | 🟡 MOSLASH | `227c41e8d8f4` | orqaga — stek |
| `src/pages/parent/attendance/attendance-detail.tsx` | 🟡 MOSLASH | `363a171f20ca` | `AppDialog panel` -> `Sheet` |
| `src/pages/parent/attendance/attendance-report.tsx` | 🟡 MOSLASH | `b1e21aa8851e` | PDF — `printTable` (expo-print), Excel — CSV; ikkalasi ulashish oynasida (oyna yopilgach); `<select>` -> `MobilePickerField` |
| `src/pages/parent/attendance/attendance-parts.tsx` | 🟡 MOSLASH | `e362cc261101` | `StatusChip`, `DateTile` (`FocusBar` — keng ekran) |
| `src/pages/parent/attendance/attendance-summary.tsx` | 🟡 MOSLASH | `0ae651b50b4f` | `AttendanceDonut`, `MiniCalendar` (7 ustun `14.28%` — aniq kasr yaxlitlashda sig'mas edi) |
| `src/pages/parent/attendance/attendance-styles.ts` | 🟡 MOSLASH | `8f6b70424d16` | Tailwind sinflari o'rnida `ds` tokenlari |
| `src/pages/parent/homework/use-homework-view.ts` | 🟢 NUSXA | `9ec0ac892cca` | — |
| `src/pages/parent/homework/homework-format.ts` | 🟢 NUSXA | `8e80b63c0ae1` | — |
| `src/pages/parent/homework/homework-mobile.tsx` | 🟡 MOSLASH | `6ec3854cbb80` | ko'rinish bir xil |
| `src/pages/parent/homework/homework-list.tsx` | 🟡 MOSLASH | `1a0bbee4920e` | `selectedId` yo'q — telefonda tafsilot alohida sahifa |
| `src/pages/parent/homework/homework-detail.tsx` | 🟡 MOSLASH | `138c6623185e` | yuklab olish `shared/lib` `downloadBlob` (ulashish oynasi) |
| `src/pages/parent/homework/homework-styles.ts` | 🟡 MOSLASH | `d8968c2f66b1` | Tailwind sinflari o'rnida `ds` tokenlari |
| `src/pages/parent/homework/parent-homework-item-page.tsx` | 🟡 MOSLASH | `3a3679a2de5f` | mobilda `app/parent/homework/[assignmentId].tsx` |
| `src/pages/parent/report/results-mobile.tsx` | 🟡 MOSLASH | `cdbc0f3f8eaa` | oy tanlash `<select>` -> `MobileSelectSheet` |
| `src/pages/parent/report/results-parts.tsx` | 🟡 MOSLASH | `aa04d1bfed54` | `ResultsTabs` faqat `wide`; `MonthPicker` keng ekranda |
| `src/pages/parent/report/parent-course-page.tsx` | 🟡 MOSLASH | `0e9312907473` | mobilda `app/parent/grades/[courseId].tsx` |
| `src/pages/parent/exams/use-mock-view.ts` | 🟢 NUSXA | `8f6d03e0c371` | — |
| `src/pages/parent/exams/mock-mobile.tsx` | 🟡 MOSLASH | `5c2ea1c58738` | ko'rinish bir xil |
| `src/pages/parent/exams/mock-result-dialog.tsx` | 🟡 MOSLASH | `6a419836a450` | `AppDialog` -> `Sheet`; PDF `useResultPdf` (ulashish oynasi) |
| `src/pages/parent/exams/mock-styles.ts` | 🟡 MOSLASH | `a603022ad9b9` | Tailwind sinflari o'rnida `ds` tokenlari |
| `src/pages/parent/exams/parent-exam-result-page.tsx` | 🟡 MOSLASH | `49aef1743b65` | mobilda `app/parent/exams/[examId].tsx` |
| `src/pages/parent/settings/parent-profile-page.tsx` | 🟡 MOSLASH | `c7f8cd16476b` | mobilda `app/parent/(account)/profile.tsx` |
| `src/pages/parent/settings/parent-settings-page.tsx` | 🟡 MOSLASH | `eb3c8a32a1a7` | `section` marshrut parametri (`app/parent/(account)/settings/[section].tsx`) |
| `src/pages/parent/settings/parent-help-page.tsx` | 🟡 MOSLASH | `e76812a19546` | telefon shoxi — umumiy `HelpCenterPage` |
| `src/pages/parent/settings/parent-not-found-page.tsx` | 🟡 MOSLASH | `fec50f1a61c2` | mobilda `app/parent/[...missing].tsx` to'g'ridan-to'g'ri `ParentNotFound` |
| `src/pages/parent/settings/settings-mobile-profile.tsx` | 🟡 MOSLASH | `73b8dab8ec0b` | avatar — `pickImage` (kamera / galereya); nusxa `expo-clipboard`; qatorlar `settings-parts.tsx` |
| `src/pages/parent/settings/settings-mobile-system.tsx` | 🟡 MOSLASH | `c5d9acc70f7d` | push — OS ruxsati (`usePushPermission`), sarlavha `account:page.pushTitle` (vebda "Brauzer bildirishnomalari"); Xavfsizlik sahifasida "Akkauntni o'chirish" — mobilga xos (vebda ota-onada yo'q, Play Market ilova ichida o'chirishni talab qiladi) |
| `src/pages/parent/notifications/parent-notifications-page.tsx` | 🟡 MOSLASH | `5e596c1faa3f` | `NotificationHtml` o'rnida `splitHtml` (sarlavha / matn) |
| `src/pages/parent/notifications/notification-actions.tsx` | 🟡 MOSLASH | `b2d39cb08e58` | `AppDialog sheet` -> `Sheet`; havola oyna yopilgach ochiladi |
| `src/widgets/parent-shell/parent-screen.tsx` | 🆕 MOBIL | `—` | ota-ona sahifa qobig'i: `bg-auth-gradient`, xavfsiz hudud, tab sahifalarida `pb-32`, pastga tortib yangilash, formalarda `KeyboardAwareScrollView` |
| `src/widgets/parent-shell/use-parent-back.ts` | 🆕 MOBIL | `—` | ichki sahifadan orqaga: stek bo'lsa `back`, havola orqali kirilgan bo'lsa bo'lim manziliga |
| `src/widgets/parent-shell/parent-tab-badge.tsx` | 🆕 MOBIL | `—` | veb `parent-tab-bar.tsx` dagi ochiq vazifalar soni — panel belgisi o'z so'rovini o'zi qiladi |
| `src/widgets/parent-shell/parent-account-switch-dialog.tsx` | 🟡 MOSLASH | `c2f495ee24fc` | tor ekran varianti — pastki `Sheet`; bog'lash oynasi ichma-ich (iOS) |
| `src/widgets/parent-shell/parent-chat-button.tsx` | 🟡 MOSLASH | `20bc884ddb8c` | `MobileRoundButton` + ko'k belgi |
| `src/pages/parent/settings/settings-parts.tsx` | 🆕 MOBIL | `—` | veb `settings-mobile-*` dagi `MenuRow`/`Row`, maydon va xato lentasi |
| `src/pages/parent/chats/parent-chat-list.tsx` | 🟡 MOSLASH | `2e919e514c67` | faqat tor ekran (`compact`); `ParentScreen` ichida, suhbat `/parent/chats/[conversationId]` da |
| `src/pages/parent/chats/parent-new-chat-dialog.tsx` | 🟡 MOSLASH | `55a889f0bff5` | pastki `Sheet` |
| `src/pages/parent/chats/parent-chats-page.tsx` | 🟡 MOSLASH | `2d7184af76e7` | mobilda `app/parent/chats/` stack'i: ro'yxat (`parent-chat-list.tsx`) va suhbat — umumiy `pages/chats/conversation-page.tsx` (`role="parent"`); vebdagi `DirectChatView` mobilda shu sahifaning shaxsiy chat shoxi |
| `src/shared/lib/share-file.ts` | 🆕 MOBIL | `—` | matnli fayl va HTML -> PDF (`expo-print`) ni keshga yozib ulashish oynasini ochish (veb yuklab olish / chop etish o'rni) |
| `src/shared/lib/zoom.ts` | 🟢 NUSXA | `621584f47f73` | — |
| `src/modules/lesson/lib/bulk-lessons.ts` | 🟢 NUSXA | `37de94dc8000` | — |
| `src/modules/lesson/lib/recording-choice.ts` | 🟢 NUSXA | `ce8202a61f5d` | — |
| `src/modules/board/lib/board-edit.ts` | 🟢 NUSXA | `5c28899c0ef3` | — |
| `src/modules/board/lib/board-resize.ts` | 🟢 NUSXA | `efadfe2884db` | — |
| `src/modules/board/lib/board-select.ts` | 🟢 NUSXA | `b1d8d2ddf7e8` | — |
| `src/modules/board/lib/board-zoom.ts` | 🟢 NUSXA | `ced6153dedba` | — |
| `src/modules/board/lib/code-editing.ts` | 🟢 NUSXA | `37300f695eea` | — |
| `src/modules/board/model/use-code-tokens.ts` | 🟢 NUSXA | `0c0a5f6d9fe4` | — |
| `src/modules/board/lib/code-highlight.ts` | 🟡 MOSLASH | `c1ffcb9187c7` | `highlightedLines`: highlight.js HTML'i DOM (`<template>`) o'rniga qo'lda o'qiladi (span stack + HTML entity); ranglash qoidasi bir xil |
| `src/modules/live/lib/share-source.ts` | 🟢 NUSXA | `c1da876a4f6e` | — |
| `src/modules/live/lib/client-health.ts` | 🟢 NUSXA | `ba90ea5fcb94` | — |
| `src/modules/live/model/use-media-mode-channel.ts` | 🟢 NUSXA | `8e33aed6b85f` | — |
| `src/modules/parent/lib/child-scores.ts` | 🟢 NUSXA | `41e236fb0b87` | — |
| `src/modules/progress/api/progress.api.ts` | 🟢 NUSXA | `9a77a51535f4` | — |
| `src/modules/progress/api/progress.dto.ts` | 🟢 NUSXA | `9e67b4007e81` | — |
| `src/modules/progress/api/progress.endpoints.ts` | 🟢 NUSXA | `80f1e276542e` | — |
| `src/modules/progress/index.ts` | 🟢 NUSXA | `0a95e89e2c74` | — |
| `src/modules/progress/lib/progress.mappers.ts` | 🟢 NUSXA | `a5723f6ba7ff` | — |
| `src/modules/progress/model/progress.queries.ts` | 🟢 NUSXA | `e4f2d34c2968` | — |
| `src/widgets/audience-picker/audience-picker.tsx` | 🟡 MOSLASH | `d61c1ba9ed6b` | checkbox o'rniga `Pressable`: tanlangani `check-box-fill`, tanlanmagani bo'sh kvadrat (vebdagi `check-box` ikonkasi ichida belgi bor); ro'yxatlar `ScrollView` (`max-h-52`) |
| `src/widgets/audience-picker/index.ts` | 🟢 NUSXA | `d394414f6c9e` | — |
| `src/widgets/new-chat-menu/new-chat-menu.tsx` | 🟡 MOSLASH | `be764d02ad98` | `Dropdown` -> `PopoverMenu`; trigger tugmasi komponent ichida (`children` o'rniga) |
| `src/widgets/new-chat-menu/create-audience-dialog.tsx` | 🟡 MOSLASH | `da4a61b61f45` | pastki `Sheet` + `MobileInput` |
| `src/widgets/channel-view/channel-view.tsx` | 🟡 MOSLASH | `f63b5a45e628` | faqat tor ekran; izohlar to'liq ekran `Modal` (`channel-thread.tsx`); mobilda `pages/chats/conversation-page.tsx` kanal turida shu ko'rinishni qaytaradi |
| `src/widgets/channel-view/channel-thread.tsx` | 🟡 MOSLASH | `1b1f66ef493d` | to'liq ekran `Modal` (vebda tor ekranda `fixed inset-0`); `textarea` -> ko'p qatorli `TextInput` |
| `src/widgets/channel-view/channel-info-dialog.tsx` | 🟡 MOSLASH | `38e8017ad9ad` | pastki `Sheet`; rasm `pickImage`; a'zo qo'shish va o'chirish oynalari shu oynaning ichida (iOS) |
| `src/widgets/channel-view/index.ts` | 🟢 NUSXA | `7d9248d9b9ef` | — |

## Ataylab ko'chirilmagan

| Veb fayl | Sabab |
|---|---|
| `src/modules/lesson/lib/teacher-audio-recording.ts` | Mijoz tomon yozuvi — Egress server tomonda (§7.3) |
| `src/modules/lesson/lib/teacher-video-recording.ts` | Mijoz tomon yozuvi — Egress server tomonda (§7.3) |
| `src/modules/lesson/model/use-teacher-audio-recording.ts` | Yuqoridagining hook'i |
| `src/modules/lesson/model/use-teacher-video-recording.ts` | Yuqoridagining hook'i |
| `src/modules/lesson/lib/recording-upload-queue.ts` | Mijoz tomon yozuvining IndexedDB navbati — mobilda yozuv server tomonda |
| `src/shared/ui/svg-icon.tsx` | Veb bundle optimizatsiyasi (`?raw` SVG) — mobil `Icon` o'z SVG xaritasidan |
| `src/modules/board/lib/mathlive-loader.ts` | Web Component loader — Faza 5 da WebView bilan |
| `src/modules/board/model/use-board-drawing.ts` | DOM pointer events — Faza 5 da Skia + gesture-handler |
| `src/modules/live/lib/screen-capture.ts` | brauzer `getDisplayMedia` — mobilda ekran ulashish LiveKit orqali, iOS'da v1.1 |
| `src/shared/ui/** (80+ fayl)` | shadcn/Radix — mobil dizayn tizimi alohida (§8.2) |
| `src/modules/*/ui/**` | UI ko'chirilmaydi (§5) |
| `src/pages/**, src/widgets/**, src/app/**` | UI qatlami — mobil uchun qayta yoziladi |
| `src/pages/parent/**` (keng ekran shoxlari) | `parent-home`, `home-empty/side(ScoreCard'dan tashqari)/stats/skeleton`, `parent-family`, `family-cards/table`, `child-profile`, `child-logins` (`LoginDetail`dan tashqari), `parent-attendance`, `attendance-calendar/filter/table`, `parent-homework`, `parent-mock`, `parent-results`, `results-course-panel`, `parent-settings`, `settings-interface/notifications/profile/security` — faqat `useIsCompact` false bo'lganda ochiladi |
| `src/widgets/parent-shell/{parent-shell,parent-sidebar,parent-account-menu,parent-page-header,child-switcher}.tsx` | Ota-ona qobig'ining keng ekran qismi — telefonda `parent-mobile-shell` |
| `src/modules/parent/lib/print-credentials.ts`, `print-frame.ts` | Brauzerda chop etish; telefonda login-parol `Share` bilan ulashiladi (vebda ham telefon shoxi shunday) |
| `src/app/router/role-route.tsx` | Mobilda `providers/route-guards.tsx`; majburiy parol oynasi ildiz layout'da |

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
