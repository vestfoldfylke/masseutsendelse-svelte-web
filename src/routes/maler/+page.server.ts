import { error } from "@sveltejs/kit";
import { AppError } from "$lib/errors/AppError";
import { getTemplates } from "$lib/server/api/templates";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
  try {
    const templates = await getTemplates(event);
    return { templates };
  } catch (err) {
    const appError = err instanceof AppError ? err : new AppError("Kunne ikke laste maler");
    return error(502, appError.message ?? appError.title);
  }
};
