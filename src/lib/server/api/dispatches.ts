import type { RequestEvent } from "@sveltejs/kit";
import type { Dispatch } from "$lib/dispatch/types";
import { removeKeys } from "$lib/objectUtils";
import { callApi } from "./client";

const DISPATCH_WRITE_ONLY_KEYS: string[] = ["validatedArchivenumber", "createdTimestamp", "createdBy", "createdById", "modifiedTimestamp", "modifiedBy", "modifiedById"];

const DISPATCH_EDIT_ONLY_KEYS: string[] = [
  "validatedArchivenumber",
  "createdTimestamp",
  "createdBy",
  "createdById",
  "createdByDepartment",
  "modifiedTimestamp",
  "modifiedBy",
  "modifiedById",
  "modifiedByDepartment"
];

export const getDispatches = (event: RequestEvent): Promise<Dispatch[]> => callApi<Dispatch[]>(event, "dispatches");

export const getDispatchById = (event: RequestEvent, id: string): Promise<Dispatch> => callApi<Dispatch>(event, `dispatches/${id}`);

export const createDispatch = (event: RequestEvent, dispatch: Dispatch): Promise<void> => callApi<void>(event, "dispatches", { method: "POST", body: removeKeys(dispatch, DISPATCH_WRITE_ONLY_KEYS) });

export const updateDispatch = (event: RequestEvent, dispatch: Dispatch & { _id: string }): Promise<void> =>
  callApi<void>(event, `dispatches/${dispatch._id}`, { method: "PUT", body: removeKeys(dispatch, DISPATCH_EDIT_ONLY_KEYS) });
