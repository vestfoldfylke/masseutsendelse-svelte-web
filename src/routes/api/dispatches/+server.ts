import { json } from "@sveltejs/kit";
import { AppError } from "$lib/errors/AppError";
import { createDispatch, getDispatches } from "$lib/server/api/dispatches";
import type { Dispatch } from "$lib/types/dispatch.types";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async (event) => {
  try {
    const dispatches: Dispatch[] = await getDispatches(event);
    return json(dispatches);
  } catch (err) {
    const appError = err instanceof AppError ? err : new AppError("Kunne ikke laste utsendelser", err instanceof Error ? err.message : undefined);
    return json({ title: appError.title, message: appError.message }, { status: 502 });
  }
};

export const POST: RequestHandler = async (event) => {
  const dispatch: Dispatch = await event.request.json();

  try {
    await createDispatch(event, dispatch);
    return json({ ok: true });
  } catch (err) {
    const appError = err instanceof AppError ? err : new AppError("Kunne ikke opprette utsendelse", err instanceof Error ? err.message : undefined);
    return json({ title: appError.title, message: appError.message }, { status: 502 });
  }
};
