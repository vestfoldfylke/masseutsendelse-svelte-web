import { json } from "@sveltejs/kit";
import { AppError } from "$lib/errors/AppError";
import { updateTemplate } from "$lib/server/api/templates";
import type { RequestHandler } from "./$types";

export const PUT: RequestHandler = async (event) => {
  const template = await event.request.json();

  try {
    await updateTemplate(event, { ...template, _id: event.params.id });
    return json({ ok: true });
  } catch (err) {
    const appError = err instanceof AppError ? err : new AppError("Kunne ikke oppdatere mal", err instanceof Error ? err.message : undefined);
    return json({ title: appError.title, message: appError.message }, { status: 502 });
  }
};
