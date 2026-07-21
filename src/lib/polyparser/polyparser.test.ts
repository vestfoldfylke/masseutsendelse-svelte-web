import { describe, expect, it } from "vitest";
import { getCenterFromExtremes, getExtremes, guessEpsgCodeAndOrder, swapXY } from "./polyparser";

describe("guessEpsgCodeAndOrder", () => {
  it("detects WGS84 (EPSG:4326) coordinates in lat/lng order", () => {
    const result = guessEpsgCodeAndOrder([59.2654381, 10.4159352]);

    expect(result?.code).toBe("4326");
  });

  it("detects EUREF89 UTM zone 32 (EPSG:25832) coordinates", () => {
    const result = guessEpsgCodeAndOrder([550000, 6600000]);

    expect(result?.code).toBe("25832");
  });

  it("returns undefined for coordinates outside every known range", () => {
    const result = guessEpsgCodeAndOrder([99999999, 99999999]);

    expect(result).toBeUndefined();
  });
});

describe("swapXY", () => {
  it("swaps the two coordinate values", () => {
    const result = swapXY([10.4159352, 59.2654381]);

    expect(result).toEqual([59.2654381, 10.4159352]);
  });
});

describe("getExtremes", () => {
  it("finds the north/west/east/south-most vertices of a polygon", () => {
    const vertices: Array<[number, number]> = [
      [4, -8],
      [10, 1],
      [3, 10],
      [-5, 2]
    ];

    const extremes = getExtremes(vertices);

    expect(extremes).toEqual({ north: [3, 10], west: [-5, 2], east: [10, 1], south: [4, -8] });
  });
});

describe("getCenterFromExtremes", () => {
  it("averages the west/east and south/north extremes into a center point", () => {
    const center = getCenterFromExtremes({ north: [5, 10], west: [0, 5], east: [10, 5], south: [5, 0] });

    expect(center).toEqual([5, 5]);
  });
});
