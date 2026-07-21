import type { Dispatch } from "$lib/dispatch/types";
import type { EnrichedMatrikkelData } from "$lib/server/matrikkelEnrichment";
import type { MatrikkelEnhet } from "$lib/types/matrikkel.types";
import { clientApiFetch } from "./apiFetch";

export const fetchDispatches = (): Promise<Dispatch[]> => clientApiFetch<Dispatch[]>("/api/dispatches");

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

export const fetchMatrikkelEnrichment = (polygons: MatrikkelEnhet[]): Promise<EnrichedMatrikkelData> =>
  clientApiFetch<EnrichedMatrikkelData>("/api/matrikkel-enrichment", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({ polygons })
  });

export const triggerAttachmentDownload = async (dispatchId: string, filename: string): Promise<void> => {
  const result: { data?: string } = await clientApiFetch<{ data?: string }>(`/api/blobs/${dispatchId}/${filename}`);
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
