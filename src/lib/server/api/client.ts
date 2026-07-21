import type { RequestEvent } from "@sveltejs/kit";
import { dev } from "$app/environment";
import { AppError } from "$lib/errors/AppError";
import { getAccessTokenValue } from "$lib/server/auth";
import { getMasseutsendelseApiBaseUrl } from "$lib/server/config";

type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
};

type ApiErrorBody = {
  title?: string;
  message?: string;
};

/**
 * Authenticated fetch against the masseutsendelse backend API, using the signed-in user's
 * Easy-Auth-forwarded access token value (see src/lib/server/auth.ts).
 */
export const callApi = async <T>(event: RequestEvent, path: string, options: ApiRequestOptions = {}): Promise<T> => {
  const accessTokenValue: string | null = await getAccessTokenValue(event);
  if (!accessTokenValue && !dev) {
    throw new AppError("Ikke innlogget", "Fant ingen gyldig tilgang for den innloggede brukeren");
  }

  const headers: HeadersInit = !dev ? { authorization: `Bearer ${accessTokenValue}` } : {};
  if (options.body !== undefined) {
    headers["content-type"] = "application/json";
  }

  const url: string = `${getMasseutsendelseApiBaseUrl()}/${path}`;
  console.log("callApi --", options.method ?? "GET", "--", url);
  const response: Response = await event.fetch(url, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    const errorBody: ApiErrorBody | undefined = await response.json().catch(() => undefined);
    console.error("callApi --", options.method ?? "GET", "--", url, "--", errorBody);
    throw new AppError(errorBody?.title ?? "Feil ved kall til API", errorBody?.message ?? `${path} svarte med status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
};
