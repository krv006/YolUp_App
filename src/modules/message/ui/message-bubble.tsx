import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { CheckCheck, GraduationCap, Play, RefreshCw } from "lucide-react-native";
import { formatMessageTime } from "@/shared/lib";
import { ROLES } from "@/shared/constants";
import type { ChatMessage } from "@/shared/types";
import { fontSize, GradientFill, overlayOn, radius, Text, useTheme } from "@/shared/ui";
import { MessageAttachment } from "./message-attachment";
import { MessageText } from "./message-text";
import { VoiceMessage } from "./voice-message";

export interface MessageBubbleProps {
  message: ChatMessage;
  currentUserId?: string | null;
  /** Guruhda ketma-ket kelgan xabarlarda ism takrorlanmasin. */
  showSender?: boolean;
  onLongPress: (message: ChatMessage) => void;
  onRetryMessage?: (message: ChatMessage) => void;
}

/**
 * Veb `message-bubble.tsx` ning mobil varianti.
 *
 * Veb'da javob berish uchun pufakchani sudrash (framer-motion drag) bor edi.
 * Mobilda u ATAYLAB olib tashlandi: gorizontal sudrash Expo Router'ning
 * "orqaga surish" imkoniyati bilan to'qnashadi va foydalanuvchi javob
 * bermoqchi bo'lganda ekrandan chiqib ketadi. O'rniga uzoq bosish —
 * mobilda tanish va aniq harakat.
 */
export function MessageBubble({
  message,
  currentUserId = null,
  showSender = true,
  onLongPress,
  onRetryMessage,
}: MessageBubbleProps) {
  const { t } = useTranslation("mobile");
  const { palette, bubbleGradient } = useTheme();
  const outgoing = message.senderId === currentUserId;
  const isTeacherSender = message.senderRole === ROLES.TEACHER;
  // Gradient faqat O'Z xabarlarimizga qo'llanadi — kelgan xabar purakchasi
  // har doim neytral fonda qoladi, aks holda ikkalasi ajralib turmasdi.
  const gradient = outgoing ? bubbleGradient : null;

  if (message.type === "system") {
    /*
     * Tizim xabarida dars yozuvi havolasi bo'lsa — YOZUV KARTOCHKASI,
     * aks holda kulrang pilyulka. Veb `message-bubble.tsx` dagi
     * `SystemMessage` bilan bir xil.
     *
     * Bu holat xabar moduli vebdan qayta ko'chirilganda paydo bo'ldi:
     * eski mapper hamma xabarni `text` deb belgilardi, yangisi esa
     * backenddagi `kind: "system"` ni saqlaydi. Usiz yozuv xabari xom
     * URL'li kulrang pilyulka bo'lib qolardi.
     */
    const path = message.text.match(RECORDING_PATH)?.[0] ?? null;
    if (path) {
      return (
        <RecordingCard
          path={path}
          title={message.text.match(QUOTED_TITLE)?.[1] ?? ""}
        />
      );
    }
    return (
      <View style={styles.systemRow}>
        <View style={[styles.system, { backgroundColor: palette.muted }]}>
          <Text variant="caption" tone="muted" style={styles.systemText}>
            {message.text}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.row, outgoing ? styles.rowOutgoing : styles.rowIncoming]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${message.senderName || "Xabar"}: ${message.text}`}
        accessibilityHint="Amallar uchun uzoq bosing"
        onLongPress={() => onLongPress(message)}
        delayLongPress={280}
        style={({ pressed }) => [
          styles.bubble,
          outgoing ? styles.bubbleOutgoing : styles.bubbleIncoming,
          // Gradient bo'lsa fon SVG bilan chiziladi va burchaklar kesilishi
          // uchun `overflow` yopiladi.
          gradient ? styles.clip : null,
          {
            backgroundColor: gradient
              ? undefined
              : outgoing
                ? palette["bubble-own"]
                : palette.surface,
            borderColor: outgoing ? "transparent" : palette.border,
            // Yuborilmagan xabar so'nik ko'rinadi — holat rang bilan ham
            // beriladi, faqat ikonka bilan emas.
            opacity: message.pending ? 0.6 : 1,
          },
          pressed && { opacity: 0.85 },
        ]}
      >
        {gradient ? <GradientFill colors={gradient} /> : null}

        {!outgoing && showSender && message.senderName ? (
          /*
           * Guruhda O'QITUVCHI xabari ko'zga darhol tashlanishi kerak:
           * o'quvchi uchun vazifa va e'lon aynan undan keladi. Veb ham shu
           * farqni qo'yadi (`message-sender-name.is-teacher`) — rang
           * `tone-violet-fg`, yonida bitiruv qalpog'i ikonkasi.
           */
          <View style={styles.senderRow}>
            {isTeacherSender ? (
              <GraduationCap size={12} color={palette["tone-violet-fg"]} />
            ) : null}
            <Text
              variant="caption"
              style={[
                styles.sender,
                { color: isTeacherSender ? palette["tone-violet-fg"] : palette["primary-text"] },
              ]}
            >
              {message.senderName}
            </Text>
          </View>
        ) : null}

        {message.replyTo ? (
          <View
            style={[
              styles.reply,
              {
                borderLeftColor: outgoing
                  ? palette["bubble-own-foreground"]
                  : palette["primary-text"],
                backgroundColor: outgoing
                  ? overlayOn(palette["bubble-own-foreground"], 0.14)
                  : palette["primary-tint"],
              },
            ]}
          >
            <Text
              variant="caption"
              numberOfLines={1}
              style={{
                color: outgoing ? palette["bubble-own-foreground"] : palette["primary-text"],
              }}
            >
              {message.replyTo.author}
            </Text>
            <Text
              variant="caption"
              numberOfLines={1}
              tone={outgoing ? "onPrimary" : "muted"}
            >
              {message.replyTo.text}
            </Text>
          </View>
        ) : null}

        {message.text ? <MessageText text={message.text} outgoing={outgoing} /> : null}

        {/* Dars tugagach backend doska PDF'ini shu ko'rinishda yuboradi. */}
        {/* Audio — ovozli xabar pleyeri, qolgani fayl kartochkasi (vebdagi kabi). */}
        {message.attachment ? (
          message.attachment.mimeType?.startsWith("audio/") ? (
            <VoiceMessage attachment={message.attachment} outgoing={outgoing} />
          ) : (
            <MessageAttachment attachment={message.attachment} outgoing={outgoing} />
          )
        ) : null}

        <View style={styles.meta}>
          {message.editedAt ? (
            <Text style={[styles.metaText, { color: metaColor(outgoing, palette) }]}>
              tahrirlangan
            </Text>
          ) : null}
          <Text style={[styles.metaText, { color: metaColor(outgoing, palette) }]}>
            {formatMessageTime(message.createdAt)}
          </Text>
          {outgoing && !message.pending && !message.failed ? (
            <CheckCheck
              size={14}
              color={
                message.status === "read"
                  ? palette["bubble-own-foreground"]
                  : metaColor(true, palette)
              }
            />
          ) : null}
        </View>

        {message.failed ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => onRetryMessage?.(message)}
            style={styles.retry}
            hitSlop={6}
          >
            <RefreshCw size={13} color={palette["destructive-strong"]} />
            <Text variant="caption" tone="danger">
              {t("message.qayta_yuborish")}
            </Text>
          </Pressable>
        ) : null}
      </Pressable>
    </View>
  );
}

function metaColor(outgoing: boolean, palette: ReturnType<typeof useTheme>["palette"]): string {
  // Chiquvchi pufakchada fon to'q ko'k — oq matnning so'niq varianti kerak,
  // `muted-foreground` u yerda o'qilmaydi.
  // Qat'iy oq EMAS: och rangli purakchada u ko'rinmay qolardi.
  return outgoing
    ? overlayOn(palette["bubble-own-foreground"], 0.75)
    : palette["muted-foreground"];
}

const RECORDING_PATH = /\/recordings\/[\w-]+/;
const QUOTED_TITLE = /[“"']([^“”"']+)[”"']/;

/**
 * Dars yozuvi kartochkasi — veb `SystemMessage` ning yozuv holati.
 *
 * O'lchamlar vebdan: kartochka radius 24, chegara 1px, oq fon, pad 12,
 * oraliq 12; chapda 40x40 radius 20 ko'kimtir kvadratda o'ynash ikonkasi;
 * o'ngda ko'k "Ko'rish" tugmasi (36 balandlik, pad 0 16).
 */
function RecordingCard({ path, title }: { path: string; title: string }) {
  const { t } = useTranslation("chat");
  const { palette } = useTheme();
  const router = useRouter();

  return (
    <View style={styles.recordingRow}>
      <View
        style={[styles.recording, { backgroundColor: palette.surface, borderColor: palette.border }]}
      >
        <View style={[styles.recordingIcon, { backgroundColor: palette["primary-soft"] }]}>
          <Play size={18} color={palette.primary} />
        </View>
        <View style={styles.recordingBody}>
          <Text variant="label" numberOfLines={1}>
            {t("system.recordingTitle")}
          </Text>
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {title || t("system.recordingHint")}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("system.recordingAction")}
          onPress={() => router.push(path)}
          style={({ pressed }) => [
            styles.recordingAction,
            { backgroundColor: palette.primary, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text variant="label" style={{ color: palette["primary-foreground"] }}>
            {t("system.recordingAction")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  recordingRow: { paddingHorizontal: 12, paddingVertical: 4, alignItems: "flex-end" },
  recording: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: radius["2xl"],
    borderWidth: 1,
  },
  recordingIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  recordingBody: { flex: 1, minWidth: 0 },
  recordingAction: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  row: { paddingHorizontal: 12, paddingVertical: 4 },
  rowIncoming: { alignItems: "flex-start" },
  rowOutgoing: { alignItems: "flex-end" },
  clip: { overflow: "hidden" },
  /*
   * O'lchamlar veb `message-bubble.tsx` ning MOBIL sinflaridan
   * (`lg:` prefikssiz):
   *   max-w-[80%]  ·  rounded-2xl (24)  ·  px-3.5 py-2.5 (14/10)
   *   gap-1 (4)    ·  text-body-sm (14/20)
   *
   * Burchaklardan BITTASI kichikroq (12): chiquvchi purakchada pastki
   * o'ng, kiruvchida pastki chap — veb `rounded-br-md` / `rounded-bl-md`.
   * Shu bilan purakcha kimga tegishliligi shaklidan ham bilinadi.
   */
  bubble: {
    maxWidth: "80%",
    minWidth: 76,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius["2xl"],
    borderWidth: 1,
    gap: 4,
  },
  bubbleOutgoing: { borderBottomRightRadius: radius.md },
  bubbleIncoming: { borderBottomLeftRadius: radius.md },
  senderRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  sender: { fontWeight: "700" },
  reply: {
    borderLeftWidth: 3,
    paddingLeft: 8,
    paddingVertical: 4,
    paddingRight: 6,
    borderRadius: radius.xs,
    marginBottom: 2,
  },
  meta: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 5 },
  metaText: { fontSize: fontSize["2xs"] },
  retry: { flexDirection: "row", alignItems: "center", gap: 5, paddingTop: 4 },
  systemRow: { alignItems: "center", paddingVertical: 6, paddingHorizontal: 16 },
  system: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.full },
  systemText: { textAlign: "center" },
});
