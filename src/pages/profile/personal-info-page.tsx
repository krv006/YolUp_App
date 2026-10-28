import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useAuth, useIsStudent, useUpdateProfileMutation } from "@/modules/auth";
import { useCourses, useSubjects } from "@/modules/course";
import { bodyFont, DsText, dsRadius, dsType, Icon, MobileButton, MobileFieldLabel, MobileInput, MobilePickerField, toast, useDs } from "@/shared/ui";
import { ProfileSubPage } from "./profile-shell";

const CITIES = ["Toshkent", "Samarqand", "Buxoro", "Andijon", "Farg'ona", "Namangan", "Qarshi", "Nukus", "Urganch", "Jizzax", "Guliston", "Navoiy", "Termiz"];

type TextField = "firstName" | "lastName" | "phone" | "email";

/**
 * Shaxsiy ma'lumotlar — veb `personal-info-page.tsx` (tor ekran): ism va
 * familiya, telefon (izoh bilan), email, fan (o'quvchida o'qiyotgan fanlari)
 * va shahar; pastda "Saqlash", xato bo'lsa uning ustida izoh.
 */
export function PersonalInfoPage() {
  const { t } = useTranslation("account");
  const ds = useDs();
  const { user } = useAuth();
  const update = useUpdateProfileMutation();
  const subjects = useSubjects();
  const student = useIsStudent();
  const courses = useCourses();
  const studying = [...new Set((courses.data ?? []).map((course) => course.subjectLabel).filter(Boolean))].join(", ");
  const [form, setForm] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    phone: user?.phone ?? "",
    email: user?.email ?? "",
    subject: user?.subject ?? "",
    city: user?.city ?? "",
  });

  const subjectOptions = [{ value: "", label: t("page.subjectNone") }, ...(subjects.data ?? []).map((item) => ({ value: item.value, label: item.label }))];
  const subjectLabel = subjectOptions.find((item) => item.value === form.subject)?.label ?? "";

  function save() {
    if (!form.firstName.trim() || !form.lastName.trim()) return;
    update.mutate(
      { ...form, middleName: user?.middleName ?? "", birthDate: user?.birthDate ?? "", bio: user?.bio ?? "" },
      { onSuccess: () => toast.success(t("page.mobile.saved")) }
    );
  }

  const field = (key: TextField, keyboardType?: "phone-pad" | "email-address") => (
    <MobileInput
      surface
      value={form[key]}
      keyboardType={keyboardType}
      autoCapitalize={keyboardType ? "none" : "words"}
      onChangeText={(value) => setForm((current) => ({ ...current, [key]: value }))}
    />
  );

  return (
    <ProfileSubPage
      title={t("page.personalTitle")}
      footerNote={
        update.isError ? (
          <View style={[styles.error, { backgroundColor: ds.c["danger-bg"] }]}>
            <Icon name="warning-fill" size={20} color={ds.c.danger} />
            <DsText v="body-sm" w="500" c="error-text" style={styles.grow}>
              {t("page.mobile.saveFailed")}
            </DsText>
          </View>
        ) : null
      }
      footer={<MobileButton label={t("page.save")} disabled={update.isPending} onPress={save} />}
    >
      <View style={styles.form}>
        <View style={styles.pair}>
          <View style={styles.grow}>
            <MobileFieldLabel gap={7} label={t("page.firstName")}>
              {field("firstName")}
            </MobileFieldLabel>
          </View>
          <View style={styles.grow}>
            <MobileFieldLabel gap={7} label={t("page.lastName")}>
              {field("lastName")}
            </MobileFieldLabel>
          </View>
        </View>
        <View style={styles.phone}>
          <MobileFieldLabel gap={7} label={t("page.phone")}>
            {field("phone", "phone-pad")}
          </MobileFieldLabel>
          <DsText v="caption" w="400" c="ink-secondary">
            {t("page.phoneNote")}
          </DsText>
        </View>
        <MobileFieldLabel gap={7} label={t("page.email")}>
          {field("email", "email-address")}
        </MobileFieldLabel>
        <View style={styles.pair}>
          <View style={styles.grow}>
            <MobileFieldLabel gap={7} label={student ? t("page.studying") : t("page.subject")}>
              {student ? (
                <View style={[styles.readonly, { backgroundColor: ds.c.surface }]}>
                  <DsText numberOfLines={1} style={styles.readonlyText}>
                    {studying || "—"}
                  </DsText>
                </View>
              ) : (
                <MobilePickerField
                  type="select"
                  surface
                  value={form.subject}
                  display={subjectLabel}
                  ariaLabel={t("page.subject")}
                  options={subjectOptions}
                  onChange={(value) => setForm((current) => ({ ...current, subject: value }))}
                />
              )}
            </MobileFieldLabel>
          </View>
          <View style={styles.grow}>
            <MobileFieldLabel gap={7} label={t("page.city")}>
              <MobilePickerField
                type="select"
                surface
                value={form.city}
                display={form.city || t("page.subjectNone")}
                ariaLabel={t("page.city")}
                options={[...(form.city ? [] : [{ value: "", label: t("page.subjectNone") }]), ...CITIES.map((city) => ({ value: city, label: city }))]}
                onChange={(value) => setForm((current) => ({ ...current, city: value }))}
              />
            </MobileFieldLabel>
          </View>
        </View>
      </View>
    </ProfileSubPage>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  /* `-mt-[6px] gap-[15px]` */
  form: { marginTop: -6, gap: 15 },
  pair: { flexDirection: "row", gap: 12 },
  phone: { gap: 8 },
  readonly: { height: 52, justifyContent: "center", paddingHorizontal: 16, borderRadius: dsRadius.lg },
  readonlyText: { fontSize: dsType.body.fontSize, fontFamily: bodyFont("400") },
  error: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderRadius: dsRadius.xl },
});
