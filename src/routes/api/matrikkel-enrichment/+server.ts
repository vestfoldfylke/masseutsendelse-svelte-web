import { json } from "@sveltejs/kit";
import { AppError } from "$lib/errors/AppError";
import { enrichDispatchWithMatrikkelData } from "$lib/server/matrikkelEnrichment";
import type { MatrikkelEnhet } from "$lib/types/matrikkel.types";
import type { EnrichedMatrikkelData, MatrikkelEnrichmentStreamEvent } from "$lib/types/matrikkelEnrichment.types";
import type { RequestHandler } from "./$types";

type MatrikkelEnrichmentRequestBody = {
  polygons?: MatrikkelEnhet[];
};

const encoder = new TextEncoder();

const writeEvent = (controller: ReadableStreamDefaultController<Uint8Array>, streamEvent: MatrikkelEnrichmentStreamEvent): void => {
  controller.enqueue(encoder.encode(`${JSON.stringify(streamEvent)}\n`));
};

export const POST: RequestHandler = async (event) => {
  const body: MatrikkelEnrichmentRequestBody = await event.request.json();

  if (!body.polygons || !Array.isArray(body.polygons) || body.polygons.length === 0) {
    return json({ title: "Ugyldig forespørsel", message: "polygons må være en ikke-tom liste" }, { status: 400 });
  }

  const polygons: MatrikkelEnhet[] = body.polygons;

  const stream: ReadableStream<Uint8Array> = new ReadableStream<Uint8Array>({
    async start(controller: ReadableStreamDefaultController<Uint8Array>) {
      try {
        const result: EnrichedMatrikkelData = await enrichDispatchWithMatrikkelData(event, polygons, (progress) => {
          writeEvent(controller, { type: "progress", ...progress });
        });
        writeEvent(controller, { type: "result", data: result });
      } catch (err) {
        const appError: AppError = err instanceof AppError ? err : new AppError("Feil ved kontakt med matrikkelen", err instanceof Error ? err.message : undefined);
        writeEvent(controller, { type: "error", title: appError.title, message: appError.message });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, { headers: { "content-type": "application/x-ndjson" } });
};
