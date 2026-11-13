import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { radius, useTheme } from "@/shared/ui";

/*
 * ALOHIDA FAYL — AYLANMA BOG'LIQLIK UCHUN.
 *
 * `MathMarkup` avval `math-field-sheet.tsx` ichida edi. Formula palitrasi
 * unga muhtoj (shablon ko'rinishini chizadi), formula oynasi esa
 * palitraga muhtoj — natijada ikki fayl bir-birini import qilardi.
 * JS bunday halqani ko'taradi, lekin modul tartibiga qarab qiymat
 * `undefined` bo'lib qolishi mumkin (loyihada bunday ogohlantirish
 * allaqachon bor: `parent/index.ts`).
 */
/**
 * LaTeX formulani chizadi — veb `math-markup.tsx` ning mobil varianti.
 *
 * KaTeX CDN'dan yuklanadi (MOBILE_PLAN §20 dagi ruxsat etilgan manba).
 * Internetsiz holatda formula xom LaTeX sifatida ko'rinadi — bu
 * "hech narsa ko'rinmaydi" dan yaxshiroq.
 */
/**
 * MathLive'ning `\placeholder[id]{qiymat}` buyrug'i KaTeX'da yo'q (qizil xom
 * matn bo'lib chiqadi) — qiymati bo'lsa o'zi, bo'sh bo'lsa katakcha qo'yiladi.
 */
function forKatex(latex: string): string {
  return latex.replace(/\\placeholder(?:\[[^\]]*\])?\{([^{}]*)\}/g, (_, value: string) => (value.trim() ? value : "\\square"));
}

/**
 * `framed={false}` — doskadagi formula: chegarasiz, shaffof va chapga tekislangan (vebdagidek).
 * `onMeasure` — chizilgan formulaning o'lchami (CSS px): doskada tanlash ramkasi va
 * o'chirg'ich shu bilan ishlaydi (vebda `.math-markup` DOM'dan o'lchanadi).
 */
export function MathMarkup({
  latex,
  size = 20,
  framed = true,
  color,
  onMeasure,
}: {
  latex: string;
  size?: number;
  framed?: boolean;
  color?: string;
  onMeasure?: (size: { width: number; height: number }) => void;
}) {
  const { palette } = useTheme();
  const [height, setHeight] = useState(size * 2.4);

  const document = useMemo(() => {
    // LaTeX satrini JS string sifatida xavfsiz joylashtiramiz.
    const encoded = JSON.stringify(forKatex(latex ?? ""));
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.11/katex.min.css" />
<script defer src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.11/katex.min.js"></script>
<style>
  body {
    margin: 0; padding: 4px 0;
    background: transparent;
    color: ${color ?? palette.foreground};
    font-size: ${size}px;
    font-family: -apple-system, Roboto, sans-serif;
    overflow-x: auto;
  }
  #out { min-height: ${size}px; }${framed ? "" : "\n  .katex-display, .katex-display > .katex { margin: 0; text-align: left; }\n  body { padding: 0; }"}
</style>
</head>
<body>
<div id="out"></div>
<script>
  function render() {
    var target = document.getElementById('out');
    var source = ${encoded};
    try {
      // KaTeX yuklanmagan bo'lsa (internet yo'q) xom LaTeX ko'rsatiladi.
      if (window.katex) katex.render(source, target, { throwOnError: false, displayMode: true });
      else target.textContent = source;
    } catch (error) {
      target.textContent = source;
    }
    // Kenglik: KaTeX qatorlari (.base) yoki oddiy matnning o'ng chegarasi.
    var left = target.getBoundingClientRect().left;
    var right = left;
    var bases = target.querySelectorAll('.katex-html .base');
    if (bases.length) {
      for (var i = 0; i < bases.length; i++) right = Math.max(right, bases[i].getBoundingClientRect().right);
    } else {
      var range = document.createRange();
      range.selectNodeContents(target);
      right = range.getBoundingClientRect().right;
    }
    window.ReactNativeWebView.postMessage(String(document.body.scrollHeight) + '|' + String(Math.ceil(right - left)));
  }
  window.addEventListener('load', render);
  setTimeout(render, 400);
</script>
</body>
</html>`;
  }, [latex, palette, size, framed, color]);

  if (!latex?.trim()) return null;

  return (
    <View style={[styles.math, framed ? { borderWidth: StyleSheet.hairlineWidth, borderColor: palette.border } : null, { height }]}>
      <WebView
        source={{ html: document }}
        style={styles.web}
        javaScriptEnabled
        scrollEnabled={false}
        setSupportMultipleWindows={false}
        onMessage={(event) => {
          const [next = 0, width = 0] = String(event.nativeEvent.data).split("|").map(Number);
          if (!Number.isFinite(next) || next <= 0) return;
          setHeight(Math.max(size * 2, next + 8));
          if (onMeasure && Number.isFinite(width) && width > 0) onMeasure({ width, height: next });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  math: {
    width: "100%",
    borderRadius: radius.sm,
    overflow: "hidden",
  },
  web: { flex: 1, backgroundColor: "transparent" },
});

