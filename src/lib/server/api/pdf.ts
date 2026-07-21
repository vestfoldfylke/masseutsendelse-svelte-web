import type { RequestEvent } from "@sveltejs/kit";
import { deepMerge } from "$lib/objectUtils";
import { callApi } from "./client";

export type PdfPreviewRequest = {
  attachments?: unknown;
  createdByDepartment?: string;
  archivenumber?: string;
  createdBy?: string;
  template: {
    template: string;
    name: string;
    documentDefinitionId?: string;
    data?: Record<string, unknown>;
    documentData?: Record<string, unknown>;
  };
};

export const getPdfPreview = async (event: RequestEvent, req: PdfPreviewRequest): Promise<string> => {
  let data: Record<string, unknown> = deepMerge<Record<string, unknown>>({ attachments: req.attachments }, req.template.data);
  data = deepMerge<Record<string, unknown>>(data, req.template.documentData);
  data = deepMerge<Record<string, unknown>>(data, {
    info: {
      sector: req.createdByDepartment ?? event.locals.user?.department,
      "our-reference": req.archivenumber,
      "our-caseworker": req.createdBy ?? event.locals.user?.name
    }
  });

  const response = await callApi<{ base64: string }>(event, "generatePDF", {
    method: "POST",
    body: {
      preview: true,
      template: req.template.template,
      templateName: req.template.name,
      documentDefinitionId: req.template.documentDefinitionId,
      data
    }
  });

  return response.base64;
};
