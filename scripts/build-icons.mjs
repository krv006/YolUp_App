#!/usr/bin/env node
/**
 * `assets/y-logo.svg` -> `assets/*.png`
 *
 * Ikonkalar QO'LDA chizilmaydi: belgi bitta manbada turadi va shu yerdan
 * rasterlanadi. Ilova ichidagi `<Logo />` ham AYNAN o'sha SVG'ni chizadi
 * (`src/shared/ui/logo.tsx`), shuning uchun launcher ikonkasi bilan
 * ekrandagi logo hech qachon bir-biridan farq qilib qolmaydi.
 *
 * MANBA O'ZGARDI. Avval belgi `src/shared/ui/logo-mark.json` dagi
 * geometriyadan (chiziq va ko'pburchak) chizilardi — bu vaqtinchalik
 * o'rinbosar edi. Endi haqiqiy brend fayli bor, shuning uchun manba
 * o'sha: gradientlar, egri chiziqlar va strelka o'yig'i bilan.
 *
 * Strelka SVG ichida ALOHIDA oq qatlam emas, balki shaklning TESHIGI.
 * Shuning uchun rasterlangan rasmning alfa kanali o'zi to'g'ri siluet
 * beradi — monoxrom ikonka uchun qo'shimcha hech narsa kerak emas.
 */
import { Resvg } from "@resvg/resvg-js";
import { PNG } from "pngjs";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "assets");
const SVG = readFileSync(resolve(OUT, "y-logo.svg"), "utf8");

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  return [0, 2, 4].map((index) => parseInt(value.slice(index, index + 2), 16));
}

/** Belgini shaffof fonda kerakli kenglikda rasterlaydi. */
function renderMark(width) {
  const image = new Resvg(SVG, {
    fitTo: { mode: "width", value: width },
    background: "rgba(0,0,0,0)",
  }).render();
  return { pixels: image.pixels, width: image.width, height: image.height };
}

/**
 * Belgini kvadrat kanvas markaziga joylashtiradi.
 *
 * @param size      chiqadigan rasm tomoni
 * @param scale     belgi kanvasning shuncha ulushini egallaydi
 * @param background `null` — shaffof; hex — to'ldirilgan fon
 * @param monochrome `true` — rang tashlanadi, faqat siluet qoladi
 */
function compose(size, { scale, background = null, monochrome = false }) {
  const png = new PNG({ width: size, height: size });
  const canvas = png.data;

  if (background) {
    const [r, g, b] = hexToRgb(background);
    for (let i = 0; i < canvas.length; i += 4) {
      canvas[i] = r;
      canvas[i + 1] = g;
      canvas[i + 2] = b;
      canvas[i + 3] = 255;
    }
  }

  // `scale: 0` — faqat fon (Android adaptiv ikonkasining orqa qatlami).
  const markSize = Math.round(size * scale);
  if (markSize <= 0) return PNG.sync.write(png);

  const mark = renderMark(markSize);
  const offsetX = Math.round((size - mark.width) / 2);
  const offsetY = Math.round((size - mark.height) / 2);

  for (let y = 0; y < mark.height; y += 1) {
    for (let x = 0; x < mark.width; x += 1) {
      const from = (y * mark.width + x) * 4;
      const alpha = mark.pixels[from + 3];
      if (alpha === 0) continue;

      const canvasX = x + offsetX;
      const canvasY = y + offsetY;
      if (canvasX < 0 || canvasY < 0 || canvasX >= size || canvasY >= size) continue;

      const to = (canvasY * size + canvasX) * 4;
      // Monoxromda tizim o'zi rang beradi — bizdan faqat shakl kerak.
      const source = monochrome
        ? [0, 0, 0]
        : [mark.pixels[from], mark.pixels[from + 1], mark.pixels[from + 2]];

      if (!background) {
        canvas[to] = source[0];
        canvas[to + 1] = source[1];
        canvas[to + 2] = source[2];
        canvas[to + 3] = alpha;
        continue;
      }

      // Fon bor — belgini uning ustiga aralashtiramiz (alfa kompozitsiya).
      const a = alpha / 255;
      for (let channel = 0; channel < 3; channel += 1) {
        canvas[to + channel] = Math.round(source[channel] * a + canvas[to + channel] * (1 - a));
      }
      canvas[to + 3] = 255;
    }
  }

  return PNG.sync.write(png);
}

/**
 * Fon oq. Belgi gradientning o'zida rangli, shuning uchun rangli fon
 * bilan urishib qolardi — oq fonda gradient to'liq ko'rinadi.
 */
const BACKGROUND = "#ffffff";

const FILES = [
  // iOS va zaxira ikonka. Shaffoflik YO'Q (Apple talabi — burchaklarni
  // tizimning o'zi yumaloqlaydi).
  ["icon.png", 1024, { scale: 0.76, background: BACKGROUND }],

  // Android adaptiv ikonkasi: fon va old qism alohida fayl.
  ["android-icon-background.png", 1024, { scale: 0, background: BACKGROUND }],
  // Belgi 0.46 ulushda — Android tashqi ~1/3 ni kesib tashlashi mumkin
  // (turli qurilmada turli niqob).
  ["android-icon-foreground.png", 1024, { scale: 0.46 }],
  // Monoxrom (Android 13+ "themed icons"): tizim o'zi rang beradi.
  ["android-icon-monochrome.png", 1024, { scale: 0.46, monochrome: true }],

  // Splash: fon och (#f5f7fa) yoki to'q (#0f1319) bo'lishi mumkin.
  // Belgi shaffof — gradientning eng to'q rangi ham (#5D0CFE) to'q fonda
  // ajralib turadi, shuning uchun plitka kerak emas.
  ["splash-icon.png", 512, { scale: 0.7 }],

  ["favicon.png", 96, { scale: 0.86, background: BACKGROUND }],
];

mkdirSync(OUT, { recursive: true });
for (const [name, size, options] of FILES) {
  writeFileSync(resolve(OUT, name), compose(size, options));
  console.log(`  ${name.padEnd(32)} ${size}x${size}`);
}

/*
 * Ilova ichidagi logo ham SHU fayldan chiqadi.
 *
 * React Native `.svg` ni to'g'ridan-to'g'ri import qila olmaydi (buning
 * uchun alohida Metro transformeri kerak). Shuning uchun SVG matni TS
 * doimiysiga yoziladi va `logo.tsx` uni `SvgXml` bilan chizadi.
 *
 * Fayl QO'LDA tahrirlanmaydi — `npm run build:icons` uni qayta yozadi.
 * Shu sababli ikonka bilan ekrandagi logo hech qachon ajralib ketmaydi.
 *
 * C2PA metama'lumoti (~7KB) tashlanadi: u faqat fayl kelib chiqishi
 * haqidagi ma'lumot va chizishda umuman ishlatilmaydi.
 */
const inlineSvg = SVG.replace(/<metadata>[\s\S]*?<\/metadata>/g, "").trim();
const logoModule = `// AVTOMATIK YARATILGAN — tahrirlamang.
// Manba: assets/y-logo.svg · Buyruq: npm run build:icons
//
// React Native \`.svg\` ni import qila olmaydi, shuning uchun belgi shu
// yerda matn sifatida turadi va \`logo.tsx\` uni \`SvgXml\` bilan chizadi.

export const LOGO_SVG = ${JSON.stringify(inlineSvg)};
`;
const logoModulePath = resolve(ROOT, "src/shared/ui/logo-svg.ts");
writeFileSync(logoModulePath, logoModule);
console.log(`  ${"src/shared/ui/logo-svg.ts".padEnd(32)} ${inlineSvg.length} belgi`);

console.log(`\n✔ ${FILES.length} ta ikonka va logo moduli yaratildi — manba: assets/y-logo.svg`);
