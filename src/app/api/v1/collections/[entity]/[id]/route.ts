import type { NextRequest } from "next/server";
import {
  deleteCollectionAction,
  updateCollectionAction
} from "@/server/controllers/api.controller";
import {
  asCollectionName,
  envelopeResponse,
  readJsonBody,
  unknownCollection
} from "@/server/http/respond";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ entity: string; id: string }> }
) {
  const { entity, id } = await context.params;
  const collection = asCollectionName(entity);
  if (!collection) return unknownCollection(entity);
  return envelopeResponse(
    await updateCollectionAction(collection, id, await readJsonBody(request))
  );
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ entity: string; id: string }> }
) {
  const { entity, id } = await context.params;
  const collection = asCollectionName(entity);
  if (!collection) return unknownCollection(entity);
  return envelopeResponse(await deleteCollectionAction(collection, id));
}
