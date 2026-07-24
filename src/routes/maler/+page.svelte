<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import { requestPdfPreview, saveTemplate } from "$lib/client/templateApi";
  import TemplateEditor from "$lib/components/TemplateEditor.svelte";
  import { prettifyDateTime } from "$lib/helpers";
  import { uiState } from "$lib/state/uiState.svelte";
  import type { Template } from "$lib/templates/types";
  import type { SortDirection } from "$lib/types/table.types";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();

  type TemplateFrontend = Omit<Template, "name" | "description"> & {
    name: string;
    description: string;
    createdTimestampReadable: string;
    modifiedTimestampReadable: string;
  };

  type SortName = "name"
    | "description"
    | "date";

  let sortBy: string = $state("name");
  let sortDirection: SortDirection = $state("ascending");
  let isShowEditor = $state(false);
  let activeTemplate: Template | undefined = $state(undefined);

  const getFrontendTemplate = (template: Template): TemplateFrontend => {
    if (!template.name || !template.description) {
      throw new Error("Template name and description is required");
    }

    return {
      ...template,
      name: template.name,
      description: template.description,
      createdTimestampReadable: prettifyDateTime(template.createdTimestamp),
      modifiedTimestampReadable: prettifyDateTime(template.modifiedTimestamp),
    };
  };

  let templates: TemplateFrontend[] = $derived.by(() => {
    return data.templates
      .map((template: Template) => getFrontendTemplate(template))
      .sort((a: TemplateFrontend, b: TemplateFrontend) => {
        switch (sortBy) {
          case "name":
            return sortDirection === "ascending"
              ? a.name.localeCompare(b.name)
              : b.name.localeCompare(a.name);
          case "description":
            return sortDirection === "ascending"
              ? a.description.localeCompare(b.description)
              : b.description.localeCompare(a.description);
          case "date": {
            if (!a.createdTimestamp || !b.createdTimestamp) {
              return 0;
            }

            const value: number = sortDirection === "ascending"
              ? Date.parse(a.createdTimestamp) - Date.parse(b.createdTimestamp)
              : Date.parse(b.createdTimestamp) - Date.parse(a.createdTimestamp);

            if (value < 0) {
              return -1;
            }

            if (value > 0) {
              return 1;
            }

            return 0;
          }
          default:
            return 0;
        }
      });
  });

  const openTemplateEditor = (template?: Template): void => {
    activeTemplate = template ? JSON.parse(JSON.stringify(template)) : {};
    isShowEditor = true;
  };

  const handleSaveTemplate = async (template: Template): Promise<void> => {
    try {
      await saveTemplate(template);
      await invalidateAll();
    } catch (err) {
      uiState.globalError = err as never;
    }
  };

  const reset = (): void => {
    isShowEditor = false;
    activeTemplate = undefined;
  };

  const previewTemplate = async (template: Template): Promise<void> => {
    try {
      uiState.previewPdfBase64 = await requestPdfPreview({ template });
    } catch (err) {
      uiState.globalError = err as never;
    }
  };

  const handleSortBy = (sortName: SortName): void => {
    sortBy = sortName;
    sortDirection = sortDirection === "descending" ? "ascending" : "descending";
  }
</script>

<div class="container">
  <div class="header-row">
    <h2 class="ds-heading" data-size="lg">Maler</h2>
    <button type="button" class="ds-button" onclick={() => openTemplateEditor()}>Ny mal</button>
  </div>

  <table class="ds-table shadow" data-hover>
    <thead>
      <tr>
        <th aria-sort={sortBy === "name" ? sortDirection : "none"}>
          <button type="button" onclick={() => handleSortBy("name")}>Navn</button>
        </th>
        <th aria-sort={sortBy === "description" ? sortDirection : "none"}>
          <button type="button" onclick={() => handleSortBy("description")}>Beskrivelse</button>
        </th>
        <th aria-sort={sortBy === "date" ? sortDirection : "none"}>
          <button type="button" onclick={() => handleSortBy("date")}>Dato</button>
        </th>
        <th>Handlinger</th>
      </tr>
    </thead>
    <tbody>
      {#each templates as template (template._id)}
        <tr>
          <td>{template.name}</td>
          <td>{template.description}</td>
          <td>
            <span class="ds-tag" data-color="neutral" data-size="sm">
              <button data-popover="inline" popoverTarget="template-{template._id}_date">{template.createdTimestampReadable}</button>
            </span>
            <div id="template-{template._id}_date" class="ds-popover" popover="auto" data-placement="top">
              <b>Opprettet</b><br />
              {template.createdTimestampReadable}<br />
              {template.createdBy}<br /><br />
              <b>Endret</b><br />
              {template.modifiedTimestampReadable}<br />
              {template.modifiedBy}
            </div>
          </td>
          <td class="actions">
            <button type="button" class="ds-button" data-variant="tertiary" data-icon onclick={() => openTemplateEditor(template)} aria-label="Rediger" title="Rediger">✏️</button>
            <button type="button" class="ds-button" data-variant="tertiary" data-icon onclick={() => previewTemplate(template)} aria-label="Forhåndsvisning" title="Forhåndsvisning">🔍</button>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

{#if isShowEditor}
  <dialog class="ds-dialog" data-placement="center" open onclose={reset}>
    <div class="dialog-header">
      <h2 class="ds-heading" data-size="md">{activeTemplate && activeTemplate._id ? "Rediger mal" : "Ny mal"}</h2>
    </div>

    <TemplateEditor template={activeTemplate} onSave={handleSaveTemplate} onPreview={requestPdfPreview} onSaved={reset} onClose={reset} />
  </dialog>
{/if}

<style>
  .container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
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
