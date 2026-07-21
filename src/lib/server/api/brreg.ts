import type { RequestEvent } from "@sveltejs/kit";
import { callApi } from "./client";

export type BrregEntity = Record<string, unknown>;

export const getBrregEntity = (event: RequestEvent, id: string): Promise<BrregEntity> => callApi<BrregEntity>(event, `brreg/${id}`);
