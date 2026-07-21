<script lang="ts">
  import { uiState } from "$lib/state/uiState.svelte";

  let dialogElement: HTMLDialogElement | undefined = $state();

  $effect(() => {
    if (!dialogElement) {
      return;
    }
    if (uiState.previewPdfBase64 !== undefined) {
      dialogElement.showModal();
    } else {
      dialogElement.close();
    }
  });

  const close = (): void => {
    uiState.previewPdfBase64 = undefined;
  };
</script>

<dialog bind:this={dialogElement} class="ds-dialog" data-placement="center" onclose={close} onclick={(event) => event.target === dialogElement && close()}>
  <div class="preview-header">
    <h2 class="ds-heading" data-size="md">Forhåndsvisning</h2>
    <button type="button" class="ds-button" data-variant="tertiary" onclick={close}>Lukk</button>
  </div>
  {#if uiState.previewPdfBase64}
    <iframe title="PDF forhåndsvisning" src={`data:application/pdf;base64,${uiState.previewPdfBase64}`} class="pdf-frame"></iframe>
  {/if}
</dialog>

<style>
  .preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .pdf-frame {
    width: 80vw;
    height: 80vh;
    border: none;
  }
</style>
