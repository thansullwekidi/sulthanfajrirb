import type { NextRequest } from "next/server";
import { updateProjectAction } from "@/server/controllers/api.controller";
import { envelopeResponse, readJsonBody } from "@/server/http/respond";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return envelopeResponse(await updateProjectAction(id, await readJsonBody(request)));
}
