import { error } from "@sveltejs/kit";
import { AppError } from "$lib/errors/AppError";
import { getTemplates } from "$lib/server/api/templates";
import type { Template } from "$lib/types/template.types";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
  try {
    const templates: Template[] = await getTemplates(event);
    return { templates };
  } catch (err) {
    const appError = err instanceof AppError ? err : new AppError("Kunne ikke laste maler");
    return error(502, appError.message ?? appError.title);
  }
};
