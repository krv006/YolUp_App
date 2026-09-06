const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const webRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);

/**
 * MUHIM: mobil loyiha veb loyiha (Edu_Front) papkasi ICHIDA joylashgan.
 * Metro modul topolmasa yuqoriga qarab qidiradi — natijada `sonner`,
 * `react-dom` kabi VEB paketlari mobil bundle'ga jimgina kirib kelardi.
 *
 * `disableHierarchicalLookup` bu yerda TO'G'RI KELMAYDI: u yuqoriga qarashni
 * butunlay o'chiradi va `expo/node_modules/@expo/metro-runtime` kabi
 * bog'liqlikning ichki bog'liqligini ham topolmay qoladi.
 *
 * Shuning uchun aniq nishon oladi: qidiruv boshlanishi shu loyihadan, va
 * VEB loyihaning `node_modules`/`src` papkalari butunlay bloklanadi.
 */
function escapeForRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const BLOCKED_ROOTS = [
  path.join(webRoot, "node_modules"),
  // Mobil hech qachon veb manba kodini to'g'ridan-to'g'ri import qilmaydi —
  // ko'chirish `docs/PORTED.md` orqali, ochiq va kuzatiladigan bo'lishi kerak.
  path.join(webRoot, "src"),
];

config.resolver.nodeModulesPaths = [path.resolve(projectRoot, "node_modules")];
config.resolver.blockList = BLOCKED_ROOTS.map(
  (root) => new RegExp(`^${escapeForRegExp(root + path.sep)}.*$`)
);
config.watchFolders = [projectRoot];

/**
 * `sonner` -> mobil toast shim'i.
 *
 * Domen qatlamining 14 ta 🟢 NUSXA fayli veb bilan bayt-bayt bir xil qolishi
 * uchun import satri emas, modul yechimi almashtiriladi (src/shared/ui/toast.tsx
 * boshidagi izohga qarang). tsconfig.json dagi `paths` shu bilan juft ishlaydi.
 */
const ALIASES = {
  sonner: path.resolve(projectRoot, "src/shared/ui/toast.tsx"),
};

const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const alias = ALIASES[moduleName];
  if (alias) return { type: "sourceFile", filePath: alias };
  return defaultResolveRequest
    ? defaultResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

/*
 * NativeWind o'rami (`withNativeWind`) ataylab olib tashlangan —
 * sababi `babel.config.js` dagi izohda.
 */
module.exports = config;
