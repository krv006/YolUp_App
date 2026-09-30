import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { Camera, FileUp, Trash2 } from "lucide-react-native";
import { applyApiFieldErrors, type AppError } from "@/shared/api";
import { formatDayTime, pickDocument, pickImage, toUploadFile } from "@/shared/lib";
import type { AuthUser } from "@/shared/types";
import type { ProfileFormValues } from "../api/auth.dto";
import {
  Avatar,
  Button,
  IconButton,
  Input,
  radius,
  Separator,
  Sheet,
  Text,
  toast,
  useTheme,
} from "@/shared/ui";
import {
  useDeleteCertificate,
  useUpdateAvatarMutation,
  useUpdateProfileMutation,
  useUploadCertificate,
} from "../model/auth.mutations";

export interface ProfileEditSheetProps {
  user: AuthUser | null;
  open: boolean;
  onClose: () => void;
}

/**
 * Profilni tahrirlash — veb `account-menu.tsx` dagi profil bo'limining mobil
 * varianti.
 *
 * Sertifikatlar faqat O'QITUVCHIDA ma'noli: admin hisobni tasdiqlashda
 * ularga qaraydi (`teacher-approval.ts`), shuning uchun boshqa rollarda
 * bo'lim umuman ko'rsatilmaydi.
 */
export function ProfileEditSheet({ user, open, onClose }: ProfileEditSheetProps) {
  const { t } = useTranslation("mobile");
  const { palette } = useTheme();

  const updateProfile = useUpdateProfileMutation();
  const updateAvatar = useUpdateAvatarMutation();
  const uploadCertificate = useUploadCertificate();
  const deleteCertificate = useDeleteCertificate();

  const [form, setForm] = useState<ProfileFormValues>(() => ({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    phone: user?.phone ?? "",
    username: user?.username ?? "",
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isTeacher = user?.role === "TEACHER";

  function update(field: keyof ProfileFormValues, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function save() {
    setErrors({});
    try {
      await updateProfile.mutateAsync(form);
      toast.success(t("auth.profil_saqlandi"));
      onClose();
    } catch (caught) {
      const error = caught as AppError;
      // Backend maydon xatolarini (masalan "login band") maydon tagida ko'rsatamiz.
      const collected: Record<string, string> = {};
      const applied = applyApiFieldErrors(
        error,
        (field, detail) => {
          collected[field] = detail.message;
        },
        { first_name: "firstName", last_name: "lastName" }
      );
      if (applied) setErrors(collected);
      else toast.error(error.message);
    }
  }

  /*
   * XATO SHU YERDA KO'RSATILADI.
   *
   * `useUpdateAvatarMutation` da `onError` YO'Q — u 🟢 veb bilan bayt-bayt
   * bir xil fayl (`auth.mutations.ts`) va o'zgartirilmaydi. Ilgari bu
   * yerdagi `catch` bo'sh edi va "xatoni mutatsiya ko'rsatadi" deb izoh
   * qo'yilgandi — noto'g'ri izoh. Natijada rasm yuklanmasa EKRANDA HECH
   * NARSA BO'LMASDI: na rasm almashardi, na xato chiqardi, foydalanuvchi
   * esa tugma buzuq deb o'ylardi.
   */
  async function changeAvatar() {
    const picked = await pickImage("library");
    if (!picked) return;
    try {
      await updateAvatar.mutateAsync(toUploadFile(picked));
      toast.success(t("auth.profil_rasmi_yangilandi"));
    } catch (caught) {
      toast.error((caught as Error).message);
    }
  }

  async function addCertificate() {
    const picked = await pickDocument();
    if (!picked) return;
    uploadCertificate.mutate({ file: toUploadFile(picked), title: picked.name });
  }

  return (
    <Sheet open={open} onClose={onClose} title={t("auth.profil")} description={t("auth.malumotlaringizni_yangilang")}>
      <View style={styles.avatarRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("auth.profil_rasmini_ozgartirish")}
          onPress={() => void changeAvatar()}
          style={styles.avatarHit}
        >
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
          ) : (
            <Avatar name={user?.name} size="xl" />
          )}
          <View style={[styles.avatarBadge, { backgroundColor: palette.primary }]}>
            <Camera size={14} color={palette["primary-foreground"]} />
          </View>
        </Pressable>

        {/*
          * Yozuv holatga qarab: rasm yo'q bo'lsa "Rasm yuklash", bor bo'lsa
          * "Rasmni o'zgartirish". Ilgari bu yerda faqat kamera belgisi
          * turardi va rasm qo'yish mumkinligi ko'rinmasdi.
          */}
        <Button
          title={user?.avatarUrl ? t("auth.rasmni_ozgartirish") : t("auth.rasm_yuklash")}
          variant="ghost"
          fullWidth={false}
          icon={<Camera size={15} color={palette["primary-text"]} />}
          onPress={() => void changeAvatar()}
          style={styles.centered}
        />

        {user?.avatarUrl ? (
          <Button
            title={t("auth.rasmni_ochirish")}
            variant="ghost"
            fullWidth={false}
            style={styles.centered}
            loading={updateAvatar.isPending}
            // `null` — backend rasmni o'chiradi (veb bilan bir xil shartnoma).
            // Xatosi ham ko'rsatiladi: sabab yuqorida, `changeAvatar` da.
            onPress={() =>
              void updateAvatar
                .mutateAsync(null)
                .catch((error: Error) => toast.error(error.message))
            }
          />
        ) : null}
      </View>

      <Input
        label={t("auth.ism")}
        value={form.firstName}
        onChangeText={(value) => update("firstName", value)}
        autoCapitalize="words"
        error={errors.firstName}
      />
      <Input
        label={t("auth.familiya")}
        value={form.lastName}
        onChangeText={(value) => update("lastName", value)}
        autoCapitalize="words"
        error={errors.lastName}
      />
      <Input
        label={t("auth.login")}
        value={form.username ?? ""}
        onChangeText={(value) => update("username", value)}
        error={errors.username}
      />
      <Input
        label={t("auth.telefon")}
        value={form.phone ?? ""}
        onChangeText={(value) => update("phone", value)}
        keyboardType="phone-pad"
        error={errors.phone}
      />

      <Button title={t("auth.saqlash")} loading={updateProfile.isPending} onPress={() => void save()} />

      {isTeacher ? (
        <>
          <Separator />
          <Text variant="label">Sertifikatlar</Text>
          <Text variant="caption" tone="muted">
            {t("auth.administrator_hisobingizni_tasdiqlashda_shul")}
          </Text>

          {(user?.certificates ?? []).map((certificate) => (
            <View key={certificate.id} style={styles.certificate}>
              <View style={styles.certificateBody}>
                <Text variant="label" numberOfLines={1}>
                  {certificate.title || "Sertifikat"}
                </Text>
                <Text variant="caption" tone="muted">
                  {formatDayTime(certificate.createdAt)}
                </Text>
              </View>
              <IconButton
                accessibilityLabel={t("auth.sertifikatni_ochirish")}
                disabled={deleteCertificate.isPending}
                onPress={() => deleteCertificate.mutate(certificate.id)}
              >
                <Trash2 size={18} color={palette.destructive} />
              </IconButton>
            </View>
          ))}

          {(user?.certificates ?? []).length === 0 ? (
            <Text variant="caption" tone="muted">
              {t("auth.hali_sertifikat_yuklanmagan")}
            </Text>
          ) : null}

          <Button
            title={t("auth.sertifikat_yuklash")}
            variant="secondary"
            loading={uploadCertificate.isPending}
            icon={<FileUp size={16} color={palette["secondary-foreground"]} />}
            onPress={() => void addCertificate()}
          />
        </>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  avatarRow: { alignItems: "center", gap: 8 },
  /*
   * `fullWidth={false}` tugmaga `alignSelf: "flex-start"` qo'yadi va u
   * o'ramning `alignItems: "center"` ini bekor qiladi — usiz yozuvlar
   * chapga yopishib qolardi.
   */
  centered: { alignSelf: "center" },
  avatarHit: { width: 64, height: 64 },
  avatarImage: { width: 64, height: 64, borderRadius: 32 },
  avatarBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  certificate: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: radius.sm,
  },
  certificateBody: { flex: 1, gap: 2 },
});
