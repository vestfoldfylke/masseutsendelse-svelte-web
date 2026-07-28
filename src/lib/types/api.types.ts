export type ApiErrorBody = {
  error?: {
    statusCode?: number;
    statusName?: string;
    message?: string;
    title?: string;
  };
  message?: string;
  title?: string;
  documentation?: unknown;
};
