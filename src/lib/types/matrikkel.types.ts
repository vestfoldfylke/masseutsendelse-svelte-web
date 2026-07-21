import type { Coordinate } from "$lib/polyparser/polyparser";

export type MatrikkelEnhet = {
  epsg: string;
  vertices: Coordinate[];
};
