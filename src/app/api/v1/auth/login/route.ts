import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/contracts/auth.contract";
import { loginAction } from "@/server/controllers/api.controller";
import { readJsonBody } from "@/server/http/respond";
import { sessionCookieOptions } from "@/server/services/auth.service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const envelope = await loginAction(await readJsonBody(request));

  if (!envelope.ok || !envelope.data) {
    return NextResponse.json(envelope, { status: envelope.status });
  }

  const response = NextResponse.json(
    {
      ...envelope,
      data: { session: envelope.data.session }
    },
    { status: envelope.status }
  );
  response.cookies.set(SESSION_COOKIE, envelope.data.token, sessionCookieOptions);
  return response;
}
