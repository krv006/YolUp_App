import { useMemo, useState } from "react";
import { StyleSheet, View, type StyleProp, type TextStyle } from "react-native";
import { WebView } from "react-native-webview";
import { DsText, dsType, useDs, type DsTextProps } from "@/shared/ui";

export interface MathTextProps {
  text: string;
  /** Formula o'lchami (px). Berilmasa matn o'lchamidan biroz katta. */
  size?: number;
  /** Matn qismlari uslubi (vebda ota elementdan meros oladi). */
  v?: DsTextProps["v"];
  w?: DsTextProps["w"];
  c?: DsTextProps["c"];
  style?: StyleProp<TextStyle>;
  /**
   * Vebdagi `whitespace-pre-line` ota element kabi: qator ko'chirishlari
   * saqlanadi (vazifa javoblari, izohlar). Odatda o'chiq — test matni.
   */
  preLine?: boolean;
}

/** HTML matn oqimi kabi: qator ko'chirish va ketma-ket bo'shliqlar bitta bo'shliq (vebda brauzer shunday chizadi). */
function collapse(text: string, preLine = false): string {
  return preLine ? text.replace(/[^\S\n]+/g, " ").replace(/ ?\n ?/g, "\n") : text.replace(/\s+/g, " ");
}

function hasMath(text: string): boolean {
  return /\$[^$]+\$/.test(text);
}

/** MathLive `\\placeholder[id]{qiymat}` — KaTeX'da yo'q. */
const PLACEHOLDER = /\\placeholder(?:\[[^\]]*\])?\{([^{}]*)\}/;

const WEIGHTS: Record<string, number> = { "400": 400, "500": 500, "600": 600, "700": 700 };

/**
 * `$...$` ichidagi LaTeX'ni formula qilib chizadi — veb `math-text.tsx`:
 * formula matn qatorining ICHIDA turadi (`displayMode: false`), uzun qator
 * o'zi ko'chadi. Telefon ekranida kasr va ildiz o'qilishi uchun formula
 * `\displaystyle` bilan chiziladi (inline rejimda ular juda kichrayadi).
 *
 * 🟡 Mobilda matn va formulalar BITTA WebView'da chiziladi (RN `Text`
 * ichiga WebView kirmaydi). Avvalgi variant har formulani alohida WebView
 * va alohida qatorga qo'yardi, balandlik esa KaTeX shriftlari yuklanmasdan
 * o'lchanardi — kasr va ildizlar qisilib/kesilib chiqardi (2026-11-22).
 * Endi balandlik `ResizeObserver` va `document.fonts.ready` dan keyin ham
 * qayta o'lchanadi. Bosish ota `Pressable` ga o'tadi (`pointerEvents`).
 * Formulasiz matn oddiy `DsText`.
 */
export function MathText({ text, size, v = "body", w, c = "ink", style, preLine = false }: MathTextProps) {
  if (!hasMath(text))
    return (
      <DsText v={v} w={w} c={c} style={style}>
        {collapse(text, preLine).trim()}
      </DsText>
    );
  return <MathFlow text={text} size={size} v={v} w={w} c={c} style={style} preLine={preLine} />;
}

function MathFlow({ text, size, v, w, c, style, preLine }: Required<Pick<MathTextProps, "v" | "c" | "preLine">> & MathTextProps) {
  const ds = useDs();
  const flat = StyleSheet.flatten(style) ?? {};
  const type = dsType[v ?? "body"] ?? dsType.body;
  const fontSize = flat.fontSize ?? type.fontSize;
  const lineHeight = flat.lineHeight ?? type.lineHeight;
  const weight = WEIGHTS[String(flat.fontWeight ?? w ?? type.fontWeight)] ?? 400;
  const color = typeof flat.color === "string" ? flat.color : ds.c[c ?? "ink"];
  // KaTeX odatda matndan 1.21 barobar katta; telefonda 1.1 — qatorga sig'adi, kasr o'qiladi.
  const mathSize = Math.max(size ?? 0, Math.round(fontSize * 1.1));
  const lines = Math.max(1, text.split("\n").length);
  const [height, setHeight] = useState(Math.ceil(lineHeight * 1.6 * lines));

  const html = useMemo(() => {
    // `</script>` matni skriptni yopib qo'ymasin.
    const source = JSON.stringify(collapse(text, preLine).trim()).replace(/</g, "\\u003c");
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.11/katex.min.css" />
<script src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.11/katex.min.js"></script>
<style>
  html, body { margin: 0; padding: 0; background: transparent; }
  body {
    color: ${color};
    font-family: -apple-system, "SF Pro Text", Roboto, "Segoe UI", sans-serif;
    font-size: ${fontSize}px;
    line-height: ${lineHeight}px;
    font-weight: ${weight};
    white-space: ${preLine ? "pre-line" : "normal"};
    overflow-wrap: anywhere;
    -webkit-text-size-adjust: 100%;
  }
  #out { padding: 2px 0; }
  .katex { font-size: ${mathSize}px; line-height: normal; white-space: normal; }
  /* Baland formula (kasr, ildiz) bo'lgan qator qo'shnilariga yopishmasin. */
  .katex-html { display: inline-block; margin: 2px 1px; vertical-align: middle; }
  .katex-display { margin: 0; }
  .raw { font-family: ui-monospace, Menlo, monospace; font-size: 0.9em; }
</style>
</head>
<body>
<div id="out"></div>
<script>
  // MathLive \\placeholder{...} KaTeX'da yo'q — qiymati yoki bo'sh katak.
  function forKatex(latex) {
    return latex.replace(new RegExp(${JSON.stringify(PLACEHOLDER.source)}, 'g'), function (_, value) { return value.trim() ? value : ${JSON.stringify("\\square")}; });
  }
  var out = document.getElementById('out');
  var parts = ${source}.split(/(\\$[^$]+\\$)/g);
  for (var i = 0; i < parts.length; i++) {
    var part = parts[i];
    if (!part) continue;
    if (part.length > 2 && part.charAt(0) === '$' && part.charAt(part.length - 1) === '$') {
      var span = document.createElement('span');
      var latex = part.slice(1, -1);
      try {
        if (window.katex) katex.render(${JSON.stringify("\\displaystyle ")} + forKatex(latex), span, { throwOnError: false, displayMode: false });
        else { span.className = 'raw'; span.textContent = latex; }
      } catch (error) { span.className = 'raw'; span.textContent = latex; }
      out.appendChild(span);
    } else {
      out.appendChild(document.createTextNode(part));
    }
  }
  var last = 0;
  function measure() {
    var next = Math.ceil(out.getBoundingClientRect().height);
    if (next > 0 && next !== last) {
      last = next;
      window.ReactNativeWebView.postMessage(String(next));
    }
  }
  measure();
  if (window.ResizeObserver) new ResizeObserver(measure).observe(out);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  window.addEventListener('load', measure);
  setTimeout(measure, 300);
  setTimeout(measure, 1200);
</script>
</body>
</html>`;
  }, [text, preLine, color, fontSize, lineHeight, weight, mathSize]);

  return (
    <View pointerEvents="none" style={[styles.flow, { height }]}>
      <WebView
        source={{ html }}
        style={styles.web}
        originWhitelist={["*"]}
        javaScriptEnabled
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        setSupportMultipleWindows={false}
        onMessage={(event) => {
          const next = Number(event.nativeEvent.data);
          if (Number.isFinite(next) && next > 0) setHeight(next);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flow: { alignSelf: "stretch", overflow: "hidden" },
  web: { flex: 1, backgroundColor: "transparent" },
});
