import type { Template } from "$lib/templates/types";
import type { PdfPreviewRequest, PdfPreviewResponse } from "$lib/types/pdf.types";
import { clientApiFetch } from "./apiFetch";

export const saveTemplate = (template: Template): Promise<void> => {
  const path: string = template._id ? `/api/templates/${template._id}` : "/api/templates";
  const method: "PUT" | "POST" = template._id ? "PUT" : "POST";
  return clientApiFetch<void>(path, {
    method,
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(template)
  });
};

export const requestPdfPreview = async (req: PdfPreviewRequest): Promise<string> => {
  const result: PdfPreviewResponse = await clientApiFetch<PdfPreviewResponse>("/api/pdf-preview", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(req)
  });
  return result.base64;
};
