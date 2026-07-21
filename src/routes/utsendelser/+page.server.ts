import { error } from "@sveltejs/kit";
import { AppError } from "$lib/errors/AppError";
import { getDispatches } from "$lib/server/api/dispatches";
import { getTemplates } from "$lib/server/api/templates";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
  try {
    const [dispatches, templates] = await Promise.all([getDispatches(event), getTemplates(event)]);
    return { dispatches, templates };
  } catch (err) {
    const appError = err instanceof AppError ? err : new AppError("Kunne ikke laste utsendelser");
    return error(502, appError.message ?? appError.title);
  }
};
