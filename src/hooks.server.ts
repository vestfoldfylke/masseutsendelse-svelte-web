import type { Handle } from "@sveltejs/kit";
import { dev } from "$app/environment";
import { env } from "$env/dynamic/private";
import { type AuthenticatedUser, CLIENT_PRINCIPAL_HEADER, type ClientPrincipal, parseClientPrincipal } from "$lib/server/auth";

/**
 * Local dev has no App Service in front, so there's never a real X-MS-CLIENT-PRINCIPAL header -
 * without this, every page would 404/crash on `{#if data\.user}` before you could see anything.
 * This does NOT unblock real backend API calls (those still need a real access token value and a
 * real MASSEUTSENDELSE_API_BASE_URL). It only lets the app render and navigate locally so UI work
 * doesn't require a full Azure deployment to see.
 */
const createDevUser = (): AuthenticatedUser => ({
  id: env.DEV_ENTRA_OBJECT_ID || "fyll-inn-en-id-da",
  name: "Demo Demonsen",
  username: "demo.demonsen@example.com",
  department: "Utvikling",
  claims: {}
});

const createDevClaims = (authenticatedUser: AuthenticatedUser): string => {
  const mockClaims: ClientPrincipal = {
    auth_typ: "aad",
    claims: [
      {
        typ: "aud",
        val: "guid-guid" // Audience - the client ID of the FRONTEND application
      },
      {
        typ: "iss",
        val: "https://login.microsoftonline.com/{tenantId}/v2.0" // Who issued the token / authentication
      },
      {
        typ: "iat",
        val: "1764835806" // Issued at - timestamp of when the token was issued
      },
      {
        typ: "nbf",
        val: "1764835806" // Not before - timestamp of when the token becomes valid
      },
      {
        typ: "exp",
        val: "1764839706" // Expiration - timestamp of when the token expires
      },
      {
        typ: "aio",
        val: "AcQAO/8aAAAA...." // An internal claim that's used to record data for token reuse. Should be ignored.
      },
      {
        typ: "c_hash",
        val: "Ajijifd..." // Used to validate the authenticity of an authorization code
      },
      {
        typ: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
        val: authenticatedUser.username // This value isn't guaranteed to be correct and is mutable over time. Never use it for authorization or to save data for a user.
      },
      {
        typ: "groups",
        val: "a23d4ddd-8e3a-40ca-b4ce-a32e87508094" // Group Object ID if groups are included in the token (in this case, only one group, random UUID generated for mock)
      },
      {
        typ: "name",
        val: authenticatedUser.name // The name claim provides a human-readable value that identifies the subject of the token. The value isn't guaranteed to be unique, it can be changed, and should be used only for display purposes
      },
      {
        typ: "nonce",
        val: "4fd69fsdfdsf" // Nonce value to mitigate replay attacks (internal OAuth2 Entra stuff)
      },
      {
        typ: "http://schemas.microsoft.com/identity/claims/objectidentifier",
        val: authenticatedUser.id // The immutable identifier for an object, in this case, a random UUID generated for mocking a user. This ID uniquely identifies the user across applications.
      },
      {
        typ: "preferred_username",
        val: authenticatedUser.username // The primary username that represents the user
      },
      {
        typ: "rh", // An internal claim used to revalidate tokens. Should be ignored.
        val: "dsfdsf..."
      },
      {
        typ: "sid",
        val: "guid" // Represents a unique identifier for a session and will be generated when a new session is established.
      },
      {
        typ: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier",
        val: "b-lM4...." // Dont know... bing it
      },
      {
        typ: "http://schemas.microsoft.com/identity/claims/tenantid",
        val: "guid" // Tenant ID - identifies the EntraID tenant
      },
      {
        typ: "uti",
        val: "CpU...." // Token identifier claim, equivalent to jti in the JWT specification. Unique, per-token identifier that is case-sensitive.
      },
      {
        typ: "ver",
        val: "2.0" // Indicates the version of the ID token.
      }
    ],
    name_typ: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
    role_typ: "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
  };

  return Buffer.from(JSON.stringify(mockClaims), "utf-8").toString("base64");
};

export const handle: Handle = async ({ event, resolve }) => {
  const user: AuthenticatedUser | null = parseClientPrincipal(event.request.headers);

  if (!dev) {
    event.locals.user = user ?? null;
    return resolve(event);
  }

  event.locals.user = createDevUser();

  if (event.request.headers.has(CLIENT_PRINCIPAL_HEADER)) {
    return resolve(event);
  }

  event.request.headers.set(CLIENT_PRINCIPAL_HEADER, createDevClaims(event.locals.user));

  return resolve(event);
};
