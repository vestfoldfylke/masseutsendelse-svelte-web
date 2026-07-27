import turfArea from "@turf/area";
import { polygon as turfPolygon } from "@turf/helpers";
import proj4 from "proj4";
import type { Coordinate, Extremes, ParsedPolygon, ParsedPolygonFile } from "$lib/types/polyparser.types";
import { AppError } from "../errors/AppError";
import { parse as parseDxf } from "./parsers/dxf";
import { parse as parseKml } from "./parsers/kml";

proj4.defs([
  ["4326", "+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees"],
  ["5972", "+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs"],
  ["25832", "+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs"]
]);

type UploadedFile = {
  name: string;
  size: number;
  data: string;
};

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value));

/**
 * Runs client-side only - transitively calls the KML parser, which relies on the browser's
 * global DOMParser. Only call this from browser code (e.g. after a file input selection).
 */
export const parsePolygonFile = (file: UploadedFile): ParsedPolygonFile => {
  if (!file) {
    throw new AppError("No file provided", "No file was provided for parsing");
  }

  if (file.size === 0) {
    throw new AppError("File error", "The provided file is empty");
  }

  if (!file.name) {
    throw new AppError("File error", "No 'name' property was provided in the file");
  }

  if (!file.name.includes(".")) {
    throw new AppError("File error", "The file name does not contain any file extension");
  }

  const extension: string = file.name.substring(file.name.lastIndexOf(".") + 1);

  const fileData: string = file.data;
  if (!fileData || fileData.length === 0) {
    throw new AppError("The file is empty", "We were able to read the file, but it was empty");
  }

  let parsedData: Array<{ metadata: Record<string, unknown> | null; vertices: number[][] }>;
  switch (extension) {
    case "dxf":
      parsedData = parseDxf(fileData);
      break;
    case "kml":
      parsedData = parseKml(fileData);
      break;
    default:
      throw new AppError("Could not parse", `We were unable to find a parser for filetype '${extension}'`);
  }

  if (!parsedData || parsedData.length === 0) {
    throw new AppError("Unable to parse file", "We attempted to parse the file but could not find any data");
  }

  if (!parsedData[0]?.vertices || parsedData[0].vertices.length === 0) {
    throw new AppError("Polygon is empty", "One or more polygons in the file is empty");
  }

  const epsg = guessEpsgCodeAndOrder(parsedData[0].vertices[0] as Coordinate);
  if (!epsg?.code) {
    throw new AppError("Unsupported coordinate system", "Could not determine the coordinate system based on the coordinates", [`First coordinate [${parsedData[0].vertices[0]}]`]);
  }

  const polygons: ParsedPolygon[] = parsedData.map((polygon) => {
    if (!polygon.vertices || polygon.vertices.length === 0) {
      throw new AppError("Polygon is empty", "One or more polygons in the file is empty");
    }

    let vertices = polygon.vertices;
    if (epsg.reversed) {
      vertices = vertices.map((vertice) => [vertice[1] as number, vertice[0] as number]);
    }

    const firstVertice = vertices[0];
    const lastVertice = vertices[vertices.length - 1];
    if (firstVertice && JSON.stringify(firstVertice) !== JSON.stringify(lastVertice)) {
      vertices = [...vertices, copy(firstVertice)];
    }

    vertices.forEach((vertice, i) => {
      if (!vertice || vertice.length < 2) {
        throw new AppError("Vertice is incomplete", `The vertice in position ${i} contains only ${vertice?.length ?? 0} coordinates`, [JSON.stringify(vertice)]);
      }
      if (typeof vertice[0] !== "number" || typeof vertice[1] !== "number") {
        throw new AppError("Vertice is invalid", `The vertice in position ${i} contains coordinates that are not numbers`, [JSON.stringify(vertice)]);
      }
    });

    if (vertices.length < 4) {
      throw new AppError("Polygon has to few vertices", `One of the polygons has only ${vertices.length} it needs at least 4`);
    }

    const typedVertices = vertices as Coordinate[];
    const extremes = getExtremes(typedVertices);
    const center = getCenterFromExtremes(extremes);
    const area = turfArea(turfPolygon([copy(typedVertices)]));

    return {
      EPSG: epsg.code,
      metadata: polygon.metadata,
      extremes,
      center,
      area,
      vertices: typedVertices
    };
  });

  const combinedExtremes = polygons.flatMap((polygon) => Object.values(polygon.extremes));
  const extremes = getExtremes(combinedExtremes);
  const center = getCenterFromExtremes(extremes);
  const area = polygons.reduce((total, polygon) => total + polygon.area, 0);

  return { EPSG: epsg.code, extremes, center, area, polygons };
};

export const guessEpsgCodeAndOrder = (coordinateSample: Coordinate): { code: string; reversed: boolean } | undefined => {
  let reversed = false;
  let code: string | undefined;

  if (
    (coordinateSample[0] > -90 && coordinateSample[0] < 90 && coordinateSample[1] > -180 && coordinateSample[1] < 180) ||
    (coordinateSample[1] > -90 && coordinateSample[1] < 90 && coordinateSample[0] > -180 && coordinateSample[0] < 180)
  ) {
    code = "4326";
    if (coordinateSample[0] > 31) {
      reversed = true;
    }
  } else {
    let sample = coordinateSample;
    for (let i = 0; i <= 1; i++) {
      if (i === 1) {
        reversed = true;
        sample = [sample[1], sample[0]];
      }
      if (sample[0] > 322361.85 && sample[0] < 637396.44 && sample[1] > 6424859.18 && sample[1] < 7296440.28) {
        code = "5972";
      }
      if (sample[0] > -1877994.66 && sample[0] < 3932281.56 && sample[1] > 836715.13 && sample[1] < 9440581.95) {
        code = "25832";
      }
    }
  }

  if (!code) {
    return undefined;
  }
  return { code, reversed };
};

export const transformCoordinates = (sourceEpsgCode: string | undefined, destinationEpsg: string | undefined, coordinates: Coordinate): Coordinate => {
  if (!coordinates) {
    throw new AppError("No coordinates", "No coordinates were provided for parsing");
  }

  const destination = destinationEpsg ?? "4326";
  if (sourceEpsgCode === destination) {
    return coordinates;
  }

  let epsgCode = sourceEpsgCode;
  if (!epsgCode) {
    const epsg = guessEpsgCodeAndOrder(coordinates);
    if (!epsg) {
      throw new AppError("No EPSG code found", "Could not determine any supported EPSG codes from the coordinates");
    }
    epsgCode = epsg.code;
  }

  return proj4(epsgCode, destination, coordinates) as Coordinate;
};

export const getExtremes = (coordinates: Coordinate[]): Extremes => {
  let extremeNorth = copy(coordinates[0]) as Coordinate;
  let extremeWest = copy(coordinates[0]) as Coordinate;
  let extremeEast = copy(coordinates[0]) as Coordinate;
  let extremeSouth = copy(coordinates[0]) as Coordinate;

  for (const vertice of coordinates) {
    const verticeCopy = copy(vertice);
    if (vertice[0] < extremeWest[0]) {
      extremeWest = verticeCopy;
    }
    if (vertice[0] > extremeEast[0]) {
      extremeEast = verticeCopy;
    }
    if (vertice[1] > extremeNorth[1]) {
      extremeNorth = verticeCopy;
    }
    if (vertice[1] < extremeSouth[1]) {
      extremeSouth = verticeCopy;
    }
  }

  return { north: extremeNorth, west: extremeWest, east: extremeEast, south: extremeSouth };
};

export const getCenterFromExtremes = (extremes: Extremes): Coordinate => [(extremes.west[0] + extremes.east[0]) / 2, (extremes.south[1] + extremes.north[1]) / 2];

export const swapXY = (coordinates: Coordinate): Coordinate => [coordinates[1], coordinates[0]];
