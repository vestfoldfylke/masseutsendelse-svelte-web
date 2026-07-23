<script lang="ts">
  import "../app.css";
  import "@digdir/designsystemet-web";
  import ErrorModal from "$lib/components/errors/ErrorModal.svelte";
  import GuideModal from "$lib/components/GuideModal.svelte";
  import Header from "$lib/components/Header.svelte";
  import LoadingModal from "$lib/components/modals/LoadingModal.svelte";
  import PdfPreviewModal from "$lib/components/modals/PdfPreviewModal.svelte";
  import { uiState } from "$lib/state/uiState.svelte";
  import type { LayoutProps } from "./$types";

  let { data, children }: LayoutProps = $props();
</script>

<div id="app">
  {#if data.user}
    <header>
      <div class="container">
        <Header user={data.user} />
      </div>
    </header>
  {/if}
  <main>
    {@render children()}
  </main>

  <ErrorModal error={uiState.globalError} onClose={() => (uiState.globalError = undefined)} />
  {#if uiState.loadingModal}
    <LoadingModal {...uiState.loadingModal} />
  {/if}
  <GuideModal />
  <PdfPreviewModal />
</div>

<style>
  :global(body) {
    margin: 0;
  }

  #app {
    width: 100%;
    min-height: 100vh;
  }

  .container {
    padding: 4rem 2rem 0;
  }

  main {
    padding: 0 2rem 2rem;
  }
</style>
