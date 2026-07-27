<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import { fetchDispatchById, fetchMatrikkelEnrichment, saveDispatch, triggerAttachmentDownload } from "$lib/client/dispatchApi";
  import { requestPdfPreview } from "$lib/client/templateApi";
  import DispatchEditor from "$lib/components/DispatchEditor.svelte";
  import DispatchMap from "$lib/components/Map.svelte";
  import { prettifyDateTime } from "$lib/helpers";
  import { uiState } from "$lib/state/uiState.svelte";
  import type { Dispatch, DispatchStatus } from "$lib/types/dispatch.types";
  import type { SortDirection } from "$lib/types/table.types";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();

  type DispatchFrontend = Omit<Dispatch, "_id"> & {
    _id: string;
    actionName: string;
    createdTimestampReadable: string;
    modifiedTimestampReadable: string;
    statusReadable: string;
  };

  type SortName = "project" | "projectNumber" | "date" | "status" | "createdBy";

  const STATUS_COLORS: Record<DispatchStatus | "", string> = {
    approved: "#D0C788",
    notapproved: "#E7827E",
    completed: "#91B99F",
    inprogress: "#E0C38B",
    "": "#FF006F"
  };

  const STATUS_LABELS: Record<DispatchStatus | "", string> = {
    completed: "Fullført",
    inprogress: "Utsendelse Pågår",
    approved: "Godkjent",
    notapproved: "Under Behandling",
    "": "Ukjent 🤷‍♂️"
  };

  let search = $state("");
  let sortBy: string = $state("date");
  let sortDirection: SortDirection = $state("descending");
  let editedItem: DispatchFrontend | undefined = $state(undefined);
  let mapItem: DispatchFrontend | undefined = $state(undefined);

  const getFrontendDispatch = (dispatch: Dispatch): DispatchFrontend => {
    if (!dispatch._id) {
      throw new Error("_id missing");
    }

    return {
      ...dispatch,
      _id: dispatch._id,
      actionName: getEditActionName(dispatch),
      createdTimestampReadable: prettifyDateTime(dispatch.createdTimestamp),
      modifiedTimestampReadable: prettifyDateTime(dispatch.modifiedTimestamp),
      statusReadable: STATUS_LABELS[dispatch.status ?? ""]
    };
  };

  const sortFilteredDispatches = (dispatches: DispatchFrontend[]): DispatchFrontend[] => {
    return dispatches.sort((a: DispatchFrontend, b: DispatchFrontend) => {
      switch (sortBy) {
        case "project":
          return sortDirection === "ascending" ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
        case "projectNumber":
          return sortDirection === "ascending" ? a.projectnumber.localeCompare(b.projectnumber) : b.projectnumber.localeCompare(a.projectnumber);
        case "date": {
          if (!a.createdTimestamp || !b.createdTimestamp) {
            return 0;
          }

          const value: number = sortDirection === "ascending" ? Date.parse(a.createdTimestamp) - Date.parse(b.createdTimestamp) : Date.parse(b.createdTimestamp) - Date.parse(a.createdTimestamp);

          if (value < 0) {
            return -1;
          }

          if (value > 0) {
            return 1;
          }

          return 0;
        }
        case "status":
          return sortDirection === "ascending" ? a.statusReadable.localeCompare(b.statusReadable) : b.statusReadable.localeCompare(a.statusReadable);
        case "createdBy": {
          if (!a.createdBy || !b.createdBy) {
            return 0;
          }

          return sortDirection === "ascending" ? a.createdBy.localeCompare(b.createdBy) : b.createdBy.localeCompare(a.createdBy);
        }
        default:
          return 0;
      }
    });
  };

  const filteredDispatches: DispatchFrontend[] = $derived.by(() => {
    if (!search) {
      return sortFilteredDispatches(data.dispatches.map<DispatchFrontend>((dispatch: Dispatch) => getFrontendDispatch(dispatch)));
    }

    const term = search.toUpperCase();
    return sortFilteredDispatches(
      data.dispatches
        .map((dispatch: Dispatch) => getFrontendDispatch(dispatch))
        .filter((dispatch: DispatchFrontend) => Object.values(dispatch).some((value) => value !== undefined && value !== null && String(value).toUpperCase().includes(term)))
    );
  });

  const editItem = async (item: DispatchFrontend): Promise<void> => {
    uiState.loadingModal = { title: "Laster utsendelsen" };
    try {
      editedItem = getFrontendDispatch(await fetchDispatchById(item._id));
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
  };

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

  const getEditActionName = (dispatch: Dispatch): string => {
    if (!dispatch.status) {
      return "Vis";
    }

    return ["approved", "notapproved"].includes(dispatch.status) ? "Rediger" : "Vis";
  };

  const handleSortBy = (sortName: SortName): void => {
    sortBy = sortName;
    sortDirection = sortDirection === "descending" ? "ascending" : "descending";
  };
</script>

<div class="container">
  <h2 class="ds-heading" data-size="lg">Utsendelser</h2>

  <div class="ds-field search-field">
    <input id="dispatch-search" class="ds-input" bind:value={search} placeholder="Søk i tabell" />
  </div>

  <table class="ds-table shadow" data-hover>
    <thead>
      <tr>
        <th aria-sort={sortBy === "project" ? sortDirection : "none"}>
          <button type="button" onclick={() => handleSortBy("project")}>Prosjekt</button>
        </th>
        <th aria-sort={sortBy === "projectNumber" ? sortDirection : "none"}>
          <button type="button" onclick={() => handleSortBy("projectNumber")}>Prosjekt Nr</button>
        </th>
        <th aria-sort={sortBy === "date" ? sortDirection : "none"}>
          <button type="button" onclick={() => handleSortBy("date")}>Dato</button>
        </th>
        <th aria-sort={sortBy === "status" ? sortDirection : "none"}>
          <button type="button" onclick={() => handleSortBy("status")}>Status</button>
        </th>
        <th aria-sort={sortBy === "createdBy" ? sortDirection : "none"}>
          <button type="button" onclick={() => handleSortBy("createdBy")}>Saksbehandler</button>
        </th>
        <th>Handlinger</th>
      </tr>
    </thead>
    <tbody>
      {#each filteredDispatches as item (item._id)}
        <tr>
          <td>{item.title}</td>
          <td>{item.projectnumber}</td>
          <td>
            <span class="ds-tag" data-color="neutral" data-size="sm">
              <button data-popover="inline" popoverTarget="dispatch-{item._id}_date">{item.createdTimestampReadable}</button>
            </span>
            <div id="dispatch-{item._id}_date" class="ds-popover" popover="auto" data-placement="top">
              <b>Opprettet</b><br />
              {item.createdTimestampReadable}<br />
              {item.createdBy}<br /><br />
              <b>Endret</b><br />
              {item.modifiedTimestampReadable}<br />
              {item.modifiedBy}
            </div>
          </td>
          <td>
            <span class="ds-tag" style="background-color: {STATUS_COLORS[item.status ?? ""]};">
              {item.statusReadable}
            </span>
          </td>
          <td>{item.createdBy}</td>
          <td class="actions">
            <button type="button" class="ds-button" data-variant="tertiary" data-icon onclick={() => editItem(item)} aria-label={item.actionName} data-tooltip={item.actionName}>✏️</button>
            <button type="button" class="ds-button" data-variant="tertiary" data-icon disabled={!item.template?._id} onclick={() => previewPdf(item)} aria-label="Forhåndsvisning" data-tooltip="Forhåndsvisning">🔍</button>
            <button type="button" class="ds-button" data-variant="tertiary" data-icon onclick={() => (mapItem = item)} aria-label="Se kart" data-tooltip="Se kart">🗺️</button>
            <button type="button" class="ds-button" data-variant="tertiary" data-icon disabled={!item.archiveUrl} onclick={() => openArchiveUrl(item.archiveUrl)} aria-label="Se arkiv" data-tooltip="Se arkiv">🗄️</button>
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
  <dialog class="ds-dialog" data-placement="center" id="dispatch-modal" open onclose={() => (editedItem = undefined)}>
    <div class="dialog-header">
      <h2 class="ds-heading" data-size="md">{editedItem.actionName} utsendelse</h2>
      <button class="ds-button close-dialog-button" data-icon="true" data-variant="tertiary" type="button" aria-label="Lukk dialogvindu" data-color="neutral" command="close" commandfor="dispatch-modal"></button>
    </div>

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
  <dialog class="ds-dialog" data-placement="center" id="map-modal" open onclose={() => (mapItem = undefined)}>
    <div class="dialog-header">
      <h2 class="ds-heading" data-size="md">Kart</h2>
      <button class="ds-button close-dialog-button" data-icon="true" data-variant="tertiary" type="button" aria-label="Lukk dialogvindu" data-color="neutral" command="close" commandfor="map-modal"></button>
    </div>

    <DispatchMap polygons={mapItem.polygons} height="60vh" />
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
