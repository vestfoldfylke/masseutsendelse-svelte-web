<script lang="ts">
  import { requestPdfPreview, saveTemplate } from "$lib/client/templateApi";
  import TemplateEditor from "$lib/components/TemplateEditor.svelte";
  import { uiState } from "$lib/state/uiState.svelte";
  import type { Template } from "$lib/templates/types";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();

  let isShowEditor = $state(false);
  let activeTemplate: Template | undefined = $state(undefined);

  const openTemplateEditor = (template?: Template): void => {
    activeTemplate = template ? JSON.parse(JSON.stringify(template)) : {};
    isShowEditor = true;
  };

  const reset = (): void => {
    isShowEditor = false;
    activeTemplate = undefined;
  };

  const previewTemplate = async (template: Template): Promise<void> => {
    try {
      const base64 = await requestPdfPreview({ template });
      uiState.previewPdfBase64 = base64;
    } catch (err) {
      uiState.globalError = err as never;
    }
  };
</script>

<div class="container">
  <div class="header-row">
    <h2 class="ds-heading" data-size="lg">Maler</h2>
    <button type="button" class="ds-button" onclick={() => openTemplateEditor()}>Ny mal</button>
  </div>

  <table class="ds-table shadow" data-hover>
    <thead>
      <tr>
        <th>Navn</th>
        <th>Beskrivelse</th>
        <th>Handlinger</th>
      </tr>
    </thead>
    <tbody>
      {#each data.templates as template (template._id)}
        <tr>
          <td>{template.name}</td>
          <td>{template.description}</td>
          <td class="actions">
            <button type="button" class="ds-button" data-variant="tertiary" data-icon onclick={() => previewTemplate(template)} aria-label="Forhåndsvisning" title="Forhåndsvisning">🔍</button>
            <button type="button" class="ds-button" data-variant="tertiary" data-icon onclick={() => openTemplateEditor(template)} aria-label="Rediger" title="Rediger">✏️</button>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

{#if isShowEditor}
  <dialog class="ds-dialog" data-placement="center" open onclose={reset}>
    <h2 class="ds-heading" data-size="md">Endre mal</h2>
    <TemplateEditor template={activeTemplate} onSave={saveTemplate} onPreview={requestPdfPreview} onSaved={reset} onClose={reset} />
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
</style>
