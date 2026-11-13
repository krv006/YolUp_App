import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import type { AudienceInput } from "@/modules/conversation";
import { DsText, dsRadius, MobileButton, MobileFieldLabel, MobileInput, Sheet, useDs } from "@/shared/ui";
import { AudiencePicker } from "@/widgets/audience-picker";

export interface CreateAudienceValues extends AudienceInput {
  title: string;
  description: string;
}

export interface CreateAudienceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: "channel" | "club";
  pending: boolean;
  onSubmit: (values: CreateAudienceValues, reset: () => void) => void;
}

const EMPTY: CreateAudienceValues = { title: "", description: "", courseIds: [], studentIds: [] };

/**
 * Kanal yoki speaking club yaratish — veb `create-audience-dialog.tsx`
 * (pastki oyna): nom, tavsif, izoh va auditoriya (guruhlar yoki o'quvchilar).
 */
export function CreateAudienceDialog({ open, onOpenChange, kind, pending, onSubmit }: CreateAudienceDialogProps) {
  const { t } = useTranslation("chat");
  const ds = useDs();
  const [values, setValues] = useState<CreateAudienceValues>(EMPTY);
  const reset = () => setValues(EMPTY);
  const ready = Boolean(values.title.trim() && (values.courseIds.length || values.studentIds.length));

  function close() {
    reset();
    onOpenChange(false);
  }

  return (
    <Sheet
      variant="app"
      open={open}
      onClose={close}
      title={t(`create.${kind}.title`)}
      description={t(`create.${kind}.description`)}
      footer={
        <>
          <MobileButton variant="secondary" label={t("create.cancel")} onPress={close} />
          <MobileButton label={t("create.submit")} disabled={!ready || pending} onPress={() => onSubmit(values, reset)} />
        </>
      }
    >
      <View style={styles.body}>
        <MobileFieldLabel label={t(`create.${kind}.nameLabel`)}>
          <MobileInput
            value={values.title}
            maxLength={120}
            placeholder={t(`create.${kind}.namePlaceholder`)}
            onChangeText={(title) => setValues({ ...values, title })}
          />
        </MobileFieldLabel>
        <MobileFieldLabel label={t("create.descriptionLabel")}>
          <MobileInput
            multiline
            multilineHeight={76}
            maxLength={1000}
            value={values.description}
            placeholder={t("create.descriptionPlaceholder")}
            onChangeText={(description) => setValues({ ...values, description })}
          />
        </MobileFieldLabel>
        <View style={[styles.hint, { backgroundColor: ds.c["brand-subtle"] }]}>
          <DsText v="body-sm" c="brand">
            {t(`create.${kind}.audienceHint`)}
          </DsText>
        </View>
        <AudiencePicker
          value={{ courseIds: values.courseIds, studentIds: values.studentIds }}
          onChange={(audience) => setValues({ ...values, ...audience })}
        />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: 16, paddingBottom: 8 },
  hint: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: dsRadius.md },
});
