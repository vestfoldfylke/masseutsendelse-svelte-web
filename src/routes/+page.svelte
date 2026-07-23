<script lang="ts">
  import { fetchMatrikkelEnrichment, saveDispatch } from "$lib/client/dispatchApi";
  import { requestPdfPreview } from "$lib/client/templateApi";
  import DispatchEditor from "$lib/components/DispatchEditor.svelte";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
</script>

<div class="home">
  <div class="intro">
    <p class="ds-paragraph info-container">
      Ett verktøy utviklet for Samferdsel og mobilitet sektoren.<br />
      Verktøyet lar deg laste opp en polygon-fil, gjøre oppslag i Matrikkelen og varsle alle eiere som befinner seg innenfor polygonet.
    </p>
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
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .info-container {
    width: 100%;
    margin-top: 1rem;
  }

  .editor-wrapper {
    width: 100%;
    margin-top: 3rem;
  }
</style>
