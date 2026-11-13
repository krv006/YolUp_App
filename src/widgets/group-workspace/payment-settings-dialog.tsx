import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { describeCreateError } from "@/modules/auth";
import { useUpdateCoursePayments } from "@/modules/course";
import type { Course } from "@/shared/types";
import {
  DsText,
  dsRadius,
  MobileButton,
  MobileInput,
  MobilePickerField,
  Sheet,
  toast,
  useDs,
} from "@/shared/ui";

const REMINDER_OPTIONS = [7, 5, 3] as const;
const DAYS = Array.from({ length: 28 }, (_, index) => index + 1);

interface Draft {
  fee: string;
  day: string;
  reminders: number[];
}

function draftFrom(course: Course | null | undefined): Draft {
  return {
    fee: course?.monthlyFee ? String(course.monthlyFee) : "",
    day: course?.paymentDay ? String(course.paymentDay) : "",
    reminders: course?.paymentReminderDays ?? [],
  };
}

/**
 * Guruh to'lov sozlamalari — veb `payment-settings-dialog.tsx` (tor ekranda
 * pastki oyna): oylik summa, to'lov kuni (vebdagi `<select>` o'rniga
 * variantlar oynasi) va 7/5/3 kun oldin eslatmalar. Kun tanlanmasa
 * eslatmalar o'chiq.
 */
export function PaymentSettingsDialog({
  course,
  open,
  onOpenChange,
}: {
  course: Course | null | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation("group");
  const ds = useDs();
  const save = useUpdateCoursePayments();
  const [draft, setDraft] = useState<Draft>(() => draftFrom(course));
  const [syncedOpen, setSyncedOpen] = useState(open);
  if (syncedOpen !== open) {
    setSyncedOpen(open);
    if (open) setDraft(draftFrom(course));
  }
  const hasDay = Boolean(draft.day);
  const dayOptions = [
    { value: "", label: t("paymentSettings.noDay") },
    ...DAYS.map((day) => ({ value: String(day), label: t("paymentSettings.dayOption", { day }) })),
  ];

  function toggleReminder(day: number) {
    setDraft((current) => ({
      ...current,
      reminders: current.reminders.includes(day)
        ? current.reminders.filter((item) => item !== day)
        : [...current.reminders, day],
    }));
  }

  function submit() {
    if (!course) return;
    const fee = draft.fee.trim() ? Number(draft.fee) : null;
    save.mutate(
      {
        id: course.id,
        settings: {
          monthlyFee: fee && fee > 0 ? fee : null,
          paymentDay: hasDay ? Number(draft.day) : null,
          reminderDays: hasDay ? draft.reminders : [],
        },
      },
      {
        onSuccess: () => {
          toast.success(t("paymentSettings.saved"));
          onOpenChange(false);
        },
        onError: (error: Error) => toast.error(describeCreateError(error)),
      }
    );
  }

  return (
    <Sheet
      variant="app"
      open={open}
      onClose={() => onOpenChange(false)}
      title={t("paymentSettings.title")}
      description={t("paymentSettings.description")}
      footer={
        <>
          <MobileButton
            variant="secondary"
            label={t("paymentSettings.cancel")}
            onPress={() => onOpenChange(false)}
          />
          <MobileButton
            label={t("paymentSettings.save")}
            disabled={save.isPending || !course}
            onPress={submit}
          />
        </>
      }
    >
      <View style={styles.form}>
        <View style={styles.field}>
          <DsText v="body-xs" c="ink-secondary">
            {t("paymentSettings.fee")}
          </DsText>
          <MobileInput
            inputMode="numeric"
            keyboardType="number-pad"
            accessibilityLabel={t("paymentSettings.fee")}
            value={draft.fee}
            placeholder={t("paymentSettings.feePlaceholder")}
            onChangeText={(value) =>
              setDraft({ ...draft, fee: value.replace(/\D/g, "").slice(0, 10) })
            }
          />
        </View>

        <View style={styles.field}>
          <DsText v="body-xs" c="ink-secondary">
            {t("paymentSettings.day")}
          </DsText>
          {/* Ichki oyna shu oynaning ichida ochiladi (iOS yonma-yon Modal'ni ko'rsatmaydi). */}
          <MobilePickerField
            type="select"
            value={draft.day}
            display={
              draft.day
                ? t("paymentSettings.dayOption", { day: Number(draft.day) })
                : t("paymentSettings.noDay")
            }
            options={dayOptions}
            ariaLabel={t("paymentSettings.day")}
            onChange={(value) => setDraft({ ...draft, day: value })}
          />
          <DsText v="caption" c="ink-tertiary">
            {t("paymentSettings.dayHint")}
          </DsText>
        </View>

        {/* `fieldset disabled={!hasDay}` */}
        <View style={styles.field}>
          <DsText v="body-xs" c="ink-secondary">
            {t("paymentSettings.reminders")}
          </DsText>
          {/* `grid grid-cols-3 gap-2`; tugma `h-11 rounded-full text-body-sm font-medium` */}
          <View style={styles.reminders}>
            {REMINDER_OPTIONS.map((day) => {
              const active = hasDay && draft.reminders.includes(day);
              return (
                <Pressable
                  key={day}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active, disabled: !hasDay }}
                  disabled={!hasDay}
                  onPress={() => toggleReminder(day)}
                  style={({ pressed }) => [
                    styles.reminder,
                    {
                      backgroundColor: active ? ds.c.brand : pressed ? ds.c.muted : ds.c.subtle,
                    },
                    !hasDay && styles.disabled,
                  ]}
                >
                  <DsText v="body-sm" w="500" c={active ? "on-action" : "ink"} numberOfLines={1}>
                    {t("paymentSettings.reminderOption", { count: day })}
                  </DsText>
                </Pressable>
              );
            })}
          </View>
          <DsText v="caption" c="ink-tertiary">
            {hasDay ? t("paymentSettings.remindersHint") : t("paymentSettings.remindersNeedDay")}
          </DsText>
        </View>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  /* `flex flex-col gap-4` */
  form: { gap: 16 },
  field: { gap: 8 },
  reminders: { flexDirection: "row", gap: 8 },
  reminder: {
    flex: 1,
    minWidth: 0,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: dsRadius.full,
  },
  disabled: { opacity: 0.5 },
});
