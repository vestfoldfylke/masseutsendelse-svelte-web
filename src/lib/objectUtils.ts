type PlainObject = Record<string, unknown>;

const isPlainObject = (value: unknown): value is PlainObject => typeof value === "object" && value !== null && !Array.isArray(value);

const toPathSegments = (path: string): string[] =>
  path
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .filter((segment) => segment.length > 0);

export const getPath = (source: unknown, path: string): unknown => {
  let current: unknown = source;
  for (const segment of toPathSegments(path)) {
    if (current === null || typeof current !== "object") {
      return undefined;
    }
    current = (current as PlainObject)[segment];
  }
  return current;
};

export const setPath = (target: PlainObject, path: string, value: unknown): void => {
  const segments = toPathSegments(path);
  let current = target;
  for (let i = 0; i < segments.length - 1; i++) {
    const segment = segments[i] as string;
    if (!isPlainObject(current[segment])) {
      current[segment] = {};
    }
    current = current[segment] as PlainObject;
  }

  const lastSegment = segments[segments.length - 1];
  if (lastSegment !== undefined) {
    current[lastSegment] = value;
  }
};

export const unsetPath = (target: PlainObject, path: string): void => {
  const segments = toPathSegments(path);
  let current: PlainObject | undefined = target;
  for (let i = 0; i < segments.length - 1; i++) {
    const segment = segments[i] as string;
    if (!isPlainObject(current[segment])) {
      return;
    }
    current = current[segment] as PlainObject;
  }

  const lastSegment = segments[segments.length - 1];
  if (current && lastSegment !== undefined) {
    delete current[lastSegment];
  }
};

/**
 * Mirrors lodash.merge's semantics closely enough for our use: source overwrites target at leaf
 * values, plain objects and arrays merge recursively, and a source value of undefined never
 * overwrites an existing target value.
 */
export const deepMerge = <T>(target: T, source: unknown): T => {
  if (source === undefined) {
    return target;
  }

  if (Array.isArray(target) && Array.isArray(source)) {
    const merged = [...target];
    source.forEach((sourceItem, index) => {
      merged[index] = deepMerge(merged[index], sourceItem);
    });
    return merged as unknown as T;
  }

  if (isPlainObject(target) && isPlainObject(source)) {
    const result: PlainObject = { ...target };
    for (const key of Object.keys(source)) {
      const sourceValue = source[key];
      if (sourceValue === undefined) {
        continue;
      }
      result[key] = deepMerge(result[key], sourceValue);
    }
    return result as T;
  }

  return source as T;
};

export const removeKeys = <T extends PlainObject>(source: T, keys: string[]): T => {
  const result = { ...source };
  for (const key of keys) {
    delete result[key];
  }
  return result;
};

export const pickKeys = <T extends PlainObject>(source: T, keys: string[]): Partial<T> => {
  const result: PlainObject = {};
  for (const key of keys) {
    if (source[key] !== undefined) {
      result[key] = source[key];
    }
  }
  return result as Partial<T>;
};
