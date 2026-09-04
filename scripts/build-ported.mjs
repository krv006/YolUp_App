#!/usr/bin/env node
/**
 * `docs/PORTED.md` manifestini yasaydi.
 *
 * Har bir mobil fayl uchun veb'dagi manbasi topiladi va o'sha PAYTDAGI
 * mazmuni hash qilinadi. `check-sync.mjs` keyinchalik shu hash'ni qayta
 * hisoblab, veb tomonda nima o'zgarganini ko'rsatadi (MOBILE_PLAN §5.3).
 *
 * Toifa avtomatik aniqlanadi: mazmun bir xil bo'lsa 🟢 NUSXA, aks holda
 * ADAPTED ro'yxatidagi izoh olinadi.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { join, resolve, dirname, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const WEB_ROOT = resolve(ROOT, "..");
const TARGET = join(ROOT, "docs/PORTED.md");

/** Mobilda ataylab boshqacha yozilgan fayllar — toifa va sabab. */
const ADAPTED = {
  "src/shared/api/token-storage.ts": ["🔴 QAYTA", "SecureStore + xotira keshi; interfeys va sinxronligi bir xil"],
  "src/shared/api/realtime-socket.ts": ["🔴 QAYTA", "AppState + NetInfo; fon rejimida uziladi, qaytganda onResync"],
  "src/shared/api/refresh-token-manager.ts": ["🔴 QAYTA", "CustomEvent o'rniga obuna ro'yxati"],
  "src/shared/api/api-client.ts": ["🟡 MOSLASH", "navigator.onLine -> NetInfo"],
  "src/shared/api/media-url.ts": ["🟡 MOSLASH", "location.origin -> env.apiUrl (mobilda proxy yo'q)"],
  "src/shared/api/index.ts": ["🟡 MOSLASH", "barrel — veb bilan bir xil ro'yxat"],
  "src/shared/config/env.ts": ["🔴 QAYTA", "import.meta.env -> expo-constants; o'sha zod sxemasi"],
  "src/shared/lib/storage.ts": ["🔴 QAYTA", "localStorage -> MMKV; interfeys bir xil"],
  "src/shared/lib/download.ts": ["🔴 QAYTA", "<a download> -> expo-file-system + Share; ASYNC bo'ldi"],
  "src/shared/lib/sanitize-html.ts": ["🔴 QAYTA", "DOMPurify -> regex; WebView CSP bilan birga"],
  "src/shared/lib/index.ts": ["🟡 MOSLASH", "barrel + app-state/network eksportlari"],
  "src/modules/auth/model/auth.store.ts": ["🟡 MOSLASH", "window hodisalari -> refreshTokenManager.onSessionExpired; `storage` obunasi olib tashlandi (tab yo'q)"],
  "src/modules/lesson/model/lesson.queries.ts": ["🟡 MOSLASH", "useFinishLesson: mijoz tomon MediaRecorder flush olib tashlandi (Egress server tomonda)"],
  "src/modules/message/model/use-chat.ts": ["🟡 MOSLASH", "react-router-dom useNavigate -> expo-router useRouter"],
  "src/modules/live/lib/use-focus-tracker.ts": ["🔴 QAYTA", "visibilitychange/blur -> AppState; iOS `inactive` filtrlanadi"],
};

/** Mobilda mavjud, lekin veb'da manbasi yo'q (mobilga xos) fayllar. */
const MOBILE_ONLY = new Set([
  "src/shared/lib/network.ts",
  "src/shared/lib/app-state.ts",
  "src/shared/ui/tokens.ts",
  "src/shared/ui/palette.json",
  "src/shared/ui/toast.tsx",
]);

/** Ataylab ko'chirilmagan veb fayllari — sabab bilan. */
const NOT_PORTED = [
  ["src/modules/lesson/lib/teacher-audio-recording.ts", "Mijoz tomon yozuvi — Egress server tomonda (§7.3)"],
  ["src/modules/lesson/lib/teacher-video-recording.ts", "Mijoz tomon yozuvi — Egress server tomonda (§7.3)"],
  ["src/modules/lesson/model/use-teacher-audio-recording.ts", "Yuqoridagining hook'i"],
  ["src/modules/lesson/model/use-teacher-video-recording.ts", "Yuqoridagining hook'i"],
  ["src/modules/board/lib/mathlive-loader.ts", "Web Component loader — Faza 5 da WebView bilan"],
  ["src/modules/board/model/use-board-drawing.ts", "DOM pointer events — Faza 5 da Skia + gesture-handler"],
  ["src/modules/live/model/use-camera-signals.ts", "@livekit/components-react ga bog'liq — Faza 4"],
  ["src/modules/live/model/use-mic-signals.ts", "@livekit/components-react ga bog'liq — Faza 4"],
  ["src/shared/ui/** (80+ fayl)", "shadcn/Radix — mobil dizayn tizimi alohida (§8.2)"],
  ["src/modules/*/ui/**", "UI ko'chirilmaydi (§5)"],
  ["src/pages/**, src/widgets/**, src/app/**", "UI qatlami — mobil uchun qayta yoziladi"],
];

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) files.push(...walk(path));
    else files.push(path);
  }
  return files;
}

function sha(content) {
  return createHash("sha256").update(content).digest("hex").slice(0, 12);
}

/** CRLF/LF farqi port farqi emas — solishtirishdan oldin normallashtiriladi. */
function normalize(text) {
  return text.replace(/\r\n/g, "\n");
}

function webCommit() {
  try {
    return execSync("git rev-parse --short HEAD", { cwd: WEB_ROOT, encoding: "utf8" }).trim();
  } catch {
    return "noma'lum";
  }
}

const rows = [];
let identical = 0;
let adapted = 0;
let mobileOnly = 0;

for (const absolute of walk(join(ROOT, "src"))) {
  const rel = relative(ROOT, absolute).split(sep).join("/");
  if (MOBILE_ONLY.has(rel)) {
    rows.push({ rel, source: "—", category: "🆕 MOBIL", hash: "—", note: "Mobilga xos, veb'da yo'q" });
    mobileOnly += 1;
    continue;
  }

  const webPath = join(WEB_ROOT, rel);
  if (!existsSync(webPath)) continue;

  const webContent = normalize(readFileSync(webPath, "utf8"));
  const mobileContent = normalize(readFileSync(absolute, "utf8"));
  const same = webContent === mobileContent;
  // Modul barrel'lari `scripts/port-barrels.mjs` bilan generatsiya qilinadi:
  // veb ro'yxatidan `ui/` eksportlari olib tashlanadi, qolgani o'zgarmaydi.
  const isModuleBarrel = /^src\/modules\/[^/]+\/index\.ts$/.test(rel);
  const [category, note] =
    ADAPTED[rel] ??
    (same
      ? ["🟢 NUSXA", "—"]
      : isModuleBarrel
        ? ["🟡 MOSLASH", "generatsiya: veb barrel minus `ui/` eksportlari (port-barrels.mjs)"]
        : ["🟡 MOSLASH", "farq qayd etilmagan — tekshiring"]);

  if (category === "🟢 NUSXA") identical += 1;
  else adapted += 1;

  rows.push({ rel, source: rel, category, hash: sha(webContent), note });
}

rows.sort((a, b) => a.rel.localeCompare(b.rel));

const commit = webCommit();
const today = new Date().toISOString().slice(0, 10);

const body = `# Port manifesti

> **Bu fayl majburiy.** Veb loyihadan ko'chirilgan har bir fayl shu yerda
> qayd etiladi. Ro'yxatga kirmagan ko'chirma — PR'da blocker
> (\`docs/MOBILE_PLAN.md\` §18.4).

- **Manba:** \`Edu_Front\` @ \`${commit}\`
- **Oxirgi yangilanish:** ${today}
- **Qayta yaratish:** \`npm run build:ported\`
- **Drift tekshiruvi:** \`npm run check-sync\`

## Toifalar

| Belgi | Ma'nosi |
|---|---|
| 🟢 NUSXA | Veb bilan bayt-bayt bir xil. **Qo'lda tahrirlanmaydi** — o'zgarish avval veb'da qilinadi, keyin qayta ko'chiriladi |
| 🟡 MOSLASH | Ko'chirilgan, mobil uchun kichik o'zgarish. Farq quyida yozilgan |
| 🔴 QAYTA | Noldan mobil uchun yozilgan. Ommaviy interfeys veb bilan bir xil |
| 🆕 MOBIL | Mobilga xos, veb'da manbasi yo'q |

**Hash** — port qilingan paytdagi VEB faylining sha256 boshi. \`check-sync\`
uni qayta hisoblab, veb tomonda o'zgargan fayllarni ko'rsatadi.

## Hisob

- 🟢 NUSXA: **${identical}**
- 🟡/🔴 moslashtirilgan: **${adapted}**
- 🆕 mobilga xos: **${mobileOnly}**
- Jami: **${rows.length}**

## Fayllar

| Mobil fayl | Toifa | Veb hash | Farq / izoh |
|---|---|---|---|
${rows.map((r) => `| \`${r.rel}\` | ${r.category} | \`${r.hash}\` | ${r.note} |`).join("\n")}

## Ataylab ko'chirilmagan

| Veb fayl | Sabab |
|---|---|
${NOT_PORTED.map(([path, reason]) => `| \`${path}\` | ${reason} |`).join("\n")}

## Qoidalar

1. **Veb — yagona haqiqat manbai.** Backend DTO o'zgarsa avval veb yangilanadi,
   keyin mobil. Hech qachon teskarisi.
2. **🟢 NUSXA fayl tahrirlanmaydi.** Tahrirlansa toifasi 🟡 ga o'zgaradi va
   farq shu jadvalga yoziladi.
3. **Har sprint boshida \`npm run check-sync\`** — 5 daqiqalik ish, drift'ni
   erta ushlaydi.
4. **Yangi ko'chirma — yangi qator.** \`npm run build:ported\` jadvalni qayta
   yasaydi; yangi moslashtirishlar \`scripts/build-ported.mjs\` dagi
   \`ADAPTED\` ro'yxatiga qo'shiladi.
`;

mkdirSync(dirname(TARGET), { recursive: true });
writeFileSync(TARGET, body, "utf8");
console.log(`✔ docs/PORTED.md yozildi — ${rows.length} qator (🟢 ${identical} · 🟡🔴 ${adapted} · 🆕 ${mobileOnly})`);
