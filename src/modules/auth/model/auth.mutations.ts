import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import type { AuthUser } from "@/shared/types";
import { authApi } from "../api/auth.api";
import type { ProfileFormValues, RegisterFormValues } from "../api/auth.dto";
import { mapCertificateDto, mapUserDto } from "../lib/auth.mappers";
import { useAuthStore } from "./auth.store";

export function useRegisterMutation() {
  return useMutation({
    mutationFn: (values: RegisterFormValues) =>
      authApi.register({
        username: values.username.trim(),
        password: values.password,
        first_name: values.firstName.trim(),
        last_name: values.lastName.trim(),
        role: values.role,
        phone: values.phone?.trim() || "",
      }),
  });
}

export function useUpdateProfileMutation() {
  return useMutation({
    mutationFn: async (values: ProfileFormValues): Promise<AuthUser> => {
      const username = values.username?.trim();
      return mapUserDto(
        await authApi.updateCurrentUser({
          first_name: values.firstName.trim(),
          last_name: values.lastName.trim(),
          phone: values.phone?.trim() || "",
          // Faqat haqiqatan o'zgargan bo'lsa yuboriladi — aks holda har
          // saqlashda backend uni band deb hisoblab qolishi mumkin.
          ...(username ? { username } : {}),
        })
      );
    },
    // Server javobi global auth holatiga ko'chiriladi.
    onSuccess: (user) => useAuthStore.getState().setUser(user),
  });
}

/** Profil rasmi — `null` yuborilsa rasm o'chiriladi. */
export function useUpdateAvatarMutation() {
  return useMutation({
    mutationFn: async (avatar: File | null): Promise<AuthUser> =>
      mapUserDto(await authApi.updateAvatar(avatar)),
    onSuccess: (user) => useAuthStore.getState().setUser(user),
  });
}

/**
 * O'qituvchi o'ziga sertifikat qo'shadi. Javob — faqat bitta sertifikat
 * (butun user emas), shuning uchun store'dagi ro'yxatga qo'lda qo'shiladi.
 */
export function useUploadCertificate() {
  return useMutation({
    mutationFn: async ({ file, title }: { file: File; title?: string }) =>
      mapCertificateDto(await authApi.uploadCertificate(file, title)),
    onSuccess: (certificate) => {
      const { user, setUser } = useAuthStore.getState();
      if (user) setUser({ ...user, certificates: [...user.certificates, certificate] });
      toast.success("Sertifikat yuklandi");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteCertificate() {
  return useMutation({
    mutationFn: (id: string) => authApi.deleteCertificate(id),
    onSuccess: (id) => {
      const { user, setUser } = useAuthStore.getState();
      if (user) setUser({ ...user, certificates: user.certificates.filter((item) => item.id !== id) });
      toast.success("Sertifikat o‘chirildi");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
