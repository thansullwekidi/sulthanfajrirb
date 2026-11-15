import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { SESSION_COOKIE, SESSION_TTL_MS, type AdminSession } from "@/contracts/auth.contract";

const SECRET =
  process.env.STUDIO_SESSION_SECRET && process.env.STUDIO_SESSION_SECRET.length >= 16
    ? process.env.STUDIO_SESSION_SECRET
    : "obsidian-studio-local-secret-2026";

const ADMIN_PASSPHRASE = process.env.STUDIO_ADMIN_PASSPHRASE ?? "studio-2026";
const ADMIN_LABEL = process.env.STUDIO_ADMIN_LABEL ?? "admin@msfr.dev";

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export function verifyPassphrase(passphrase: string): boolean {
  const expected = Buffer.from(ADMIN_PASSPHRASE, "utf8");
  const received = Buffer.from(passphrase, "utf8");
  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}

export function issueSessionToken(): { token: string; session: AdminSession } {
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + SESSION_TTL_MS);
  const session: AdminSession = {
    role: "ADMIN",
    label: ADMIN_LABEL,
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString()
  };
  const payload = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  return { token: `${payload}.${sign(payload)}`, session };
}

export function readSessionToken(token: string | undefined | null): AdminSession | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = Buffer.from(sign(payload), "utf8");
  const received = Buffer.from(signature, "utf8");
  if (expected.length !== received.length) return null;
  if (!timingSafeEqual(expected, received)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AdminSession;
    if (parsed.role !== "ADMIN") return null;
    if (new Date(parsed.expiresAt).getTime() < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const jar = await cookies();
  return readSessionToken(jar.get(SESSION_COOKIE)?.value);
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: Math.floor(SESSION_TTL_MS / 1000)
};
