<script lang="ts">
  import { exportOwnersToCsv } from "$lib/dispatch/exportOwners";
  import type { Dispatch, Owner } from "$lib/types/dispatch.types";
  import Loading from "../Loading.svelte";
  import DispatchMap from "../Map.svelte";
  import MatrikkelOwnerTable from "../MatrikkelOwnerTable.svelte";
  import StatCards from "../StatCards.svelte";

  type Props = {
    dispatch: Dispatch;
    mode: "new" | "edit";
    isReadOnly: boolean;
    isMatrikkelApproved: boolean;
    isContactingMatrikkel: boolean;
    matrikkelLoadingMessage?: string;
    matrikkelLoadingSubmessage?: string;
    matrikkelLoadingSubsubmessage?: string;
    onFetchMatrikkelData: () => void;
    onReset: () => void;
    onExcludeOwner: (owner: Owner) => void;
    onIncludeOwner: (owner: Owner) => void;
    onExclusionReasonChange: (owner: Owner, value: string) => void;
    onMatrikkelApprovedChange: (approved: boolean) => void;
  };

  let {
    dispatch,
    mode,
    isReadOnly,
    isMatrikkelApproved,
    isContactingMatrikkel,
    matrikkelLoadingMessage,
    matrikkelLoadingSubmessage,
    matrikkelLoadingSubsubmessage,
    onFetchMatrikkelData,
    onReset,
    onExcludeOwner,
    onIncludeOwner,
    onExclusionReasonChange,
    onMatrikkelApprovedChange
  }: Props = $props();

  const isAllRequiredMatrikkelInfoRetrieved = $derived(dispatch.stats.affectedCount !== null && dispatch.stats.totalOwners !== null);

  const statsCards = $derived.by(() => {
    const cards: Array<{ text: string; value: string | number }> = [];
    if (dispatch.stats.affectedCount) {
      cards.push({ text: "Enheter", value: dispatch.stats.affectedCount });
    }
    if (dispatch.stats.totalOwners) {
      cards.push({ text: "Alle eiere", value: dispatch.stats.totalOwners });
    }
    if (dispatch.stats.businessOwners) {
      cards.push({ text: "Juridiske eiere", value: dispatch.stats.businessOwners });
    }
    if (dispatch.stats.privateOwners) {
      cards.push({ text: "Private eiere", value: dispatch.stats.privateOwners });
    }
    return cards;
  });

  const exportOwners = (): void => {
    exportOwnersToCsv(dispatch.owners, dispatch.excludedOwners, dispatch.matrikkelUnitsWithoutOwners, dispatch.title);
  };
</script>

<div class="matrikkel-panel">
  <DispatchMap polygons={dispatch.polygons} />

  {#if !isAllRequiredMatrikkelInfoRetrieved && !isContactingMatrikkel}
    <div class="centered-column">
      <button type="button" class="ds-button" onclick={onFetchMatrikkelData}>Hent matrikkelinformasjon</button>
      {#if !isMatrikkelApproved}
        <button type="button" class="ds-button" data-variant="secondary" onclick={onReset}>Angre</button>
      {/if}
    </div>
  {:else if isContactingMatrikkel}
    <div class="shadow contacting">
      <Loading title="Kontakter matrikkelen" message={matrikkelLoadingMessage} submessage={matrikkelLoadingSubmessage} subsubmessage={matrikkelLoadingSubsubmessage} />
    </div>
  {:else}
    <div class="centered-column results">
      {#if statsCards.length > 0}
        <StatCards items={statsCards} />
      {/if}

      {#if dispatch.status === "completed"}
        <div>
          <h2>
            Utsendelsen er ferdigstilt. Eiere og mottakere er fjernet av personvernhensyn. <br />
            For å se disse kan du trykke på "Åpne Arkiv" og navigere til "Kontakter"
          </h2>
        </div>
      {:else}
        {#if dispatch.owners.length > 0}
          <div class="full-width">
            <h2>Eiere / Mottakere</h2>
            <MatrikkelOwnerTable items={dispatch.owners} disableInputs={isReadOnly} onExclude={onExcludeOwner} />
          </div>
        {/if}
        {#if dispatch.excludedOwners.length > 0}
          <div class="full-width">
            <h2>Ekskluderte mottakere</h2>
            <MatrikkelOwnerTable type="excluded" items={dispatch.excludedOwners} disableInputs={isReadOnly} onInclude={onIncludeOwner} {onExclusionReasonChange} />
          </div>
        {/if}
        {#if dispatch.matrikkelUnitsWithoutOwners.length > 0}
          <div class="full-width">
            <h2>Matrikkelenheter uten eierforhold</h2>
            <table class="ds-table shadow">
              <thead>
                <tr>
                  <th>Bruksnavn</th>
                  <th>Type</th>
                  <th>Kommune</th>
                  <th>Gnr</th>
                  <th>Bnr</th>
                  <th>Fnr</th>
                  <th>Etableringsdato</th>
                </tr>
              </thead>
              <tbody>
                {#each dispatch.matrikkelUnitsWithoutOwners as unit, i (unit.id?.value ?? i)}
                  <tr>
                    <td>{unit.bruksnavn}</td>
                    <td>{unit._type}</td>
                    <td>{unit.matrikkelnummer?.kommuneId}</td>
                    <td>{unit.matrikkelnummer?.gardsnummer}</td>
                    <td>{unit.matrikkelnummer?.bruksnummer}</td>
                    <td>{unit.matrikkelnummer?.festenummer}</td>
                    <td>{unit.etableringsdato}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
        {#if dispatch.owners.length > 0}
          <div class="full-width centered-column">
            <button type="button" class="ds-button" onclick={exportOwners}>Eksporter eierforhold til CSV</button>
          </div>
        {/if}
      {/if}

      {#if mode === "new"}
        <div class="centered-column">
          {#if !isMatrikkelApproved}
            <button type="button" class="ds-button" data-variant="secondary" onclick={onReset}>Angre</button>
          {/if}
          {#if dispatch.stats.affectedCount}
            <div class="ds-field">
              <input
                type="checkbox"
                class="ds-input"
                id="matrikkel-approved"
                checked={isMatrikkelApproved}
                disabled={isMatrikkelApproved}
                onchange={(event) => onMatrikkelApprovedChange(event.currentTarget.checked)}
              />
              <label class="ds-label" for="matrikkel-approved">Matrikkelinformasjonen ser korrekt ut</label>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .matrikkel-panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    width: 100%;
  }

  .centered-column {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .results {
    width: 100%;
    max-width: 1200px;
  }

  .full-width {
    width: 100%;
  }

  .contacting {
    padding: 1rem;
    border-radius: 20px;
    background-color: #cfebf2;
  }

  .shadow {
    box-shadow: 0 1px 5px 1px #888888;
  }
</style>
