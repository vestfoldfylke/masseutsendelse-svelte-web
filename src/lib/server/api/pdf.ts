import type { RequestEvent } from "@sveltejs/kit";
import { deepMerge } from "$lib/objectUtils";
import type { PdfPreviewRequest, PdfPreviewResponse } from "$lib/types/pdf.types";
import { callApi } from "./client";

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

  const response: PdfPreviewResponse = await callApi<PdfPreviewResponse>(event, "generatePDF", {
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
