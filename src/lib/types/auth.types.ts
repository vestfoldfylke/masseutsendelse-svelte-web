export type ClientPrincipalClaim = {
  typ: string;
  val: string;
};

export type ClientPrincipal = {
  auth_typ: string;
  claims: ClientPrincipalClaim[];
  name_typ: string;
  role_typ: string;
};

export type AuthenticatedUser = {
  id: string;
  name: string;
  username: string;
  department: string | null;
  claims: Record<string, string>;
};
