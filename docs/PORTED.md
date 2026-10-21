# Port manifesti

> **Bu fayl majburiy.** Veb loyihadan ko'chirilgan har bir fayl shu yerda
> qayd etiladi. Ro'yxatga kirmagan ko'chirma — PR'da blocker
> (`docs/MOBILE_PLAN.md` §18.4).

- **Manba:** `Edu_Front` — port endi BOSQICHMA-BOSQICH ketmoqda, shuning uchun
  yagona commit yo'q: har faylning hash'i o'zi ko'chirilgan paytdagi veb
  holatini bildiradi. Poydevor (shared + auth), chat, kurs va dars domeni `eb02cd7` da,
  qolganlari hali `1e53492` da.
- **Oxirgi yangilanish:** 2026-10-21 (homework va auth domeni qayta sinxronlandi)
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
| `src/modules/analytics/api/analytics.api.ts` | 🟢 NUSXA | `71ec3ec8b1cc` | — |
| `src/modules/analytics/api/analytics.dto.ts` | 🟢 NUSXA | `78b8d4599cb1` | — |
| `src/modules/analytics/api/analytics.endpoints.ts` | 🟢 NUSXA | `9b926b9731e2` | — |
| `src/modules/analytics/index.ts` | 🟡 MOSLASH | `e7064b45479a` | generatsiya: veb barrel minus `ui/` eksportlari (port-barrels.mjs) |
| `src/modules/analytics/lib/analytics.mappers.ts` | 🟢 NUSXA | `d75c309664ba` | — |
| `src/modules/analytics/model/analytics.queries.ts` | 🟢 NUSXA | `53e4931cdf57` | — |
| `src/modules/analytics/ui/trend-line-chart.tsx` | 🟡 MOSLASH | `3164201c6a1e` | hisob-kitob bir xil; `<svg>` -> `react-native-svg`, sichqoncha -> bosish, qiymatlar grafik ostida; o'q belgisi kichik oraliqda kasr bilan (vebda har doim yaxlitlanadi va "1 1 0 0 0" chiqardi) |
| `src/modules/analytics/ui/trend-stacked-bar-chart.tsx` | 🟡 MOSLASH | `96a4de5f614c` | hisob-kitob bir xil; `<svg>` -> `react-native-svg`, sichqoncha -> bosish |
| `src/modules/attendance/api/attendance.api.ts` | 🟢 NUSXA | `1e046237be37` | — |
| `src/modules/attendance/api/attendance.dto.ts` | 🟢 NUSXA | `ba5a4336ddf1` | — |
| `src/modules/attendance/api/attendance.endpoints.ts` | 🟢 NUSXA | `b5b26e5a5a85` | — |
| `src/modules/attendance/index.ts` | 🟡 MOSLASH | `425a482023c2` | generatsiya: veb barrel minus `ui/` eksportlari (port-barrels.mjs) |
| `src/modules/attendance/lib/attendance.mappers.ts` | 🟢 NUSXA | `7d0841bec8ec` | — |
| `src/modules/attendance/lib/group-by-lesson.ts` | 🟢 NUSXA | `b4d5b820b1ce` | — |
| `src/modules/attendance/model/attendance.queries.ts` | 🟢 NUSXA | `4fbbab2e9fec` | — |
| `src/modules/auth/api/auth.api.ts` | 🟢 NUSXA | `606294fd2be0` | — |
| `src/modules/auth/api/auth.dto.ts` | 🟢 NUSXA | `d4080e685551` | — |
| `src/modules/auth/api/auth.endpoints.ts` | 🟢 NUSXA | `506aa2f1fdfa` | — |
| `src/modules/auth/index.ts` | 🟡 MOSLASH | `1489096b2036` | generatsiya: veb barrel minus `ui/` eksportlari (port-barrels.mjs) |
| `src/modules/auth/lib/auth-session.ts` | 🟢 NUSXA | `4e39458e320b` | — |
| `src/modules/auth/lib/auth.mappers.ts` | 🟢 NUSXA | `4718c192fad7` | — |
| `src/modules/auth/lib/describe-user-agent.ts` | 🟢 NUSXA | `ee0799ca7c53` | — |
| `src/modules/auth/lib/resolve-home-route.ts` | 🟢 NUSXA | `86d9a3f708fc` | — |
| `src/modules/auth/lib/teacher-approval.ts` | 🟢 NUSXA | `ea465e71f081` | — |
| `src/modules/auth/model/auth.mutations.ts` | 🟢 NUSXA | `92a4e4b6b9a7` | — |
| `src/modules/auth/model/auth.queries.ts` | 🟢 NUSXA | `0b52138d2b10` | — |
| `src/modules/auth/model/auth.schemas.ts` | 🟢 NUSXA | `217cf656f39d` | — |
| `src/modules/auth/model/auth.store.ts` | 🟡 MOSLASH | `754c0aea202c` | window hodisalari -> refreshTokenManager; tab obunasi va til sinxroni yo'q; sessiya raqami olindi |
| `src/modules/auth/model/use-auth.ts` | 🟢 NUSXA | `800d84e26e18` | — |
| `src/modules/board/api/board.api.ts` | 🟢 NUSXA | `4c54b3d918f0` | — |
| `src/modules/board/api/board.dto.ts` | 🟢 NUSXA | `cb6691d2ce73` | — |
| `src/modules/board/api/board.endpoints.ts` | 🟢 NUSXA | `6eaefaab2c55` | — |
| `src/modules/board/constants/board.constants.ts` | 🟢 NUSXA | `a564616525a7` | — |
| `src/modules/board/index.ts` | 🟡 MOSLASH | `baa27b7fd582` | generatsiya: veb barrel minus `ui/` + mobil doska UI eksportlari |
| `src/modules/board/lib/board-channel.ts` | 🟢 NUSXA | `561ddd1ea25e` | — |
| `src/modules/board/lib/board-flow.ts` | 🟢 NUSXA | `dbc83be61980` | — |
| `src/modules/board/lib/board-socket-manager.ts` | 🟢 NUSXA | `7f8a96915773` | — |
| `src/modules/board/lib/board.geometry.ts` | 🟢 NUSXA | `cca6c3277bc2` | — |
| `src/modules/board/lib/board.mappers.ts` | 🟢 NUSXA | `2ee309918189` | — |
| `src/modules/board/lib/formula-palette.ts` | 🟢 NUSXA | `adae5f14b4f7` | — |
| `src/modules/board/lib/periodic-board.ts` | 🟢 NUSXA | `d56c7a889fd5` | — |
| `src/modules/board/lib/rich-text.ts` | 🟡 MOSLASH | `1723fd242bf7` | htmlToLines ko'chirilmadi (contenteditable + getComputedStyle); qolgan uchta sof funksiya bir xil |
| `src/modules/board/model/board.queries.ts` | 🟢 NUSXA | `b33f7830a871` | — |
| `src/modules/board/model/use-board-channel.ts` | 🟢 NUSXA | `734d17e2d1f4` | — |
| `src/modules/board/model/use-board-realtime.ts` | 🟢 NUSXA | `d430aa8e9fe3` | — |
| `src/modules/board/ui/away-students-notice.tsx` | 🟡 MOSLASH | `86e30eba5686` | farq qayd etilmagan — tekshiring |
| `src/modules/board/ui/bohr-model.tsx` | 🔴 QAYTA | `f70cf5b9dfcf` | veb three.js/WebGL bilan 3D chizadi; mobilda Skia bilan 2D — `expo-gl`+`expo-three` faqat shu oynacha uchun og'ir, tekis aylanada esa elektronlarni sanash osonroq |
| `src/modules/board/ui/board-stroke.tsx` | 🟡 MOSLASH | `8e850d9e1b06` | SVG o'rniga Skia tugunlari; shakl mantig'i (`strokeKindOf`, `arrowHeadPoints`) veb'dan; formatlangan matn `rich-text-stroke.tsx` ga ajratilgan |
| `src/modules/board/ui/board-font.ts` | 🆕 MOBIL | `—` | Skia shrift oilasi; vebda brauzer shriftni o'zi tanlaydi, Skia'da oila nomi aniq berilishi shart |
| `src/modules/board/ui/rich-text-stroke.tsx` | 🟡 MOSLASH | `8e850d9e1b06` | veb `board-stroke.tsx` dagi `lines` shoxi; Skia'da har run uchun `matchFont` va qo'lda joylashtirish, tagiga chizish qo'lda `Rect` bilan |
| `src/modules/board/ui/rich-text-sheet.tsx` | 🔴 QAYTA | `dfebccfb5ed6` | veb `rich-text-input.tsx` (contenteditable + execCommand) RN'da mumkin emas; format QATOR darajasida qo'yiladi va `TextLineDto` to'g'ridan-to'g'ri quriladi |
| `src/modules/board/ui/board-toolbar.tsx` | 🟡 MOSLASH | `d7353afa8564` | farq qayd etilmagan — tekshiring |
| `src/modules/board/ui/formula-palette.tsx` | 🟡 MOSLASH | `c3db89716ff5` | MathLive placeholder'lari (#0, #?) olib tashlanadi — mobilda LaTeX oddiy TextInput da yoziladi |
| `src/modules/board/ui/periodic-table-sheet.tsx` | 🟡 MOSLASH | `f354893b6a1a` | manba: veb `periodic-table-dialog.tsx`; veb 18 ustunli panjara, mobilda qidiruvli ro'yxat — telefonda panjara o'qilmaydi |
| `src/modules/conversation/api/conversation.api.ts` | 🟢 NUSXA | `f5a23ee833bb` | — |
| `src/modules/conversation/api/conversation.dto.ts` | 🟢 NUSXA | `5c8dcc87f71a` | — |
| `src/modules/conversation/api/conversation.endpoints.ts` | 🟢 NUSXA | `d2176507c224` | — |
| `src/modules/conversation/constants/direct-status.ts` | 🟢 NUSXA | `32913399a614` | — |
| `src/modules/conversation/index.ts` | 🟡 MOSLASH | `ef1ec60cb465` | generatsiya: veb barrel minus `ui/` eksportlari (port-barrels.mjs) |
| `src/modules/conversation/lib/conversation.mappers.ts` | 🟢 NUSXA | `f4b89ddbc7ed` | — |
| `src/modules/conversation/model/conversation-filter.store.ts` | 🟢 NUSXA | `ea649aac1e44` | — |
| `src/modules/conversation/model/conversation.keys.ts` | 🟢 NUSXA | `8dedfc078009` | — |
| `src/modules/conversation/model/use-conversations.ts` | 🟢 NUSXA | `90900fd9fd03` | — |
| `src/modules/conversation/ui/chat-header.tsx` | 🟡 MOSLASH | `106599ec34ab` | farq qayd etilmagan — tekshiring |
| `src/modules/conversation/ui/conversation-item.tsx` | 🟡 MOSLASH | `e68e12cace5f` | farq qayd etilmagan — tekshiring |
| `src/modules/course/api/course.api.ts` | 🟢 NUSXA | `8fbd108a1c56` | — |
| `src/modules/course/api/course.dto.ts` | 🟢 NUSXA | `d0339a2b6a33` | — |
| `src/modules/course/api/course.endpoints.ts` | 🟢 NUSXA | `bf3b8d1efe8e` | — |
| `src/modules/course/index.ts` | 🟡 MOSLASH | `080e7a1ce1f7` | generatsiya: veb barrel minus `ui/` eksportlari (port-barrels.mjs) |
| `src/modules/course/lib/course.mappers.ts` | 🟢 NUSXA | `358e9f4394b4` | — |
| `src/modules/course/model/course.queries.ts` | 🟢 NUSXA | `9422e8345085` | — |
| `src/modules/course/ui/add-student-sheet.tsx` | 🟡 MOSLASH | `23417d755aae` | manba: veb `add-student-dialog.tsx`; dialog o'rniga pastdan ochiladigan oyna, qidiruv debounce'siz (ro'yxat kichik) |
| `src/modules/course/ui/course-members-section.tsx` | 🟡 MOSLASH | `67f8017c22aa` | veb bilan bir joyda — suhbat ma'lumoti oynasida; o'chirishni tasdiqlash `ConfirmSheet` bilan |
| `src/modules/homework/api/homework.api.ts` | 🟢 NUSXA | `3b6953669648` | — |
| `src/modules/homework/api/homework.dto.ts` | 🟢 NUSXA | `6d59c99d3e6d` | — |
| `src/modules/homework/api/homework.endpoints.ts` | 🟢 NUSXA | `52669db62972` | — |
| `src/modules/homework/constants/homework.constants.ts` | 🟢 NUSXA | `fccf69310542` | — |
| `src/modules/homework/index.ts` | 🟡 MOSLASH | `893597e4988d` | generatsiya: veb barrel minus `ui/` eksportlari (port-barrels.mjs) |
| `src/modules/homework/lib/homework-validation.ts` | 🟢 NUSXA | `c8327541f59b` | — |
| `src/modules/homework/lib/homework.mappers.ts` | 🟢 NUSXA | `31627942d5ee` | — |
| `src/modules/homework/model/homework.queries.ts` | 🟢 NUSXA | `6a6148929f3f` | — |
| `src/modules/homework/model/use-homework-board.ts` | 🟡 MOSLASH | `677457db62d2` | brauzerning `beforeunload` ogohlantirishi olib tashlandi; chiqishdagi oxirgi saqlash qoldi |
| `src/modules/homework/ui/homework-report-view.tsx` | 🟡 MOSLASH | `b1cd81660536` | farq qayd etilmagan — tekshiring |
| `src/modules/lesson/api/lesson.api.ts` | 🟢 NUSXA | `3f7f3900f46d` | — |
| `src/modules/lesson/api/lesson.dto.ts` | 🟢 NUSXA | `ab15866473ba` | — |
| `src/modules/lesson/api/lesson.endpoints.ts` | 🟢 NUSXA | `b137e01f8817` | — |
| `src/modules/lesson/index.ts` | 🟡 MOSLASH | `e1bf55fd0f0f` | generatsiya: veb barrel minus `ui/`; WEEKDAY_LABELS mobil UI fayliga ko'chdi |
| `src/modules/lesson/lib/lesson-calendar.ts` | 🟢 NUSXA | `76769eb5a69d` | — |
| `src/modules/lesson/lib/lesson-schedule.ts` | 🟢 NUSXA | `2a3c243d16ae` | — |
| `src/modules/lesson/lib/lesson-status.ts` | 🟢 NUSXA | `43afd26367df` | — |
| `src/modules/lesson/lib/lesson.mappers.ts` | 🟢 NUSXA | `afbcc4e0feff` | — |
| `src/modules/lesson/model/lesson-view.store.ts` | 🟢 NUSXA | `31172199c0d6` | — |
| `src/modules/lesson/model/lesson.queries.ts` | 🟡 MOSLASH | `54d2b67dd248` | useFinishLesson: mijoz tomon MediaRecorder flush olib tashlandi (Egress server tomonda) |
| `src/modules/lesson/model/schedule.store.ts` | 🟢 NUSXA | `—` | jadval ko'rinishi, tayanch sana va qadam (2026-10-20 qo'shildi) |
| `src/modules/lesson/ui/lesson-calendar.tsx` | 🟡 MOSLASH | `b2d68d725254` | farq qayd etilmagan — tekshiring |
| `src/modules/lesson/ui/live-lesson-bar.tsx` | 🟡 MOSLASH | `520a875a379e` | farq qayd etilmagan — tekshiring |
| `src/modules/lesson/ui/schedule-grid.tsx` | 🟡 MOSLASH | `—` | faqat tor ekran shoxlari (Ro'yxat/Kun/Hafta/Oy); keng ekran to'rlari ko'chirilmadi |
| `src/modules/lesson/ui/schedule-sidebar.tsx` | 🟡 MOSLASH | `—` | faqat telefon bloklari: hafta tasmasi va eng yaqin dars |
| `src/modules/lesson/ui/lesson-detail-dialog.tsx` | 🟡 MOSLASH | `—` | mobilda `lesson-detail-sheet.tsx` (AppDialog -> Sheet) |
| `src/modules/lesson/ui/lesson-create-dialog.tsx` | 🟡 MOSLASH | `—` | mobilda `lesson-create-sheet.tsx` (AppDialog -> Sheet) |
| `src/modules/lesson/ui/star-rating.tsx` | 🟡 MOSLASH | `48d221a7c01f` | farq qayd etilmagan — tekshiring |
| `src/modules/live/api/live.api.ts` | 🟢 NUSXA | `e0abe818a292` | — |
| `src/modules/live/api/live.dto.ts` | 🟢 NUSXA | `2f9a569c29d6` | — |
| `src/modules/live/api/live.endpoints.ts` | 🟢 NUSXA | `aa9f29631b19` | — |
| `src/modules/live/index.ts` | 🟡 MOSLASH | `f0c0619ec1c8` | generatsiya: veb barrel minus `ui/` eksportlari (port-barrels.mjs) |
| `src/modules/live/lib/live-permissions.ts` | 🟢 NUSXA | `9898296e9030` | — |
| `src/modules/live/lib/live-token.ts` | 🟢 NUSXA | `1296d9f81423` | — |
| `src/modules/live/lib/live.mappers.ts` | 🟢 NUSXA | `2de41c074a84` | — |
| `src/modules/live/lib/screen-share-signal.ts` | 🟢 NUSXA | `b5c1de5417ea` | — |
| `src/modules/live/lib/use-focus-tracker.ts` | 🔴 QAYTA | `26ddec20b17b` | visibilitychange/blur -> AppState; iOS `inactive` filtrlanadi |
| `src/modules/live/model/live.queries.ts` | 🟢 NUSXA | `9741a129e03f` | — |
| `src/modules/live/model/use-camera-signals.ts` | 🟢 NUSXA | `3943fde8510a` | — |
| `src/modules/live/model/use-mic-signals.ts` | 🟢 NUSXA | `fa66d2edff21` | — |
| `src/modules/message/api/message.api.ts` | 🟢 NUSXA | `7b3783375bd9` | — |
| `src/modules/message/api/message.dto.ts` | 🟢 NUSXA | `56135a06aec4` | — |
| `src/modules/message/api/message.endpoints.ts` | 🟢 NUSXA | `a059ec7ac8e3` | — |
| `src/modules/message/index.ts` | 🟡 MOSLASH | `a1065d5cb63f` | generatsiya: veb barrel minus `ui/` eksportlari (port-barrels.mjs) |
| `src/modules/message/lib/chat-socket-manager.ts` | 🟢 NUSXA | `db09bb03f1a0` | — |
| `src/modules/message/lib/linkify.ts` | 🟢 NUSXA | `5a21a96293c4` | — |
| `src/modules/message/lib/message.mappers.ts` | 🟢 NUSXA | `2c43593d1edf` | — |
| `src/modules/message/model/message.keys.ts` | 🟢 NUSXA | `fadd16224f37` | — |
| `src/modules/message/model/chat-ui.store.ts` | 🟢 NUSXA | `—` | xabar qidiruvi va tanlash holati (2026-10-20 qo'shildi) |
| `src/modules/message/model/use-chat.ts` | 🟡 MOSLASH | `e0e9c5b75b8d` | react-router useNavigate -> expo-router (2026-10-20 vebdan qayta sinxronlandi; literal matn moslashtirishi olib tashlandi — chat.json da `removedFromGroup` endi bor) |
| `src/modules/message/ui/message-attachment.tsx` | 🟡 MOSLASH | `e5c7e28f553a` | farq qayd etilmagan — tekshiring |
| `src/modules/message/ui/message-bubble.tsx` | 🟡 MOSLASH | `2cefe5cc619f` | farq qayd etilmagan — tekshiring |
| `src/modules/message/ui/message-composer.tsx` | 🟡 MOSLASH | `2d0725ac8b8a` | farq qayd etilmagan — tekshiring |
| `src/modules/message/ui/message-list.tsx` | 🟡 MOSLASH | `06013405aa64` | farq qayd etilmagan — tekshiring |
| `src/modules/message/ui/message-text.tsx` | 🟡 MOSLASH | `61a4de2c8e42` | farq qayd etilmagan — tekshiring |
| `src/modules/notification/api/notification.api.ts` | 🟢 NUSXA | `e8e41ad97e44` | — |
| `src/modules/notification/api/notification.dto.ts` | 🟢 NUSXA | `6f1a801dfa71` | — |
| `src/modules/notification/api/notification.endpoints.ts` | 🟢 NUSXA | `2f9b58ec017a` | — |
| `src/modules/notification/index.ts` | 🟡 MOSLASH | `4f761ce85f85` | generatsiya: veb barrel minus `ui/` eksportlari (port-barrels.mjs) |
| `src/modules/notification/lib/notification-socket-manager.ts` | 🟢 NUSXA | `c8aa876d78e0` | — |
| `src/modules/notification/lib/notification.mappers.ts` | 🟢 NUSXA | `e91371f2ab65` | — |
| `src/modules/notification/model/notification.queries.ts` | 🟢 NUSXA | `64e64268858d` | — |
| `src/modules/notification/model/use-notification-feed.ts` | 🟢 NUSXA | `262b6e0922d7` | — |
| `src/modules/notification/api/push-device.api.ts` | 🆕 MOBIL | `—` | FCM qurilma tokeni; vebda Web Push obunasi (`push/subscribe/`) ishlatiladi |
| `src/modules/notification/lib/device-id.ts` | 🆕 MOBIL | `—` | barqaror qurilma ID'si; backend kaliti `(user, device_id)`, token o'zgaruvchan |
| `src/modules/notification/model/push-device.ts` | 🆕 MOBIL | `—` | chiqishda qurilmani ro'yxatdan chiqarish |
| `src/modules/parent/api/parent.api.ts` | 🟡 MOSLASH | `c944f05ed9d5` | farzand ulashda `username` yuboriladi, veb'dagi `invite_code` EMAS — backend ikkalasini ham qabul qiladi |
| `src/modules/parent/api/parent.dto.ts` | 🟢 NUSXA | `daad031b5dac` | — |
| `src/modules/parent/index.ts` | 🟡 MOSLASH | `f7f9585ba037` | generatsiya: veb barrel minus `ui/` eksportlari (port-barrels.mjs) |
| `src/modules/parent/lib/parent.mappers.ts` | 🟢 NUSXA | `d8fb049f6581` | — |
| `src/modules/parent/model/parent.queries.ts` | 🟢 NUSXA | `b4bec42438a7` | — |
| `src/modules/parent/model/selected-child.store.ts` | 🟢 NUSXA | `aa64d5eb60ce` | — |
| `src/modules/permission/constants/permission-map.ts` | 🟢 NUSXA | `c9ed4b063642` | — |
| `src/modules/permission/index.ts` | 🟡 MOSLASH | `5b5ffd8d4e1d` | generatsiya: veb barrel minus `ui/` eksportlari (port-barrels.mjs) |
| `src/modules/permission/lib/can.ts` | 🟢 NUSXA | `9f3189dc554c` | — |
| `src/modules/permission/lib/has-role.ts` | 🟢 NUSXA | `d5aa99b1c50d` | — |
| `src/modules/permission/ui/permission-guard.tsx` | 🟡 MOSLASH | `4c2702ba4a5d` | farq qayd etilmagan — tekshiring |
| `src/modules/quiz/api/quiz.api.ts` | 🟢 NUSXA | `43fa08b4de71` | — |
| `src/modules/quiz/api/quiz.dto.ts` | 🟢 NUSXA | `bfcdf1623e35` | — |
| `src/modules/quiz/api/quiz.endpoints.ts` | 🟢 NUSXA | `ba6af768960e` | — |
| `src/modules/quiz/index.ts` | 🟡 MOSLASH | `af1ba44d864b` | generatsiya: veb barrel minus `ui/` eksportlari (port-barrels.mjs) |
| `src/modules/quiz/lib/google-import.ts` | 🟢 NUSXA | `d89ca84726fc` | — |
| `src/modules/quiz/lib/answer-value.ts` | 🟢 NUSXA | `724d9951d2f2` | — |
| `src/modules/quiz/lib/question-draft.ts` | 🟢 NUSXA | `c91791787e92` | — |
| `src/modules/quiz/lib/quiz-errors.ts` | 🟢 NUSXA | `da4cf7939388` | — |
| `src/modules/quiz/lib/quiz.mappers.ts` | 🟢 NUSXA | `afd552bf77ba` | — |
| `src/modules/quiz/model/quiz.queries.ts` | 🟢 NUSXA | `a079604c210e` | — |
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
| `src/modules/student/api/student.api.ts` | 🟢 NUSXA | `8e54d2259086` | — |
| `src/modules/student/api/student.dto.ts` | 🟢 NUSXA | `f0d3020fd053` | — |
| `src/modules/student/index.ts` | 🟡 MOSLASH | `82f60b388730` | generatsiya: veb barrel minus `ui/` eksportlari (port-barrels.mjs) |
| `src/modules/student/model/student.queries.ts` | 🟢 NUSXA | `e507a2f33021` | — |
| `src/modules/voice/api/voice.api.ts` | 🟢 NUSXA | `c779868ae383` | — |
| `src/modules/voice/api/voice.dto.ts` | 🟢 NUSXA | `3d82a1415023` | — |
| `src/modules/voice/api/voice.endpoints.ts` | 🟢 NUSXA | `21c1eee7370f` | — |
| `src/modules/voice/index.ts` | 🟡 MOSLASH | `303c4f6a682a` | generatsiya: veb barrel minus `ui/` + mobil UI eksportlari |
| `src/modules/voice/lib/voice.mappers.ts` | 🟢 NUSXA | `1ea078f239f3` | — |
| `src/modules/voice/model/voice.queries.ts` | 🟢 NUSXA | `34c755e07c59` | — |
| `src/modules/voice/ui/voice-room-bar.tsx` | 🟡 MOSLASH | `46d2b5212234` | mobil qobiq: xona ochish oynasi shu faylda (veb'da alohida dialog) |
| `src/modules/voice/ui/voice-room-sheet.tsx` | 🟡 MOSLASH | `76f4b2d71876` | manba: veb `voice-room-dialog.tsx`; video plitkalari o'rniga ro'yxat, LiveKitRoom video={false} |
| `src/pages/admin/admin-dashboard-page.tsx` | 🟡 MOSLASH | `f3de9850f257` | farq qayd etilmagan — tekshiring |
| `src/pages/analytics/analytics-page.tsx` | 🟡 MOSLASH | `092cef5c60fa` | o'qituvchi jadvali (olti ustun) kartochkalarga aylandi — telefonda jadval o'qilmaydi |
| `src/pages/auth/login-page.tsx` | 🟡 MOSLASH | `26701b566b44` | farq qayd etilmagan — tekshiring |
| `src/pages/auth/register-page.tsx` | 🟡 MOSLASH | `47952b4dde32` | farq qayd etilmagan — tekshiring |
| `src/pages/board/board-page.tsx` | 🟡 MOSLASH | `2c6b375c7baf` | farq qayd etilmagan — tekshiring |
| `src/pages/workspace/workspace-page.tsx` | 🟡 MOSLASH | `1310f75223c3` | vebda kartochkalar to'rda; telefonda bir ustunli ro'yxat — tor ekranda ikki ustunli matn sinib ketadi |
| `src/pages/live/live-lesson-page.tsx` | 🟡 MOSLASH | `b0b1a939b1a1` | farq qayd etilmagan — tekshiring |
| `src/pages/recording/recording-page.tsx` | 🟡 MOSLASH | `224fb405dfbe` | `expo-video` pleeri; pleer QO'LDA to'xtatilmaydi — `useVideoPlayer` uni o'zi bo'shatadi |
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
| `src/shared/api/request-interceptor.ts` | 🟡 MOSLASH | `f99b14fa30f2` | Accept-Language til saqlagichi o'rniga qat'iy "uz" (§13) |
| `src/shared/api/response-interceptor.ts` | 🟢 NUSXA | `283cbb28d435` | — |
| `src/shared/api/token-storage.ts` | 🔴 QAYTA | `47a479a247f8` | SecureStore + xotira keshi; interfeys va sinxronligi bir xil |
| `src/shared/config/env.ts` | 🔴 QAYTA | `ff591f4dcda1` | import.meta.env -> expo-constants; o'sha zod sxemasi |
| `src/shared/config/index.ts` | 🟢 NUSXA | `2a1ff6fd4d60` | — |
| `src/shared/config/routes.ts` | 🟢 NUSXA | `69ed361d3fce` | — |
| `src/shared/constants/index.ts` | 🟢 NUSXA | `c06257bbb1f3` | — |
| `src/shared/constants/roles.ts` | 🟢 NUSXA | `2f90f03f91dc` | — |
| `src/shared/constants/storage-keys.ts` | 🟢 NUSXA | `f381330fe63a` | — |
| `src/shared/i18n/i18n.ts` | 🟡 MOSLASH | `d2d2d9a67a3a` | `import.meta.glob` (Vite) o'rniga qo'lda import; `mobile` bo'limi qo'shilgan; suspense o'chirilgan |
| `src/shared/i18n/intl-locale.ts` | 🟢 NUSXA | `b3f6b40c5b6f` | — |
| `src/shared/i18n/locales/**` | 🟢 NUSXA | `—` | 18 bo'lim × 3 til, vebdan bayt-bayt; `mobile.json` mobilga xos |
| `src/shared/model/language.store.ts` | 🔴 QAYTA | `0f01a0cbc3c6` | zustand `persist` (localStorage) o'rniga MMKV; qurilma tili `Intl` dan |
| `src/shared/model/text-size.store.ts` | 🔴 QAYTA | `f61042795fd4` | `persist` o'rniga MMKV; `--text-scale` o'rniga `Text` komponenti ko'paytiruvchisi (`text-scale.tsx`) |
| `src/shared/lib/app-state.ts` | 🆕 MOBIL | `—` | Mobilga xos, veb'da yo'q |
| `src/shared/lib/date.ts` | 🟢 NUSXA | `13624ad3dcd2` | — |
| `src/shared/lib/download.ts` | 🔴 QAYTA | `af194a763a11` | <a download> -> expo-file-system + Share; ASYNC bo'ldi |
| `src/shared/lib/file-kind.ts` | 🟢 NUSXA | `6d217a6b4891` | — |
| `src/shared/lib/index.ts` | 🟡 MOSLASH | `862ec0c8861c` | barrel + app-state/network eksportlari |
| `src/shared/lib/network.ts` | 🆕 MOBIL | `—` | Mobilga xos, veb'da yo'q |
| `src/shared/lib/sanitize-html.ts` | 🔴 QAYTA | `0fffa4bdbf6c` | DOMPurify -> regex; WebView CSP bilan birga |
| `src/shared/lib/storage.ts` | 🔴 QAYTA | `a49745b6789d` | localStorage -> MMKV; interfeys bir xil |
| `src/shared/lib/utils.ts` | 🟢 NUSXA | `4dd93deacc31` | — |
| `src/shared/types/auth.ts` | 🟢 NUSXA | `019a99721acc` | — |
| `src/shared/types/chat.ts` | 🟢 NUSXA | `69dedcbdcc16` | — |
| `src/shared/types/domain.ts` | 🟢 NUSXA | `cd4ce09bfc06` | — |
| `src/shared/types/dto.ts` | 🟢 NUSXA | `626467937625` | — |
| `src/shared/types/index.ts` | 🟢 NUSXA | `b85973e9c7af` | — |
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
| `src/widgets/live-room/live-room.tsx` | 🟡 MOSLASH | `770a6277c18c` | yolg'iz ishtirokchi oynasi butun maydonni egallaydi (vebda setka doim); tizim panellari uchun safe-area |

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
