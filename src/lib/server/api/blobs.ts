import type { RequestEvent } from "@sveltejs/kit";
import { callApi } from "./client";

export type DownloadedBlob = Record<string, unknown>;

export const downloadBlob = (event: RequestEvent, dispatchId: string, blobId: string): Promise<DownloadedBlob> => callApi<DownloadedBlob>(event, `blobs/${dispatchId}/${blobId}/`);
