import { useState } from "react";

import { Button, Input, Sheet, Text } from "@/shared/ui";
import { FormulaPalette } from "./formula-palette";
import { MathMarkup } from "./math-markup";

export { MathMarkup } from "./math-markup";

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

      {/*
        * Palitra matn maydoni OSTIDA: o'qituvchi avval yozadi, keyin kerak
        * bo'lsa shablon qo'shadi. Tepada bo'lsa u klaviaturani bosib
        * qolardi va yozish boshlanishidan oldin chalg'itardi.
        */}
      <FormulaPalette onInsert={(snippet) => setLatex((current) => current + snippet)} />

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

