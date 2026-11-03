import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Share, StyleSheet, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { AppError } from "@/shared/api";
import { DsText, dsRadius, Icon, Sheet, toast, useDs, type IconName } from "@/shared/ui";
import { suggestUsername, tempPassword, usernameAlternatives } from "../lib/parent-family";
import { useCreateChild, useUsernameAvailability } from "../model/parent.queries";
import { Celebration, ChildButton, ChildInput, ChildLabel, ChildNote, ChildSuccessScreen } from "./child-dialog-parts";

export interface CreateChildDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Credentials {
  name: string;
  username: string;
  password: string;
}

const EMPTY = { firstName: "", lastName: "", username: "", grade: "" };
const CHECK_DELAY_MS = 400;
/** Pastki oyna yopilib bo'lgach natija ekrani ochiladi (iOS ikki `Modal` ni bir vaqtda almashtirmaydi). */
const SWAP_DELAY_MS = 350;

function randomPool(): number[] {
  return Array.from({ length: 8 }, () => Math.random());
}

function fromPool(pool: number[]): () => number {
  let index = 0;
  return () => pool[index++ % pool.length];
}

function firstError(fields: AppError["fields"], key: string): string {
  const value = fields?.[key];
  return Array.isArray(value) ? value.join(" ") : value ? String(value) : "";
}

/**
 * Yangi farzand hisobi — veb `modules/parent/ui/create-child-dialog.tsx` ning
 * telefon shoxi. Login ism-familiyadan taklif qilinadi va 400 ms dan keyin
 * bandligi tekshiriladi (band bo'lsa muqobillar), vaqtinchalik parol
 * yaratiladi. Tayyor bo'lgach login va parol ko'rsatiladi; vebdagi
 * `navigator.share` o'rnida tizimning "Ulashish" oynasi (`Share`).
 */
export function CreateChildDialog({ open, onOpenChange }: CreateChildDialogProps) {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const create = useCreateChild({ notify: false });
  const [form, setForm] = useState(EMPTY);
  const [usernameEdited, setUsernameEdited] = useState(false);
  const [pool, setPool] = useState(randomPool);
  const [customPassword, setCustomPassword] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[] | null>(null);
  const [error, setError] = useState<{ field: "username" | "password" | "form"; message: string } | null>(null);
  const [ready, setReady] = useState<Credentials | null>(null);
  const [revealed, setRevealed] = useState(false);

  const username = usernameEdited ? form.username : suggestUsername(form.firstName, form.lastName);
  const password = customPassword ?? tempPassword(form.firstName, fromPool(pool));
  const [checked, setChecked] = useState("");
  const availability = useUsernameAvailability(open && !ready ? checked : "");
  const live =
    availability.data && availability.data.username.toLowerCase() === username.trim().toLowerCase() ? availability.data : null;
  const liveState = !live ? null : !live.valid ? "invalid" : live.available ? "free" : "taken";
  const usernameError = error?.field === "username" || liveState === "taken" || liveState === "invalid";
  const usernameMessage =
    error?.field === "username"
      ? error.message
      : liveState === "taken"
        ? t("createChild.taken")
        : liveState === "invalid"
          ? t("createChild.invalid")
          : liveState === "free"
            ? t("createChild.free")
            : t("createChild.usernameHint");
  const shownSuggestions =
    suggestions ??
    (liveState === "taken" && live
      ? live.suggestions.length
        ? live.suggestions
        : usernameAlternatives(form.firstName, form.lastName, username)
      : null);

  useEffect(() => {
    const timer = globalThis.setTimeout(() => setChecked(username.trim()), CHECK_DELAY_MS);
    return () => globalThis.clearTimeout(timer);
  }, [username]);

  function reset() {
    setForm(EMPTY);
    setUsernameEdited(false);
    setPool(randomPool());
    setCustomPassword(null);
    setSuggestions(null);
    setError(null);
    setReady(null);
    setRevealed(false);
    setChecked("");
  }

  function close(next: boolean) {
    onOpenChange(next);
    if (!next) reset();
  }

  function update(name: keyof typeof EMPTY, value: string) {
    setError(null);
    if (name === "username") {
      setUsernameEdited(true);
      setSuggestions(null);
    }
    setForm((current) => ({ ...current, [name]: value }));
  }

  function pickUsername(value: string) {
    setUsernameEdited(true);
    setForm((current) => ({ ...current, username: value }));
    setSuggestions(null);
    setError(null);
  }

  async function copy(value: string) {
    try {
      await Clipboard.setStringAsync(value);
      toast.success(t("createChild.copied"));
    } catch {
      toast.error(t("children.genericError"));
    }
  }

  const canSubmit =
    form.firstName.trim() && form.lastName.trim() && username.trim() && password.length >= 8 && liveState !== "taken" && liveState !== "invalid";

  function submit() {
    if (!canSubmit || create.isPending) return;
    const name = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
    setError(null);
    create.mutate(
      {
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        username: username.trim(),
        password,
        ...(form.grade.trim() ? { grade: form.grade.trim() } : {}),
      },
      {
        onSuccess: () => {
          setReady({ name, username: username.trim(), password });
          setTimeout(() => setRevealed(true), SWAP_DELAY_MS);
        },
        onError: (cause: Error) => {
          const fields = cause instanceof AppError ? cause.fields : null;
          const loginError = firstError(fields, "username");
          const passwordError = firstError(fields, "password");
          if (loginError) {
            setError({ field: "username", message: t("createChild.taken") });
            setSuggestions(live?.suggestions.length ? live.suggestions : usernameAlternatives(form.firstName, form.lastName, username));
          } else if (passwordError) {
            setError({ field: "password", message: passwordError });
          } else {
            setError({ field: "form", message: cause.message || t("children.genericError") });
          }
        },
      }
    );
  }

  if (ready) {
    const firstName = ready.name.split(" ")[0] || ready.username;
    const rows: Array<{ icon: IconName; label: string; value: string }> = [
      { icon: "person", label: t("createChild.username"), value: ready.username },
      { icon: "key", label: t("createChild.password"), value: ready.password },
    ];
    return (
      <ChildSuccessScreen
        open={open && revealed}
        onClose={() => close(false)}
        footer={
          <>
            <ChildButton
              variant="link"
              label={t("createChild.share")}
              onPress={() =>
                void Share.share({
                  title: t("createChild.printHeading", { name: ready.name || ready.username }),
                  message: rows.map((row) => `${row.label}: ${row.value}`).join("\n"),
                }).catch(() => undefined)
              }
            />
            <ChildButton wide label={t("createChild.done")} onPress={() => close(false)} style={styles.fullButton} />
          </>
        }
      >
        <Celebration icon="how-to-reg" tone="green" />
        <DsText v="h1" heading style={styles.successTitle}>
          {t("createChild.readyTitle")}
        </DsText>
        <DsText v="body-sm" c="ink-secondary" style={styles.center}>
          {t("createChild.readyText", { name: firstName })}
        </DsText>
        {/* `flex w-full flex-col gap-4 rounded-2xl bg-subtle p-4` */}
        <View style={[styles.credentials, { backgroundColor: ds.c.subtle }]}>
          {rows.map((row) => (
            <View key={row.label} style={styles.credential}>
              <View style={[styles.credentialIcon, { backgroundColor: ds.c.surface }]}>
                <Icon name={row.icon} size={20} color={ds.c["icon-secondary"]} />
              </View>
              <View style={styles.grow}>
                <DsText v="caption" c="ink-secondary">
                  {row.label}
                </DsText>
                <DsText v="title-sm" numberOfLines={1} selectable>
                  {row.value}
                </DsText>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${t("createChild.copy")}: ${row.label}`}
                onPress={() => void copy(row.value)}
                style={({ pressed }) => [styles.copy, { backgroundColor: pressed ? ds.c.muted : ds.c.surface }]}
              >
                <Icon name="content-copy" size={18} color={ds.c.icon} />
              </Pressable>
            </View>
          ))}
        </View>
        <ChildNote tone="warning" icon="warning">
          {t("createChild.warning")}
        </ChildNote>
      </ChildSuccessScreen>
    );
  }

  return (
    <Sheet
      variant="app"
      open={open}
      onClose={() => close(false)}
      title={t("createChild.title")}
      description={t("createChild.description")}
      headingTitle="semibold"
      footer={
        <>
          <ChildButton variant="secondary" wide label={t("createChild.cancel")} onPress={() => close(false)} />
          <ChildButton wide label={t("createChild.submit")} disabled={!canSubmit || create.isPending} onPress={submit} />
        </>
      }
    >
      <View style={styles.form}>
        {/* `grid grid-cols-2 gap-3` */}
        <View style={styles.names}>
          <View style={[styles.field, styles.grow]}>
            <ChildLabel>{t("createChild.firstName")}</ChildLabel>
            <ChildInput autoFocus value={form.firstName} autoComplete="off" autoCorrect={false} onChangeText={(value) => update("firstName", value)} />
          </View>
          <View style={[styles.field, styles.grow]}>
            <ChildLabel>{t("createChild.lastName")}</ChildLabel>
            <ChildInput value={form.lastName} autoComplete="off" autoCorrect={false} onChangeText={(value) => update("lastName", value)} />
          </View>
        </View>

        <View style={styles.field}>
          <ChildLabel>{t("createChild.username")}</ChildLabel>
          <ChildInput
            value={username}
            invalid={usernameError}
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect={false}
            spellCheck={false}
            onChangeText={(value) => update("username", value)}
          />
          <View style={styles.hint}>
            {liveState === "free" && !usernameError ? <Icon name="check-circle" size={16} color={ds.c["success-text"]} /> : null}
            <DsText v="body-xs" c={usernameError ? "error-text" : liveState === "free" ? "success-text" : "ink-tertiary"} style={styles.grow}>
              {usernameMessage}
            </DsText>
          </View>
        </View>

        {shownSuggestions?.length ? (
          <View style={styles.suggestions}>
            {shownSuggestions.map((option) => (
              <Pressable
                key={option}
                accessibilityRole="button"
                onPress={() => pickUsername(option)}
                style={({ pressed }) => [styles.suggestion, { borderColor: ds.c["line-strong"], backgroundColor: pressed ? ds.c.subtle : ds.c.surface }]}
              >
                <DsText v="body-sm" w="500">
                  {option}
                </DsText>
              </Pressable>
            ))}
          </View>
        ) : null}

        <View style={styles.field}>
          <ChildLabel extra={t("createChild.optional")}>{t("createChild.grade")}</ChildLabel>
          <ChildInput
            value={form.grade}
            maxLength={20}
            autoComplete="off"
            placeholder={t("createChild.gradePlaceholder")}
            onChangeText={(value) => update("grade", value)}
          />
        </View>

        <View style={styles.field}>
          <ChildLabel>{t("createChild.password")}</ChildLabel>
          <View style={styles.passwordRow}>
            <View style={styles.grow}>
              <ChildInput
                value={password}
                invalid={error?.field === "password"}
                autoCapitalize="none"
                autoComplete="off"
                autoCorrect={false}
                spellCheck={false}
                onChangeText={(value) => {
                  setError(null);
                  setCustomPassword(value);
                }}
              />
            </View>
            <RoundAction
              icon="refresh"
              label={t("createChild.regenerate")}
              onPress={() => {
                setCustomPassword(null);
                setPool(randomPool());
              }}
            />
            <RoundAction icon="content-copy" label={t("createChild.copy")} onPress={() => void copy(password)} />
          </View>
          {error?.field === "password" ? (
            <DsText v="body-xs" c="error-text">
              {error.message}
            </DsText>
          ) : null}
        </View>

        <ChildNote tone="info" icon="info">
          {t("createChild.info")}
        </ChildNote>
        {error?.field === "form" ? (
          <DsText v="body-xs" c="error-text">
            {error.message}
          </DsText>
        ) : null}
      </View>
    </Sheet>
  );
}

/** `size-11 rounded-full border border-line bg-surface` belgi tugmasi. */
function RoundAction({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const ds = useDs();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.round, { borderColor: ds.c.line, backgroundColor: pressed ? ds.c.subtle : ds.c.surface }]}
    >
      <Icon name={icon} size={20} color={ds.c.icon} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  center: { textAlign: "center" },
  successTitle: { fontSize: 22, lineHeight: 32, textAlign: "center" },
  fullButton: { flex: 0 },
  credentials: { alignSelf: "stretch", gap: 16, padding: 16, borderRadius: dsRadius["2xl"] },
  credential: { flexDirection: "row", alignItems: "center", gap: 12 },
  credentialIcon: { width: 40, height: 40, borderRadius: dsRadius.xl, alignItems: "center", justifyContent: "center" },
  copy: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  form: { gap: 16, paddingHorizontal: 4, paddingBottom: 8 },
  names: { flexDirection: "row", gap: 12 },
  field: { gap: 8 },
  hint: { flexDirection: "row", alignItems: "center", gap: 6 },
  suggestions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: -4 },
  suggestion: { height: 40, justifyContent: "center", paddingHorizontal: 16, borderWidth: 1, borderRadius: dsRadius.full },
  passwordRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  round: { width: 44, height: 44, borderWidth: 1, borderRadius: 22, alignItems: "center", justifyContent: "center" },
});
