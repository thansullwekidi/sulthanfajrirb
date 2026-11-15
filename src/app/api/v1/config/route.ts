import type { NextRequest } from "next/server";
import { updateConfigAction } from "@/server/controllers/api.controller";
import { envelopeResponse, readJsonBody } from "@/server/http/respond";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest) {
  return envelopeResponse(await updateConfigAction(await readJsonBody(request)));
}
