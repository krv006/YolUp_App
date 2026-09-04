# Port manifesti

> **Bu fayl majburiy.** Veb loyihadan ko'chirilgan har bir fayl shu yerda
> qayd etiladi. Ro'yxatga kirmagan ko'chirma — PR'da blocker
> (`docs/MOBILE_PLAN.md` §18.4).

- **Manba:** `Edu_Front` @ `1e53492`
- **Oxirgi yangilanish:** 2026-09-04
- **Qayta yaratish:** `npm run build:ported`
- **Drift tekshiruvi:** `npm run check-sync`

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

- 🟢 NUSXA: **117**
- 🟡/🔴 moslashtirilgan: **56**
- 🆕 mobilga xos: **5**
- Jami: **178**

## Fayllar

| Mobil fayl | Toifa | Veb hash | Farq / izoh |
|---|---|---|---|
| `src/modules/attendance/api/attendance.api.ts` | 🟢 NUSXA | `1e046237be37` | — |
| `src/modules/attendance/api/attendance.dto.ts` | 🟢 NUSXA | `ba5a4336ddf1` | — |
| `src/modules/attendance/api/attendance.endpoints.ts` | 🟢 NUSXA | `b5b26e5a5a85` | — |
| `src/modules/attendance/index.ts` | 🟡 MOSLASH | `425a482023c2` | generatsiya: veb barrel minus `ui/` eksportlari (port-barrels.mjs) |
| `src/modules/attendance/lib/attendance.mappers.ts` | 🟢 NUSXA | `7d0841bec8ec` | — |
| `src/modules/attendance/lib/group-by-lesson.ts` | 🟢 NUSXA | `b4d5b820b1ce` | — |
| `src/modules/attendance/model/attendance.queries.ts` | 🟢 NUSXA | `4fbbab2e9fec` | — |
| `src/modules/auth/api/auth.api.ts` | 🟢 NUSXA | `544412ef895f` | — |
| `src/modules/auth/api/auth.dto.ts` | 🟢 NUSXA | `58a7c2a74a9a` | — |
| `src/modules/auth/api/auth.endpoints.ts` | 🟢 NUSXA | `2bc306cdd417` | — |
| `src/modules/auth/index.ts` | 🟡 MOSLASH | `dad1a8304ff7` | generatsiya: veb barrel minus `ui/` eksportlari (port-barrels.mjs) |
| `src/modules/auth/lib/auth-session.ts` | 🟢 NUSXA | `2538b8163bec` | — |
| `src/modules/auth/lib/auth.mappers.ts` | 🟢 NUSXA | `c554ea2541ca` | — |
| `src/modules/auth/lib/describe-user-agent.ts` | 🟢 NUSXA | `2b73a620b0de` | — |
| `src/modules/auth/lib/resolve-home-route.ts` | 🟢 NUSXA | `86d9a3f708fc` | — |
| `src/modules/auth/lib/teacher-approval.ts` | 🟢 NUSXA | `95d6a516e382` | — |
| `src/modules/auth/model/auth.mutations.ts` | 🟢 NUSXA | `3dbc275f4446` | — |
| `src/modules/auth/model/auth.queries.ts` | 🟢 NUSXA | `60fda767f438` | — |
| `src/modules/auth/model/auth.schemas.ts` | 🟢 NUSXA | `45da2c51e55b` | — |
| `src/modules/auth/model/auth.store.ts` | 🟡 MOSLASH | `dac63ea7177b` | window hodisalari -> refreshTokenManager.onSessionExpired; `storage` obunasi olib tashlandi (tab yo'q) |
| `src/modules/auth/model/use-auth.ts` | 🟢 NUSXA | `5cdf556d9693` | — |
| `src/modules/board/api/board.api.ts` | 🟢 NUSXA | `d3a43e4345ce` | — |
| `src/modules/board/api/board.dto.ts` | 🟢 NUSXA | `25eef967ff8c` | — |
| `src/modules/board/api/board.endpoints.ts` | 🟢 NUSXA | `c63f5b33771c` | — |
| `src/modules/board/constants/board.constants.ts` | 🟢 NUSXA | `858e94561046` | — |
| `src/modules/board/index.ts` | 🟡 MOSLASH | `d72cbbf550bf` | generatsiya: veb barrel minus `ui/` eksportlari (port-barrels.mjs) |
| `src/modules/board/lib/board-channel.ts` | 🟢 NUSXA | `739757b5515c` | — |
| `src/modules/board/lib/board-socket-manager.ts` | 🟢 NUSXA | `fc2ed72d9657` | — |
| `src/modules/board/lib/board.geometry.ts` | 🟢 NUSXA | `6b92de7b9d96` | — |
| `src/modules/board/lib/board.mappers.ts` | 🟢 NUSXA | `a85262f5becd` | — |
| `src/modules/board/model/board.queries.ts` | 🟢 NUSXA | `68694539eaf7` | — |
| `src/modules/board/model/use-board-channel.ts` | 🟢 NUSXA | `d5b7970375ab` | — |
| `src/modules/board/model/use-board-realtime.ts` | 🟢 NUSXA | `ba27436ef0f2` | — |
| `src/modules/board/ui/board-stroke.tsx` | 🟡 MOSLASH | `4821801d0b13` | farq qayd etilmagan — tekshiring |
| `src/modules/board/ui/board-toolbar.tsx` | 🟡 MOSLASH | `d7353afa8564` | farq qayd etilmagan — tekshiring |
| `src/modules/conversation/api/conversation.api.ts` | 🟢 NUSXA | `979cd2dfe197` | — |
| `src/modules/conversation/api/conversation.dto.ts` | 🟢 NUSXA | `1de00c8a66ce` | — |
| `src/modules/conversation/api/conversation.endpoints.ts` | 🟢 NUSXA | `6ceb4a4484a7` | — |
| `src/modules/conversation/constants/direct-status.ts` | 🟢 NUSXA | `298e8e510aae` | — |
| `src/modules/conversation/index.ts` | 🟡 MOSLASH | `6fce98588dbd` | generatsiya: veb barrel minus `ui/` eksportlari (port-barrels.mjs) |
| `src/modules/conversation/lib/conversation.mappers.ts` | 🟢 NUSXA | `9debbcf93559` | — |
| `src/modules/conversation/model/conversation-filter.store.ts` | 🟢 NUSXA | `c072b4693565` | — |
| `src/modules/conversation/model/conversation.keys.ts` | 🟢 NUSXA | `8dedfc078009` | — |
| `src/modules/conversation/model/use-conversations.ts` | 🟢 NUSXA | `047e6d098c68` | — |
| `src/modules/conversation/ui/chat-header.tsx` | 🟡 MOSLASH | `106599ec34ab` | farq qayd etilmagan — tekshiring |
| `src/modules/conversation/ui/conversation-item.tsx` | 🟡 MOSLASH | `e68e12cace5f` | farq qayd etilmagan — tekshiring |
| `src/modules/course/api/course.api.ts` | 🟢 NUSXA | `0d1f74fef20d` | — |
| `src/modules/course/api/course.dto.ts` | 🟢 NUSXA | `c8ade40bb51b` | — |
| `src/modules/course/api/course.endpoints.ts` | 🟢 NUSXA | `e43774c4459d` | — |
| `src/modules/course/index.ts` | 🟡 MOSLASH | `baeab53df443` | generatsiya: veb barrel minus `ui/` eksportlari (port-barrels.mjs) |
| `src/modules/course/lib/course.mappers.ts` | 🟢 NUSXA | `407e3fae5e0b` | — |
| `src/modules/course/model/course.queries.ts` | 🟢 NUSXA | `d3e112864d54` | — |
| `src/modules/homework/api/homework.api.ts` | 🟢 NUSXA | `76b69e7671a1` | — |
| `src/modules/homework/api/homework.dto.ts` | 🟢 NUSXA | `8047e05bc7da` | — |
| `src/modules/homework/api/homework.endpoints.ts` | 🟢 NUSXA | `d4dba99a128d` | — |
| `src/modules/homework/constants/homework.constants.ts` | 🟢 NUSXA | `fccf69310542` | — |
| `src/modules/homework/index.ts` | 🟡 MOSLASH | `3c108061ccd7` | generatsiya: veb barrel minus `ui/` eksportlari (port-barrels.mjs) |
| `src/modules/homework/lib/homework-validation.ts` | 🟢 NUSXA | `707bc7bdd871` | — |
| `src/modules/homework/lib/homework.mappers.ts` | 🟢 NUSXA | `c6134f9edb5c` | — |
| `src/modules/homework/model/homework.queries.ts` | 🟢 NUSXA | `0ec6144f32c9` | — |
| `src/modules/homework/ui/homework-report-view.tsx` | 🟡 MOSLASH | `b1cd81660536` | farq qayd etilmagan — tekshiring |
| `src/modules/lesson/api/lesson.api.ts` | 🟢 NUSXA | `f93d64607dd8` | — |
| `src/modules/lesson/api/lesson.dto.ts` | 🟢 NUSXA | `d7972958badd` | — |
| `src/modules/lesson/api/lesson.endpoints.ts` | 🟢 NUSXA | `d87faa16509a` | — |
| `src/modules/lesson/index.ts` | 🟡 MOSLASH | `94e8eab0526e` | generatsiya: veb barrel minus `ui/` eksportlari (port-barrels.mjs) |
| `src/modules/lesson/lib/lesson-calendar.ts` | 🟢 NUSXA | `38ad28e08fca` | — |
| `src/modules/lesson/lib/lesson-schedule.ts` | 🟢 NUSXA | `3dd4b69e50c8` | — |
| `src/modules/lesson/lib/lesson-status.ts` | 🟢 NUSXA | `459e0c63484a` | — |
| `src/modules/lesson/lib/lesson.mappers.ts` | 🟢 NUSXA | `e4595502465f` | — |
| `src/modules/lesson/model/lesson-view.store.ts` | 🟢 NUSXA | `32243c91e8da` | — |
| `src/modules/lesson/model/lesson.queries.ts` | 🟡 MOSLASH | `9a44b4a54d5d` | useFinishLesson: mijoz tomon MediaRecorder flush olib tashlandi (Egress server tomonda) |
| `src/modules/lesson/ui/lesson-calendar.tsx` | 🟡 MOSLASH | `b2d68d725254` | farq qayd etilmagan — tekshiring |
| `src/modules/lesson/ui/star-rating.tsx` | 🟡 MOSLASH | `48d221a7c01f` | farq qayd etilmagan — tekshiring |
| `src/modules/live/api/live.api.ts` | 🟢 NUSXA | `111c8b0a89c6` | — |
| `src/modules/live/api/live.dto.ts` | 🟢 NUSXA | `865100a4509c` | — |
| `src/modules/live/api/live.endpoints.ts` | 🟢 NUSXA | `aa9f29631b19` | — |
| `src/modules/live/index.ts` | 🟡 MOSLASH | `26e27b177eb0` | generatsiya: veb barrel minus `ui/` eksportlari (port-barrels.mjs) |
| `src/modules/live/lib/live-permissions.ts` | 🟢 NUSXA | `0101fb57aeb2` | — |
| `src/modules/live/lib/live-token.ts` | 🟢 NUSXA | `1537aa3bd393` | — |
| `src/modules/live/lib/live.mappers.ts` | 🟢 NUSXA | `9b780d71ffec` | — |
| `src/modules/live/lib/screen-share-signal.ts` | 🟢 NUSXA | `b5c1de5417ea` | — |
| `src/modules/live/lib/use-focus-tracker.ts` | 🔴 QAYTA | `fa7446fcc285` | visibilitychange/blur -> AppState; iOS `inactive` filtrlanadi |
| `src/modules/live/model/live.queries.ts` | 🟢 NUSXA | `3c140339b7b0` | — |
| `src/modules/live/model/use-camera-signals.ts` | 🟢 NUSXA | `1228853f5af6` | — |
| `src/modules/live/model/use-mic-signals.ts` | 🟢 NUSXA | `0bfe2f48ef49` | — |
| `src/modules/message/api/message.api.ts` | 🟢 NUSXA | `b5f453550de6` | — |
| `src/modules/message/api/message.dto.ts` | 🟢 NUSXA | `71e170c44c16` | — |
| `src/modules/message/api/message.endpoints.ts` | 🟢 NUSXA | `8427678cbb4f` | — |
| `src/modules/message/index.ts` | 🟡 MOSLASH | `a1065d5cb63f` | generatsiya: veb barrel minus `ui/` eksportlari (port-barrels.mjs) |
| `src/modules/message/lib/chat-socket-manager.ts` | 🟢 NUSXA | `631eeb6226d8` | — |
| `src/modules/message/lib/linkify.ts` | 🟢 NUSXA | `9d4c4f8ff708` | — |
| `src/modules/message/lib/message.mappers.ts` | 🟢 NUSXA | `6252760113bd` | — |
| `src/modules/message/model/message.keys.ts` | 🟢 NUSXA | `fadd16224f37` | — |
| `src/modules/message/model/use-chat.ts` | 🟡 MOSLASH | `8e0e288f1631` | react-router-dom useNavigate -> expo-router useRouter |
| `src/modules/message/ui/message-attachment.tsx` | 🟡 MOSLASH | `e5c7e28f553a` | farq qayd etilmagan — tekshiring |
| `src/modules/message/ui/message-bubble.tsx` | 🟡 MOSLASH | `2cefe5cc619f` | farq qayd etilmagan — tekshiring |
| `src/modules/message/ui/message-composer.tsx` | 🟡 MOSLASH | `2d0725ac8b8a` | farq qayd etilmagan — tekshiring |
| `src/modules/message/ui/message-list.tsx` | 🟡 MOSLASH | `06013405aa64` | farq qayd etilmagan — tekshiring |
| `src/modules/message/ui/message-text.tsx` | 🟡 MOSLASH | `61a4de2c8e42` | farq qayd etilmagan — tekshiring |
| `src/modules/notification/api/notification.api.ts` | 🟢 NUSXA | `980ff0a9d175` | — |
| `src/modules/notification/api/notification.dto.ts` | 🟢 NUSXA | `b1a8ffe524dc` | — |
| `src/modules/notification/api/notification.endpoints.ts` | 🟢 NUSXA | `23a2b0dd4313` | — |
| `src/modules/notification/index.ts` | 🟡 MOSLASH | `96ef103beb1c` | generatsiya: veb barrel minus `ui/` eksportlari (port-barrels.mjs) |
| `src/modules/notification/lib/notification-socket-manager.ts` | 🟢 NUSXA | `b7bb0bd24385` | — |
| `src/modules/notification/lib/notification.mappers.ts` | 🟢 NUSXA | `47800889edef` | — |
| `src/modules/notification/model/notification.queries.ts` | 🟢 NUSXA | `c33aeb3c92fe` | — |
| `src/modules/notification/model/use-notification-feed.ts` | 🟢 NUSXA | `a4e4ba829fc0` | — |
| `src/modules/parent/api/parent.api.ts` | 🟢 NUSXA | `ecfaf2de446e` | — |
| `src/modules/parent/api/parent.dto.ts` | 🟢 NUSXA | `daad031b5dac` | — |
| `src/modules/parent/index.ts` | 🟡 MOSLASH | `f7f9585ba037` | generatsiya: veb barrel minus `ui/` eksportlari (port-barrels.mjs) |
| `src/modules/parent/lib/parent.mappers.ts` | 🟢 NUSXA | `d8fb049f6581` | — |
| `src/modules/parent/model/parent.queries.ts` | 🟢 NUSXA | `b4bec42438a7` | — |
| `src/modules/parent/model/selected-child.store.ts` | 🟢 NUSXA | `aa64d5eb60ce` | — |
| `src/modules/permission/constants/permission-map.ts` | 🟢 NUSXA | `c9ed4b063642` | — |
| `src/modules/permission/index.ts` | 🟡 MOSLASH | `5b5ffd8d4e1d` | generatsiya: veb barrel minus `ui/` eksportlari (port-barrels.mjs) |
| `src/modules/permission/lib/can.ts` | 🟢 NUSXA | `9f3189dc554c` | — |
| `src/modules/permission/lib/has-role.ts` | 🟢 NUSXA | `d5aa99b1c50d` | — |
| `src/modules/quiz/api/quiz.api.ts` | 🟢 NUSXA | `9bad6c757187` | — |
| `src/modules/quiz/api/quiz.dto.ts` | 🟢 NUSXA | `3646b0daa593` | — |
| `src/modules/quiz/api/quiz.endpoints.ts` | 🟢 NUSXA | `0c5a2be7325e` | — |
| `src/modules/quiz/index.ts` | 🟡 MOSLASH | `2e12a1ad6be0` | generatsiya: veb barrel minus `ui/` eksportlari (port-barrels.mjs) |
| `src/modules/quiz/lib/quiz.mappers.ts` | 🟢 NUSXA | `46aaa6e0ed2a` | — |
| `src/modules/quiz/model/quiz.queries.ts` | 🟢 NUSXA | `df7f8e9f416a` | — |
| `src/modules/student/api/student.api.ts` | 🟢 NUSXA | `8e54d2259086` | — |
| `src/modules/student/api/student.dto.ts` | 🟢 NUSXA | `f0d3020fd053` | — |
| `src/modules/student/index.ts` | 🟡 MOSLASH | `82f60b388730` | generatsiya: veb barrel minus `ui/` eksportlari (port-barrels.mjs) |
| `src/modules/student/model/student.queries.ts` | 🟢 NUSXA | `e507a2f33021` | — |
| `src/pages/auth/login-page.tsx` | 🟡 MOSLASH | `26701b566b44` | farq qayd etilmagan — tekshiring |
| `src/pages/auth/register-page.tsx` | 🟡 MOSLASH | `47952b4dde32` | farq qayd etilmagan — tekshiring |
| `src/pages/board/board-page.tsx` | 🟡 MOSLASH | `2c6b375c7baf` | farq qayd etilmagan — tekshiring |
| `src/pages/live/live-lesson-page.tsx` | 🟡 MOSLASH | `b0b1a939b1a1` | farq qayd etilmagan — tekshiring |
| `src/pages/recording/recording-page.tsx` | 🟡 MOSLASH | `224fb405dfbe` | farq qayd etilmagan — tekshiring |
| `src/pages/schedule/schedule-page.tsx` | 🟡 MOSLASH | `c05e6da877ab` | farq qayd etilmagan — tekshiring |
| `src/shared/api/api-client.ts` | 🟡 MOSLASH | `7d61f7ccadf0` | navigator.onLine -> NetInfo |
| `src/shared/api/api-config.ts` | 🟢 NUSXA | `0e6a5d2a4cc7` | — |
| `src/shared/api/api-error.ts` | 🟢 NUSXA | `3095f2c59319` | — |
| `src/shared/api/api-response.ts` | 🟢 NUSXA | `7fffa9b0a246` | — |
| `src/shared/api/apply-api-field-errors.ts` | 🟢 NUSXA | `9ef29e3c1e0d` | — |
| `src/shared/api/index.ts` | 🟡 MOSLASH | `e71372094ee3` | barrel — veb bilan bir xil ro'yxat |
| `src/shared/api/media-url.ts` | 🟡 MOSLASH | `c3a91c2f41af` | location.origin -> env.apiUrl (mobilda proxy yo'q) |
| `src/shared/api/pagination.ts` | 🟢 NUSXA | `d835278b8a89` | — |
| `src/shared/api/realtime-socket.ts` | 🔴 QAYTA | `d64ba10c0dea` | AppState + NetInfo; fon rejimida uziladi, qaytganda onResync |
| `src/shared/api/refresh-token-manager.ts` | 🔴 QAYTA | `34339d9f65a9` | CustomEvent o'rniga obuna ro'yxati |
| `src/shared/api/request-interceptor.ts` | 🟢 NUSXA | `01371baa1b16` | — |
| `src/shared/api/response-interceptor.ts` | 🟢 NUSXA | `283cbb28d435` | — |
| `src/shared/api/token-storage.ts` | 🔴 QAYTA | `47a479a247f8` | SecureStore + xotira keshi; interfeys va sinxronligi bir xil |
| `src/shared/config/env.ts` | 🔴 QAYTA | `ff591f4dcda1` | import.meta.env -> expo-constants; o'sha zod sxemasi |
| `src/shared/config/index.ts` | 🟢 NUSXA | `2a1ff6fd4d60` | — |
| `src/shared/config/routes.ts` | 🟢 NUSXA | `e82bf23af3b3` | — |
| `src/shared/constants/index.ts` | 🟢 NUSXA | `c06257bbb1f3` | — |
| `src/shared/constants/roles.ts` | 🟢 NUSXA | `2f90f03f91dc` | — |
| `src/shared/constants/storage-keys.ts` | 🟢 NUSXA | `95c629449dc3` | — |
| `src/shared/lib/app-state.ts` | 🆕 MOBIL | `—` | Mobilga xos, veb'da yo'q |
| `src/shared/lib/date.ts` | 🟢 NUSXA | `a0e052b43d85` | — |
| `src/shared/lib/download.ts` | 🔴 QAYTA | `af194a763a11` | <a download> -> expo-file-system + Share; ASYNC bo'ldi |
| `src/shared/lib/file-kind.ts` | 🟢 NUSXA | `b3e65073d767` | — |
| `src/shared/lib/index.ts` | 🟡 MOSLASH | `862ec0c8861c` | barrel + app-state/network eksportlari |
| `src/shared/lib/network.ts` | 🆕 MOBIL | `—` | Mobilga xos, veb'da yo'q |
| `src/shared/lib/sanitize-html.ts` | 🔴 QAYTA | `0fffa4bdbf6c` | DOMPurify -> regex; WebView CSP bilan birga |
| `src/shared/lib/storage.ts` | 🔴 QAYTA | `a49745b6789d` | localStorage -> MMKV; interfeys bir xil |
| `src/shared/lib/utils.ts` | 🟢 NUSXA | `4dd93deacc31` | — |
| `src/shared/types/auth.ts` | 🟢 NUSXA | `65e9c7e33ad4` | — |
| `src/shared/types/chat.ts` | 🟢 NUSXA | `deba20c464a6` | — |
| `src/shared/types/domain.ts` | 🟢 NUSXA | `8e02eaee77fd` | — |
| `src/shared/types/dto.ts` | 🟢 NUSXA | `88f0bb9ba6c1` | — |
| `src/shared/types/index.ts` | 🟢 NUSXA | `4aabcac82ddd` | — |
| `src/shared/ui/avatar.tsx` | 🟡 MOSLASH | `8f4429737fdb` | farq qayd etilmagan — tekshiring |
| `src/shared/ui/badge.tsx` | 🟡 MOSLASH | `f0c6b9cbc966` | farq qayd etilmagan — tekshiring |
| `src/shared/ui/button.tsx` | 🟡 MOSLASH | `693a56cdfe79` | farq qayd etilmagan — tekshiring |
| `src/shared/ui/card.tsx` | 🟡 MOSLASH | `5cd43302e888` | farq qayd etilmagan — tekshiring |
| `src/shared/ui/checkbox.tsx` | 🟡 MOSLASH | `073b5898e69d` | farq qayd etilmagan — tekshiring |
| `src/shared/ui/input.tsx` | 🟡 MOSLASH | `52da1927077d` | farq qayd etilmagan — tekshiring |
| `src/shared/ui/palette.json` | 🆕 MOBIL | `—` | Mobilga xos, veb'da yo'q |
| `src/shared/ui/sheet.tsx` | 🟡 MOSLASH | `ef338bb871e5` | farq qayd etilmagan — tekshiring |
| `src/shared/ui/toast.tsx` | 🆕 MOBIL | `—` | Mobilga xos, veb'da yo'q |
| `src/shared/ui/tokens.ts` | 🆕 MOBIL | `—` | Mobilga xos, veb'da yo'q |
| `src/widgets/group-workspace/group-workspace.tsx` | 🟡 MOSLASH | `17d7db1ac265` | farq qayd etilmagan — tekshiring |
| `src/widgets/live-room/live-room.tsx` | 🟡 MOSLASH | `770a6277c18c` | farq qayd etilmagan — tekshiring |

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
