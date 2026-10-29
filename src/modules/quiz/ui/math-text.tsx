import { StyleSheet, View, type StyleProp, type TextStyle } from "react-native";
import { MathMarkup } from "@/modules/board";
import { DsText, type DsTextProps } from "@/shared/ui";

export interface MathTextProps {
  text: string;
  size?: number;
  /** Matn qismlari uslubi (vebda ota elementdan meros oladi). */
  v?: DsTextProps["v"];
  w?: DsTextProps["w"];
  style?: StyleProp<TextStyle>;
}

/** HTML matn oqimi kabi: qator ko'chirish va ketma-ket bo'shliqlar bitta bo'shliq (vebda brauzer shunday chizadi). */
function collapse(text: string): string {
  return text.replace(/\s+/g, " ");
}

function hasMath(text: string): boolean {
  return /\$[^$]+\$/.test(text);
}

/**
 * `$...$` ichidagi LaTeX'ni formula qilib chizadi — veb `math-text.tsx`.
 * Vebda formula matn qatorida turadi; RN'da WebView matn ichiga kirmaydi,
 * shuning uchun formulali matn bo'laklarga bo'linib ustma-ust chiziladi.
 */
export function MathText({ text, size = 17, v, w, style }: MathTextProps) {
  if (!hasMath(text))
    return (
      <DsText v={v} w={w} style={style}>
        {collapse(text).trim()}
      </DsText>
    );
  const parts = text.split(/(\$[^$]+\$)/g).filter((part) => part.trim());
  return (
    <View style={styles.stack}>
      {parts.map((part, index) =>
        part.length > 2 && part.startsWith("$") && part.endsWith("$") ? (
          <MathMarkup key={index} latex={part.slice(1, -1)} size={size} framed={false} />
        ) : (
          <DsText key={index} v={v} w={w} style={style}>
            {collapse(part).trim()}
          </DsText>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({ stack: { gap: 4 } });
