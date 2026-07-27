import type { RequestEvent } from "@sveltejs/kit";
import { AppError } from "$lib/errors/AppError";
import { getMatrikkelEnheterOwnerCentric } from "$lib/matrikkel/matrikkelUtils";
import { getExcludedOwnerIds } from "$lib/server/config";
import type { Dispatch, MatrikkelUnit, Owner, Ownership } from "$lib/types/dispatch.types";
import type { MatrikkelEnhet, RawMatrikkelOwner } from "$lib/types/matrikkel.types";
import type { EnrichedMatrikkelData } from "$lib/types/matrikkelEnrichment.types";
import { getBrregEntity } from "./api/brreg";
import { getMatrikkelenheterFromPolygon, getMatrikkelStoreItems } from "./api/matrikkel";

type MatrikkelenheterResponse = { units: string[]; koordinatsystemKodeId: number };

type StoreResponse = {
  store: Array<{ return?: unknown; "soap:Body"?: { return?: unknown } }>;
};

const BATCH_SIZE = 100;

const unwrapStoreReturn = (response: StoreResponse): unknown[] => {
  const first = response.store?.[0];
  const value = first?.["soap:Body"]?.return !== undefined ? first["soap:Body"]?.return : first?.return;
  return Array.isArray(value) ? value : [];
};

const chunk = <T>(items: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

/**
 * Ported from vue-masseutsendelse-web's DispatchEditor.vue getDataFromMatrikkelAPI() (~330 lines).
 * Runs server-side now (needs the authenticated user's access token) rather than client-side.
 *
 * Known UX regression vs. the original: the old app streamed live progress messages ("Utfører jobb
 * X av Y") to the UI while batches ran. This is now a single request/response, so the client only
 * sees a generic "contacting matrikkelen" loading state for the whole duration, not per-batch
 * progress. Revisit with SSE/polling if that granularity turns out to matter in practice.
 */
export const enrichDispatchWithMatrikkelData = async (event: RequestEvent, polygons: MatrikkelEnhet[]): Promise<EnrichedMatrikkelData> => {
  const matrikkelUnitsWithoutOwners: MatrikkelUnit[] = [];
  const ownershipsWithoutOwnerId: Ownership[] = [];

  const matrikkelenhetIds: string[] = [];
  let koordinatsystemKodeId: number | undefined;
  for (const polygon of polygons) {
    const response = (await getMatrikkelenheterFromPolygon(event, polygon.vertices, polygon.epsg)) as MatrikkelenheterResponse;
    koordinatsystemKodeId = response.koordinatsystemKodeId;
    for (const id of response.units) {
      if (!matrikkelenhetIds.includes(id)) {
        matrikkelenhetIds.push(id);
      }
    }
  }
  if (matrikkelenhetIds.length === 0) {
    throw new AppError("Ingen MatrikkelIDer funnet", "Vi klarte ikke å finne noen matrikkelinformasjon innenfor dette polygonet");
  }
  if (!koordinatsystemKodeId) {
    throw new AppError("Feil koordinatsystem", "Fant ingen koordinatsystemKodeId for polygonene");
  }

  const batches = chunk(matrikkelenhetIds, BATCH_SIZE);

  const retrievedOwnerIds: string[] = [];
  const retrievedOwners: RawMatrikkelOwner[] = [];
  const retrievedMatrikkelUnits: MatrikkelUnit[] = [];

  for (const batch of batches) {
    const matrikkelenhetRequestItems = batch.map((id) => ({
      type: "MatrikkelenhetId",
      namespace: "http://matrikkel.statkart.no/matrikkelapi/wsapi/v1/domain/matrikkelenhet",
      value: id
    }));

    const matrikkelenheterResponse = (await getMatrikkelStoreItems(event, matrikkelenhetRequestItems, koordinatsystemKodeId)) as StoreResponse;
    const matrikkelenheter = unwrapStoreReturn(matrikkelenheterResponse) as MatrikkelUnit[];

    if (!matrikkelenheter || batch.length === 0) {
      throw new AppError("Ingen MatrikkelEnheter funnet", `Vi klarte ikke å finne matrikkelinformasjon for de ${matrikkelenhetIds.length} idene`);
    }
    if (batch.length > matrikkelenheter.length) {
      const deviation = batch.length - matrikkelenheter.length;
      const notFoundIds = matrikkelenhetIds.filter((id) => !matrikkelenheter.some((unit) => unit.id?.value === id));
      throw new AppError("Færre matrikkel enheter er returnert", `MatrikkelAPIet returnerte ${deviation} færre enheter enn det vi etterspurte\n${notFoundIds}`);
    }
    if (matrikkelenheter.length > batch.length) {
      throw new AppError("For mange matrikkelenheter er returnert", `Vi fant ${matrikkelenheter.length} IDer, men skulle kun hatt ${batch.length}.`);
    }

    const matrikkelEierforhold: Ownership[] = [];
    for (const unit of matrikkelenheter) {
      if (!unit.eierforhold) {
        matrikkelUnitsWithoutOwners.push(unit);
        continue;
      }

      const eierforhold = Array.isArray(unit.eierforhold) ? unit.eierforhold : [unit.eierforhold];

      const ownershipIdsWithoutOwner: Array<string | undefined> = [];
      for (const ownership of eierforhold) {
        if (!ownership.eierId) {
          ownershipsWithoutOwnerId.push(ownership);
          ownershipIdsWithoutOwner.push(ownership.id);
        }
      }
      const remainingEierforhold = eierforhold.filter((ownership) => !ownershipIdsWithoutOwner.includes(ownership.id));
      unit.eierforhold = remainingEierforhold;

      if (remainingEierforhold.length > 0) {
        matrikkelEierforhold.push(...remainingEierforhold);
      } else {
        matrikkelUnitsWithoutOwners.push(unit);
      }
      retrievedMatrikkelUnits.push(unit);
    }

    const uniqueOwnerIds: string[] = [];
    for (const ownership of matrikkelEierforhold) {
      if (ownership.eierId && !retrievedOwnerIds.includes(ownership.eierId)) {
        uniqueOwnerIds.push(ownership.eierId);
        retrievedOwnerIds.push(ownership.eierId);
      }
    }

    const matrikkelEierRequestItems = uniqueOwnerIds.map((id) => ({
      type: "PersonId",
      namespace: "http://matrikkel.statkart.no/matrikkelapi/wsapi/v1/domain/person",
      value: id
    }));

    const matrikkeleiereResponse = (await getMatrikkelStoreItems(event, matrikkelEierRequestItems, koordinatsystemKodeId)) as StoreResponse;
    const matrikkeleiere = unwrapStoreReturn(matrikkeleiereResponse) as RawMatrikkelOwner[];

    if (!matrikkeleiere || matrikkeleiere.length === 0) {
      throw new AppError("Ingen eiere er funnet", `Vi spurte matrikkelen om ${matrikkelEierRequestItems.length} eiere, men fikk ingen tilbake`);
    }
    if (matrikkelEierRequestItems.length > matrikkeleiere.length) {
      throw new AppError("Ingen eiere er funnet", `Vi spurte matrikkelen om ${matrikkelEierRequestItems.length} eiere, men fikk kun ${matrikkeleiere.length} tilbake`);
    }
    retrievedOwners.push(...matrikkeleiere);
  }

  let ownerCentric = getMatrikkelEnheterOwnerCentric(retrievedMatrikkelUnits, retrievedOwners);

  const excludedOwnerIds = getExcludedOwnerIds();
  const preExcludedUnits: Owner[] = [];
  for (const id of excludedOwnerIds) {
    const brreg = (await getBrregEntity(event, id)) as {
      organisasjonsnummer?: string;
      forretningsadresse?: unknown;
      postadresse?: { adresse?: string; postnummer?: string; poststed?: string };
      navn?: string;
    };

    const org: Owner = {
      brreg: { ...brreg },
      _type: "JuridiskPerson",
      id: Math.floor(Math.random() * 10_000_000).toString(),
      nummer: brreg.organisasjonsnummer,
      navn: brreg.navn,
      exclusionReason: "Etat uten eierforhold",
      ownerships: []
    };
    (org as Owner & { forretningsadresse?: unknown }).forretningsadresse = brreg.forretningsadresse;
    // The original assigns brreg's { adresse, postnummer, poststed } shape here even though
    // Owner.postadresse elsewhere holds the matrikkel { adresselinje... } shape - the check below
    // for org.postadresse.adresselinje* is therefore always false for this brreg-derived org (the
    // org.brreg.postadresse check is what actually matters here). Preserved as-is rather than
    // "fixing" the shape mismatch, since org.brreg?.postadresse is checked first and always wins.
    org.postadresse = brreg.postadresse as unknown as Owner["postadresse"];

    const hasPostAddress =
      (org.brreg?.postadresse && (org.brreg.postadresse.adresse || org.brreg.postadresse.postnummer || org.brreg.postadresse.poststed)) ||
      (org.postadresse && (org.postadresse.adresselinje || org.postadresse.adresselinje1 || org.postadresse.adresselinje2 || org.postadresse.adresselinje3));

    if (!hasPostAddress) {
      org.exclusionReason = "Må håndtres manuelt, manlger postadresse";
      org.isHardExcluded = true;
    }

    preExcludedUnits.push(org);
  }

  const excludedOwners: Owner[] = [];
  for (const owner of ownerCentric) {
    let excludedReason: string | undefined;

    if (owner._type?.toLowerCase().includes("annenperson")) {
      excludedReason = "Må håndteres manuelt";
      owner.isHardExcluded = true;
    }

    if (owner.freg?.kanKontaktes === true) {
      if (owner.freg.status !== "inaktiv") {
        const illegalGrading = ["fortrolig", "strengtFortrolig", "klientadresse"];
        if (illegalGrading.includes(owner.freg.bostedsadresse?.adressegradering ?? "")) {
          excludedReason = "Må håndteres manuelt";
          owner.isHardExcluded = true;
        }
      } else if (owner.freg.status === "inaktiv") {
        excludedReason = "Må håndteres manuelt";
        owner.isHardExcluded = true;
      }
    }

    if (owner.freg?.kanKontaktes === false) {
      excludedReason = "Utvandret/Forsvunnet/Død";
      owner.isHardExcluded = true;
    }

    if (owner.manuallyHandle === true || owner.handleManually === true) {
      excludedReason = "Må håndteres manuelt";
      owner.isHardExcluded = true;
    }

    if (owner.freg?.status === "doed" || owner.navn?.includes("DØDSBO")) {
      excludedReason = "Død";
      owner.isHardExcluded = true;
    }

    if (excludedOwnerIds.length > 0) {
      if (owner.nummer && excludedOwnerIds.includes(owner.nummer)) {
        excludedReason = "Forhåndsekskludert";
      }

      for (let i = preExcludedUnits.length - 1; i >= 0; i--) {
        if (preExcludedUnits[i]?.nummer === owner.nummer) {
          preExcludedUnits.splice(i, 1);
        }
      }
    }

    if (owner.avviklet) {
      excludedReason = "Firma er avviklet";
      owner.isHardExcluded = true;
    }

    if (owner._type?.toLowerCase().includes("juridisk") && owner.slettetDato) {
      excludedReason = "Slettet fra Brønnøysund";
      owner.isHardExcluded = true;
    }

    if (owner._type?.toLowerCase().includes("juridisk") && !owner.brreg) {
      excludedReason = "Finnes ikke i Brønnøysund";
      owner.isHardExcluded = true;
    }

    if (excludedReason) {
      owner.exclusionReason = excludedReason;
      excludedOwners.push(owner);
    }

    if (excludedOwners.length !== 0) {
      const excludedIds = excludedOwners.map((excluded) => excluded.nummer);
      ownerCentric = ownerCentric.filter((candidate) => !excludedIds.includes(candidate.nummer));
    }
  }

  const allExcludedOwners = excludedOwners.concat(preExcludedUnits);

  const juridiskeEiere = retrievedOwners.filter((owner) => owner._type?.toLowerCase().includes("juridisk"));

  const stats: Dispatch["stats"] = {
    affectedCount: retrievedMatrikkelUnits.length,
    area: null,
    privateOwners: retrievedOwners.length - juridiskeEiere.length,
    businessOwners: juridiskeEiere.length,
    totalOwners: retrievedOwners.length,
    units: []
  };

  return { owners: ownerCentric, excludedOwners: allExcludedOwners, matrikkelUnitsWithoutOwners, stats };
};
