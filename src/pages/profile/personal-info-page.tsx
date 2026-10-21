import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Image, Pressable, StyleSheet, View } from "react-native";
import { useAuth, useUpdateAvatarMutation, useUpdateProfileMutation } from "@/modules/auth";
import { useSubjects } from "@/modules/course";
import { pickImage, toUploadFile } from "@/shared/lib";
import { DateField, Icon, Input, radius, SelectField, Text, toast, useTheme } from "@/shared/ui";
import { initialsOf, ProfileSubPage } from "./profile-shell";

/** Shaxsiy ma'lumotlar — veb `pages/profile/personal-info-page.tsx`. */
export function PersonalInfoPage() {
  const { t } = useTranslation("account");
  const { palette } = useTheme();
  const { user } = useAuth();
  const update = useUpdateProfileMutation();
  const updateAvatar = useUpdateAvatarMutation();
  const subjects = useSubjects();
  const [today] = useState(() => new Date());
  const [form, setForm] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    phone: user?.phone ?? "",
    middleName: user?.middleName ?? "",
    birthDate: user?.birthDate ?? "",
    email: user?.email ?? "",
    subject: user?.subject ?? "",
    city: user?.city ?? "",
    bio: user?.bio ?? "",
  });
  const [emailError, setEmailError] = useState(false);

  const subjectOptions = [{ value: "", label: t("page.subjectNone") }, ...(subjects.data ?? [])];

  function patch(next: Partial<typeof form>) {
    setForm((current) => ({ ...current, ...next }));
  }

  function submit() {
    // Vebda `required` — bo'sh ism/familiya bilan forma yuborilmaydi.
    if (!form.firstName.trim() || !form.lastName.trim()) return;
    update.mutate(form, {
      onSuccess: () => toast.success(t("page.saved")),
      onError: (error: Error) => toast.error(error.message),
    });
  }

  async function changeAvatar() {
    const picked = await pickImage("library");
    if (picked) updateAvatar.mutate(toUploadFile(picked), { onError: (error: Error) => toast.error(error.message) });
  }

  return (
    <ProfileSubPage
      title={t("page.personalTitle")}
      footer={
        <Pressable
          accessibilityRole="button"
          disabled={update.isPending}
          onPress={submit}
          style={({ pressed }) => [
            styles.save,
            { backgroundColor: pressed ? palette["primary-hover"] : palette.primary, opacity: update.isPending ? 0.6 : 1 },
          ]}
        >
          {update.isPending ? <ActivityIndicator size="small" color={palette["primary-foreground"]} /> : null}
          <Text variant="label" style={{ color: palette["primary-foreground"] }}>
            {update.isPending ? t("page.saving") : t("page.save")}
          </Text>
        </Pressable>
      }
    >
      <View style={[styles.avatarCard, { borderColor: palette.border, backgroundColor: palette.surface }]}>
        <View>
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: palette["primary-soft"] }]}>
              <Text variant="subheading" style={[styles.initials, { color: palette.primary }]}>
                {initialsOf(user?.name)}
              </Text>
            </View>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("page.avatarUpload")}
            onPress={() => void changeAvatar()}
            style={[styles.camera, { borderColor: palette.surface, backgroundColor: palette.primary }]}
          >
            <Icon name="camera" size={14} color={palette["primary-foreground"]} />
          </Pressable>
        </View>
        <View style={styles.grow}>
          <Text variant="label">{t("page.avatarTitle")}</Text>
          <Text variant="caption" style={[styles.caption, { color: palette["subtle-foreground"] }]}>
            {t("page.avatarHint")}
          </Text>
          <View style={styles.avatarActions}>
            <Pressable accessibilityRole="button" onPress={() => void changeAvatar()}>
              <Text variant="label" style={{ color: palette.primary }}>
                {t("page.avatarUpload")}
              </Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => toast.info(t("page.notAvailable"))}>
              <Text variant="label" style={{ color: palette["destructive-strong"] }}>
                {t("page.avatarRemove")}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.form}>
        <View style={styles.pair}>
          <Input
            label={t("page.firstName")}
            value={form.firstName}
            onChangeText={(value) => patch({ firstName: value })}
            containerStyle={styles.grow}
          />
          <Input
            label={t("page.lastName")}
            value={form.lastName}
            onChangeText={(value) => patch({ lastName: value })}
            containerStyle={styles.grow}
          />
        </View>

        <Input
          label={t("page.fatherName")}
          value={form.middleName}
          onChangeText={(value) => patch({ middleName: value })}
          placeholder={t("page.fatherName")}
        />

        <DateField
          label={t("page.birthDate")}
          value={form.birthDate}
          onChange={(value) => patch({ birthDate: value })}
          maximumDate={today}
        />

        <View style={styles.withNote}>
          <Input
            label={t("page.phone")}
            value={form.phone}
            onChangeText={(value) => patch({ phone: value })}
            keyboardType="phone-pad"
          />
          <Text variant="caption" style={[styles.caption, styles.note, { color: palette["subtle-foreground"] }]}>
            {t("page.phoneNote")}
          </Text>
        </View>

        <Input
          label={t("page.email")}
          value={form.email}
          onChangeText={(value) => patch({ email: value })}
          onBlur={() => setEmailError(Boolean(form.email) && !form.email.includes("@"))}
          error={emailError ? " " : undefined}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <SelectField
          label={t("page.subject")}
          value={form.subject}
          onChange={(value) => patch({ subject: value })}
          options={subjectOptions}
          searchable
        />

        <Input label={t("page.city")} value={form.city} onChangeText={(value) => patch({ city: value })} placeholder="—" />

        <Input
          label={t("page.about")}
          value={form.bio}
          onChangeText={(value) => patch({ bio: value })}
          placeholder="—"
          multiline
          numberOfLines={3}
          inputStyle={styles.bio}
        />

        {update.isError ? (
          <Text variant="label" style={[styles.error, { backgroundColor: palette["destructive-soft"], color: palette["destructive-strong"] }]}>
            {update.error.message}
          </Text>
        ) : null}
      </View>
    </ProfileSubPage>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  caption: { fontWeight: "500" },
  /* `flex items-center gap-4 rounded-2xl border p-4` */
  avatarCard: { flexDirection: "row", alignItems: "center", gap: 16, padding: 16, borderWidth: 1, borderRadius: radius["2xl"] },
  avatar: { width: 64, height: 64, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  initials: { fontSize: 16, lineHeight: 24, fontWeight: "600" },
  camera: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderRadius: radius.full,
  },
  avatarActions: { marginTop: 4, flexDirection: "row", alignItems: "center", gap: 16 },
  form: { gap: 16 },
  pair: { flexDirection: "row", gap: 12 },
  withNote: { gap: 6 },
  note: { paddingHorizontal: 4 },
  bio: { minHeight: 72 },
  error: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: radius.xl, fontWeight: "400", overflow: "hidden" },
  /* `h-13 rounded-full bg-action` */
  save: { height: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: radius.full },
});
