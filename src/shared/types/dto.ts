/**
 * Backend (Django/DRF) qaytaradigan xom shakllar — snake_case.
 *
 * Bu yerda faqat bir nechta modul baham ko'radigan DTO'lar turadi.
 * Modulga xos DTO'lar o'z `api/*.dto.ts` faylida bo'ladi.
 * Domen modellari (camelCase) uchun — `domain.ts`.
 */

export interface UserDto {
  id: string | number;
  username: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  phone?: string | null;
  invite_code?: string | null;
}

/** DRF `PageNumberPagination` javobi. */
export interface PaginatedDto<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
