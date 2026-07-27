import type { Template } from "$lib/types/template.types";
import type { UploadedFileData } from "$lib/types/upload.types";

export type PdfPreviewRequest = {
  attachments?: UploadedFileData[];
  createdByDepartment?: string;
  archivenumber?: string;
  createdBy?: string;
  template: Template;
};

export type PdfPreviewResponse = {
  base64: string;
};
