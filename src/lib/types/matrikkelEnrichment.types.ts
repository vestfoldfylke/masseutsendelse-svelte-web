import type { Dispatch, MatrikkelUnit, Owner } from "$lib/types/dispatch.types";

export type EnrichedMatrikkelData = {
  owners: Owner[];
  excludedOwners: Owner[];
  matrikkelUnitsWithoutOwners: MatrikkelUnit[];
  stats: Dispatch["stats"];
};
