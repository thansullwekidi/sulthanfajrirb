import type { NextRequest } from "next/server";
import { profileMutationAction } from "@/server/controllers/api.controller";
import { envelopeResponse, readJsonBody } from "@/server/http/respond";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return envelopeResponse(await profileMutationAction(await readJsonBody(request)));
}
