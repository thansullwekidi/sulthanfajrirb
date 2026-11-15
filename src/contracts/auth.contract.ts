import { z } from "zod";

export const loginSchema = z.object({
  passphrase: z
    .string({ required_error: "Frasa sandi wajib diisi." })
    .min(4, "Frasa sandi minimal 4 karakter.")
});

export interface AdminSession {
  role: "ADMIN";
  label: string;
  issuedAt: string;
  expiresAt: string;
}

export const SESSION_COOKIE = "studio_session";
export const SESSION_TTL_MS = 1000 * 60 * 60 * 8;
