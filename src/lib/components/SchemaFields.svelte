<script lang="ts">
  import Sjablong from "@vtfk/sjablong";
  import { untrack } from "svelte";
  import { AppError } from "$lib/errors/AppError";
  import { deepMerge, getPath, setPath, unsetPath } from "$lib/objectUtils";
  import ErrorField from "./errors/ErrorField.svelte";

  type FlattenedSchemaProperty = {
    path: string;
    type: string;
    label?: string;
    description?: string;
    lines?: number;
    required?: boolean;
    disabled?: boolean;
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
    value?: Record<string, unknown>;
    schema: object;
    disabled?: boolean;
    onError?: (error: ErrorLike) => void;
  };

  let { value = $bindable({}), schema, disabled = false, onError }: Props = $props();

  let error: ErrorLike | undefined = $state(undefined);
  let schemaProperties: FlattenedSchemaProperty[] = $state([]);

  const setError = (err: ErrorLike): void => {
    error = err;
    onError?.(err);
  };

  const setSchema = (): void => {
    try {
      error = undefined;

      if (!schema) {
        throw new AppError("Skjema mangler", "Skjemakomponenten har ikke mottatt noe skjema");
      }
      if (Array.isArray(schema)) {
        throw new AppError("Feil skjema type", "Skjemaet er av typen array, det må være ett vanlig objekt");
      }
      if (typeof schema !== "object") {
        throw new AppError("Feil skjema type", `Skjemaet skal være av type object eller array, men er av type ${typeof schema}`);
      }

      const defaultData = Sjablong.createObjectFromSchema(schema) as Record<string, unknown>;
      value = deepMerge(value, defaultData) ?? {};

      const flattenedSchema = Sjablong.flattenSchema(schema) as FlattenedSchemaProperty[];
      if (!flattenedSchema || flattenedSchema.length <= 0) {
        throw new AppError("Skjemaet er tomt", "Skjema er mottatt, men vi finner ingen felter");
      }

      schemaProperties = flattenedSchema;
    } catch (err) {
      setError(err as ErrorLike);
    }
  };

  const updateData = (path: string, newValue: string): void => {
    if (!path) {
      return;
    }

    const next = { ...value };
    if (newValue === "") {
      unsetPath(next, path);
    } else {
      setPath(next, path, newValue);
    }
    value = next;
  };

  const getInitialData = (path: string): string => (getPath(value, path) as string) || "";

  const determinePropertyLabel = (property: FlattenedSchemaProperty): string => property.label || property.path || "Ukjent...";

  // Only re-run when `schema` itself changes (mirrors the original's Vue `watch: { schema }`) - reading/writing
  // `value` inside setSchema() must stay untracked here, or every keystroke would re-trigger a schema re-flatten.
  $effect(() => {
    schema;
    untrack(() => setSchema());
  });
</script>

{#if error}
  <ErrorField {error} showResetButton={false} />
{:else}
  <div class="schema-fields">
    {#each schemaProperties as property, i (property.path ?? i)}
      {#if property.type === "string" && property.lines === undefined}
        <div class="ds-field">
          <label class="ds-label" for={`schema-field-${i}`}>
            {#if property.required}<span class="required"><strong>* </strong></span>{/if}{determinePropertyLabel(property)}
          </label>
          <input
            id={`schema-field-${i}`}
            class="ds-input"
            value={getInitialData(property.path)}
            placeholder={property.description}
            oninput={(event) => updateData(property.path, event.currentTarget.value)}
            required={property.required}
            disabled={disabled || property.disabled}
          />
          {#if property.description}
            <div class="ds-paragraph" data-size="xs">{property.description}</div>
          {/if}
        </div>
      {:else if property.type === "string" && property.lines}
        <div class="ds-field">
          <label class="ds-label" for={`schema-field-${i}`}>
            {#if property.required}<span class="required"><strong>* </strong></span>{/if}{determinePropertyLabel(property)}
          </label>
          <textarea
            id={`schema-field-${i}`}
            class="ds-input"
            rows={property.lines}
            oninput={(event) => updateData(property.path, event.currentTarget.value)}
            required={property.required}
            disabled={disabled || property.disabled}
          >{getInitialData(property.path)}</textarea>
          {#if property.description}
            <div class="ds-paragraph" data-size="xs">{property.description}</div>
          {/if}
        </div>
      {/if}
    {/each}
  </div>
{/if}

<style>
  .schema-fields {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .required {
    color: red;
  }
</style>
