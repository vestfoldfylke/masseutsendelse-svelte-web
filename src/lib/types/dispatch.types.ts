import type { ParsedPolygonFile } from "$lib/types/polyparser.types";
import type { Template } from "$lib/types/template.types";
import type { UploadedFileData } from "$lib/types/upload.types";

export type Andel = { teller?: number; nevner?: number };

export type MatrikkelUnit = Record<string, unknown> & {
  id?: { value: string };
  bruksnavn?: string;
  _type?: string;
  matrikkelnummer?: { kommuneId?: string; gardsnummer?: string; bruksnummer?: string; festenummer?: string };
  historiskOppgittAreal?: number;
  etableringsdato?: string;
  eierforhold?: Ownership[];
};

export type Ownership = Record<string, unknown> & {
  id?: string;
  eierId?: string;
  datoFra?: string;
  kommuneId?: string;
  _type?: string;
  andel?: Andel;
  unit?: MatrikkelUnit;
};

export type Owner = Record<string, unknown> & {
  id: string;
  navn?: string;
  nummer?: string;
  _type?: string;
  ownerships: Ownership[];
  exclusionReason?: string;
  isHardExcluded?: boolean;
  postadresse?: { adresselinje?: string; adresselinje1?: string; adresselinje2?: string; adresselinje3?: string };
  dsf?: { ADR?: string; POSTN?: string; POSTS?: string };
  brreg?: {
    navn?: string;
    organisasjonsnummer?: string;
    forretningsadresse?: unknown;
    postadresse?: { adresse?: string; postnummer?: string; poststed?: string };
    slettetDato?: string;
  };
  freg?: { kanKontaktes?: boolean; status?: string; bostedsadresse?: { adressegradering?: string } };
  slettetDato?: string;
  avviklet?: boolean;
  manuallyHandle?: boolean;
  handleManually?: boolean;
};

export type DispatchStats = {
  affectedCount: number | null;
  area: number | null;
  totalOwners: number | null;
  privateOwners: number | null;
  businessOwners: number | null;
  units: unknown[];
};

export type DispatchStatus = "notapproved" | "approved" | "inprogress" | "completed";

export type Dispatch = {
  _id?: string;
  title: string;
  projectnumber: string;
  archivenumber: string;
  status?: DispatchStatus;
  archiveUrl?: string;
  createdByDepartment?: string;
  createdBy?: string;
  createdTimestamp?: string;
  modifiedBy?: string;
  modifiedTimestamp?: string;
  template: Template;
  attachments: UploadedFileData[];
  owners: Owner[];
  excludedOwners: Owner[];
  matrikkelUnitsWithoutOwners: MatrikkelUnit[];
  stats: DispatchStats;
  polygons?: ParsedPolygonFile;
  approvedBy?: string;
  approvedTimestamp?: string;
  inProgressTimestamp?: string;
  completedTimestamp?: string;
};
