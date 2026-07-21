import { json } from "@sveltejs/kit";
import { AppError } from "$lib/errors/AppError";
import { getPdfPreview } from "$lib/server/api/pdf";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async (event) => {
  const req = await event.request.json();

  try {
    const base64 = await getPdfPreview(event, req);
    return json({ base64 });
  } catch (err) {
    const appError = err instanceof AppError ? err : new AppError("Kunne ikke opprette forhåndsvisning", err instanceof Error ? err.message : undefined);
    return json({ title: appError.title, message: appError.message }, { status: 502 });
  }
};
