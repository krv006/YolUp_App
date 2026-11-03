import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { AppError } from "@/shared/api";
import { Avatar, DsText, dsRadius, Icon, Sheet, useDs } from "@/shared/ui";
import type { ParentLink } from "../api/parent.dto";
import { useRequestChildLink } from "../model/parent.queries";
import { Celebration, ChildButton, ChildInput, ChildLabel, ChildNote, ChildSuccessScreen } from "./child-dialog-parts";

export interface LinkChildDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Mavjud hisobni bog'lash — veb `modules/parent/ui/link-child-dialog.tsx`
 * ning telefon shoxi: pastki oynada login maydoni; topilmasa ogohlantirish.
 * Yuborilgach (yoki darhol bog'langach) butun ekranli tabrik va farzand
 * kartasi.
 */
export function LinkChildDialog({ open, onOpenChange }: LinkChildDialogProps) {
  const { t } = useTranslation("parent");
  const ds = useDs();
  const request = useRequestChildLink({ notify: false });
  const [value, setValue] = useState("");
  const [error, setError] = useState<{ message: string; notFound: boolean } | null>(null);
  const [sent, setSent] = useState<ParentLink | null>(null);

  function reset() {
    setValue("");
    setError(null);
    setSent(null);
  }

  function close(next: boolean) {
    onOpenChange(next);
    if (!next) reset();
  }

  function submit() {
    const login = value.trim();
    if (!login || request.isPending) return;
    setError(null);
    request.mutate(login, {
      onSuccess: (link) => setSent(link),
      onError: (cause: Error) =>
        setError(
          cause instanceof AppError && cause.status === 404
            ? { message: t("linkChild.notFound"), notFound: true }
            : { message: cause.message || t("children.genericError"), notFound: false }
        ),
    });
  }

  if (sent) {
    const linked = sent.status === "approved";
    return (
      <ChildSuccessScreen
        open={open}
        onClose={() => close(false)}
        footer={
          <>
            {/* `h-11 text-title-sm font-semibold text-brand` */}
            <ChildButton variant="link" label={t("linkChild.more")} onPress={reset} />
            <ChildButton label={t("linkChild.done")} wide onPress={() => close(false)} style={styles.fullButton} />
          </>
        }
      >
        <Celebration icon={linked ? "how-to-reg" : "send"} tone={linked ? "green" : "teal"} />
        <DsText v="h1" heading style={styles.successTitle}>
          {t(linked ? "linkChild.linkedTitle" : "linkChild.sentTitle")}
        </DsText>
        <DsText v="body-sm" c="ink-secondary" style={styles.center}>
          {t(linked ? "linkChild.linkedText" : "linkChild.sentText")}
        </DsText>
        {/* `flex w-full items-center gap-3 rounded-2xl bg-subtle px-4 py-3` */}
        <View style={[styles.card, { backgroundColor: ds.c.subtle }]}>
          <Avatar variant="legacy" name={sent.student.name} src={sent.student.avatarUrl ?? undefined} size="sm" box={44} />
          <View style={styles.grow}>
            <DsText v="title-sm" numberOfLines={1}>
              {sent.student.name}
            </DsText>
            <DsText v="body-xs" c="ink-secondary" numberOfLines={1}>
              @{sent.student.username}
            </DsText>
          </View>
          <View style={[styles.chip, { backgroundColor: ds.c[linked ? "success-bg" : "accent-teal-bg"] }]}>
            <Icon name={linked ? "check-circle" : "schedule"} size={14} color={ds.c[linked ? "success-text" : "accent-teal-fg"]} />
            <DsText v="caption-strong" c={linked ? "success-text" : "accent-teal-fg"}>
              {t(linked ? "linkChild.chipLinked" : "linkChild.chipPending")}
            </DsText>
          </View>
        </View>
      </ChildSuccessScreen>
    );
  }

  return (
    <Sheet
      variant="app"
      open={open}
      onClose={() => close(false)}
      title={t("linkChild.title")}
      description={t("linkChild.description")}
      headingTitle="semibold"
      footer={
        <>
          <ChildButton variant="secondary" wide label={t("linkChild.cancel")} onPress={() => close(false)} />
          <ChildButton wide label={error ? t("linkChild.retry") : t("linkChild.submit")} disabled={!value.trim() || request.isPending} onPress={submit} />
        </>
      }
    >
      <View style={styles.form}>
        <View style={styles.field}>
          <ChildLabel>{t("linkChild.label")}</ChildLabel>
          <ChildInput
            autoFocus
            value={value}
            invalid={Boolean(error)}
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect={false}
            spellCheck={false}
            returnKeyType="send"
            placeholder={t("linkChild.placeholder")}
            onSubmitEditing={submit}
            onChangeText={(text) => {
              setError(null);
              setValue(text);
            }}
          />
          <DsText v="body-xs" c={error ? "error-text" : "ink-tertiary"}>
            {error ? error.message : t("linkChild.hint")}
          </DsText>
        </View>
        {error?.notFound ? (
          <ChildNote tone="warning" icon="info">
            {t("linkChild.notFoundNote")}
          </ChildNote>
        ) : null}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  center: { textAlign: "center" },
  /* `font-heading text-[22px]/8 font-semibold` */
  successTitle: { fontSize: 22, lineHeight: 32, textAlign: "center" },
  card: { alignSelf: "stretch", flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderRadius: dsRadius["2xl"] },
  chip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: dsRadius.full },
  fullButton: { flex: 0 },
  form: { gap: 16, paddingHorizontal: 4, paddingBottom: 8 },
  field: { gap: 8 },
});
