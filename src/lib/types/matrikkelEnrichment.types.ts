import type { Dispatch, MatrikkelUnit, Owner } from "$lib/types/dispatch.types";

export type EnrichedMatrikkelData = {
  owners: Owner[];
  excludedOwners: Owner[];
  matrikkelUnitsWithoutOwners: MatrikkelUnit[];
  stats: Dispatch["stats"];
};

export type MatrikkelProgress = {
  message: string;
  submessage?: string;
  subsubmessage?: string;
};

/** One line of the newline-delimited JSON stream POST /api/matrikkel-enrichment responds with. */
export type MatrikkelEnrichmentStreamEvent = ({ type: "progress" } & MatrikkelProgress) | { type: "result"; data: EnrichedMatrikkelData } | { type: "error"; title: string; message?: string };
