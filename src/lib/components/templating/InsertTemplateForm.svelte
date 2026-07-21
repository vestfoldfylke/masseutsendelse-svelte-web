<script lang="ts">
  import { AppError } from "$lib/errors/AppError";
  import ErrorField from "../errors/ErrorField.svelte";

  type PlaceholderType = "string" | "multistring";

  type Placeholder = {
    label: string;
    description: string;
    type: "string";
    required: boolean;
    lines?: number;
    path: string;
  };

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
    onInsert?: (placeholder: Placeholder) => void;
    onClose?: () => void;
  };

  let { onInsert, onClose }: Props = $props();

  const TYPES: Array<{ text: string; value: PlaceholderType }> = [
    { text: "En enkelt linje med tekst", value: "string" },
    { text: "Tekst med flere linjer", value: "multistring" }
  ];

  let error: ErrorLike | undefined = $state(undefined);
  let label = $state<string>("");
  let description = $state<string>("");
  let type = $state<PlaceholderType>("string");
  let lines = $state<number | undefined>(undefined);

  const insert = (): void => {
    try {
      if (!label) {
        throw new AppError("Navn mangler", "Kan ikke sette inn felt uten navn");
      }
      if (!description) {
        throw new AppError("Beskrivelse mangler", "Kan ikke sette inn felt uten beskrivelse");
      }
    } catch (err) {
      error = err as ErrorLike;
      return;
    }

    const placeholder: Placeholder = {
      label,
      description,
      type: "string",
      required: true,
      path: label.toLowerCase()
    };
    if (type === "multistring") {
      placeholder.lines = lines && !Number.isNaN(lines) ? lines : 5;
    }

    onInsert?.(placeholder);
    onClose?.();
  };
</script>

<div class="form-card">
  <h2 class="ds-heading" data-size="sm">Legg till flettefelt</h2>
  <p class="ds-paragraph">Her kan du legge til ett felt som må fylles ut for å benytte malen</p>
  {#if error}
    <ErrorField {error} showResetButton={false} />
  {/if}
  <div class="ds-field">
    <label class="ds-label" for="placeholder-label"><span class="required">* </span>Navn</label>
    <input id="placeholder-label" class="ds-input" bind:value={label} />
    <div class="ds-paragraph" data-size="xs">Navn på feltet</div>
  </div>
  <div class="ds-field">
    <label class="ds-label" for="placeholder-description"><span class="required">* </span>Beskrivelse</label>
    <input id="placeholder-description" class="ds-input" bind:value={description} />
    <div class="ds-paragraph" data-size="xs">Beskrivelse av hva man skal fylle inn</div>
  </div>
  <div class="ds-field">
    <label class="ds-label" for="placeholder-type"><span class="required">* </span>Type</label>
    <select id="placeholder-type" class="ds-input" bind:value={type}>
      {#each TYPES as option (option.value)}
        <option value={option.value}>{option.text}</option>
      {/each}
    </select>
    <div class="ds-paragraph" data-size="xs">Hvordan type felt skal dette være?</div>
  </div>
  {#if type === "multistring"}
    <div class="ds-field">
      <label class="ds-label" for="placeholder-lines">Antall linjer</label>
      <input id="placeholder-lines" type="number" class="ds-input" bind:value={lines} />
      <div class="ds-paragraph" data-size="xs">Hvor mange linjer med tekst ønsker du?</div>
    </div>
  {/if}
  <div class="actions">
    <button type="button" class="ds-button" data-size="sm" onclick={insert}>Legg til</button>
    <button type="button" class="ds-button" data-size="sm" data-variant="secondary" onclick={() => onClose?.()}>Lukk</button>
  </div>
</div>

<style>
  .form-card {
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .required {
    color: red;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
  }
</style>
