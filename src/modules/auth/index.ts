/**
 * `auth` modulining mobil barrel'i.
 *
 * Veb `src/modules/auth/index.ts` dan generatsiya qilingan (scripts/port-barrels.mjs):
 * domen qatlami to'liq, `ui/` eksportlari olib tashlangan — mobil UI alohida
 * yoziladi va o'z fayllaridan import qilinadi.
 */
export { authApi } from "./api/auth.api";
export { authEndpoints } from "./api/auth.endpoints";
export type {
  AuthUserDto,
  CertificateDto,
  ConsentRequestDto,
  CreateChildRequestDto,
  LinkAction,
  LoginRecord,
  LoginRecordDto,
  ProfileFormValues,
  RegisterFormValues,
  TokenPair,
  TokenPairDto,
} from "./api/auth.dto";
export { AUTH_STATUS, useAuthStore } from "./model/auth.store";
export {
  authKeys,
  useApproveTeacher,
  useLoginHistory,
  usePendingTeachers,
  useTeachers,
} from "./model/auth.queries";
export { describeUserAgent } from "./lib/describe-user-agent";
export { useAuth, useCurrentUser, useIsAuthenticated } from "./model/use-auth";
export { loginSchema, registerSchema } from "./model/auth.schemas";
export {
  useRegisterMutation,
  useDeleteCertificate,
  useUpdateAvatarMutation,
  useUpdateProfileMutation,
  useUploadCertificate,
} from "./model/auth.mutations";
export { mapCertificateDto, mapLoginRequest, mapTokenPairDto, mapUserDto } from "./lib/auth.mappers";
export { resolveHomeRoute } from "./lib/resolve-home-route";
export { describeCreateError } from "./lib/teacher-approval";
