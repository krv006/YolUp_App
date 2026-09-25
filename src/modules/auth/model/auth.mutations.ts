import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import type { AuthUser } from "@/shared/types";
import { authApi } from "../api/auth.api";
import type { ProfileFormValues, RegisterFormValues } from "../api/auth.dto";
import { mapCertificateDto, mapUserDto } from "../lib/auth.mappers";
import { useAuthStore } from "./auth.store";

export function useRegisterMutation() {
  return useMutation({
    mutationFn: (values: RegisterFormValues): Promise<AuthUser> =>
      useAuthStore.getState().register({
        username: values.username.trim(),
        password: values.password,
        first_name: values.firstName.trim(),
        last_name: values.lastName.trim(),
        role: values.role,
        phone: values.phone?.trim() || "",
      }),
  });
}

export function useSwitchAccountMutation() {
  return useMutation({
    mutationFn: (userId: string): Promise<AuthUser> => useAuthStore.getState().switchAccount(userId),
  });
}

export function useSwitchRoleMutation() {
  return useMutation({
    mutationFn: (role: string): Promise<AuthUser> => useAuthStore.getState().switchRole(role),
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
          ...(username ? { username } : {}),
        })
      );
    },
    onSuccess: (user) => useAuthStore.getState().setUser(user),
  });
}

export function useUpdateLessonReminderMutation() {
  return useMutation({
    mutationFn: async (minutes: number): Promise<AuthUser> =>
      mapUserDto(await authApi.updateLessonReminderMinutes(minutes)),
    onSuccess: (user) => useAuthStore.getState().setUser(user),
  });
}

export function useUpdateAvatarMutation() {
  return useMutation({
    mutationFn: async (avatar: File | null): Promise<AuthUser> =>
      mapUserDto(await authApi.updateAvatar(avatar)),
    onSuccess: (user) => useAuthStore.getState().setUser(user),
  });
}

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
