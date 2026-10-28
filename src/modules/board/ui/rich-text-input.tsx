import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, TextInput, View, type TextStyle } from "react-native";
import { bodyFont, dsRadius, dsType, Icon, useDs, type IconName } from "@/shared/ui";
import type { TextLineDto, TextListKind } from "../api/board.dto";

export interface RichTextInputProps {
  onChange: (lines: TextLineDto[]) => void;
}

type Format = "bold" | "italic" | "underline";
type Command = Format | TextListKind;

interface LineFormat {
  bold: boolean;
  italic: boolean;
  underline: boolean;
}

const PLAIN: LineFormat = { bold: false, italic: false, underline: false };
const BULLET = "• ";
const NUMBERED = /^\d+\. /;

const COMMANDS: Array<{ command: Command; icon: IconName; labelKey: string }> = [
  { command: "bold", icon: "format-bold", labelKey: "inline.bold" },
  { command: "italic", icon: "format-italic", labelKey: "inline.italic" },
  { command: "underline", icon: "format-underlined", labelKey: "inline.underline" },
  { command: "bullet", icon: "format-list-bulleted", labelKey: "inline.bulletList" },
  { command: "number", icon: "format-list-numbered", labelKey: "inline.numberedList" },
];

function listOf(line: string): TextListKind | undefined {
  if (line.startsWith(BULLET)) return "bullet";
  return NUMBERED.test(line) ? "number" : undefined;
}

function stripMarker(line: string): string {
  return line.startsWith(BULLET) ? line.slice(BULLET.length) : line.replace(NUMBERED, "");
}

function lineIndexAt(text: string, position: number): number {
  return text.slice(0, position).split("\n").length - 1;
}

/**
 * Matn o'zgarganda qator formatlarini saqlaydi: o'zgarmagan bosh va oxirgi
 * qatorlar o'z formatini oladi, yangi yoki tahrirlangan qatorlar esa
 * kursor turgan qatornikini (Enter'dan keyin format davom etadi).
 */
function remapFormats(previous: string, next: string, formats: LineFormat[]): LineFormat[] {
  const before = previous.split("\n");
  const after = next.split("\n");
  let head = 0;
  while (head < before.length && head < after.length && before[head] === after[head]) head += 1;
  let tail = 0;
  while (tail < before.length - head && tail < after.length - head && before[before.length - 1 - tail] === after[after.length - 1 - tail]) tail += 1;
  const inherit = formats[head] ?? formats[head - 1] ?? PLAIN;
  return [...formats.slice(0, head), ...Array.from({ length: after.length - head - tail }, () => inherit), ...formats.slice(before.length - tail)];
}

/** Bo'sh oxirgi qatorlar tashlanadi; ro'yxat belgisi matndan olinib `list` ga o'tadi. */
function toLines(text: string, formats: LineFormat[]): TextLineDto[] {
  const lines = text.split("\n").map((line, index) => {
    const format = formats[index] ?? PLAIN;
    const list = listOf(line);
    return {
      runs: [{ text: stripMarker(line), ...(format.bold ? { bold: true } : {}), ...(format.italic ? { italic: true } : {}), ...(format.underline ? { underline: true } : {}) }],
      ...(list ? { list } : {}),
    };
  });
  while (lines.length > 1 && !lines.at(-1)!.list && !lines.at(-1)!.runs[0]!.text.trim()) lines.pop();
  return lines;
}

/**
 * Formatlangan matn — veb `rich-text-input.tsx` (`variant="mobile"`): tepada
 * format tugmalari, ostida matn maydoni.
 *
 * Vebda `contenteditable` + `execCommand`; RN'da ular yo'q, shuning uchun
 * format QATOR darajasida (qalin/kursiv/tagi chizilgan butun qatorga), ro'yxat
 * belgisi esa matnning o'zida ("• ", "1. ") — Enter'da keyingi qatorga davom
 * etadi, bo'sh bandda Enter ro'yxatdan chiqaradi. Natija `TextLineDto[]`.
 */
export function RichTextInput({ onChange }: RichTextInputProps) {
  const { t } = useTranslation("board");
  const ds = useDs();
  const inputRef = useRef<TextInput>(null);
  const [text, setText] = useState("");
  const [formats, setFormats] = useState<LineFormat[]>([PLAIN]);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  /** Matn bilan BIR yangilanishda qo'yiladigan kursor (alohida `setSelection` klaviatura bilan poyga qiladi). */
  const [forced, setForced] = useState<{ start: number; end: number } | undefined>(undefined);
  const [focused, setFocused] = useState(false);

  const lines = text.split("\n");
  const first = lineIndexAt(text, selection.start);
  const last = lineIndexAt(text, selection.end);
  const current = formats[first] ?? PLAIN;
  const currentList = listOf(lines[first] ?? "");

  function commit(nextText: string, nextFormats: LineFormat[], caret?: number) {
    setText(nextText);
    setFormats(nextFormats);
    onChange(toLines(nextText, nextFormats));
    if (caret !== undefined) {
      setSelection({ start: caret, end: caret });
      setForced({ start: caret, end: caret });
    }
  }

  function handleChange(nextText: string) {
    let value = nextText;
    let caret: number | undefined;
    /*
     * Enter (qatorlar bittaga ko'paydi): ro'yxat bandida yangi qatorga belgi
     * qo'yiladi, bo'sh bandda belgi olib tashlanadi. Qatorlar bo'yicha
     * solishtiriladi — klaviatura Enter'da so'zni ham o'zgartirishi mumkin.
     */
    const before = text.split("\n");
    const after = value.split("\n");
    if (after.length === before.length + 1) {
      let index = 0;
      while (index < before.length && before[index] === after[index]) index += 1;
      // Qator oxirida Enter: bo'lingan qator o'zgarmaydi, birinchi farq — yangi bo'sh qator.
      if (index > 0 && after[index] === "" && (index >= before.length || before[index] === after[index + 1])) index -= 1;
      const line = after[index] ?? "";
      const next = after[index + 1] ?? "";
      const list = listOf(line);
      const startOf = (lines: string[], at: number) => lines.slice(0, at).reduce((sum, item) => sum + item.length + 1, 0);
      if (list && !stripMarker(line).trim() && !next) {
        const lines = [...after.slice(0, index), "", ...after.slice(index + 2)];
        value = lines.join("\n");
        caret = startOf(lines, index);
      } else if (list && !listOf(next)) {
        const marker = list === "bullet" ? BULLET : `${Number.parseInt(line, 10) + 1}. `;
        const lines = [...after.slice(0, index + 1), `${marker}${next}`, ...after.slice(index + 2)];
        value = lines.join("\n");
        caret = startOf(lines, index + 1) + marker.length;
      }
    }
    commit(value, remapFormats(text, value, formats), caret);
  }

  function run(command: Command) {
    inputRef.current?.focus();
    if (command === "bullet" || command === "number") {
      const turnOff = currentList === command;
      let delta = 0;
      const next = lines.map((line, index) => {
        if (index < first || index > last) return line;
        const body = stripMarker(line);
        const marked = turnOff ? body : `${command === "bullet" ? BULLET : `${index - first + 1}. `}${body}`;
        if (index === first) delta = marked.length - line.length;
        return marked;
      });
      commit(next.join("\n"), formats, Math.max(0, selection.start + delta));
      return;
    }
    const value = !current[command];
    commit(
      text,
      formats.map((format, index) => (index >= first && index <= last ? { ...format, [command]: value } : format)),
      selection.start
    );
  }

  function styleOf(format: LineFormat): TextStyle {
    return {
      fontFamily: bodyFont(format.bold ? "600" : "400"),
      fontStyle: format.italic ? "italic" : "normal",
      textDecorationLine: format.underline ? "underline" : "none",
    };
  }

  return (
    <View style={styles.root}>
      <View accessibilityRole="toolbar" accessibilityLabel={t("inline.formatAria")} style={styles.toolbar}>
        {COMMANDS.map(({ command, icon, labelKey }) => {
          const active = command === "bullet" || command === "number" ? currentList === command : current[command];
          return (
            <Pressable
              key={command}
              accessibilityRole="button"
              accessibilityLabel={t(labelKey)}
              accessibilityState={{ selected: active }}
              onPress={() => run(command)}
              style={({ pressed }) => [styles.command, active ? { backgroundColor: ds.c["brand-subtle"] } : pressed && { backgroundColor: ds.c.subtle }]}
            >
              <Icon name={icon} size={18} color={active ? ds.c.brand : ds.c.ink} />
            </Pressable>
          );
        })}
      </View>
      <TextInput
        ref={inputRef}
        autoFocus
        multiline
        textAlignVertical="top"
        accessibilityLabel={t("inline.textAria")}
        placeholder={t("inline.placeholder")}
        placeholderTextColor={ds.c["ink-secondary"]}
        onChangeText={handleChange}
        selection={forced}
        onSelectionChange={(event) => {
          setSelection(event.nativeEvent.selection);
          setForced(undefined);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[styles.editor, { backgroundColor: ds.c.subtle, borderColor: focused ? ds.c.brand : "transparent", color: ds.c.ink }]}
      >
        {lines.map((line, index) => (
          <Text key={index} style={styleOf(formats[index] ?? PLAIN)}>
            {index < lines.length - 1 ? `${line}\n` : line}
          </Text>
        ))}
      </TextInput>
    </View>
  );
}

const styles = StyleSheet.create({
  /* `gap-[11px]`, tugmalar `h-8 gap-1.5`, tugma `size-8 rounded-lg` */
  root: { minWidth: 0, gap: 11 },
  toolbar: { height: 32, flexDirection: "row", alignItems: "center", gap: 6 },
  command: { width: 32, height: 32, borderRadius: dsRadius.lg, alignItems: "center", justifyContent: "center" },
  /* `min-h-[71px] max-h-40 rounded-xl border-[1.5px] px-3.5 py-2.5 text-label-lg leading-6` */
  editor: {
    minHeight: 71,
    maxHeight: 160,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    borderWidth: 1.5,
    borderRadius: dsRadius.xl,
    fontFamily: bodyFont("400"),
    fontSize: dsType["label-lg"].fontSize,
    lineHeight: 24,
  },
});
