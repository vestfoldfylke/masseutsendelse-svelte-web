import type { RequestEvent } from "@sveltejs/kit";
import type { AuthenticatedUser, ClientPrincipal } from "$lib/types/auth.types";

export const CLIENT_PRINCIPAL_HEADER = "x-ms-client-principal";
const ACCESS_TOKEN_HEADER = "x-ms-token-aad-access-token";
/*const TOKEN_EXPIRY_BUFFER_SECONDS = 60;*/

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
    return null;
  }

  let principal: ClientPrincipal;
  try {
    principal = JSON.parse(Buffer.from(header, "base64").toString("utf8"));
  } catch {
    return null;
  }

  if (!principal.claims || principal.claims.length === 0) {
    return null;
  }

  const claims: Record<string, string> = {};
  for (const claim of principal.claims) {
    claims[claim.typ] = claim.val;
  }

  const id: string | undefined = firstClaim(claims, ID_CLAIM_TYPES);
  const name: string | undefined = firstClaim(claims, NAME_CLAIM_TYPES);
  const username: string | undefined = firstClaim(claims, USERNAME_CLAIM_TYPES);
  if (!id || !name || !username) {
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

/*type EasyAuthMeEntry = {
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
};*/

/**
 * Returns the signed-in user's Entra ID access token value for calling the backend API, as forwarded
 * by Easy Auth's X-MS-TOKEN-AAD-ACCESS-TOKEN header. Requires App Service's token store to be enabled
 * and the AAD provider to request the backend API's scope - without that, this always returns null.
 *
 * An expired/near-expiry value is refreshed via Easy Auth's /.auth/refresh + /.auth/me dance
 * (refresh has no response body, the refreshed value is only readable back from /.auth/me).
 */
export const getAccessTokenValue = async (event: RequestEvent): Promise<string | null> => event.request.headers.get(ACCESS_TOKEN_HEADER);
/*export const getAccessTokenValue = async (event: RequestEvent): Promise<string | null> => {
  const headerTokenValue = event.request.headers.get(ACCESS_TOKEN_HEADER);
  if (headerTokenValue && isUsable(headerTokenValue)) {
    return headerTokenValue;
  }

  const cookie = event.request.headers.get("cookie");
  if (!cookie) {
    return headerTokenValue;
  }

  const refreshResponse = await event.fetch("/.auth/refresh", { method: "POST", headers: { cookie } });
  if (!refreshResponse.ok) {
    return headerTokenValue;
  }

  const meResponse = await event.fetch("/.auth/me", { headers: { cookie } });
  if (!meResponse.ok) {
    return headerTokenValue;
  }

  const entries: EasyAuthMeEntry[] = await meResponse.json();
  const aadEntry = entries.find((entry) => entry.provider_name === "aad");
  return aadEntry?.access_token ?? headerTokenValue ?? null;
};*/
