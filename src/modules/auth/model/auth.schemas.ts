import { z } from "zod";

export const loginSchema = z.object({
  login: z.string().trim().min(1, "Loginni kiriting"),
  password: z.string().min(1, "Parolni kiriting"),
  remember: z.boolean().optional(),
});

export const registerSchema = z.object({
  username: z.string().trim().min(3, "Login kamida 3 ta belgidan iborat bo‘lsin"),
  password: z.string().min(8, "Parol kamida 8 ta belgidan iborat bo‘lsin"),
  firstName: z.string().trim().min(1, "Ismni kiriting"),
  lastName: z.string().trim().min(1, "Familiyani kiriting"),
  phone: z.string().trim().optional(),
  role: z.enum(["teacher", "parent", "student"]),
});
