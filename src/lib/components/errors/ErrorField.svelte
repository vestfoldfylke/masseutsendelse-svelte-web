<script lang="ts">
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
    error: ErrorLike;
    defaultTitle?: string;
    showResetButton?: boolean;
    showOkButton?: boolean;
    onReset?: () => void;
    onOk?: () => void;
  };

  let { error, defaultTitle = "En feil har oppstått", showResetButton = true, showOkButton = false, onReset, onOk }: Props = $props();

  const statusCode = $derived(error.statusCode ?? error.status ?? "");
  const title = $derived(error.response?.data?.title ?? "");
  const message = $derived(error.response?.data?.message ?? error.message ?? "");
  const errorList = $derived.by(() => {
    const responseErrors = error.response?.data?.errors;
    if (responseErrors) {
      return Array.isArray(responseErrors) ? responseErrors : [responseErrors];
    }
    return error.errors ?? [];
  });
  const stack = $derived(error.response?.data?.stack ?? error.stack ?? "");
</script>

<div class="error-card">
  <h1 class="ds-heading" data-size="lg">
    {#if statusCode}<span>{statusCode} - </span>{/if}{title || defaultTitle}
  </h1>
  {#if message}
    <h3 class="ds-heading" data-size="xs">{message}</h3>
  {/if}
  {#if errorList.length > 0}
    <ul>
      {#each errorList as errorMessage}
        <li>{errorMessage}</li>
      {/each}
    </ul>
  {/if}
  {#if stack}
    <div class="stack-field">
      <h3 class="ds-heading" data-size="xs">Detaljer</h3>
      <p class="ds-paragraph">{stack}</p>
    </div>
  {/if}
  <div class="actions">
    {#if showResetButton}
      <button type="button" class="ds-button" data-size="sm" onclick={() => onReset?.()}>Start på nytt</button>
    {/if}
    {#if showOkButton}
      <button type="button" class="ds-button" data-size="sm" onclick={() => onOk?.()}>Ok</button>
    {/if}
  </div>
</div>

<style>
  .error-card {
    height: 100%;
    border-radius: 10px;
    padding: 1rem;
    background-color: #f8d3d1;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .stack-field {
    margin-top: 0.75rem;
    padding: 0.75rem;
    border-radius: 10px;
    max-height: 400px;
    overflow-y: auto;
    background-color: #ffe8e7;
    white-space: pre-wrap;
  }

  .actions {
    display: flex;
    justify-content: flex-start;
    gap: 1rem;
    margin-top: 1rem;
  }
</style>
