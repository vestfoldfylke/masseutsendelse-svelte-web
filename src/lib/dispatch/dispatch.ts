import type { Dispatch } from "$lib/types/dispatch.types";

export const createEmptyDispatch = (): Dispatch => ({
  title: "",
  projectnumber: "",
  archivenumber: "",
  template: {},
  attachments: [],
  owners: [],
  excludedOwners: [],
  matrikkelUnitsWithoutOwners: [],
  stats: { affectedCount: null, area: null, totalOwners: null, privateOwners: null, businessOwners: null, units: [] }
});
