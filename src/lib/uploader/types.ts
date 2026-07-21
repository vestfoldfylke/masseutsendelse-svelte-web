export type UploadedFileData = {
  name: string;
  type: string;
  size: number;
  lastModified: number;
  data: string;
  dataUrl?: string;
  tags?: string[];
};
