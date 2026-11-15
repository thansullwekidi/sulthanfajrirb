import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/contracts/auth.contract";
import { envelopeOk } from "@/contracts/api-envelope";

export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json(envelopeOk({ signedOut: true }));
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0
  });
  return response;
}
