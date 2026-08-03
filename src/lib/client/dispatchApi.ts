import type { Dispatch } from "$lib/types/dispatch.types";
import type { MatrikkelEnhet } from "$lib/types/matrikkel.types";
import type { EnrichedMatrikkelData } from "$lib/types/matrikkelEnrichment.types";
import { clientApiFetch } from "./apiFetch";

type AttachmentDownloadResponse = {
  data?: string;
  encoding?: string;
  type?: string;
};

type AttachmentDownloadedResponse = Omit<AttachmentDownloadResponse, "data"> & {
  data: string;
};

const getHrefLink = (attachmentResponse: AttachmentDownloadResponse): string => {
  const attachment: AttachmentDownloadedResponse = attachmentResponse as AttachmentDownloadedResponse;

  if (attachment.data.startsWith("data:")) {
    return attachment.data;
  }

  if (!attachment.encoding || !attachment.type) {
    return attachment.data;
  }

  return `data:${attachment.type};${attachment.encoding},${attachment.data}`;
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

export const fetchMatrikkelEnrichment = (polygons: MatrikkelEnhet[]): Promise<EnrichedMatrikkelData> =>
  clientApiFetch<EnrichedMatrikkelData>("/api/matrikkel-enrichment", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({ polygons })
  });

export const triggerAttachmentDownload = async (dispatchId: string, filename: string): Promise<void> => {
  const result: AttachmentDownloadResponse = await clientApiFetch<AttachmentDownloadResponse>(`/api/blobs/${dispatchId}/${filename}`);
  if (!result.data) {
    return;
  }

  const link: HTMLAnchorElement = document.createElement("a");
  link.href = getHrefLink(result);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
};
