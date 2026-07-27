import type { Coordinate } from "$lib/types/polyparser.types";

export type MatrikkelEnhet = {
  epsg: string;
  vertices: Coordinate[];
};

/** The Matrikkel API's raw owner shape, before conversion to the canonical (owner-centric) `Owner`. */
export type RawMatrikkelOwner = Record<string, unknown> & { id: { value: string }; _type?: string };
