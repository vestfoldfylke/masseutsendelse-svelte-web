import { json } from "@sveltejs/kit";
import { AppError } from "$lib/errors/AppError";
import { type EnrichedMatrikkelData, enrichDispatchWithMatrikkelData } from "$lib/server/matrikkelEnrichment";
import type { MatrikkelEnhet } from "$lib/types/matrikkel.types";
import type { RequestHandler } from "./$types";

type MatrikkelEnrichmentRequestBody = {
  polygons?: MatrikkelEnhet[];
};

export const POST: RequestHandler = async (event) => {
  const body: MatrikkelEnrichmentRequestBody = await event.request.json();

  if (!body.polygons || !Array.isArray(body.polygons) || body.polygons.length === 0) {
    return json({ title: "Ugyldig forespørsel", message: "polygons må være en ikke-tom liste" }, { status: 400 });
  }

  try {
    const result: EnrichedMatrikkelData = await enrichDispatchWithMatrikkelData(event, body.polygons);
    return json(result);
  } catch (err) {
    const appError = err instanceof AppError ? err : new AppError("Feil ved kontakt med matrikkelen", err instanceof Error ? err.message : undefined);
    return json({ title: appError.title, message: appError.message }, { status: 502 });
  }
};
