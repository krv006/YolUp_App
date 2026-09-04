import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { sanitizeHtml } from "@/shared/lib";
import { fontSize } from "./tokens";
import { useTheme } from "./theme";

export interface HtmlViewProps {
  html: string;
  /** Boshlang'ich balandlik — kontent o'lchangach o'ziga moslashadi. */
  minHeight?: number;
}

/**
 * Backenddan kelgan HTML'ni ko'rsatadi (bildirishnoma matni, vazifa tavsifi).
 *
 * XAVFSIZLIK uch qatlamli:
 *   1) backend `nh3` bilan tozalaydi (COMPLETED_WORK.md §2)
 *   2) `sanitizeHtml` skript, iframe va hodisa atributlarini olib tashlaydi
 *   3) WebView JavaScript'siz, `about:blank` originida, faqat shu HTML bilan
 *      ishlaydi va tashqi navigatsiyani rad etadi
 *
 * `WebView` ATAYLAB faqat shu yerda: ro'yxatlarda har element uchun alohida
 * WebView ochish xotirani tez yeydi (izohi `notifications-page.tsx` da).
 * Bu komponent faqat TAFSILOT ekranlarida ishlatiladi.
 */
export function HtmlView({ html, minHeight = 80 }: HtmlViewProps) {
  const { palette } = useTheme();
  const [height, setHeight] = useState(minHeight);

  const document = useMemo(() => {
    const safe = sanitizeHtml(html ?? "");
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<style>
  :root { color-scheme: ${palette === undefined ? "light" : "light dark"}; }
  body {
    margin: 0;
    padding: 0;
    background: transparent;
    color: ${palette.foreground};
    font-family: -apple-system, Roboto, sans-serif;
    font-size: ${fontSize.md}px;
    line-height: 1.5;
    word-wrap: break-word;
  }
  a { color: ${palette["primary-text"]}; }
  img { max-width: 100%; height: auto; }
  pre, code { white-space: pre-wrap; }
</style>
</head>
<body>${safe}</body>
</html>`;
  }, [html, palette]);

  return (
    <View style={[styles.root, { height }]}>
      <WebView
        originWhitelist={["about:blank"]}
        source={{ html: document, baseUrl: "about:blank" }}
        style={styles.web}
        // Skript kerak emas — faqat balandlikni o'lchash uchun bitta xabar.
        javaScriptEnabled
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        setSupportMultipleWindows={false}
        // Tashqi havolalar WebView ichida OCHILMAYDI — u yerda orqaga
        // qaytish tugmasi yo'q va foydalanuvchi qamalib qoladi.
        onShouldStartLoadWithRequest={(request) => request.url === "about:blank"}
        injectedJavaScript={`
          (function () {
            function report() {
              window.ReactNativeWebView.postMessage(String(document.body.scrollHeight));
            }
            report();
            window.addEventListener('load', report);
          })();
          true;
        `}
        onMessage={(event) => {
          const next = Number(event.nativeEvent.data);
          if (Number.isFinite(next) && next > 0) setHeight(Math.max(minHeight, next + 8));
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { width: "100%" },
  web: { flex: 1, backgroundColor: "transparent" },
});
