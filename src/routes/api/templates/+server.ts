import { json } from "@sveltejs/kit";
import { AppError } from "$lib/errors/AppError";
import { createTemplate, getTemplates } from "$lib/server/api/templates";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async (event) => {
  try {
    const templates = await getTemplates(event);
    return json(templates);
  } catch (err) {
    const appError = err instanceof AppError ? err : new AppError("Kunne ikke laste maler", err instanceof Error ? err.message : undefined);
    return json({ title: appError.title, message: appError.message }, { status: 502 });
  }
};

export const POST: RequestHandler = async (event) => {
  const template = await event.request.json();

  try {
    await createTemplate(event, template);
    return json({ ok: true });
  } catch (err) {
    const appError = err instanceof AppError ? err : new AppError("Kunne ikke lagre mal", err instanceof Error ? err.message : undefined);
    return json({ title: appError.title, message: appError.message }, { status: 502 });
  }
};
