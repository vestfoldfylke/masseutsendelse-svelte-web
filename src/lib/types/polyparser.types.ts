export type Coordinate = [number, number];

export type Extremes = {
  north: Coordinate;
  west: Coordinate;
  east: Coordinate;
  south: Coordinate;
};

export type ParsedPolygon = {
  EPSG: string;
  metadata: Record<string, unknown> | null;
  extremes: Extremes;
  center: Coordinate;
  area: number;
  vertices: Coordinate[];
};

export type ParsedPolygonFile = {
  EPSG: string;
  extremes: Extremes;
  center: Coordinate;
  area: number;
  polygons: ParsedPolygon[];
};

export type PolygonShape = {
  metadata: Record<string, unknown> | null;
  vertices: number[][];
};
