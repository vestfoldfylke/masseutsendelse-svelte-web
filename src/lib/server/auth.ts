import type { RequestEvent } from "@sveltejs/kit";
import { logger } from "@vestfoldfylke/loglady";
import { dev } from "$app/environment";
import type { AuthenticatedUser, ClientPrincipal } from "$lib/types/auth.types";

export const CLIENT_PRINCIPAL_HEADER = "x-ms-client-principal";
const ACCESS_TOKEN_HEADER = "x-ms-token-aad-access-token";
const TOKEN_EXPIRY_BUFFER_SECONDS = 60;

const ID_CLAIM_TYPES = ["http://schemas.microsoft.com/identity/claims/objectidentifier", "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier", "oid"];
const NAME_CLAIM_TYPES = ["name", "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"];
const USERNAME_CLAIM_TYPES = ["preferred_username", "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn", "upn", "email"];
const DEPARTMENT_CLAIM_TYPES = ["department"];

const firstClaim = (claims: Record<string, string>, claimTypes: string[]): string | undefined => {
  for (const claimType of claimTypes) {
    const value = claims[claimType];
    if (value) {
      return value;
    }
  }

  return undefined;
};

/**
 * Decodes the X-MS-CLIENT-PRINCIPAL header Azure App Service Authentication
 * ("Easy Auth") injects into every request it has already authenticated against Entra ID.
 * Returns null if the header is missing/malformed (e.g. local dev, where there is no App Service in front).
 */
export const parseClientPrincipal = (headers: Headers): AuthenticatedUser | null => {
  const header: string | null = headers.get(CLIENT_PRINCIPAL_HEADER);
  if (!header) {
    logger.info("{ClientPrincipalHeader} not found. Returning null", CLIENT_PRINCIPAL_HEADER);
    return null;
  }

  let principal: ClientPrincipal;
  try {
    principal = JSON.parse(Buffer.from(header, "base64").toString("utf8"));
  } catch (error) {
    logger.errorException(error, "{ClientPrincipalHeader} found but failed to be parsed to base64. Returning null", CLIENT_PRINCIPAL_HEADER);
    return null;
  }

  if (!principal.claims || principal.claims.length === 0) {
    logger.info("{ClientPrincipalHeader} found and parsed correctly, but lacks claims. Returning null", CLIENT_PRINCIPAL_HEADER);
    return null;
  }

  const claims: Record<string, string> = {};
  for (const claim of principal.claims) {
    claims[claim.typ] = claim.val;
  }

  logger.info("{ClientPrincipalHeader} found and parsed correctly. Claims: {@Claims}", CLIENT_PRINCIPAL_HEADER, claims);

  const id: string | undefined = firstClaim(claims, ID_CLAIM_TYPES);
  const name: string | undefined = firstClaim(claims, NAME_CLAIM_TYPES);
  const username: string | undefined = firstClaim(claims, USERNAME_CLAIM_TYPES);
  if (!id || !name || !username) {
    logger.info("{ClientPrincipalHeader} found and parsed correctly. Claims found, but lacks id, name or username. Returning null", CLIENT_PRINCIPAL_HEADER);
    return null;
  }

  return {
    id,
    name,
    username,
    department: firstClaim(claims, DEPARTMENT_CLAIM_TYPES) ?? null,
    claims
  };
};

type EasyAuthMeEntry = {
  provider_name: string;
  access_token?: string;
};

const decodeJwtExpiry = (accessTokenValue: string): number | null => {
  const payloadSegment = accessTokenValue.split(".")[1];
  if (!payloadSegment) {
    return null;
  }

  try {
    const payload: { exp?: number } = JSON.parse(Buffer.from(payloadSegment, "base64url").toString("utf8"));
    return payload.exp ?? null;
  } catch {
    return null;
  }
};

const isUsable = (accessTokenValue: string): boolean => {
  const expiresAt = decodeJwtExpiry(accessTokenValue);
  if (!expiresAt) {
    return false;
  }

  return expiresAt - Date.now() / 1000 > TOKEN_EXPIRY_BUFFER_SECONDS;
};

/**
 * Returns the signed-in user's Entra ID access token value for calling the backend API, as forwarded
 * by Easy Auth's X-MS-TOKEN-AAD-ACCESS-TOKEN header. Requires App Service's token store to be enabled
 * and the AAD provider to request the backend API's scope - without that, this always returns null.
 *
 * An expired/near-expiry value is refreshed via Easy Auth's /.auth/refresh + /.auth/me dance
 * (refresh has no response body, the refreshed value is only readable back from /.auth/me).
 */
export const getAccessTokenValue = async (event: RequestEvent): Promise<string | null> => {
  const headerTokenValue: string | null = event.request.headers.get(ACCESS_TOKEN_HEADER);
  if (dev) {
    return headerTokenValue;
  }

  if (headerTokenValue && isUsable(headerTokenValue)) {
    logger.info("Usable headerTokenValue found");
    return headerTokenValue;
  }

  const cookie: string | null = event.request.headers.get("cookie");
  if (!cookie) {
    logger.info("No usable headerTokenValue found. Cookie not found either");
    return headerTokenValue;
  }

  const refreshResponse: Response = await event.fetch("/.auth/refresh", {
    method: "POST",
    headers: {
      cookie
    }
  });

  if (!refreshResponse.ok) {
    const errorText: string = await refreshResponse.text();
    logger.info("No usable headerTokenValue found. Cookie found, but failed to refresh token: {@ErrorText}", errorText);
    return headerTokenValue;
  }

  const meResponse: Response = await event.fetch("/.auth/me", {
    headers: {
      cookie
    }
  });

  if (!meResponse.ok) {
    const errorText: string = await meResponse.text();
    logger.info("No usable headerTokenValue found. Cookie found. Refresh token found but failed to get me: {@ErrorText}", errorText);
    return headerTokenValue;
  }

  const entries: EasyAuthMeEntry[] = await meResponse.json();
  logger.info("No usable headerTokenValue found. Cookie found. Refresh token found. MeEntries found: {@MeEntries}", entries);
  const aadEntry: EasyAuthMeEntry | undefined = entries.find((entry: EasyAuthMeEntry) => entry.provider_name === "aad");
  logger.info("No usable headerTokenValue found. Cookie found. Refresh token found. MeAadEntry found: {@MeAadEntry}", aadEntry);
  return aadEntry?.access_token ?? headerTokenValue ?? null;
};
