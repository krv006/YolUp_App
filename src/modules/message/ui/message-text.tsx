import { useMemo } from "react";
import { Linking, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Text, useTheme } from "@/shared/ui";
import { tokenizeMessageText } from "../lib/linkify";

export interface MessageTextProps {
  text: string;
  /** Chiquvchi xabarda fon to'q — matn oq bo'lishi kerak. */
  outgoing?: boolean;
}

/**
 * Xabar matni. Doska va yozuv havolalari ILOVA ICHIDA ochiladi, tashqi
 * havolalar brauzerda.
 *
 * `tokenizeMessageText` 🟢 veb'dan ko'chirilgan — HTML generatsiya
 * qilinmaydi, natija oddiy tokenlar, shuning uchun injeksiya xavfi yo'q.
 */
export function MessageText({ text, outgoing = false }: MessageTextProps) {
  const router = useRouter();
  const { palette } = useTheme();
  const tokens = useMemo(() => tokenizeMessageText(text), [text]);

  return (
    <Text
      // `tone` emas, to'g'ridan-to'g'ri rang: chiquvchi xabar purakchasi
      // brend rangidan MUSTAQIL bo'lishi mumkin (foydalanuvchi tanlaydi),
      // shuning uchun matn ham o'sha purakcha rangiga qarab tanlanadi.
      style={outgoing ? { color: palette["bubble-own-foreground"] } : undefined}
      // Uzun xabarlar tanlanib nusxalanishi kerak (havola, kod, telefon raqami).
      selectable
    >
      {tokens.map((token, index) => {
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
            style={[
              styles.link,
              { color: outgoing ? palette["bubble-own-foreground"] : palette["primary-text"] },
            ]}
          >
            {token.value}
          </Text>
        );
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  link: { textDecorationLine: "underline" },
});
