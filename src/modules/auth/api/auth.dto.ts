import { z } from "zod";

/** Auth — yagona modul, DTO'lar zod bilan runtime'da ham tekshiriladi. */
export const tokenPairDtoSchema = z.object({
  access: z.string().min(1),
  refresh: z.string().min(1),
});

/** O'qituvchi sertifikati (`/auth/me/certificates/`) — `UserSerializer` ichida ham keladi. */
export const certificateDtoSchema = z.object({
  id: z.string(),
  file: z.string(),
  title: z.string().nullable().default(""),
  created_at: z.string(),
});

export const userDtoSchema = z.object({
  id: z.string(),
  username: z.string(),
  first_name: z.string().default(""),
  last_name: z.string().default(""),
  role: z.string(),
  phone: z.string().nullable().optional(),
  invite_code: z.string().nullable().optional(),
  /** Profil rasmi — `PATCH /auth/me/` orqali yuklanadi. */
  avatar: z.string().nullable().optional(),
  /** Faqat `role: teacher`da — boshqa rollarda `null` keladi. */
  avg_rating: z.number().nullable().optional(),
  rating_count: z.number().nullable().optional(),
  /** Faqat o'qituvchida mazmunli — admin tasdiqlamaguncha `false`. */
  is_approved: z.boolean().nullable().optional(),
  certificates: z.array(certificateDtoSchema).optional().default([]),
});

/** `GET /api/v1/auth/logins/` — bitta kirish yozuvi (paginatsiyasiz massiv). */
export const loginRecordDtoSchema = z.object({
  at: z.string(),
  ip: z.string().nullable().default(null),
  user_agent: z.string().nullable().default(null),
  new_ip: z.boolean().default(false),
  new_device: z.boolean().default(false),
});

export type TokenPairDto = z.infer<typeof tokenPairDtoSchema>;
export type AuthUserDto = z.infer<typeof userDtoSchema>;
export type LoginRecordDto = z.infer<typeof loginRecordDtoSchema>;
export type CertificateDto = z.infer<typeof certificateDtoSchema>;

/** Kirishlar tarixining domen ko'rinishi. */
export interface LoginRecord {
  id: string;
  at: string;
  ip: string;
  /** Foydalanuvchiga tushunarli qurilma nomi: "Chrome · Windows". */
  device: string;
  userAgent: string;
  isNewIp: boolean;
  isNewDevice: boolean;
}

export interface LoginRequestDto {
  username: string;
  password: string;
}

export interface RefreshRequestDto {
  refresh: string;
}

export interface RegisterRequestDto {
  username: string;
  password: string;
  first_name: string;
  last_name: string;
  role: string;
  phone: string;
}

export interface CreateChildRequestDto {
  username: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface ConsentRequestDto {
  student: string;
  kind: string;
  granted: boolean;
}

/** Bola ota-ona so'roviga javobi. */
export type LinkAction = "approve" | "decline";

export interface RegisterFormValues {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: "teacher" | "parent" | "student";
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface ProfileFormValues {
  firstName: string;
  lastName: string;
  phone?: string;
  /**
   * Login. Backend uni `PATCH /auth/me/` da qabul qiladi, lekin u YAGONA
   * bo'lishi shart — band bo'lsa 400 qaytadi va forma xatoni ko'rsatadi.
   */
  username?: string;
}
