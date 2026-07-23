<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import { fetchDispatchById, fetchMatrikkelEnrichment, saveDispatch, triggerAttachmentDownload } from "$lib/client/dispatchApi";
  import { requestPdfPreview } from "$lib/client/templateApi";
  import DispatchEditor from "$lib/components/DispatchEditor.svelte";
  import DispatchMap from "$lib/components/Map.svelte";
  import type { Dispatch } from "$lib/dispatch/types";
  import { uiState } from "$lib/state/uiState.svelte";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();

  const STATUS_COLORS: Record<string, string> = {
    approved: "#D0C788",
    notapproved: "#E7827E",
    completed: "#91B99F",
    inprogress: "#E0C38B"
  };

  const STATUS_LABELS: Record<string, string> = {
    completed: "Fullført",
    inprogress: "Utsendelse Pågår",
    approved: "Godkjent",
    notapproved: "Under Behandling"
  };

  let search = $state("");
  let editedItem: Dispatch | undefined = $state(undefined);
  let mapItem: Dispatch | undefined = $state(undefined);

  const formatDateString = (dateString: string | undefined): string => {
    if (!dateString) {
      return "";
    }

    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const hour = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${day}.${month}.${date.getFullYear()} - ${hour}:${minutes}`;
    } catch {
      return dateString;
    }
  };

  const filteredDispatches = $derived.by(() => {
    if (!search) {
      return data.dispatches;
    }

    const term = search.toUpperCase();
    return data.dispatches.filter((dispatch) => {
      const searchable = {
        ...dispatch,
        status: STATUS_LABELS[dispatch.status ?? ""] ?? dispatch.status,
        createdTimestamp: formatDateString((dispatch as Dispatch & { createdTimestamp?: string }).createdTimestamp)
      };
      return Object.values(searchable).some((value) => value !== undefined && value !== null && String(value).toUpperCase().includes(term));
    });
  });

  const editItem = async (item: Dispatch & { _id: string }): Promise<void> => {
    uiState.loadingModal = { title: "Laster utsendelsen" };
    try {
      editedItem = await fetchDispatchById(item._id);
    } catch (err) {
      uiState.globalError = err as never;
    } finally {
      uiState.loadingModal = undefined;
    }
  };

  const handleSaveDispatch = async (dispatch: Dispatch): Promise<void> => {
    try {
      await saveDispatch(dispatch);
      await invalidateAll();
    } catch (err) {
      uiState.globalError = err as never;
    }
  }

  const previewPdf = async (item: Dispatch): Promise<void> => {
    try {
      uiState.previewPdfBase64 = await requestPdfPreview({
        attachments: item.attachments,
        createdByDepartment: item.createdByDepartment,
        archivenumber: item.archivenumber,
        createdBy: item.createdBy,
        template: item.template
      });
    } catch (err) {
      uiState.globalError = err as never;
    }
  };

  const openArchiveUrl = (url: string | undefined): void => {
    if (url) {
      window.open(url, "_blank");
    }
  };
</script>

<div class="container">
  <h2 class="ds-heading" data-size="lg">Utsendelser</h2>

  <div class="ds-field search-field">
    <label class="ds-label" for="dispatch-search">Søk i tabell</label>
    <input id="dispatch-search" class="ds-input" bind:value={search} placeholder="Søk i tabell" />
  </div>

  <table class="ds-table shadow" data-hover>
    <thead>
      <tr>
        <th>Prosjekt</th>
        <th>Prosjekt Nr</th>
        <th>Dato</th>
        <th>Status</th>
        <th>Saksbehandler</th>
        <th>Handlinger</th>
      </tr>
    </thead>
    <tbody>
      {#each filteredDispatches as item (item._id)}
        <tr>
          <td>{item.title}</td>
          <td>{item.projectnumber}</td>
          <td>{formatDateString((item as Dispatch & { createdTimestamp?: string }).createdTimestamp)}</td>
          <td>
            <span class="ds-tag" style="background-color: {STATUS_COLORS[item.status ?? ''] ?? '#ffffff'};">
              {STATUS_LABELS[item.status ?? ""] ?? item.status}
            </span>
          </td>
          <td>{item.createdBy}</td>
          <td class="actions">
            <button type="button" class="ds-button" data-variant="tertiary" data-icon onclick={() => editItem(item as Dispatch & { _id: string })} aria-label="Rediger" title="Rediger">✏️</button>
            <button type="button" class="ds-button" data-variant="tertiary" data-icon disabled={!item.template?._id} onclick={() => previewPdf(item)} aria-label="Forhåndsvisning" title="Forhåndsvisning">🔍</button>
            <button type="button" class="ds-button" data-variant="tertiary" data-icon onclick={() => (mapItem = item)} aria-label="Se kart" title="Se kart">🗺️</button>
            <button type="button" class="ds-button" data-variant="tertiary" data-icon disabled={!item.archiveUrl} onclick={() => openArchiveUrl(item.archiveUrl)} aria-label="Se arkiv" title="Se arkiv">🗄️</button>
          </td>
        </tr>
      {:else}
        <tr>
          <td colspan="6">Vi klarte ikke å finne noe i tabellen som matcher "{search}".</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

{#if editedItem}
  <dialog class="ds-dialog" data-placement="center" open onclose={() => (editedItem = undefined)}>
    <h2 class="ds-heading" data-size="md">Rediger</h2>
    <DispatchEditor
      bind:dispatch={editedItem}
      templates={data.templates}
      onFetchMatrikkelData={fetchMatrikkelEnrichment}
      onSave={handleSaveDispatch}
      onPreview={requestPdfPreview}
      onDownloadAttachment={(file) => (editedItem?._id ? triggerAttachmentDownload(editedItem._id, file.name) : undefined)}
      onSaved={() => (editedItem = undefined)}
      onClose={() => (editedItem = undefined)}
    />
  </dialog>
{/if}

{#if mapItem}
  <dialog class="ds-dialog" data-placement="center" open onclose={() => (mapItem = undefined)}>
    <h2 class="ds-heading" data-size="md">Kart</h2>
    <DispatchMap polygons={mapItem.polygons} height="60vh" />
    <button type="button" class="ds-button" data-variant="secondary" onclick={() => (mapItem = undefined)}>Lukk</button>
  </dialog>
{/if}

<style>
  .container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .search-field {
    max-width: 300px;
    align-self: flex-end;
  }

  .shadow {
    box-shadow: 0 1px 5px 1px #888888;
  }

  .actions {
    display: flex;
    gap: 0.3rem;
  }

  dialog[open] {
    width: 80vw;
    height: 80vh;
    max-width: 80vw;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
  }
</style>
