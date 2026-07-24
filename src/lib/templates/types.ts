export type Template = {
  _id?: string;
  name?: string;
  description?: string;
  version?: number | null;
  language?: string;
  documentDefinitionId?: string;
  documentData?: Record<string, unknown>;
  data?: Record<string, unknown>;
  template?: string;
  schema?: object;
  createdTimestamp?: string;
  createdBy?: string;
  modifiedTimestamp?: string;
  modifiedBy?: string;
};
