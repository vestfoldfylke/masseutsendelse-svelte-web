<script lang="ts">
  import { fetchMatrikkelEnrichment, saveDispatch } from "$lib/client/dispatchApi";
  import { requestPdfPreview } from "$lib/client/templateApi";
  import DispatchEditor from "$lib/components/DispatchEditor.svelte";
  import { uiState } from "$lib/state/uiState.svelte";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
</script>

<div class="home">
  <div class="intro">
    <h2 class="ds-heading" data-size="lg">Masseutsendelse</h2>
    <p class="ds-paragraph text-center">
      Ett verktøy utviklet for Samferdsel og mobilitet sektoren.<br />
      Verktøyet lar deg laste opp en polygon-fil, gjøre oppslag i Matrikkelen og varsle alle eiere som befinner seg innenfor polygonet.
    </p>
    <div class="actions">
      <button type="button" class="ds-button" onclick={() => (uiState.isGuideModalOpen = true)}>Se mer</button>
      <a href="/utsendelser" class="ds-button">Alle utsendelser</a>
    </div>
  </div>

  <div class="editor-wrapper">
    <DispatchEditor
      templates={data.templates}
      onFetchMatrikkelData={fetchMatrikkelEnrichment}
      onSave={saveDispatch}
      onPreview={requestPdfPreview}
      onDownloadAttachment={() => {}}
    />
  </div>
</div>

<style>
  .home {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .intro {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .text-center {
    text-align: center;
    margin-top: 1rem;
  }

  .actions {
    display: flex;
    gap: 1rem;
    padding-top: 1rem;
  }

  .editor-wrapper {
    width: 100%;
    margin-top: 1rem;
  }
</style>
