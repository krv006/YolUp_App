/*
 * `import/no-named-as-default-member` — noto'g'ri ogohlantirish: i18next
 * ning standart eksporti `use`/`changeLanguage` metodlari BOR obyekt,
 * shu nomdagi alohida eksportlar esa boshqa narsa. Kutubxona shunday
 * ishlatilishi mo'ljallangan (veb ham aynan shunday chaqiradi).
 */
/* eslint-disable import/no-named-as-default-member */
import i18next, { type Resource } from "i18next";
import { initReactI18next } from "react-i18next";
import { DEFAULT_LANGUAGE, useLanguageStore } from "@/shared/model/language.store";

/*
 * 🟡 VEB'DAN FARQ — lug'atlar QO'LDA import qilinadi.
 *
 * Veb `import.meta.glob` bilan `locales/*` ni o'z-o'zidan yig'adi, lekin u
 * Vite'ning imkoniyati va Metro'da yo'q. Shuning uchun ro'yxat shu yerda
 * ochiq turadi: yangi bo'lim qo'shilsa, uni uchala tilga ham qo'shish
 * ESDA QOLADI — glob bo'lganda esa bitta til unutilib ketishi mumkin edi.
 *
 * `locales/` ning o'zi vebdan BAYT-BAYT ko'chirilgan; `mobile` bo'limi
 * esa faqat mobilga xos matnlar uchun — shunda ko'chirilgan fayllar
 * o'zgarishsiz qoladi.
 */

import enAccount from "./locales/en/account.json";
import enAdmin from "./locales/en/admin.json";
import enAuth from "./locales/en/auth.json";
import enBoard from "./locales/en/board.json";
import enChat from "./locales/en/chat.json";
import enCommon from "./locales/en/common.json";
import enGroup from "./locales/en/group.json";
import enHomework from "./locales/en/homework.json";
import enLesson from "./locales/en/lesson.json";
import enLive from "./locales/en/live.json";
import enExam from "./locales/en/exam.json";
import enNav from "./locales/en/nav.json";
import enParent from "./locales/en/parent.json";
import enQuiz from "./locales/en/quiz.json";
import enStudent from "./locales/en/student.json";
import enVoice from "./locales/en/voice.json";
import enWorkspace from "./locales/en/workspace.json";
import enMobile from "./locales/en/mobile.json";

import ruAccount from "./locales/ru/account.json";
import ruAdmin from "./locales/ru/admin.json";
import ruAuth from "./locales/ru/auth.json";
import ruBoard from "./locales/ru/board.json";
import ruChat from "./locales/ru/chat.json";
import ruCommon from "./locales/ru/common.json";
import ruGroup from "./locales/ru/group.json";
import ruHomework from "./locales/ru/homework.json";
import ruLesson from "./locales/ru/lesson.json";
import ruLive from "./locales/ru/live.json";
import ruExam from "./locales/ru/exam.json";
import ruNav from "./locales/ru/nav.json";
import ruParent from "./locales/ru/parent.json";
import ruQuiz from "./locales/ru/quiz.json";
import ruStudent from "./locales/ru/student.json";
import ruVoice from "./locales/ru/voice.json";
import ruWorkspace from "./locales/ru/workspace.json";
import ruMobile from "./locales/ru/mobile.json";

import uzAccount from "./locales/uz/account.json";
import uzAdmin from "./locales/uz/admin.json";
import uzAuth from "./locales/uz/auth.json";
import uzBoard from "./locales/uz/board.json";
import uzChat from "./locales/uz/chat.json";
import uzCommon from "./locales/uz/common.json";
import uzGroup from "./locales/uz/group.json";
import uzHomework from "./locales/uz/homework.json";
import uzLesson from "./locales/uz/lesson.json";
import uzLive from "./locales/uz/live.json";
import uzExam from "./locales/uz/exam.json";
import uzNav from "./locales/uz/nav.json";
import uzParent from "./locales/uz/parent.json";
import uzQuiz from "./locales/uz/quiz.json";
import uzStudent from "./locales/uz/student.json";
import uzVoice from "./locales/uz/voice.json";
import uzWorkspace from "./locales/uz/workspace.json";
import uzMobile from "./locales/uz/mobile.json";

const resources: Resource = {
  en: {
    account: enAccount,
    admin: enAdmin,
    auth: enAuth,
    board: enBoard,
    chat: enChat,
    common: enCommon,
    group: enGroup,
    homework: enHomework,
    lesson: enLesson,
    live: enLive,
    exam: enExam,
    nav: enNav,
    parent: enParent,
    quiz: enQuiz,
    student: enStudent,
    voice: enVoice,
    workspace: enWorkspace,
    mobile: enMobile,
  },
  ru: {
    account: ruAccount,
    admin: ruAdmin,
    auth: ruAuth,
    board: ruBoard,
    chat: ruChat,
    common: ruCommon,
    group: ruGroup,
    homework: ruHomework,
    lesson: ruLesson,
    live: ruLive,
    exam: ruExam,
    nav: ruNav,
    parent: ruParent,
    quiz: ruQuiz,
    student: ruStudent,
    voice: ruVoice,
    workspace: ruWorkspace,
    mobile: ruMobile,
  },
  uz: {
    account: uzAccount,
    admin: uzAdmin,
    auth: uzAuth,
    board: uzBoard,
    chat: uzChat,
    common: uzCommon,
    group: uzGroup,
    homework: uzHomework,
    lesson: uzLesson,
    live: uzLive,
    exam: uzExam,
    nav: uzNav,
    parent: uzParent,
    quiz: uzQuiz,
    student: uzStudent,
    voice: uzVoice,
    workspace: uzWorkspace,
    mobile: uzMobile,
  },
};

void i18next.use(initReactI18next).init({
  resources,
  lng: useLanguageStore.getState().language,
  fallbackLng: DEFAULT_LANGUAGE,
  ns: Object.keys(resources.uz),
  /*
   * `mobile` — asosiy bo'lim, chunki mobil matnlarning ko'pi shu yerda.
   * Vebda esa `common` edi: u yerda matnlar bo'limlarga teng tarqalgan.
   */
  defaultNS: "mobile",
  interpolation: { escapeValue: false },
  returnNull: false,
  /*
   * React Native'da `Intl.PluralRules` bor (Hermes `intl` bilan), lekin
   * suspense YO'Q: lug'atlar bundle ichida va darhol tayyor.
   */
  react: { useSuspense: false },
});

useLanguageStore.subscribe((state) => {
  if (i18next.language !== state.language) void i18next.changeLanguage(state.language);
});

export { i18next as i18n };
