import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Chip, ChipRow, Input, radius, Sheet, Text, useTheme } from "@/shared/ui";
import type { TextLineDto, TextListKind } from "../api/board.dto";
import { linesToPlainText } from "../lib/rich-text";

/**
 * Doskaga formatlangan matn qo'shish — veb `rich-text-input.tsx` ning
 * mobil varianti.
 *
 * 🔴 QAYTA YOZILDI. Veb `contenteditable` ichida yozadi va formatni
 * `document.execCommand` bilan qo'yadi; tanlangan matnning holati
 * `document.queryCommandState` dan o'qiladi. React Native'da bularning
 * BIRORTASI yo'q: contenteditable ham, execCommand ham, DOM tanlovi ham.
 *
 * Shuning uchun format QATOR DARAJASIDA qo'yiladi: har qator o'z
 * formatini oladi (qalin / kursiv / tagi chizilgan) va ixtiyoriy ro'yxat
 * belgisini. Bu `TextLineDto` ga to'g'ridan-to'g'ri mos tushadi —
 * oraliq HTML umuman bo'lmaydi (`lib/rich-text.ts` dagi izoh).
 *
 * NEGA SO'Z DARAJASIDA EMAS: RN `TextInput` tanlov chegarasini beradi,
 * lekin tanlangan bo'lakni alohida uslublash uchun matnni qo'lda
 * bo'laklarga bo'lib, kursor bilan birga boshqarish kerak bo'lardi.
 * Doskaga yoziladigan matn qisqa (sarlavha, ta'rif, ro'yxat), shuning
 * uchun qator darajasi amalda yetarli va barmoq bilan ishlash osonroq.
 */

export interface RichTextSheetProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (lines: TextLineDto[], plainText: string) => void;
}

interface DraftLine {
  key: string;
  text: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  list?: TextListKind;
}

let keySequence = 0;
function newLine(): DraftLine {
  keySequence += 1;
  return { key: `l${keySequence}`, text: "", bold: false, italic: false, underline: false };
}

function toDto(lines: readonly DraftLine[]): TextLineDto[] {
  return lines.map((line) => ({
    runs: [{ text: line.text, bold: line.bold, italic: line.italic, underline: line.underline }],
    ...(line.list ? { list: line.list } : {}),
  }));
}

export function RichTextSheet({ open, onClose, onSubmit }: RichTextSheetProps) {
  const { palette } = useTheme();
  const [lines, setLines] = useState<DraftLine[]>(() => [newLine()]);

  function update(key: string, patch: Partial<DraftLine>) {
    setLines((current) =>
      current.map((line) => (line.key === key ? { ...line, ...patch } : line))
    );
  }

  function close() {
    setLines([newLine()]);
    onClose();
  }

  const filled = lines.filter((line) => line.text.trim());
  const canSubmit = filled.length > 0;

  return (
    <Sheet
      open={open}
      onClose={close}
      title="Matn qo'shish"
      description="Har qatorni alohida formatlash mumkin."
    >
      {lines.map((line, index) => (
        <View
          key={line.key}
          style={[styles.row, { borderColor: palette.border, backgroundColor: palette.card }]}
        >
          <Input
            label={`${index + 1}-qator`}
            value={line.text}
            onChangeText={(text) => update(line.key, { text })}
            placeholder="Matn"
            autoFocus={index === 0}
          />

          <ChipRow>
            <Chip
              label="Qalin"
              selected={line.bold}
              onPress={() => update(line.key, { bold: !line.bold })}
            />
            <Chip
              label="Kursiv"
              selected={line.italic}
              onPress={() => update(line.key, { italic: !line.italic })}
            />
            <Chip
              label="Tagi chizilgan"
              selected={line.underline}
              onPress={() => update(line.key, { underline: !line.underline })}
            />
          </ChipRow>

          {/*
            * Ro'yxat belgilari ALOHIDA qatorda. Beshtasi bitta qatorga
            * sig'masdi va oxirgisi ("Raqam") gorizontal aylantirish ortida
            * yashirinib qolardi. Ular mazmunan ham boshqa narsa: yuqoridagi
            * uchtasi matn ko'rinishi, bu ikkitasi qator turi.
            */}
          <ChipRow>
            <Chip
              label="Belgi"
              selected={line.list === "bullet"}
              onPress={() =>
                update(line.key, { list: line.list === "bullet" ? undefined : "bullet" })
              }
            />
            <Chip
              label="Raqam"
              selected={line.list === "number"}
              onPress={() =>
                update(line.key, { list: line.list === "number" ? undefined : "number" })
              }
            />
          </ChipRow>

          {lines.length > 1 ? (
            <Text
              accessibilityRole="button"
              variant="caption"
              tone="danger"
              onPress={() => setLines((current) => current.filter((item) => item.key !== line.key))}
            >
              Qatorni o&apos;chirish
            </Text>
          ) : null}
        </View>
      ))}

      <Button
        title="Qator qo'shish"
        variant="secondary"
        onPress={() => setLines((current) => [...current, newLine()])}
      />

      <Button
        title="Doskaga qo'yish"
        size="lg"
        disabled={!canSubmit}
        onPress={() => {
          const dto = toDto(filled);
          /*
           * `text` ham yuboriladi: eski mijozlar va qidiruv faqat shuni
           * o'qiydi, veb ham ikkalasini saqlaydi. `linesToPlainText`
           * ro'yxat belgilarini ham qo'shadi.
           */
          onSubmit(dto, linesToPlainText(dto));
          close();
        }}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
