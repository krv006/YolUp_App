import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { Chip, ChipRow, dsRadius, useDs } from "@/shared/ui";
import { FORMULA_GROUPS } from "../lib/formula-palette";

/**
 * Formula shablonlari palitrasi — veb `formula-palette.tsx`: guruh tablari
 * va shablonlar to'ri (`.formula-palette-grid`: kataklar kamida 80px eni,
 * 52px balandlik, bitta ramka, formula markazda).
 *
 * 🟡 VEB'DAN FARQLAR.
 *
 * 1. To'r BITTA WebView'da chiziladi (KaTeX), bosilgan shablon raqami
 *    `postMessage` bilan qaytadi. Avval har shablon alohida WebView edi —
 *    ichki ramka, tor katak, chapga surilgan va kesilgan formula, guruhda
 *    o'nlab WebView (2026-11-22 foydalanuvchi shikoyati).
 *
 * 2. PLACEHOLDER'LAR. Veb MathLive'da `#0` (joriy tanlov) va `#?` (keyingi
 *    bo'sh joy) kursorni o'zi joylaydi. Mobilda LaTeX oddiy `TextInput` da
 *    yoziladi, shuning uchun bu belgilar OLIB TASHLANADI:
 *    `\frac{#0}{#?}` -> `\frac{}{}`; qavslar ichi qo'lda to'ldiriladi.
 */

/** MathLive bo'sh joy belgilari oddiy matn maydonida ma'noga ega emas. */
export function toPlainTemplate(insert: string): string {
  return insert.replace(/#0|#\?/g, "");
}

/** `.formula-palette-grid` `max-height: 176px` — undan balandi to'r ichida aylanadi. */
const MAX_HEIGHT = 176;

export function FormulaPalette({ onInsert }: { onInsert: (latex: string) => void }) {
  const { t } = useTranslation("board");
  const ds = useDs();
  const [groupId, setGroupId] = useState(FORMULA_GROUPS[0]?.id ?? "");
  const group = FORMULA_GROUPS.find((item) => item.id === groupId) ?? FORMULA_GROUPS[0];
  const [height, setHeight] = useState(60);
  const compact = group?.id === "symbol";

  const html = useMemo(() => {
    // `</script>` ko'rinishidagi matn skriptni yopib qo'ymasin.
    const previews = JSON.stringify((group?.items ?? []).map((item) => item.preview)).replace(/</g, "\\u003c");
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.11/katex.min.css" />
<script src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.11/katex.min.js"></script>
<style>
  html, body { margin: 0; padding: 0; background: transparent; -webkit-tap-highlight-color: transparent; }
  body { color: ${ds.c.ink}; font-family: -apple-system, Roboto, sans-serif; }
  #grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(${compact ? 44 : 80}px, 1fr));
    gap: 6px;
    padding: 1px;
  }
  button {
    min-height: ${compact ? 44 : 52}px;
    padding: 4px;
    display: grid;
    place-items: center;
    overflow: hidden;
    border: 1px solid ${ds.c.line};
    border-radius: 10px;
    color: inherit;
    background: ${ds.c.surface};
    font: inherit;
    transition: background .12s ease, border-color .12s ease, transform .12s ease;
  }
  button:active { border-color: ${ds.c.brand}; background: ${ds.c["brand-subtle"]}; transform: scale(.96); }
  /* displaystyle: kasr va indekslar katakda kichrayib ketmasin. */
  .katex { font-size: 17px; line-height: 1.1; }
  .raw { font-family: ui-monospace, Menlo, monospace; font-size: 11px; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
</head>
<body>
<div id="grid"></div>
<script>
  var grid = document.getElementById('grid');
  var previews = ${previews};
  previews.forEach(function (preview, index) {
    var button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', preview);
    var span = document.createElement('span');
    try {
      if (window.katex) katex.render(${JSON.stringify("\\displaystyle ")} + preview, span, { throwOnError: false, displayMode: false });
      else { span.className = 'raw'; span.textContent = preview; }
    } catch (error) { span.className = 'raw'; span.textContent = preview; }
    button.appendChild(span);
    button.addEventListener('click', function () { window.ReactNativeWebView.postMessage('pick|' + index); });
    grid.appendChild(button);
  });
  var last = 0;
  function measure() {
    var next = Math.ceil(grid.getBoundingClientRect().height) + 2;
    if (next > 0 && next !== last) { last = next; window.ReactNativeWebView.postMessage('height|' + next); }
  }
  measure();
  if (window.ResizeObserver) new ResizeObserver(measure).observe(grid);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  setTimeout(measure, 300);
</script>
</body>
</html>`;
  }, [group, compact, ds]);

  return (
    <View style={styles.root} accessibilityLabel={t("palette.aria")}>
      <ChipRow>
        {FORMULA_GROUPS.map((item) => (
          <Chip
            key={item.id}
            label={t(`palette.groups.${item.id}`)}
            selected={item.id === groupId}
            onPress={() => {
              setGroupId(item.id);
              setHeight(60);
            }}
          />
        ))}
      </ChipRow>

      <View style={[styles.grid, { height: Math.min(height, MAX_HEIGHT) }]}>
        <WebView
          key={group?.id}
          source={{ html }}
          style={styles.web}
          originWhitelist={["*"]}
          javaScriptEnabled
          scrollEnabled={height > MAX_HEIGHT}
          nestedScrollEnabled
          showsVerticalScrollIndicator={height > MAX_HEIGHT}
          showsHorizontalScrollIndicator={false}
          setSupportMultipleWindows={false}
          onMessage={(event) => {
            const [kind, raw] = String(event.nativeEvent.data).split("|");
            const value = Number(raw);
            if (!Number.isFinite(value)) return;
            if (kind === "height" && value > 0) setHeight(value);
            if (kind === "pick") {
              const item = group?.items[value];
              if (item) onInsert(toPlainTemplate(item.insert));
            }
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 10 },
  grid: { overflow: "hidden", borderRadius: dsRadius.md },
  web: { flex: 1, backgroundColor: "transparent" },
});
