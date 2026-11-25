import { useMemo, useState } from "react";
import { Linking, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { env } from "@/shared/config";
import { sanitizeHtml } from "@/shared/lib";
import { useDs } from "@/shared/ui";

/** Veb `rich-html.ts` ro'yxatlari — backend `html_clean.py` bilan bir xil. */
const TAGS = [
  "p", "br", "strong", "b", "em", "i", "u", "s", "strike", "sub", "sup", "code", "pre", "mark", "span", "div", "hr",
  "h1", "h2", "h3", "blockquote", "ul", "ol", "li", "a", "img",
  "table", "colgroup", "col", "thead", "tbody", "tr", "th", "td",
];
const ATTRS = [
  "href", "target", "rel", "src", "alt", "style", "class", "data-type", "data-latex", "data-color",
  "colspan", "rowspan", "data-colwidth", "start",
];
const STYLE_PROPS = ["color", "background-color", "font-family", "font-size", "text-align", "width", "min-width"];
/** `highlight.js` tillari — veb `LANGUAGE_LOADERS`. */
const LANGUAGES = ["python", "javascript", "sql", "java", "cpp", "css", "xml"];

const KATEX = "https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.11";
const HLJS = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0";

/** `</script>` matni skriptni yopib qo'ymasin. */
function json(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

/**
 * Vazifa matni (boy HTML) — veb `rich-editor/ui/rich-content.tsx` (#210):
 * jadval, rasm, kod, formula (`<span data-type="inline-math" data-latex>`),
 * rang. Formulalar KaTeX, kod highlight.js bilan — ikkalasi ham faqat
 * matnda formula yoki kod bo'lsa yuklanadi (vebdagidek).
 *
 * 🟡 Vebdan farqi:
 * - Tozalash DOMPurify o'rniga WebView ichida DOM bilan, xuddi shu teglar,
 *   atributlar va `style` xossalari ro'yxati bo'yicha (RN'da DOM yo'q);
 *   oldidan `sanitizeHtml` (skript/iframe/hodisa atributlari).
 * - `/media/...` rasm manzili API serveriga to'ldiriladi.
 * - Havola WebView ichida ochilmaydi — tizim brauzerida.
 * - Balandlik kontentdan o'lchanadi (`ResizeObserver`, shrift yuklangach).
 */
export function RichContent({ html, minHeight = 20 }: { html: string; minHeight?: number }) {
  const ds = useDs();
  const [height, setHeight] = useState(minHeight);

  const document = useMemo(() => {
    const source = json(sanitizeHtml(html ?? ""));
    const c = ds.c;
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<style>
  html, body { margin: 0; padding: 0; background: transparent; }
  body { color: ${c.ink}; font-family: -apple-system, Roboto, sans-serif; font-size: 15px; line-height: 1.7; overflow-wrap: anywhere; -webkit-text-size-adjust: 100%; }
  #content { display: flow-root; }
  #content > :first-child { margin-top: 0; }
  p { margin: 0.25rem 0; }
  h1 { font-size: 1.6rem; line-height: 1.25; font-weight: 700; margin: 1.4rem 0 0.5rem; }
  h2 { font-size: 1.35rem; line-height: 1.3; font-weight: 700; margin: 1.2rem 0 0.4rem; }
  h3 { font-size: 1.15rem; font-weight: 700; margin: 1rem 0 0.25rem; }
  ul, ol { margin: 0.25rem 0; padding-left: 1.6rem; }
  ul { list-style: disc; } ol { list-style: decimal; }
  li > p { margin: 0; }
  blockquote { margin: 0.6rem 0; padding: 0.1rem 1rem; border-left: 3px solid ${c.ink}; color: ${c["ink-secondary"]}; }
  hr { border: 0; border-top: 1px solid ${c["line-strong"]}; margin: 1.1rem 0; }
  a { color: ${c.brand}; text-decoration: underline; }
  img { display: block; max-width: 100%; height: auto; border-radius: 8px; margin: 0.6rem 0; }
  sub, sup { font-size: 0.75em; line-height: 0; }
  mark { border-radius: 3px; padding: 0 1px; color: inherit; }
  code { background: ${c.subtle}; border-radius: 5px; padding: 1px 6px; font: 0.875em ui-monospace, Menlo, monospace; }
  pre { position: relative; margin: 0.8rem 0; padding: 0.9rem 1rem; overflow: auto; white-space: pre-wrap; tab-size: 4; background: ${c.subtle}; border: 1px solid ${c.line}; border-radius: 10px; font: 0.84rem/1.6 ui-monospace, Menlo, monospace; }
  pre code { background: none; padding: 0; color: inherit; font: inherit; }
  .hljs-keyword, .hljs-selector-tag, .hljs-literal, .hljs-built_in { color: #7c55ea; }
  .hljs-string, .hljs-regexp, .hljs-attr { color: #2c9a78; }
  .hljs-number, .hljs-symbol, .hljs-meta { color: #e0791f; }
  .hljs-comment, .hljs-quote { color: ${c["ink-tertiary"]}; font-style: italic; }
  .hljs-title, .hljs-function, .hljs-name, .hljs-selector-class { color: #4567f5; }
  .hljs-tag { color: #d9468f; }
  /* Jadval telefonda sig'masa o'zi yonga aylanadi. */
  .table-wrap { overflow-x: auto; margin: 0.8rem 0; }
  table { border-collapse: collapse; width: 100%; }
  td, th { border: 1px solid ${c["line-strong"]}; padding: 0.5rem 0.65rem; vertical-align: top; min-width: 2.5rem; }
  th { background: ${c.subtle}; text-align: left; font-weight: 600; }
  td p, th p { margin: 0; }
  .callout { background: #fef8eb; color: #5a3e0c; border-radius: 10px; padding: 0.7rem 1rem; margin: 0.8rem 0; }
  .callout p { margin: 0; }
  [data-type="inline-math"] { display: inline-block; padding: 1px 4px; margin: 0 1px; vertical-align: baseline; }
  .katex { font-size: 1.1em; }
</style>
</head>
<body>
<div id="content"></div>
<script>
  var TAGS = ${json(TAGS)};
  var ATTRS = ${json(ATTRS)};
  var STYLE_PROPS = ${json(STYLE_PROPS)};
  var LANGUAGES = ${json(LANGUAGES)};
  var API = ${json(env.apiUrl)};
  var SAFE_VALUE = /^[\\w\\s#%.,()'"-]+$/;

  function cleanStyle(value) {
    var kept = [];
    value.split(";").forEach(function (part) {
      var index = part.indexOf(":");
      if (index < 0) return;
      var prop = part.slice(0, index).trim().toLowerCase();
      var val = part.slice(index + 1).trim();
      if (STYLE_PROPS.indexOf(prop) < 0 || !val || val.length > 130) return;
      if (!SAFE_VALUE.test(val) || /url\\(|expression/i.test(val)) return;
      kept.push(prop + ": " + val);
    });
    return kept.join("; ");
  }

  function clean(node) {
    Array.prototype.slice.call(node.childNodes).forEach(function (child) {
      if (child.nodeType === 3) return;
      if (child.nodeType !== 1) { child.remove(); return; }
      var tag = child.tagName.toLowerCase();
      if (TAGS.indexOf(tag) < 0) {
        // Ruxsatsiz teg — ichidagi matn qoladi (DOMPurify KEEP_CONTENT kabi).
        clean(child);
        while (child.firstChild) node.insertBefore(child.firstChild, child);
        child.remove();
        return;
      }
      Array.prototype.slice.call(child.attributes).forEach(function (attr) {
        var name = attr.name.toLowerCase();
        if (ATTRS.indexOf(name) < 0) { child.removeAttribute(attr.name); return; }
        if ((name === "href" || name === "src") && !/^(https?:|mailto:|tel:|\\/\\/|\\/media\\/)/i.test(attr.value)) child.removeAttribute(attr.name);
      });
      if (child.hasAttribute("style")) {
        var style = cleanStyle(child.getAttribute("style") || "");
        if (style) child.setAttribute("style", style); else child.removeAttribute("style");
      }
      if (tag === "img") {
        var src = child.getAttribute("src") || "";
        if (/^\\/media\\//i.test(src)) child.setAttribute("src", API + src);
        else if (/^\\/\\//.test(src)) child.setAttribute("src", "https:" + src);
      }
      clean(child);
    });
  }

  var holder = document.createElement("template");
  holder.innerHTML = ${source};
  var content = document.getElementById("content");
  clean(holder.content);
  content.appendChild(holder.content);
  Array.prototype.slice.call(content.querySelectorAll("table")).forEach(function (table) {
    var wrap = document.createElement("div");
    wrap.className = "table-wrap";
    table.parentNode.insertBefore(wrap, table);
    wrap.appendChild(table);
  });

  var last = 0;
  function report() {
    var next = Math.ceil(content.getBoundingClientRect().height);
    if (next > 0 && next !== last) { last = next; window.ReactNativeWebView.postMessage("h|" + next); }
  }

  function load(tag, attrs, done) {
    var node = document.createElement(tag);
    Object.keys(attrs).forEach(function (key) { node[key] = attrs[key]; });
    if (done) node.onload = done;
    document.head.appendChild(node);
  }

  var formulas = content.querySelectorAll('[data-type="inline-math"][data-latex]');
  if (formulas.length) {
    load("link", { rel: "stylesheet", href: "${KATEX}/katex.min.css" });
    load("script", { src: "${KATEX}/katex.min.js" }, function () {
      Array.prototype.slice.call(formulas).forEach(function (node) {
        try { katex.render(node.getAttribute("data-latex") || "", node, { throwOnError: false }); }
        catch (error) { node.textContent = node.getAttribute("data-latex") || ""; }
      });
      report();
    });
  }

  var blocks = content.querySelectorAll("pre code[class*='language-']");
  if (blocks.length) {
    load("script", { src: "${HLJS}/highlight.min.js" }, function () {
      Array.prototype.slice.call(blocks).forEach(function (block) {
        var match = /language-([a-z0-9+#_-]+)/.exec(block.className);
        var language = match ? (match[1] === "html" ? "xml" : match[1]) : "";
        if (LANGUAGES.indexOf(language) < 0 || !window.hljs.getLanguage(language)) return;
        try { block.innerHTML = window.hljs.highlight(block.textContent || "", { language: language }).value; } catch (error) {}
      });
      report();
    });
  }

  report();
  window.addEventListener("load", report);
  if (window.ResizeObserver) new ResizeObserver(report).observe(content);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(report);
  setTimeout(report, 600);
</script>
</body>
</html>`;
  }, [html, ds]);

  return (
    <View style={[styles.root, { height }]}>
      <WebView
        originWhitelist={["*"]}
        source={{ html: document, baseUrl: "about:blank" }}
        style={styles.web}
        javaScriptEnabled
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        setSupportMultipleWindows={false}
        // Havola WebView ichida ochilmaydi (orqaga tugmasi yo'q) — tizim brauzerida.
        onShouldStartLoadWithRequest={(request) => {
          if (request.url === "about:blank" || request.url.startsWith("data:")) return true;
          if (request.navigationType === "click" || /^https?:/i.test(request.url)) {
            void Linking.openURL(request.url).catch(() => undefined);
          }
          return false;
        }}
        onMessage={(event) => {
          const [kind, raw] = String(event.nativeEvent.data).split("|");
          const next = Number(raw);
          if (kind === "h" && Number.isFinite(next) && next > 0) setHeight(Math.max(minHeight, next + 4));
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { width: "100%" },
  web: { flex: 1, backgroundColor: "transparent" },
});
