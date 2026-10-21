import { RegisterPage } from "@/pages/auth/register-page";

/*
 * `PublicRoute` YO'Q: ro'yxatdan o'tish sessiyani o'zi ochadi va undan
 * keyin "tayyor" ekrani ko'rsatilishi kerak — kirgan foydalanuvchini
 * yo'naltirishni sahifaning o'zi boshqaradi.
 */
export default function RegisterRoute() {
  return <RegisterPage />;
}
