<script lang="ts">
  import type { Andel, Owner } from "$lib/types/dispatch.types";

  type OwnerTableType = "included" | "excluded";

  type Props = {
    type?: OwnerTableType;
    items: Owner[];
    disableInputs?: boolean;
    onExclude?: (owner: Owner) => void;
    onInclude?: (owner: Owner) => void;
    onExclusionReasonChange?: (owner: Owner, value: string) => void;
  };

  let { type = "included", items, disableInputs = false, onExclude, onInclude, onExclusionReasonChange }: Props = $props();

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

  const formatType = (value: string | undefined): string => {
    if (!value) {
      return "";
    }
    return value.toLowerCase().includes("juridisk") ? "🏢 Juridisk" : "🏠 Privat";
  };

  const formatShare = (andel: Andel | undefined): string => {
    if (!andel?.teller || !andel?.nevner) {
      return "";
    }
    return `${andel.teller} / ${andel.nevner} (${(andel.teller / andel.nevner) * 100}%)`;
  };

  const getPostAddress = (owner: Owner): string => {
    if (owner.dsf) {
      return `${owner.dsf.ADR ?? ""} ${owner.dsf.POSTN ?? ""} ${owner.dsf.POSTS ?? ""}`.trim();
    }
    if (owner.brreg?.postadresse) {
      const address = owner.brreg.postadresse;
      return `${address.adresse ?? ""} ${address.postnummer ?? ""} ${address.poststed ?? ""}`.trim();
    }

    let address = "";
    if (owner.postadresse?.adresselinje) {
      address += `${owner.postadresse.adresselinje} `;
    }
    if (owner.postadresse?.adresselinje1) {
      address += `${owner.postadresse.adresselinje1} `;
    }
    if (owner.postadresse?.adresselinje2) {
      address += `${owner.postadresse.adresselinje2} `;
    }
    if (owner.postadresse?.adresselinje3) {
      address += `${owner.postadresse.adresselinje3} `;
    }
    return `${address}(Matrikkel)`.trim();
  };

  const exclude = (owner: Owner): void => {
    if (!confirm("Er du helt sikker på at eieren skal ekskluderes?")) {
      return;
    }
    onExclude?.(owner);
  };

  const include = (owner: Owner): void => {
    if (!confirm("Er du helt sikker på at eieren skal inkluderes?")) {
      return;
    }
    onInclude?.(owner);
  };
</script>

<table class="ds-table shadow" data-hover>
  <thead>
    <tr>
      <th aria-label="Utvid"></th>
      <th>Navn</th>
      <th>Type</th>
      <th>Antall eierskap</th>
      <th>Postadresse</th>
      {#if type === "excluded"}
        <th>Ekskluderingsgrunn</th>
      {/if}
      <th>Handlinger</th>
    </tr>
  </thead>
  <tbody>
    {#each items as owner (owner.id)}
      <tr>
        <td>
          <button type="button" class="ds-button" data-variant="tertiary" data-size="sm" onclick={() => toggle(owner.id)} aria-expanded={expandedKeys.has(owner.id)}>
            {expandedKeys.has(owner.id) ? "▾" : "▸"}
          </button>
        </td>
        <td>{owner.navn}</td>
        <td>{formatType(owner._type)}</td>
        <td>{owner.ownerships.length}</td>
        <td>{getPostAddress(owner)}</td>
        {#if type === "excluded"}
          <td>
            {#if !owner.isHardExcluded}
              <input class="ds-input" value={owner.exclusionReason ?? ""} oninput={(event) => onExclusionReasonChange?.(owner, event.currentTarget.value)} />
            {:else}
              {owner.exclusionReason}
            {/if}
          </td>
        {/if}
        <td>
          {#if type === "included"}
            <button type="button" class="ds-button" data-variant="tertiary" data-icon disabled={disableInputs} onclick={() => exclude(owner)} aria-label="Ekskluder eier">➖</button>
          {:else}
            <button type="button" class="ds-button" data-variant="tertiary" data-icon disabled={disableInputs || owner.isHardExcluded} onclick={() => include(owner)} aria-label="Inkluder eier">➕</button>
          {/if}
        </td>
      </tr>
      {#if expandedKeys.has(owner.id)}
        <tr class="expanded-row">
          <td colspan={type === "excluded" ? 7 : 6}>
            <div class="owner-detail">
              {#if owner._type?.toLowerCase().includes("juridisk")}
                <span>Organisasjonsnummer: {owner.nummer}</span>
              {:else}
                <span>Personnummer: {owner.nummer}</span>
              {/if}
            </div>
            <h3 class="ds-heading center-text" data-size="sm">Eierforhold</h3>
            <table class="ds-table inner-table">
              <thead>
                <tr>
                  <th>Bruksnavn</th>
                  <th>Fra dato</th>
                  <th>Kommune</th>
                  <th>Gnr</th>
                  <th>Bnr</th>
                  <th>Fnr</th>
                  <th>Type</th>
                  <th>Andel</th>
                </tr>
              </thead>
              <tbody>
                {#if owner.ownerships.length > 0}
                  {#each owner.ownerships as ownership, j (j)}
                    <tr>
                      <td>{ownership.unit?.bruksnavn}</td>
                      <td>{ownership.datoFra}</td>
                      <td>{ownership.unit?.matrikkelnummer?.kommuneId}</td>
                      <td>{ownership.unit?.matrikkelnummer?.gardsnummer}</td>
                      <td>{ownership.unit?.matrikkelnummer?.bruksnummer}</td>
                      <td>{ownership.unit?.matrikkelnummer?.festenummer}</td>
                      <td>{formatType(ownership._type)}</td>
                      <td>{formatShare(ownership.andel)}</td>
                    </tr>
                  {/each}
                {:else}
                  <tr>
                    <td colspan="8" class="no-owner-data">No data available</td>
                  </tr>
                {/if}
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

  .owner-detail {
    text-align: left;
  }

  .expanded-row {
    background-color: #f5f5f5;
  }

  .ds-table > tbody > tr:last-child > td {
    border-bottom: 0;
  }

  .inner-table {
    margin-bottom: 1rem;
  }

  .no-owner-data, .center-text {
    text-align: center;
  }

  .no-owner-data {
    padding-top: 2rem;
  }
</style>
