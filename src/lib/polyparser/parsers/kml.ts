import toGeoJSON from "@mapbox/togeojson";
import type { PolygonShape } from "$lib/types/polyparser.types";
import { AppError } from "../../errors/AppError";

/**
 * Runs client-side only (relies on the browser's global DOMParser) - only call this from
 * code that runs in the browser (e.g. after a <input type="file"> selection), never from
 * server-side/SSR code.
 */
export const parse = (text: string): PolygonShape[] => {
  if (!text) {
    throw new AppError("Filen er tom", "Vi har mottatt en fil uten innhold");
  }

  const kmlDocument = new DOMParser().parseFromString(text, "text/xml");
  if (!kmlDocument) {
    throw new AppError("Konvertering feilet", "Klarte ikke å konvertere KML til XML");
  }

  const kml = toGeoJSON.kml(kmlDocument);
  if (!kml) {
    throw new AppError("Konvertering feilet", "Klarte ikke å konvertere XML til GeoJSON");
  }
  if (!kml.features) {
    throw new AppError("Mangler geometri", "Filen inneholder ingen geometri");
  }

  const polygons: PolygonShape[] = [];
  for (const feature of kml.features) {
    if (!feature.geometry?.type) {
      throw new AppError("Geometri uten type", "Filen inneholder geometri uten spesifisert type");
    }

    if (feature.geometry.type.toLowerCase() !== "polygon") {
      continue;
    }

    const coordinates = feature.geometry.coordinates as number[][][] | undefined;
    const ring = coordinates?.[0];
    if (!ring || !Array.isArray(ring) || ring.length < 3) {
      throw new AppError("Færre enn 3 punkter", "Filen har polygoner som har færre enn tre punkter");
    }

    polygons.push({ metadata: feature.properties, vertices: ring });
  }

  return polygons;
};
