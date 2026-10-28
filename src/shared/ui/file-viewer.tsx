import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useVideoPlayer, VideoView } from "expo-video";
import { FileQuestion } from "lucide-react-native";
import { blobToBase64, fileKindOf, fileNameFor, writeBlobToCache, type FileKind } from "@/shared/lib";
import { dsAlpha, DsGradient, DsText, dsRadius, useDs } from "./ds";
import { Icon } from "./icon";

export interface FileViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  mimeType?: string;
  /** Sarlavha ostidagi qo'shimcha izoh (vebda faqat ekran o'quvchisi uchun). */
  meta?: string;
  load: (signal: AbortSignal) => Promise<Blob>;
}

interface LoadedFile {
  kind: FileKind;
  fileName: string;
  /** Rasm, video va audio — keshdagi fayl. */
  uri?: string;
  /** PDF — WebView'dagi pdf.js ga beriladi. */
  base64?: string;
}

/** pdf.js — UMD to'plami (`pdfjsLib`), KaTeX kabi cdnjs'dan. */
const PDFJS = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174";

/**
 * Bitta sahifani kenglik bo'yicha `<canvas>` ga chizadi — veb
 * `pdf-page-canvas.tsx` bilan bir xil hisob. Hujjat RN'dan base64 bo'lib
 * keladi (`yolupOpen`), sahifa almashishi `yolupRender` orqali.
 */
const PDF_HTML = `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>html,body{margin:0;padding:0;background:#fff;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}canvas{display:block}</style>
<script src="${PDFJS}/pdf.min.js"></script></head><body><canvas id="page"></canvas><script>
var doc=null,task=null;
function send(m){window.ReactNativeWebView.postMessage(JSON.stringify(m));}
function render(n){if(!doc)return;doc.getPage(n).then(function(p){
var w=document.body.clientWidth,r=window.devicePixelRatio||1;
var vp=p.getViewport({scale:w/p.getViewport({scale:1}).width*r});
var c=document.getElementById("page");c.width=Math.floor(vp.width);c.height=Math.floor(vp.height);
c.style.width=w+"px";c.style.height=(vp.height/r)+"px";
if(task)task.cancel();task=p.render({canvasContext:c.getContext("2d"),viewport:vp});
task.promise.catch(function(){});window.scrollTo(0,0);});}
window.yolupRender=render;
window.yolupOpen=function(b64){try{if(!window.pdfjsLib)return send({type:"error"});
pdfjsLib.GlobalWorkerOptions.workerSrc="${PDFJS}/pdf.worker.min.js";
var raw=atob(b64),bytes=new Uint8Array(raw.length);for(var i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
pdfjsLib.getDocument({data:bytes}).promise.then(function(d){doc=d;send({type:"loaded",pages:d.numPages});render(1);})
.catch(function(){send({type:"error"});});}catch(e){send({type:"error"});}};
</script></body></html>`;

function clock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds || 0));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/**
 * Fayl ko'ruvchi — veb `file-viewer.tsx` (tor ekran): to'liq ekran, fayl
 * faqat ilova ichida ko'rinadi (yuklab olish yo'q, PDF va rasm ustida suv
 * belgisi). PDF — WebView'da pdf.js (sahifalab), rasm — `Image`, video —
 * `expo-video`, audio — `expo-audio`.
 */
export function FileViewer({ open, onOpenChange, name, mimeType = "", load }: FileViewerProps) {
  const { t } = useTranslation("common");
  const ds = useDs();
  const insets = useSafeAreaInsets();
  const [file, setFile] = useState<LoadedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);
  const webRef = useRef<WebView>(null);

  useEffect(() => {
    if (!open) return undefined;
    const controller = new AbortController();
    load(controller.signal)
      .then(async (blob) => {
        const type = blob.type || mimeType;
        const kind = fileKindOf(type, name);
        const fileName = fileNameFor(name, type);
        if (kind === "pdf") return { kind, fileName, base64: await blobToBase64(blob) };
        if (kind === "other") return { kind, fileName };
        return { kind, fileName, uri: (await writeBlobToCache(blob, fileName)).uri };
      })
      .then((next) => {
        if (!controller.signal.aborted) setFile(next);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setError(cause instanceof Error && cause.message ? cause.message : t("fileViewer.openError"));
      });
    return () => {
      controller.abort();
      setFile(null);
      setError(null);
      setPages(0);
      setPage(1);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, name, mimeType]);

  function goTo(next: number) {
    setPage(next);
    webRef.current?.injectJavaScript(`window.yolupRender(${next});true;`);
  }

  function handleMessage(event: WebViewMessageEvent) {
    const message = JSON.parse(event.nativeEvent.data) as { type: string; pages?: number };
    if (message.type === "loaded") setPages(message.pages ?? 1);
    else setError(t("fileViewer.openError"));
  }

  const watermark = file && (file.kind === "pdf" || file.kind === "image");
  const waiting = !error && (!file || (file.kind === "pdf" && !pages));

  let body: ReactNode = null;
  if (error) body = <Notice icon={<FileQuestion size={30} color={ds.c["ink-secondary"]} />} text={error} tone="ink-secondary" />;
  else if (file?.kind === "pdf" && file.base64)
    body = (
      <WebView
        ref={webRef}
        source={{ html: PDF_HTML }}
        originWhitelist={["*"]}
        setSupportMultipleWindows={false}
        textInteractionEnabled={false}
        onMessage={handleMessage}
        onLoadEnd={() => webRef.current?.injectJavaScript(`window.yolupOpen(${JSON.stringify(file.base64)});true;`)}
        style={styles.web}
      />
    );
  else if (file?.kind === "image" && file.uri) body = <ImagePane uri={file.uri} />;
  else if (file?.kind === "video" && file.uri) body = <VideoPane uri={file.uri} />;
  else if (file?.kind === "audio" && file.uri) body = <AudioPane uri={file.uri} />;
  else if (file) body = <Notice icon={<FileQuestion size={30} color={ds.c["ink-tertiary"]} />} text={t("fileViewer.unsupported")} tone="ink-tertiary" />;

  return (
    <Modal visible={open} animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={() => onOpenChange(false)}>
      <View style={[styles.root, { backgroundColor: ds.c.canvas, paddingTop: insets.top + 20, paddingBottom: Math.max(88, insets.bottom + 72) }]}>
        <DsGradient name="auth" />
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("fileViewer.close")}
            onPress={() => onOpenChange(false)}
            style={({ pressed }) => [styles.close, { backgroundColor: pressed ? ds.c.muted : ds.c.subtle }]}
          >
            <Icon name="close" size={20} color={ds.c.ink} />
          </Pressable>
          <DsText v="title-lg" w="600" numberOfLines={1} style={styles.title}>
            {file?.fileName ?? name}
          </DsText>
        </View>

        <View style={[styles.card, { backgroundColor: ds.c.surface, boxShadow: ds.shadow.lg }]}>
          {body}
          {waiting ? (
            <View style={[styles.cover, { backgroundColor: ds.c.surface }]}>
              <Notice icon={<ActivityIndicator size={26} color={ds.c["ink-tertiary"]} />} text={t("fileViewer.opening")} tone="ink-tertiary" />
            </View>
          ) : null}
          {watermark && !waiting ? (
            <View pointerEvents="none" style={styles.watermark}>
              <DsText v="title-lg" w="600" style={[styles.watermarkText, { color: dsAlpha(ds.c.ink, 0.1) }]}>
                {t("fileViewer.watermark")}
              </DsText>
            </View>
          ) : null}
        </View>

        {pages ? (
          <View style={styles.pager}>
            <DsText v="body-sm" w="600" style={styles.grow}>
              {t("fileViewer.pageOf", { page, total: pages })}
            </DsText>
            <Pressable accessibilityRole="button" accessibilityLabel={t("fileViewer.prevPage")} disabled={page <= 1} onPress={() => goTo(page - 1)} style={styles.step}>
              <Icon name="chevron-left" size={20} color={page <= 1 ? ds.c["ink-tertiary"] : ds.c.ink} />
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={t("fileViewer.nextPage")} disabled={page >= pages} onPress={() => goTo(page + 1)} style={[styles.step, styles.stepGap]}>
              <Icon name="chevron-right" size={20} color={page >= pages ? ds.c["ink-tertiary"] : ds.c.ink} />
            </Pressable>
          </View>
        ) : null}

        <View style={[styles.note, { backgroundColor: ds.c["brand-subtle"] }]}>
          <Icon name="bolt-fill" size={18} color={ds.c["brand-strong"]} />
          <DsText v="body-sm" w="500" c="brand-strong" numberOfLines={1} style={styles.grow}>
            {t("fileViewer.platformOnlyNote")}
          </DsText>
        </View>
      </View>
    </Modal>
  );
}

function Notice({ icon, text, tone }: { icon: ReactNode; text: string; tone: "ink-secondary" | "ink-tertiary" }) {
  return (
    <View style={styles.notice}>
      {icon}
      <DsText v="body-sm" c={tone} style={styles.center}>
        {text}
      </DsText>
    </View>
  );
}

/** `<img class="w-full">` — eni to'la, balandligi rasm nisbatida; uzun rasm aylanadi. */
function ImagePane({ uri }: { uri: string }) {
  const [ratio, setRatio] = useState(1);
  return (
    <ScrollView>
      <Image
        source={{ uri }}
        resizeMode="contain"
        onLoad={(event) => {
          const { width, height } = event.nativeEvent.source;
          if (width && height) setRatio(width / height);
        }}
        style={[styles.image, { aspectRatio: ratio }]}
      />
    </ScrollView>
  );
}

/** `<video controls>` — tizim boshqaruvlari bilan. */
function VideoPane({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri);
  return <VideoView player={player} nativeControls contentFit="contain" style={styles.video} />;
}

/** `<audio controls>` o'rnida — ijro tugmasi, chiziq va vaqt. */
function AudioPane({ uri }: { uri: string }) {
  const ds = useDs();
  const player = useAudioPlayer({ uri });
  const status = useAudioPlayerStatus(player);
  const progress = status.duration ? Math.min(1, status.currentTime / status.duration) : 0;
  return (
    <View style={styles.audio}>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          if (status.playing) return player.pause();
          if (status.didJustFinish || (status.duration && status.currentTime >= status.duration)) void player.seekTo(0);
          player.play();
        }}
        style={[styles.play, { backgroundColor: ds.c.brand }]}
      >
        <Icon name={status.playing ? "pause" : "play-fill"} size={20} color={ds.c["on-action"]} />
      </Pressable>
      <View style={[styles.track, { backgroundColor: ds.c.muted }]}>
        <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: ds.c.brand }]} />
      </View>
      <DsText v="caption" w="400" c="ink-secondary" numeric>
        {clock(status.currentTime)} / {clock(status.duration)}
      </DsText>
    </View>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  center: { textAlign: "center" },
  /* `px-4 pt-5 pb-[88px]` */
  root: { flex: 1, paddingHorizontal: 16 },
  header: { height: 44, flexDirection: "row", alignItems: "center" },
  close: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, minWidth: 0, paddingHorizontal: 8, textAlign: "center" },
  /* `mt-4 flex-1 rounded-2xl shadow-lg` */
  card: { flex: 1, minHeight: 0, marginTop: 16, overflow: "hidden", borderRadius: dsRadius["2xl"] },
  web: { flex: 1, backgroundColor: "transparent" },
  cover: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  notice: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 40 },
  watermark: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "center" },
  watermarkText: { transform: [{ rotate: "-35deg" }] },
  image: { width: "100%" },
  video: { width: "100%", height: "100%" },
  audio: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16 },
  play: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  track: { flex: 1, height: 4, overflow: "hidden", borderRadius: 2 },
  fill: { height: "100%", borderRadius: 2 },
  /* `mt-4 h-10 pr-0.5`, tugmalar `size-10`, ikkinchisi `ml-3` */
  pager: { marginTop: 16, height: 40, flexDirection: "row", alignItems: "center", paddingRight: 2 },
  step: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  stepGap: { marginLeft: 12 },
  /* `mt-3.5 h-11 rounded-xl pl-[15px] gap-3` */
  note: { marginTop: 14, height: 44, flexDirection: "row", alignItems: "center", gap: 12, paddingLeft: 15, paddingRight: 12, borderRadius: dsRadius.xl },
});
