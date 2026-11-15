import { snapshotAction } from "@/server/controllers/api.controller";
import { envelopeResponse } from "@/server/http/respond";

export const dynamic = "force-dynamic";

export async function GET() {
  return envelopeResponse(await snapshotAction());
}
