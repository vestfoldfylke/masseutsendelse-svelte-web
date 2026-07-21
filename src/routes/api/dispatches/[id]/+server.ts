import { json } from "@sveltejs/kit";
import { AppError } from "$lib/errors/AppError";
import { getDispatchById, updateDispatch } from "$lib/server/api/dispatches";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async (event) => {
  try {
    const dispatch = await getDispatchById(event, event.params.id);
    return json(dispatch);
  } catch (err) {
    const appError = err instanceof AppError ? err : new AppError("Kunne ikke laste utsendelse", err instanceof Error ? err.message : undefined);
    return json({ title: appError.title, message: appError.message }, { status: 502 });
  }
};

export const PUT: RequestHandler = async (event) => {
  const dispatch = await event.request.json();

  try {
    await updateDispatch(event, { ...dispatch, _id: event.params.id });
    return json({ ok: true });
  } catch (err) {
    const appError = err instanceof AppError ? err : new AppError("Kunne ikke oppdatere utsendelse", err instanceof Error ? err.message : undefined);
    return json({ title: appError.title, message: appError.message }, { status: 502 });
  }
};
