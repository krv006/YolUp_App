import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ChevronDown, IndentDecrease, IndentIncrease } from "lucide-react-native";
import { DsText, dsRadius, MobileSelectSheet, useDs } from "@/shared/ui";
import type { CodeLanguage } from "../api/board.dto";
import { CODE_MAX_CHARS } from "../constants/board.constants";
import {
  CODE_INDENT,
  indentCode,
  newlineWithIndent,
  outdentCode,
  type CodeEdit,
} from "../lib/code-editing";
import { CODE_BACKGROUND, detectCodeLanguage } from "../lib/code-highlight";
import { useCodeTokens } from "../model/use-code-tokens";
import { CODE_FONT_FAMILY } from "./board-font";

export interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  onLanguageChange: (language: string) => void;
  languages: CodeLanguage[];
}

const TEXT = "#1c1e3a";
const FONT_SIZE = 15;

/** Bitta `\n` qo'shildimi (Enter) — qo'shilgan joy, aks holda `-1`. */
function insertedNewline(previous: string, next: string): number {
  if (next.length !== previous.length + 1) return -1;
  let index = 0;
  while (index < previous.length && previous[index] === next[index]) index += 1;
  return next[index] === "\n" && next.slice(index + 1) === previous.slice(index) ? index : -1;
}

/**
 * Kod muharriri — veb `code-editor.tsx` ning `variant="mobile"` ko'rinishi:
 * til tanlash ("Avto · aniqlangan til"), belgi hisoblagichi (6000) va
 * yozish paytida ranglanadigan maydon.
 *
 * 🟡 MOSLASH: vebda shaffof `<textarea>` ostida ranglangan `<pre>`; RN'da
 * `TextInput` ichidagi rangli `<Text>` bo'laklari (`rich-text-input.tsx`
 * dagi usul). Telefon klaviaturasida Tab va Ctrl+Enter yo'q, shuning uchun
 * chekinish tugmalari (`indentCode` / `outdentCode`) qo'shildi, Enter esa
 * qator chekinishini saqlaydi (`newlineWithIndent`). Satrlar telefonda
 * o'raladi (`wrap="off"` RN'da yo'q). Klaviatura maslahati ko'rsatilmaydi.
 */
export function CodeEditor({
  value,
  onChange,
  language,
  onLanguageChange,
  languages,
}: CodeEditorProps) {
  const { t } = useTranslation("board");
  const ds = useDs();
  const inputRef = useRef<TextInput>(null);
  const [selection, setSelection] = useState({ start: value.length, end: value.length });
  /** Matn bilan BIR yangilanishda qo'yiladigan kursor (`rich-text-input.tsx` dagidek). */
  const [forced, setForced] = useState<{ start: number; end: number } | undefined>(undefined);
  const [focused, setFocused] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const tokens = useCodeTokens(value, language);
  const detected = language === "auto" && value.trim() ? detectCodeLanguage(value) : null;
  const detectedLabel = detected
    ? (languages.find((item) => item.id === detected)?.label ?? detected)
    : null;
  const labelOf = (item: CodeLanguage) =>
    item.id === "auto" && detectedLabel
      ? t("code.detected", { language: detectedLabel })
      : item.label;
  const current = languages.find((item) => item.id === language);

  function apply(edit: CodeEdit) {
    if (edit.value.length > CODE_MAX_CHARS) return;
    onChange(edit.value);
    setSelection({ start: edit.start, end: edit.end });
    setForced({ start: edit.start, end: edit.end });
  }

  function handleChange(text: string) {
    // Maydon tab va `\r` ni ranglangan bo'laklarda probelga aylantirib ko'rsatadi (`codeLines`) — qiymat ham shunday.
    const next = text.replace(/\r\n?/g, "\n").replace(/\t/g, CODE_INDENT);
    const newline = insertedNewline(value, next);
    if (newline >= 0) return apply(newlineWithIndent(value, newline, newline));
    if (next.length <= CODE_MAX_CHARS) onChange(next);
  }

  function indent(outdent: boolean) {
    inputRef.current?.focus();
    apply(
      outdent
        ? outdentCode(value, selection.start, selection.end)
        : indentCode(value, selection.start, selection.end)
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("code.language")}
          onPress={() => setPickerOpen(true)}
          style={[styles.language, { borderColor: ds.c.line, backgroundColor: ds.c.surface }]}
        >
          <DsText v="body-sm" w="500" numberOfLines={1} style={styles.shrink}>
            {current ? labelOf(current) : language}
          </DsText>
          <ChevronDown size={16} color={ds.c["ink-secondary"]} />
        </Pressable>
        <View style={styles.grow} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Shift+Tab"
          onPress={() => indent(true)}
          style={({ pressed }) => [styles.icon, pressed && { backgroundColor: ds.c.subtle }]}
        >
          <IndentDecrease size={18} color={ds.c.ink} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tab"
          onPress={() => indent(false)}
          style={({ pressed }) => [styles.icon, pressed && { backgroundColor: ds.c.subtle }]}
        >
          <IndentIncrease size={18} color={ds.c.ink} />
        </Pressable>
        <DsText
          v="caption"
          c={value.length > CODE_MAX_CHARS * 0.9 ? "warning-text" : "ink-tertiary"}
        >
          {t("code.counter", { count: value.length, max: CODE_MAX_CHARS })}
        </DsText>
      </View>
      <TextInput
        ref={inputRef}
        autoFocus
        multiline
        textAlignVertical="top"
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        maxLength={CODE_MAX_CHARS}
        accessibilityLabel={t("code.aria")}
        placeholder={t("code.placeholder")}
        placeholderTextColor={ds.c["ink-tertiary"]}
        onChangeText={handleChange}
        selection={forced}
        onSelectionChange={(event) => {
          setSelection(event.nativeEvent.selection);
          setForced(undefined);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[styles.editor, { borderColor: focused ? ds.c.focus : ds.c.line }]}
      >
        {tokens.map((line, index) => (
          <Text key={index}>
            {line.map((token, tokenIndex) => (
              <Text key={tokenIndex} style={token.color ? { color: token.color } : undefined}>
                {token.text}
              </Text>
            ))}
            {index < tokens.length - 1 ? "\n" : ""}
          </Text>
        ))}
      </TextInput>

      <MobileSelectSheet
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        title={t("code.language")}
        value={language}
        options={languages.map((item) => ({ value: item.id, label: labelOf(item) }))}
        onChange={onLanguageChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { minWidth: 0, gap: 8 },
  grow: { flex: 1 },
  shrink: { flexShrink: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 6 },
  /* `h-10 max-w-[60%] rounded-full border px-3 text-body-sm font-medium` */
  language: {
    height: 40,
    maxWidth: "50%",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 20,
  },
  icon: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: dsRadius.md,
  },
  /* `h-40 rounded-md border`, `px-3 py-2.5`, `font-size 15px / 1.5`, fon `#f6f8fa` */
  editor: {
    height: 160,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    borderWidth: 1,
    borderRadius: dsRadius.md,
    backgroundColor: CODE_BACKGROUND,
    color: TEXT,
    fontFamily: CODE_FONT_FAMILY,
    fontSize: FONT_SIZE,
    lineHeight: FONT_SIZE * 1.5,
  },
});
