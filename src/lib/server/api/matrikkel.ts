import type { RequestEvent } from "@sveltejs/kit";
import { AppError } from "$lib/errors/AppError";
import { getMatrikkelProxyClientId } from "$lib/server/config";
import type { Coordinate } from "$lib/types/polyparser.types";
import { callApi } from "./client";

export type MatrikkelContext = {
  klientIdentifikasjon: string;
};

const getDefaultMatrikkelContext = (): MatrikkelContext => ({ klientIdentifikasjon: getMatrikkelProxyClientId() });

const buildMatrikkelPath = (path: string, query?: Record<string, string | number | undefined>): string => {
  if (!query) {
    return `matrikkel/${path}`;
  }

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) {
      params.set(key, String(value));
    }
  }

  const queryString = params.toString();
  return queryString ? `matrikkel/${path}?${queryString}` : `matrikkel/${path}`;
};

const EPSG_TO_KOORDINATSYSTEM_KODE_ID: Record<string, number> = {
  "4326": 24,
  "5972": 10,
  "25832": 10
};

export type MatrikkelStoreRequestItem = {
  type: string;
  namespace: string;
  value: string;
};

export const getMatrikkelenheterFromPolygon = (event: RequestEvent, polygon: Coordinate[], epsg: string, matrikkelContext?: MatrikkelContext): Promise<unknown> => {
  if (!polygon) {
    throw new AppError("Polygon cannot be empty");
  }
  if (!epsg) {
    throw new AppError("Koordinatsystem mangler", "Kan ikke kontakte matrikkelen uten å vite epsg-koden til koordinatene");
  }

  const koordinatsystemKodeId = EPSG_TO_KOORDINATSYSTEM_KODE_ID[epsg];
  if (!koordinatsystemKodeId) {
    throw new AppError("Feil koordinatsystem", "Kunne ikke finne passende koordinatsystem for koordinatene");
  }

  return callApi(event, buildMatrikkelPath("matrikkelenheter"), {
    method: "POST",
    body: {
      koordinatsystemKodeId,
      polygon,
      matrikkelContext: matrikkelContext ?? getDefaultMatrikkelContext()
    }
  });
};

export const getMatrikkelStoreItems = (
  event: RequestEvent,
  items: MatrikkelStoreRequestItem[],
  koordinatsystemKodeId: number,
  query?: Record<string, string | number | undefined>,
  matrikkelContext?: MatrikkelContext
): Promise<unknown> => {
  if (!items) {
    throw new AppError("items cannot be empty");
  }
  if (!koordinatsystemKodeId) {
    throw new AppError("koordinatsystemKodeId cannot be empty");
  }

  return callApi(event, buildMatrikkelPath("store", query), {
    method: "POST",
    body: { koordinatsystemKodeId, items, matrikkelContext: matrikkelContext ?? getDefaultMatrikkelContext() }
  });
};
