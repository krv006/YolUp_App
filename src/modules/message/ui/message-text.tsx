import { useMemo } from "react";
import { Linking, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { PlayCircle } from "lucide-react-native";
import { MIN_TOUCH_SIZE, radius, Text, useTheme } from "@/shared/ui";
import { tokenizeMessageText, type MessageToken } from "../lib/linkify";

export interface MessageTextProps {
  text: string;
  /** Chiquvchi xabarda fon to'q — matn oq bo'lishi kerak. */
  outgoing?: boolean;
}

/** Backend dars tugagach shu ko'rinishdagi havola yuboradi. */
const RECORDING_PATH = /^\/recordings\//;

/**
 * Xabar matni. Doska va yozuv havolalari ILOVA ICHIDA ochiladi, tashqi
 * havolalar brauzerda.
 *
 * `tokenizeMessageText` 🟢 veb'dan ko'chirilgan — HTML generatsiya
 * qilinmaydi, natija oddiy tokenlar, shuning uchun injeksiya xavfi yo'q.
 *
 * 🟡 VEB'DAN FARQ — DARS YOZUVI HAVOLASI.
 *
 * Veb uni matn ICHIDA chip qilib chizadi (`message-recording-chip`).
 * Mobilda u matn OSTIDA alohida qator bo'lib chiqadi. Ikki sabab:
 *
 *   1. RN'da `<Text>` ichiga ikonka (SVG) joylash Androidda ishonchsiz —
 *      tekislanish buziladi va ba'zi qurilmalarda umuman chizilmaydi.
 *   2. Ichki havola balandligi shrift o'lchamiga bog'liq, ya'ni ~18pt.
 *      Loyiha qoidasi bosiladigan elementdan kamida 44pt talab qiladi
 *      (README §Qoidalar) — alohida qator buni kafolatlaydi.
 *
 * Havolaning o'zi matndan olib tashlanadi: chip uning o'rnini bosadi,
 * aks holda bir xil narsa ikki marta ko'rinadi.
 */
export function MessageText({ text, outgoing = false }: MessageTextProps) {
  const router = useRouter();
  const { palette } = useTheme();
  const tokens = useMemo(() => tokenizeMessageText(text), [text]);

  // Tip predikati: `filter` ning o'zi birlashma tipini toraytirmaydi,
  // shuning uchun quyida `token.href` ga murojaat qilib bo'lmasdi.
  const isRecording = (token: MessageToken): token is Extract<MessageToken, { kind: "internal" }> =>
    token.kind === "internal" && RECORDING_PATH.test(token.href);

  const recordings = tokens.filter(isRecording);
  // Aniq tip: predikat `inline` ni haddan tashqari toraytirardi — u BARCHA
  // `internal` tokenlarni chiqarib tashlardi, holbuki faqat yozuv havolalari
  // ajratilgan (doska havolasi matn ichida qolishi kerak).
  const inline: MessageToken[] = tokens.filter((token) => !isRecording(token));
  // Havoladan boshqa hech narsa qolmasa, bo'sh matn qatorini chizmaymiz.
  const hasText = inline.some((token) => token.kind !== "text" || token.value.trim() !== "");

  const linkColor = outgoing ? palette["bubble-own-foreground"] : palette["primary-text"];

  return (
    <>
      {hasText ? (
        <Text
          // `tone` emas, to'g'ridan-to'g'ri rang: chiquvchi xabar purakchasi
          // brend rangidan MUSTAQIL bo'lishi mumkin (foydalanuvchi tanlaydi),
          // shuning uchun matn ham o'sha purakcha rangiga qarab tanlanadi.
          style={outgoing ? { color: palette["bubble-own-foreground"] } : undefined}
          // Uzun xabarlar tanlanib nusxalanishi kerak (havola, kod, telefon raqami).
          selectable
        >
          {inline.map((token, index) => {
            if (token.kind === "text") return token.value;

            const openLink = () => {
              if (token.kind === "internal") router.push(token.href);
              else void Linking.openURL(token.href);
            };

            return (
              <Text
                key={index}
                accessibilityRole="link"
                onPress={openLink}
                style={[styles.link, { color: linkColor }]}
              >
                {token.value}
              </Text>
            );
          })}
        </Text>
      ) : null}

      {recordings.map((token, index) => (
        <Pressable
          key={`recording-${index}`}
          accessibilityRole="button"
          accessibilityLabel="Dars yozuvini ko'rish"
          onPress={() => router.push(token.href)}
          style={({ pressed }) => [
            styles.chip,
            {
              backgroundColor: outgoing
                ? palette["bubble-own-foreground"]
                : palette["primary-soft"],
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          <PlayCircle
            size={16}
            color={outgoing ? palette["bubble-own"] : palette["primary-text"]}
          />
          <Text
            variant="caption"
            style={{
              fontWeight: "600",
              color: outgoing ? palette["bubble-own"] : palette["primary-text"],
            }}
          >
            Yozuvni ko'rish
          </Text>
        </Pressable>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  link: { textDecorationLine: "underline" },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    marginTop: 6,
    minHeight: MIN_TOUCH_SIZE,
    paddingHorizontal: 12,
    borderRadius: radius.full,
  },
});
