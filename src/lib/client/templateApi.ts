import type { Template } from "$lib/templates/types";
import { clientApiFetch } from "./apiFetch";

type PdfPreviewRequest = {
  attachments?: unknown;
  createdByDepartment?: string;
  archivenumber?: string;
  createdBy?: string;
  template: Template;
};

export const fetchTemplates = (): Promise<Template[]> => clientApiFetch<Template[]>("/api/templates");

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
  const result: { base64: string } = await clientApiFetch<{ base64: string }>("/api/pdf-preview", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(req)
  });
  return result.base64;
};
