import type { Template } from "$lib/templates/types";
import type { UploadedFileData } from "$lib/uploader/types";

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
