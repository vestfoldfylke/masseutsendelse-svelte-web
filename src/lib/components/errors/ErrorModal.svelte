<script lang="ts">
  import ErrorField from "./ErrorField.svelte";

  type ErrorLike = Error & {
    statusCode?: number;
    status?: number;
    errors?: string[];
    response?: {
      data?: {
        title?: string;
        message?: string;
        errors?: string | string[];
        stack?: string;
      };
    };
  };

  type Props = {
    error: ErrorLike | undefined;
    showOkButton?: boolean;
    showResetButton?: boolean;
    onClose?: () => void;
  };

  let { error, showOkButton = true, showResetButton = false, onClose }: Props = $props();

  let dialogElement: HTMLDialogElement | undefined = $state();

  $effect(() => {
    if (!dialogElement) {
      return;
    }

    if (error) {
      dialogElement.showModal();
      return;
    }

    dialogElement.close();
  });

  const close = (): void => {
    onClose?.();
  };
</script>

<dialog
  bind:this={dialogElement}
  class="ds-dialog"
  data-placement="center"
  onclose={close}
  onclick={(event) => {
    if (event.target === dialogElement) {
      close();
    }
  }}
>
  {#if error}
    Viser error: {error.message}
    <ErrorField {error} {showResetButton} {showOkButton} onOk={close} />
  {/if}
</dialog>
