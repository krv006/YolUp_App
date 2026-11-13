import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { describeCreateError } from "@/modules/auth";
import { useMarkPaid, type Payment } from "@/modules/progress";
import { DsText, dsRadius, MobileButton, MobileInput, Sheet, toast, useDs } from "@/shared/ui";
import { formatProgressMoney, formatProgressMonth } from "./progress-format";

export interface PaymentTarget {
  studentId: string;
  name: string;
  month: string;
  payment: Payment | null;
}

const NOTES = ["cash", "card", "transfer"] as const;

/**
 * Oy to'lovini belgilash yoki tahrirlash — veb `payment-dialog.tsx`
 * (tor ekranda pastki oyna): summa (bo'shliq bilan formatlanadi, o'ngda
 * valyuta), izoh va tayyor izoh chip'lari (naqd / karta / o'tkazma).
 */
export function PaymentDialog({
  courseId,
  target,
  monthlyFee,
  onClose,
}: {
  courseId: string | null;
  target: PaymentTarget | null;
  monthlyFee: number | null;
  onClose: () => void;
}) {
  const { t, i18n } = useTranslation("group");
  const ds = useDs();
  const markPaid = useMarkPaid();
  // Yopilish animatsiyasi paytida oxirgi o'quvchi ko'rinib tursin (vebda oyna darhol yo'qoladi).
  const [last, setLast] = useState(target);
  if (target && target !== last) setLast(target);
  const shown = target ?? last;
  const key = shown ? `${shown.studentId}:${shown.month}` : "";
  const initial = {
    key,
    amount: String(shown?.payment?.amount ?? monthlyFee ?? ""),
    note: shown?.payment?.note ?? "",
  };
  const [draft, setDraft] = useState(initial);
  const form = draft.key === key ? draft : initial;
  const editing = shown?.payment?.status === "paid";

  function update(patch: Partial<Pick<typeof form, "amount" | "note">>) {
    setDraft({ ...form, ...patch });
  }

  function submit() {
    if (!courseId || !target) return;
    markPaid.mutate(
      {
        courseId,
        studentId: target.studentId,
        month: target.month,
        amount: form.amount ? Number(form.amount) : undefined,
        note: form.note.trim(),
      },
      {
        onSuccess: () => {
          toast.success(
            t(editing ? "progress.payment.updated" : "progress.markedPaid", { name: target.name })
          );
          onClose();
        },
        onError: (error: Error) => toast.error(describeCreateError(error)),
      }
    );
  }

  return (
    <Sheet
      variant="app"
      open={Boolean(target)}
      onClose={onClose}
      title={t(editing ? "progress.payment.editTitle" : "progress.payment.title")}
      description={
        shown ? `${shown.name} · ${formatProgressMonth(shown.month, i18n.language)}` : undefined
      }
      footer={
        <>
          <MobileButton variant="secondary" label={t("progress.cancel")} onPress={onClose} />
          <MobileButton
            label={t("progress.payment.save")}
            disabled={markPaid.isPending}
            onPress={submit}
          />
        </>
      }
    >
      <View style={styles.form}>
        <View style={styles.field}>
          <DsText v="body-xs" c="ink-secondary">
            {t("progress.payment.amount")}
          </DsText>
          {/* `relative`: o'ngda `absolute right-4 text-body-sm text-ink-tertiary` valyuta */}
          <View>
            <MobileInput
              autoFocus
              inputMode="numeric"
              keyboardType="number-pad"
              accessibilityLabel={t("progress.payment.amount")}
              value={form.amount ? formatProgressMoney(Number(form.amount), i18n.language) : ""}
              placeholder={monthlyFee ? formatProgressMoney(monthlyFee, i18n.language) : "0"}
              onChangeText={(value) => update({ amount: value.replace(/\D/g, "").slice(0, 10) })}
              onSubmitEditing={submit}
              style={styles.amount}
            />
            <View pointerEvents="none" style={styles.currency}>
              <DsText v="body-sm" c="ink-tertiary">
                {t("progress.payment.currency")}
              </DsText>
            </View>
          </View>
          {monthlyFee && form.amount && Number(form.amount) !== monthlyFee ? (
            <DsText v="caption" c="ink-secondary">
              {t("progress.fee", { amount: formatProgressMoney(monthlyFee, i18n.language) })}
            </DsText>
          ) : null}
        </View>

        <View style={styles.field}>
          <DsText v="body-xs" c="ink-secondary">
            {t("progress.payment.note")}
          </DsText>
          <MobileInput
            value={form.note}
            maxLength={120}
            accessibilityLabel={t("progress.payment.note")}
            placeholder={t("progress.payment.notePlaceholder")}
            onChangeText={(value) => update({ note: value })}
          />
          {/* `flex flex-wrap gap-2`; chip `h-8 rounded-full px-3.5 text-body-xs font-medium` */}
          <View style={styles.notes}>
            {NOTES.map((item) => {
              const label = t(`progress.payment.notes.${item}`);
              const active = form.note === label;
              return (
                <Pressable
                  key={item}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => update({ note: active ? "" : label })}
                  style={({ pressed }) => [
                    styles.note,
                    {
                      backgroundColor: active ? ds.c.brand : pressed ? ds.c.muted : ds.c.subtle,
                    },
                  ]}
                >
                  <DsText v="body-xs" w="500" c={active ? "on-action" : "ink"}>
                    {label}
                  </DsText>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  /* `flex flex-col gap-4 pb-1` */
  form: { gap: 16, paddingBottom: 4 },
  field: { gap: 8 },
  /* `pr-16` (`font-numeric` — `MobileInput` uslubi faqat `ViewStyle` qabul qiladi) */
  amount: { paddingRight: 64 },
  currency: { position: "absolute", top: 0, right: 16, bottom: 0, justifyContent: "center" },
  notes: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  note: {
    height: 32,
    justifyContent: "center",
    paddingHorizontal: 14,
    borderRadius: dsRadius.full,
  },
});
