import exportFromJSON from "export-from-json";
import { getFilenameDateTime } from "$lib/helpers";
import type { MatrikkelUnit, Owner } from "$lib/types/dispatch.types";

type ExportRow = Record<string, string | number>;

const getPostAddress = (owner: Owner): string => {
  if (owner.dsf) {
    return `${owner.dsf.ADR ?? ""} ${owner.dsf.POSTN ?? ""} ${owner.dsf.POSTS ?? ""}`.trim();
  }
  if (owner.brreg?.postadresse) {
    const address = owner.brreg.postadresse;
    return `${address.adresse ?? ""} ${address.postnummer ?? ""} ${address.poststed ?? ""}`.trim();
  }

  let address = "";
  if (owner.postadresse?.adresselinje) {
    address += `${owner.postadresse.adresselinje} `;
  }
  if (owner.postadresse?.adresselinje1) {
    address += `${owner.postadresse.adresselinje1} `;
  }
  if (owner.postadresse?.adresselinje2) {
    address += `${owner.postadresse.adresselinje2} `;
  }
  if (owner.postadresse?.adresselinje3) {
    address += `${owner.postadresse.adresselinje3} `;
  }
  return `${address}(Matrikkel)`.trim();
};

const ownerToRows = (owner: Owner, tableType: string): ExportRow[] => {
  const base: ExportRow = {
    tableType,
    navn: owner.navn ?? "",
    type: owner._type ?? "",
    antallEierSkap: owner.ownerships.length,
    adresse: getPostAddress(owner),
    bruksnavn: "",
    fraDato: "",
    kommune: "",
    Gnr: "",
    Bnr: "",
    Fnr: "",
    type_eierforhold: "",
    andel: ""
  };

  if (owner.ownerships.length === 0) {
    return [base];
  }

  return owner.ownerships.map((ownership) => ({
    ...base,
    bruksnavn: ownership.unit?.bruksnavn ?? "",
    fraDato: ownership.datoFra ?? "",
    kommune: ownership.kommuneId ?? "",
    Gnr: ownership.unit?.matrikkelnummer?.gardsnummer ?? "",
    Bnr: ownership.unit?.matrikkelnummer?.bruksnummer ?? "",
    Fnr: ownership.unit?.matrikkelnummer?.festenummer ?? "",
    type_eierforhold: ownership._type ?? "",
    andel: `${ownership.andel?.teller ?? ""}/${ownership.andel?.nevner ?? ""}`
  }));
};

const unitWithoutOwnerToRow = (unit: MatrikkelUnit): ExportRow => ({
  tableType: "Matrikkelenheter uten eierforhold",
  bruksnavn: unit.bruksnavn ?? "",
  type: unit._type ?? "",
  kommune: unit.matrikkelnummer?.kommuneId ?? "",
  Gnr: unit.matrikkelnummer?.gardsnummer ?? "",
  Bnr: unit.matrikkelnummer?.bruksnummer ?? "",
  Fnr: unit.matrikkelnummer?.festenummer ?? "",
  etableringsdato: unit.etableringsdato ?? ""
});

export const exportOwnersToCsv = (owners: Owner[], excludedOwners: Owner[], unitsWithoutOwners: MatrikkelUnit[], dispatchTitle?: string): void => {
  const rows: ExportRow[] = [
    ...owners.flatMap((owner) => ownerToRows(owner, owner.ownerships.length === 0 ? "Eier/Mottakere - Etat uten eierforhold" : "Eier/Mottakere")),
    ...excludedOwners.flatMap((owner) => ownerToRows(owner, owner.ownerships.length === 0 ? "Ekskluderte mottakere - Etat uten eierforhold" : "Ekskluderte mottakere")),
    ...unitsWithoutOwners.map(unitWithoutOwnerToRow)
  ];

  exportFromJSON({
    data: rows,
    fileName: `${dispatchTitle ? `${dispatchTitle}_` : ""}Eiere_${getFilenameDateTime()}`,
    exportType: exportFromJSON.types.csv,
    withBOM: true
  });
};
