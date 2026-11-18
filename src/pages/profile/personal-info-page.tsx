import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { EmailVerifyDialog, useAuth, useIsStudent, useUpdateProfileMutation } from "@/modules/auth";
import { useCourses, useSubjects } from "@/modules/course";
import { AppError } from "@/shared/api";
import { bodyFont, DsText, dsRadius, dsType, Icon, MobileButton, MobileFieldLabel, MobileInput, MobilePickerField, toast, useDs } from "@/shared/ui";
import { ProfileSubPage } from "./profile-shell";

const CITIES = ["Toshkent", "Samarqand", "Buxoro", "Andijon", "Farg'ona", "Namangan", "Qarshi", "Nukus", "Urganch", "Jizzax", "Guliston", "Navoiy", "Termiz"];

type TextField = "firstName" | "lastName" | "username" | "phone";

/**
 * Email holati — veb #199 `EmailRow`: manzil, "Tasdiqlangan"/"Tasdiqlanmagan"
 * belgisi va "Qo'shish"/"Tasdiqlash"/"O'zgartirish". Email endi PATCH bilan
 * yuborilmaydi (aks holda `email_verified` qayta `false` bo'lardi) —
 * faqat tasdiqlash oynasi orqali.
 */
function EmailRow({ onOpen }: { onOpen: () => void }) {
  const { t } = useTranslation("account");
  const ds = useDs();
  const { user } = useAuth();
  const email = user?.email ?? "";
  const verified = Boolean(email && user?.emailVerified);
  return (
    <View style={[styles.emailRow, { backgroundColor: ds.c.surface }]}>
      <DsText numberOfLines={1} c={email ? "ink" : "ink-tertiary"} style={styles.grow}>
        {email || t("page.emailNotSet")}
      </DsText>
      {email ? (
        <View style={[styles.emailBadge, { backgroundColor: verified ? ds.c["success-bg"] : ds.c["warning-bg"] }]}>
          <Icon name={verified ? "check-circle" : "warning"} size={14} color={verified ? ds.c["success-fg"] : ds.c["warning-fg"]} />
          <DsText v="caption-strong" c={verified ? "success-fg" : "warning-fg"}>
            {verified ? t("page.emailVerified") : t("page.emailUnverified")}
          </DsText>
        </View>
      ) : null}
      <Pressable accessibilityRole="button" onPress={onOpen} style={({ pressed }) => [styles.emailAction, pressed && { backgroundColor: ds.c["brand-subtle"] }]}>
        <DsText v="body-xs" w="600" c="brand">
          {!email ? t("page.emailAdd") : verified ? t("page.emailChange") : t("page.emailVerify")}
        </DsText>
      </Pressable>
    </View>
  );
}

/**
 * Shaxsiy ma'lumotlar — veb `personal-info-page.tsx` (tor ekran): ism va
 * familiya, login (izoh yoki server xatosi bilan), telefon, email, fan
 * (o'quvchida o'qiyotgan fanlari) va shahar; pastda "Saqlash", boshqa xato
 * bo'lsa uning ustida izoh.
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
    username: user?.username ?? "",
    phone: user?.phone ?? "",
    subject: user?.subject ?? "",
    city: user?.city ?? "",
  });

  const subjectOptions = [{ value: "", label: t("page.subjectNone") }, ...(subjects.data ?? []).map((item) => ({ value: item.value, label: item.label }))];
  const subjectLabel = subjectOptions.find((item) => item.value === form.subject)?.label ?? "";
  const usernameField = update.error instanceof AppError ? update.error.fields?.username : undefined;
  const usernameError = Array.isArray(usernameField) ? usernameField[0] : usernameField;

  function save() {
    if (!form.firstName.trim() || !form.lastName.trim()) return;
    update.mutate(
      { ...form, middleName: user?.middleName ?? "", birthDate: user?.birthDate ?? "", bio: user?.bio ?? "" },
      { onSuccess: () => toast.success(t("page.mobile.saved")) }
    );
  }

  const [emailOpen, setEmailOpen] = useState(false);

  const field = (key: TextField, keyboardType?: "phone-pad") => (
    <MobileInput
      surface
      value={form[key]}
      keyboardType={keyboardType}
      autoCapitalize={keyboardType || key === "username" ? "none" : "words"}
      autoCorrect={key === "username" ? false : undefined}
      invalid={key === "username" && Boolean(usernameError)}
      onChangeText={(value) => setForm((current) => ({ ...current, [key]: value }))}
    />
  );

  return (
    <ProfileSubPage
      title={t("page.personalTitle")}
      footerNote={
        update.isError && !usernameError ? (
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
        {/* `flex-col gap-1.5` */}
        <View style={styles.username}>
          <MobileFieldLabel gap={7} label={t("page.loginLabel")}>
            {field("username")}
          </MobileFieldLabel>
          <DsText v="caption" w="400" c={usernameError ? "error-text" : "ink-secondary"}>
            {usernameError ?? t("page.usernameHint")}
          </DsText>
        </View>
        <MobileFieldLabel gap={7} label={t("page.phone")}>
          {field("phone", "phone-pad")}
        </MobileFieldLabel>
        <MobileFieldLabel gap={7} label={t("page.email")}>
          <EmailRow onOpen={() => setEmailOpen(true)} />
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
      <EmailVerifyDialog open={emailOpen} onOpenChange={setEmailOpen} initialEmail={user?.email ?? ""} />
    </ProfileSubPage>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  /* `-mt-[6px] gap-[15px]` */
  form: { marginTop: -6, gap: 15 },
  pair: { flexDirection: "row", gap: 12 },
  username: { gap: 6 },
  readonly: { height: 52, justifyContent: "center", paddingHorizontal: 16, borderRadius: dsRadius.lg },
  /* Maydon o'lchamida (`MOBILE_INPUT_SURFACE`): manzil, belgi va tugma bir qatorda. */
  emailRow: { height: 52, flexDirection: "row", alignItems: "center", gap: 8, paddingLeft: 16, paddingRight: 6, borderRadius: dsRadius.lg },
  emailBadge: { height: 24, flexShrink: 0, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, borderRadius: dsRadius.full },
  emailAction: { flexShrink: 0, paddingHorizontal: 10, paddingVertical: 4, borderRadius: dsRadius.full },
  readonlyText: { fontSize: dsType.body.fontSize, fontFamily: bodyFont("400") },
  error: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderRadius: dsRadius.xl },
});
