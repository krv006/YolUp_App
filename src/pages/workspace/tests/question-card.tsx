import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { PanResponder, Pressable, StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import { MAX_OPTIONS, QUESTION_TYPE_ORDER, changeDraftType, optionLetter, type KeyFactory, type QuestionDraft } from "@/modules/quiz";
import type { QuizQuestionType } from "@/shared/types";
import {
  bodyFont,
  DsText,
  dsRadius,
  dsType,
  Icon,
  MobileSelectSheet,
  PopoverMenu,
  PopoverMenuItem,
  useDs,
  usePopoverAnchor,
  type DsType,
} from "@/shared/ui";

export interface QuestionCardProps {
  draft: QuestionDraft;
  index: number;
  locked: boolean;
  newKey: KeyFactory;
  onChange: (update: (draft: QuestionDraft) => QuestionDraft) => void;
  onRemove: () => void;
}

type Update = (update: (draft: QuestionDraft) => QuestionDraft) => void;

const BLANK = /\{\{([^{}]*)\}\}/g;
/** Tartiblash qatori `h-16` + `gap-2.5` — sudrashda bir qadam. */
const ORDER_STEP = 74;

function toBrackets(text: string): string {
  return text.replace(BLANK, (_match, inner: string) => `[${inner.split("|").map((part) => part.trim()).join("|")}]`);
}

function fromBrackets(text: string): string {
  return text.replace(/\[([^[\]]*)\]/g, "{{$1}}");
}

/** `TextInput` uchun DS matn uslubi (`text-body`, `text-title` …). */
function inputType(v: DsType, weight?: "400" | "500" | "600") {
  const type = dsType[v];
  return { fontSize: type.fontSize, fontFamily: bodyFont((weight ?? type.fontWeight) as "400" | "500" | "600") };
}

/** `h-11 rounded-lg border-[1.5px] bg-subtle px-4 text-title`, fokusda `border-focus`. */
function Field({ style, weight, ...props }: TextInputProps & { weight?: "400" | "600" }) {
  const ds = useDs();
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      placeholderTextColor={ds.c["ink-tertiary"]}
      {...props}
      onFocus={(event) => {
        setFocused(true);
        props.onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        props.onBlur?.(event);
      }}
      style={[
        styles.field,
        inputType("title", weight),
        { color: ds.c.ink, backgroundColor: ds.c.subtle, borderColor: focused ? ds.c.focus : "transparent" },
        props.editable === false && styles.dimText,
        style,
      ]}
    />
  );
}

function Pill({ children, onPress, disabled }: { children: ReactNode; onPress?: () => void; disabled?: boolean }) {
  const ds = useDs();
  const body = <View style={[styles.pill, { backgroundColor: ds.c.subtle }]}>{children}</View>;
  return onPress ? (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress}>
      {body}
    </Pressable>
  ) : (
    body
  );
}

function AddLink({ label, onPress, style }: { label: string; onPress: () => void; style?: object }) {
  const ds = useDs();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={6} style={[styles.link, style]}>
      <Icon name="add" size={18} color={ds.c.brand} />
      <DsText v="title-sm" c="brand">
        {label}
      </DsText>
    </Pressable>
  );
}

function RemoveButton({ label, disabled, onPress }: { label: string; disabled: boolean; onPress: () => void }) {
  const ds = useDs();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} style={[styles.remove, disabled && styles.faded]}>
      <Icon name="close" size={20} color={ds.c["icon-secondary"]} />
    </Pressable>
  );
}

/**
 * Savol kartasi — veb `mobile-question-card.tsx`: tepada "N-savol" (menyu:
 * variant qo'shish, o'chirish), tur va ball belgilari; savol matni va turga
 * qarab javob maydoni. Vebdan farqi: tur `<select>` o'rniga pastki oynada
 * tanlanadi, tartiblashda sudrash `PanResponder` bilan.
 */
export function QuestionCard({ draft, index, locked, newKey, onChange, onRemove }: QuestionCardProps) {
  const { t } = useTranslation("quiz");
  const ds = useDs();
  const { anchorRef, rect, open, close } = usePopoverAnchor();
  const [typeOpen, setTypeOpen] = useState(false);
  const unit = draft.type === "essay" ? t("editor.mobile.band") : t("editor.points");
  const canAddOption = (draft.type === "single" || draft.type === "multiple") && draft.options.length < MAX_OPTIONS;

  function setOption(key: string, text: string) {
    onChange((current) => ({ ...current, options: current.options.map((option) => (option.key === key ? { ...option, text } : option)) }));
  }

  function dropEmptyOption(key: string) {
    if (draft.options.length <= 2 || draft.options.find((option) => option.key === key)?.text.trim()) return;
    onChange((current) => ({
      ...current,
      options: current.options.filter((option) => option.key !== key),
      correctKeys: current.correctKeys.filter((item) => item !== key),
    }));
  }

  function toggleCorrect(key: string) {
    onChange((current) => ({
      ...current,
      correctKeys:
        current.type === "single"
          ? [key]
          : current.correctKeys.includes(key)
            ? current.correctKeys.filter((item) => item !== key)
            : [...current.correctKeys, key],
    }));
  }

  return (
    <View style={[styles.card, { backgroundColor: ds.c.surface }]}>
      <View style={styles.head}>
        <View ref={anchorRef} collapsable={false} style={styles.grow}>
          <Pressable accessibilityRole="button" disabled={locked} onPress={open}>
            <DsText v="body-sm" w="500" c="ink-secondary" numberOfLines={1}>
              {t("editor.questionNumber", { number: index + 1 })}
            </DsText>
          </Pressable>
          <PopoverMenu rect={rect} onClose={close} align="start" height={(canAddOption ? 2 : 1) * 44 + 12}>
            {canAddOption ? (
              <PopoverMenuItem
                label={t("editor.addOption")}
                onPress={() => {
                  close();
                  onChange((current) => ({ ...current, options: [...current.options, { key: newKey(), text: "" }] }));
                }}
              />
            ) : null}
            <PopoverMenuItem
              danger
              label={t("editor.removeQuestion")}
              onPress={() => {
                close();
                onRemove();
              }}
            />
          </PopoverMenu>
        </View>

        <Pill disabled={locked} onPress={() => setTypeOpen(true)}>
          <DsText v="caption-strong">{t(`editor.mobile.types.${draft.type}`)}</DsText>
          <Icon name="chevron-down" size={14} color={ds.c["ink-secondary"]} />
        </Pill>

        <Pill>
          <TextInput
            value={draft.points}
            editable={!locked}
            keyboardType="number-pad"
            accessibilityLabel={t("editor.mobile.pointsAria")}
            onChangeText={(value) => onChange((current) => ({ ...current, points: value.replace(/\D/g, "").slice(0, 3) }))}
            style={[styles.points, inputType("caption-strong"), { color: ds.c.ink, minWidth: Math.max(1, draft.points.length) * 8 }]}
          />
          <DsText v="caption-strong">{unit}</DsText>
        </Pill>
      </View>

      {draft.type === "fill_blank" ? (
        <DsText style={styles.text}>{t("editor.mobile.blankInstruction")}</DsText>
      ) : (
        <TextInput
          multiline
          // Androidda ichki aylantirish o'rniga matn balandligiga qarab o'sadi.
          scrollEnabled={false}
          value={draft.text}
          editable={!locked}
          placeholder={t("editor.questionPlaceholder")}
          placeholderTextColor={ds.c["ink-tertiary"]}
          accessibilityLabel={t("editor.questionPlaceholder")}
          onChangeText={(text) => onChange((current) => ({ ...current, text }))}
          style={[styles.text, styles.textInput, inputType("body"), { lineHeight: dsType.body.lineHeight, color: ds.c.ink }, locked && styles.dimText]}
        />
      )}

      {draft.type === "single" || draft.type === "multiple" ? (
        <View style={styles.stack}>
          {draft.options.map((option, optionIndex) => {
            const correct = draft.correctKeys.includes(option.key);
            return (
              <View key={option.key} style={[styles.option, correct ? { borderWidth: 1.5, borderColor: ds.c.success, backgroundColor: ds.c["success-bg"] } : { borderWidth: 1, borderColor: ds.c.line, backgroundColor: ds.c.surface }]}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: correct }}
                  accessibilityLabel={t("editor.mobile.markCorrect", { letter: optionLetter(optionIndex) })}
                  disabled={locked}
                  onPress={() => toggleCorrect(option.key)}
                  style={[styles.letter, { backgroundColor: correct ? ds.c["success-fg"] : ds.c.subtle }]}
                >
                  <DsText v="caption-strong" c={correct ? "on-action" : "ink-secondary"}>
                    {optionLetter(optionIndex)}
                  </DsText>
                </Pressable>
                <TextInput
                  value={option.text}
                  editable={!locked}
                  placeholder={t("editor.optionPlaceholder", { letter: optionLetter(optionIndex) })}
                  placeholderTextColor={ds.c["ink-tertiary"]}
                  onChangeText={(text) => setOption(option.key, text)}
                  onBlur={() => dropEmptyOption(option.key)}
                  style={[styles.inline, inputType("body"), { color: ds.c.ink }]}
                />
                {correct ? <Icon name="check-circle" size={22} color={ds.c.success} /> : null}
              </View>
            );
          })}
        </View>
      ) : null}

      {draft.type === "true_false" ? (
        <View style={styles.stack}>
          {[true, false].map((value, optionIndex) => {
            const correct = draft.correctBool === value;
            return (
              <Pressable
                key={String(value)}
                accessibilityRole="button"
                accessibilityState={{ selected: correct }}
                disabled={locked}
                onPress={() => onChange((current) => ({ ...current, correctBool: value }))}
                style={[styles.option, correct ? { borderWidth: 1.5, borderColor: ds.c.success, backgroundColor: ds.c["success-bg"] } : { borderWidth: 1, borderColor: ds.c.line, backgroundColor: ds.c.surface }]}
              >
                <View style={[styles.letter, { backgroundColor: correct ? ds.c["success-fg"] : ds.c.subtle }]}>
                  <DsText v="caption-strong" c={correct ? "on-action" : "ink-secondary"}>
                    {optionLetter(optionIndex)}
                  </DsText>
                </View>
                <DsText style={styles.grow}>{value ? t("editor.mobile.yes") : t("editor.mobile.no")}</DsText>
                {correct ? <Icon name="check-circle" size={22} color={ds.c.success} /> : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {draft.type === "numeric" ? <NumericAnswer draft={draft} locked={locked} onChange={onChange} /> : null}

      {draft.type === "text" ? (
        <View style={styles.stack}>
          {draft.acceptedAnswers.map((answer, answerIndex) => (
            <View key={answerIndex} style={styles.rowGap8}>
              <Field
                style={styles.grow}
                value={answer}
                editable={!locked}
                placeholder={t("editor.answerPlaceholder")}
                onChangeText={(value) =>
                  onChange((current) => ({ ...current, acceptedAnswers: current.acceptedAnswers.map((item, position) => (position === answerIndex ? value : item)) }))
                }
              />
              <RemoveButton
                label={t("editor.removeAnswer")}
                disabled={locked || draft.acceptedAnswers.length <= 1}
                onPress={() => onChange((current) => ({ ...current, acceptedAnswers: current.acceptedAnswers.filter((_, position) => position !== answerIndex) }))}
              />
            </View>
          ))}
          {!locked ? <AddLink label={t("editor.addAnswer")} onPress={() => onChange((current) => ({ ...current, acceptedAnswers: [...current.acceptedAnswers, ""] }))} /> : null}
        </View>
      ) : null}

      {draft.type === "matching" ? (
        <View style={styles.block}>
          <View style={styles.stackFlat}>
            {draft.pairs.map((pair) => (
              <View key={pair.key} style={styles.rowGap10}>
                <Field
                  weight="600"
                  style={styles.grow}
                  value={pair.left}
                  editable={!locked}
                  placeholder={t("editor.pairLeft")}
                  onChangeText={(value) => onChange((current) => ({ ...current, pairs: current.pairs.map((item) => (item.key === pair.key ? { ...item, left: value } : item)) }))}
                />
                <Icon name="arrow-forward" size={18} color={ds.c.brand} />
                <Field
                  weight="600"
                  style={styles.grow}
                  value={pair.right}
                  editable={!locked}
                  placeholder={t("editor.pairRight")}
                  onChangeText={(value) => onChange((current) => ({ ...current, pairs: current.pairs.map((item) => (item.key === pair.key ? { ...item, right: value } : item)) }))}
                />
                <RemoveButton
                  label={t("editor.removePair")}
                  disabled={locked || draft.pairs.length <= 2}
                  onPress={() => onChange((current) => ({ ...current, pairs: current.pairs.filter((item) => item.key !== pair.key) }))}
                />
              </View>
            ))}
          </View>
          {!locked ? (
            <AddLink
              style={styles.mt12}
              label={t("editor.addPair")}
              onPress={() => onChange((current) => ({ ...current, pairs: [...current.pairs, { key: newKey(), left: "", right: "" }] }))}
            />
          ) : null}
          <DsText v="caption" w="400" c="ink-secondary" style={styles.mt4}>
            {t("editor.matchingHint")}
          </DsText>
        </View>
      ) : null}

      {draft.type === "ordering" ? <OrderingList draft={draft} locked={locked} newKey={newKey} onChange={onChange} /> : null}

      {draft.type === "fill_blank" ? <BlankEditor draft={draft} locked={locked} onChange={onChange} /> : null}

      {draft.type === "essay" ? (
        <View style={[styles.essay, styles.mt12]}>
          <DsText v="body-sm" c="ink-secondary" style={styles.grow}>
            {t("editor.mobile.minWords")}
          </DsText>
          <Field
            style={styles.minWords}
            value={draft.minWords}
            editable={!locked}
            keyboardType="number-pad"
            onChangeText={(value) => onChange((current) => ({ ...current, minWords: value.replace(/\D/g, "").slice(0, 4) }))}
          />
        </View>
      ) : null}

      <MobileSelectSheet
        open={typeOpen}
        onOpenChange={setTypeOpen}
        title={t("editor.mobile.typeAria")}
        value={draft.type}
        options={QUESTION_TYPE_ORDER.map((type) => ({ value: type, label: t(`editor.mobile.types.${type}`) }))}
        onChange={(type) => type !== draft.type && onChange((current) => changeDraftType(current, type as QuizQuestionType, newKey))}
      />
    </View>
  );
}

/** Son javob va `±` farq. */
function NumericAnswer({ draft, locked, onChange }: { draft: QuestionDraft; locked: boolean; onChange: Update }) {
  const { t } = useTranslation("quiz");
  const ds = useDs();
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.block}>
      <View style={styles.rowGap10}>
        <Field
          style={[styles.grow, styles.tall]}
          value={draft.acceptedAnswers[0] ?? ""}
          editable={!locked}
          keyboardType="decimal-pad"
          placeholder={t("editor.answerPlaceholder")}
          accessibilityLabel={t("editor.answerPlaceholder")}
          onChangeText={(value) => onChange((current) => ({ ...current, acceptedAnswers: [value, ...current.acceptedAnswers.slice(1)] }))}
        />
        {/* `h-12 w-27.5 rounded-lg bg-subtle px-4 gap-3`: ± | farq */}
        <View style={[styles.tolerance, { backgroundColor: ds.c.subtle, borderColor: focused ? ds.c.focus : "transparent" }]}>
          <DsText v="title">±</DsText>
          <View style={[styles.divider, { backgroundColor: ds.c["line-strong"] }]} />
          <TextInput
            value={draft.tolerance}
            editable={!locked}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={ds.c.ink}
            accessibilityLabel={t("editor.tolerance")}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onChangeText={(value) => onChange((current) => ({ ...current, tolerance: value }))}
            style={[styles.inline, inputType("title"), { color: ds.c.ink }]}
          />
        </View>
      </View>
      <DsText v="caption" w="400" c="ink-secondary" style={styles.mt10}>
        {t("editor.mobile.numericHint")}
      </DsText>
    </View>
  );
}

/** Tartiblash — chapdagi tutqich bilan sudrab o'rin almashtiriladi. */
function OrderingList({ draft, locked, newKey, onChange }: { draft: QuestionDraft; locked: boolean; newKey: KeyFactory; onChange: Update }) {
  const { t } = useTranslation("quiz");
  const ds = useDs();
  // Qator sudralganda ro'yxatdagi o'rni o'zgaradi — oxirgi qiymatlar va sudrash holati shu yerda.
  const latest = useRef({ draft, onChange });
  const drag = useRef({ start: 0, position: 0 });
  useEffect(() => {
    latest.current = { draft, onChange };
  });

  const startDrag = useCallback((key: string) => {
    const index = latest.current.draft.options.findIndex((option) => option.key === key);
    drag.current = { start: index, position: index };
  }, []);

  const stepDrag = useCallback((steps: number) => {
    const state = drag.current;
    const next = Math.max(0, Math.min(latest.current.draft.options.length - 1, state.start + steps));
    if (state.start < 0 || next === state.position) return;
    const from = state.position;
    latest.current.onChange((current) => {
      const options = [...current.options];
      const [item] = options.splice(from, 1);
      if (item) options.splice(next, 0, item);
      return { ...current, options };
    });
    state.position = next;
  }, []);

  return (
    <View style={styles.stack}>
      {draft.options.map((option, optionIndex) => (
        <View key={option.key} style={[styles.orderRow, { backgroundColor: ds.c.subtle }]}>
          <DragHandle locked={locked} label={t("editor.mobile.dragItem")} onStart={() => startDrag(option.key)} onStep={stepDrag} />
          <DsText v="title">{optionIndex + 1}.</DsText>
          <TextInput
            value={option.text}
            editable={!locked}
            placeholder={t("editor.itemPlaceholder")}
            placeholderTextColor={ds.c["ink-tertiary"]}
            onChangeText={(text) => onChange((current) => ({ ...current, options: current.options.map((item) => (item.key === option.key ? { ...item, text } : item)) }))}
            style={[styles.inline, inputType("title"), { color: ds.c.ink }]}
          />
          <RemoveButton
            label={t("editor.removeOption")}
            disabled={locked || draft.options.length <= 2}
            onPress={() => onChange((current) => ({ ...current, options: current.options.filter((item) => item.key !== option.key) }))}
          />
        </View>
      ))}
      {!locked && draft.options.length < MAX_OPTIONS ? (
        <AddLink label={t("editor.addItem")} onPress={() => onChange((current) => ({ ...current, options: [...current.options, { key: newKey(), text: "" }] }))} />
      ) : null}
    </View>
  );
}

/**
 * Sudrash tutqichi: barmoq har `ORDER_STEP` piksel siljiganda element bir
 * o'ringa ko'chadi (vebdagi pointer-capture bilan bir xil natija). Qator
 * kalit bilan chiziladi, shuning uchun sudrash davomida tutqich o'sha qolad.
 */
function DragHandle({ locked, label, onStart, onStep }: { locked: boolean; label: string; onStart: () => void; onStep: (steps: number) => void }) {
  const ds = useDs();
  const [responder] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => onStart(),
      onPanResponderMove: (_event, gesture) => onStep(Math.round(gesture.dy / ORDER_STEP)),
    })
  );

  return (
    <View accessibilityRole="adjustable" accessibilityLabel={label} style={styles.handle} {...(locked ? {} : responder.panHandlers)}>
      <Icon name="drag-indicator" size={20} color={ds.c["icon-secondary"]} />
    </View>
  );
}

/** Bo'sh joyli matn: `[javob]` qavslari ko'k rangda, "Bo'sh joy qo'shish" tanlangan so'zni o'raydi. */
function BlankEditor({ draft, locked, onChange }: { draft: QuestionDraft; locked: boolean; onChange: Update }) {
  const { t } = useTranslation("quiz");
  const ds = useDs();
  // Kursor o'rni; maydon hali bosilmagan bo'lsa — matn oxiri (vebdagi `selectionStart` kabi).
  const selection = useRef<{ start: number; end: number } | null>(null);
  const text = toBrackets(draft.text);
  const parts = text.split(/(\[[^[\]]*\])/g);

  function update(next: string) {
    onChange((current) => ({ ...current, text: fromBrackets(next) }));
  }

  function addBlank() {
    const { start, end } = selection.current ?? { start: text.length, end: text.length };
    const selected = text.slice(start, end) || t("editor.mobile.blankAnswer");
    update(`${text.slice(0, start)}[${selected}]${text.slice(end)}`);
  }

  return (
    <View style={styles.block}>
      <TextInput
        multiline
        scrollEnabled={false}
        editable={!locked}
        placeholder={t("editor.mobile.blankPlaceholder")}
        placeholderTextColor={ds.c["ink-tertiary"]}
        accessibilityLabel={t("editor.mobile.blankPlaceholder")}
        onChangeText={update}
        onSelectionChange={(event) => {
          selection.current = event.nativeEvent.selection;
        }}
        style={[styles.blank, inputType("body"), { lineHeight: dsType.body.lineHeight, color: ds.c.ink, backgroundColor: ds.c.subtle }]}
      >
        {parts.map((part, partIndex) => (
          <DsText key={partIndex} c={part.startsWith("[") ? "brand" : "ink"}>
            {part}
          </DsText>
        ))}
      </TextInput>
      {!locked ? <AddLink style={styles.mt10} label={t("editor.mobile.addBlank")} onPress={addBlank} /> : null}
      <DsText v="caption" w="400" c="ink-secondary" style={styles.mt6}>
        {t("editor.mobile.blankHint")}
      </DsText>
    </View>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  faded: { opacity: 0.4 },
  dimText: { opacity: 0.7 },
  mt4: { marginTop: 4 },
  mt6: { marginTop: 6 },
  mt10: { marginTop: 10 },
  mt12: { marginTop: 12 },
  /* `rounded-xl bg-surface px-4 pt-3.5 pb-4` */
  card: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16, borderRadius: dsRadius.xl },
  head: { height: 28, flexDirection: "row", alignItems: "center", gap: 6 },
  pill: { height: 28, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, borderRadius: 14 },
  points: { padding: 0, textAlign: "right" },
  text: { marginTop: 7 },
  textInput: { padding: 0, textAlignVertical: "top" },
  stack: { marginTop: 12, gap: 10 },
  stackFlat: { gap: 10 },
  block: { marginTop: 12 },
  option: { height: 52, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, borderRadius: dsRadius.lg },
  letter: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  inline: { flex: 1, minWidth: 0, height: "100%", padding: 0 },
  field: { height: 44, minWidth: 0, paddingHorizontal: 16, paddingVertical: 0, borderWidth: 1.5, borderRadius: dsRadius.lg },
  tall: { height: 48 },
  tolerance: { width: 110, height: 48, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, borderWidth: 1.5, borderRadius: dsRadius.lg },
  divider: { width: 1, height: 18 },
  rowGap8: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowGap10: { flexDirection: "row", alignItems: "center", gap: 10 },
  remove: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  link: { height: 24, flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", paddingLeft: 4 },
  orderRow: { height: 64, flexDirection: "row", alignItems: "center", gap: 8, paddingLeft: 10, paddingRight: 8, borderRadius: dsRadius.lg },
  handle: { width: 24, height: 36, alignItems: "center", justifyContent: "center" },
  blank: { minHeight: 48, paddingHorizontal: 12, paddingVertical: 12, borderRadius: dsRadius.lg, textAlignVertical: "top" },
  essay: { flexDirection: "row", alignItems: "center", gap: 12 },
  minWords: { width: 90, height: 40, paddingHorizontal: 12, textAlign: "center" },
});
