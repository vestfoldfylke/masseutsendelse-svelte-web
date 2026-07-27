<script lang="ts">
  import { getPath } from "$lib/objectUtils";
  import type { Andel, MatrikkelUnit } from "$lib/types/dispatch.types";

  type Props = {
    items: MatrikkelUnit[];
  };

  let { items }: Props = $props();

  let expandedKeys = $state(new Set<string>());

  const toggle = (key: string): void => {
    const next = new Set(expandedKeys);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    expandedKeys = next;
  };

  const formatType = (type: string | undefined): string => {
    if (!type) {
      return "";
    }
    return type.toLowerCase().includes("juridisk") ? "🏢 Juridisk" : "🏠 Privat";
  };

  const formatShare = (andel: Andel | undefined): string => {
    if (!andel?.teller || !andel?.nevner) {
      return "";
    }
    return `${andel.teller} / ${andel.nevner} (${(andel.teller / andel.nevner) * 100}%)`;
  };

  const ADDRESS_LINES = ["adresselinje1", "adresselinje2", "adresselinje3", "adresselinje4", "adresselinje5"];
</script>

<table class="ds-table shadow" data-hover>
  <thead>
    <tr>
      <th aria-label="Utvid"></th>
      <th>Bruksnavn</th>
      <th>Type</th>
      <th>Gårds #</th>
      <th>Bruks #</th>
      <th>Feste #</th>
      <th>Kommune ID</th>
      <th>Areal</th>
    </tr>
  </thead>
  <tbody>
    {#each items as item, i (item.bruksnavn ?? i)}
      {@const key = String(item.bruksnavn ?? i)}
      <tr>
        <td>
          <button type="button" class="ds-button" data-variant="tertiary" data-size="sm" onclick={() => toggle(key)} aria-expanded={expandedKeys.has(key)}>
            {expandedKeys.has(key) ? "▾" : "▸"}
          </button>
        </td>
        <td>{item.bruksnavn}</td>
        <td>{formatType(item._type)}</td>
        <td>{getPath(item, "matrikkelnummer.gardsnummer")}</td>
        <td>{getPath(item, "matrikkelnummer.bruksnummer")}</td>
        <td>{getPath(item, "matrikkelnummer.festenummer")}</td>
        <td>{getPath(item, "matrikkelnummer.kommuneId")}</td>
        <td>{item.historiskOppgittAreal}</td>
      </tr>
      {#if expandedKeys.has(key)}
        <tr>
          <td colspan="8">
            <h3 class="ds-heading" data-size="xs">Eierforhold</h3>
            <table class="ds-table">
              <thead>
                <tr>
                  <th>Dato fra</th>
                  <th>Type</th>
                  <th>Eier</th>
                  <th>Org-/Person-nummer</th>
                  <th>Postadresse</th>
                  <th>Andel</th>
                </tr>
              </thead>
              <tbody>
                {#each item.eierforhold ?? [] as ownership, j (j)}
                  <tr>
                    <td>{ownership.datoFra}</td>
                    <td>{formatType(ownership._type)}</td>
                    <td>{getPath(ownership, "eier.navn")}</td>
                    <td>{getPath(ownership, "eier.nummer")}</td>
                    <td>
                      {#each ADDRESS_LINES as line (line)}
                        {@const value = getPath(ownership, `eier.postadresse.${line}`)}
                        {#if value}<div>{value}</div>{/if}
                      {/each}
                    </td>
                    <td>{formatShare(ownership.andel)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </td>
        </tr>
      {/if}
    {/each}
  </tbody>
</table>

<style>
  .shadow {
    box-shadow: 0 1px 5px 1px #888888;
  }
</style>
