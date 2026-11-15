import type { NextRequest } from "next/server";
import { envelopeError } from "@/contracts/api-envelope";
import {
  archiveProjectAction,
  featureProjectAction,
  moveProjectAction,
  purgeProjectAction,
  restoreProjectAction
} from "@/server/controllers/api.controller";
import { envelopeResponse, readJsonBody } from "@/server/http/respond";

export const dynamic = "force-dynamic";

interface ActionBody {
  action?: string;
  confirmSlug?: string;
  isFeatured?: boolean;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = (await readJsonBody(request)) as ActionBody;

  switch (body.action) {
    case "ARCHIVE":
      return envelopeResponse(await archiveProjectAction(id));
    case "RESTORE":
      return envelopeResponse(await restoreProjectAction(id));
    case "PURGE":
      return envelopeResponse(
        await purgeProjectAction(id, { confirmSlug: body.confirmSlug ?? "" })
      );
    case "MOVE_UP":
      return envelopeResponse(await moveProjectAction(id, { direction: "UP" }));
    case "MOVE_DOWN":
      return envelopeResponse(await moveProjectAction(id, { direction: "DOWN" }));
    case "FEATURE":
      return envelopeResponse(await featureProjectAction(id, Boolean(body.isFeatured)));
    default:
      return envelopeResponse(
        envelopeError(400, "UNKNOWN_ACTION", "Aksi proyek tidak dikenali.")
      );
  }
}
