import { error } from "@sveltejs/kit";
import { AppError } from "$lib/errors/AppError";
import { getTemplates } from "$lib/server/api/templates";
import type { Template } from "$lib/templates/types";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
  try {
    const templates: Template[] = await getTemplates(event);
    return { templates };
  } catch (err) {
    const appError: AppError = err instanceof AppError ? err : new AppError("Kunne ikke laste maler", `Feilet ved henting av maler: ${Error.isError(err) ? err.message : "Ukjent feil"}`);
    return error(502, appError.message ?? appError.title);
  }
};
