import { describe, expect, it } from "vitest";
import { deepMerge, getPath, pickKeys, removeKeys, setPath, unsetPath } from "./objectUtils";

describe("getPath", () => {
  it("reads a nested value from a dotted path", () => {
    const source = { matrikkelnummer: { gardsnummer: "12" } };

    const value = getPath(source, "matrikkelnummer.gardsnummer");

    expect(value).toBe("12");
  });

  it("returns undefined when a segment of the path is missing", () => {
    const source = { matrikkelnummer: undefined };

    const value = getPath(source, "matrikkelnummer.gardsnummer");

    expect(value).toBeUndefined();
  });
});

describe("setPath", () => {
  it("creates intermediate objects along the path when they don't exist", () => {
    const target: Record<string, unknown> = {};

    setPath(target, "info.our-reference", "2026/123");

    expect(target).toEqual({ info: { "our-reference": "2026/123" } });
  });
});

describe("unsetPath", () => {
  it("removes only the value at the given path", () => {
    const target: Record<string, unknown> = { info: { "our-reference": "2026/123", paragraph: "13" } };

    unsetPath(target, "info.our-reference");

    expect(target).toEqual({ info: { paragraph: "13" } });
  });
});

describe("deepMerge", () => {
  it("recursively merges nested plain objects, with source overriding target leaves", () => {
    const target = { info: { sector: "IT", "our-reference": "old" } };
    const source = { info: { "our-reference": "new" } };

    const result = deepMerge(target, source);

    expect(result).toEqual({ info: { sector: "IT", "our-reference": "new" } });
  });

  it("keeps the target value when the source value is undefined", () => {
    const target = { name: "Original" };
    const source = { name: undefined };

    const result = deepMerge(target, source);

    expect(result.name).toBe("Original");
  });
});

describe("removeKeys", () => {
  it("strips the given keys without mutating the source object", () => {
    const source = { title: "Test", createdBy: "someone" };

    const result = removeKeys(source, ["createdBy"]);

    expect(result).toEqual({ title: "Test" });
    expect(source).toEqual({ title: "Test", createdBy: "someone" });
  });
});

describe("pickKeys", () => {
  it("keeps only the requested keys that are actually present", () => {
    const source = { name: "Test", description: "Desc", unrelated: "value" };

    const result = pickKeys(source, ["name", "description", "missing"]);

    expect(result).toEqual({ name: "Test", description: "Desc" });
  });
});
