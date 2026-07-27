import DxfParser from "dxf-parser";
import type { PolygonShape } from "$lib/types/polyparser.types";
import { AppError } from "../../errors/AppError";

export const parse = (text: string): PolygonShape[] => {
  try {
    const parser = new DxfParser();
    const parsed = parser.parseSync(text);

    if (!parsed?.entities) {
      throw new AppError("The file contains no shapes", "We were unable to find any shapes in the file");
    }

    const polygons = parsed.entities.filter((entity) => entity.type === "LWPOLYLINE");
    if (polygons.length === 0) {
      throw new AppError("No polygons in file", `We were able to find ${parsed.entities.length} shapes in the file, but none are polygons`);
    }

    return polygons.map((polygon) => {
      const dxfPolygon = polygon as { vertices?: Array<{ x: number; y: number }> };
      if (!dxfPolygon.vertices || !Array.isArray(dxfPolygon.vertices) || dxfPolygon.vertices.length <= 0) {
        throw new AppError("Polygon is missing vertices", "One or more polygons in the file contains no vertices");
      }

      const vertices = dxfPolygon.vertices.map((vertice) => [vertice.x, vertice.y]);
      const metadata: Record<string, unknown> = { ...polygon };
      delete metadata.vertices;

      return { metadata, vertices };
    });
  } catch (err) {
    const title = err instanceof AppError ? err.title : "Feil ved lesing av DXF-fil";
    const message = err instanceof Error ? err.message : undefined;
    throw new AppError(title, message);
  }
};
