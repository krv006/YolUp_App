import { StyleSheet, View } from "react-native";
import { Text } from "@/shared/ui";

export interface LiveWatermarkProps {
  name: string;
  id: string;
}

/**
 * Video ustidagi ism-watermark — `docs/PROJECT.md §11 #2` talabi.
 *
 * NEGA KERAK: iOS'da skrinshotni TEXNIK jihatdan to'sib bo'lmaydi
 * (MOBILE_PLAN §10). Androidda FLAG_SECURE bloklaydi, iOS'da esa faqat
 * aniqlanadi. Shu sabab watermark yagona ishonchli to'siq bo'lib qoladi:
 * chiqarilgan rasm kimga tegishli ekani ko'rinib turadi va bu tarqatishdan
 * to'xtatadi.
 *
 * Ko'rinishi ATAYLAB so'niq: darsni ko'rishga xalaqit qilmasligi kerak,
 * lekin skrinshotda o'qilishi kerak. Foydalanuvchi ID'sining bir qismi ham
 * qo'shiladi — bir xil ismli ikki o'quvchi ajratilsin.
 */
export function LiveWatermark({ name, id }: LiveWatermarkProps) {
  if (!name && !id) return null;

  const label = `${name}${id ? ` · ${id.slice(0, 8)}` : ""}`;

  return (
    // Teginishni o'tkazib yuboradi — video boshqaruvlariga xalaqit bermaydi.
    <View style={styles.root} pointerEvents="none" accessible={false} importantForAccessibility="no">
      {/* Uch joyda: ekranning bir qismi kesib olinsa ham bittasi tushadi. */}
      <Text style={[styles.mark, styles.topRight]}>{label}</Text>
      <Text style={[styles.mark, styles.center]}>{label}</Text>
      <Text style={[styles.mark, styles.bottomLeft]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  mark: {
    position: "absolute",
    color: "#ffffff",
    opacity: 0.22,
    fontSize: 12,
    fontWeight: "600",
    // Yorug' videoda ham ko'rinsin.
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowRadius: 2,
  },
  topRight: { top: 12, right: 12 },
  center: { top: "48%", alignSelf: "center", transform: [{ rotate: "-20deg" }] },
  bottomLeft: { bottom: 12, left: 12 },
});
