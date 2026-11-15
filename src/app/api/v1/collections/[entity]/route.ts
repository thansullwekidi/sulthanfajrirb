import type { NextRequest } from "next/server";
import { createCollectionAction } from "@/server/controllers/api.controller";
import {
  asCollectionName,
  envelopeResponse,
  readJsonBody,
  unknownCollection
} from "@/server/http/respond";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ entity: string }> }
) {
  const { entity } = await context.params;
  const collection = asCollectionName(entity);
  if (!collection) return unknownCollection(entity);
  return envelopeResponse(await createCollectionAction(collection, await readJsonBody(request)));
}
