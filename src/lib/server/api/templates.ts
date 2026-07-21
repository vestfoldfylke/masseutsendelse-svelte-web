import type { RequestEvent } from "@sveltejs/kit";
import { removeKeys } from "$lib/objectUtils";
import type { Template } from "$lib/templates/types";
import { callApi } from "./client";

const TEMPLATE_CREATE_ONLY_KEYS: string[] = ["createdTimestamp", "createdBy", "createdById", "createdByDepartment", "modifiedTimestamp", "modifiedBy", "modifiedById", "modifiedByDepartment"];

const TEMPLATE_UPDATE_ONLY_KEYS: string[] = ["createdTimestamp", "createdBy", "createdById", "modifiedTimestamp", "modifiedBy", "modifiedById"];

export const getTemplates = (event: RequestEvent): Promise<Template[]> => callApi<Template[]>(event, "templates");

export const createTemplate = (event: RequestEvent, template: Template): Promise<void> => callApi<void>(event, "templates", { method: "POST", body: removeKeys(template, TEMPLATE_CREATE_ONLY_KEYS) });

export const updateTemplate = (event: RequestEvent, template: Template & { _id: string }): Promise<void> =>
  callApi<void>(event, `templates/${template._id}`, { method: "PUT", body: removeKeys(template, TEMPLATE_UPDATE_ONLY_KEYS) });
