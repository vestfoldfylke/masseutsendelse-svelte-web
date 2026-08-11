import { AppError } from "$lib/errors/AppError";
import type { Dispatch } from "$lib/types/dispatch.types";
import type { MatrikkelEnhet } from "$lib/types/matrikkel.types";
import type { EnrichedMatrikkelData, MatrikkelEnrichmentStreamEvent, MatrikkelProgress } from "$lib/types/matrikkelEnrichment.types";
import { clientApiFetch } from "./apiFetch";

type AttachmentDownloadResponse = {
  data?: string;
  encoding?: string;
  type?: string;
};

export const fetchDispatchById = (id: string): Promise<Dispatch> => clientApiFetch<Dispatch>(`/api/dispatches/${id}`);

export const saveDispatch = (dispatch: Dispatch): Promise<void> => {
  const path: string = dispatch._id ? `/api/dispatches/${dispatch._id}` : "/api/dispatches";
  const method: "PUT" | "POST" = dispatch._id ? "PUT" : "POST";
  return clientApiFetch<void>(path, {
    method,
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(dispatch)
  });
};

/**
 * Streams NDJSON progress lines from POST /api/matrikkel-enrichment (one JSON object per line -
 * "progress" while batches run, then a single "result" or "error" line at the end) rather than
 * waiting on one opaque request/response, so callers can show the same live per-batch progress
 * messages the original Vue app did.
 */
export const fetchMatrikkelEnrichment = async (polygons: MatrikkelEnhet[], onProgress?: (progress: MatrikkelProgress) => void): Promise<EnrichedMatrikkelData> => {
  const response: Response = await fetch("/api/matrikkel-enrichment", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ polygons })
  });

  if (!response.ok) {
    const errorBody: { title?: string; message?: string } | undefined = await response.json().catch(() => undefined);
    throw new AppError(errorBody?.title ?? "Feil ved kall til API", errorBody?.message ?? `/api/matrikkel-enrichment svarte med status ${response.status}`);
  }
  if (!response.body) {
    throw new AppError("Tomt svar", "Fikk ikke noe svar fra matrikkel-enrichment");
  }

  const reader: ReadableStreamDefaultReader<Uint8Array<ArrayBuffer>> = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer: string = "";
  let result: EnrichedMatrikkelData | undefined;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      let newlineIndex = buffer.indexOf("\n");
      while (newlineIndex !== -1) {
        const line: string = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);
        newlineIndex = buffer.indexOf("\n");

        if (!line.trim()) {
          continue;
        }

        const streamEvent: MatrikkelEnrichmentStreamEvent = JSON.parse(line);
        if (streamEvent.type === "progress") {
          onProgress?.(streamEvent);
        } else if (streamEvent.type === "result") {
          result = streamEvent.data;
        } else if (streamEvent.type === "error") {
          throw new AppError(streamEvent.title, streamEvent.message);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  if (!result) {
    throw new AppError("Ufullstendig svar", "Strømmen fra matrikkel-enrichment avsluttet uten et resultat");
  }

  return result;
};

export const triggerAttachmentDownload = async (dispatchId: string, filename: string): Promise<void> => {
  const result: AttachmentDownloadResponse = await clientApiFetch<AttachmentDownloadResponse>(`/api/blobs/${dispatchId}/${filename}`);
  if (!result.data) {
    return;
  }

  const link: HTMLAnchorElement = document.createElement("a");
  link.href = result.data;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
};
