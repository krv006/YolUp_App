const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

/**
 * MUHIM: mobil loyiha veb loyiha (Edu_Front) ICHIDA joylashgan. Node ham,
 * Metro ham modul topolmasa yuqoriga qarab qidiradi — natijada `sonner` yoki
 * `react-dom` kabi VEB paketlari mobil bundle'ga jimgina kirib kelardi.
 *
 * Shuning uchun qidiruv faqat shu loyihaning `node_modules` iga cheklanadi.
 * Bo'lmagan paket endi ochiq xato beradi, bundle'ga tushmaydi.
 */
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, "node_modules")];
config.resolver.disableHierarchicalLookup = true;
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

module.exports = withNativeWind(config, { input: "./src/shared/styles/global.css" });
