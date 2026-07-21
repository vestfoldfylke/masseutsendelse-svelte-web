<script lang="ts">
  type SpinnerSize = "2xs" | "xs" | "sm" | "md" | "lg" | "xl";

  type Props = {
    title?: string;
    message?: string;
    submessage?: string;
    subsubmessage?: string;
    spinnerSize?: SpinnerSize;
  };

  let { title, message, submessage, subsubmessage, spinnerSize = "lg" }: Props = $props();
</script>

<div class="spinner-container">
  {#if title}<h2>{title}</h2>{/if}
  {#if message}<p>{message}</p>{/if}
  {#if submessage}<p>{submessage}</p>{/if}
  {#if subsubmessage}<p>{subsubmessage}</p>{/if}
  <svg class="ds-spinner" data-size={spinnerSize} role="img" aria-label="Laster" viewBox="0 0 50 50">
    <circle class="ds-spinner__background" cx="25" cy="25" r="20" fill="none" stroke-width="5" />
    <circle class="ds-spinner__circle" cx="25" cy="25" r="20" fill="none" stroke-width="5" />
  </svg>
</div>

<style>
  .spinner-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    gap: 0.25rem;
  }

  .spinner-container h2 {
    margin-bottom: 0.5rem;
  }

  .spinner-container p {
    margin-top: 0;
  }
</style>
