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
  #app {
    width: 100vw;
    min-height: 100vh;
  }

  .container {
    padding-top: 4rem;
    padding-left: 1rem;
    padding-right: 1rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  main {
    padding: 0 1rem;
  }
</style>
