declare module "@mapbox/togeojson" {
  export type GeoJsonFeature = {
    properties: Record<string, unknown> | null;
    geometry: {
      type: string;
      coordinates: unknown;
    };
  };

  export type GeoJsonFeatureCollection = {
    features: GeoJsonFeature[];
  };

  export function kml(doc: Document): GeoJsonFeatureCollection;
}
