import { apiClient, type RequestOptions } from "@/shared/api";
import { authEndpoints } from "./auth.endpoints";
import { mapLoginRecords } from "../lib/auth.mappers";
import type {
  AuthUserDto,
  CertificateDto,
  ConsentRequestDto,
  CreateChildRequestDto,
  LinkAction,
  LoginRequestDto,
  RefreshRequestDto,
  RegisterRequestDto,
  TokenPairDto,
} from "./auth.dto";

export const authApi = {
  // login/refresh — Authorization sarlavhasisiz va 401 da qayta urinishsiz yuboriladi.
  /**
   * Sessiyani server tomonda yopadi — refresh token bekor qilinadi.
   *
   * `skipRefresh`: access token allaqachon eskirgan bo'lsa, 401 ni ushlab
   * yangilashga urinish ma'nosiz — biz baribir chiqmoqchimiz.
   */
  logout(refreshToken: string | null) {
    return apiClient.post(
      authEndpoints.logout,
      refreshToken ? { refresh: refreshToken } : {},
      { skipRefresh: true }
    );
  },
  login(dto: LoginRequestDto) {
    return apiClient.post<TokenPairDto>(authEndpoints.login, dto, {
      skipAuth: true,
      skipRefresh: true,
    });
  },
  refresh(dto: RefreshRequestDto) {
    return apiClient.post<TokenPairDto>(authEndpoints.refresh, dto, {
      skipAuth: true,
      skipRefresh: true,
    });
  },
  getCurrentUser() {
    return apiClient.get<AuthUserDto>(authEndpoints.me);
  },
  updateCurrentUser(dto: Partial<RegisterRequestDto>) {
    return apiClient.patch<AuthUserDto>(authEndpoints.me, dto);
  },
  /**
   * Profil rasmi — multipart, shuning uchun alohida chaqiruv.
   * Bo'sh `File` yuborilmaydi: rasmni o'chirish uchun bo'sh satr yuboriladi.
   */
  updateAvatar(avatar: File | null) {
    const body = new FormData();
    body.set("avatar", avatar ?? "");
    return apiClient.patch<AuthUserDto>(authEndpoints.me, body);
  },
  register(dto: RegisterRequestDto) {
    return apiClient.post(authEndpoints.register, dto, { skipAuth: true, skipRefresh: true });
  },
  createChild(dto: CreateChildRequestDto) {
    return apiClient.post(authEndpoints.children, dto);
  },
  getLinks(options?: RequestOptions) {
    return apiClient.get(authEndpoints.links, options);
  },
  requestLink(inviteCode: string) {
    return apiClient.post(authEndpoints.requestLink, { invite_code: inviteCode });
  },
  respondLink(id: string, action: LinkAction) {
    return apiClient.post(authEndpoints.respondLink(id), { action });
  },
  getConsents(options?: RequestOptions) {
    return apiClient.get(authEndpoints.consents, options);
  },
  setConsent(dto: ConsentRequestDto) {
    return apiClient.post(authEndpoints.consents, dto);
  },
  /** `studentId` berilsa — ota-ona bolasining kirishlar tarixini oladi. */
  async getLogins(studentId: string | null, options?: RequestOptions) {
    return mapLoginRecords(
      await apiClient.get(authEndpoints.logins, {
        ...options,
        query: studentId ? { student: studentId } : undefined,
      })
    );
  },
  /** Admin: barcha o'qituvchilar (`avg_rating`/`rating_count` bilan). */
  getTeachers(options?: RequestOptions) {
    return apiClient.get<AuthUserDto[]>(authEndpoints.teachers, options);
  },
  /** Admin: hali tasdiqlanmagan o'qituvchilar. */
  getPendingTeachers(options?: RequestOptions) {
    return apiClient.get<AuthUserDto[]>(authEndpoints.teachersPending, options);
  },
  approveTeacher(id: string) {
    return apiClient.post<AuthUserDto>(authEndpoints.teacherApprove(id), {});
  },
  /** O'qituvchi o'zi uchun sertifikat yuklaydi — rasm yoki PDF. */
  uploadCertificate(file: File, title?: string) {
    const body = new FormData();
    body.set("file", file);
    if (title) body.set("title", title);
    return apiClient.post<CertificateDto>(authEndpoints.meCertificates, body);
  },
  async deleteCertificate(id: string) {
    await apiClient.delete(authEndpoints.meCertificate(id));
    return id;
  },
};
