import { json } from "@sveltejs/kit";
import { AppError } from "$lib/errors/AppError";
import { type DownloadedBlob, downloadBlob } from "$lib/server/api/blobs";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async (event) => {
  try {
    const blob: DownloadedBlob = await downloadBlob(event, event.params.dispatchId, event.params.blobId);
    return json(blob);
  } catch (err) {
    const appError = err instanceof AppError ? err : new AppError("Kunne ikke laste ned fil", err instanceof Error ? err.message : undefined);
    return json({ title: appError.title, message: appError.message }, { status: 502 });
  }
};
