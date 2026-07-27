import { AppError } from "$lib/errors/AppError";
import { removeKeys } from "$lib/objectUtils";
import type { MatrikkelUnit, Owner } from "$lib/types/dispatch.types";
import type { RawMatrikkelOwner } from "$lib/types/matrikkel.types";

type MatrikkelItem = Record<string, unknown> & {
  _type?: string;
  type?: string;
  value?: unknown;
  _namespace?: unknown;
};

/**
 * Attempts to get the type of a provided object returned from the Matrikkel API, if it is not flattened.
 */
export const getItemType = (item: MatrikkelItem | undefined): string => {
  if (!item) {
    return "unknown";
  }
  if (item._type) {
    return item._type;
  }
  if (item.type) {
    return item.type;
  }
  return "unknown";
};

/**
 * Attempts to get the real value of a property, e.g. { value: 'actual value' } returns 'actual value'.
 */
export const getItemValue = (item: MatrikkelItem | undefined): unknown => {
  if (!item) {
    return undefined;
  }
  if (item.value !== undefined) {
    return item.value;
  }

  const keys = Object.keys(item);
  if (keys.length === 1) {
    return item[keys[0] as string];
  }
  if (keys.length === 3 && item._type && item._namespace) {
    const key = keys.find((candidate) => candidate !== "$");
    if (key) {
      return item[key];
    }
  }

  return item;
};

export const getMatrikkelEnheterOwnerCentric = (matrikkelUnits: MatrikkelUnit[], matrikkelOwners: RawMatrikkelOwner[]): Owner[] => {
  if (!matrikkelUnits) {
    throw new AppError("MatrikkelEnheter missing", "No MatrikkelEnheter is provided");
  }
  if (!matrikkelOwners) {
    throw new AppError("matrikkelOwners missing", "No matrikkelOwners is provided");
  }

  const ownersByEierId: Record<string, Owner> = {};

  for (const unit of matrikkelUnits) {
    if (!unit.eierforhold) {
      continue;
    }

    for (const ownership of unit.eierforhold) {
      if (!ownership.eierId) {
        continue;
      }

      const owner = matrikkelOwners.find((candidate) => candidate.id.value === ownership.eierId);
      if (!owner) {
        throw new AppError("Kunne ikke finne eier til eierskap", `Eier med id ${ownership.eierId} kunne ikke finnes for ${unit.bruksnavn}`);
      }

      const existing = ownersByEierId[ownership.eierId];
      if (!existing) {
        ownersByEierId[ownership.eierId] = {
          ...owner,
          id: owner.id.value,
          ownerships: []
        };
      }

      ownersByEierId[ownership.eierId]?.ownerships.push({
        ...ownership,
        unit: removeKeys(unit, ["eierforhold"])
      });
    }
  }

  return Object.values(ownersByEierId);
};
