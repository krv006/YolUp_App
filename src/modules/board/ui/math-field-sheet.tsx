import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { Button, Input, radius, Sheet, Text, useTheme } from "@/shared/ui";

export interface MathFieldSheetProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (latex: string) => void;
}

/**
 * Formula kiritish — veb `math-field-input.tsx` (MathLive) ning mobil
 * varianti.
 *
 * MathLive — Web Component; RN'da to'g'ridan-to'g'ri ishlamaydi. Shuning
 * uchun LaTeX QO'LDA yoziladi va WebView faqat NATIJANI ko'rsatadi
 * (KaTeX bilan). Bu — ongli murosa:
 *
 *   · MathLive'ning to'liq klaviaturasini WebView ichida ishlatib, undan
 *     LaTeX'ni RN'ga qaytarish mumkin, lekin u ~300KB CDN yuki va
 *     WebView ↔ RN ko'prigi orqali har bosishda xabar almashinuvini
 *     talab qiladi — low-end Androidda sezilarli kechikish.
 *   · Doskaga formula kamdan-kam yoziladi (faqat matematika kurslari),
 *     va o'qituvchi LaTeX'ni odatda biladi.
 *
 * Ko'rish tomoni to'liq: doskadagi formulalar KaTeX bilan chiziladi
 * (`MathMarkup`), ya'ni o'quvchi hamma narsani ko'radi.
 */
export function MathFieldSheet({ open, onClose, onSubmit }: MathFieldSheetProps) {
  const [latex, setLatex] = useState("");

  function close() {
    setLatex("");
    onClose();
  }

  return (
    <Sheet
      open={open}
      onClose={close}
      title="Formula qo'shish"
      description="LaTeX ko'rinishida yozing — pastda ko'rinishi chiqadi."
    >
      <Input
        label="LaTeX"
        placeholder="\\frac{a}{b} yoki x^2 + y^2 = z^2"
        value={latex}
        onChangeText={setLatex}
        autoFocus
        autoCapitalize="none"
        multiline
      />

      <Text variant="caption" tone="muted">
        Ko'rinishi:
      </Text>
      <MathMarkup latex={latex} />

      <Button
        title="Doskaga qo'yish"
        size="lg"
        disabled={!latex.trim()}
        onPress={() => {
          onSubmit(latex.trim());
          close();
        }}
      />
    </Sheet>
  );
}

/**
 * LaTeX formulani chizadi — veb `math-markup.tsx` ning mobil varianti.
 *
 * KaTeX CDN'dan yuklanadi (MOBILE_PLAN §20 dagi ruxsat etilgan manba).
 * Internetsiz holatda formula xom LaTeX sifatida ko'rinadi — bu
 * "hech narsa ko'rinmaydi" dan yaxshiroq.
 */
export function MathMarkup({ latex, size = 20 }: { latex: string; size?: number }) {
  const { palette } = useTheme();
  const [height, setHeight] = useState(size * 2.4);

  const document = useMemo(() => {
    // LaTeX satrini JS string sifatida xavfsiz joylashtiramiz.
    const encoded = JSON.stringify(latex ?? "");
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
    color: ${palette.foreground};
    font-size: ${size}px;
    font-family: -apple-system, Roboto, sans-serif;
    overflow-x: auto;
  }
  #out { min-height: ${size}px; }
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
    window.ReactNativeWebView.postMessage(String(document.body.scrollHeight));
  }
  window.addEventListener('load', render);
  setTimeout(render, 400);
</script>
</body>
</html>`;
  }, [latex, palette, size]);

  if (!latex?.trim()) return null;

  return (
    <View style={[styles.math, { height, borderColor: palette.border }]}>
      <WebView
        source={{ html: document }}
        style={styles.web}
        javaScriptEnabled
        scrollEnabled={false}
        setSupportMultipleWindows={false}
        onMessage={(event) => {
          const next = Number(event.nativeEvent.data);
          if (Number.isFinite(next) && next > 0) setHeight(Math.max(size * 2, next + 8));
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  math: {
    width: "100%",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.sm,
    overflow: "hidden",
  },
  web: { flex: 1, backgroundColor: "transparent" },
});
