<script lang="ts">
  import Loading from "../Loading.svelte";

  type Props = {
    title?: string;
    message?: string;
    submessage?: string;
    subsubmessage?: string;
  };

  let { title, message, submessage, subsubmessage }: Props = $props();

  let dialogElement: HTMLDialogElement | undefined = $state();

  $effect(() => {
    dialogElement?.showModal();
  });
</script>

<dialog bind:this={dialogElement} class="ds-dialog" data-placement="center" oncancel={(event) => event.preventDefault()}>
  <Loading {title} {message} {submessage} {subsubmessage} />
</dialog>
