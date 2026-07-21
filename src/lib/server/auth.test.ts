import { describe, expect, it } from "vitest";
import { parseClientPrincipal } from "./auth";

const encodeClientPrincipal = (claims: Array<{ typ: string; val: string }>): string => Buffer.from(JSON.stringify({ auth_typ: "aad", claims, name_typ: "name", role_typ: "roles" })).toString("base64");

describe("parseClientPrincipal", () => {
  it("returns null when the header is missing", () => {
    const user = parseClientPrincipal(new Headers());

    expect(user).toBeNull();
  });

  it("extracts id, name, username and department from a valid header", () => {
    const header = encodeClientPrincipal([
      { typ: "http://schemas.microsoft.com/identity/claims/objectidentifier", val: "user-123" },
      { typ: "name", val: "Kari Nordmann" },
      { typ: "preferred_username", val: "kari.nordmann@example.no" },
      { typ: "department", val: "IT" }
    ]);
    const headers = new Headers({ "x-ms-client-principal": header });

    const user = parseClientPrincipal(headers);

    expect(user).toEqual({
      id: "user-123",
      name: "Kari Nordmann",
      username: "kari.nordmann@example.no",
      department: "IT",
      claims: {
        "http://schemas.microsoft.com/identity/claims/objectidentifier": "user-123",
        name: "Kari Nordmann",
        preferred_username: "kari.nordmann@example.no",
        department: "IT"
      }
    });
  });

  it("returns null when a required claim (username) is missing", () => {
    const header = encodeClientPrincipal([
      { typ: "http://schemas.microsoft.com/identity/claims/objectidentifier", val: "user-123" },
      { typ: "name", val: "Kari Nordmann" }
    ]);
    const headers = new Headers({ "x-ms-client-principal": header });

    const user = parseClientPrincipal(headers);

    expect(user).toBeNull();
  });

  it("returns null when the header is not valid base64/JSON", () => {
    const headers = new Headers({ "x-ms-client-principal": "not-valid-base64-json" });

    const user = parseClientPrincipal(headers);

    expect(user).toBeNull();
  });
});
